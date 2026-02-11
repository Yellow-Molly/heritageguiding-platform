import type { GlobalConfig } from 'payload'

/**
 * Site-wide settings managed via Payload CMS admin.
 * Includes WhatsApp number and other configurable values.
 */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  access: { read: () => true },
  fields: [
    {
      name: 'whatsappNumber',
      type: 'text',
      label: 'WhatsApp Phone Number',
      admin: {
        description: 'International format without + (e.g., 46701234567)',
      },
    },
  ],
}
