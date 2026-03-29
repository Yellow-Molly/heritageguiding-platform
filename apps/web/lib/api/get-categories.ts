/**
 * Fetches tour categories and neighborhoods from Payload CMS.
 * Categories are used for filtering and navigation.
 * Cached with on-demand revalidation via revalidateTag('categories').
 */

import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'

export type CategoryType = 'theme' | 'neighborhood'

export interface Category {
  id: string
  name: string
  slug: string
  type: CategoryType
  description?: string
  tourCount: number
}

/**
 * Internal fetch function for categories.
 * - type 'theme'        → queries `categories` collection where type equals 'theme'
 * - type 'neighborhood' → queries `neighborhoods` collection
 *
 * tourCount is set to 0 — computing it requires a join query not yet implemented.
 */
async function fetchCategories(
  type: CategoryType,
  locale: string = 'sv'
): Promise<Category[]> {
  const payload = await getPayload({ config })
  const loc = locale as 'sv' | 'en' | 'de'

  if (type === 'theme') {
    const result = await payload.find({
      collection: 'categories',
      where: { type: { equals: 'theme' } },
      locale: loc,
      limit: 100,
      sort: 'name',
      depth: 0,
    })

    return result.docs.map((doc) => ({
      id: String(doc.id),
      name: String(doc.name),
      slug: String(doc.slug),
      type: 'theme' as const,
      description: doc.description ?? undefined,
      tourCount: 0,
    }))
  }

  // neighborhood
  const result = await payload.find({
    collection: 'neighborhoods',
    locale: loc,
    limit: 100,
    sort: 'name',
    depth: 0,
  })

  return result.docs.map((doc) => ({
    id: String(doc.id),
    name: String(doc.name),
    slug: String(doc.slug),
    type: 'neighborhood' as const,
    description: undefined,
    tourCount: 0,
  }))
}

/**
 * Get categories by type for navigation and filtering.
 * Cached with on-demand revalidation via revalidateTag('categories').
 * @param type - The category type ('theme' or 'neighborhood')
 * @param locale - The locale for content
 * @returns Array of categories
 */
export const getCategories = unstable_cache(
  fetchCategories,
  ['categories'],
  { tags: ['categories'] }
)

/**
 * Get all categories grouped by type.
 * @param locale - The locale for content
 * @returns Object with theme and neighborhood categories
 */
export async function getAllCategories(locale: string = 'sv'): Promise<{
  themes: Category[]
  neighborhoods: Category[]
}> {
  const [themes, neighborhoods] = await Promise.all([
    getCategories('theme', locale),
    getCategories('neighborhood', locale),
  ])

  return { themes, neighborhoods }
}
