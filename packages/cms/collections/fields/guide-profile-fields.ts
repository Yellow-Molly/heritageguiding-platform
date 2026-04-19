import type { Field } from 'payload'

/**
 * Profile section fields for the guides collection.
 * Stores structured guide data (guideStyle, quote, etc.) as separate
 * fields instead of merging everything into the single bio richText.
 *
 * Wrapped in a collapsible layout-only group — fields are stored at
 * the document root level (no nested data path).
 */
export const guideProfileFields: Field = {
  type: 'collapsible',
  label: 'Profile Sections',
  admin: { initCollapsed: true },
  fields: [
    {
      name: 'guideStyle',
      type: 'textarea',
      localized: true,
      admin: { description: 'Guiding approach/style description' },
    },
    {
      name: 'whatGuestsAppreciate',
      type: 'textarea',
      localized: true,
      admin: { description: 'What guests appreciate about this guide' },
    },
    {
      name: 'uniqueAspectsQuote',
      type: 'text',
      localized: true,
      maxLength: 500,
      admin: { description: 'Pull quote from guide' },
    },
    {
      name: 'uniqueAspectsBody',
      type: 'textarea',
      localized: true,
      admin: { description: 'Context/body text for the pull quote' },
    },
    {
      name: 'specialtyDescriptions',
      type: 'array',
      label: 'Specialty Descriptions',
      maxRows: 15,
      fields: [
        {
          name: 'description',
          type: 'text',
          localized: true,
          required: true,
          maxLength: 300,
        },
      ],
    },
  ],
}
