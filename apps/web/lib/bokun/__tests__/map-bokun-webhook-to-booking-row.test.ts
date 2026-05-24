import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'
import { mapBokunWebhookToBookingRow } from '../map-bokun-webhook-to-booking-row'
import type { BokunWebhookPayload } from '../bokun-types'

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures')

function loadFixture(name: string): BokunWebhookPayload {
  const raw = readFileSync(path.join(fixturesDir, name), 'utf-8')
  return JSON.parse(raw) as BokunWebhookPayload
}

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

  // ────────── addOns extraction ──────────

  it('addOns is undefined when productBookings have no lineItems', () => {
    // Default makePayload() has no lineItems on productBookings.
    const row = mapBokunWebhookToBookingRow(makePayload())
    expect(row.addOns).toBeUndefined()
  })

  it('addOns is undefined when lineItems contain only passenger lines (no extraId)', () => {
    const base = makePayload()
    const row = mapBokunWebhookToBookingRow({
      ...base,
      booking: {
        ...base.booking,
        productBookings: [
          {
            ...base.booking.productBookings[0],
            lineItems: [
              { id: 1, title: 'Passengers', currency: 'SEK', quantity: 1, unitPrice: 3900, total: 3900 },
            ],
          },
        ],
      },
    })
    expect(row.addOns).toBeUndefined()
  })

  it('extracts one add-on line from a real-shape fixture', () => {
    const payload = loadFixture('bokun-webhook-with-extras.json')
    const row = mapBokunWebhookToBookingRow(payload)

    expect(row.addOns).toHaveLength(1)
    expect(row.addOns?.[0]).toEqual({
      bokunExtraId: '276080',
      name: 'QA Test Museum Ticket', // from extras envelope, NOT the prefixed lineItem title
      qty: 1,
      unitPrice: '150',
      totalPrice: '150',
      currency: 'SEK',
      perPerson: true, // pricingType: PER_PERSON in envelope
    })
  })

  it('uses lineItem title as fallback when extras envelope is missing', () => {
    const base = makePayload()
    const row = mapBokunWebhookToBookingRow({
      ...base,
      booking: {
        ...base.booking,
        productBookings: [
          {
            ...base.booking.productBookings[0],
            lineItems: [
              {
                id: 2,
                title: 'Plain Title',
                currency: 'SEK',
                quantity: 2,
                unitPrice: 50,
                total: 100,
                extraId: 999,
              },
            ],
            // no extras envelope → mapper falls back to lineItem title
          },
        ],
      },
    })
    expect(row.addOns).toEqual([
      {
        bokunExtraId: '999',
        name: 'Plain Title',
        qty: 2,
        unitPrice: '50',
        totalPrice: '100',
        currency: 'SEK',
        perPerson: false, // no envelope → defaults to false
      },
    ])
  })

  it('falls back to booking currency when lineItem currency is missing', () => {
    const base = makePayload()
    const row = mapBokunWebhookToBookingRow({
      ...base,
      booking: {
        ...base.booking,
        currency: 'EUR',
        productBookings: [
          {
            ...base.booking.productBookings[0],
            lineItems: [
              {
                id: 3,
                title: 'Add-on',
                // currency intentionally omitted
                currency: undefined as unknown as string,
                quantity: 1,
                unitPrice: 25,
                total: 25,
                extraId: 11,
              },
            ],
          },
        ],
      },
    })
    expect(row.addOns?.[0].currency).toBe('EUR')
  })

  it('handles activityBookings envelope (frontend checkout API shape) defensively', () => {
    // Bokun's frontend checkout API uses `activityBookings` instead of `productBookings`.
    // Mapper falls back to it when productBookings is missing.
    const base = makePayload()
    const row = mapBokunWebhookToBookingRow({
      ...base,
      booking: {
        ...base.booking,
        productBookings: undefined as unknown as typeof base.booking.productBookings,
        activityBookings: [
          {
            startTimeId: 'ts-1',
            experienceId: 'EXP-99',
            participants: [],
            date: '2026-06-15',
            startTime: '10:00',
            lineItems: [
              { id: 4, title: 'Tea', currency: 'SEK', quantity: 1, unitPrice: 30, total: 30, extraId: 42 },
            ],
          },
        ] as unknown,
      } as unknown as typeof base.booking,
    })
    expect(row.addOns).toEqual([
      {
        bokunExtraId: '42',
        name: 'Tea',
        qty: 1,
        unitPrice: '30',
        totalPrice: '30',
        currency: 'SEK',
        perPerson: false,
      },
    ])
  })

  it('flattens multiple add-on lines across products', () => {
    const base = makePayload()
    const row = mapBokunWebhookToBookingRow({
      ...base,
      booking: {
        ...base.booking,
        productBookings: [
          {
            ...base.booking.productBookings[0],
            lineItems: [
              { id: 10, title: 'A', currency: 'SEK', quantity: 1, unitPrice: 10, total: 10, extraId: 100 },
              { id: 11, title: 'B', currency: 'SEK', quantity: 2, unitPrice: 20, total: 40, extraId: 101 },
            ],
          },
        ],
      },
    })
    expect(row.addOns?.map((a) => a.bokunExtraId)).toEqual(['100', '101'])
  })
})
