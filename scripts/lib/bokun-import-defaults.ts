/**
 * Locked default values used to fill Bokun-required fields the CMS doesn't have.
 * Single source of truth — every default here also appears in the generated
 * review-report.md so the operator can verify them in Bokun extranet post-import.
 *
 * See: plans/260515-2013-bokun-import-spreadsheet-generation/phase-01-field-mapping-and-defaults.md
 */

export const BOKUN_DEFAULTS = {
  // Product-level enums — values are from Bokun's import-validation error
  // response (2026-05-16). Bokun's docs page is JS-rendered so we couldn't
  // fetch them ahead of time; first test-import revealed the allowed enums.
  experienceType: 'DAY_TOUR_OR_ACTIVITY', // [DAY_TOUR_OR_ACTIVITY, MULTI_DAY_TOUR, ATTRACTION, EVENT, TRANSPORT]
  bookingType: 'DATE_AND_TIME',
  capacityType: 'LIMITED', // [FREE_SALE, LIMITED, ON_REQUEST] — LIMITED matches our min/max group caps
  scheduleType: 'RECURRING', // [FIXED, RECURRING] — private tours run on flexible recurring schedule
  meetingType: 'MEET_ON_LOCATION',

  // Cutoff: customer can book up to 1 day before start.
  cutoffWeeks: 0,
  cutoffDays: 1,
  cutoffHours: 0,
  cutoffMinutes: 0,
  cutoffType: 'RELATIVE_TO_START_TIME', // [RELATIVE_TO_START_TIME, RELATIVE_TO_WORKING_HOURS_OPEN, RELATIVE_TO_WORKING_HOURS_CLOSE, RELATIVE_TO_ONE_SET_TIME]

  // Pickup/dropoff disabled for v1 (all tours meet on location).
  // Enum: [OPTIONAL, PRESELECTED, UNAVAILABLE] — UNAVAILABLE = no pickup/dropoff offered.
  pickupSelectionType: 'UNAVAILABLE',
  dropoffSelectionType: 'UNAVAILABLE',

  // Rates / pricing.
  // Cancellation policy: vendor-specific. Bokun rejected both "STANDARD" (code)
  // and "261112" (numeric ID). Trying the policy title verbatim — Bokun's
  // bulk-import may resolve by Title for vendor's own policies.
  cancellationPolicy: 'Non refundable',
  // Products."Default rate" must match Rates."Code" exactly (Bokun cross-refs
  // by Code, not Title). Both set to STANDARD.
  defaultRate: 'STANDARD',
  defaultPricingCategory: 'Per group',
  pricingCategoryTitle: 'Per group',
  ticketCategory: 'ADULT',

  // Location & locale. Bokun Location format: "<CC> <UN/Locode> <Name>"
  // (regex /(\p{Upper}{2}) (\p{Upper}{3})(.*)/). Per-city map below.
  timeZone: 'Europe/Stockholm',
  countryCode: 'SE',
  defaultCity: 'Stockholm',
  zoomLevel: 13,

  // Image URLs in CMS export are like `/api/media/file/foo.jpg`. Staging
  // CMS serves them (200 OK); production is on /coming-soon and returns 404.
  // Bokun fetches + caches at import time, so staging URL is sufficient.
  imageBaseUrl: 'https://staging.privatetours.se',

  // Bring-list / group-size fallbacks.
  fallbackMinGroupSize: 1,
  fallbackMaxGroupSize: 12,
} as const

/** CMS difficulty → Bokun activity-level enum (matches existing API mapper). */
export const DIFFICULTY_MAP: Record<string, string> = {
  easy: 'EASY',
  moderate: 'MODERATE',
  challenging: 'CHALLENGING',
}

/** Per-slug city overrides for tours that meet outside Stockholm. */
export const CITY_OVERRIDES: Record<string, string> = {
  'private-uppsala-day-tour-from-stockholm': 'Uppsala',
  'private-sigtuna-heritage-tour-from-stockholm': 'Sigtuna',
}

/** UN/Locode (3-letter city code) per city — used in Location string + Meeting points. */
export const CITY_UN_LOCODE: Record<string, string> = {
  Stockholm: 'STO',
  Uppsala: 'UPP', // Bokun rejected UPS; UPP is the correct UN/Locode
  Sigtuna: 'SIG',
}

/**
 * City-center fallback coordinates for tours without per-tour coords.
 * Bokun rejects blank lat/lng on Meeting points; operator drags the marker to
 * the exact location in Bokun extranet after import.
 */
export const CITY_FALLBACK_COORDS: Record<string, { lat: number; lng: number }> = {
  Stockholm: { lat: 59.3293, lng: 18.0686 }, // Sergels torg
  Uppsala: { lat: 59.8586, lng: 17.6389 }, // Uppsala center
  Sigtuna: { lat: 59.6164, lng: 17.7232 }, // Sigtuna center
}

/** Build Bokun-format Location string: "SE STO Stockholm". */
export function buildLocationString(city: string): string {
  const locode = CITY_UN_LOCODE[city] ?? 'STO'
  return `${BOKUN_DEFAULTS.countryCode} ${locode} ${city}`
}

/**
 * CMS category slug → Bokun Categories enum (single primary category).
 * Bokun rejected our slug values; this map was derived from the enum list in
 * Bokun's import-validation error response (2026-05-16).
 * Tours with no exact mapping fall back to CULTURAL_AND_THEME_TOURS.
 */
export const CMS_CATEGORY_TO_BOKUN: Record<string, string> = {
  'walking-tour': 'WALKING_TOUR',
  'culture-local-life': 'CULTURAL_AND_THEME_TOURS',
  'boat-tour': 'SAILING_OR_BOAT_TOUR',
  'day-trip': 'DAY_TRIPS_AND_EXCURSIONS',
  'nature-water': 'WATER',
  'history-heritage': 'CULTURAL_AND_THEME_TOURS',
  architecture: 'ARTS_AND_CULTURE',
  'viking-medieval': 'CULTURAL_AND_THEME_TOURS',
  'chauffeured-tour': 'PRIVATE_CAR_TOUR',
  'family-friendly': 'SIGHTSEEING', // generic fallback when listed first
}

export const BOKUN_CATEGORY_FALLBACK = 'CULTURAL_AND_THEME_TOURS'

/** Slug → Product code sanity check. */
export const SLUG_REGEX = /^[a-z0-9-]+$/

/** Bokun multi-value cell separator (assumed; verify on test import). */
export const BOKUN_MULTI_VALUE_SEP = ','

/** Bokun newline-list separator for Included/Excluded/Requirements. */
export const BOKUN_LIST_LINE_SEP = '\n'
