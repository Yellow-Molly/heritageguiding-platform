import { describe, it, expect } from 'vitest'
import { mapBokunWebhookToBookingRow } from '../map-bokun-webhook-to-booking-row'
import type { BokunWebhookPayload } from '../bokun-types'

function makePayload(overrides: Partial<BokunWebhookPayload> = {}): BokunWebhookPayload {
  return {
    event: 'BOOKING_CREATED',
    bookingId: 'BK-123',
    timestamp: 1715900000000,
    booking: {
      id: 'BK-123',
      confirmationCode: 'PT-ABCD',
      status: 'CONFIRMED',
      customerDetails: {
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        phone: '+46 70 000 0000',
      },
      productBookings: [
        {
          startTimeId: 'ts-1',
          experienceId: 'EXP-99',
          participants: [
            { ageBand: 'ADULT', count: 2 },
            { ageBand: 'CHILD', count: 1 },
          ],
          date: '2026-06-15',
          startTime: '10:00',
        },
      ],
      totalPrice: '4500.00',
      currency: 'SEK',
      createdAt: 1715900000000,
    },
    ...overrides,
  }
}

describe('mapBokunWebhookToBookingRow', () => {
  it('flattens identifiers, customer, and pricing', () => {
    const row = mapBokunWebhookToBookingRow(makePayload())
    expect(row).toMatchObject({
      bokunBookingId: 'BK-123',
      confirmationCode: 'PT-ABCD',
      status: 'confirmed',
      customerName: 'Ada Lovelace',
      customerEmail: 'ada@example.com',
      customerPhone: '+46 70 000 0000',
      bokunExperienceId: 'EXP-99',
      bookingDate: '2026-06-15',
      startTime: '10:00',
      totalPrice: '4500.00',
      currency: 'SEK',
      lastWebhookEvent: 'BOOKING_CREATED',
    })
  })

  it('sums participants across age bands', () => {
    const row = mapBokunWebhookToBookingRow(makePayload())
    expect(row.participants).toBe(3)
  })

  it('maps Bokun status enum to lowercase Bookings enum', () => {
    expect(mapBokunWebhookToBookingRow(makePayload({
      booking: { ...makePayload().booking, status: 'CANCELLED' },
    })).status).toBe('cancelled')

    expect(mapBokunWebhookToBookingRow(makePayload({
      booking: { ...makePayload().booking, status: 'ON_HOLD' },
    })).status).toBe('on_hold')

    expect(mapBokunWebhookToBookingRow(makePayload({
      booking: { ...makePayload().booking, status: 'PENDING' },
    })).status).toBe('pending')
  })

  it('falls back to "Unknown" when both first and last name are blank', () => {
    const row = mapBokunWebhookToBookingRow(makePayload({
      booking: {
        ...makePayload().booking,
        customerDetails: {
          firstName: '',
          lastName: '',
          email: 'anon@example.com',
        },
      },
    }))
    expect(row.customerName).toBe('Unknown')
  })

  it('omits phone when missing or empty string', () => {
    const row = mapBokunWebhookToBookingRow(makePayload({
      booking: {
        ...makePayload().booking,
        customerDetails: {
          firstName: 'A',
          lastName: 'B',
          email: 'a@b.com',
          phone: '',
        },
      },
    }))
    expect(row.customerPhone).toBeUndefined()
  })

  it('handles empty productBookings array without throwing', () => {
    const row = mapBokunWebhookToBookingRow(makePayload({
      booking: { ...makePayload().booking, productBookings: [] },
    }))
    expect(row.bokunExperienceId).toBeUndefined()
    expect(row.bookingDate).toBeUndefined()
    expect(row.startTime).toBeUndefined()
    expect(row.participants).toBeUndefined()
  })

  it('stamps webhookReceivedAt as an ISO 8601 timestamp', () => {
    const row = mapBokunWebhookToBookingRow(makePayload())
    expect(row.webhookReceivedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('preserves the raw booking for the rawPayload JSON column', () => {
    const payload = makePayload()
    const row = mapBokunWebhookToBookingRow(payload)
    expect(row.rawPayload).toBe(payload.booking)
  })
})
