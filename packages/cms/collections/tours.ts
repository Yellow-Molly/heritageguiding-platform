import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access'
import { formatSlugHook, generateTourEmbeddingOnSaveHook } from '../hooks'
import {
  accessibilityFields,
  seoFields,
  logisticsFields,
  tourPricingFields,
  tourDurationFields,
  tourInclusionFields,
  tourDifficultyFields,
} from '../fields'
import { audienceTagsField } from '../fields/tour-audience-fields'

/**
 * Tours collection - core content type
 * Enhanced schema with logistics, inclusions, audience tags for Concierge Wizard
 *
 * Cascade Delete Strategy:
 * - Guide deletion: BLOCKED if guide has active tours (must reassign first)
 * - Category deletion: Tours retain reference (soft link, shows "deleted category")
 * - Neighborhood deletion: Tours retain reference (soft link)
 * - Media deletion: BLOCKED if used in tour gallery
 */
export const Tours: CollectionConfig = {
  slug: 'tours',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'featured', 'guide'],
    group: 'Content',
  },
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    afterChange: [generateTourEmbeddingOnSaveHook],
  },
  fields: [
    // ===== BASIC INFORMATION =====
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
      maxLength: 200,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      hooks: { beforeValidate: [formatSlugHook] },
      admin: { position: 'sidebar' },
    },
    {
      name: 'description',
      type: 'richText',
      required: true,
      localized: true,
      admin: { description: 'Full tour description' },
    },
    {
      name: 'shortDescription',
      type: 'textarea',
      required: true,
      localized: true,
      maxLength: 160,
      admin: { description: 'Brief summary for cards/previews (max 160 chars)' },
    },
    {
      name: 'highlights',
      type: 'array',
      localized: true,
      label: 'Tour Highlights',
      maxRows: 10,
      admin: { description: 'Key highlights/features of the tour' },
      fields: [{ name: 'highlight', type: 'text', required: true, maxLength: 200 }],
    },

    // ===== PRICING & DURATION =====
    { name: 'pricing', type: 'group', label: 'Pricing', fields: tourPricingFields },
    { name: 'duration', type: 'group', label: 'Duration', fields: tourDurationFields },

    // ===== LOGISTICS / MEETING POINT =====
    { name: 'logistics', type: 'group', label: 'Logistics & Meeting Point', fields: logisticsFields },

    // ===== INCLUSIONS & EXCLUSIONS =====
    ...tourInclusionFields,

    // ===== AUDIENCE & DIFFICULTY =====
    audienceTagsField,
    ...tourDifficultyFields,

    // ===== ACCESSIBILITY =====
    { name: 'accessibility', type: 'group', label: 'Accessibility', fields: accessibilityFields },

    // ===== RELATIONSHIPS =====
    {
      name: 'guide',
      type: 'relationship',
      relationTo: 'guides',
      required: true,
      index: true,
      admin: { description: 'Tour guide/expert' },
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      admin: { description: 'Tour categories/themes' },
    },
    {
      name: 'neighborhoods',
      type: 'relationship',
      relationTo: 'neighborhoods',
      hasMany: true,
      admin: { description: 'Areas covered by this tour' },
    },
    {
      name: 'images',
      type: 'array',
      label: 'Tour Gallery',
      maxRows: 20,
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'caption', type: 'text', localized: true, maxLength: 200 },
        { name: 'isPrimary', type: 'checkbox', defaultValue: false, admin: { description: 'Use as primary/featured image' } },
      ],
    },

    // ===== BOOKING & AVAILABILITY =====
    {
      name: 'bokunExperienceId',
      type: 'text',
      maxLength: 100,
      index: true,
      admin: {
        description: 'Bokun experience/activity ID for booking integration',
        position: 'sidebar',
      },
    },
    {
      name: 'availability',
      type: 'select',
      defaultValue: 'available',
      index: true,
      options: [
        { label: 'Available', value: 'available' },
        { label: 'Seasonal', value: 'seasonal' },
        { label: 'By Request', value: 'by_request' },
        { label: 'Unavailable', value: 'unavailable' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'maxGroupSize', type: 'number', min: 1, admin: { description: 'Maximum participants' } },
    { name: 'minGroupSize', type: 'number', defaultValue: 1, min: 1, admin: { description: 'Minimum participants to run tour' } },

    // ===== SEO & STATUS =====
    { name: 'seo', type: 'group', label: 'SEO', fields: seoFields },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      admin: { description: 'Feature on homepage', position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      index: true,
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
      admin: { position: 'sidebar' },
    },
  ],
}
