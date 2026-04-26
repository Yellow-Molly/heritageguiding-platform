import React from 'react'
import {
  CONTACT_ADDRESS,
  CONTACT_EMAIL,
  CONTACT_PHONE_TEL,
  SOCIAL_URLS,
} from '@/lib/contact-constants'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://privatetours.se'

/**
 * Schema.org TravelAgency structured data for SEO.
 * Improves discoverability in search engines and AI assistants.
 *
 * Note: aggregateRating intentionally omitted — re-add only when real reviews
 * are seeded (validation 2026-04-25, decision #5). Fake structured data
 * triggers Google penalties.
 */

interface TravelAgencySchemaProps {
  name?: string
  description?: string
  url?: string
  telephone?: string
  email?: string
  address?: {
    streetAddress?: string
    addressLocality?: string
    addressCountry?: string
    postalCode?: string
  }
  priceRange?: string
  sameAs?: string[]
}

const defaultData: TravelAgencySchemaProps = {
  name: 'Private Tours',
  description:
    'Expert-led Stockholm heritage tours. Discover Swedish history and culture with licensed local guides offering private and group tours in Swedish, English, and German.',
  url: SITE_URL,
  telephone: CONTACT_PHONE_TEL,
  email: CONTACT_EMAIL,
  address: { ...CONTACT_ADDRESS },
  priceRange: '$$',
  sameAs: [SOCIAL_URLS.facebook, SOCIAL_URLS.instagram, SOCIAL_URLS.linkedin],
}

export function TravelAgencySchema(props: TravelAgencySchemaProps = {}) {
  const data = { ...defaultData, ...props }

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    name: data.name,
    description: data.description,
    url: data.url,
    telephone: data.telephone,
    email: data.email,
    address: data.address
      ? {
          '@type': 'PostalAddress',
          streetAddress: data.address.streetAddress,
          addressLocality: data.address.addressLocality,
          addressCountry: data.address.addressCountry,
          postalCode: data.address.postalCode,
        }
      : undefined,
    priceRange: data.priceRange,
    sameAs: data.sameAs,
    areaServed: {
      '@type': 'City',
      name: 'Stockholm',
      '@id': 'https://www.wikidata.org/wiki/Q1754',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Heritage Tours',
      itemListElement: [
        {
          '@type': 'OfferCatalog',
          name: 'Walking Tours',
        },
        {
          '@type': 'OfferCatalog',
          name: 'Private Tours',
        },
        {
          '@type': 'OfferCatalog',
          name: 'Group Tours',
        },
      ],
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '09:00',
        closes: '18:00',
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

/**
 * WebPage schema for individual pages.
 */
interface WebPageSchemaProps {
  name: string
  description: string
  url: string
  breadcrumb?: Array<{ name: string; url: string }>
}

export function WebPageSchema({ name, description, url, breadcrumb }: WebPageSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name,
    description,
    url,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Private Tours',
      url: SITE_URL,
    },
    breadcrumb: breadcrumb
      ? {
          '@type': 'BreadcrumbList',
          itemListElement: breadcrumb.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
          })),
        }
      : undefined,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
