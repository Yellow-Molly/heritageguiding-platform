import React from 'react'

export interface FAQSchemaItem {
  question: string
  answer: string
}

interface FAQSchemaProps {
  faqs: FAQSchemaItem[]
}

/**
 * Schema.org FAQPage structured data for SEO.
 * Improves visibility in Google search results with rich snippets.
 * @see https://schema.org/FAQPage
 */
export function FAQSchema({ faqs }: FAQSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
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
