import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access'
import { formatSlugHook } from '../hooks'

/**
 * Neighborhoods collection for GEO expansion
 * Belongs to City, can have many Tours
 */
export const Neighborhoods: CollectionConfig = {
  slug: 'neighborhoods',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'city', 'slug'],
    group: 'Geography',
  },
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
      maxLength: 100,
      admin: {
        description: 'Neighborhood name (e.g., Gamla Stan, Djurgården)',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      hooks: {
        beforeValidate: [formatSlugHook],
      },
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'city',
      type: 'relationship',
      relationTo: 'cities',
      required: true,
      admin: {
        description: 'Parent city',
      },
    },
    {
      name: 'description',
      type: 'richText',
      localized: true,
    },
    {
      name: 'coordinates',
      type: 'point',
      label: 'Center Point',
      admin: {
        description: 'Center coordinates of the neighborhood',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Representative image of the neighborhood',
      },
    },
  ],
}
