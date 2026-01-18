import type { Field } from 'payload'

/**
 * Reusable slug field with unique constraint
 * Used across Tours, Guides, Categories, etc.
 */
export const slugField: Field = {
  name: 'slug',
  type: 'text',
  required: true,
  unique: true,
  index: true,
  admin: {
    position: 'sidebar',
    description: 'URL-friendly identifier (auto-generated from title)',
  },
}
