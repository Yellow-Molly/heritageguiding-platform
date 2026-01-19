/**
 * Fetches related tours based on categories or audience tags.
 * In production, this will query Payload CMS. Currently uses mock data.
 */

import type { FeaturedTour } from './get-featured-tours'

// Mock tours for related suggestions
const allTours: FeaturedTour[] = [
  {
    id: 'gamla-stan-walking',
    title: 'Gamla Stan Walking Tour',
    description:
      'Explore the medieval streets of Old Town, discover hidden courtyards, and hear tales of Swedish royalty.',
    slug: 'gamla-stan-walking',
    image: {
      url: 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?auto=format&fit=crop&w=800&q=80',
      alt: 'Narrow medieval street in Gamla Stan, Stockholm',
    },
    duration: 120,
    maxCapacity: 15,
    rating: 4.9,
    reviewCount: 234,
    price: 495,
    featured: true,
    accessibility: {
      wheelchairAccessible: false,
      hearingAccessible: true,
    },
  },
  {
    id: 'royal-palace',
    title: 'Royal Palace Experience',
    description:
      "Step inside one of Europe's largest palaces and uncover 500 years of Swedish monarchy history.",
    slug: 'royal-palace',
    image: {
      url: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80',
      alt: 'Royal Palace in Stockholm with guards',
    },
    duration: 150,
    maxCapacity: 12,
    rating: 4.8,
    reviewCount: 189,
    price: 695,
    featured: true,
    accessibility: {
      wheelchairAccessible: true,
      hearingAccessible: true,
    },
  },
  {
    id: 'vasa-museum',
    title: 'Vasa Museum Deep Dive',
    description:
      "Marvel at the world's only preserved 17th-century ship and learn about its dramatic story.",
    slug: 'vasa-museum',
    image: {
      url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
      alt: 'View of Stockholm harbor near Vasa Museum',
    },
    duration: 90,
    maxCapacity: 20,
    rating: 4.9,
    reviewCount: 312,
    price: 545,
    featured: true,
    accessibility: {
      wheelchairAccessible: true,
      hearingAccessible: true,
      visualAccessible: true,
    },
  },
  {
    id: 'viking-history',
    title: 'Viking History Tour',
    description:
      'Journey back in time to discover the Viking age and its lasting influence on Scandinavian culture.',
    slug: 'viking-history',
    image: {
      url: 'https://images.unsplash.com/photo-1531168556467-80aace0d0144?auto=format&fit=crop&w=800&q=80',
      alt: 'Viking artifacts and historical items',
    },
    duration: 180,
    maxCapacity: 15,
    rating: 4.9,
    reviewCount: 203,
    price: 745,
    featured: false,
    accessibility: {
      wheelchairAccessible: true,
      hearingAccessible: true,
    },
  },
  {
    id: 'nobel-prize-tour',
    title: 'Nobel Prize Tour',
    description:
      'Visit the places where Nobel laureates have made history and learn about Swedish innovation.',
    slug: 'nobel-prize-tour',
    image: {
      url: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?auto=format&fit=crop&w=800&q=80',
      alt: 'Stockholm City Hall where Nobel banquet is held',
    },
    duration: 150,
    maxCapacity: 15,
    rating: 4.7,
    reviewCount: 145,
    price: 645,
    featured: false,
    accessibility: {
      wheelchairAccessible: true,
      hearingAccessible: true,
      visualAccessible: true,
    },
  },
]

// Category mappings for tours
const categoryTourMap: Record<string, string[]> = {
  history: ['gamla-stan-walking', 'royal-palace', 'viking-history', 'nobel-prize-tour'],
  museum: ['vasa-museum', 'nobel-prize-tour'],
  walking: ['gamla-stan-walking', 'viking-history'],
}

/**
 * Get related tours based on categories.
 * @param currentTourId - The current tour ID to exclude
 * @param categories - Array of category objects with id/slug
 * @param limit - Maximum number of tours to return
 * @returns Array of related tours
 */
export async function getRelatedTours(
  currentTourId: string,
  categories?: Array<{ id?: string; slug?: string }>,
  limit: number = 3
): Promise<FeaturedTour[]> {
  // TODO: Replace with Payload CMS query when CMS is configured
  // const payload = await getPayload({ config })
  // const categoryIds = categories?.map(c => c.id).filter(Boolean)
  // const { docs } = await payload.find({
  //   collection: 'tours',
  //   where: {
  //     id: { not_equals: currentTourId },
  //     status: { equals: 'published' },
  //     categories: { in: categoryIds }
  //   },
  //   limit
  // })
  // return docs as FeaturedTour[]

  if (!categories || categories.length === 0) {
    // Return random tours if no categories
    return allTours.filter((t) => t.id !== currentTourId).slice(0, limit)
  }

  // Get tour IDs from matching categories
  const matchingTourIds = new Set<string>()
  categories.forEach((cat) => {
    const catId = cat.id || cat.slug
    if (catId && categoryTourMap[catId]) {
      categoryTourMap[catId].forEach((id) => matchingTourIds.add(id))
    }
  })

  // Filter and return related tours
  const relatedTours = allTours
    .filter((t) => t.id !== currentTourId && matchingTourIds.has(t.id))
    .slice(0, limit)

  // If not enough matches, fill with other tours
  if (relatedTours.length < limit) {
    const remaining = allTours
      .filter((t) => t.id !== currentTourId && !relatedTours.some((r) => r.id === t.id))
      .slice(0, limit - relatedTours.length)
    relatedTours.push(...remaining)
  }

  return relatedTours
}
