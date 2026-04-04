import type { CollectionConfig } from 'payload'
import { generateBlurOnUploadHook } from '../hooks/generate-blur-on-upload-hook'

/**
 * Media collection for images, videos, and documents
 * Supports responsive image sizes and localized alt text
 */
export const Media: CollectionConfig = {
  slug: 'media',
  hooks: {
    afterChange: [generateBlurOnUploadHook],
  },
  upload: {
    mimeTypes: ['image/*', 'video/*', 'application/pdf'],
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
      },
      {
        name: 'card',
        width: 768,
        height: 512,
        position: 'centre',
      },
      {
        name: 'hero',
        width: 1920,
        height: 1080,
        position: 'centre',
      },
    ],
  },
  admin: {
    useAsTitle: 'alt',
    description: 'Media files for tours, guides, and content',
    group: 'Media',
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      localized: true,
      label: 'Alt Text',
      admin: {
        description: 'Describe the image for accessibility (localized)',
      },
    },
    {
      name: 'blurDataUrl',
      type: 'text',
      admin: {
        description: 'Auto-generated blur placeholder (base64)',
        readOnly: true,
        position: 'sidebar',
      },
    },
    {
      name: 'caption',
      type: 'text',
      localized: true,
      label: 'Caption',
      admin: {
        description: 'Optional caption for the image (localized)',
      },
    },
  ],
  access: {
    read: () => true,
  },
}
