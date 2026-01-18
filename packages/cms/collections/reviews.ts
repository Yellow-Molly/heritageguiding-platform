import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access'

/**
 * Reviews collection for tour testimonials
 * Linked to Tours, supports verified reviews
 */
export const Reviews: CollectionConfig = {
  slug: 'reviews',
  admin: {
    useAsTitle: 'authorName',
    defaultColumns: ['authorName', 'tour', 'rating', 'verified', 'date'],
    group: 'Content',
  },
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'tour',
      type: 'relationship',
      relationTo: 'tours',
      required: true,
      admin: {
        description: 'Tour being reviewed',
      },
    },
    {
      name: 'rating',
      type: 'number',
      required: true,
      min: 1,
      max: 5,
      index: true,
      admin: {
        description: 'Rating from 1 to 5 stars',
      },
    },
    {
      name: 'text',
      type: 'textarea',
      localized: true,
      maxLength: 2000,
      admin: {
        description: 'Review text/comment (max 2000 chars)',
      },
    },
    {
      name: 'authorName',
      type: 'text',
      required: true,
      maxLength: 100,
      admin: {
        description: 'Name of the reviewer',
      },
    },
    {
      name: 'authorCountry',
      type: 'text',
      maxLength: 100,
      admin: {
        description: 'Country of origin (for display)',
      },
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      admin: {
        description: 'Review date',
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
    {
      name: 'verified',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Verified purchase/attendance',
        position: 'sidebar',
      },
    },
  ],
}
