# Phase 08: Rezdy Integration

> **SUPERSEDED:** This phase was replaced by Phase 08.1 (Bokun Integration) in February 2026. Bokun was selected as the sole booking provider. This document is retained for historical reference.

## Context Links

- [MVP Project Plan](../../docs/MVP-PROJECT-PLAN.md)
- [Rezdy API Research](./research/researcher-02-rezdy-api-integration.md)
- [Tour Details](./phase-07-tour-details.md)
- [Rezdy API Docs](https://developers.rezdy.com/)

## Overview

| Priority | Status | Effort |
|----------|--------|--------|
| P2 - Superseded | superseded by Phase 08.1 (Bokun) | 24-28h |

Integrate Rezdy booking API for availability checking, session selection, and booking creation. Implement webhook handler for booking confirmations.

## Key Insights

- Rezdy API for Agents: resell supplier products
- REST API with API Key authentication
- Rate limit: 100 calls/minute
- Sessions = time slots with capacity + pricing
- Webhooks for booking status updates

## Requirements

### Functional
- Display real-time availability for tours
- Date picker showing available sessions
- Session selection with capacity indicator
- Redirect to Rezdy checkout OR embedded booking
- Receive booking confirmations via webhook

### Non-Functional
- Cache availability data (15-30 min TTL)
- Handle API rate limiting gracefully
- Fallback to inquiry form if API fails
- Webhook endpoint secured with signature verification

## Architecture

### Booking Flow

```
User selects tour
       ↓
Fetch availability from Rezdy API
       ↓
Display available dates/sessions
       ↓
User selects date + session
       ↓
Option A: Redirect to Rezdy checkout
Option B: Create booking via API
       ↓
Rezdy processes payment
       ↓
Webhook receives confirmation
       ↓
Display confirmation to user
```

### Data Flow

```
Frontend          Next.js API           Rezdy API
    │                  │                    │
    │──GET /api/availability──►│                    │
    │                  │──GET /availability──►│
    │                  │◄──sessions[]────────│
    │◄──sessions[]─────│                    │
    │                  │                    │
    │──POST /api/book──►│                    │
    │                  │──POST /bookings────►│
    │                  │◄──booking──────────│
    │◄──redirect URL───│                    │
```

## Related Code Files

### Create
- `apps/web/lib/rezdy/client.ts` - Rezdy API client
- `apps/web/lib/rezdy/types.ts` - TypeScript types
- `apps/web/lib/rezdy/availability.ts` - Availability service
- `apps/web/lib/rezdy/booking.ts` - Booking service
- `apps/web/app/api/rezdy/availability/route.ts` - Availability API
- `apps/web/app/api/rezdy/webhook/route.ts` - Webhook handler
- `apps/web/components/booking/availability-calendar.tsx` - Date picker
- `apps/web/components/booking/session-picker.tsx` - Time slots
- `apps/web/components/booking/booking-form.tsx` - Booking form
- `apps/web/app/[locale]/booking/confirmation/page.tsx` - Confirmation

### Modify
- `apps/web/components/tour/booking-section.tsx` - Add Rezdy
- `.env.example` - Add Rezdy env vars

## Implementation Steps

1. **Create Rezdy API Client**
   ```typescript
   // apps/web/lib/rezdy/client.ts
   const REZDY_API_URL = 'https://api.rezdy.com/v1'

   export class RezdyClient {
     private apiKey: string

     constructor() {
       this.apiKey = process.env.REZDY_API_KEY!
     }

     async fetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
       const response = await fetch(`${REZDY_API_URL}${endpoint}`, {
         ...options,
         headers: {
           'X-API-Key': this.apiKey,
           'Content-Type': 'application/json',
           ...options.headers
         }
       })

       if (!response.ok) {
         const error = await response.json()
         throw new RezdyError(error.message, response.status)
       }

       return response.json()
     }
   }

   export class RezdyError extends Error {
     constructor(message: string, public status: number) {
       super(message)
       this.name = 'RezdyError'
     }
   }

   export const rezdyClient = new RezdyClient()
   ```

2. **Define TypeScript Types**
   ```typescript
   // apps/web/lib/rezdy/types.ts
   export interface RezdyProduct {
     productCode: string
     name: string
     shortDescription: string
     priceOptions: RezdyPriceOption[]
   }

   export interface RezdyPriceOption {
     id: string
     price: number
     label: string
   }

   export interface RezdySession {
     id: string
     startTime: string
     endTime: string
     seatsAvailable: number
     totalCapacity: number
     priceOptions: RezdyPriceOption[]
   }

   export interface RezdyAvailability {
     productCode: string
     sessions: RezdySession[]
   }

   export interface RezdyBooking {
     orderNumber: string
     status: string
     totalAmount: number
     customer: {
       firstName: string
       lastName: string
       email: string
     }
     items: Array<{
       productName: string
       startTime: string
       participants: number
     }>
   }

   export interface RezdyWebhookPayload {
     event: 'BOOKING_CREATED' | 'BOOKING_UPDATED' | 'BOOKING_CANCELLED'
     booking: RezdyBooking
     timestamp: string
   }
   ```

3. **Create Availability Service**
   ```typescript
   // apps/web/lib/rezdy/availability.ts
   import { rezdyClient } from './client'
   import { RezdyAvailability, RezdySession } from './types'
   import { unstable_cache } from 'next/cache'

   export async function getAvailability(
     productCode: string,
     startDate: string,
     endDate: string
   ): Promise<RezdySession[]> {
     const params = new URLSearchParams({
       startTime: startDate,
       endTime: endDate
     })

     const data = await rezdyClient.fetch<RezdyAvailability>(
       `/products/${productCode}/availability?${params}`
     )

     return data.sessions
   }

   // Cached version for repeated requests
   export const getCachedAvailability = unstable_cache(
     getAvailability,
     ['rezdy-availability'],
     { revalidate: 900 } // 15 minutes
   )
   ```

4. **Create Booking Service**
   ```typescript
   // apps/web/lib/rezdy/booking.ts
   import { rezdyClient } from './client'
   import { RezdyBooking } from './types'

   interface CreateBookingParams {
     productCode: string
     sessionId: string
     customer: {
       firstName: string
       lastName: string
       email: string
       phone?: string
     }
     participants: number
     priceOptionId: string
   }

   export async function createBooking(
     params: CreateBookingParams
   ): Promise<RezdyBooking> {
     const booking = await rezdyClient.fetch<{ booking: RezdyBooking }>(
       '/bookings',
       {
         method: 'POST',
         body: JSON.stringify({
           productCode: params.productCode,
           sessionId: params.sessionId,
           customer: params.customer,
           quantities: [
             {
               priceOption: params.priceOptionId,
               value: params.participants
             }
           ]
         })
       }
     )

     return booking.booking
   }

   export async function getBookingCheckoutUrl(
     productCode: string,
     sessionId: string
   ): Promise<string> {
     // Return Rezdy hosted checkout URL
     return `https://heritageguiding.rezdy.com/checkout/${productCode}?session=${sessionId}`
   }
   ```

5. **Create Availability API Route**
   ```typescript
   // apps/web/app/api/rezdy/availability/route.ts
   import { NextRequest, NextResponse } from 'next/server'
   import { getCachedAvailability } from '@/lib/rezdy/availability'

   export async function GET(request: NextRequest) {
     const { searchParams } = new URL(request.url)
     const productCode = searchParams.get('productCode')
     const startDate = searchParams.get('startDate')
     const endDate = searchParams.get('endDate')

     if (!productCode || !startDate || !endDate) {
       return NextResponse.json(
         { error: 'Missing required parameters' },
         { status: 400 }
       )
     }

     try {
       const sessions = await getCachedAvailability(
         productCode,
         startDate,
         endDate
       )

       return NextResponse.json({ sessions })
     } catch (error) {
       console.error('Availability fetch error:', error)
       return NextResponse.json(
         { error: 'Failed to fetch availability' },
         { status: 500 }
       )
     }
   }
   ```

6. **Create Webhook Handler**
   ```typescript
   // apps/web/app/api/rezdy/webhook/route.ts
   import { NextRequest, NextResponse } from 'next/server'
   import { RezdyWebhookPayload } from '@/lib/rezdy/types'
   import { headers } from 'next/headers'

   export async function POST(request: NextRequest) {
     const headersList = headers()
     const signature = headersList.get('x-rezdy-signature')

     // Verify webhook signature
     // TODO: Implement signature verification

     const payload: RezdyWebhookPayload = await request.json()

     switch (payload.event) {
       case 'BOOKING_CREATED':
         await handleBookingCreated(payload.booking)
         break
       case 'BOOKING_UPDATED':
         await handleBookingUpdated(payload.booking)
         break
       case 'BOOKING_CANCELLED':
         await handleBookingCancelled(payload.booking)
         break
     }

     return NextResponse.json({ received: true })
   }

   async function handleBookingCreated(booking: RezdyBooking) {
     // Send confirmation email
     // Log booking in database (optional)
     console.log('Booking created:', booking.orderNumber)
   }

   async function handleBookingUpdated(booking: RezdyBooking) {
     console.log('Booking updated:', booking.orderNumber)
   }

   async function handleBookingCancelled(booking: RezdyBooking) {
     console.log('Booking cancelled:', booking.orderNumber)
   }
   ```

7. **Build Availability Calendar**
   ```typescript
   // apps/web/components/booking/availability-calendar.tsx
   'use client'

   import { useState, useEffect } from 'react'
   import { Calendar } from '@/components/ui/calendar'
   import { useTranslations } from 'next-intl'
   import { RezdySession } from '@/lib/rezdy/types'
   import { addDays, format, startOfMonth, endOfMonth } from 'date-fns'

   interface Props {
     productCode: string
     onSelectDate: (date: Date, sessions: RezdySession[]) => void
   }

   export function AvailabilityCalendar({ productCode, onSelectDate }: Props) {
     const [selectedDate, setSelectedDate] = useState<Date>()
     const [availableDates, setAvailableDates] = useState<Map<string, RezdySession[]>>(new Map())
     const [loading, setLoading] = useState(true)
     const t = useTranslations('booking')

     useEffect(() => {
       fetchAvailability()
     }, [productCode])

     async function fetchAvailability() {
       const startDate = format(new Date(), 'yyyy-MM-dd')
       const endDate = format(addDays(new Date(), 60), 'yyyy-MM-dd')

       try {
         const response = await fetch(
           `/api/rezdy/availability?productCode=${productCode}&startDate=${startDate}&endDate=${endDate}`
         )
         const { sessions } = await response.json()

         // Group sessions by date
         const dateMap = new Map<string, RezdySession[]>()
         sessions.forEach((session: RezdySession) => {
           const date = format(new Date(session.startTime), 'yyyy-MM-dd')
           if (!dateMap.has(date)) {
             dateMap.set(date, [])
           }
           dateMap.get(date)!.push(session)
         })

         setAvailableDates(dateMap)
       } catch (error) {
         console.error('Failed to fetch availability:', error)
       } finally {
         setLoading(false)
       }
     }

     const handleSelect = (date: Date | undefined) => {
       if (!date) return
       setSelectedDate(date)
       const dateKey = format(date, 'yyyy-MM-dd')
       const sessions = availableDates.get(dateKey) || []
       onSelectDate(date, sessions)
     }

     const isDateAvailable = (date: Date) => {
       const dateKey = format(date, 'yyyy-MM-dd')
       return availableDates.has(dateKey)
     }

     return (
       <div>
         <h3 className="font-semibold">{t('selectDate')}</h3>
         <Calendar
           mode="single"
           selected={selectedDate}
           onSelect={handleSelect}
           disabled={(date) => !isDateAvailable(date)}
           className="mt-4 rounded-md border"
         />
       </div>
     )
   }
   ```

8. **Build Session Picker**
   ```typescript
   // apps/web/components/booking/session-picker.tsx
   'use client'

   import { RezdySession } from '@/lib/rezdy/types'
   import { Button } from '@/components/ui/button'
   import { format } from 'date-fns'
   import { Clock, Users } from 'lucide-react'
   import { cn } from '@/lib/utils'

   interface Props {
     sessions: RezdySession[]
     selectedSession: RezdySession | null
     onSelect: (session: RezdySession) => void
   }

   export function SessionPicker({ sessions, selectedSession, onSelect }: Props) {
     if (sessions.length === 0) {
       return <p className="text-muted-foreground">No sessions available</p>
     }

     return (
       <div className="mt-4 space-y-2">
         <h3 className="font-semibold">Select Time</h3>
         <div className="grid gap-2">
           {sessions.map((session) => (
             <Button
               key={session.id}
               variant={selectedSession?.id === session.id ? 'default' : 'outline'}
               className={cn(
                 'justify-start',
                 session.seatsAvailable < 3 && 'border-orange-500'
               )}
               onClick={() => onSelect(session)}
               disabled={session.seatsAvailable === 0}
             >
               <Clock className="mr-2 h-4 w-4" />
               {format(new Date(session.startTime), 'HH:mm')}
               <span className="ml-auto flex items-center gap-1 text-sm">
                 <Users className="h-3 w-3" />
                 {session.seatsAvailable} left
               </span>
             </Button>
           ))}
         </div>
       </div>
     )
   }
   ```

9. **Update Booking Section**
   ```typescript
   // apps/web/components/tour/booking-section.tsx (updated)
   'use client'

   import { useState } from 'react'
   import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
   import { Button } from '@/components/ui/button'
   import { AvailabilityCalendar } from '@/components/booking/availability-calendar'
   import { SessionPicker } from '@/components/booking/session-picker'
   import { RezdySession } from '@/lib/rezdy/types'
   import { getBookingCheckoutUrl } from '@/lib/rezdy/booking'

   export function BookingSection({ tour }) {
     const [selectedDate, setSelectedDate] = useState<Date>()
     const [sessions, setSessions] = useState<RezdySession[]>([])
     const [selectedSession, setSelectedSession] = useState<RezdySession | null>(null)

     const handleDateSelect = (date: Date, dateSessions: RezdySession[]) => {
       setSelectedDate(date)
       setSessions(dateSessions)
       setSelectedSession(null)
     }

     const handleBook = async () => {
       if (!selectedSession) return
       const checkoutUrl = await getBookingCheckoutUrl(
         tour.rezdyProductCode,
         selectedSession.id
       )
       window.location.href = checkoutUrl
     }

     return (
       <Card className="sticky top-24">
         <CardHeader>
           <CardTitle>Book This Tour</CardTitle>
           <p className="text-3xl font-bold">{tour.price} SEK</p>
         </CardHeader>
         <CardContent className="space-y-6">
           <AvailabilityCalendar
             productCode={tour.rezdyProductCode}
             onSelectDate={handleDateSelect}
           />

           {selectedDate && (
             <SessionPicker
               sessions={sessions}
               selectedSession={selectedSession}
               onSelect={setSelectedSession}
             />
           )}

           <Button
             className="w-full"
             size="lg"
             disabled={!selectedSession}
             onClick={handleBook}
           >
             Book Now
           </Button>
         </CardContent>
       </Card>
     )
   }
   ```

10. **Add Environment Variables**
    ```bash
    # .env.example
    REZDY_API_KEY=your-rezdy-api-key
    REZDY_WEBHOOK_SECRET=your-webhook-secret
    NEXT_PUBLIC_REZDY_PARTNER_ID=your-partner-id
    ```

## Todo List

- [ ] Create Rezdy API client with auth
- [ ] Define TypeScript types for Rezdy
- [ ] Implement availability service
- [ ] Implement booking service
- [ ] Create availability API route
- [ ] Create webhook handler route
- [ ] Build AvailabilityCalendar component
- [ ] Build SessionPicker component
- [ ] Update BookingSection with Rezdy
- [ ] Add environment variables
- [ ] Implement caching strategy
- [ ] Add error handling + fallbacks
- [ ] Test booking flow end-to-end
- [ ] Configure webhook endpoint in Rezdy
- [ ] Verify webhook signature

## Success Criteria

- [ ] Availability calendar shows real Rezdy data
- [ ] Session picker displays time slots
- [ ] Booking redirects to Rezdy checkout
- [ ] Webhook receives booking confirmations
- [ ] Rate limiting handled gracefully
- [ ] Fallback to inquiry form works
- [ ] All error states have UI feedback

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Rezdy API downtime | Low | High | Fallback to inquiry form |
| Rate limit exceeded | Medium | Medium | Cache + throttle requests |
| Webhook failures | Medium | Medium | Retry logic + alerts |
| Payment failures | Low | High | Clear error messaging |

## Security Considerations

- Store API key in environment variables only
- Verify webhook signatures
- Validate all user input before API calls
- Never expose API key to frontend
- Rate limit API routes

## Next Steps

After completion:
1. Proceed to [Phase 09: Group Bookings + WhatsApp](./phase-09-group-bookings-whatsapp.md)
2. Build inquiry form for groups 10+
3. Add WhatsApp click-to-chat
