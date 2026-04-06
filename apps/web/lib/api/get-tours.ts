/**
 * Fetches tours from Payload CMS with filtering, sorting, and pagination.
 * Builds WHERE clauses from validated filter params and queries Payload directly.
 */

import { getPayload } from 'payload'
import config from '@payload-config'
import type { Where } from 'payload'
import type { FeaturedTour } from './get-featured-tours'
import { mapPayloadTourToFeaturedTour } from './tour-payload-mapper'
import { validateTourFilters, type ValidatedTourFilters } from '@/lib/validation/tour-filters'

export interface TourFilters {
  categories?: string
  priceMin?: string
  priceMax?: string
  duration?: string
  accessible?: string
  sort?: string
  q?: string
  page?: string
  limit?: string
  locale?: string
}

export interface ToursResponse {
  tours: FeaturedTour[]
  total: number
  page: number
  totalPages: number
}

/**
 * Map frontend sort key to Payload sort field.
 * Prefix with '-' for descending order.
 */
function mapSortToPayload(sort?: string): string {
  switch (sort) {
    case 'price-asc':
      return 'pricing.basePrice'
    case 'price-desc':
      return '-pricing.basePrice'
    case 'duration-asc':
      return 'duration.hours'
    case 'duration-desc':
      return '-duration.hours'
    case 'rating':
      // No rating field yet — fallback to newest
      return '-createdAt'
    case 'popular':
    default:
      return '-createdAt'
  }
}

/**
 * Build Payload WHERE clause from validated tour filters.
 * Only published tours are shown on the frontend.
 */
function buildWhereClause(filters: ValidatedTourFilters): Where {
  const where: Where = { status: { equals: 'published' } }

  // Category filter: comma-separated slugs → categories.slug in [...]
  if (filters.categories) {
    const slugs = filters.categories.split(',').filter(Boolean)
    if (slugs.length > 0) {
      where['categories.slug'] = { in: slugs }
    }
  }

  // Price range filters
  if (filters.priceMin) {
    where['pricing.basePrice'] = {
      ...((where['pricing.basePrice'] as object) ?? {}),
      greater_than_equal: parseInt(filters.priceMin, 10),
    }
  }
  if (filters.priceMax) {
    where['pricing.basePrice'] = {
      ...((where['pricing.basePrice'] as object) ?? {}),
      less_than_equal: parseInt(filters.priceMax, 10),
    }
  }

  // Duration filter: frontend value is in minutes, schema stores hours
  if (filters.duration) {
    const maxMinutes = parseInt(filters.duration, 10)
    where['duration.hours'] = { less_than_equal: maxMinutes / 60 }
  }

  // Accessibility filter
  if (filters.accessible === 'true') {
    where['accessibility.wheelchairAccessible'] = { equals: true }
  }

  // Case-insensitive search across title and shortDescription
  // Note: description is richText (JSON tree), cannot use `contains` on it
  if (filters.q) {
    const q = filters.q.trim()
    where.or = [
      { title: { contains: q } },
      { shortDescription: { contains: q } },
    ]
  }

  return where
}

/**
 * Get tours with filtering, sorting, and pagination from Payload CMS.
 * @param filters - Filter and sort parameters
 * @returns Paginated tours response
 */
export async function getTours(filters: TourFilters = {}, locale: string = 'sv'): Promise<ToursResponse> {
  const validatedFilters = validateTourFilters(filters as Record<string, string | undefined>)

  const payload = await getPayload({ config })

  const page = parseInt(validatedFilters.page || '1', 10)
  const limit = parseInt(validatedFilters.limit || '9', 10)
  const payloadLocale = (locale || 'sv') as 'sv' | 'en' | 'de'

  const where = buildWhereClause(validatedFilters)
  const sort = mapSortToPayload(validatedFilters.sort)

  const result = await payload.find({
    collection: 'tours',
    where,
    sort,
    locale: payloadLocale,
    page,
    limit,
    depth: 2,
  })

  const tours = result.docs.map((doc) =>
    mapPayloadTourToFeaturedTour(doc as unknown as Record<string, unknown>)
  )

  return {
    tours,
    total: result.totalDocs,
    page: result.page ?? page,
    totalPages: result.totalPages,
  }
}

/**
 * Get all available categories for filter dropdown from Payload CMS.
 */
export async function getTourCategories(): Promise<Array<{ id: string; name: string }>> {
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'categories',
    limit: 100,
    sort: 'name',
  })

  return result.docs.map((doc) => ({
    id: String(doc.id),
    name: String(doc.name),
  }))
}
