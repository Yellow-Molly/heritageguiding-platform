/**
 * Fetches tours from CMS with filtering, sorting, and pagination.
 * In production, this will query Payload CMS. Currently uses mock data.
 */

import type { FeaturedTour } from './get-featured-tours'
import { validateTourFilters, type ValidatedTourFilters } from '@/lib/validation/tour-filters'

export interface TourFilters {
  categories?: string
  priceMin?: string
  priceMax?: string
  duration?: string
  accessible?: string
  sort?: string
  q?: string
  page?: string
  limit?: string
}

export interface ToursResponse {
  tours: FeaturedTour[]
  total: number
  page: number
  totalPages: number
}

// Extended mock data for catalog page
const mockTours: FeaturedTour[] = [
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
    id: 'stockholm-food-tour',
    title: 'Stockholm Food Tour',
    description:
      'Taste your way through Swedish culinary traditions from meatballs to modern Nordic cuisine.',
    slug: 'stockholm-food-tour',
    image: {
      url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
      alt: 'Traditional Swedish food spread',
    },
    duration: 180,
    maxCapacity: 10,
    rating: 4.7,
    reviewCount: 156,
    price: 895,
    featured: false,
    accessibility: {
      wheelchairAccessible: true,
      hearingAccessible: true,
    },
  },
  {
    id: 'djurgarden-nature',
    title: 'Djurgården Nature Walk',
    description:
      'Escape the city bustle with a peaceful walk through royal parklands and historic gardens.',
    slug: 'djurgarden-nature',
    image: {
      url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80',
      alt: 'Green parkland in Djurgården',
    },
    duration: 120,
    maxCapacity: 15,
    rating: 4.6,
    reviewCount: 98,
    price: 395,
    featured: false,
    accessibility: {
      wheelchairAccessible: true,
      hearingAccessible: true,
    },
  },
  {
    id: 'sodermalm-art',
    title: 'Södermalm Art & Culture',
    description:
      "Discover Stockholm's creative heart through street art, galleries, and bohemian neighborhoods.",
    slug: 'sodermalm-art',
    image: {
      url: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?auto=format&fit=crop&w=800&q=80',
      alt: 'Colorful street art in Södermalm',
    },
    duration: 150,
    maxCapacity: 12,
    rating: 4.8,
    reviewCount: 167,
    price: 595,
    featured: false,
    accessibility: {
      wheelchairAccessible: false,
      hearingAccessible: true,
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
    id: 'architecture-tour',
    title: 'Modern Architecture Tour',
    description:
      'Explore Stockholm\'s award-winning contemporary architecture and sustainable urban design.',
    slug: 'architecture-tour',
    image: {
      url: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=800&q=80',
      alt: 'Modern building in Stockholm',
    },
    duration: 120,
    maxCapacity: 12,
    rating: 4.5,
    reviewCount: 78,
    price: 495,
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

/**
 * Apply filters to tours array
 */
function applyFilters(tours: FeaturedTour[], filters: ValidatedTourFilters): FeaturedTour[] {
  let filtered = [...tours]

  // Category filter (simplified - in real app would check category relation)
  if (filters.categories) {
    const categoryMap: Record<string, string[]> = {
      history: ['gamla-stan-walking', 'viking-history', 'nobel-prize-tour'],
      architecture: ['architecture-tour', 'sodermalm-art'],
      nature: ['djurgarden-nature'],
      maritime: ['vasa-museum'],
      royal: ['royal-palace'],
    }
    // Support comma-separated categories (multi-select)
    const selectedCategories = filters.categories.split(',').filter(Boolean)
    const tourIds = selectedCategories.flatMap((cat) => categoryMap[cat] || [])
    // If categories selected but no matching tours, return empty
    if (tourIds.length > 0) {
      filtered = filtered.filter((t) => tourIds.includes(t.id))
    } else if (selectedCategories.length > 0) {
      filtered = []
    }
  }

  // Price range filter
  if (filters.priceMin) {
    const min = parseInt(filters.priceMin, 10)
    filtered = filtered.filter((t) => t.price >= min)
  }
  if (filters.priceMax) {
    const max = parseInt(filters.priceMax, 10)
    filtered = filtered.filter((t) => t.price <= max)
  }

  // Duration filter
  if (filters.duration) {
    const maxDuration = parseInt(filters.duration, 10)
    filtered = filtered.filter((t) => t.duration <= maxDuration)
  }

  // Accessibility filter
  if (filters.accessible === 'true') {
    filtered = filtered.filter((t) => t.accessibility?.wheelchairAccessible === true)
  }

  // Search query
  if (filters.q) {
    const query = filters.q.toLowerCase()
    filtered = filtered.filter(
      (t) =>
        t.title.toLowerCase().includes(query) || t.description.toLowerCase().includes(query)
    )
  }

  return filtered
}

/**
 * Apply sorting to tours array
 */
function applySorting(tours: FeaturedTour[], sort?: string): FeaturedTour[] {
  const sorted = [...tours]

  switch (sort) {
    case 'price-asc':
      return sorted.sort((a, b) => a.price - b.price)
    case 'price-desc':
      return sorted.sort((a, b) => b.price - a.price)
    case 'duration-asc':
      return sorted.sort((a, b) => a.duration - b.duration)
    case 'duration-desc':
      return sorted.sort((a, b) => b.duration - a.duration)
    case 'rating':
      return sorted.sort((a, b) => b.rating - a.rating)
    case 'popular':
    default:
      // Sort by review count as popularity proxy
      return sorted.sort((a, b) => b.reviewCount - a.reviewCount)
  }
}

/**
 * Get tours with filtering, sorting, and pagination.
 * @param filters - Filter and sort parameters
 * @returns Paginated tours response
 */
export async function getTours(filters: TourFilters = {}): Promise<ToursResponse> {
  // Validate and sanitize filters
  const validatedFilters = validateTourFilters(filters as Record<string, string | undefined>)

  // TODO: Replace with Payload CMS query when CMS is configured
  // const payload = await getPayload({ config })
  // const where: any = { status: { equals: 'published' } }
  // ... build where clause from filters
  // const { docs, totalDocs, totalPages } = await payload.find({
  //   collection: 'tours',
  //   where,
  //   sort,
  //   locale: filters.locale,
  //   page: parseInt(filters.page || '1'),
  //   limit: parseInt(filters.limit || '9'),
  //   depth: 2
  // })

  // Apply filters (using validated filters)
  let tours = applyFilters(mockTours, validatedFilters)

  // Apply sorting
  tours = applySorting(tours, validatedFilters.sort)

  // Pagination
  const page = parseInt(validatedFilters.page || '1', 10)
  const limit = parseInt(validatedFilters.limit || '9', 10)
  const total = tours.length
  const totalPages = Math.ceil(total / limit)
  const startIndex = (page - 1) * limit
  const paginatedTours = tours.slice(startIndex, startIndex + limit)

  return {
    tours: paginatedTours,
    total,
    page,
    totalPages,
  }
}

/**
 * Get all available categories for filter dropdown.
 */
export function getTourCategories(): Array<{ id: string; name: string }> {
  return [
    { id: 'history', name: 'History & Heritage' },
    { id: 'architecture', name: 'Architecture' },
    { id: 'nature', name: 'Nature & Parks' },
    { id: 'maritime', name: 'Maritime History' },
    { id: 'royal', name: 'Royal Heritage' },
  ]
}
