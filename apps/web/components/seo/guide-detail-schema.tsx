import React from 'react'
import { getCanonicalSiteUrl } from '@/lib/canonical-site-url'

/**
 * Schema.org Person structured data for guide detail pages.
 * Includes jobTitle, knowsLanguage, knowsAbout for AI discoverability.
 * @see https://schema.org/Person
 */

interface GuideSchemaProps {
  name: string
  slug: string
  photo?: string
  languages: string[]
  specializations: Array<{ name: string }>
  credentials?: Array<{ credential: string }>
}

export function GuideDetailSchema({
  name,
  slug,
  photo,
  languages,
  specializations,
  credentials,
}: GuideSchemaProps) {
  const baseUrl = getCanonicalSiteUrl()

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    url: `${baseUrl}/guides/${slug}`,
    ...(photo && { image: photo }),
    jobTitle: 'Heritage Tour Guide',
    knowsLanguage: languages,
    knowsAbout: specializations.map((s) => s.name),
    hasOccupation: {
      '@type': 'Occupation',
      name: 'Tour Guide',
      occupationLocation: {
        '@type': 'City',
        name: 'Stockholm',
      },
    },
    ...(credentials &&
      credentials.length > 0 && {
        hasCredential: credentials.map((c) => ({
          '@type': 'EducationalOccupationalCredential',
          name: c.credential,
        })),
      }),
    worksFor: {
      '@type': 'Organization',
      name: 'Private Tours',
      url: baseUrl,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
