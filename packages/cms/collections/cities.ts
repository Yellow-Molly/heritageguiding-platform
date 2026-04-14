import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access'
import {
  formatSlugHook,
  createRevalidateTagsAfterChangeHook,
  createRevalidateTagsAfterDeleteHook,
} from '../hooks'

/**
 * Cities collection for GEO expansion
 * Parent entity for Neighborhoods - enables multi-city tour support
 */
export const Cities: CollectionConfig = {
  slug: 'cities',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'country', 'slug'],
    group: 'Geography',
  },
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    // Guides show operatingAreas (cities) — invalidate guides cache on city change.
    afterChange: [createRevalidateTagsAfterChangeHook(['guides'])],
    afterDelete: [createRevalidateTagsAfterDeleteHook(['guides'])],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
      maxLength: 100,
      admin: {
        description: 'City name (e.g., Stockholm, Gothenburg)',
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
      name: 'country',
      type: 'text',
      required: true,
      maxLength: 100,
      defaultValue: 'Sweden',
    },
    {
      name: 'coordinates',
      type: 'point',
      label: 'City Center Coordinates',
    },
    {
      name: 'description',
      type: 'richText',
      localized: true,
    },
  ],
}
