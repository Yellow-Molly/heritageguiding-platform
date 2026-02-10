/**
 * Tour Recommendation API Route
 * POST /api/tours/recommend
 * Returns tours matching audience tags and interest preferences from the Concierge Wizard.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getPayload } from 'payload'
import config from '@payload-config'

// Valid targetAudience values from the CMS schema
const validTags = [
  'family_friendly', 'couples', 'corporate', 'seniors', 'history_nerds',
  'photography', 'art_lovers', 'food_wine', 'adventure', 'architecture', 'solo_travelers',
] as const

const requestSchema = z.object({
  audience: z.array(z.enum(validTags)).min(1).max(5),
  interests: z.array(z.enum(validTags)).max(6).default([]),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = requestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { audience, interests } = parsed.data
    const payload = await getPayload({ config })

    // Combine audience + interests into a single targetAudience query
    const allTags = [...audience, ...interests]

    const { docs } = await payload.find({
      collection: 'tours',
      where: {
        and: [
          { status: { equals: 'published' } },
          { targetAudience: { in: allTags } },
        ],
      },
      limit: 6,
      sort: '-featured',
      depth: 2,
    })

    // Transform CMS docs to FeaturedTour shape for TourCard compatibility
    const tours = docs.map((doc) => {
      const primaryImage = doc.images?.find((img) => img.isPrimary) || doc.images?.[0]
      const imageData = primaryImage?.image as { url?: string; alt?: string } | undefined

      return {
        id: doc.id,
        title: doc.title,
        description: doc.shortDescription || '',
        slug: doc.slug,
        image: {
          url: imageData?.url || '/placeholder-tour.jpg',
          alt: imageData?.alt || doc.title || '',
        },
        duration: (doc.duration as { minutes?: number })?.minutes || 0,
        maxCapacity: doc.maxGroupSize || 12,
        rating: 4.8,
        reviewCount: 0,
        price: (doc.pricing as { adultPrice?: number })?.adultPrice || 0,
        featured: doc.featured || false,
        accessibility: {
          wheelchairAccessible: (doc.accessibility as { wheelchairAccessible?: boolean })?.wheelchairAccessible,
          hearingAccessible: (doc.accessibility as { hearingAccessible?: boolean })?.hearingAccessible,
        },
      }
    })

    return NextResponse.json(tours)
  } catch (error) {
    console.error('Recommendation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
