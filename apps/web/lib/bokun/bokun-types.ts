/**
 * Bokun API TypeScript types
 * Based on Bokun REST API v2.0 specification
 * All monetary values are strings per Bokun API requirement (never floats)
 */

// ============================================================================
// AVAILABILITY TYPES
// ============================================================================

/**
 * Bokun availability slot from API
 */
export interface BokunAvailability {
  /** Date in ISO format (YYYY-MM-DD) */
  date: string
  /** Start time in HH:mm format */
  startTime: string
  /** Unique identifier for this time slot */
  startTimeId: string
  /** Whether capacity is unlimited */
  unlimitedAvailability: boolean
  /** Number of spots available */
  availabilityCount: number
  /** Number of participants already booked */
  bookedParticipants: number
  /** Minimum required participants */
  minParticipants: number
  /** Pricing rates for this slot */
  rates: BokunRate[]
}

/**
 * Price rate for a specific participant type
 */
export interface BokunRate {
  /** Number of participants */
  participantCount: number
  /** Age band identifier (ADULT, CHILD, SENIOR, etc.) */
  ageBand?: string
  /** Price as string (never use float for monetary values) */
  price: string
  /** Currency code (EUR, SEK, USD, etc.) */
  currency: string
}

// ============================================================================
// BOOKING TYPES
// ============================================================================

/**
 * Bokun booking object
 */
export interface BokunBooking {
  /** Unique booking ID */
  id: string
  /** Human-readable confirmation code */
  confirmationCode: string
  /** Booking status */
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'ON_HOLD'
  /** Customer information */
  customerDetails: BokunCustomer
  /** Individual product bookings */
  productBookings: BokunProductBooking[]
  /** Total price as string */
  totalPrice: string
  /** Currency code */
  currency: string
  /** Creation timestamp (UTC milliseconds) */
  createdAt: number
  /** Last update timestamp (UTC milliseconds) */
  updatedAt?: number
  /**
   * Paid Extras envelope (no pricing) as emitted on the booking object.
   * Authoritative pricing/quantity lives on `BokunProductBooking.lineItems[]`
   * where `extraId` is set. See `BokunBookingLineItem`.
   *
   * Path varies by Bokun event surface:
   *   - Webhook payload (server-side): `booking.productBookings[N].extras[]`
   *   - Checkout API response (widget): `booking.activityBookings[N].extras[]`
   *
   * See: plans/260519-2046-bokun-extras-add-ons-checkout/research/bokun-extras-shape-findings.md
   */
  extras?: BokunExtraEnvelope[]
}

/**
 * Bokun "Extra" envelope returned on a booking — purely metadata; price/qty
 * for an Extra purchase live on `BokunBookingLineItem` (cross-reference by
 * `lineItem.extraId === envelope.extra.id`).
 *
 * Observed in Phase 01 capture (sample: `research/bokun-checkout-api-response-sample.json`).
 */
export interface BokunExtraEnvelope {
  /** Internal Bokun booking ID for this extra purchase (not the parent booking). */
  bookingId: number
  /** Display title (single string, NOT localized in payload). */
  title: string
  /** Quantity purchased (Bokun's pre-payment count). */
  unitCount: number
  /** Nested metadata about the configured Extra (catalog-side). */
  extra: BokunExtraDefinition
  /** Duplicate of `extra` Bokun emits on the same envelope. */
  bookableExtra?: BokunExtraDefinition
  /** Customer answers to any extra-level questions. v1 unused. */
  bookingAnswers?: unknown[]
  /** Customer answers (alt array). v1 unused. */
  answers?: unknown[]
}

/**
 * Catalog-side definition of a Bokun Extra, embedded inside a booking's
 * `BokunExtraEnvelope.extra`. Bokun replicates this in multiple places.
 */
export interface BokunExtraDefinition {
  /** Bokun-side numeric Extra ID. Operator pastes this into CMS `bokunExtraId` (as string). */
  id: number
  /** Vendor-controlled external reference string; usually empty. */
  externalId?: string
  /** Display title. Single string, NOT localized. */
  title: string
  /** Long-form description. Bokun emits HTML-safe plain text. */
  information?: string
  /** Whether this extra is auto-included with every booking (Required). */
  included?: boolean
  /** Whether the extra is offered for free. */
  free?: boolean
  /** Pricing model. PER_PERSON extras still price once per pricing-category line. */
  pricingType?: 'PER_PERSON' | 'PER_BOOKING'
  /** Localized label of pricingType (e.g. "per person"). Single string, NOT localized. */
  pricingTypeLabel?: string
  /** Whether buying this extra adds capacity to the booking. */
  increasesCapacity?: boolean
  /** 0 = no max, otherwise hard cap per booking. */
  maxPerBooking?: number
  /** When true, max units = number of participants. */
  limitByPax?: boolean
  /** Rate IDs this extra is offered against. */
  rateIds?: number[]
  /** GetYourGuide channel-mapping hint. v1 ignores. */
  type?: 'FOOD' | 'DRINKS' | 'SAFETY' | 'TRANSPORT' | 'DONATION' | 'OTHERS'
  /** Custom questions attached to the extra. v1 ignores. */
  questions?: unknown[]
  /** Bokun-internal flags. v1 ignores. */
  flags?: unknown[]
}

/**
 * One line item on a product booking. Bokun emits both passenger lines and
 * extra-purchase lines through this same shape. Extra lines have `extraId` set.
 *
 * Monetary values arrive as **numbers (floats)** here — coerce to strings
 * in the mapper to match Bokun's stated stringly-typed monetary convention.
 *
 * Observed in Phase 01 capture (sample: `research/bokun-checkout-api-response-sample.json`).
 */
export interface BokunBookingLineItem {
  /** Internal line ID. */
  id: number
  /** Display title. Extra lines are prefixed with pricing category, e.g. `"Per group: Museum Ticket"`. */
  title: string
  /** ISO 4217 currency code. */
  currency: string
  /** Units purchased. */
  quantity: number
  /** Per-unit price (float). Coerce to string for persistence. */
  unitPrice: number
  /** Total line price (float). Coerce to string for persistence. */
  total: number
  /** Pre-formatted total, e.g. "SEK 150.00". */
  totalAsText?: string
  /** Present ONLY on lines that represent an Extra purchase (cross-ref to `BokunExtraDefinition.id`). */
  extraId?: number
  /** Pricing category this line was sold under (e.g. "Per group", "Adult", "Child"). */
  pricingCategoryId?: number
  /** Internal item-booking reference for the line. */
  itemBookingId?: string
  /** Number of people this line represents (0 for per-booking extras). */
  people?: number
}

/**
 * Customer details for a booking
 */
export interface BokunCustomer {
  /** First name */
  firstName: string
  /** Last name */
  lastName: string
  /** Email address */
  email: string
  /** Phone number */
  phone?: string
  /** Country code (ISO 2-letter) */
  nationality?: string
  /** Additional notes from customer */
  notes?: string
}

/**
 * Individual product/experience booking within a booking
 */
export interface BokunProductBooking {
  /** Time slot ID */
  startTimeId: string
  /** Experience/activity ID */
  experienceId: string
  /** List of participants */
  participants: BokunParticipant[]
  /** Special requests or notes */
  notes?: string
  /** Start date */
  date: string
  /** Start time */
  startTime: string
  /**
   * Per-line breakdown of what was purchased on this product booking.
   * Extras are line items where `extraId` is set (rest are passenger lines).
   * Authoritative source for extras pricing/quantity — see `BokunBookingLineItem`.
   */
  lineItems?: BokunBookingLineItem[]
  /**
   * Extras envelope (metadata only — no pricing). Cross-reference by
   * `lineItem.extraId === envelope.extra.id`. See `BokunExtraEnvelope`.
   */
  extras?: BokunExtraEnvelope[]
}

/**
 * Participant in a booking
 */
export interface BokunParticipant {
  /** Age band (ADULT, CHILD, INFANT, SENIOR) */
  ageBand: string
  /** Number of participants in this age band */
  count: number
}

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

/**
 * Webhook event types from Bokun
 */
export type BokunWebhookEvent =
  | 'BOOKING_CREATED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_MODIFIED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_FAILED'

/**
 * Webhook payload from Bokun
 */
export interface BokunWebhookPayload {
  /** Event type */
  event: BokunWebhookEvent
  /** Booking ID */
  bookingId: string
  /** Full booking object */
  booking: BokunBooking
  /** Event timestamp (UTC milliseconds) */
  timestamp: number
  /** Vendor ID */
  vendorId?: string
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Bokun API error response
 */
export interface BokunApiError {
  /** Error code */
  errorCode: string
  /** Error message */
  message: string
  /** Additional error details */
  details?: string
  /** HTTP status code */
  status?: number
}

// ============================================================================
// REQUEST TYPES
// ============================================================================

/**
 * Request parameters for fetching availability
 */
export interface AvailabilityRequest {
  /** Experience/activity ID from Bokun */
  experienceId: string
  /** Start date (YYYY-MM-DD) */
  startDate: string
  /** End date (YYYY-MM-DD) */
  endDate: string
}

/**
 * Request parameters for creating a booking
 */
export interface CreateBookingRequest {
  /** Experience/activity ID */
  experienceId: string
  /** Time slot ID from availability */
  startTimeId: string
  /** Customer details */
  customer: BokunCustomer
  /** List of participants by age band */
  participants: BokunParticipant[]
  /** Special requests */
  notes?: string
  /** Promotional code */
  promoCode?: string
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

/**
 * Response from availability endpoint
 */
export interface AvailabilityResponse {
  /** List of available time slots */
  availabilities: BokunAvailability[]
}

/**
 * Response from booking creation
 */
export interface BookingResponse {
  /** Created booking */
  booking: BokunBooking
  /** Checkout URL for redirect flow (if applicable) */
  checkoutUrl?: string
}

// ============================================================================
// WIDGET TYPES
// ============================================================================

/**
 * Configuration for Bokun widget embedding
 */
export interface BokunWidgetConfig {
  /** Booking channel UUID from Bokun dashboard */
  bookingChannelUUID: string
  /** Experience ID to display */
  experienceId: string
  /** Optional locale for widget (en, sv, de) */
  locale?: string
  /** Optional custom styling */
  style?: {
    primaryColor?: string
    backgroundColor?: string
  }
}

// ============================================================================
// EXPERIENCE WRITE TYPES (outbound CMS → Bokun sync)
// ============================================================================

/**
 * Bokun locale codes for Experience write payloads.
 * Verified in Phase 01 findings against `https://api-docs.bokun.dev/rest-v2`.
 * Bokun accepts ISO 639-1 two-letter codes (sv, en, de) for these markets.
 */
export type BokunExperienceLocale = 'sv' | 'en' | 'de'

/**
 * Localized string entry for Experience write payloads.
 * Use one entry per non-empty translation; omit empty ones to keep payload clean.
 */
export interface BokunExperienceLocalizedString {
  locale: BokunExperienceLocale
  value: string
}

/**
 * Pricing category within a rate plan (Adult, Child, Group, etc.).
 * Bokun's pricing model: each rate has a `pricePerBooking` flag at the rate level.
 *  - Per-person rate (`pricePerBooking: false`): use `pricePerCategoryUnit` (price per participant)
 *  - Flat rate     (`pricePerBooking: true`):  use `flatPrice` for the whole booking
 * Monetary values are strings to preserve precision per Bokun spec (never floats).
 */
export interface BokunExperiencePricingCategory {
  /** Display title, e.g. "Adult", "Child", "Per group" */
  title: string
  /** Per-person price (used when parent rate has pricePerBooking=false). */
  pricePerCategoryUnit?: string
  /** Flat per-booking price (used when parent rate has pricePerBooking=true). */
  flatPrice?: string
  /** Minimum age inclusive (e.g. 13 for Adult). */
  minAge?: number
  /** Maximum age inclusive (e.g. 12 for Child). */
  maxAge?: number
}

/**
 * Rate plan grouping pricing categories. v1 emits a single "Standard" rate per Experience.
 * `pricePerBooking` switches between per-person (false) and flat-rate (true) pricing.
 */
export interface BokunExperienceRate {
  /** Display title for the rate plan, e.g. "Standard" */
  title: string
  /** ISO 4217 currency code */
  currency: 'SEK' | 'EUR' | 'USD'
  /**
   * Whether the rate is priced per booking (true → flat) or per participant (false).
   * Maps from CMS Tour.pricing.priceType: per_group → true, per_person/custom → false.
   */
  pricePerBooking: boolean
  /** One or more pricing categories (Adult, Child, Per group, etc.) */
  pricingCategories: BokunExperiencePricingCategory[]
}

/**
 * Meeting point block. Latitude/longitude are decimal degrees in WGS84.
 */
export interface BokunExperienceMeetingPoint {
  title: BokunExperienceLocalizedString[]
  address?: BokunExperienceLocalizedString[]
  instructions?: BokunExperienceLocalizedString[]
  latitude?: number
  longitude?: number
}

/**
 * Activity exertion level. Maps to CMS difficultyLevel (easy → EASY, etc.).
 */
export type BokunExperienceActivityLevel = 'EASY' | 'MODERATE' | 'CHALLENGING'

/**
 * Internal input to the wire serializer for one Bokun extra (paid add-on).
 * One per CMS `optionalAddOns` row. Localized title/description; the serializer
 * flattens to a single string per Bokun's ExtraDto shape (no localized arrays
 * on extras — confirmed Phase 01 spike).
 */
export interface BokunExtraInput {
  /** CMS row id — pushed as Bokun `externalId` for round-trip correlation. */
  externalId: string
  /**
   * Bokun-assigned numeric id (when updating an existing extra).
   * Undefined → CREATE path; Bokun assigns a new id and returns it in the PUT response.
   */
  existingBokunExtraId?: string | number
  title: BokunExperienceLocalizedString[]
  description?: BokunExperienceLocalizedString[]
  /**
   * Max units per booking. REQUIRED on Bokun's ExtraDto — omission → HTTP 400
   * "extras[N]::maxPerBooking absent" (Phase 01 verified). CMS does not model
   * this; serializer falls back to a sane default if omitted.
   */
  maxPerBooking?: number
}

/**
 * Wire shape for one Bokun extra. Matches Bokun's ExtraDto exactly per Phase 01.
 * Allowed fields (9 total, from Bokun's Jackson error listing):
 *   maxPerBooking, photo, limitByPax, externalId, title, type, id,
 *   description, commissionGroupId
 *
 * v1 sends: id (UPDATE only), externalId, title, description, type, maxPerBooking,
 * limitByPax.
 * v1 omits: photo, commissionGroupId (not modeled in CMS).
 *
 * NOT on ExtraDto (do not add — Bokun will 400):
 *   - `required` / `included` flags (dashboard-only — Phase 01 confirmed)
 *   - `price` / `currency` / `pricedPerPerson` (pricing writes not exposed via
 *     REST v2.0 at all — Phase 01 4-variant probe + OpenAPI audit)
 */
export interface BokunExtraComponentDto {
  /** Bokun-assigned id when updating; omit for CREATE. */
  id?: number
  /** CMS row id as stable correlator — round-trips on PUT response. */
  externalId: string
  title: string
  description?: string
  /**
   * GetYourGuide channel hint; ignored for direct Bokun bookings. v1 hardcodes "OTHERS".
   */
  type: 'OTHERS' | 'FOOD' | 'DRINKS' | 'SAFETY' | 'TRANSPORT' | 'DONATION'
  /** REQUIRED by Bokun; omitting yields 400 "maxPerBooking absent". */
  maxPerBooking: number
  /** Whether qty cap ties to participant count. v1 always false. */
  limitByPax: boolean
}

/**
 * Payload for POST /restapi/v2.0/experience (CREATE Experience).
 * All fields validated against Bokun spec in Phase 01 findings.
 */
export interface BokunExperienceCreatePayload {
  title: BokunExperienceLocalizedString[]
  /** Full description, HTML allowed. Sanitized in mapper. */
  description: BokunExperienceLocalizedString[]
  /** Brief summary shown on listings. */
  summary: BokunExperienceLocalizedString[]
  highlights?: BokunExperienceLocalizedString[]
  /** ISO 8601 duration string (e.g. "PT1H30M" for 90 minutes). */
  durationISO: string
  minParticipants: number
  maxParticipants: number
  rates: BokunExperienceRate[]
  meetingPoint: BokunExperienceMeetingPoint
  inclusions?: BokunExperienceLocalizedString[]
  exclusions?: BokunExperienceLocalizedString[]
  bringList?: BokunExperienceLocalizedString[]
  activityLevel?: BokunExperienceActivityLevel
  wheelchairAccessible?: boolean
  /**
   * Optional add-ons to push to the EXTRAS component on PUT /components.
   * Per Phase 01: serialized via `serializeBokunExtras` into a top-level `extras`
   * array on the wire payload. v1 only — pricing remains dashboard-managed.
   */
  extras?: BokunExtraInput[]
}

/**
 * Payload for PUT /restapi/v2.0/experience/{id} (UPDATE Experience).
 * Bokun accepts a partial body; only provided fields are updated.
 */
export type BokunExperienceUpdatePayload = Partial<BokunExperienceCreatePayload>

/**
 * Response from POST /restapi/v2.0/experience.
 * Bokun is documented to return the new Experience id, but the exact key is not in
 * public docs — accept both `id` and `experienceId` shapes; mapper picks whichever is set.
 */
export interface BokunExperienceCreateResponse {
  /** Bokun-assigned Experience ID. Persist on the Tour. */
  id?: string
  /** Alternate name some Bokun endpoints use for the same value. */
  experienceId?: string
  status?: string
  createdAt?: number
}

/**
 * Response from PUT /restapi/v2.0/experience/{id}/components.
 *
 * Phase 01 finding: when the PUT body contains `{ extras: [...] }`, Bokun returns
 * the FULL updated state (not 204) — including the extras array with Bokun-assigned
 * `id` values. Use `extras[].externalId` to correlate back to CMS rows; no separate
 * GET round-trip needed for ID backfill.
 *
 * When the PUT body contains only text fields (existing path: title, description,
 * etc.), Bokun returns 204 No Content. All fields are therefore optional.
 */
export interface BokunExperienceUpdateResponse {
  id?: string
  experienceId?: string
  status?: string
  updatedAt?: number
  /** Updated extras list with assigned ids (when PUT body included `extras`). */
  extras?: BokunExtraComponentDto[]
  /** Epoch ms; Bokun emits when returning full state. */
  lastModified?: number
}
