/**
 * Tour CSV Column Mapping
 * Defines column structure for CSV export/import with flattened naming convention
 * Supports localized fields (sv/en/de) with underscore suffix notation
 */
import type { Tour, Guide, Category, Neighborhood, Media } from '../../payload-types'

export const LOCALES = ['sv', 'en', 'de'] as const
export type Locale = (typeof LOCALES)[number]

/** Column type definitions for CSV mapping */
export type CSVColumnType =
  | 'text'
  | 'number'
  | 'boolean'
  | 'select'
  | 'multiselect'
  | 'array'
  | 'relationship'
  | 'relationshipMany'
  | 'richtext'
  | 'point'
  | 'localizedArray'

export interface CSVColumnDefinition {
  csvColumn: string
  tourPath: string
  type: CSVColumnType
  localized?: boolean
  /** For array fields, the subfield name to extract */
  arrayItemField?: string
  /** Human-readable label for CSV header */
  label?: string
}

/**
 * Tour CSV column definitions
 * Maps tour fields to CSV columns with flattening logic
 */
/** Locale display names for headers */
const LOCALE_LABELS: Record<Locale, string> = {
  sv: 'Swedish',
  en: 'English',
  de: 'German',
}

export const TOUR_CSV_COLUMNS: CSVColumnDefinition[] = [
  // ===== Basic Information =====
  { csvColumn: 'slug', tourPath: 'slug', type: 'text', label: 'Slug (URL)' },
  { csvColumn: 'title', tourPath: 'title', type: 'text', localized: true, label: 'Title' },
  { csvColumn: 'shortDescription', tourPath: 'shortDescription', type: 'text', localized: true, label: 'Short Description' },
  { csvColumn: 'description', tourPath: 'description', type: 'richtext', localized: true, label: 'Full Description' },
  { csvColumn: 'highlights', tourPath: 'highlights', type: 'localizedArray', localized: true, arrayItemField: 'highlight', label: 'Highlights' },

  // ===== Pricing Group =====
  { csvColumn: 'pricing_basePrice', tourPath: 'pricing.basePrice', type: 'number', label: 'Base Price' },
  { csvColumn: 'pricing_currency', tourPath: 'pricing.currency', type: 'select', label: 'Currency' },
  { csvColumn: 'pricing_priceType', tourPath: 'pricing.priceType', type: 'select', label: 'Price Type' },
  { csvColumn: 'pricing_groupDiscount', tourPath: 'pricing.groupDiscount', type: 'boolean', label: 'Group Discount?' },
  { csvColumn: 'pricing_childPrice', tourPath: 'pricing.childPrice', type: 'number', label: 'Child Price' },

  // ===== Duration Group =====
  { csvColumn: 'duration_hours', tourPath: 'duration.hours', type: 'number', label: 'Duration (Hours)' },
  { csvColumn: 'duration_durationText', tourPath: 'duration.durationText', type: 'text', localized: true, label: 'Duration Text' },

  // ===== Logistics Group =====
  { csvColumn: 'logistics_meetingPointName', tourPath: 'logistics.meetingPointName', type: 'text', localized: true, label: 'Meeting Point Name' },
  { csvColumn: 'logistics_meetingPointAddress', tourPath: 'logistics.meetingPointAddress', type: 'text', localized: true, label: 'Meeting Point Address' },
  { csvColumn: 'logistics_coordinates', tourPath: 'logistics.coordinates', type: 'point', label: 'Coordinates (lat,lng)' },
  { csvColumn: 'logistics_googleMapsLink', tourPath: 'logistics.googleMapsLink', type: 'text', label: 'Google Maps Link' },
  { csvColumn: 'logistics_meetingPointInstructions', tourPath: 'logistics.meetingPointInstructions', type: 'text', localized: true, label: 'Meeting Instructions' },
  { csvColumn: 'logistics_endingPoint', tourPath: 'logistics.endingPoint', type: 'text', localized: true, label: 'Ending Point' },
  { csvColumn: 'logistics_parkingInfo', tourPath: 'logistics.parkingInfo', type: 'text', localized: true, label: 'Parking Info' },
  { csvColumn: 'logistics_publicTransportInfo', tourPath: 'logistics.publicTransportInfo', type: 'text', localized: true, label: 'Public Transport Info' },

  // ===== Inclusions (localized arrays) =====
  { csvColumn: 'included', tourPath: 'included', type: 'localizedArray', localized: true, arrayItemField: 'item', label: 'Included' },
  { csvColumn: 'notIncluded', tourPath: 'notIncluded', type: 'localizedArray', localized: true, arrayItemField: 'item', label: 'Not Included' },
  { csvColumn: 'whatToBring', tourPath: 'whatToBring', type: 'localizedArray', localized: true, arrayItemField: 'item', label: 'What to Bring' },

  // ===== Audience & Difficulty =====
  { csvColumn: 'targetAudience', tourPath: 'targetAudience', type: 'multiselect', label: 'Target Audience' },
  { csvColumn: 'difficultyLevel', tourPath: 'difficultyLevel', type: 'select', label: 'Difficulty Level' },
  { csvColumn: 'ageRecommendation_minimumAge', tourPath: 'ageRecommendation.minimumAge', type: 'number', label: 'Minimum Age' },
  { csvColumn: 'ageRecommendation_childFriendly', tourPath: 'ageRecommendation.childFriendly', type: 'boolean', label: 'Child Friendly?' },
  { csvColumn: 'ageRecommendation_teenFriendly', tourPath: 'ageRecommendation.teenFriendly', type: 'boolean', label: 'Teen Friendly?' },

  // ===== Accessibility Group =====
  { csvColumn: 'accessibility_wheelchairAccessible', tourPath: 'accessibility.wheelchairAccessible', type: 'boolean', label: 'Wheelchair Accessible?' },
  { csvColumn: 'accessibility_mobilityNotes', tourPath: 'accessibility.mobilityNotes', type: 'text', localized: true, label: 'Mobility Notes' },
  { csvColumn: 'accessibility_hearingAssistance', tourPath: 'accessibility.hearingAssistance', type: 'boolean', label: 'Hearing Assistance?' },
  { csvColumn: 'accessibility_visualAssistance', tourPath: 'accessibility.visualAssistance', type: 'boolean', label: 'Visual Assistance?' },
  { csvColumn: 'accessibility_serviceAnimalsAllowed', tourPath: 'accessibility.serviceAnimalsAllowed', type: 'boolean', label: 'Service Animals Allowed?' },

  // ===== Relationships =====
  { csvColumn: 'guide', tourPath: 'guide', type: 'relationship', label: 'Guide (slug)' },
  { csvColumn: 'categories', tourPath: 'categories', type: 'relationshipMany', label: 'Categories (slugs)' },
  { csvColumn: 'neighborhoods', tourPath: 'neighborhoods', type: 'relationshipMany', label: 'Neighborhoods (slugs)' },
  { csvColumn: 'images', tourPath: 'images', type: 'array', arrayItemField: 'image', label: 'Images (URLs)' },

  // ===== Status/Meta =====
  { csvColumn: 'bokunExperienceId', tourPath: 'bokunExperienceId', type: 'text', label: 'Bokun Experience ID' },
  { csvColumn: 'availability', tourPath: 'availability', type: 'select', label: 'Availability' },
  { csvColumn: 'maxGroupSize', tourPath: 'maxGroupSize', type: 'number', label: 'Max Group Size' },
  { csvColumn: 'minGroupSize', tourPath: 'minGroupSize', type: 'number', label: 'Min Group Size' },
  { csvColumn: 'featured', tourPath: 'featured', type: 'boolean', label: 'Featured?' },
  { csvColumn: 'status', tourPath: 'status', type: 'select', label: 'Status' },
]

/**
 * Generate CSV headers with human-readable labels
 * Returns both display headers and internal column keys
 */
export function getCSVHeaders(): { displayHeaders: string[]; columnKeys: string[] } {
  const displayHeaders: string[] = []
  const columnKeys: string[] = []

  for (const col of TOUR_CSV_COLUMNS) {
    const label = col.label || col.csvColumn
    if (col.localized) {
      for (const locale of LOCALES) {
        displayHeaders.push(`${label} (${LOCALE_LABELS[locale]})`)
        columnKeys.push(`${col.csvColumn}_${locale}`)
      }
    } else {
      displayHeaders.push(label)
      columnKeys.push(col.csvColumn)
    }
  }

  return { displayHeaders, columnKeys }
}

/**
 * Extract text content from a Lexical JSON rich text node
 */
function extractTextFromNode(node: Record<string, unknown>): string {
  if (node.type === 'text' && typeof node.text === 'string') {
    return node.text
  }
  if (Array.isArray(node.children)) {
    return node.children.map((child) => extractTextFromNode(child as Record<string, unknown>)).join('')
  }
  return ''
}

/**
 * Convert Lexical JSON rich text to plain text for CSV export
 * Joins paragraphs with double newlines
 */
export function lexicalToPlainText(lexicalJson: unknown): string {
  if (!lexicalJson || typeof lexicalJson !== 'object') return ''

  const json = lexicalJson as Record<string, unknown>
  const root = json.root as Record<string, unknown> | undefined
  if (!root || !Array.isArray(root.children)) return ''

  return root.children
    .map((node) => extractTextFromNode(node as Record<string, unknown>))
    .filter(Boolean)
    .join('\n\n')
}

/**
 * Get value from nested object path (e.g., "pricing.basePrice")
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current, key) => {
    if (current && typeof current === 'object') {
      return (current as Record<string, unknown>)[key]
    }
    return undefined
  }, obj as unknown)
}

/**
 * Format point coordinates as "lat,lng" string
 */
function formatPoint(point: unknown): string {
  if (!point || !Array.isArray(point) || point.length !== 2) return ''
  const [lng, lat] = point as [number, number]
  return `${lat},${lng}`
}

/**
 * Format boolean value as "true" or "false" string
 */
function formatBoolean(value: unknown): string {
  if (value === true) return 'true'
  if (value === false) return 'false'
  return ''
}

/**
 * Format array items as semicolon-separated string
 */
function formatArray(arr: unknown, itemField?: string): string {
  if (!Array.isArray(arr)) return ''
  return arr
    .map((item) => {
      if (itemField && typeof item === 'object' && item !== null) {
        return (item as Record<string, unknown>)[itemField]
      }
      return item
    })
    .filter(Boolean)
    .join(';')
}

/**
 * Extract slug from a relationship field (single)
 */
function extractRelationshipSlug(rel: unknown): string {
  if (!rel) return ''
  // If populated (object with slug), extract slug
  if (typeof rel === 'object' && rel !== null && 'slug' in rel) {
    return (rel as Guide | Category | Neighborhood).slug
  }
  // If just ID, return empty (can't resolve without DB)
  return String(rel)
}

/**
 * Extract slugs from hasMany relationship field
 */
function extractRelationshipManySlugs(rels: unknown): string {
  if (!Array.isArray(rels)) return ''
  return rels.map(extractRelationshipSlug).filter(Boolean).join(';')
}

/**
 * Extract URLs from images array
 */
function extractImageUrls(images: unknown): string {
  if (!Array.isArray(images)) return ''
  return images
    .map((img) => {
      if (typeof img !== 'object' || img === null) return ''
      const imageObj = img as { image?: number | Media }
      const media = imageObj.image
      if (typeof media === 'object' && media !== null && 'url' in media) {
        return media.url || ''
      }
      return ''
    })
    .filter(Boolean)
    .join(';')
}

/** Tour with all locales expanded */
export interface TourWithLocales extends Omit<Tour, 'title' | 'shortDescription' | 'description' | 'highlights' | 'included' | 'notIncluded' | 'whatToBring' | 'duration' | 'logistics' | 'accessibility'> {
  title: Record<Locale, string>
  shortDescription: Record<Locale, string>
  description: Record<Locale, unknown>
  highlights: Record<Locale, Array<{ highlight: string; id?: string | null }> | null>
  included: Record<Locale, Array<{ item: string; id?: string | null }> | null>
  notIncluded: Record<Locale, Array<{ item: string; id?: string | null }> | null>
  whatToBring: Record<Locale, Array<{ item?: string | null; id?: string | null }> | null>
  duration: {
    hours: number
    durationText?: Record<Locale, string | null>
  }
  logistics: {
    meetingPointName: Record<Locale, string>
    meetingPointAddress?: Record<Locale, string | null>
    coordinates?: [number, number] | null
    googleMapsLink?: string | null
    meetingPointInstructions?: Record<Locale, string | null>
    endingPoint?: Record<Locale, string | null>
    parkingInfo?: Record<Locale, string | null>
    publicTransportInfo?: Record<Locale, string | null>
  }
  accessibility?: {
    wheelchairAccessible?: boolean | null
    mobilityNotes?: Record<Locale, string | null>
    hearingAssistance?: boolean | null
    visualAssistance?: boolean | null
    serviceAnimalsAllowed?: boolean | null
  }
}

/**
 * Flatten a tour object to a CSV row (key-value pairs)
 * Handles localized fields by expanding to _sv, _en, _de columns
 */
export function flattenTourToCSVRow(tour: TourWithLocales): Record<string, string> {
  const row: Record<string, string> = {}

  for (const col of TOUR_CSV_COLUMNS) {
    if (col.localized) {
      // Handle localized fields - expand to _sv, _en, _de
      for (const locale of LOCALES) {
        const csvKey = `${col.csvColumn}_${locale}`
        const value = getLocalizedValue(tour, col.tourPath, locale)

        switch (col.type) {
          case 'richtext':
            row[csvKey] = lexicalToPlainText(value)
            break
          case 'localizedArray':
            row[csvKey] = formatArray(value, col.arrayItemField)
            break
          default:
            row[csvKey] = safeStringify(value)
        }
      }
    } else {
      // Non-localized field
      const value = getNestedValue(tour as unknown as Record<string, unknown>, col.tourPath)

      switch (col.type) {
        case 'number':
          row[col.csvColumn] = safeStringify(value)
          break
        case 'boolean':
          row[col.csvColumn] = formatBoolean(value)
          break
        case 'point':
          row[col.csvColumn] = formatPoint(value)
          break
        case 'multiselect':
          row[col.csvColumn] = Array.isArray(value) ? value.join(';') : ''
          break
        case 'array':
          if (col.csvColumn === 'images') {
            row[col.csvColumn] = extractImageUrls(value)
          } else {
            row[col.csvColumn] = formatArray(value, col.arrayItemField)
          }
          break
        case 'relationship':
          row[col.csvColumn] = extractRelationshipSlug(value)
          break
        case 'relationshipMany':
          row[col.csvColumn] = extractRelationshipManySlugs(value)
          break
        default:
          row[col.csvColumn] = safeStringify(value)
      }
    }
  }

  return row
}

/**
 * Get localized value from tour object using dot notation path
 * When fetching with locale: 'all', localized fields become objects with locale keys
 */
function getLocalizedValue(tour: TourWithLocales, path: string, locale: Locale): unknown {
  const parts = path.split('.')
  let current: unknown = tour

  for (let i = 0; i < parts.length; i++) {
    if (current === null || current === undefined) return undefined

    const key = parts[i]
    current = (current as Record<string, unknown>)[key]
  }

  // If we got an object, check if it's a localized object with locale keys
  if (current && typeof current === 'object' && !Array.isArray(current)) {
    const localized = current as Record<string, unknown>
    // Check if this looks like a localized object (has sv, en, or de keys)
    if ('sv' in localized || 'en' in localized || 'de' in localized) {
      // Return the value for the requested locale, or undefined if not present
      return localized[locale]
    }
  }

  return current
}

/**
 * Safely convert a value to string, handling objects gracefully
 */
function safeStringify(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  // For objects, return empty string (shouldn't happen if data is correct)
  if (typeof value === 'object') return ''
  return String(value)
}

// ============================================================================
// CSV ROW TO TOUR DATA CONVERSION (for import)
// ============================================================================

import { markdownToLexical } from './tour-csv-markdown-to-lexical-converter'
import type { TourCSVRow } from './tour-csv-schema-validation'

export interface CSVImportRelationships {
  guideId: string | number
  categoryIds: (string | number)[]
  neighborhoodIds: (string | number)[]
}

/**
 * Helper to get array with Swedish fallback if empty
 */
function arrayWithFallback<T>(arr: T[] | undefined, fallback: T[] | undefined): T[] {
  if (arr && arr.length > 0) return arr
  return fallback || []
}

/**
 * Convert a validated CSV row to Payload Tour document structure
 * Applies Swedish fallback for empty EN/DE localized fields
 */
export function csvRowToTourData(
  row: TourCSVRow,
  relationships: CSVImportRelationships
): Record<string, unknown> {
  return {
    slug: row.slug,
    title: {
      sv: row.title_sv,
      en: row.title_en || row.title_sv,
      de: row.title_de || row.title_sv,
    },
    shortDescription: {
      sv: row.shortDescription_sv,
      en: row.shortDescription_en || row.shortDescription_sv,
      de: row.shortDescription_de || row.shortDescription_sv,
    },
    description: {
      sv: markdownToLexical(row.description_sv),
      en: markdownToLexical(row.description_en || row.description_sv),
      de: markdownToLexical(row.description_de || row.description_sv),
    },
    highlights: {
      sv: (row.highlights_sv || []).map((h) => ({ highlight: h })),
      en: arrayWithFallback(row.highlights_en, row.highlights_sv).map((h) => ({ highlight: h })),
      de: arrayWithFallback(row.highlights_de, row.highlights_sv).map((h) => ({ highlight: h })),
    },
    pricing: {
      basePrice: row.pricing_basePrice,
      currency: row.pricing_currency || 'SEK',
      priceType: row.pricing_priceType,
      groupDiscount: row.pricing_groupDiscount || false,
      childPrice: row.pricing_childPrice,
    },
    duration: {
      hours: row.duration_hours,
      durationText: {
        sv: row.duration_durationText_sv || null,
        en: row.duration_durationText_en || row.duration_durationText_sv || null,
        de: row.duration_durationText_de || row.duration_durationText_sv || null,
      },
    },
    logistics: {
      meetingPointName: {
        sv: row.logistics_meetingPointName_sv,
        en: row.logistics_meetingPointName_en || row.logistics_meetingPointName_sv,
        de: row.logistics_meetingPointName_de || row.logistics_meetingPointName_sv,
      },
      meetingPointAddress: {
        sv: row.logistics_meetingPointAddress_sv || null,
        en: row.logistics_meetingPointAddress_en || row.logistics_meetingPointAddress_sv || null,
        de: row.logistics_meetingPointAddress_de || row.logistics_meetingPointAddress_sv || null,
      },
      coordinates: row.logistics_coordinates || null,
      googleMapsLink: row.logistics_googleMapsLink || null,
      meetingPointInstructions: {
        sv: row.logistics_meetingPointInstructions_sv || null,
        en: row.logistics_meetingPointInstructions_en || row.logistics_meetingPointInstructions_sv || null,
        de: row.logistics_meetingPointInstructions_de || row.logistics_meetingPointInstructions_sv || null,
      },
      endingPoint: {
        sv: row.logistics_endingPoint_sv || null,
        en: row.logistics_endingPoint_en || row.logistics_endingPoint_sv || null,
        de: row.logistics_endingPoint_de || row.logistics_endingPoint_sv || null,
      },
      parkingInfo: {
        sv: row.logistics_parkingInfo_sv || null,
        en: row.logistics_parkingInfo_en || row.logistics_parkingInfo_sv || null,
        de: row.logistics_parkingInfo_de || row.logistics_parkingInfo_sv || null,
      },
      publicTransportInfo: {
        sv: row.logistics_publicTransportInfo_sv || null,
        en: row.logistics_publicTransportInfo_en || row.logistics_publicTransportInfo_sv || null,
        de: row.logistics_publicTransportInfo_de || row.logistics_publicTransportInfo_sv || null,
      },
    },
    included: {
      sv: (row.included_sv || []).map((item) => ({ item })),
      en: arrayWithFallback(row.included_en, row.included_sv).map((item) => ({ item })),
      de: arrayWithFallback(row.included_de, row.included_sv).map((item) => ({ item })),
    },
    notIncluded: {
      sv: (row.notIncluded_sv || []).map((item) => ({ item })),
      en: arrayWithFallback(row.notIncluded_en, row.notIncluded_sv).map((item) => ({ item })),
      de: arrayWithFallback(row.notIncluded_de, row.notIncluded_sv).map((item) => ({ item })),
    },
    whatToBring: {
      sv: (row.whatToBring_sv || []).map((item) => ({ item })),
      en: arrayWithFallback(row.whatToBring_en, row.whatToBring_sv).map((item) => ({ item })),
      de: arrayWithFallback(row.whatToBring_de, row.whatToBring_sv).map((item) => ({ item })),
    },
    targetAudience: row.targetAudience || [],
    difficultyLevel: row.difficultyLevel || null,
    ageRecommendation: {
      minimumAge: row.ageRecommendation_minimumAge || null,
      childFriendly: row.ageRecommendation_childFriendly || false,
      teenFriendly: row.ageRecommendation_teenFriendly || false,
    },
    accessibility: {
      wheelchairAccessible: row.accessibility_wheelchairAccessible || false,
      mobilityNotes: {
        sv: row.accessibility_mobilityNotes_sv || null,
        en: row.accessibility_mobilityNotes_en || row.accessibility_mobilityNotes_sv || null,
        de: row.accessibility_mobilityNotes_de || row.accessibility_mobilityNotes_sv || null,
      },
      hearingAssistance: row.accessibility_hearingAssistance || false,
      visualAssistance: row.accessibility_visualAssistance || false,
      serviceAnimalsAllowed: row.accessibility_serviceAnimalsAllowed || false,
    },
    guide: relationships.guideId,
    categories: relationships.categoryIds,
    neighborhoods: relationships.neighborhoodIds,
    bokunExperienceId: row.bokunExperienceId || null,
    availability: row.availability || 'available',
    maxGroupSize: row.maxGroupSize || null,
    minGroupSize: row.minGroupSize || null,
    featured: row.featured || false,
    status: row.status || 'draft',
    // Note: images[] field is skipped during import - add manually in CMS
  }
}
