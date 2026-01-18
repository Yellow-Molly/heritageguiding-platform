/**
 * Fetches featured tours from CMS or returns mock data for development.
 * In production, this will query Payload CMS for published, featured tours.
 */

export interface FeaturedTour {
  id: string
  title: string
  description: string
  slug: string
  image: {
    url: string
    alt: string
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

// Mock data for development - will be replaced with CMS query
const mockFeaturedTours: FeaturedTour[] = [
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
]

/**
 * Get featured tours for homepage display.
 * @param locale - The locale for content (sv, en, de)
 * @param limit - Maximum number of tours to return
 * @returns Array of featured tours
 */
export async function getFeaturedTours(
  _locale: string = 'en', // Intentionally unused - will be used for CMS query
  limit: number = 6
): Promise<FeaturedTour[]> {
  // TODO: Replace with Payload CMS query when CMS is configured
  // const payload = await getPayload({ config })
  // const { docs } = await payload.find({
  //   collection: 'tours',
  //   where: {
  //     status: { equals: 'published' },
  //     featured: { equals: true }
  //   },
  //   limit,
  //   locale,
  //   depth: 2
  // })
  // return docs as FeaturedTour[]

  // For now, return mock data
  return mockFeaturedTours.slice(0, limit)
}
