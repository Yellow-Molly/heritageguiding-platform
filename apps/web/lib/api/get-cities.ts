/**
 * Fetches the list of cities used in tour filters.
 * Cached with on-demand revalidation via revalidateTag('cities').
 */

import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'

export interface City {
  id: string
  name: string
  slug: string
}

async function fetchCities(locale: string = 'sv'): Promise<City[]> {
  const payload = await getPayload({ config })
  const loc = (locale || 'sv') as 'sv' | 'en' | 'de'

  const result = await payload.find({
    collection: 'cities',
    locale: loc,
    limit: 100,
    sort: 'name',
    depth: 0,
  })

  return result.docs.map((doc) => ({
    id: String(doc.id),
    name: String(doc.name),
    slug: String(doc.slug),
  }))
}

export const getCities = unstable_cache(fetchCities, ['cities'], {
  tags: ['cities'],
})
