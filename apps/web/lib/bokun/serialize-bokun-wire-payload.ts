/**
 * Transform our internal localized-array payload into Bokun's actual
 * `ExperienceComponentsDto` wire shape (per https://api-docs.bokun.dev/rest-v2.yaml).
 *
 * Bokun's schema is fundamentally different from what the mapper emits:
 *  - `title`, `shortDescription`, `description` are PLAIN STRINGS — not localized
 *    arrays. The 2026-05-15 sync was 400'ing with a Jackson MismatchedInputException
 *    because we were sending arrays where Bokun expects strings.
 *  - Translations are managed via separate language flows on Bokun's side
 *    (`languageTag` query param on reads). v1 picks ONE primary locale to send.
 *  - Field names differ: `summary` → `shortDescription`; `inclusions`/`exclusions`/
 *    `bringList` arrays become `included`/`excluded`/`requirements` HTML strings.
 *  - Fields with no simple Bokun equivalent (highlights, durationISO, rates,
 *    meetingPoint, activityLevel, wheelchairAccessible) are intentionally
 *    OMITTED for v1. Update is partial — omission means "leave unchanged".
 *    These will be wired in follow-up phases once we have proper DTO mappers
 *    for DurationDto / ExperiencePricingDto / GooglePlaceDto.
 */

import type {
  BokunExperienceCreatePayload,
  BokunExperienceLocale,
  BokunExperienceLocalizedString,
  BokunExperienceUpdatePayload,
  BokunExtraComponentDto,
  BokunExtraInput,
} from './bokun-types'

/**
 * Locale to send to Bokun when our payload has multiple translations.
 * Configurable via env so different deployments (e.g. SE-first vs DE-first)
 * can switch without a code change. Defaults to English as the safest fallback.
 */
const FALLBACK_LOCALE_ORDER: readonly BokunExperienceLocale[] = ['en', 'sv', 'de']

function resolvePrimaryLocale(): BokunExperienceLocale {
  const raw = process.env.BOKUN_SYNC_LOCALE?.toLowerCase()
  if (raw === 'sv' || raw === 'en' || raw === 'de') return raw
  return 'en'
}

/**
 * Pick the best available value from a localized array.
 * Tries the configured primary locale first, then falls back through `en → sv → de`
 * so a tour with only-Swedish content still syncs SOMETHING rather than nothing.
 */
export function pickPrimaryLocaleValue(
  arr: BokunExperienceLocalizedString[] | undefined
): string | undefined {
  if (!arr || arr.length === 0) return undefined
  const primary = resolvePrimaryLocale()
  const order: BokunExperienceLocale[] = [
    primary,
    ...FALLBACK_LOCALE_ORDER.filter((l) => l !== primary),
  ]
  for (const locale of order) {
    const entry = arr.find((e) => e.locale === locale && e.value && e.value.trim())
    if (entry) return entry.value
  }
  return undefined
}

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch])
}

/**
 * Convert a localized bulleted list (mapper-joined with ' • ') back into HTML
 * `<ul><li>…</li></ul>` for Bokun's HTML-format fields (included/excluded/requirements).
 * Items are escaped — they originate from CMS plain-text input.
 */
export function localizedListToHtml(
  arr: BokunExperienceLocalizedString[] | undefined
): string | undefined {
  const joined = pickPrimaryLocaleValue(arr)
  if (!joined) return undefined
  const items = joined.split(' • ').filter((s) => s.trim().length > 0)
  if (items.length === 0) return undefined
  return `<ul>${items.map((i) => `<li>${escapeHtml(i.trim())}</li>`).join('')}</ul>`
}

/**
 * Bokun `ExperienceComponentsDto` wire shape — strictly the fields we currently
 * sync. All optional: Bokun treats absent fields as "leave unchanged" on PUT.
 *
 * `extras` — full-replacement semantics per Phase 01: omitted = no change;
 * present = the array becomes Bokun's complete extras list. Sending `extras: []`
 * deletes all extras (verified destructive probe). Pricing for extras is NOT in
 * this payload — Bokun's REST v2.0 does not expose pricing writes.
 */
export interface BokunExperienceWirePayload {
  title?: string
  shortDescription?: string
  description?: string
  included?: string
  excluded?: string
  requirements?: string
  extras?: BokunExtraComponentDto[]
}

/**
 * Bokun rejects ExtraDto without maxPerBooking ("extras[N]::maxPerBooking absent",
 * HTTP 400 — Phase 01 verified). CMS doesn't model this today; use a permissive
 * default so syncs don't fail. Operators who need a tighter cap configure it in
 * the Bokun dashboard (manual; not yet round-tripped).
 */
const DEFAULT_MAX_PER_BOOKING = 99

/**
 * Serialize internal extras into Bokun's ExtraDto wire shape.
 *
 * Three-state return contract — the caller distinguishes between "absent"
 * (preserve Bokun state) and "explicit empty" (delete all Bokun-side extras):
 *  - `undefined` input → `undefined` output (caller omits the `extras` key)
 *  - `[]`        input → `[]`        output (caller emits `extras: []` to wipe)
 *  - `[rows]`    input → mapped DTOs (may still be `[]` if every row was
 *    filtered for empty title — caller treats that as the wipe signal too)
 *
 * Per-row rules:
 *  - Skip rows with no usable title in any locale (would 400 on Bokun side).
 *  - Pick the primary-locale title/description via the existing picker.
 *  - Emit `id` (numeric) when the CMS row has an existing `bokunExtraId`; omit on CREATE.
 *  - Always emit `externalId` so the PUT response correlates back to CMS rows.
 *  - Hardcode `type: 'OTHERS'` + `limitByPax: false` — v1 doesn't model these.
 */
export function serializeBokunExtras(
  extras: BokunExtraInput[] | undefined
): BokunExtraComponentDto[] | undefined {
  if (extras === undefined) return undefined
  // Empty input → preserve "delete all" intent. The caller (sync-job) sets
  // `payload.extras = []` only when the per-tour gate is active, so this
  // path is gated upstream and cannot fire on a non-baselined tour.
  if (extras.length === 0) return []
  const out: BokunExtraComponentDto[] = []
  for (const extra of extras) {
    const title = pickPrimaryLocaleValue(extra.title)
    if (!title || !title.trim()) continue
    const dto: BokunExtraComponentDto = {
      externalId: extra.externalId,
      title,
      type: 'OTHERS',
      maxPerBooking: extra.maxPerBooking ?? DEFAULT_MAX_PER_BOOKING,
      limitByPax: false,
    }
    const existing = String(extra.existingBokunExtraId ?? '').trim()
    if (existing) {
      const numericId = Number(existing)
      if (Number.isFinite(numericId)) dto.id = numericId
    }
    const description = pickPrimaryLocaleValue(extra.description)
    if (description) dto.description = description
    out.push(dto)
  }
  return out
}

/**
 * Serialize our internal payload to the wire shape Bokun's REST API expects.
 *
 * Empty/missing fields are dropped so the request body is as small as possible
 * (helpful both for log noise and for ExperienceComponentsDto's "absent = no
 * change" semantic on update).
 */
export function serializeBokunExperiencePayload(
  payload: BokunExperienceCreatePayload | BokunExperienceUpdatePayload
): BokunExperienceWirePayload {
  const out: BokunExperienceWirePayload = {}

  const title = pickPrimaryLocaleValue(payload.title)
  if (title) out.title = title

  const shortDescription = pickPrimaryLocaleValue(payload.summary)
  if (shortDescription) out.shortDescription = shortDescription

  const description = pickPrimaryLocaleValue(payload.description)
  if (description) out.description = description

  const included = localizedListToHtml(payload.inclusions)
  if (included) out.included = included

  const excluded = localizedListToHtml(payload.exclusions)
  if (excluded) out.excluded = excluded

  const requirements = localizedListToHtml(payload.bringList)
  if (requirements) out.requirements = requirements

  const extras = serializeBokunExtras(payload.extras)
  // Distinguish "absent" (preserve Bokun state) from "explicit empty" (delete all)
  // — empty array is falsy via .length but truthy here, so explicit `!== undefined`.
  if (extras !== undefined) out.extras = extras

  return out
}
