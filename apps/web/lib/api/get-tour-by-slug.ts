/**
 * Fetches a single tour by slug from Payload CMS.
 * depth:2 populates guide, categories, neighborhoods, and media relationships.
 * Cached with on-demand revalidation via revalidateTag('tours').
 */

import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { FeaturedTour } from './get-featured-tours'
import { mapPayloadTourToTourDetail } from './tour-payload-mapper'

/** Extended tour details for detail page */
export interface TourDetail extends FeaturedTour {
  /** HTML content for emotional description */
  descriptionHtml: string
  /** Tour highlights list */
  highlights: Array<{ highlight: string }>
  /** Gallery images */
  gallery: Array<{
    image: {
      url: string
      alt: string
      blurDataUrl?: string
    }
  }>
  /** Logistics information */
  logistics?: {
    meetingPointName: string
    meetingPointAddress?: string
    meetingPointInstructions?: string
    coordinates?: {
      latitude: number
      longitude: number
    }
    googleMapsLink?: string
    publicTransportInfo?: string
    parkingInfo?: string
    endingPoint?: string
  }
  /** What is included */
  included?: Array<{ item: string }>
  /** What is not included */
  notIncluded?: Array<{ item: string }>
  /** What to bring */
  whatToBring?: Array<{ item: string }>
  /** Guides leading this tour (>=1, ordered as set in CMS) */
  guides: Array<{
    id: string
    name: string
    slug: string
    photo?: {
      url: string
      alt: string
      blurDataUrl?: string
    }
    bio: string
    credentials?: Array<{ credential: string }>
    languages?: string[]
  }>
  /** Tour categories */
  categories?: Array<{
    id: string
    name: string
    slug: string
  }>
  /** Audience tags for related tours */
  audienceTags?: string[]
  /** Bokun experience ID for booking widget */
  bokunExperienceId?: string
}

/**
 * Internal fetch function for tour by slug.
 * Queries Payload for the first tour matching the slug, includes drafts.
 */
async function fetchTourBySlug(
  slug: string,
  locale: string = 'sv'
): Promise<TourDetail | null> {
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'tours',
    where: { slug: { equals: slug }, status: { equals: 'published' } },
    depth: 2,
    locale: locale as 'sv' | 'en' | 'de',
    limit: 1,
  })

  const doc = result.docs[0]
  if (!doc) return null

  return mapPayloadTourToTourDetail(doc as unknown as Record<string, unknown>)
}

/**
 * Get a single tour by its slug.
 * Cached with on-demand revalidation via revalidateTag('tours').
 * @param slug - The tour URL slug
 * @param locale - The locale for content (sv, en, de)
 * @returns Tour detail or null if not found
 */
// Cache key suffix is bumped whenever the cached TourDetail shape changes,
// to invalidate Vercel Data Cache entries from previous deploys. Bumping
// avoids serving e.g. the legacy `{ guide }` object after the hasMany
// migration converted it to `{ guides: [...] }`.
export const getTourBySlug = unstable_cache(
  fetchTourBySlug,
  ['tour-by-slug', 'v2-hasmany-guides'],
  { tags: ['tours'] }
)

/**
 * Get all tour slugs for static generation.
 * Fetches up to 500 slugs; includes both draft and published.
 * @returns Array of tour slugs
 */
export async function getAllTourSlugs(): Promise<Array<{ slug: string }>> {
  const payload = await getPayload({ config })

  const result = await payload.find({
    collection: 'tours',
    where: { status: { equals: 'published' } },
    depth: 0,
    limit: 500,
    select: { slug: true } as Record<string, true>,
  })

  return result.docs
    .filter((doc) => doc.slug)
    .map((doc) => ({ slug: String(doc.slug) }))
}
