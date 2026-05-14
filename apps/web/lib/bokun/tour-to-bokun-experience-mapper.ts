/**
 * Pure transform: Payload Tour document (depth=2, locale='all') → Bokun Experience create payload.
 *
 * Pure function — no I/O, no async, no globals. Heavily unit-tested.
 * Locale codes follow Bokun convention from Phase 01 findings (short codes: sv, en, de).
 * Pricing model: per_group → flat-rate (pricePerBooking=true), per_person/custom → per-person.
 *
 * @see plans/260514-1437-bokun-integration/phase-03-tour-to-experience-mapper.md
 */

import { lexicalToBokunHtml } from './lexical-to-bokun-html'
import { sanitizeHtml } from '../utils/sanitize-html'
import type {
  BokunExperienceActivityLevel,
  BokunExperienceCreatePayload,
  BokunExperienceLocale,
  BokunExperienceLocalizedString,
  BokunExperienceMeetingPoint,
  BokunExperiencePricingCategory,
  BokunExperienceRate,
} from './bokun-types'

// ─── CMS source types (duck-typed against Payload generated `Tour`) ───────────
//
// Payload's generated Tour type assumes a single active locale. When we fetch with
// `locale: 'all'`, every localized field returns as `Record<locale, value>` instead.
// We define a minimal shape that captures only the fields the mapper consumes,
// avoiding coupling to the full generated type and its single-locale assumption.

/** Localized field after `locale: 'all'` fetch — keys are CMS locale codes. */
type LocalizedString = Partial<Record<CmsLocale, string | null | undefined>>
type LocalizedItemArray = Partial<
  Record<CmsLocale, Array<{ item?: string | null }> | null | undefined>
>
type LocalizedHighlightArray = Partial<
  Record<CmsLocale, Array<{ highlight?: string | null }> | null | undefined>
>

/** CMS locale codes, matched by `payload.config.ts`. */
type CmsLocale = 'sv' | 'en' | 'de'
const CMS_LOCALES: readonly CmsLocale[] = ['sv', 'en', 'de'] as const

/** Subset of Tour we actually map. Other fields ignored in v1 (images, categories, etc.). */
export interface TourSource {
  title: LocalizedString
  description: Partial<Record<CmsLocale, unknown>>
  shortDescription: LocalizedString
  highlights?: LocalizedHighlightArray | null
  pricing: {
    basePrice: number
    currency?: 'SEK' | 'EUR' | 'USD' | null
    priceType: 'per_person' | 'per_group' | 'custom'
    childPrice?: number | null
  }
  duration: { hours: number }
  logistics: {
    meetingPointName: LocalizedString
    meetingPointAddress?: LocalizedString | null
    meetingPointInstructions?: LocalizedString | null
    coordinates?: [number, number] | null
  }
  included?: LocalizedItemArray | null
  notIncluded?: LocalizedItemArray | null
  whatToBring?: LocalizedItemArray | null
  difficultyLevel?: 'easy' | 'moderate' | 'challenging' | null
  accessibility?: { wheelchairAccessible?: boolean | null } | null
  minGroupSize?: number | null
  maxGroupSize?: number | null
}

// ─── Locale + localized-field helpers ─────────────────────────────────────────

/** Map CMS locale → Bokun locale. v1: identity (both use short ISO 639-1 codes). */
function mapCmsLocaleToBokun(cmsLocale: CmsLocale): BokunExperienceLocale {
  return cmsLocale
}

/**
 * Convert Payload's `{sv, en, de}` localized object into Bokun's localized array.
 * Skips locales whose value is empty/null. Ordering is stable (sv → en → de).
 */
export function localizedField(
  value: LocalizedString | null | undefined,
  transform?: (raw: string) => string
): BokunExperienceLocalizedString[] {
  if (!value) return []
  const out: BokunExperienceLocalizedString[] = []
  for (const cmsLocale of CMS_LOCALES) {
    const raw = value[cmsLocale]
    if (!raw) continue
    const finalValue = transform ? transform(raw) : raw
    if (!finalValue) continue
    out.push({ locale: mapCmsLocaleToBokun(cmsLocale), value: finalValue })
  }
  return out
}

/**
 * Convert a localized array-of-objects (e.g. highlights, included) into a Bokun
 * localized array of joined strings — one entry per locale, items separated by ' • '.
 * Bokun's localized fields are scalar strings; lists are joined for compactness.
 */
export function localizedFieldArray<T>(
  value: Partial<Record<CmsLocale, Array<T> | null | undefined>> | null | undefined,
  itemAccessor: (item: T) => string | null | undefined,
  separator = ' • '
): BokunExperienceLocalizedString[] {
  if (!value) return []
  const out: BokunExperienceLocalizedString[] = []
  for (const cmsLocale of CMS_LOCALES) {
    const arr = value[cmsLocale]
    if (!arr || arr.length === 0) continue
    const items = arr
      .map(itemAccessor)
      .filter((s): s is string => Boolean(s && s.trim().length > 0))
    if (items.length === 0) continue
    out.push({
      locale: mapCmsLocaleToBokun(cmsLocale),
      value: items.join(separator),
    })
  }
  return out
}

// ─── Duration helper ──────────────────────────────────────────────────────────

/**
 * Convert decimal hours to ISO 8601 duration string.
 *  1.5 → "PT1H30M"
 *  3   → "PT3H"
 *  0.5 → "PT30M"
 */
export function hoursToISO8601(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return 'PT0M'
  const totalMinutes = Math.round(hours * 60)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes - h * 60
  if (h > 0 && m > 0) return `PT${h}H${m}M`
  if (h > 0) return `PT${h}H`
  return `PT${m}M`
}

// ─── Pricing helper ───────────────────────────────────────────────────────────

const DEFAULT_CURRENCY: 'SEK' = 'SEK'

/**
 * Map CMS pricing block → Bokun rate plan(s).
 *  - per_person  → 1 rate "Standard", pricePerBooking=false, Adult (+ Child if set)
 *  - per_group   → 1 rate "Standard", pricePerBooking=true,  single "Per group" category
 *  - custom      → fallback identical to per_person Adult-only (manual edit in Bokun afterwards)
 *
 * Monetary values are emitted as 2-decimal strings (Bokun never accepts floats).
 */
export function mapPricingToBokunRates(
  pricing: TourSource['pricing']
): BokunExperienceRate[] {
  const currency: 'SEK' | 'EUR' | 'USD' = pricing.currency ?? DEFAULT_CURRENCY
  // Reject NaN/Infinity/negative — those would round-trip to "NaN"/"Infinity"/"-100.00"
  // strings that Bokun rejects, marking the tour failed forever. Coerce to 0 instead;
  // editors will see a 4xx response from Bokun and correct the price upstream.
  const formatPrice = (n: number): string => {
    if (!Number.isFinite(n) || n < 0) return '0.00'
    return n.toFixed(2)
  }

  if (pricing.priceType === 'per_group') {
    const category: BokunExperiencePricingCategory = {
      title: 'Per group',
      flatPrice: formatPrice(pricing.basePrice),
    }
    return [
      {
        title: 'Standard',
        currency,
        pricePerBooking: true,
        pricingCategories: [category],
      },
    ]
  }

  // per_person OR custom (fallback)
  const categories: BokunExperiencePricingCategory[] = [
    {
      title: 'Adult',
      pricePerCategoryUnit: formatPrice(pricing.basePrice),
      minAge: 13,
    },
  ]
  if (pricing.priceType === 'per_person' && typeof pricing.childPrice === 'number') {
    categories.push({
      title: 'Child',
      pricePerCategoryUnit: formatPrice(pricing.childPrice),
      minAge: 0,
      maxAge: 12,
    })
  }

  return [
    {
      title: 'Standard',
      currency,
      pricePerBooking: false,
      pricingCategories: categories,
    },
  ]
}

// ─── Meeting point helper ─────────────────────────────────────────────────────

/**
 * CMS coordinates are `[lng, lat]` (GeoJSON / Payload `point` field convention).
 * Bokun expects `{ latitude, longitude }` as decimal degrees. Swap order safely.
 */
export function mapLogisticsToBokunMeetingPoint(
  logistics: TourSource['logistics']
): BokunExperienceMeetingPoint {
  const meetingPoint: BokunExperienceMeetingPoint = {
    title: localizedField(logistics.meetingPointName),
  }

  const address = localizedField(logistics.meetingPointAddress ?? undefined)
  if (address.length > 0) meetingPoint.address = address

  const instructions = localizedField(logistics.meetingPointInstructions ?? undefined)
  if (instructions.length > 0) meetingPoint.instructions = instructions

  if (logistics.coordinates && logistics.coordinates.length === 2) {
    const [lng, lat] = logistics.coordinates
    // Validate WGS84 ranges — out-of-range values would 4xx Bokun on every sync.
    if (
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      Math.abs(lat) <= 90 &&
      Math.abs(lng) <= 180
    ) {
      meetingPoint.latitude = lat
      meetingPoint.longitude = lng
    }
  }

  return meetingPoint
}

// ─── Difficulty + accessibility ───────────────────────────────────────────────

const DIFFICULTY_MAP: Record<
  NonNullable<TourSource['difficultyLevel']>,
  BokunExperienceActivityLevel
> = {
  easy: 'EASY',
  moderate: 'MODERATE',
  challenging: 'CHALLENGING',
}

export function mapDifficultyLevel(
  level: TourSource['difficultyLevel']
): BokunExperienceActivityLevel | undefined {
  if (!level) return undefined
  return DIFFICULTY_MAP[level]
}

// ─── Description (Lexical → sanitized HTML, per locale) ───────────────────────

/**
 * Convert Payload's `{sv: lexicalDoc, en: lexicalDoc, ...}` description field
 * into a Bokun localized array of sanitized HTML strings.
 *
 * Reuses the existing `lexicalToHtml` from tour-payload-mapper and the project's
 * sanitizeHtml allowlist — XSS safe. Empty/missing locales are skipped.
 */
export function mapDescriptionToBokun(
  description: TourSource['description'] | null | undefined
): BokunExperienceLocalizedString[] {
  if (!description) return []
  const localized: LocalizedString = {}
  for (const cmsLocale of CMS_LOCALES) {
    const lex = description[cmsLocale]
    if (!lex) continue
    // lexicalToBokunHtml escapes text nodes (preserving "&", "<", ">" in user content);
    // sanitizeHtml is then a defense-in-depth pass against malformed editor output.
    const html = sanitizeHtml(lexicalToBokunHtml(lex))
    if (html) localized[cmsLocale] = html
  }
  return localizedField(localized)
}

// ─── Top-level mapper ─────────────────────────────────────────────────────────

const FALLBACK_MIN_PARTICIPANTS = 1
const FALLBACK_MAX_PARTICIPANTS = 12

/**
 * Convert a Payload Tour document (with `locale: 'all'`) into a Bokun
 * Experience create payload. Pure: no I/O, deterministic.
 *
 * @param tour - Payload Tour fetched with depth=2 and locale='all'
 * @returns Typed Bokun create payload ready for `getBokunClient().createExperience()`
 */
export function tourToBokunExperiencePayload(
  tour: TourSource
): BokunExperienceCreatePayload {
  const payload: BokunExperienceCreatePayload = {
    title: localizedField(tour.title),
    description: mapDescriptionToBokun(tour.description),
    summary: localizedField(tour.shortDescription),
    durationISO: hoursToISO8601(tour.duration.hours),
    minParticipants: tour.minGroupSize ?? FALLBACK_MIN_PARTICIPANTS,
    maxParticipants: tour.maxGroupSize ?? FALLBACK_MAX_PARTICIPANTS,
    rates: mapPricingToBokunRates(tour.pricing),
    meetingPoint: mapLogisticsToBokunMeetingPoint(tour.logistics),
  }

  const highlights = localizedFieldArray(
    tour.highlights ?? undefined,
    (h) => h.highlight ?? null
  )
  if (highlights.length > 0) payload.highlights = highlights

  const inclusions = localizedFieldArray(tour.included ?? undefined, (i) => i.item ?? null)
  if (inclusions.length > 0) payload.inclusions = inclusions

  const exclusions = localizedFieldArray(
    tour.notIncluded ?? undefined,
    (i) => i.item ?? null
  )
  if (exclusions.length > 0) payload.exclusions = exclusions

  const bringList = localizedFieldArray(
    tour.whatToBring ?? undefined,
    (i) => i.item ?? null
  )
  if (bringList.length > 0) payload.bringList = bringList

  const activityLevel = mapDifficultyLevel(tour.difficultyLevel)
  if (activityLevel) payload.activityLevel = activityLevel

  const wheelchair = tour.accessibility?.wheelchairAccessible
  if (typeof wheelchair === 'boolean') payload.wheelchairAccessible = wheelchair

  return payload
}
