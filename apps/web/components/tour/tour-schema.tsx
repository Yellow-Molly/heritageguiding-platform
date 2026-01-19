import type { TourDetail } from '@/lib/api/get-tour-by-slug'
import type { TourReview } from '@/lib/api/get-tour-reviews'
import { calculateAverageRating } from '@/lib/api/get-tour-reviews'

interface TourSchemaProps {
  tour: TourDetail
  reviews: TourReview[]
}

/**
 * Schema.org structured data for tour detail page.
 * Implements TouristAttraction and Product schemas for SEO.
 */
export function TourSchema({ tour, reviews }: TourSchemaProps) {
  const averageRating = calculateAverageRating(reviews)

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: tour.title,
    description: tour.description,
    image: tour.gallery?.[0]?.image?.url || tour.image.url,
    touristType: tour.categories?.map((c) => c.name) || [],
    isAccessibleForFree: false,
    publicAccess: true,
    ...(averageRating > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: averageRating.toFixed(1),
        reviewCount: reviews.length,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    offers: {
      '@type': 'Offer',
      price: tour.price,
      priceCurrency: 'SEK',
      availability: 'https://schema.org/InStock',
      validFrom: new Date().toISOString(),
    },
    ...(tour.guide && {
      provider: {
        '@type': 'Person',
        name: tour.guide.name,
        description: tour.guide.bio,
        image: tour.guide.photo?.url,
      },
    }),
    ...(tour.logistics?.coordinates && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: tour.logistics.coordinates.latitude,
        longitude: tour.logistics.coordinates.longitude,
      },
    }),
    ...(tour.logistics?.meetingPointAddress && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: tour.logistics.meetingPointAddress,
        addressLocality: 'Stockholm',
        addressCountry: 'SE',
      },
    }),
  }

  // Product schema for e-commerce features
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: tour.title,
    description: tour.description,
    image: tour.gallery?.[0]?.image?.url || tour.image.url,
    ...(averageRating > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: averageRating.toFixed(1),
        reviewCount: reviews.length,
      },
    }),
    offers: {
      '@type': 'Offer',
      price: tour.price,
      priceCurrency: 'SEK',
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: 'HeritageGuiding',
      },
    },
    ...(reviews.length > 0 && {
      review: reviews.slice(0, 5).map((review) => ({
        '@type': 'Review',
        reviewRating: {
          '@type': 'Rating',
          ratingValue: review.rating,
          bestRating: 5,
        },
        author: {
          '@type': 'Person',
          name: review.authorName,
        },
        reviewBody: review.text,
        datePublished: review.date,
      })),
    }),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
    </>
  )
}
