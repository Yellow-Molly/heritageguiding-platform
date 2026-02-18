import React from 'react'

/**
 * Schema.org ItemList of Person for /guides listing page.
 * Helps search engines and AI understand the guide catalog.
 * @see https://schema.org/ItemList
 */

interface GuideListItem {
  name: string
  slug: string
  photo?: { url: string }
  languages: string[]
}

interface GuideListSchemaProps {
  guides: GuideListItem[]
}

export function GuideListSchema({ guides }: GuideListSchemaProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://privatetours.se'

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Heritage Tour Guides',
    description: 'Expert heritage tour guides in Stockholm',
    numberOfItems: guides.length,
    itemListElement: guides.map((guide, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: `${baseUrl}/guides/${guide.slug}`,
      item: {
        '@type': 'Person',
        name: guide.name,
        url: `${baseUrl}/guides/${guide.slug}`,
        ...(guide.photo && { image: guide.photo.url }),
        jobTitle: 'Heritage Tour Guide',
        knowsLanguage: guide.languages,
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
