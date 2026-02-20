/**
 * Tests for Bokun availability service with caching
 * Covers: getBokunAvailability (API call, filtering), groupAvailabilityByDate,
 * getAvailableDates, getTimeSlotsForDate, getLowestPrice, hasAvailability
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Use vi.hoisted so the mock variable is available inside the vi.mock factory
const { mockBokunFetch } = vi.hoisted(() => ({ mockBokunFetch: vi.fn() }))
vi.mock('../bokun-api-client-with-hmac-authentication', () => ({
  bokunClient: { fetch: mockBokunFetch },
}))

import {
  getBokunAvailability,
  groupAvailabilityByDate,
  getAvailableDates,
  getTimeSlotsForDate,
  getLowestPrice,
  hasAvailability,
} from '../bokun-availability-service-with-caching'
import type { BokunAvailability } from '../bokun-types'

// Helper to build a minimal BokunAvailability fixture
function makeSlot(
  date: string,
  availabilityCount: number,
  unlimitedAvailability = false,
  rates: Array<{ price: string; currency: string }> = [{ price: '100', currency: 'SEK' }]
): BokunAvailability {
  return {
    date,
    startTime: date.includes('T') ? date.split('T')[1] : '10:00',
    startTimeId: `slot-${date}`,
    unlimitedAvailability,
    availabilityCount,
    bookedParticipants: 0,
    minParticipants: 1,
    rates: rates.map((r) => ({ ...r, participantCount: 1 })),
  }
}

// ============================================================================
// getBokunAvailability
// ============================================================================
describe('getBokunAvailability', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls bokunClient.fetch with correct availability endpoint', async () => {
    mockBokunFetch.mockResolvedValueOnce({ availabilities: [] })
    await getBokunAvailability({ experienceId: '123', startDate: '2025-06-01', endDate: '2025-06-30' })
    expect(mockBokunFetch).toHaveBeenCalledWith(
      expect.stringContaining('/restapi/v2.0/activity/123/availabilities')
    )
  })

  it('includes start and end date as query params', async () => {
    mockBokunFetch.mockResolvedValueOnce({ availabilities: [] })
    await getBokunAvailability({ experienceId: '456', startDate: '2025-07-01', endDate: '2025-07-31' })
    const url: string = mockBokunFetch.mock.calls[0][0]
    expect(url).toContain('start=2025-07-01')
    expect(url).toContain('end=2025-07-31')
  })

  it('filters out fully booked slots (availabilityCount=0, not unlimited)', async () => {
    mockBokunFetch.mockResolvedValueOnce({
      availabilities: [
        makeSlot('2025-06-01T10:00', 0, false),
        makeSlot('2025-06-01T14:00', 5, false),
      ],
    })
    const result = await getBokunAvailability({ experienceId: '123', startDate: '2025-06-01', endDate: '2025-06-30' })
    expect(result).toHaveLength(1)
    expect(result[0].availabilityCount).toBe(5)
  })

  it('keeps slots with unlimitedAvailability even when count is 0', async () => {
    mockBokunFetch.mockResolvedValueOnce({
      availabilities: [makeSlot('2025-06-01T10:00', 0, true)],
    })
    const result = await getBokunAvailability({ experienceId: '123', startDate: '2025-06-01', endDate: '2025-06-30' })
    expect(result).toHaveLength(1)
    expect(result[0].unlimitedAvailability).toBe(true)
  })

  it('returns empty array when all slots are fully booked', async () => {
    mockBokunFetch.mockResolvedValueOnce({
      availabilities: [
        makeSlot('2025-06-01T10:00', 0, false),
        makeSlot('2025-06-01T14:00', 0, false),
      ],
    })
    const result = await getBokunAvailability({ experienceId: '123', startDate: '2025-06-01', endDate: '2025-06-30' })
    expect(result).toHaveLength(0)
  })

  it('returns empty array when availabilities is empty', async () => {
    mockBokunFetch.mockResolvedValueOnce({ availabilities: [] })
    const result = await getBokunAvailability({ experienceId: '123', startDate: '2025-06-01', endDate: '2025-06-30' })
    expect(result).toEqual([])
  })
})

// ============================================================================
// groupAvailabilityByDate
// ============================================================================
describe('groupAvailabilityByDate', () => {
  it('groups slots by date part (YYYY-MM-DD)', () => {
    const slots = [
      makeSlot('2025-06-01T10:00', 5),
      makeSlot('2025-06-02T14:00', 3),
    ]
    const result = groupAvailabilityByDate(slots)
    expect(result.has('2025-06-01')).toBe(true)
    expect(result.has('2025-06-02')).toBe(true)
    expect(result.get('2025-06-01')).toHaveLength(1)
    expect(result.get('2025-06-02')).toHaveLength(1)
  })

  it('groups multiple slots on the same date under one key', () => {
    const slots = [
      makeSlot('2025-06-01T09:00', 5),
      makeSlot('2025-06-01T14:00', 3),
      makeSlot('2025-06-01T17:00', 8),
    ]
    const result = groupAvailabilityByDate(slots)
    expect(result.size).toBe(1)
    expect(result.get('2025-06-01')).toHaveLength(3)
  })

  it('returns empty Map for empty input', () => {
    const result = groupAvailabilityByDate([])
    expect(result.size).toBe(0)
  })
})

// ============================================================================
// getAvailableDates
// ============================================================================
describe('getAvailableDates', () => {
  it('returns sorted unique date strings from slots', () => {
    const slots = [
      makeSlot('2025-06-03T10:00', 5),
      makeSlot('2025-06-01T10:00', 3),
      makeSlot('2025-06-03T14:00', 2), // duplicate date
      makeSlot('2025-06-02T09:00', 1),
    ]
    const result = getAvailableDates(slots)
    expect(result).toEqual(['2025-06-01', '2025-06-02', '2025-06-03'])
  })

  it('returns empty array for empty input', () => {
    expect(getAvailableDates([])).toEqual([])
  })
})

// ============================================================================
// getTimeSlotsForDate
// ============================================================================
describe('getTimeSlotsForDate', () => {
  it('returns only slots matching the given date prefix', () => {
    const slots = [
      makeSlot('2025-06-01T10:00', 5),
      makeSlot('2025-06-01T14:00', 3),
      makeSlot('2025-06-02T09:00', 2),
    ]
    const result = getTimeSlotsForDate(slots, '2025-06-01')
    expect(result).toHaveLength(2)
    result.forEach((s) => expect(s.date.startsWith('2025-06-01')).toBe(true))
  })

  it('returns empty array when no slots match the date', () => {
    const slots = [makeSlot('2025-06-01T10:00', 5)]
    const result = getTimeSlotsForDate(slots, '2025-06-15')
    expect(result).toHaveLength(0)
  })
})

// ============================================================================
// getLowestPrice
// ============================================================================
describe('getLowestPrice', () => {
  it('finds the lowest price across all slots and rates', () => {
    const slots = [
      makeSlot('2025-06-01T10:00', 5, false, [{ price: '200', currency: 'SEK' }]),
      makeSlot('2025-06-01T14:00', 3, false, [
        { price: '150', currency: 'SEK' },
        { price: '80', currency: 'SEK' },
      ]),
    ]
    const result = getLowestPrice(slots)
    expect(result).toEqual({ price: '80', currency: 'SEK' })
  })

  it('returns null for empty availabilities array', () => {
    expect(getLowestPrice([])).toBeNull()
  })

  it('returns null when slots have no rates', () => {
    const slots = [makeSlot('2025-06-01T10:00', 5, false, [])]
    expect(getLowestPrice(slots)).toBeNull()
  })

  it('returns single rate when only one slot with one rate', () => {
    const slots = [makeSlot('2025-06-01T10:00', 5, false, [{ price: '99', currency: 'EUR' }])]
    const result = getLowestPrice(slots)
    expect(result).toEqual({ price: '99', currency: 'EUR' })
  })
})

// ============================================================================
// hasAvailability
// ============================================================================
describe('hasAvailability', () => {
  it('returns true when at least one slot has availabilityCount > 0', () => {
    const slots = [
      makeSlot('2025-06-01T10:00', 0, false),
      makeSlot('2025-06-01T14:00', 3, false),
    ]
    expect(hasAvailability(slots)).toBe(true)
  })

  it('returns true when slot has unlimitedAvailability', () => {
    const slots = [makeSlot('2025-06-01T10:00', 0, true)]
    expect(hasAvailability(slots)).toBe(true)
  })

  it('returns false when empty array', () => {
    expect(hasAvailability([])).toBe(false)
  })

  it('returns false when all slots are fully booked with no unlimited', () => {
    const slots = [
      makeSlot('2025-06-01T10:00', 0, false),
      makeSlot('2025-06-01T14:00', 0, false),
    ]
    expect(hasAvailability(slots)).toBe(false)
  })
})
