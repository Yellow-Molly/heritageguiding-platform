/**
 * Fetches a single tour by slug from CMS.
 * In production, this will query Payload CMS. Currently uses mock data.
 * Cached with on-demand revalidation via revalidateTag('tours').
 */

import { unstable_cache } from 'next/cache'
import type { FeaturedTour } from './get-featured-tours'

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
  /** Guide information */
  guide?: {
    id: string
    name: string
    photo?: {
      url: string
      alt: string
    }
    bio: string
    credentials?: Array<{ credential: string }>
    languages?: string[]
  }
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

// Extended mock data with full tour details
const mockTourDetails: Record<string, TourDetail> = {
  'gamla-stan-walking': {
    id: 'gamla-stan-walking',
    title: 'Gamla Stan Walking Tour',
    description:
      'Explore the medieval streets of Old Town, discover hidden courtyards, and hear tales of Swedish royalty.',
    descriptionHtml: `
      <p>Step back in time as you wander through the cobblestone streets of Gamla Stan, Stockholm's enchanting Old Town. This immersive walking tour takes you through narrow medieval alleyways, past colorful merchant houses, and into hidden courtyards that most visitors never discover.</p>
      <p>Your expert guide will bring centuries of Swedish history to life with captivating stories of royal intrigue, merchant rivalries, and everyday life in medieval Stockholm. From the grand Royal Palace to the charming Stortorget square, every corner reveals a new chapter of this fascinating city's past.</p>
    `,
    slug: 'gamla-stan-walking',
    image: {
      url: 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?auto=format&fit=crop&w=800&q=80',
      alt: 'Narrow medieval street in Gamla Stan, Stockholm',
    },
    gallery: [
      {
        image: {
          url: 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?auto=format&fit=crop&w=1200&q=80',
          alt: 'Narrow medieval street in Gamla Stan',
        },
      },
      {
        image: {
          url: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=1200&q=80',
          alt: 'Colorful buildings in Stortorget square',
        },
      },
      {
        image: {
          url: 'https://images.unsplash.com/photo-1508003330702-33c2a2c2f36e?auto=format&fit=crop&w=1200&q=80',
          alt: 'Royal Palace exterior view',
        },
      },
    ],
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
    highlights: [
      { highlight: 'Explore hidden medieval courtyards' },
      { highlight: 'See the Royal Palace and changing of the guard' },
      { highlight: 'Visit the iconic Stortorget square' },
      { highlight: 'Learn about Viking and medieval history' },
      { highlight: 'Discover the Nobel Museum building' },
    ],
    logistics: {
      meetingPointName: 'Gustav Adolf Square',
      meetingPointAddress: 'Gustav Adolfs torg, 111 52 Stockholm',
      meetingPointInstructions:
        'Look for the guide holding a red umbrella near the statue of King Gustav II Adolf.',
      coordinates: {
        latitude: 59.3293,
        longitude: 18.0686,
      },
      googleMapsLink: 'https://maps.google.com/?q=59.3293,18.0686',
      publicTransportInfo:
        'T-Centralen metro station (all lines), then 5 min walk. Bus 2, 55, 76 stop nearby.',
      parkingInfo:
        'Paid parking available at Kungsträdgården garage (500m walk). Street parking limited.',
      endingPoint: 'Tour ends at Stortorget square in Gamla Stan',
    },
    included: [
      { item: 'Professional English-speaking guide' },
      { item: 'Small group experience (max 15 people)' },
      { item: 'Historical maps and visual aids' },
      { item: 'Free cancellation up to 24 hours before' },
    ],
    notIncluded: [
      { item: 'Hotel pickup and drop-off' },
      { item: 'Food and drinks' },
      { item: 'Entrance fees to museums' },
      { item: 'Gratuities (optional)' },
    ],
    whatToBring: [
      { item: 'Comfortable walking shoes' },
      { item: 'Weather-appropriate clothing' },
      { item: 'Camera' },
      { item: 'Water bottle' },
    ],
    guide: {
      id: 'guide-erik',
      name: 'Erik Lindqvist',
      photo: {
        url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        alt: 'Erik Lindqvist, tour guide',
      },
      bio: 'Erik is a certified Stockholm guide with over 15 years of experience. A history graduate from Stockholm University, he specializes in medieval Scandinavian history and has authored two books about Old Town. His passion for storytelling makes every tour an unforgettable journey through time.',
      credentials: [
        { credential: 'Certified Stockholm Guide' },
        { credential: 'History MA, Stockholm University' },
        { credential: 'Author & Historian' },
      ],
      languages: ['English', 'Swedish', 'German'],
    },
    categories: [
      { id: 'history', name: 'History', slug: 'history' },
      { id: 'walking', name: 'Walking Tours', slug: 'walking' },
    ],
    audienceTags: ['history-lovers', 'first-time-visitors', 'culture-seekers'],
    bokunExperienceId: 'GAMLASTAN001',
  },
  'royal-palace': {
    id: 'royal-palace',
    title: 'Royal Palace Experience',
    description:
      "Step inside one of Europe's largest palaces and uncover 500 years of Swedish monarchy history.",
    descriptionHtml: `
      <p>Experience the grandeur of Swedish royalty at the magnificent Royal Palace, one of the largest palaces in Europe still used for its original purpose. This exclusive tour takes you behind the scenes of 500 years of monarchy, from the dramatic history of the Bernadotte dynasty to the ceremonial splendor of state occasions.</p>
      <p>Marvel at the stunning state apartments, the Treasury with crown jewels, and the Royal Chapel. Your guide will share insider stories about royal life, scandals, and the continuing role of the Swedish monarchy today.</p>
    `,
    slug: 'royal-palace',
    image: {
      url: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80',
      alt: 'Royal Palace in Stockholm with guards',
    },
    gallery: [
      {
        image: {
          url: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1200&q=80',
          alt: 'Royal Palace exterior',
        },
      },
      {
        image: {
          url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=1200&q=80',
          alt: 'Palace interior state room',
        },
      },
    ],
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
    highlights: [
      { highlight: 'Skip-the-line palace entrance' },
      { highlight: 'Visit the Royal Apartments' },
      { highlight: 'See the Crown Jewels in the Treasury' },
      { highlight: 'Watch the changing of the guard' },
      { highlight: 'Explore the Royal Chapel' },
    ],
    logistics: {
      meetingPointName: 'Royal Palace Main Entrance',
      meetingPointAddress: 'Kungliga slottet, 107 70 Stockholm',
      meetingPointInstructions:
        'Meet at the main entrance facing Slottsbacken. Guide will have a HeritageGuiding sign.',
      coordinates: {
        latitude: 59.3268,
        longitude: 18.0717,
      },
      googleMapsLink: 'https://maps.google.com/?q=59.3268,18.0717',
      publicTransportInfo:
        'Gamla Stan metro station (red/green line), 3 min walk. Bus 2, 43, 55, 76.',
      parkingInfo: 'Limited street parking. Nearest garage: Slottsgaraget (underground).',
    },
    included: [
      { item: 'Skip-the-line entrance ticket' },
      { item: 'Expert guide with palace access' },
      { item: 'Small group (max 12 people)' },
      { item: 'Headsets for clear audio' },
    ],
    notIncluded: [
      { item: 'Transportation to meeting point' },
      { item: 'Food and beverages' },
      { item: 'Personal expenses' },
    ],
    whatToBring: [
      { item: 'Comfortable shoes for standing' },
      { item: 'Photo ID' },
      { item: 'Camera (no flash photography inside)' },
    ],
    guide: {
      id: 'guide-anna',
      name: 'Anna Bergström',
      photo: {
        url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
        alt: 'Anna Bergström, tour guide',
      },
      bio: 'Anna is a royal history specialist with exclusive access to areas of the palace not open to regular visitors. She has worked with the Royal Court on historical documentation and brings unparalleled insider knowledge to every tour.',
      credentials: [
        { credential: 'Royal Court Certified Guide' },
        { credential: 'Art History PhD' },
        { credential: 'Former Palace Curator' },
      ],
      languages: ['English', 'Swedish', 'French'],
    },
    categories: [
      { id: 'history', name: 'History', slug: 'history' },
      { id: 'museum', name: 'Museums', slug: 'museum' },
    ],
    audienceTags: ['royalty-fans', 'history-lovers', 'art-enthusiasts'],
    bokunExperienceId: 'ROYALPALACE001',
  },
  'vasa-museum': {
    id: 'vasa-museum',
    title: 'Vasa Museum Deep Dive',
    description:
      "Marvel at the world's only preserved 17th-century ship and learn about its dramatic story.",
    descriptionHtml: `
      <p>Discover one of the world's most extraordinary maritime treasures: the Vasa warship. This magnificent 17th-century vessel sank on its maiden voyage in 1628 and was salvaged almost completely intact 333 years later. Today, it stands as the world's best-preserved ship of its era.</p>
      <p>On this in-depth tour, you'll explore every angle of this engineering marvel, from its ornate carvings to the tragic story of its sinking. Learn about life aboard a 17th-century warship, the ambitious king who commissioned it, and the remarkable salvage operation that brought it back to light.</p>
    `,
    slug: 'vasa-museum',
    image: {
      url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80',
      alt: 'View of Stockholm harbor near Vasa Museum',
    },
    gallery: [
      {
        image: {
          url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80',
          alt: 'Stockholm harbor view',
        },
      },
    ],
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
    highlights: [
      { highlight: 'See the only preserved 17th-century ship' },
      { highlight: 'Learn the dramatic sinking story' },
      { highlight: 'Examine over 700 original sculptures' },
      { highlight: 'Understand 17th-century naval life' },
      { highlight: 'Skip-the-line museum access' },
    ],
    logistics: {
      meetingPointName: 'Vasa Museum Entrance',
      meetingPointAddress: 'Galärvarvsvägen 14, 115 21 Stockholm',
      meetingPointInstructions:
        'Meet outside the main entrance, under the museum sign. Guide wears a HeritageGuiding badge.',
      coordinates: {
        latitude: 59.328,
        longitude: 18.0914,
      },
      googleMapsLink: 'https://maps.google.com/?q=59.328,18.0914',
      publicTransportInfo:
        'Tram 7 to Nordiska Museet/Vasamuseet. Bus 67, 69. Ferry from Slussen to Djurgården.',
      parkingInfo: 'Paid parking on Djurgården. Limited spaces, arrive early.',
    },
    included: [
      { item: 'Skip-the-line museum ticket' },
      { item: 'Expert maritime guide' },
      { item: 'Headsets for clear audio' },
      { item: 'Access to all museum levels' },
    ],
    notIncluded: [
      { item: 'Transportation' },
      { item: 'Food and drinks' },
      { item: 'Museum shop purchases' },
    ],
    whatToBring: [
      { item: 'Comfortable shoes' },
      { item: 'Light jacket (museum is climate controlled)' },
      { item: 'Curiosity and questions!' },
    ],
    guide: {
      id: 'guide-magnus',
      name: 'Magnus Eriksson',
      photo: {
        url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
        alt: 'Magnus Eriksson, tour guide',
      },
      bio: 'Magnus is a maritime historian and former naval officer with a passion for Swedish naval history. He has been guiding at the Vasa Museum for over a decade and continues to uncover new stories about this remarkable ship.',
      credentials: [
        { credential: 'Maritime History Specialist' },
        { credential: 'Former Swedish Navy Officer' },
        { credential: 'Museum Partner Guide' },
      ],
      languages: ['English', 'Swedish', 'Norwegian'],
    },
    categories: [
      { id: 'museum', name: 'Museums', slug: 'museum' },
      { id: 'history', name: 'History', slug: 'history' },
    ],
    audienceTags: ['history-lovers', 'families', 'maritime-enthusiasts'],
    bokunExperienceId: 'VASA001',
  },
}

/**
 * Internal fetch function for tour by slug.
 */
async function fetchTourBySlug(
  slug: string,
  _locale: string = 'en'
): Promise<TourDetail | null> {
  // TODO: Replace with Payload CMS query when CMS is configured
  return mockTourDetails[slug] || null
}

/**
 * Get a single tour by its slug.
 * Cached with on-demand revalidation via revalidateTag('tours').
 * @param slug - The tour URL slug
 * @param locale - The locale for content (sv, en, de)
 * @returns Tour detail or null if not found
 */
export const getTourBySlug = unstable_cache(
  fetchTourBySlug,
  ['tour-by-slug'],
  { tags: ['tours'] }
)

/**
 * Get all tour slugs for static generation.
 * @returns Array of tour slugs
 */
export async function getAllTourSlugs(): Promise<Array<{ slug: string }>> {
  // TODO: Replace with Payload CMS query when CMS is configured
  return Object.keys(mockTourDetails).map((slug) => ({ slug }))
}
