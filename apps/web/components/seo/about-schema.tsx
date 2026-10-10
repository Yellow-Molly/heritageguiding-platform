import React from 'react'
import { getCanonicalSiteUrl } from '@/lib/canonical-site-url'

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
  'Private Tours offers expertly hosted experiences across Sweden. Discover Swedish culture, nature, and food with licensed guides, chefs, and artisans.'

export function AboutSchema({ founders, description }: AboutSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    name: 'About Private Tours',
    description: description || defaultDescription,
    url: `${getCanonicalSiteUrl()}/about-us`,
    mainEntity: {
      '@type': 'Organization',
      name: 'Private Tours',
      description: description || defaultDescription,
      url: getCanonicalSiteUrl(),
      foundingDate: '2024',
      areaServed: {
        '@type': 'Country',
        name: 'Sweden',
        '@id': 'https://www.wikidata.org/wiki/Q34',
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
