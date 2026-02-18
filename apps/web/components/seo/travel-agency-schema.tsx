import React from 'react'

/**
 * Schema.org TravelAgency structured data for SEO.
 * Improves discoverability in search engines and AI assistants.
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
  aggregateRating?: {
    ratingValue: number
    reviewCount: number
  }
  sameAs?: string[]
}

const defaultData: TravelAgencySchemaProps = {
  name: 'Private Tours',
  description:
    'Expert-led Stockholm heritage tours. Discover Swedish history and culture with licensed local guides offering private and group tours in Swedish, English, and German.',
  url: 'https://privatetours.se',
  telephone: '+46812345678',
  email: 'info@privatetours.se',
  address: {
    streetAddress: 'Gamla Stan',
    addressLocality: 'Stockholm',
    addressCountry: 'SE',
    postalCode: '111 29',
  },
  priceRange: '$$',
  aggregateRating: {
    ratingValue: 4.9,
    reviewCount: 735,
  },
  sameAs: [
    'https://facebook.com/privatetours',
    'https://instagram.com/privatetours',
    'https://linkedin.com/company/privatetours',
  ],
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
    aggregateRating: data.aggregateRating
      ? {
          '@type': 'AggregateRating',
          ratingValue: data.aggregateRating.ratingValue,
          reviewCount: data.aggregateRating.reviewCount,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined,
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
      url: 'https://privatetours.se',
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
