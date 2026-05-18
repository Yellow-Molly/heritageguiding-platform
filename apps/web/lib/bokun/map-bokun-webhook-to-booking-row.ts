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
import type { BokunBooking, BokunWebhookPayload } from './bokun-types'

/** Bokun status → Bookings collection enum value */
const STATUS_MAP: Record<BokunBooking['status'], 'pending' | 'confirmed' | 'cancelled' | 'on_hold'> = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  ON_HOLD: 'on_hold',
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
  lastWebhookEvent: BokunWebhookPayload['event']
  webhookReceivedAt: string
  rawPayload: BokunBooking
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
    lastWebhookEvent: event,
    webhookReceivedAt: new Date().toISOString(),
    rawPayload: booking,
  }
}
