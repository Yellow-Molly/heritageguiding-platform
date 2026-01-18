import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access'
import { formatSlugHook } from '../hooks'

/**
 * Guides collection for tour experts
 * Links to Tours (one guide can lead many tours)
 */
export const Guides: CollectionConfig = {
  slug: 'guides',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'languages', 'email'],
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
      maxLength: 100,
      admin: {
        description: 'Full name of the guide',
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
      name: 'bio',
      type: 'richText',
      localized: true,
      admin: {
        description: 'Guide biography and background',
      },
    },
    {
      name: 'credentials',
      type: 'array',
      label: 'Credentials & Certifications',
      maxRows: 20,
      fields: [
        {
          name: 'credential',
          type: 'text',
          localized: true,
          required: true,
          maxLength: 200,
        },
      ],
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Professional photo of the guide',
      },
    },
    {
      name: 'email',
      type: 'email',
      admin: {
        description: 'Contact email (not exposed publicly)',
        position: 'sidebar',
      },
    },
    {
      name: 'languages',
      type: 'select',
      hasMany: true,
      required: true,
      options: [
        { label: 'Swedish', value: 'sv' },
        { label: 'English', value: 'en' },
        { label: 'German', value: 'de' },
        { label: 'French', value: 'fr' },
        { label: 'Spanish', value: 'es' },
        { label: 'Italian', value: 'it' },
      ],
      admin: {
        description: 'Languages the guide can conduct tours in',
      },
    },
  ],
}
