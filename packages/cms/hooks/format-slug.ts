import type { FieldHook } from 'payload'

/**
 * Formats a string into a URL-friendly slug
 * Converts to lowercase, replaces spaces with hyphens, removes special chars
 */
export const formatSlug = (val: string): string =>
  val
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')

/**
 * Field hook to auto-generate slug from title field
 * Only generates if slug is empty and title exists
 */
export const formatSlugHook: FieldHook = ({ data, operation, value }) => {
  // If slug already exists and not empty, preserve it
  if (value && typeof value === 'string' && value.trim().length > 0) {
    return formatSlug(value)
  }

  // Auto-generate from title on create
  if (operation === 'create' && data?.title && typeof data.title === 'string') {
    return formatSlug(data.title)
  }

  return value
}
