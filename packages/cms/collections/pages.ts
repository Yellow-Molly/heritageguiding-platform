import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access'
import { formatSlugHook } from '../hooks'

/**
 * Pages collection for static content
 * FAQ, About Us, Terms, Privacy, Contact
 */
export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'pageType', 'slug', 'showInFooter'],
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
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
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
      name: 'pageType',
      type: 'select',
      required: true,
      options: [
        { label: 'About Us', value: 'about' },
        { label: 'FAQ', value: 'faq' },
        { label: 'Terms & Conditions', value: 'terms' },
        { label: 'Privacy Policy', value: 'privacy' },
        { label: 'Contact', value: 'contact' },
        { label: 'Custom', value: 'custom' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      localized: true,
      admin: {
        description: 'Page content (supports rich text)',
      },
    },
    {
      name: 'metaTitle',
      type: 'text',
      localized: true,
      admin: {
        description: 'SEO title (optional)',
      },
    },
    {
      name: 'metaDescription',
      type: 'textarea',
      localized: true,
      maxLength: 160,
      admin: {
        description: 'SEO description (max 160 chars)',
      },
    },
    {
      name: 'showInFooter',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Display link in website footer',
        position: 'sidebar',
      },
    },
    {
      name: 'showInHeader',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Display link in website header',
        position: 'sidebar',
      },
    },
  ],
}
