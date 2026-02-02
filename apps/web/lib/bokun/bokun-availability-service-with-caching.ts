/**
 * Bokun availability service with 60-second caching
 * Fetches and caches availability data from Bokun API
 * Provides utilities for grouping availability by date
 */

import { unstable_cache } from 'next/cache'
import { bokunClient } from './bokun-api-client-with-hmac-authentication'
import type { BokunAvailability, AvailabilityRequest, AvailabilityResponse } from './bokun-types'

// Cache TTL in seconds (60s for near-real-time accuracy while reducing API calls)
const AVAILABILITY_CACHE_TTL = 60

/**
 * Fetch availability slots for an experience from Bokun API.
 * Returns sessions with pricing and capacity, filtered to only show available slots.
 *
 * @param params - Experience ID, start date, and end date
 * @returns Array of available time slots
 */
export async function getBokunAvailability(
  params: AvailabilityRequest
): Promise<BokunAvailability[]> {
  const { experienceId, startDate, endDate } = params

  // Build query parameters
  const queryParams = new URLSearchParams({
    start: startDate,
    end: endDate,
  })

  // Fetch from Bokun API
  const data = await bokunClient.fetch<AvailabilityResponse>(
    `/restapi/v2.0/activity/${experienceId}/availabilities?${queryParams}`
  )

  // Filter out fully booked sessions (keep unlimited or those with availability)
  return data.availabilities.filter(
    (slot) => slot.unlimitedAvailability || slot.availabilityCount > 0
  )
}

/**
 * Cached availability fetcher using Next.js unstable_cache.
 * 60-second TTL balances freshness with rate limit management.
 *
 * Cache key includes experienceId, startDate, and endDate.
 */
export const getCachedBokunAvailability = unstable_cache(
  async (experienceId: string, startDate: string, endDate: string) => {
    return getBokunAvailability({ experienceId, startDate, endDate })
  },
  ['bokun-availability'],
  {
    revalidate: AVAILABILITY_CACHE_TTL,
    tags: ['bokun-availability'],
  }
)

/**
 * Group availability slots by date for calendar display.
 * Useful for showing available dates in a date picker.
 *
 * @param availabilities - Array of availability slots
 * @returns Map of date (YYYY-MM-DD) to availability slots
 */
export function groupAvailabilityByDate(
  availabilities: BokunAvailability[]
): Map<string, BokunAvailability[]> {
  const dateMap = new Map<string, BokunAvailability[]>()

  for (const slot of availabilities) {
    // Extract date part (YYYY-MM-DD) from ISO date string
    const date = slot.date.split('T')[0]

    if (!dateMap.has(date)) {
      dateMap.set(date, [])
    }
    dateMap.get(date)!.push(slot)
  }

  return dateMap
}

/**
 * Get dates with available slots for calendar highlighting.
 *
 * @param availabilities - Array of availability slots
 * @returns Array of dates (YYYY-MM-DD) that have availability
 */
export function getAvailableDates(availabilities: BokunAvailability[]): string[] {
  const dateSet = new Set<string>()

  for (const slot of availabilities) {
    const date = slot.date.split('T')[0]
    dateSet.add(date)
  }

  return Array.from(dateSet).sort()
}

/**
 * Get time slots for a specific date.
 *
 * @param availabilities - Array of availability slots
 * @param date - Date string (YYYY-MM-DD)
 * @returns Array of time slots for that date
 */
export function getTimeSlotsForDate(
  availabilities: BokunAvailability[],
  date: string
): BokunAvailability[] {
  return availabilities.filter((slot) => slot.date.startsWith(date))
}

/**
 * Get the lowest price from availability slots.
 * Useful for showing "from $X" pricing.
 *
 * @param availabilities - Array of availability slots
 * @returns Lowest price and currency, or null if no rates found
 */
export function getLowestPrice(
  availabilities: BokunAvailability[]
): { price: string; currency: string } | null {
  let lowest: { price: string; currency: string } | null = null
  let lowestValue = Infinity

  for (const slot of availabilities) {
    for (const rate of slot.rates) {
      const priceValue = parseFloat(rate.price)
      if (priceValue < lowestValue) {
        lowestValue = priceValue
        lowest = { price: rate.price, currency: rate.currency }
      }
    }
  }

  return lowest
}

/**
 * Check if any slots are available for booking.
 *
 * @param availabilities - Array of availability slots
 * @returns True if at least one slot has availability
 */
export function hasAvailability(availabilities: BokunAvailability[]): boolean {
  return availabilities.some(
    (slot) => slot.unlimitedAvailability || slot.availabilityCount > 0
  )
}
