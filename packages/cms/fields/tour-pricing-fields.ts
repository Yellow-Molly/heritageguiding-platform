import type { Field } from 'payload'

/**
 * Pricing and duration fields for tours
 * Includes base price, currency, group discounts
 */
export const tourPricingFields: Field[] = [
  {
    name: 'basePrice',
    type: 'number',
    required: true,
    min: 0,
    admin: {
      description: 'Base price amount',
    },
  },
  {
    name: 'currency',
    type: 'select',
    defaultValue: 'SEK',
    options: [
      { label: 'SEK', value: 'SEK' },
      { label: 'EUR', value: 'EUR' },
      { label: 'USD', value: 'USD' },
    ],
  },
  {
    name: 'priceType',
    type: 'select',
    required: true,
    options: [
      { label: 'Per Person', value: 'per_person' },
      { label: 'Per Group', value: 'per_group' },
      { label: 'Custom', value: 'custom' },
    ],
  },
  {
    name: 'groupDiscount',
    type: 'checkbox',
    defaultValue: false,
    label: 'Group Discount Available',
  },
  {
    name: 'childPrice',
    type: 'number',
    min: 0,
    admin: {
      description: 'Special price for children (optional)',
    },
  },
]

/**
 * Duration fields for tours
 */
export const tourDurationFields: Field[] = [
  {
    name: 'hours',
    type: 'number',
    required: true,
    min: 0.5,
    admin: {
      description: 'Duration in hours (e.g., 2.5)',
    },
  },
  {
    name: 'durationText',
    type: 'text',
    localized: true,
    maxLength: 100,
    admin: {
      description: 'Human-readable duration (e.g., "Approximately 2-3 hours")',
    },
  },
]
