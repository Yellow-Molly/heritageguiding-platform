import React from 'react'

/**
 * Schema.org AboutPage + Organization structured data for /about-us.
 * Enhances search engine and AI assistant discoverability.
 * @see https://schema.org/AboutPage
 */

interface AboutSchemaProps {
  founders?: Array<{ name: string; image?: string }>
  description?: string
}

const defaultDescription =
  'Private Tours offers expert-led Stockholm heritage tours. Discover Swedish history and culture with licensed local guides.'

export function AboutSchema({ founders, description }: AboutSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'About Private Tours',
    description: description || defaultDescription,
    url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://privatetours.se'}/about-us`,
    mainEntity: {
      '@type': 'Organization',
      name: 'Private Tours',
      description: description || defaultDescription,
      url: process.env.NEXT_PUBLIC_SITE_URL || 'https://privatetours.se',
      foundingDate: '2024',
      areaServed: {
        '@type': 'City',
        name: 'Stockholm',
        '@id': 'https://www.wikidata.org/wiki/Q1754',
      },
      ...(founders &&
        founders.length > 0 && {
          founder: founders.map((f) => ({
            '@type': 'Person',
            name: f.name,
            ...(f.image && { image: f.image }),
          })),
        }),
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
