import type { Field } from 'payload'

/**
 * Inclusion/exclusion fields for tours
 * What's included, not included, and what to bring
 */
export const tourInclusionFields: Field[] = [
  {
    name: 'included',
    type: 'array',
    label: "What's Included",
    localized: true,
    maxRows: 20,
    fields: [
      {
        name: 'item',
        type: 'text',
        required: true,
        maxLength: 200,
      },
    ],
  },
  {
    name: 'notIncluded',
    type: 'array',
    label: "What's NOT Included",
    localized: true,
    maxRows: 20,
    fields: [
      {
        name: 'item',
        type: 'text',
        required: true,
        maxLength: 200,
      },
    ],
  },
  {
    name: 'whatToBring',
    type: 'array',
    label: 'What to Bring',
    localized: true,
    maxRows: 20,
    fields: [
      {
        name: 'item',
        type: 'text',
        maxLength: 200,
      },
    ],
  },
]
