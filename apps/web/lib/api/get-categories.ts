/**
 * Fetches tour categories from CMS or returns mock data for development.
 * Categories are used for filtering and navigation.
 * Cached with on-demand revalidation via revalidateTag('categories').
 */

import { unstable_cache } from 'next/cache'

export type CategoryType = 'theme' | 'neighborhood'

export interface Category {
  id: string
  name: string
  slug: string
  type: CategoryType
  description?: string
  tourCount: number
}

// Mock data for development
const mockThemeCategories: Category[] = [
  {
    id: 'history',
    name: 'History & Heritage',
    slug: 'history',
    type: 'theme',
    description: 'Explore Stockholm through the ages',
    tourCount: 8,
  },
  {
    id: 'architecture',
    name: 'Architecture',
    slug: 'architecture',
    type: 'theme',
    description: 'From medieval to modern design',
    tourCount: 5,
  },
  {
    id: 'nature',
    name: 'Nature & Parks',
    slug: 'nature',
    type: 'theme',
    description: 'Green spaces and waterways',
    tourCount: 4,
  },
  {
    id: 'maritime',
    name: 'Maritime History',
    slug: 'maritime',
    type: 'theme',
    description: "Sweden's seafaring legacy",
    tourCount: 3,
  },
  {
    id: 'royal',
    name: 'Royal Heritage',
    slug: 'royal',
    type: 'theme',
    description: 'Palaces, crowns, and ceremonies',
    tourCount: 4,
  },
]

const mockNeighborhoodCategories: Category[] = [
  {
    id: 'gamla-stan',
    name: 'Gamla Stan',
    slug: 'gamla-stan',
    type: 'neighborhood',
    description: 'Medieval Old Town',
    tourCount: 6,
  },
  {
    id: 'djurgarden',
    name: 'Djurgården',
    slug: 'djurgarden',
    type: 'neighborhood',
    description: 'Museum island and parkland',
    tourCount: 4,
  },
  {
    id: 'sodermalm',
    name: 'Södermalm',
    slug: 'sodermalm',
    type: 'neighborhood',
    description: 'Hip and historic southern island',
    tourCount: 3,
  },
  {
    id: 'norrmalm',
    name: 'Norrmalm',
    slug: 'norrmalm',
    type: 'neighborhood',
    description: 'Modern city center',
    tourCount: 4,
  },
  {
    id: 'ostermalm',
    name: 'Östermalm',
    slug: 'ostermalm',
    type: 'neighborhood',
    description: 'Elegant residential district',
    tourCount: 2,
  },
]

/**
 * Internal fetch function for categories.
 */
async function fetchCategories(
  type: CategoryType,
  _locale: string = 'en'
): Promise<Category[]> {
  // TODO: Replace with Payload CMS query when CMS is configured
  return type === 'theme' ? mockThemeCategories : mockNeighborhoodCategories
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
export async function getAllCategories(locale: string = 'en'): Promise<{
  themes: Category[]
  neighborhoods: Category[]
}> {
  const [themes, neighborhoods] = await Promise.all([
    getCategories('theme', locale),
    getCategories('neighborhood', locale),
  ])

  return { themes, neighborhoods }
}
