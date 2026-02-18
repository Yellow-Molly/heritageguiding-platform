import React from 'react'

/**
 * Schema.org ItemList of TouristAttraction for /tours listing page.
 * Helps search engines and AI understand the tour catalog.
 * @see https://schema.org/ItemList
 */

interface TourListItem {
  title: string
  slug: string
  image?: { url: string }
}

interface TourListSchemaProps {
  tours: TourListItem[]
}

export function TourListSchema({ tours }: TourListSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://privatetours.se'

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Stockholm Heritage Tours',
    description: 'Guided heritage tours in Stockholm, Sweden',
    numberOfItems: tours.length,
    itemListElement: tours.map((tour, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${baseUrl}/tours/${tour.slug}`,
      item: {
        '@type': 'TouristAttraction',
        name: tour.title,
        url: `${baseUrl}/tours/${tour.slug}`,
        ...(tour.image && { image: tour.image.url }),
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
