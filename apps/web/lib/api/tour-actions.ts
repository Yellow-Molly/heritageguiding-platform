'use server'

import { getTours, type TourFilters } from './get-tours'
import type { FeaturedTour } from './get-featured-tours'

/**
 * Server Action for loading more tours (infinite scroll).
 * Fetches the next page of tours based on current filters.
 */
const VALID_LOCALES = ['sv', 'en', 'de'] as const

export async function fetchMoreTours(
  filters: TourFilters,
  page: number,
  locale: string
): Promise<{ tours: FeaturedTour[]; hasMore: boolean }> {
  if (!VALID_LOCALES.includes(locale as (typeof VALID_LOCALES)[number])) {
    return { tours: [], hasMore: false }
  }
  const result = await getTours({ ...filters, page: String(page) }, locale)
  return {
    tours: result.tours,
    hasMore: result.page < result.totalPages,
  }
}
