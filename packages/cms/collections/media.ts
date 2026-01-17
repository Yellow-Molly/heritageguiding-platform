import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
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
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      label: 'Alt Text',
      localized: true,
      admin: {
        description: 'Describe the image for accessibility (localized)',
      },
    },
    {
      name: 'caption',
      type: 'text',
      label: 'Caption',
      localized: true,
      admin: {
        description: 'Optional caption for the image (localized)',
      },
    },
  ],
  access: {
    read: () => true,
  },
}
