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
    defaultColumns: ['name', 'status', 'languages', 'email'],
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
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'On Leave', value: 'on-leave' },
      ],
      admin: {
        position: 'sidebar',
        description: 'Guide availability status',
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
      name: 'phone',
      type: 'text',
      maxLength: 20,
      admin: {
        description: 'Contact phone (not exposed publicly)',
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
    {
      name: 'specializations',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      index: true,
      admin: {
        description: 'Tour categories this guide specializes in',
      },
    },
    {
      name: 'operatingAreas',
      type: 'relationship',
      relationTo: 'cities',
      hasMany: true,
      index: true,
      admin: {
        description: 'Cities where this guide operates',
      },
    },
    {
      name: 'additionalLanguages',
      type: 'select',
      hasMany: true,
      options: [
        { label: 'Japanese', value: 'ja' },
        { label: 'Chinese', value: 'zh' },
        { label: 'Norwegian', value: 'no' },
        { label: 'Danish', value: 'da' },
        { label: 'Finnish', value: 'fi' },
        { label: 'Dutch', value: 'nl' },
        { label: 'Portuguese', value: 'pt' },
        { label: 'Russian', value: 'ru' },
        { label: 'Arabic', value: 'ar' },
        { label: 'Korean', value: 'ko' },
        { label: 'Polish', value: 'pl' },
        { label: 'Thai', value: 'th' },
        { label: 'Hindi', value: 'hi' },
      ],
      admin: {
        description: 'Additional languages beyond main tour languages',
      },
    },
  ],
}
