import { z } from 'zod'

/**
 * Sanitize search query string to prevent XSS
 * Removes HTML tags and trims whitespace
 */
export function sanitizeSearchQuery(query: string): string {
  return query
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>"'&]/g, '') // Remove special chars that could be used in XSS
    .trim()
    .slice(0, 100) // Limit length
}

/**
 * Zod schema for tour filter validation
 */
/** Reusable slug-list refiner shared by categories/cities. Max 20 slugs, max 64 chars each. */
const slugListValid = (val: string | undefined) => {
  if (!val) return true
  const slugs = val.split(',').filter(Boolean)
  if (slugs.length > 20) return false
  return slugs.every((s) => s.length <= 64 && /^[a-z0-9-]+$/.test(s))
}

export const tourFiltersSchema = z.object({
  categories: z
    .string()
    .optional()
    .refine(slugListValid, { message: 'Invalid category slug format' }),
  cities: z
    .string()
    .optional()
    .refine(slugListValid, { message: 'Invalid city slug format' }),
  duration: z
    .string()
    .optional()
    .refine((val) => !val || ['60', '90', '120', '180', '240'].includes(val), {
      message: 'Invalid duration',
    }),
  accessible: z.enum(['true', 'false']).optional(),
  sort: z
    .enum(['popular', 'price-asc', 'price-desc', 'duration-asc', 'duration-desc', 'rating'])
    .optional()
    .default('popular'),
  q: z.string().optional().transform((val) => (val ? sanitizeSearchQuery(val) : undefined)),
  page: z
    .string()
    .optional()
    .refine((val) => !val || (!isNaN(parseInt(val, 10)) && parseInt(val, 10) >= 1), {
      message: 'Invalid page number',
    }),
  limit: z
    .string()
    .optional()
    .refine((val) => !val || (!isNaN(parseInt(val, 10)) && parseInt(val, 10) >= 1 && parseInt(val, 10) <= 50), {
      message: 'Invalid limit',
    }),
})

export type ValidatedTourFilters = z.infer<typeof tourFiltersSchema>

/**
 * Validate and sanitize tour filters
 * Returns validated filters or default values on validation failure
 */
export function validateTourFilters(filters: Record<string, string | undefined>): ValidatedTourFilters {
  const result = tourFiltersSchema.safeParse(filters)

  if (result.success) {
    return result.data
  }

  // Return safe defaults on validation failure
  console.warn('Tour filter validation failed:', result.error.issues)
  return {
    sort: 'popular',
    q: undefined,
  }
}
