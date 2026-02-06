import { describe, it, expect } from 'vitest'
import {
  tourCSVRowSchema,
  validateCSVRow,
  type TourCSVRow,
} from '../lib/csv/tour-csv-schema-validation'

describe('tourCSVRowSchema', () => {
  const validRow: Record<string, string> = {
    slug: 'test-tour',
    title_sv: 'Test Tour',
    shortDescription_sv: 'A short description',
    pricing_basePrice: '500',
    pricing_priceType: 'per_person',
    duration_hours: '2',
    guide_slug: 'erik-guide',
    logistics_meetingPointName_sv: 'Central Station',
  }

  it('parses valid minimal row', () => {
    const result = tourCSVRowSchema.safeParse(validRow)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.slug).toBe('test-tour')
      expect(result.data.pricing_basePrice).toBe(500)
      expect(result.data.duration_hours).toBe(2)
    }
  })

  it('fails on missing required slug', () => {
    const row = { ...validRow, slug: '' }
    const result = tourCSVRowSchema.safeParse(row)
    expect(result.success).toBe(false)
  })

  it('fails on missing required title_sv', () => {
    const row = { ...validRow, title_sv: '' }
    const result = tourCSVRowSchema.safeParse(row)
    expect(result.success).toBe(false)
  })

  it('fails on invalid pricing_priceType', () => {
    const row = { ...validRow, pricing_priceType: 'invalid' }
    const result = tourCSVRowSchema.safeParse(row)
    expect(result.success).toBe(false)
  })

  it('fails on duration_hours below minimum', () => {
    const row = { ...validRow, duration_hours: '0.2' }
    const result = tourCSVRowSchema.safeParse(row)
    expect(result.success).toBe(false)
  })

  it('fails on negative pricing_basePrice', () => {
    const row = { ...validRow, pricing_basePrice: '-100' }
    const result = tourCSVRowSchema.safeParse(row)
    expect(result.success).toBe(false)
  })

  it('fails on shortDescription_sv exceeding 160 chars', () => {
    const row = { ...validRow, shortDescription_sv: 'x'.repeat(161) }
    const result = tourCSVRowSchema.safeParse(row)
    expect(result.success).toBe(false)
  })

  describe('optional fields with defaults', () => {
    it('defaults pricing_currency to SEK', () => {
      const result = tourCSVRowSchema.safeParse(validRow)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.pricing_currency).toBe('SEK')
      }
    })

    it('defaults status to draft', () => {
      const result = tourCSVRowSchema.safeParse(validRow)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('draft')
      }
    })

    it('defaults availability to available', () => {
      const result = tourCSVRowSchema.safeParse(validRow)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.availability).toBe('available')
      }
    })
  })

  describe('boolean string transformation', () => {
    it('transforms "true" string to true', () => {
      const row = { ...validRow, featured: 'true' }
      const result = tourCSVRowSchema.safeParse(row)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.featured).toBe(true)
      }
    })

    it('transforms "1" string to true', () => {
      const row = { ...validRow, featured: '1' }
      const result = tourCSVRowSchema.safeParse(row)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.featured).toBe(true)
      }
    })

    it('transforms "false" string to false', () => {
      const row = { ...validRow, featured: 'false' }
      const result = tourCSVRowSchema.safeParse(row)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.featured).toBe(false)
      }
    })

    it('transforms empty string to false', () => {
      const row = { ...validRow, featured: '' }
      const result = tourCSVRowSchema.safeParse(row)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.featured).toBe(false)
      }
    })
  })

  describe('semicolon array transformation', () => {
    it('transforms semicolon-separated string to array', () => {
      const row = { ...validRow, categories: 'history;walking;culture' }
      const result = tourCSVRowSchema.safeParse(row)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.categories).toEqual(['history', 'walking', 'culture'])
      }
    })

    it('trims whitespace from array items', () => {
      const row = { ...validRow, categories: 'history ; walking ; culture' }
      const result = tourCSVRowSchema.safeParse(row)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.categories).toEqual(['history', 'walking', 'culture'])
      }
    })

    it('filters empty items', () => {
      const row = { ...validRow, categories: 'history;;walking' }
      const result = tourCSVRowSchema.safeParse(row)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.categories).toEqual(['history', 'walking'])
      }
    })

    it('returns empty array for empty string', () => {
      const row = { ...validRow, categories: '' }
      const result = tourCSVRowSchema.safeParse(row)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.categories).toEqual([])
      }
    })
  })

  describe('coordinates transformation', () => {
    it('transforms "lat,lng" to GeoJSON [lng,lat]', () => {
      const row = { ...validRow, logistics_coordinates: '59.3293,18.0686' }
      const result = tourCSVRowSchema.safeParse(row)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.logistics_coordinates).toEqual([18.0686, 59.3293])
      }
    })

    it('handles coordinates with spaces', () => {
      const row = { ...validRow, logistics_coordinates: '59.3293, 18.0686' }
      const result = tourCSVRowSchema.safeParse(row)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.logistics_coordinates).toEqual([18.0686, 59.3293])
      }
    })

    it('returns undefined for empty coordinates', () => {
      const row = { ...validRow, logistics_coordinates: '' }
      const result = tourCSVRowSchema.safeParse(row)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.logistics_coordinates).toBeUndefined()
      }
    })

    it('returns undefined for invalid coordinates', () => {
      const row = { ...validRow, logistics_coordinates: 'invalid' }
      const result = tourCSVRowSchema.safeParse(row)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.logistics_coordinates).toBeUndefined()
      }
    })
  })

  describe('optional number transformation', () => {
    it('transforms valid number string', () => {
      const row = { ...validRow, maxGroupSize: '15' }
      const result = tourCSVRowSchema.safeParse(row)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.maxGroupSize).toBe(15)
      }
    })

    it('returns undefined for empty string', () => {
      const row = { ...validRow, maxGroupSize: '' }
      const result = tourCSVRowSchema.safeParse(row)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.maxGroupSize).toBeUndefined()
      }
    })

    it('returns undefined for non-numeric string', () => {
      const row = { ...validRow, maxGroupSize: 'not-a-number' }
      const result = tourCSVRowSchema.safeParse(row)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.maxGroupSize).toBeUndefined()
      }
    })
  })

  describe('localized fields', () => {
    it('parses all locale variants', () => {
      const row = {
        ...validRow,
        title_en: 'Test Tour EN',
        title_de: 'Test Tour DE',
      }
      const result = tourCSVRowSchema.safeParse(row)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.title_sv).toBe('Test Tour')
        expect(result.data.title_en).toBe('Test Tour EN')
        expect(result.data.title_de).toBe('Test Tour DE')
      }
    })
  })

  describe('select field validation', () => {
    it('accepts valid status values', () => {
      const statuses = ['draft', 'published', 'archived']
      for (const status of statuses) {
        const row = { ...validRow, status }
        const result = tourCSVRowSchema.safeParse(row)
        expect(result.success).toBe(true)
      }
    })

    it('accepts valid availability values', () => {
      const values = ['available', 'seasonal', 'by_request', 'unavailable']
      for (const availability of values) {
        const row = { ...validRow, availability }
        const result = tourCSVRowSchema.safeParse(row)
        expect(result.success).toBe(true)
      }
    })

    it('accepts valid difficultyLevel values', () => {
      const values = ['easy', 'moderate', 'challenging']
      for (const difficultyLevel of values) {
        const row = { ...validRow, difficultyLevel }
        const result = tourCSVRowSchema.safeParse(row)
        expect(result.success).toBe(true)
      }
    })
  })
})

describe('validateCSVRow', () => {
  const validRow: Record<string, string> = {
    slug: 'test-tour',
    title_sv: 'Test Tour',
    shortDescription_sv: 'A short description',
    pricing_basePrice: '500',
    pricing_priceType: 'per_person',
    duration_hours: '2',
    guide_slug: 'erik-guide',
    logistics_meetingPointName_sv: 'Central Station',
  }

  it('returns valid: true for valid row', () => {
    const result = validateCSVRow(validRow, 2)
    expect(result.valid).toBe(true)
    expect(result.data).toBeDefined()
    expect(result.errors).toBeUndefined()
  })

  it('returns errors with row number for invalid row', () => {
    const row = { ...validRow, slug: '' }
    const result = validateCSVRow(row, 5)
    expect(result.valid).toBe(false)
    expect(result.errors).toBeDefined()
    expect(result.errors?.length).toBeGreaterThan(0)
    expect(result.errors?.[0].row).toBe(5)
  })

  it('includes field name in error', () => {
    const row = { ...validRow, slug: '' }
    const result = validateCSVRow(row, 2)
    expect(result.valid).toBe(false)
    expect(result.errors?.[0].field).toBe('slug')
  })

  it('includes error message', () => {
    const row = { ...validRow, slug: '' }
    const result = validateCSVRow(row, 2)
    expect(result.valid).toBe(false)
    expect(result.errors?.[0].message).toBeDefined()
    expect(result.errors?.[0].message.length).toBeGreaterThan(0)
  })

  it('returns multiple errors for multiple invalid fields', () => {
    const row = { ...validRow, slug: '', title_sv: '', guide_slug: '' }
    const result = validateCSVRow(row, 2)
    expect(result.valid).toBe(false)
    expect(result.errors?.length).toBeGreaterThan(1)
  })
})
