# Phase 08.1: Bokun Booking Integration

## Validation Summary

**Validated:** 2026-01-31
**Questions asked:** 6

### Confirmed Decisions

| Decision | User Choice |
|----------|-------------|
| **Checkout Approach** | Embedded widget - user stays on site, checkout in iframe |
| **Multi-system Support** | Replace Rezdy with Bokun - remove Rezdy code, Bokun only |
| **Webhook Handling** | Log + Database + Email - full tracking with notifications |
| **Cache TTL** | 60 seconds - balance freshness vs rate limits |
| **Booking Tracking** | Create Bookings collection in Payload CMS for local tracking |
| **Fallback UX** | Email inquiry form when widget fails to load |

### Action Items

- [ ] Remove Rezdy-related code from booking-section.tsx (no multi-system)
- [ ] Create `Bookings` collection in Payload CMS for webhook data persistence
- [ ] Add email service integration for confirmation emails
- [ ] Ensure email inquiry fallback is prominent when widget fails

---

## Context Links

- [Bokun API Research](./research/researcher-bokun-api.md) - API auth, endpoints, webhooks
- [Bokun Widget Research](./research/researcher-bokun-widget.md) - Widget embed, React integration
- [Phase 08 Rezdy Integration](./phase-08-rezdy-integration.md) - Reference implementation pattern
- [Tour Detail Phase](./phase-07-tour-details.md) - Tour page structure
- [Bokun API Docs v2](https://api-docs.bokun.dev/rest-v2)
- [Bokun Dev Portal](https://bokun.dev/)

## Overview

| Priority | Status | Effort |
|----------|--------|--------|
| P1 - Critical | security-review-required | 20-24h (code) + 4-6h (security fixes) |

Integrate Bokun booking system for availability checking, session selection, and booking creation. Supports both API-driven booking flow and embedded widget approach. Implements HMAC-based authentication, webhook handling, and rate limit management.

## Key Insights

From research reports:

1. **Authentication**: API key + secret with HMAC signature (not simple API key like Rezdy)
2. **Booking Channel**: Required setup in Bokun dashboard before API access
3. **Widget Embed**: Iframe-based via `BokunWidgetsLoader.js` script
4. **Rate Limit**: 400 req/min per vendor (vendor-level, not per-key)
5. **Monetary Format**: ALL prices must be strings (never floats)
6. **Timestamps**: UTC milliseconds format
7. **Session IDs**: `startTimeId` identifies specific time slots
8. **Checkout Options**: Embedded iframe OR redirect to Bokun hosted page

## Requirements

### Functional

- Display real-time availability for tours with Bokun product ID
- Date picker showing available sessions from Bokun API
- Session selection with capacity + pricing indicator
- Embedded Bokun widget for checkout (primary) or API-created booking (fallback)
- Receive booking confirmations via webhook
- Store `bokunExperienceId` in Tour CMS collection

### Non-Functional

- Cache availability data (60s TTL for real-time accuracy)
- Handle 429 rate limit with exponential backoff
- Fallback to inquiry form if API/widget fails
- Webhook endpoint secured with signature verification
- Support test (api.bokuntest.com) and prod (api.bokun.io) environments
- HMAC signature generation for all API requests

## Architecture

### Booking Flow (Widget Approach - Recommended)

```
User views tour detail page
       |
BokunWidget component loads
       |
Widget iframe from Bokun
       |
User selects date -> Bokun fetches availability
       |
User completes checkout in iframe
       |
Bokun processes payment
       |
Webhook receives confirmation -> Display success
```

### Booking Flow (API Approach - Fallback)

```
User selects tour
       |
Frontend calls /api/bokun/availability
       |
Next.js API fetches from Bokun API (with HMAC)
       |
Display available dates/sessions
       |
User selects date + session + participants
       |
POST /api/bokun/booking creates booking
       |
Redirect to Bokun checkout OR return confirmation
       |
Webhook receives confirmation
```

### Data Flow Diagram

```
Frontend              Next.js API            Bokun API
    |                      |                     |
    |--GET /availability-->|                     |
    |                      |--GET /activity/{id}/availabilities-->|
    |                      |     (HMAC signed)   |
    |                      |<--sessions[]--------|
    |<--sessions[]---------| (cached 60s)        |
    |                      |                     |
    |--POST /api/booking-->|                     |
    |                      |--POST /booking----->|
    |                      |     (HMAC signed)   |
    |                      |<--booking-----------|
    |<--checkout URL-------|                     |
    |                      |                     |
    |   Webhook POST------>|                     |
    |                      |--verify signature   |
    |                      |--process event      |
```

## Related Code Files

### Create

| File | Purpose |
|------|---------|
| `apps/web/lib/bokun/bokun-api-client.ts` | API client with HMAC authentication |
| `apps/web/lib/bokun/bokun-types.ts` | TypeScript interfaces for Bokun API |
| `apps/web/lib/bokun/bokun-availability.ts` | Availability service with caching |
| `apps/web/lib/bokun/bokun-booking.ts` | Booking service |
| `apps/web/app/api/bokun/availability/route.ts` | Availability API route |
| `apps/web/app/api/bokun/webhook/route.ts` | Webhook handler |
| `apps/web/components/bokun-widget.tsx` | Bokun widget wrapper component |
| `apps/web/lib/hooks/use-bokun-availability.ts` | React hook for availability |
| `packages/cms/collections/Bookings.ts` | Bookings collection for webhook persistence |

### Modify

| File | Change |
|------|--------|
| `apps/web/components/tour/booking-section.tsx` | Replace placeholder with BokunWidget |
| `.env.example` | Add Bokun environment variables |
| `packages/cms/collections/Tours.ts` | Add `bokunExperienceId` field |
| `packages/cms/payload.config.ts` | Register Bookings collection |

## Implementation Steps

### Step 1: Define TypeScript Types

```typescript
// apps/web/lib/bokun/bokun-types.ts

/**
 * Bokun availability slot from API
 * Note: All monetary values are strings per Bokun API requirement
 */
export interface BokunAvailability {
  date: string
  startTime: string
  startTimeId: string
  unlimitedAvailability: boolean
  availabilityCount: number
  bookedParticipants: number
  minParticipants: number
  rates: BokunRate[]
}

export interface BokunRate {
  participantCount: number
  ageBand?: string
  price: string // String required, never float
  currency: string
}

export interface BokunBooking {
  id: string
  confirmationCode: string
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED'
  customerDetails: BokunCustomer
  productBookings: BokunProductBooking[]
  totalPrice: string // String format
  currency: string
  createdAt: number // UTC milliseconds
}

export interface BokunCustomer {
  firstName: string
  lastName: string
  email: string
  phone?: string
  nationality?: string
}

export interface BokunProductBooking {
  startTimeId: string
  experienceId: string
  participants: BokunParticipant[]
  notes?: string
}

export interface BokunParticipant {
  ageBand: string
  count: number
}

export interface BokunWebhookPayload {
  event: 'BOOKING_CREATED' | 'BOOKING_CONFIRMED' | 'BOOKING_CANCELLED' | 'PAYMENT_RECEIVED'
  bookingId: string
  booking: BokunBooking
  timestamp: number // UTC milliseconds
  signature: string
}

export interface BokunApiError {
  errorCode: string
  message: string
  details?: string
}

// Request types
export interface CreateBookingRequest {
  experienceId: string
  startTimeId: string
  customer: BokunCustomer
  participants: BokunParticipant[]
  notes?: string
  promoCode?: string
}

export interface AvailabilityRequest {
  experienceId: string
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
}
```

### Step 2: Create API Client with HMAC Authentication

```typescript
// apps/web/lib/bokun/bokun-api-client.ts
import { createHmac } from 'crypto'
import type { BokunApiError } from './bokun-types'

const BOKUN_TEST_URL = 'https://api.bokuntest.com'
const BOKUN_PROD_URL = 'https://api.bokun.io'

/**
 * Bokun API client with HMAC signature authentication.
 * Handles rate limiting with exponential backoff.
 */
export class BokunApiClient {
  private accessKey: string
  private secretKey: string
  private baseUrl: string

  constructor() {
    this.accessKey = process.env.BOKUN_API_KEY!
    this.secretKey = process.env.BOKUN_SECRET_KEY!
    this.baseUrl = process.env.NODE_ENV === 'production' ? BOKUN_PROD_URL : BOKUN_TEST_URL

    if (!this.accessKey || !this.secretKey) {
      throw new Error('Bokun API credentials not configured')
    }
  }

  /**
   * Generate HMAC signature for Bokun API authentication.
   * Signature = HMAC-SHA1(secretKey, date + accessKey + method + path)
   */
  private generateSignature(method: string, path: string, date: string): string {
    const stringToSign = `${date}${this.accessKey}${method.toUpperCase()}${path}`
    const hmac = createHmac('sha1', this.secretKey)
    hmac.update(stringToSign)
    return hmac.digest('base64')
  }

  /**
   * Make authenticated request to Bokun API.
   * Implements retry with exponential backoff for rate limits.
   */
  async fetch<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    const method = options.method || 'GET'
    const date = new Date().toISOString()
    const signature = this.generateSignature(method, endpoint, date)

    const headers: HeadersInit = {
      'X-Bokun-AccessKey': this.accessKey,
      'X-Bokun-Date': date,
      'X-Bokun-Signature': signature,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    })

    // Handle rate limiting with exponential backoff
    if (response.status === 429) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '5', 10)
      const maxRetries = 3

      if (retryCount < maxRetries) {
        const delay = Math.min(retryAfter * 1000 * Math.pow(2, retryCount), 30000)
        await new Promise((resolve) => setTimeout(resolve, delay))
        return this.fetch<T>(endpoint, options, retryCount + 1)
      }

      throw new BokunError('Rate limit exceeded', 429)
    }

    if (!response.ok) {
      const error: BokunApiError = await response.json().catch(() => ({
        errorCode: 'UNKNOWN',
        message: response.statusText,
      }))
      throw new BokunError(error.message, response.status, error.errorCode)
    }

    return response.json()
  }
}

export class BokunError extends Error {
  constructor(
    message: string,
    public status: number,
    public errorCode?: string
  ) {
    super(message)
    this.name = 'BokunError'
  }
}

// Singleton instance
export const bokunClient = new BokunApiClient()
```

### Step 3: Create Availability Service

```typescript
// apps/web/lib/bokun/bokun-availability.ts
import { unstable_cache } from 'next/cache'
import { bokunClient } from './bokun-api-client'
import type { BokunAvailability, AvailabilityRequest } from './bokun-types'

interface AvailabilityResponse {
  availabilities: BokunAvailability[]
}

/**
 * Fetch availability slots for an experience.
 * Returns sessions with pricing and capacity.
 */
export async function getBokunAvailability(
  params: AvailabilityRequest
): Promise<BokunAvailability[]> {
  const { experienceId, startDate, endDate } = params

  const queryParams = new URLSearchParams({
    start: startDate,
    end: endDate,
  })

  const data = await bokunClient.fetch<AvailabilityResponse>(
    `/restapi/v2.0/activity/${experienceId}/availabilities?${queryParams}`
  )

  // Filter out fully booked sessions
  return data.availabilities.filter(
    (slot) => slot.unlimitedAvailability || slot.availabilityCount > 0
  )
}

/**
 * Cached availability fetcher.
 * 60 second TTL for near-real-time accuracy while reducing API calls.
 */
export const getCachedBokunAvailability = unstable_cache(
  getBokunAvailability,
  ['bokun-availability'],
  {
    revalidate: 60, // 60 seconds
    tags: ['bokun-availability'],
  }
)

/**
 * Group availability by date for calendar display.
 */
export function groupAvailabilityByDate(
  availabilities: BokunAvailability[]
): Map<string, BokunAvailability[]> {
  const dateMap = new Map<string, BokunAvailability[]>()

  for (const slot of availabilities) {
    const date = slot.date.split('T')[0] // YYYY-MM-DD
    if (!dateMap.has(date)) {
      dateMap.set(date, [])
    }
    dateMap.get(date)!.push(slot)
  }

  return dateMap
}
```

### Step 4: Create Booking Service

```typescript
// apps/web/lib/bokun/bokun-booking.ts
import { bokunClient } from './bokun-api-client'
import type { BokunBooking, CreateBookingRequest } from './bokun-types'

interface BookingResponse {
  booking: BokunBooking
  checkoutUrl?: string
}

/**
 * Create a booking via Bokun API.
 * Returns booking confirmation and optional checkout URL.
 */
export async function createBokunBooking(
  params: CreateBookingRequest
): Promise<BookingResponse> {
  const requestBody = {
    experienceId: params.experienceId,
    startTimeId: params.startTimeId,
    customer: {
      firstName: params.customer.firstName,
      lastName: params.customer.lastName,
      email: params.customer.email,
      phone: params.customer.phone || '',
      nationality: params.customer.nationality || '',
    },
    participants: params.participants,
    notes: params.notes || '',
    promoCode: params.promoCode,
  }

  const response = await bokunClient.fetch<BookingResponse>('/restapi/v2.0/booking', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  })

  return response
}

/**
 * Get booking details by ID.
 */
export async function getBokunBooking(bookingId: string): Promise<BokunBooking> {
  const response = await bokunClient.fetch<{ booking: BokunBooking }>(
    `/restapi/v2.0/booking/${bookingId}`
  )
  return response.booking
}

/**
 * Generate Bokun widget checkout URL.
 * Used when redirecting to Bokun hosted checkout.
 */
export function getBokunWidgetUrl(
  bookingChannelUUID: string,
  experienceId: string
): string {
  return `https://widgets.bokun.io/online-sales/${bookingChannelUUID}/experience-calendar/${experienceId}`
}
```

### Step 5: Create Availability API Route

```typescript
// apps/web/app/api/bokun/availability/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCachedBokunAvailability, groupAvailabilityByDate } from '@/lib/bokun/bokun-availability'
import { BokunError } from '@/lib/bokun/bokun-api-client'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const experienceId = searchParams.get('experienceId')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  // Validate required params
  if (!experienceId || !startDate || !endDate) {
    return NextResponse.json(
      { error: 'Missing required parameters: experienceId, startDate, endDate' },
      { status: 400 }
    )
  }

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
    return NextResponse.json(
      { error: 'Invalid date format. Use YYYY-MM-DD' },
      { status: 400 }
    )
  }

  try {
    const availabilities = await getCachedBokunAvailability({
      experienceId,
      startDate,
      endDate,
    })

    const grouped = groupAvailabilityByDate(availabilities)

    return NextResponse.json({
      experienceId,
      startDate,
      endDate,
      availabilities,
      byDate: Object.fromEntries(grouped),
    })
  } catch (error) {
    console.error('[Bokun Availability]', error)

    if (error instanceof BokunError) {
      return NextResponse.json(
        { error: error.message, code: error.errorCode },
        { status: error.status }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    )
  }
}
```

### Step 6: Create Webhook Handler

```typescript
// apps/web/app/api/bokun/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import type { BokunWebhookPayload, BokunBooking } from '@/lib/bokun/bokun-types'

/**
 * Verify Bokun webhook signature.
 * Signature = HMAC-SHA256(webhookSecret, rawBody)
 */
function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const webhookSecret = process.env.BOKUN_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('BOKUN_WEBHOOK_SECRET not configured')
    return false
  }

  const expectedSignature = createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex')

  return signature === expectedSignature
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-bokun-signature') || ''

  // Verify webhook signature
  if (!verifyWebhookSignature(rawBody, signature)) {
    console.error('[Bokun Webhook] Invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: BokunWebhookPayload
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  console.log(`[Bokun Webhook] Event: ${payload.event}, Booking: ${payload.bookingId}`)

  try {
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
        console.log(`[Bokun Webhook] Unhandled event: ${payload.event}`)
    }

    return NextResponse.json({ received: true, event: payload.event })
  } catch (error) {
    console.error('[Bokun Webhook] Processing error:', error)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}

async function handleBookingCreated(booking: BokunBooking) {
  console.log(`[Bokun] Booking created: ${booking.confirmationCode}`)
  // TODO: Send confirmation email via email service
  // TODO: Log booking to database (optional tracking)
}

async function handleBookingConfirmed(booking: BokunBooking) {
  console.log(`[Bokun] Booking confirmed: ${booking.confirmationCode}`)
  // TODO: Send confirmation email if not already sent
}

async function handleBookingCancelled(booking: BokunBooking) {
  console.log(`[Bokun] Booking cancelled: ${booking.confirmationCode}`)
  // TODO: Send cancellation email
  // TODO: Update database record
}

async function handlePaymentReceived(booking: BokunBooking) {
  console.log(`[Bokun] Payment received for: ${booking.confirmationCode}`)
  // TODO: Update payment status in database
}
```

### Step 7: Create Bokun Widget Component

```typescript
// apps/web/components/bokun-widget.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface BokunWidgetProps {
  experienceId: string
  className?: string
}

declare global {
  interface Window {
    BokunWidgets?: {
      init: () => void
    }
  }
}

const BOKUN_WIDGET_SCRIPT_URL = 'https://widgets.bokun.io/assets/javascripts/apps/build/BokunWidgetsLoader.js'

/**
 * Bokun booking widget wrapper for React/Next.js.
 * Loads Bokun script and renders iframe-based booking calendar.
 */
export function BokunWidget({ experienceId, className = '' }: BokunWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const bookingChannelUUID = process.env.NEXT_PUBLIC_BOKUN_UUID

  useEffect(() => {
    if (!bookingChannelUUID) {
      setError('Bokun configuration missing')
      setLoading(false)
      return
    }

    // Check if script already loaded
    const existingScript = document.querySelector(
      `script[src*="BokunWidgetsLoader.js"]`
    )

    if (existingScript && window.BokunWidgets) {
      // Re-initialize widgets for this container
      window.BokunWidgets.init()
      setLoading(false)
      return
    }

    // Load Bokun script
    const script = document.createElement('script')
    script.src = `${BOKUN_WIDGET_SCRIPT_URL}?bookingChannelUUID=${bookingChannelUUID}`
    script.async = true

    script.onload = () => {
      setLoading(false)
      // Script auto-initializes, but trigger manual init for dynamic content
      if (window.BokunWidgets) {
        window.BokunWidgets.init()
      }
    }

    script.onerror = () => {
      setError('Failed to load booking widget')
      setLoading(false)
    }

    document.head.appendChild(script)

    return () => {
      // Cleanup not needed - script persists across navigations
    }
  }, [bookingChannelUUID, experienceId])

  if (error) {
    return (
      <div className={`rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center ${className}`}>
        <p className="text-sm text-destructive">{error}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Please try again later or contact us for assistance.
        </p>
      </div>
    )
  }

  return (
    <div className={className}>
      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      )}
      <div
        ref={containerRef}
        className="bokunWidget"
        data-src={`https://widgets.bokun.io/online-sales/${bookingChannelUUID}/experience-calendar/${experienceId}`}
        style={{ display: loading ? 'none' : 'block' }}
      />
    </div>
  )
}
```

### Step 8: Create React Hook for Availability

```typescript
// apps/web/lib/hooks/use-bokun-availability.ts
'use client'

import { useState, useEffect, useCallback } from 'react'
import { format, addDays } from 'date-fns'
import type { BokunAvailability } from '@/lib/bokun/bokun-types'

interface UseBokunAvailabilityOptions {
  experienceId: string
  startDate?: Date
  endDate?: Date
  enabled?: boolean
}

interface UseBokunAvailabilityResult {
  availabilities: BokunAvailability[]
  byDate: Map<string, BokunAvailability[]>
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * React hook for fetching Bokun availability.
 * Automatically fetches 60 days of availability on mount.
 */
export function useBokunAvailability({
  experienceId,
  startDate,
  endDate,
  enabled = true,
}: UseBokunAvailabilityOptions): UseBokunAvailabilityResult {
  const [availabilities, setAvailabilities] = useState<BokunAvailability[]>([])
  const [byDate, setByDate] = useState<Map<string, BokunAvailability[]>>(new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAvailability = useCallback(async () => {
    if (!experienceId || !enabled) return

    setLoading(true)
    setError(null)

    const start = startDate || new Date()
    const end = endDate || addDays(new Date(), 60)

    try {
      const params = new URLSearchParams({
        experienceId,
        startDate: format(start, 'yyyy-MM-dd'),
        endDate: format(end, 'yyyy-MM-dd'),
      })

      const response = await fetch(`/api/bokun/availability?${params}`)

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch availability')
      }

      const data = await response.json()
      setAvailabilities(data.availabilities)

      // Convert byDate object to Map
      const dateMap = new Map<string, BokunAvailability[]>()
      for (const [date, slots] of Object.entries(data.byDate)) {
        dateMap.set(date, slots as BokunAvailability[])
      }
      setByDate(dateMap)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      console.error('[useBokunAvailability]', err)
    } finally {
      setLoading(false)
    }
  }, [experienceId, startDate, endDate, enabled])

  useEffect(() => {
    fetchAvailability()
  }, [fetchAvailability])

  return {
    availabilities,
    byDate,
    loading,
    error,
    refetch: fetchAvailability,
  }
}
```

### Step 9: Update Booking Section Component

```typescript
// apps/web/components/tour/booking-section.tsx (updated)
'use client'

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Users, MapPin, Shield, Calendar, AlertCircle } from 'lucide-react'
import { formatDuration, formatPrice } from '@/lib/utils'
import { BokunWidget } from '@/components/bokun-widget'
import type { TourDetail } from '@/lib/api/get-tour-by-slug'

interface BookingSectionProps {
  tour: TourDetail
}

/**
 * Sticky booking sidebar for tour detail page.
 * Integrates Bokun widget for booking calendar and checkout.
 */
export function BookingSection({ tour }: BookingSectionProps) {
  const t = useTranslations('tourDetail.booking')

  const hasBokunIntegration = Boolean(tour.bokunExperienceId)

  return (
    <Card className="sticky top-24">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg">{t('bookNow')}</span>
        </CardTitle>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-[var(--color-primary)]">
            {formatPrice(tour.price)}
          </span>
          <span className="text-sm text-[var(--color-text-muted)]">{t('perPerson')}</span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Tour Quick Info */}
        <div className="space-y-3 rounded-lg bg-[var(--color-surface)] p-4 text-sm">
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-[var(--color-primary)]" />
            <span>
              {t('duration')}: {formatDuration(tour.duration)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Users className="h-4 w-4 text-[var(--color-primary)]" />
            <span>{t('maxGroup', { count: tour.maxCapacity })}</span>
          </div>
          {tour.logistics?.meetingPointName && (
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-[var(--color-primary)]" />
              <span className="line-clamp-1">{tour.logistics.meetingPointName}</span>
            </div>
          )}
        </div>

        {/* Bokun Widget (Primary) */}
        {hasBokunIntegration && (
          <BokunWidget
            experienceId={tour.bokunExperienceId!}
            className="min-h-[300px]"
          />
        )}

        {/* Inquiry Form Fallback - no Bokun integration */}
        {!hasBokunIntegration && (
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-[var(--color-primary)]" />
              <div>
                <p className="font-medium">{t('inquireAboutTour')}</p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {t('contactUsForAvailability')}
                </p>
              </div>
            </div>
            <Button className="mt-4 w-full" variant="outline" asChild>
              <a href={`mailto:info@heritageguiding.com?subject=${encodeURIComponent(tour.title)}`}>
                {t('sendInquiry')}
              </a>
            </Button>
          </div>
        )}

        {/* Trust Signals */}
        <div className="space-y-2 pt-2 text-center text-xs text-[var(--color-text-muted)]">
          <p className="flex items-center justify-center gap-1">
            <Shield className="h-3 w-3" />
            {t('freeCancellation')}
          </p>
          <p>{t('instantConfirmation')}</p>
        </div>
      </CardContent>
    </Card>
  )
}
```

### Step 10: Add CMS Field for Bokun Experience ID

```typescript
// packages/cms/collections/Tours.ts (add to fields array)
{
  name: 'bokunExperienceId',
  type: 'text',
  label: 'Bokun Experience ID',
  admin: {
    description: 'Bokun experience/activity ID for booking integration',
    position: 'sidebar',
  },
  index: true,
}
```

### Step 11: Environment Variables

```bash
# .env.example (add these)

# Bokun API Configuration
BOKUN_API_KEY=your-bokun-access-key
BOKUN_SECRET_KEY=your-bokun-secret-key
BOKUN_WEBHOOK_SECRET=your-webhook-secret-for-validation

# Bokun Widget (public - exposed to browser)
NEXT_PUBLIC_BOKUN_UUID=your-booking-channel-uuid
```

## Todo List

- [x] Create `bokun-types.ts` with TypeScript interfaces
- [x] Create `bokun-api-client.ts` with HMAC authentication
- [x] Create `bokun-availability.ts` service with caching
- [x] Create `bokun-booking.ts` service
- [x] Create `/api/bokun/availability` route
- [x] Create `/api/bokun/webhook` route
- [x] Create `bokun-widget.tsx` component
- [ ] Create `use-bokun-availability.ts` hook (deferred - widget-based approach used)
- [x] Update `booking-section.tsx` with Bokun widget
- [x] Add `bokunExperienceId` field to Tours collection
- [x] Create `Bookings` collection in Payload CMS
- [ ] Add email service for confirmation emails (deferred - Phase 10)
- [x] Add environment variables to `.env.example`
- [ ] Test HMAC signature generation (requires Bokun credentials)
- [ ] Test availability API caching (requires Bokun credentials)
- [ ] Test webhook signature verification (requires Bokun credentials)
- [ ] Test widget loading and checkout flow (requires Bokun credentials)
- [ ] Configure webhook URL in Bokun dashboard (requires Bokun access)
- [ ] Test rate limit handling (429 response) (requires Bokun credentials)
- [x] Verify i18n language coordination (translations added)

## Success Criteria

- [ ] Bokun widget loads on tour detail page
- [ ] Availability calendar shows real Bokun data
- [ ] Checkout flow completes in embedded iframe
- [ ] Webhook receives booking confirmations
- [ ] Rate limiting handled with exponential backoff
- [ ] 60-second cache reduces API calls
- [ ] HMAC signatures validated successfully
- [ ] Fallback to inquiry form when no integration
- [ ] Environment toggle between test/prod URLs
- [ ] All TypeScript types compile without errors

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| HMAC signature mismatch | Medium | High | Test signature generation against Bokun test API |
| Bokun API downtime | Low | High | Fallback to inquiry form + cache recent data |
| Rate limit exceeded (400/min) | Medium | Medium | 60s cache + exponential backoff |
| Widget iframe blocked | Low | Medium | CSP headers configured; fallback to API flow |
| Webhook delivery failures | Medium | Medium | Retry logic + manual reconciliation |
| Test vs Prod URL confusion | Low | High | Environment-based URL selection |
| Monetary float precision | Medium | High | All prices as strings per Bokun spec |

## Security Considerations

1. **API Credentials**: Store `BOKUN_API_KEY` and `BOKUN_SECRET_KEY` in environment variables only
2. **HMAC Signatures**: Never log or expose signature components
3. **Webhook Validation**: Always verify `x-bokun-signature` header before processing
4. **Input Validation**: Validate all user input before API calls (date format, IDs)
5. **Rate Limiting**: Implement server-side throttling to prevent abuse
6. **HTTPS Only**: All Bokun API calls over HTTPS
7. **Error Messages**: Don't expose internal error details to frontend
8. **Booking Channel**: Ensure correct channel UUID for permission scoping

## Next Steps

After Phase 08.1 completion:

1. **Phase 08.2**: Implement Rezdy integration (parallel booking system)
2. **Phase 09**: Group Bookings + WhatsApp inquiry for 10+ guests
3. **Phase 10**: Email confirmation templates (booking success)
4. **Testing**: E2E tests for full booking flow with Cypress/Playwright
5. **Monitoring**: Add logging/alerting for webhook failures

---

---

## Security Review Findings (2026-02-01)

**Reviewed By:** code-reviewer (a5af0b8)
**Review Report:** [code-reviewer-260201-0120-bokun-integration.md](../reports/code-reviewer-260201-0120-bokun-integration.md)

**Critical Issues (Block Deployment):**
1. ⚠️ Timing attack vulnerability in webhook signature verification - use `crypto.timingSafeEqual()`
2. ⚠️ Missing request body size limit (DoS vector) - add 1MB limit
3. ⚠️ Potential credential exposure in client component - add runtime validation
4. ⚠️ Unsafe date parsing without validation - implement proper date validation
5. ⚠️ Race condition in singleton instantiation - remove redundant instance pattern

**Important Issues (Before Launch):**
6. Missing input sanitization in experienceId
7. Constructor allows missing credentials (should throw)
8. Webhook returns 200 on processing errors (should 500 for retry)
9. No origin validation on webhook endpoint
10. Cache invalidation not implemented

**Action Required:**
- Address all 5 Critical issues before any production deployment
- Fix Important issues 6-10 before public launch
- Review Medium/Low priority issues (10 items) as tech debt

**Build Status:** ✅ PASSING (Next.js build successful)
**Type Safety:** ✅ PASSING (no TypeScript errors)
**Linting:** ⚠️ 7 warnings (unused vars - non-critical)
**Security:** ❌ BLOCKED (5 critical vulnerabilities)

**Next Steps:**
1. Fix 5 critical security issues (estimated 4-6h)
2. Run penetration test on webhook endpoint
3. Verify HMAC signatures with Bokun test API
4. Load test availability caching under high traffic
5. Update plan status to `production-ready`

---

**Unresolved Questions:**

1. Exact HMAC algorithm confirmed as SHA1? (Research mentions SHA256 for webhook, SHA1 for API)
2. Webhook retry policy from Bokun side? (Need to check dashboard settings)
3. Multi-currency support in widget? (Check Bokun dashboard config)
4. Custom booking form fields API? (For collecting dietary requirements, etc.)
5. Booking modification/cancellation API endpoints? (Not covered in initial research)
6. Webhook IP whitelist? (Should endpoint only accept Bokun IPs?)
7. Credential rotation mechanism? (How to rotate keys without redeployment?)
