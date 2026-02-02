/**
 * Bokun webhook handler route
 * POST /api/bokun/webhook
 * Receives booking events from Bokun and processes them
 * Implements signature verification for security
 */

import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import type { BokunWebhookPayload, BokunBooking } from '@/lib/bokun'

// Max webhook payload size (1MB) to prevent DoS attacks
const MAX_BODY_SIZE = 1024 * 1024

/**
 * Verify Bokun webhook signature using timing-safe comparison.
 * Signature = HMAC-SHA256(webhookSecret, rawBody)
 */
function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const webhookSecret = process.env.BOKUN_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('[Bokun Webhook] BOKUN_WEBHOOK_SECRET not configured')
    return false
  }

  if (!signature) {
    return false
  }

  const expectedSignature = createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex')

  // Use crypto.timingSafeEqual to prevent timing attacks
  try {
    const sigBuffer = Buffer.from(signature, 'hex')
    const expectedBuffer = Buffer.from(expectedSignature, 'hex')

    if (sigBuffer.length !== expectedBuffer.length) {
      return false
    }

    return timingSafeEqual(sigBuffer, expectedBuffer)
  } catch {
    return false
  }
}

/**
 * Log webhook event to console (and optionally to database)
 */
async function logWebhookEvent(
  event: string,
  bookingId: string,
  booking: BokunBooking
): Promise<void> {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    bookingId,
    confirmationCode: booking.confirmationCode,
    status: booking.status,
    customerEmail: booking.customerDetails.email,
    totalPrice: booking.totalPrice,
    currency: booking.currency,
  }

  console.log('[Bokun Webhook] Event received:', JSON.stringify(logEntry, null, 2))

  // TODO: Persist to Bookings collection in Payload CMS
  // const payload = await getPayload({ config })
  // await payload.create({
  //   collection: 'bookings',
  //   data: {
  //     bokunBookingId: bookingId,
  //     confirmationCode: booking.confirmationCode,
  //     status: booking.status,
  //     customerName: `${booking.customerDetails.firstName} ${booking.customerDetails.lastName}`,
  //     customerEmail: booking.customerDetails.email,
  //     totalPrice: booking.totalPrice,
  //     currency: booking.currency,
  //     webhookEvent: event,
  //     rawPayload: JSON.stringify(booking),
  //   },
  // })
}

/**
 * Handle BOOKING_CREATED event
 */
async function handleBookingCreated(booking: BokunBooking): Promise<void> {
  console.log(`[Bokun] Booking created: ${booking.confirmationCode}`)

  // TODO: Send confirmation email via Resend
  // await sendBookingConfirmationEmail({
  //   to: booking.customerDetails.email,
  //   confirmationCode: booking.confirmationCode,
  //   customerName: booking.customerDetails.firstName,
  //   totalPrice: booking.totalPrice,
  //   currency: booking.currency,
  // })
}

/**
 * Handle BOOKING_CONFIRMED event
 */
async function handleBookingConfirmed(booking: BokunBooking): Promise<void> {
  console.log(`[Bokun] Booking confirmed: ${booking.confirmationCode}`)

  // TODO: Update booking status in database
  // TODO: Send confirmation email if not already sent
}

/**
 * Handle BOOKING_CANCELLED event
 */
async function handleBookingCancelled(booking: BokunBooking): Promise<void> {
  console.log(`[Bokun] Booking cancelled: ${booking.confirmationCode}`)

  // TODO: Update booking status in database
  // TODO: Send cancellation email to customer
  // await sendBookingCancellationEmail({
  //   to: booking.customerDetails.email,
  //   confirmationCode: booking.confirmationCode,
  //   customerName: booking.customerDetails.firstName,
  // })
}

/**
 * Handle PAYMENT_RECEIVED event
 */
async function handlePaymentReceived(booking: BokunBooking): Promise<void> {
  console.log(`[Bokun] Payment received for: ${booking.confirmationCode}`)

  // TODO: Update payment status in database
  // TODO: Trigger any post-payment workflows
}

/**
 * POST handler for Bokun webhooks
 */
export async function POST(request: NextRequest) {
  // Check content-length to prevent DoS
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
    return NextResponse.json(
      { error: 'Payload too large' },
      { status: 413 }
    )
  }

  // Get raw body for signature verification
  const rawBody = await request.text()

  // Double-check body size after reading
  if (rawBody.length > MAX_BODY_SIZE) {
    return NextResponse.json(
      { error: 'Payload too large' },
      { status: 413 }
    )
  }

  // Get signature from headers
  const signature = request.headers.get('x-bokun-signature') || ''

  // Verify webhook signature
  if (!verifyWebhookSignature(rawBody, signature)) {
    console.error('[Bokun Webhook] Invalid signature')
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 401 }
    )
  }

  // Parse payload
  let payload: BokunWebhookPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    console.error('[Bokun Webhook] Invalid JSON payload')
    return NextResponse.json(
      { error: 'Invalid JSON payload' },
      { status: 400 }
    )
  }

  // Validate payload structure
  if (!payload.event || !payload.bookingId || !payload.booking) {
    console.error('[Bokun Webhook] Invalid payload structure')
    return NextResponse.json(
      { error: 'Invalid payload structure' },
      { status: 400 }
    )
  }

  // Log the event
  await logWebhookEvent(payload.event, payload.bookingId, payload.booking)

  try {
    // Process event based on type
    switch (payload.event) {
      case 'BOOKING_CREATED':
        await handleBookingCreated(payload.booking)
        break

      case 'BOOKING_CONFIRMED':
        await handleBookingConfirmed(payload.booking)
        break

      case 'BOOKING_CANCELLED':
        await handleBookingCancelled(payload.booking)
        break

      case 'PAYMENT_RECEIVED':
        await handlePaymentReceived(payload.booking)
        break

      default:
        console.log(`[Bokun Webhook] Unhandled event type: ${payload.event}`)
    }

    // Return success response
    return NextResponse.json({
      received: true,
      event: payload.event,
      bookingId: payload.bookingId,
    })
  } catch (error) {
    console.error('[Bokun Webhook] Processing error:', error)

    // Return 500 so Bokun will retry the webhook
    return NextResponse.json(
      { error: 'Processing failed', retryable: true },
      { status: 500 }
    )
  }
}

/**
 * GET handler - return webhook status (for health checks)
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/bokun/webhook',
    method: 'POST',
    description: 'Bokun booking webhook endpoint',
  })
}
