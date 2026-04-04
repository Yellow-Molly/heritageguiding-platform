/**
 * Fetches featured tours from Payload CMS.
 * Queries tours where featured === true, depth:2 to populate relationships.
 * Cached with on-demand revalidation via revalidateTag('tours').
 */

import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'
import { mapPayloadTourToFeaturedTour } from './tour-payload-mapper'

export interface FeaturedTour {
  id: string
  title: string
  description: string
  slug: string
  image: {
    url: string
    alt: string
    blurDataUrl?: string
  }
  duration: number
  maxCapacity: number
  rating: number
  reviewCount: number
  price: number
  featured: boolean
  accessibility?: {
    wheelchairAccessible?: boolean
    hearingAccessible?: boolean
    visualAccessible?: boolean
  }
}

/**
 * Internal fetch function for featured tours.
 * Queries Payload for tours with featured === true, includes drafts.
 */
async function fetchFeaturedTours(
  locale: string = 'sv',
  limit: number = 6
): Promise<FeaturedTour[]> {
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'tours',
    where: {
      featured: { equals: true },
      status: { equals: 'published' },
    },
    depth: 2,
    locale: locale as 'sv' | 'en' | 'de',
    limit,
  })

  return result.docs.map((doc) =>
    mapPayloadTourToFeaturedTour(doc as unknown as Record<string, unknown>)
  )
}

/**
 * Get featured tours for homepage display.
 * Cached with on-demand revalidation via revalidateTag('tours').
 * @param locale - The locale for content (sv, en, de)
 * @param limit - Maximum number of tours to return
 * @returns Array of featured tours
 */
export const getFeaturedTours = unstable_cache(
  fetchFeaturedTours,
  ['featured-tours'],
  { tags: ['tours'] }
)
