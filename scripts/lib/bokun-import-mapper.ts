/**
 * Pure transform: CMS TourRow → Bokun import row bundle (Products + Pricing
 * categories + Rates + Photos + Meeting points).
 *
 * Pure function: no I/O, no async, deterministic. Consumes defaults from
 * bokun-import-defaults.ts. See phase-01 for the exhaustive col-by-col mapping.
 */

import {
  BOKUN_DEFAULTS,
  BOKUN_MULTI_VALUE_SEP,
  BOKUN_LIST_LINE_SEP,
  DIFFICULTY_MAP,
  CITY_OVERRIDES,
  CITY_UN_LOCODE,
  CITY_FALLBACK_COORDS,
  CMS_CATEGORY_TO_BOKUN,
  BOKUN_CATEGORY_FALLBACK,
  buildLocationString,
} from './bokun-import-defaults'
import type { TourRow } from './bokun-import-reader'

// ─── Output row types — keys map 1:1 to per-sheet column order constants in writer ─

export interface BokunProductRow {
  id: string
  productCode: string
  title: string
  experienceType: string
  bookingType: string
  capacityType: string
  scheduleType: string
  passExpiryType: string
  passCapacity: string
  fixedPassExpiryDate: string
  passValidForDays: string
  meetingType: string
  categories: string
  attributes: string
  accessibilityTypes: string
  guidances: string
  difficultyLevel: string
  minimumAge: number | string
  durationWeeks: number
  durationDays: number
  durationHours: number
  durationMinutes: number
  cutoffWeeks: number
  cutoffDays: number
  cutoffHours: number
  cutoffMinutes: number
  cutoffType: string
  cutoffReferenceHour: string
  cutoffReferenceMinute: string
  excerpt: string
  description: string
  keywords: string
  flags: string
  included: string
  excluded: string
  inclusions: string
  exclusions: string
  knowBeforeYouGo: string
  requirements: string
  attention: string
  ticketPerPerson: boolean
  privateExperience: boolean
  requestDeadlineWeeks: string
  requestDeadlineDays: string
  requestDeadlineHours: string
  requestDeadlineMinutes: string
  allowCustomBookings: boolean
  customPickupAllowed: boolean
  pickupMinutesBefore: string
  dropoffService: string
  customDropoffAllowed: boolean
  location: string
  defaultRate: string
  defaultPricingCategory: string
  timeZone: string
}

export interface BokunPricingCategoryRow {
  productId: string
  productCode: string
  title: string
  ticketCategory: string
}

export interface BokunRateRow {
  productId: string
  productCode: string
  code: string
  title: string
  description: string
  minPerBooking: number
  maxPerBooking: number
  pricedPerPerson: boolean
  pickupSelectionType: string
  pickupPricingType: string
  pickupPricedPerPerson: boolean
  dropoffSelectionType: string
  dropoffPricingType: string
  dropoffPricedPerPerson: boolean
  cancellationPolicy: string
}

export interface BokunPhotoRow {
  productId: string
  productCode: string
  photoCode: string
  photoUrl: string
  photoDescription: string
}

export interface BokunMeetingPointRow {
  productId: string
  productCode: string
  title: string
  addressLine1: string
  addressLine2: string
  addressLine3: string
  city: string
  countryCode: string
  state: string
  postalCode: string
  latitude: number | string
  longitude: number | string
  zoomLevel: number | string
  unLocodeCountry: string
  unLocodeCity: string
}

export interface BokunRowBundle {
  product: BokunProductRow
  pricingCategory: BokunPricingCategoryRow
  rate: BokunRateRow
  photos: BokunPhotoRow[]
  meetingPoint: BokunMeetingPointRow
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function splitDurationHours(decimalHours: number): { hours: number; minutes: number } {
  if (!Number.isFinite(decimalHours) || decimalHours <= 0) return { hours: 0, minutes: 0 }
  const totalMinutes = Math.round(decimalHours * 60)
  return {
    hours: Math.floor(totalMinutes / 60),
    minutes: totalMinutes % 60,
  }
}

export function splitCoordinates(coordsStr: string): { lat: number; lng: number } | null {
  if (!coordsStr) return null
  const parts = coordsStr.split(',').map((s) => s.trim())
  if (parts.length !== 2) return null
  const lat = Number(parts[0])
  const lng = Number(parts[1])
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
  return { lat, lng }
}

/** Split CMS multi-value strings (separated by `;`). Trims and drops empties. */
export function splitList(s: string, sep: string = ';'): string[] {
  if (!s) return []
  return s
    .split(sep)
    .map((p) => p.trim())
    .filter(Boolean)
}

export function joinAsLines(items: string[]): string {
  return items.join(BOKUN_LIST_LINE_SEP)
}

/**
 * Concatenate the free-text meeting/parking/public-transport notes.
 * Note: Bokun's `KnowBeforeYouGo` column is actually an enum-tag list, not
 * free text. We put the free text in `Attention` (col 40) instead and emit
 * proper enum tags in KnowBeforeYouGo via mapKnowBeforeYouGoTags().
 */
export function buildMeetingNotesFreeText(tour: TourRow): string {
  return [tour.meetingInstructionsEn, tour.parkingInfoEn, tour.publicTransportEn]
    .map((s) => (s || '').trim())
    .filter(Boolean)
    .join('\n\n')
}

/**
 * Bokun Accessibility types col 15 enum: [LIMITED_MOBILITY, LIMITED_SIGHT, WHEELCHAIR, STROLLER_OR_PRAM].
 * Describes physical capabilities the tour accommodates.
 */
export function mapAccessibility(tour: TourRow): string {
  const flags: string[] = []
  if (tour.wheelchairAccessible) flags.push('WHEELCHAIR')
  if (tour.visualAssistance) flags.push('LIMITED_SIGHT')
  // No direct mapping for hearingAssistance / serviceAnimalsAllowed in this enum.
  return flags.join(BOKUN_MULTI_VALUE_SEP)
}

/**
 * Bokun KnowBeforeYouGo col 38 enum: [STROLLER_OR_PRAM_ACCESSIBLE, WHEELCHAIR_ACCESSIBLE,
 * LIMITED_MOBILITY_ACCESSIBLE, LIMITED_SIGHT_ACCESSIBLE, ANIMALS_OR_PETS_ALLOWED,
 * PUBLIC_TRANSPORTATION_NEARBY, INFANT_SEATS_AVAILABLE, INFANTS_MUST_SIT_ON_LAPS,
 * PASSPORT_REQUIRED, DRESS_CODE]. Tags that show on the booking page.
 */
export function mapKnowBeforeYouGoTags(tour: TourRow): string {
  const tags: string[] = []
  if (tour.wheelchairAccessible) tags.push('WHEELCHAIR_ACCESSIBLE')
  if (tour.visualAssistance) tags.push('LIMITED_SIGHT_ACCESSIBLE')
  if (tour.serviceAnimalsAllowed) tags.push('ANIMALS_OR_PETS_ALLOWED')
  if ((tour.publicTransportEn || '').trim()) tags.push('PUBLIC_TRANSPORTATION_NEARBY')
  return tags.join(BOKUN_MULTI_VALUE_SEP)
}

/**
 * Pick a single Bokun Category enum value from the first CMS category slug.
 * Bokun rejected comma-lists; sends a single primary. Unknown slugs fall back
 * to CULTURAL_AND_THEME_TOURS.
 */
export function mapPrimaryCategory(categoriesSlugs: string): string {
  const first = splitList(categoriesSlugs)[0]
  if (!first) return BOKUN_CATEGORY_FALLBACK
  return CMS_CATEGORY_TO_BOKUN[first] ?? BOKUN_CATEGORY_FALLBACK
}

/**
 * Resolve CMS image paths (`/api/media/file/x.jpg`) to absolute URLs.
 * URL-encodes only the filename segment to handle spaces / non-ASCII safely.
 */
export function resolveImageUrls(imagesField: string, baseUrl: string): string[] {
  return splitList(imagesField).map((p) => {
    const trimmed = p.startsWith('/') ? p : `/${p}`
    // Encode just filename component (last path segment).
    const slashIdx = trimmed.lastIndexOf('/')
    const dir = trimmed.slice(0, slashIdx + 1)
    const file = trimmed.slice(slashIdx + 1)
    return `${baseUrl}${dir}${encodeURIComponent(file)}`
  })
}

function pickCity(slug: string): string {
  return CITY_OVERRIDES[slug] ?? BOKUN_DEFAULTS.defaultCity
}

// ─── Top-level mapper ────────────────────────────────────────────────────────

export interface MapOptions {
  /** Image URL prefix (override BOKUN_DEFAULTS.imageBaseUrl). */
  imageBaseUrl?: string
}

export function mapTourToBokunRows(tour: TourRow, opts: MapOptions = {}): BokunRowBundle {
  const slug = tour.slug
  const duration = splitDurationHours(tour.durationHours)
  const coords = splitCoordinates(tour.coordinates)
  const imageBaseUrl = opts.imageBaseUrl ?? BOKUN_DEFAULTS.imageBaseUrl

  const product: BokunProductRow = {
    id: '',
    productCode: slug,
    title: tour.titleEn,
    experienceType: BOKUN_DEFAULTS.experienceType,
    bookingType: BOKUN_DEFAULTS.bookingType,
    capacityType: BOKUN_DEFAULTS.capacityType,
    scheduleType: BOKUN_DEFAULTS.scheduleType,
    passExpiryType: '',
    passCapacity: '',
    fixedPassExpiryDate: '',
    passValidForDays: '',
    meetingType: BOKUN_DEFAULTS.meetingType,
    categories: mapPrimaryCategory(tour.categoriesSlugs),
    attributes: '',
    accessibilityTypes: mapAccessibility(tour),
    guidances: '',
    difficultyLevel: DIFFICULTY_MAP[tour.difficultyLevel] ?? '',
    minimumAge: tour.minimumAge ?? '',
    durationWeeks: 0,
    durationDays: 0,
    durationHours: duration.hours,
    durationMinutes: duration.minutes,
    cutoffWeeks: BOKUN_DEFAULTS.cutoffWeeks,
    cutoffDays: BOKUN_DEFAULTS.cutoffDays,
    cutoffHours: BOKUN_DEFAULTS.cutoffHours,
    cutoffMinutes: BOKUN_DEFAULTS.cutoffMinutes,
    cutoffType: BOKUN_DEFAULTS.cutoffType,
    cutoffReferenceHour: '',
    cutoffReferenceMinute: '',
    excerpt: tour.shortDescEn,
    description: tour.fullDescEn,
    keywords: splitList(tour.neighborhoodsSlugs).join(BOKUN_MULTI_VALUE_SEP),
    flags: '',
    included: joinAsLines(splitList(tour.includedEn)),
    excluded: joinAsLines(splitList(tour.notIncludedEn)),
    inclusions: '',
    exclusions: '',
    knowBeforeYouGo: mapKnowBeforeYouGoTags(tour),
    requirements: joinAsLines(splitList(tour.whatToBringEn)),
    attention: buildMeetingNotesFreeText(tour),
    ticketPerPerson: false,
    privateExperience: true,
    requestDeadlineWeeks: '',
    requestDeadlineDays: '',
    requestDeadlineHours: '',
    requestDeadlineMinutes: '',
    allowCustomBookings: false,
    customPickupAllowed: false,
    pickupMinutesBefore: '',
    dropoffService: '',
    customDropoffAllowed: false,
    location: buildLocationString(pickCity(slug)),
    defaultRate: BOKUN_DEFAULTS.defaultRate,
    defaultPricingCategory: BOKUN_DEFAULTS.defaultPricingCategory,
    timeZone: BOKUN_DEFAULTS.timeZone,
  }

  const pricingCategory: BokunPricingCategoryRow = {
    productId: '',
    productCode: slug,
    title: BOKUN_DEFAULTS.pricingCategoryTitle,
    ticketCategory: BOKUN_DEFAULTS.ticketCategory,
  }

  const rate: BokunRateRow = {
    productId: '',
    productCode: slug,
    // Code (machine identifier) must match Products."Default rate".
    code: BOKUN_DEFAULTS.defaultRate,
    // Title is the human label shown to customers.
    title: 'Standard',
    description: '',
    minPerBooking: tour.minGroupSize ?? BOKUN_DEFAULTS.fallbackMinGroupSize,
    maxPerBooking: tour.maxGroupSize ?? BOKUN_DEFAULTS.fallbackMaxGroupSize,
    pricedPerPerson: false,
    pickupSelectionType: BOKUN_DEFAULTS.pickupSelectionType,
    pickupPricingType: '',
    pickupPricedPerPerson: false,
    dropoffSelectionType: BOKUN_DEFAULTS.dropoffSelectionType,
    dropoffPricingType: '',
    dropoffPricedPerPerson: false,
    cancellationPolicy: BOKUN_DEFAULTS.cancellationPolicy,
  }

  const photos: BokunPhotoRow[] = resolveImageUrls(tour.images, imageBaseUrl).map((url, idx) => ({
    productId: '',
    productCode: slug,
    photoCode: `${slug}-${idx + 1}`,
    photoUrl: url,
    photoDescription: '',
  }))

  const city = pickCity(slug)
  // Bokun rejects blank lat/lng — fall back to city-center coords when CMS
  // doesn't have per-tour coords. Operator can drag the marker in Bokun extranet.
  const fallback = CITY_FALLBACK_COORDS[city] ?? CITY_FALLBACK_COORDS.Stockholm
  const finalCoords = coords ?? fallback
  const meetingPoint: BokunMeetingPointRow = {
    productId: '',
    productCode: slug,
    title: tour.meetingPointNameEn,
    addressLine1: tour.meetingPointAddressEn,
    addressLine2: '',
    addressLine3: '',
    city,
    countryCode: BOKUN_DEFAULTS.countryCode,
    state: '',
    postalCode: '',
    latitude: finalCoords.lat,
    longitude: finalCoords.lng,
    zoomLevel: BOKUN_DEFAULTS.zoomLevel,
    unLocodeCountry: BOKUN_DEFAULTS.countryCode,
    unLocodeCity: CITY_UN_LOCODE[city] ?? '',
  }

  return { product, pricingCategory, rate, photos, meetingPoint }
}
