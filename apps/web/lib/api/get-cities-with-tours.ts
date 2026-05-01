/**
 * Returns the list of cities that have at least one published tour, with the
 * tour count attached. Used by the footer to render city links instead of an
 * arbitrary featured-tour list.
 *
 * Implementation note: a single Payload query for all published tours is
 * cheap at MVP scale (10 tours). When the catalog grows, this can be replaced
 * with a SQL aggregation; the function shape stays stable.
 *
 * Cached with on-demand revalidation via revalidateTag('cities') and
 * revalidateTag('tours') — both invalidate the footer.
 */

import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'

export interface CityWithTourCount {
  id: string
  name: string
  slug: string
  tourCount: number
}

async function fetchCitiesWithTours(
  locale: string = 'sv',
  limit?: number
): Promise<CityWithTourCount[]> {
  const payload = await getPayload({ config })
  const loc = (locale || 'sv') as 'sv' | 'en' | 'de'

  const tours = await payload.find({
    collection: 'tours',
    where: { status: { equals: 'published' } },
    locale: loc,
    depth: 1, // populate `cities` so name + slug are available
    limit: 1000,
  })

  const counts = new Map<string, CityWithTourCount>()
  for (const tour of tours.docs) {
    const cityRefs = Array.isArray(tour.cities) ? tour.cities : []
    for (const c of cityRefs) {
      // c is either a populated city object (depth:1) or a raw foreign key.
      // Skip if missing required fields — we'd otherwise render literal
      // "undefined" in the footer.
      if (typeof c !== 'object' || c === null) continue
      if (typeof c.name !== 'string' || typeof c.slug !== 'string' || !c.slug) continue
      const id = String(c.id)
      const existing = counts.get(id)
      if (existing) {
        existing.tourCount++
      } else {
        counts.set(id, {
          id,
          name: c.name,
          slug: c.slug,
          tourCount: 1,
        })
      }
    }
  }

  const sorted = [...counts.values()].sort((a, b) => b.tourCount - a.tourCount)
  return typeof limit === 'number' ? sorted.slice(0, limit) : sorted
}

export const getCitiesWithTours = unstable_cache(
  fetchCitiesWithTours,
  ['cities-with-tours'],
  { tags: ['cities', 'tours'] }
)
