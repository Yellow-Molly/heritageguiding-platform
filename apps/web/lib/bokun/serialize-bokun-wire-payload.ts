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
 */
export interface BokunExperienceWirePayload {
  title?: string
  shortDescription?: string
  description?: string
  included?: string
  excluded?: string
  requirements?: string
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

  return out
}
