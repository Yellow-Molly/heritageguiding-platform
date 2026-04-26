import React from 'react'
import {
  CONTACT_ADDRESS,
  CONTACT_EMAIL,
  CONTACT_PHONE_TEL,
} from '@/lib/contact-constants'

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
      email: CONTACT_EMAIL,
      telephone: CONTACT_PHONE_TEL,
      address: {
        '@type': 'PostalAddress',
        ...CONTACT_ADDRESS,
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
