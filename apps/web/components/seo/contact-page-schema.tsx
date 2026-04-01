import React from 'react'

/**
 * Schema.org WebPage + ContactPage structured data for /contact.
 * @see https://schema.org/ContactPage
 */
export function ContactPageSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://privatetours.se'

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact Private Tours',
    description: 'Get in touch for private heritage tours in Sweden.',
    url: `${baseUrl}/contact`,
    mainEntity: {
      '@type': 'Organization',
      name: 'Private Tours',
      url: baseUrl,
      email: 'info@privatetours.se',
      telephone: '+46701234567',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Drottninggatan 5',
        addressLocality: 'Stockholm',
        postalCode: '111 51',
        addressCountry: 'SE',
      },
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
