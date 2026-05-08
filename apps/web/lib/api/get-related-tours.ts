/**
 * Fetches related tours from Payload CMS based on shared categories.
 * Falls back to any published tours if not enough category matches.
 */

import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { FeaturedTour } from './get-featured-tours'
import { mapPayloadTourToFeaturedTour } from './tour-payload-mapper'

type PayloadLocale = 'sv' | 'en' | 'de'

/**
 * Cached inner function — accepts only serializable args (strings + string[]).
 */
async function fetchRelatedTours(
  currentTourId: string,
  categorySlugs: string[],
  locale: PayloadLocale,
  limit: number = 3
): Promise<FeaturedTour[]> {
  const payload = await getPayload({ config })

  // Try category-based matching first
  if (categorySlugs.length > 0) {
    const { docs } = await payload.find({
      collection: 'tours',
      where: {
        id: { not_equals: currentTourId },
        status: { equals: 'published' },
        'categories.slug': { in: categorySlugs.join(',') },
      },
      limit,
      depth: 2,
      locale,
    })

    const tours = docs.map((doc) =>
      mapPayloadTourToFeaturedTour(doc as unknown as Record<string, unknown>)
    )

    // Backfill if not enough category matches
    if (tours.length < limit) {
      const existingIds = [currentTourId, ...tours.map((t) => t.id)]
      const { docs: moreDocs } = await payload.find({
        collection: 'tours',
        where: {
          id: { not_in: existingIds.join(',') },
          status: { equals: 'published' },
        },
        limit: limit - tours.length,
        depth: 2,
        locale,
      })
      tours.push(
        ...moreDocs.map((doc) =>
          mapPayloadTourToFeaturedTour(doc as unknown as Record<string, unknown>)
        )
      )
    }

    return tours
  }

  // No categories — return any published tours except current
  const { docs } = await payload.find({
    collection: 'tours',
    where: {
      id: { not_equals: currentTourId },
      status: { equals: 'published' },
    },
    limit,
    depth: 2,
    locale,
  })

  return docs.map((doc) =>
    mapPayloadTourToFeaturedTour(doc as unknown as Record<string, unknown>)
  )
}

const getCachedRelatedTours = unstable_cache(
  fetchRelatedTours,
  ['related-tours'],
  { tags: ['tours'] }
)

const SUPPORTED_LOCALES: readonly PayloadLocale[] = ['sv', 'en', 'de'] as const

/**
 * Public API — accepts category objects, extracts slugs for cache-safe call.
 */
export async function getRelatedTours(
  currentTourId: string,
  categories?: Array<{ id?: string; slug?: string }>,
  locale: string = 'sv',
  limit: number = 3
): Promise<FeaturedTour[]> {
  const slugs = (categories?.map((c) => c.slug).filter(Boolean) as string[]) ?? []
  const safeLocale: PayloadLocale = (SUPPORTED_LOCALES as readonly string[]).includes(locale)
    ? (locale as PayloadLocale)
    : 'sv'
  return getCachedRelatedTours(currentTourId, slugs, safeLocale, limit)
}
