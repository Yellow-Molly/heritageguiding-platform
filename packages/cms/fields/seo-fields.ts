import type { Field } from 'payload'

/**
 * Reusable SEO meta fields for content optimization
 * Supports localization (SV/EN/DE)
 */
export const seoFields: Field[] = [
  {
    name: 'metaTitle',
    type: 'text',
    localized: true,
    maxLength: 60,
    admin: {
      description: 'SEO title (max 60 chars)',
    },
  },
  {
    name: 'metaDescription',
    type: 'textarea',
    localized: true,
    maxLength: 160,
    admin: {
      description: 'SEO description (max 160 chars)',
    },
  },
  {
    name: 'ogImage',
    type: 'upload',
    relationTo: 'media',
    admin: {
      description: 'Open Graph image for social sharing',
    },
  },
]
