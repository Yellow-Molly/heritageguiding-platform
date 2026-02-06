/**
 * Tour CSV Row Validation Schemas
 * Zod schemas for validating CSV import rows with detailed error reporting
 */
import { z } from 'zod'

/**
 * Transform semicolon-separated string to array
 */
const semicolonArray = z
  .string()
  .optional()
  .transform((val) => (val ? val.split(';').map((s) => s.trim()).filter(Boolean) : []))

/**
 * Transform coordinate string "lat,lng" to GeoJSON format [lng, lat]
 */
const coordinatesSchema = z
  .string()
  .optional()
  .transform((val) => {
    if (!val) return undefined
    const [lat, lng] = val.split(',').map((s) => parseFloat(s.trim()))
    return !isNaN(lat) && !isNaN(lng) ? [lng, lat] : undefined
  })

/**
 * Transform string to boolean
 */
const booleanString = z
  .string()
  .optional()
  .transform((val) => {
    if (!val || val === '') return false
    return val.toLowerCase() === 'true' || val === '1'
  })

/**
 * Coerce number from string with empty handling
 */
const optionalNumber = z
  .string()
  .optional()
  .transform((val) => {
    if (!val || val === '') return undefined
    const num = parseFloat(val)
    return isNaN(num) ? undefined : num
  })

/**
 * Required number coercion
 */
const requiredNumber = z.coerce.number()

/**
 * Tour CSV Row Schema
 * Validates and transforms raw CSV row data
 */
export const tourCSVRowSchema = z.object({
  // === REQUIRED FIELDS ===
  slug: z.string().min(1, 'Slug is required'),
  title_sv: z.string().min(1, 'Swedish title is required'),
  shortDescription_sv: z.string().min(1, 'Swedish short description required').max(160, 'Max 160 characters'),
  pricing_basePrice: requiredNumber.pipe(z.number().min(0, 'Price must be >= 0')),
  pricing_priceType: z.enum(['per_person', 'per_group', 'custom']),
  duration_hours: requiredNumber.pipe(z.number().min(0.5, 'Minimum 0.5 hours')),
  guide_slug: z.string().min(1, 'Guide slug is required'),
  logistics_meetingPointName_sv: z.string().min(1, 'Swedish meeting point name required'),

  // === OPTIONAL LOCALIZED TEXT ===
  title_en: z.string().optional(),
  title_de: z.string().optional(),
  shortDescription_en: z.string().max(160).optional(),
  shortDescription_de: z.string().max(160).optional(),
  description_sv: z.string().optional(),
  description_en: z.string().optional(),
  description_de: z.string().optional(),

  // === OPTIONAL PRICING ===
  pricing_currency: z.enum(['SEK', 'EUR', 'USD']).optional().default('SEK'),
  pricing_groupDiscount: booleanString,
  pricing_childPrice: optionalNumber,

  // === OPTIONAL DURATION ===
  duration_durationText_sv: z.string().optional(),
  duration_durationText_en: z.string().optional(),
  duration_durationText_de: z.string().optional(),

  // === OPTIONAL LOGISTICS ===
  logistics_meetingPointName_en: z.string().optional(),
  logistics_meetingPointName_de: z.string().optional(),
  logistics_meetingPointAddress_sv: z.string().optional(),
  logistics_meetingPointAddress_en: z.string().optional(),
  logistics_meetingPointAddress_de: z.string().optional(),
  logistics_coordinates: coordinatesSchema,
  logistics_googleMapsLink: z.string().optional(),
  logistics_meetingPointInstructions_sv: z.string().optional(),
  logistics_meetingPointInstructions_en: z.string().optional(),
  logistics_meetingPointInstructions_de: z.string().optional(),
  logistics_endingPoint_sv: z.string().optional(),
  logistics_endingPoint_en: z.string().optional(),
  logistics_endingPoint_de: z.string().optional(),
  logistics_parkingInfo_sv: z.string().optional(),
  logistics_parkingInfo_en: z.string().optional(),
  logistics_parkingInfo_de: z.string().optional(),
  logistics_publicTransportInfo_sv: z.string().optional(),
  logistics_publicTransportInfo_en: z.string().optional(),
  logistics_publicTransportInfo_de: z.string().optional(),

  // === LOCALIZED ARRAYS (semicolon-separated) ===
  highlights_sv: semicolonArray,
  highlights_en: semicolonArray,
  highlights_de: semicolonArray,
  included_sv: semicolonArray,
  included_en: semicolonArray,
  included_de: semicolonArray,
  notIncluded_sv: semicolonArray,
  notIncluded_en: semicolonArray,
  notIncluded_de: semicolonArray,
  whatToBring_sv: semicolonArray,
  whatToBring_en: semicolonArray,
  whatToBring_de: semicolonArray,

  // === AUDIENCE & DIFFICULTY ===
  targetAudience: semicolonArray,
  difficultyLevel: z.enum(['easy', 'moderate', 'challenging']).optional(),
  ageRecommendation_minimumAge: optionalNumber,
  ageRecommendation_childFriendly: booleanString,
  ageRecommendation_teenFriendly: booleanString,

  // === ACCESSIBILITY ===
  accessibility_wheelchairAccessible: booleanString,
  accessibility_mobilityNotes_sv: z.string().optional(),
  accessibility_mobilityNotes_en: z.string().optional(),
  accessibility_mobilityNotes_de: z.string().optional(),
  accessibility_hearingAssistance: booleanString,
  accessibility_visualAssistance: booleanString,
  accessibility_serviceAnimalsAllowed: booleanString,

  // === RELATIONSHIPS (semicolon-separated slugs) ===
  categories: semicolonArray,
  neighborhoods: semicolonArray,

  // === STATUS/META ===
  bokunExperienceId: z.string().optional(),
  availability: z.enum(['available', 'seasonal', 'by_request', 'unavailable']).optional().default('available'),
  maxGroupSize: optionalNumber,
  minGroupSize: optionalNumber,
  featured: booleanString,
  status: z.enum(['draft', 'published', 'archived']).optional().default('draft'),
}).passthrough() // Allow extra columns we don't process

export type TourCSVRow = z.infer<typeof tourCSVRowSchema>

export interface CSVValidationError {
  row: number
  field: string
  message: string
}

export interface CSVValidationResult {
  valid: boolean
  data?: TourCSVRow
  errors?: CSVValidationError[]
}

/**
 * Validate a single CSV row
 * @param row Raw CSV row as key-value pairs
 * @param rowNumber 1-indexed row number (accounting for header)
 */
export function validateCSVRow(row: Record<string, string>, rowNumber: number): CSVValidationResult {
  const result = tourCSVRowSchema.safeParse(row)

  if (!result.success) {
    return {
      valid: false,
      errors: result.error.issues.map((issue) => ({
        row: rowNumber,
        field: issue.path.join('.'),
        message: issue.message,
      })),
    }
  }

  return { valid: true, data: result.data }
}
