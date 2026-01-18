import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access'
import { formatSlugHook } from '../hooks'

/**
 * Categories collection for tour classification
 * Themes like history, architecture, food, etc.
 */
export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'type', 'slug', 'icon'],
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
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
      maxLength: 100,
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
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { label: 'Theme', value: 'theme' },
        { label: 'Activity', value: 'activity' },
      ],
      defaultValue: 'theme',
      admin: {
        description: 'Category type for filtering',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'icon',
      type: 'text',
      maxLength: 50,
      admin: {
        description: 'Lucide icon name (e.g., "castle", "utensils", "camera")',
      },
    },
  ],
}
