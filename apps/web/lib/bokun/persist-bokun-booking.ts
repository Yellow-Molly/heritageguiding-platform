/**
 * Idempotent upsert of a Bokun webhook event into the Payload `bookings`
 * collection, plus side-effect emails.
 *
 * Called from `app/api/bokun/webhook/route.ts` after signature
 * verification. Failures here propagate so the route returns 500 and
 * Bokun retries — important: never swallow errors here.
 */
import { getPayload } from 'payload'
import config from '@payload-config'
import type { BokunWebhookPayload } from './bokun-types'
import { mapBokunWebhookToBookingRow } from './map-bokun-webhook-to-booking-row'
import { sendBookingConfirmationToCustomer } from '@/lib/email/send-booking-confirmation-to-customer'
import { sendBookingCancellationToCustomer } from '@/lib/email/send-booking-cancellation-to-customer'

/**
 * Persist the webhook event and trigger emails as appropriate.
 *
 * Idempotency: look up by `bokunBookingId`. If found, update; if not, create.
 * Email gating: confirmation sent at most once (tracked by
 * `confirmationEmailSent`). Cancellation sent once per transition into
 * the `cancelled` state.
 */
export async function persistBokunBooking(payload: BokunWebhookPayload): Promise<void> {
  const cms = await getPayload({ config })
  const row = mapBokunWebhookToBookingRow(payload)

  // Try to attach the matching Tour by Bokun experience ID. Best-effort —
  // a missing match doesn't block persistence.
  let tourId: number | undefined
  if (row.bokunExperienceId) {
    const tourMatch = await cms.find({
      collection: 'tours',
      where: { bokunExperienceId: { equals: row.bokunExperienceId } },
      limit: 1,
      depth: 0,
    })
    const matchedId = tourMatch.docs[0]?.id
    if (typeof matchedId === 'number') tourId = matchedId
  }

  // Look up existing record. `where` rather than `findByID` because the
  // primary key is Payload's numeric id, not bokunBookingId.
  const existing = await cms.find({
    collection: 'bookings',
    where: { bokunBookingId: { equals: row.bokunBookingId } },
    limit: 1,
    depth: 0,
  })
  const existingDoc = existing.docs[0] as
    | (typeof existing.docs[0] & {
        status?: string
        confirmationEmailSent?: boolean
      })
    | undefined

  // Build the write payload. `tour` is the relationship FK. `rawPayload` is
  // widened to Payload's JSON-column shape — BokunBooking is structurally
  // compatible but TS won't infer that without an explicit cast.
  const writeData = {
    ...row,
    rawPayload: row.rawPayload as unknown as Record<string, unknown>,
    ...(tourId !== undefined ? { tour: tourId } : {}),
  }

  const saved = existingDoc
    ? await cms.update({
        collection: 'bookings',
        id: existingDoc.id,
        data: writeData,
      })
    : await cms.create({
        collection: 'bookings',
        data: writeData,
      })

  // ===== Side-effect emails =====
  // Send confirmation only on first observation of an active booking.
  const isFirstActive =
    (payload.event === 'BOOKING_CREATED' || payload.event === 'BOOKING_CONFIRMED') &&
    !existingDoc?.confirmationEmailSent

  if (isFirstActive) {
    try {
      const tourTitle = await resolveTourTitle(cms, tourId)
      await sendBookingConfirmationToCustomer({
        to: row.customerEmail,
        customerName: row.customerName,
        confirmationCode: row.confirmationCode,
        tourTitle,
        bookingDate: row.bookingDate,
        startTime: row.startTime,
        participants: row.participants,
        totalPrice: row.totalPrice,
        currency: row.currency,
      })
      await cms.update({
        collection: 'bookings',
        id: (saved as { id: number | string }).id,
        data: {
          confirmationEmailSent: true,
          confirmationEmailSentAt: new Date().toISOString(),
        },
      })
    } catch (err) {
      // Don't fail the webhook for an email problem — the record is saved,
      // and ops can re-send manually. Log so it shows up in Sentry.
      console.error('[Bokun Webhook] Confirmation email failed:', err)
    }
  }

  // Cancellation email — fire when this event flipped status to cancelled.
  const flippedToCancelled =
    payload.event === 'BOOKING_CANCELLED' && existingDoc?.status !== 'cancelled'

  if (flippedToCancelled) {
    try {
      const tourTitle = await resolveTourTitle(cms, tourId)
      await sendBookingCancellationToCustomer({
        to: row.customerEmail,
        customerName: row.customerName,
        confirmationCode: row.confirmationCode,
        tourTitle,
        bookingDate: row.bookingDate,
      })
    } catch (err) {
      console.error('[Bokun Webhook] Cancellation email failed:', err)
    }
  }
}

/** Resolve a tour's display title for email templates — undefined if no match. */
async function resolveTourTitle(
  cms: Awaited<ReturnType<typeof getPayload>>,
  tourId: number | string | undefined,
): Promise<string | undefined> {
  if (!tourId) return undefined
  try {
    const tour = (await cms.findByID({
      collection: 'tours',
      id: tourId,
      depth: 0,
    })) as { title?: string }
    return tour.title
  } catch {
    return undefined
  }
}
