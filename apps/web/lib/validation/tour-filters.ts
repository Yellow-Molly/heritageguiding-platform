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
const VALID_CATEGORIES = ['history', 'architecture', 'nature', 'maritime', 'royal']

export const tourFiltersSchema = z.object({
  categories: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true
        // Validate comma-separated categories
        const cats = val.split(',').filter(Boolean)
        return cats.every((cat) => VALID_CATEGORIES.includes(cat))
      },
      { message: 'Invalid category' }
    ),
  priceMin: z
    .string()
    .optional()
    .refine((val) => !val || (!isNaN(parseInt(val, 10)) && parseInt(val, 10) >= 0), {
      message: 'Invalid minimum price',
    }),
  priceMax: z
    .string()
    .optional()
    .refine((val) => !val || (!isNaN(parseInt(val, 10)) && parseInt(val, 10) >= 0), {
      message: 'Invalid maximum price',
    }),
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
  .refine(
    (data) => {
      // Validate priceMin <= priceMax
      if (data.priceMin && data.priceMax) {
        return parseInt(data.priceMin, 10) <= parseInt(data.priceMax, 10)
      }
      return true
    },
    {
      message: 'Minimum price must be less than or equal to maximum price',
      path: ['priceMin'],
    }
  )

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
