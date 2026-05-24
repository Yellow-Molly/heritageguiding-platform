/**
 * Pure mapper: Bokun webhook payload → Payload `bookings` collection row.
 *
 * No Payload calls here — just a deterministic transform so the webhook
 * handler stays simple and the mapping is easy to unit-test.
 *
 * The `tour` relationship is filled in by the caller after a separate
 * lookup of `bokunExperienceId` against the tours collection (keeping
 * this function dependency-free).
 */
import type {
  BokunBooking,
  BokunBookingLineItem,
  BokunExtraEnvelope,
  BokunProductBooking,
  BokunWebhookPayload,
} from './bokun-types'

/** Bokun status → Bookings collection enum value */
const STATUS_MAP: Record<BokunBooking['status'], 'pending' | 'confirmed' | 'cancelled' | 'on_hold'> = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  ON_HOLD: 'on_hold',
}

/**
 * One purchased Extra line, normalized into the shape persisted in
 * `bookings.addOns` (JSON column). Sourced from
 * `productBookings[N].lineItems[]` where `extraId !== undefined`.
 *
 * All monetary fields are strings to match Bokun's stringly-typed monetary
 * convention used across this codebase (the lineItem itself emits floats).
 */
export interface MappedAddOnLine {
  /** Bokun-side Extra ID, stringified — matches CMS `bokunExtraId`. */
  bokunExtraId: string
  /** Display name. Falls back to `extras[].title` envelope when lineItem
   *  title is the category-prefixed form (e.g. "Per group: …"). */
  name: string
  /** Quantity purchased. */
  qty: number
  /** Per-unit price as string. */
  unitPrice: string
  /** Total line price as string. */
  totalPrice: string
  /** ISO 4217 currency code. Falls back to booking currency if missing. */
  currency: string
  /** Whether priced per person (true) or per booking (false). */
  perPerson: boolean
}

/** Shape we write into the `bookings` collection (excluding tour FK). */
export interface MappedBookingRow {
  bokunBookingId: string
  confirmationCode: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'on_hold'
  customerName: string
  customerEmail: string
  customerPhone?: string
  bokunExperienceId?: string
  bookingDate?: string
  startTime?: string
  participants?: number
  totalPrice: string
  currency: string
  /**
   * Paid add-on lines purchased at checkout. Undefined when no extras
   * present (column stays NULL — no admin noise on add-on-less bookings).
   */
  addOns?: MappedAddOnLine[]
  lastWebhookEvent: BokunWebhookPayload['event']
  webhookReceivedAt: string
  rawPayload: BokunBooking
}

/**
 * Extract purchased add-ons from a Bokun booking.
 *
 * Strategy: walk `productBookings[].lineItems[]`, keep rows where `extraId`
 * is set (passenger lines have no `extraId`). For the display name, prefer
 * the envelope title (`productBookings[].extras[].title`) over the
 * category-prefixed lineItem title (e.g. "Per group: Museum Ticket").
 *
 * The `pricedPerPerson` flag is sourced from the matching envelope's
 * `extra.pricingType` (Bokun's authoritative per-person vs per-booking
 * flag; not present on lineItems).
 *
 * Returns undefined (not empty array) when no extras present so persistence
 * leaves the JSON column as NULL — matches existing convention for
 * optional-undefined fields.
 *
 * Envelope tolerance: the webhook payload nests under `productBookings`,
 * but the Bokun frontend checkout API uses `activityBookings` for the same
 * shape. Mapper checks `productBookings` first; falls back if missing.
 *
 * @see plans/260519-2046-bokun-extras-add-ons-checkout/research/bokun-extras-shape-findings.md
 */
function mapBokunExtras(booking: BokunBooking): MappedAddOnLine[] | undefined {
  // Envelope tolerance — webhook uses productBookings, checkout API uses activityBookings.
  const products =
    booking.productBookings ??
    (booking as unknown as { activityBookings?: BokunProductBooking[] }).activityBookings

  if (!products || products.length === 0) return undefined

  const lines: MappedAddOnLine[] = []
  for (const product of products) {
    const lineItems = product.lineItems ?? []
    const extrasEnvelopes = product.extras ?? []
    const envelopesByExtraId = new Map<number, BokunExtraEnvelope>()
    for (const env of extrasEnvelopes) {
      if (env.extra?.id != null) envelopesByExtraId.set(env.extra.id, env)
    }

    for (const item of lineItems) {
      if (item.extraId == null) continue
      lines.push(buildAddOnLine(item, envelopesByExtraId.get(item.extraId), booking.currency))
    }
  }

  return lines.length > 0 ? lines : undefined
}

/** Compose one MappedAddOnLine from a lineItem (+ optional matched envelope). */
function buildAddOnLine(
  item: BokunBookingLineItem,
  envelope: BokunExtraEnvelope | undefined,
  bookingCurrency: string,
): MappedAddOnLine {
  // Prefer envelope title (no category prefix) over lineItem title ("Per group: …").
  const cleanName = envelope?.title ?? envelope?.extra?.title ?? item.title ?? 'Add-on'
  const perPerson = envelope?.extra?.pricingType === 'PER_PERSON'

  return {
    bokunExtraId: String(item.extraId ?? ''),
    name: cleanName,
    qty: Number(item.quantity ?? 0),
    unitPrice: String(item.unitPrice ?? '0'),
    totalPrice: String(item.total ?? '0'),
    // `||` (not `??`) so empty-string currency also falls back to booking currency.
    currency: item.currency || bookingCurrency,
    perPerson,
  }
}

/**
 * Map a webhook payload to a Bookings row.
 *
 * - Pulls primary tour reference from the first productBooking (MVP flow
 *   creates one product per booking; multi-product packages are rare and
 *   can be supported later via separate line items).
 * - Sums participants across all participant entries in the first product.
 */
export function mapBokunWebhookToBookingRow(payload: BokunWebhookPayload): MappedBookingRow {
  const { booking, event } = payload
  const firstProduct = booking.productBookings?.[0]
  const totalParticipants = firstProduct?.participants?.reduce(
    (sum, p) => sum + (p.count ?? 0),
    0,
  )

  return {
    bokunBookingId: booking.id,
    confirmationCode: booking.confirmationCode,
    status: STATUS_MAP[booking.status] ?? 'pending',
    customerName:
      `${booking.customerDetails.firstName ?? ''} ${booking.customerDetails.lastName ?? ''}`.trim() ||
      'Unknown',
    customerEmail: booking.customerDetails.email,
    customerPhone: booking.customerDetails.phone || undefined,
    bokunExperienceId: firstProduct?.experienceId,
    bookingDate: firstProduct?.date,
    startTime: firstProduct?.startTime,
    participants: totalParticipants && totalParticipants > 0 ? totalParticipants : undefined,
    totalPrice: booking.totalPrice,
    currency: booking.currency,
    addOns: mapBokunExtras(booking),
    lastWebhookEvent: event,
    webhookReceivedAt: new Date().toISOString(),
    rawPayload: booking,
  }
}
