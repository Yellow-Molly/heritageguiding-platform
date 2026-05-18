/**
 * Bokun webhook handler route
 * POST /api/bokun/webhook
 * Receives booking events from Bokun and processes them
 * Implements signature verification for security
 */

import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { revalidateTag } from 'next/cache'
import type { BokunWebhookPayload, BokunBooking } from '@/lib/bokun'
import { persistBokunBooking } from '@/lib/bokun/persist-bokun-booking'

// Hard cache invalidation profile. `{ expire: 0 }` forces immediate eviction
// of unstable_cache entries; named profiles only trigger SWR with long TTLs.
// Same pattern used in apps/web/app/api/revalidate/route.ts.
const HARD_EXPIRE = { expire: 0 } as const

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
 * Compact line for searchable webhook audit log — full event detail lives
 * in the `bookings.rawPayload` JSON column.
 */
function logWebhookEvent(event: string, bookingId: string, booking: BokunBooking): void {
  console.log(
    '[Bokun Webhook]',
    JSON.stringify({
      timestamp: new Date().toISOString(),
      event,
      bookingId,
      confirmationCode: booking.confirmationCode,
      status: booking.status,
      customerEmail: booking.customerDetails.email,
      totalPrice: booking.totalPrice,
      currency: booking.currency,
    }),
  )
}

/**
 * Invalidate availability for any event that changes slot capacity.
 * Pure side-effect — kept separate from persistence so cache invalidation
 * still happens even if persistence fails for a transient reason
 * (Bokun will retry, but cache should be evicted immediately).
 */
function revalidateAvailability(): void {
  revalidateTag('bokun-availability', HARD_EXPIRE)
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

  logWebhookEvent(payload.event, payload.bookingId, payload.booking)

  try {
    // Persistence handles upsert + customer email side-effects. The mapper
    // and email modules live in lib/bokun and lib/email so this route
    // stays focused on transport (signature, parsing, status codes).
    await persistBokunBooking(payload)

    // Any state-changing event affects availability — evict the cached
    // calendar so the next reader fetches fresh data from Bokun.
    if (
      payload.event === 'BOOKING_CREATED' ||
      payload.event === 'BOOKING_CONFIRMED' ||
      payload.event === 'BOOKING_CANCELLED' ||
      payload.event === 'BOOKING_MODIFIED'
    ) {
      revalidateAvailability()
    }

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
