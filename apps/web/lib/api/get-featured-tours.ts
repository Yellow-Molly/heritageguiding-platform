/**
 * Fetches featured tours from CMS or returns mock data for development.
 * In production, this will query Payload CMS for published, featured tours.
 * Cached with on-demand revalidation via revalidateTag('tours').
 */

import { unstable_cache } from 'next/cache'

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
 * Internal fetch function for featured tours.
 */
async function fetchFeaturedTours(
  _locale: string = 'en',
  limit: number = 6
): Promise<FeaturedTour[]> {
  // TODO: Replace with Payload CMS query when CMS is configured
  return mockFeaturedTours.slice(0, limit)
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
