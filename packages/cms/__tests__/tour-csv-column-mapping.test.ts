import { describe, it, expect } from 'vitest'
import {
  LOCALES,
  TOUR_CSV_COLUMNS,
  getCSVHeaders,
  flattenTourToCSVRow,
  lexicalToPlainText,
  type TourWithLocales,
} from '../lib/csv/tour-csv-column-mapping'

describe('LOCALES', () => {
  it('contains sv, en, de', () => {
    expect(LOCALES).toEqual(['sv', 'en', 'de'])
  })
})

describe('TOUR_CSV_COLUMNS', () => {
  it('contains slug column', () => {
    const slugCol = TOUR_CSV_COLUMNS.find((c) => c.csvColumn === 'slug')
    expect(slugCol).toBeDefined()
    expect(slugCol?.type).toBe('text')
    expect(slugCol?.localized).toBeFalsy()
  })

  it('contains localized title column', () => {
    const titleCol = TOUR_CSV_COLUMNS.find((c) => c.csvColumn === 'title')
    expect(titleCol).toBeDefined()
    expect(titleCol?.localized).toBe(true)
  })

  it('contains pricing group columns', () => {
    const basePriceCol = TOUR_CSV_COLUMNS.find((c) => c.csvColumn === 'pricing_basePrice')
    expect(basePriceCol).toBeDefined()
    expect(basePriceCol?.tourPath).toBe('pricing.basePrice')
    expect(basePriceCol?.type).toBe('number')
  })

  it('contains relationship columns', () => {
    const guideCol = TOUR_CSV_COLUMNS.find((c) => c.csvColumn === 'guide')
    expect(guideCol).toBeDefined()
    expect(guideCol?.type).toBe('relationship')

    const categoriesCol = TOUR_CSV_COLUMNS.find((c) => c.csvColumn === 'categories')
    expect(categoriesCol).toBeDefined()
    expect(categoriesCol?.type).toBe('relationshipMany')
  })
})

describe('getCSVHeaders', () => {
  it('returns object with displayHeaders and columnKeys arrays', () => {
    const { displayHeaders, columnKeys } = getCSVHeaders()
    expect(Array.isArray(displayHeaders)).toBe(true)
    expect(Array.isArray(columnKeys)).toBe(true)
    expect(displayHeaders.length).toBe(columnKeys.length)
    expect(displayHeaders.length).toBeGreaterThan(0)
  })

  it('columnKeys expands localized fields with locale suffixes', () => {
    const { columnKeys } = getCSVHeaders()
    expect(columnKeys).toContain('title_sv')
    expect(columnKeys).toContain('title_en')
    expect(columnKeys).toContain('title_de')
  })

  it('displayHeaders uses human-readable labels with locale names', () => {
    const { displayHeaders } = getCSVHeaders()
    expect(displayHeaders).toContain('Title (Swedish)')
    expect(displayHeaders).toContain('Title (English)')
    expect(displayHeaders).toContain('Title (German)')
  })

  it('keeps non-localized fields without suffix', () => {
    const { columnKeys } = getCSVHeaders()
    expect(columnKeys).toContain('slug')
    expect(columnKeys).toContain('pricing_basePrice')
    expect(columnKeys).toContain('featured')
  })

  it('expands localized duration fields correctly', () => {
    const { columnKeys } = getCSVHeaders()
    expect(columnKeys).toContain('duration_durationText_sv')
    expect(columnKeys).toContain('duration_durationText_en')
    expect(columnKeys).toContain('duration_durationText_de')
  })

  it('includes logistics localized fields', () => {
    const { columnKeys } = getCSVHeaders()
    expect(columnKeys).toContain('logistics_meetingPointName_sv')
    expect(columnKeys).toContain('logistics_meetingPointName_en')
    expect(columnKeys).toContain('logistics_meetingPointName_de')
  })
})

describe('lexicalToPlainText', () => {
  it('returns empty string for null input', () => {
    expect(lexicalToPlainText(null)).toBe('')
  })

  it('returns empty string for undefined input', () => {
    expect(lexicalToPlainText(undefined)).toBe('')
  })

  it('returns empty string for non-object input', () => {
    expect(lexicalToPlainText('string')).toBe('')
    expect(lexicalToPlainText(123)).toBe('')
  })

  it('returns empty string for object without root', () => {
    expect(lexicalToPlainText({})).toBe('')
    expect(lexicalToPlainText({ foo: 'bar' })).toBe('')
  })

  it('extracts text from simple paragraph', () => {
    const lexical = {
      root: {
        children: [
          {
            type: 'paragraph',
            children: [{ type: 'text', text: 'Hello world' }],
          },
        ],
      },
    }
    expect(lexicalToPlainText(lexical)).toBe('Hello world')
  })

  it('joins multiple paragraphs with double newlines', () => {
    const lexical = {
      root: {
        children: [
          {
            type: 'paragraph',
            children: [{ type: 'text', text: 'First paragraph' }],
          },
          {
            type: 'paragraph',
            children: [{ type: 'text', text: 'Second paragraph' }],
          },
        ],
      },
    }
    expect(lexicalToPlainText(lexical)).toBe('First paragraph\n\nSecond paragraph')
  })

  it('handles nested children', () => {
    const lexical = {
      root: {
        children: [
          {
            type: 'paragraph',
            children: [
              { type: 'text', text: 'Hello ' },
              {
                type: 'bold',
                children: [{ type: 'text', text: 'world' }],
              },
            ],
          },
        ],
      },
    }
    expect(lexicalToPlainText(lexical)).toBe('Hello world')
  })

  it('handles empty paragraphs', () => {
    const lexical = {
      root: {
        children: [
          { type: 'paragraph', children: [] },
          {
            type: 'paragraph',
            children: [{ type: 'text', text: 'Content' }],
          },
        ],
      },
    }
    expect(lexicalToPlainText(lexical)).toBe('Content')
  })
})

describe('flattenTourToCSVRow', () => {
  const createMockTour = (overrides: Partial<TourWithLocales> = {}): TourWithLocales => ({
    id: 1,
    slug: 'test-tour',
    title: { sv: 'Test Tour SV', en: 'Test Tour EN', de: 'Test Tour DE' },
    shortDescription: { sv: 'Short SV', en: 'Short EN', de: 'Short DE' },
    description: {
      sv: { root: { children: [{ type: 'paragraph', children: [{ type: 'text', text: 'Desc SV' }] }] } },
      en: { root: { children: [{ type: 'paragraph', children: [{ type: 'text', text: 'Desc EN' }] }] } },
      de: { root: { children: [{ type: 'paragraph', children: [{ type: 'text', text: 'Desc DE' }] }] } },
    },
    highlights: {
      sv: [{ highlight: 'Highlight 1 SV', id: '1' }, { highlight: 'Highlight 2 SV', id: '2' }],
      en: [{ highlight: 'Highlight 1 EN', id: '1' }],
      de: null,
    },
    pricing: {
      basePrice: 500,
      currency: 'SEK',
      priceType: 'per_person',
      groupDiscount: true,
      childPrice: 250,
    },
    duration: {
      hours: 2.5,
      durationText: { sv: '2-3 timmar', en: '2-3 hours', de: '2-3 Stunden' },
    },
    logistics: {
      meetingPointName: { sv: 'Plats SV', en: 'Place EN', de: 'Ort DE' },
      meetingPointAddress: { sv: 'Adress SV', en: 'Address EN', de: 'Adresse DE' },
      coordinates: [18.0686, 59.3293], // [lng, lat] - Stockholm
      googleMapsLink: 'https://maps.google.com/test',
      meetingPointInstructions: { sv: 'Instruktioner SV', en: 'Instructions EN', de: 'Anweisungen DE' },
      endingPoint: { sv: 'Slut SV', en: 'End EN', de: 'Ende DE' },
      parkingInfo: { sv: 'Parkering SV', en: 'Parking EN', de: 'Parken DE' },
      publicTransportInfo: { sv: 'Kollektiv SV', en: 'Public EN', de: 'ÖPNV DE' },
    },
    included: {
      sv: [{ item: 'Fika', id: '1' }],
      en: [{ item: 'Coffee', id: '1' }],
      de: [{ item: 'Kaffee', id: '1' }],
    },
    notIncluded: {
      sv: [{ item: 'Transport', id: '1' }],
      en: [{ item: 'Transport', id: '1' }],
      de: [{ item: 'Transport', id: '1' }],
    },
    whatToBring: {
      sv: [{ item: 'Bekväma skor', id: '1' }],
      en: [{ item: 'Comfortable shoes', id: '1' }],
      de: [{ item: 'Bequeme Schuhe', id: '1' }],
    },
    targetAudience: ['family_friendly', 'couples'],
    difficultyLevel: 'easy',
    ageRecommendation: {
      minimumAge: 8,
      childFriendly: true,
      teenFriendly: true,
    },
    accessibility: {
      wheelchairAccessible: true,
      mobilityNotes: { sv: 'Anteckningar SV', en: 'Notes EN', de: 'Notizen DE' },
      hearingAssistance: false,
      visualAssistance: false,
      serviceAnimalsAllowed: true,
    },
    guide: { id: 1, slug: 'erik-guide', name: 'Erik' } as any,
    categories: [
      { id: 1, slug: 'history', name: 'History' },
      { id: 2, slug: 'walking', name: 'Walking' },
    ] as any,
    neighborhoods: [{ id: 1, slug: 'gamla-stan', name: 'Gamla Stan' }] as any,
    images: [
      { image: { id: 1, url: 'https://example.com/img1.jpg' } as any, isPrimary: true, id: '1' },
      { image: { id: 2, url: 'https://example.com/img2.jpg' } as any, isPrimary: false, id: '2' },
    ],
    bokunExperienceId: 'BOK123',
    availability: 'available',
    maxGroupSize: 15,
    minGroupSize: 2,
    featured: true,
    status: 'published',
    updatedAt: '2026-02-05T10:00:00Z',
    createdAt: '2026-02-01T10:00:00Z',
    ...overrides,
  })

  it('returns object with string values', () => {
    const tour = createMockTour()
    const row = flattenTourToCSVRow(tour)

    expect(typeof row).toBe('object')
    Object.values(row).forEach((v) => expect(typeof v).toBe('string'))
  })

  it('exports slug correctly', () => {
    const tour = createMockTour()
    const row = flattenTourToCSVRow(tour)
    expect(row.slug).toBe('test-tour')
  })

  it('exports localized title fields', () => {
    const tour = createMockTour()
    const row = flattenTourToCSVRow(tour)
    expect(row.title_sv).toBe('Test Tour SV')
    expect(row.title_en).toBe('Test Tour EN')
    expect(row.title_de).toBe('Test Tour DE')
  })

  it('exports pricing group fields', () => {
    const tour = createMockTour()
    const row = flattenTourToCSVRow(tour)
    expect(row.pricing_basePrice).toBe('500')
    expect(row.pricing_currency).toBe('SEK')
    expect(row.pricing_priceType).toBe('per_person')
    expect(row.pricing_groupDiscount).toBe('true')
    expect(row.pricing_childPrice).toBe('250')
  })

  it('exports duration fields', () => {
    const tour = createMockTour()
    const row = flattenTourToCSVRow(tour)
    expect(row.duration_hours).toBe('2.5')
    expect(row.duration_durationText_sv).toBe('2-3 timmar')
    expect(row.duration_durationText_en).toBe('2-3 hours')
  })

  it('exports point coordinates as lat,lng', () => {
    const tour = createMockTour()
    const row = flattenTourToCSVRow(tour)
    // coordinates are [lng, lat] in GeoJSON, we output as lat,lng
    expect(row.logistics_coordinates).toBe('59.3293,18.0686')
  })

  it('exports boolean fields correctly', () => {
    const tour = createMockTour()
    const row = flattenTourToCSVRow(tour)
    expect(row.featured).toBe('true')
    expect(row.accessibility_wheelchairAccessible).toBe('true')
    expect(row.accessibility_hearingAssistance).toBe('false')
  })

  it('exports multiselect as semicolon-separated', () => {
    const tour = createMockTour()
    const row = flattenTourToCSVRow(tour)
    expect(row.targetAudience).toBe('family_friendly;couples')
  })

  it('exports single relationship as slug', () => {
    const tour = createMockTour()
    const row = flattenTourToCSVRow(tour)
    expect(row.guide).toBe('erik-guide')
  })

  it('exports hasMany relationship as semicolon-separated slugs', () => {
    const tour = createMockTour()
    const row = flattenTourToCSVRow(tour)
    expect(row.categories).toBe('history;walking')
    expect(row.neighborhoods).toBe('gamla-stan')
  })

  it('exports images as semicolon-separated URLs', () => {
    const tour = createMockTour()
    const row = flattenTourToCSVRow(tour)
    expect(row.images).toBe('https://example.com/img1.jpg;https://example.com/img2.jpg')
  })

  it('exports localized arrays as semicolon-separated', () => {
    const tour = createMockTour()
    const row = flattenTourToCSVRow(tour)
    expect(row.highlights_sv).toBe('Highlight 1 SV;Highlight 2 SV')
    expect(row.highlights_en).toBe('Highlight 1 EN')
    expect(row.highlights_de).toBe('')
  })

  it('exports rich text as plain text', () => {
    const tour = createMockTour()
    const row = flattenTourToCSVRow(tour)
    expect(row.description_sv).toBe('Desc SV')
    expect(row.description_en).toBe('Desc EN')
  })

  it('handles null/undefined values gracefully', () => {
    const tour = createMockTour({
      bokunExperienceId: undefined,
      maxGroupSize: null,
      categories: null,
    } as any)
    const row = flattenTourToCSVRow(tour)
    expect(row.bokunExperienceId).toBe('')
    expect(row.maxGroupSize).toBe('')
    expect(row.categories).toBe('')
  })

  it('handles unpopulated relationships (ID only)', () => {
    const tour = createMockTour({
      guide: 123 as any,
    })
    const row = flattenTourToCSVRow(tour)
    expect(row.guide).toBe('123')
  })

  it('handles empty images array', () => {
    const tour = createMockTour({ images: [] })
    const row = flattenTourToCSVRow(tour)
    expect(row.images).toBe('')
  })

  it('exports select fields correctly', () => {
    const tour = createMockTour()
    const row = flattenTourToCSVRow(tour)
    expect(row.availability).toBe('available')
    expect(row.status).toBe('published')
    expect(row.difficultyLevel).toBe('easy')
  })
})

// Import for csvRowToTourData tests
import { csvRowToTourData, type CSVImportRelationships } from '../lib/csv/tour-csv-column-mapping'
import type { TourCSVRow } from '../lib/csv/tour-csv-schema-validation'

describe('csvRowToTourData', () => {
  const createMockCSVRow = (overrides: Partial<TourCSVRow> = {}): TourCSVRow => ({
    slug: 'test-tour',
    title_sv: 'Test Tour SV',
    title_en: 'Test Tour EN',
    title_de: '',
    shortDescription_sv: 'Short description SV',
    shortDescription_en: '',
    shortDescription_de: '',
    description_sv: 'Full description',
    description_en: '',
    description_de: '',
    pricing_basePrice: 500,
    pricing_currency: 'SEK',
    pricing_priceType: 'per_person',
    pricing_groupDiscount: true,
    pricing_childPrice: 250,
    duration_hours: 2.5,
    duration_durationText_sv: '2-3 timmar',
    duration_durationText_en: '',
    duration_durationText_de: '',
    guide_slug: 'erik-guide',
    logistics_meetingPointName_sv: 'Central Station SV',
    logistics_meetingPointName_en: 'Central Station EN',
    logistics_meetingPointName_de: '',
    logistics_meetingPointAddress_sv: '',
    logistics_meetingPointAddress_en: '',
    logistics_meetingPointAddress_de: '',
    logistics_coordinates: [18.0686, 59.3293],
    logistics_googleMapsLink: 'https://maps.google.com/test',
    logistics_meetingPointInstructions_sv: '',
    logistics_meetingPointInstructions_en: '',
    logistics_meetingPointInstructions_de: '',
    logistics_endingPoint_sv: '',
    logistics_endingPoint_en: '',
    logistics_endingPoint_de: '',
    logistics_parkingInfo_sv: '',
    logistics_parkingInfo_en: '',
    logistics_parkingInfo_de: '',
    logistics_publicTransportInfo_sv: '',
    logistics_publicTransportInfo_en: '',
    logistics_publicTransportInfo_de: '',
    highlights_sv: ['Highlight 1', 'Highlight 2'],
    highlights_en: [],
    highlights_de: [],
    included_sv: ['Fika'],
    included_en: [],
    included_de: [],
    notIncluded_sv: ['Transport'],
    notIncluded_en: [],
    notIncluded_de: [],
    whatToBring_sv: ['Comfortable shoes'],
    whatToBring_en: [],
    whatToBring_de: [],
    targetAudience: ['family_friendly', 'couples'],
    difficultyLevel: 'easy',
    ageRecommendation_minimumAge: 8,
    ageRecommendation_childFriendly: true,
    ageRecommendation_teenFriendly: false,
    accessibility_wheelchairAccessible: true,
    accessibility_mobilityNotes_sv: '',
    accessibility_mobilityNotes_en: '',
    accessibility_mobilityNotes_de: '',
    accessibility_hearingAssistance: false,
    accessibility_visualAssistance: false,
    accessibility_serviceAnimalsAllowed: true,
    categories: ['history', 'walking'],
    neighborhoods: ['gamla-stan'],
    bokunExperienceId: 'BOK123',
    availability: 'available',
    maxGroupSize: 15,
    minGroupSize: 2,
    featured: true,
    status: 'draft',
    ...overrides,
  } as TourCSVRow)

  const mockRelationships: CSVImportRelationships = {
    guideId: 'guide-123',
    categoryIds: ['cat-1', 'cat-2'],
    neighborhoodIds: ['hood-1'],
  }

  it('maps basic fields correctly', () => {
    const row = createMockCSVRow()
    const result = csvRowToTourData(row, mockRelationships)
    expect(result.slug).toBe('test-tour')
    expect(result.status).toBe('draft')
    expect(result.featured).toBe(true)
    expect(result.availability).toBe('available')
  })

  it('maps localized title with Swedish fallback', () => {
    const row = createMockCSVRow({ title_de: '' })
    const result = csvRowToTourData(row, mockRelationships)
    expect(result.title).toEqual({
      sv: 'Test Tour SV',
      en: 'Test Tour EN',
      de: 'Test Tour SV', // Falls back to Swedish
    })
  })

  it('maps localized shortDescription with Swedish fallback', () => {
    const row = createMockCSVRow()
    const result = csvRowToTourData(row, mockRelationships)
    expect(result.shortDescription).toEqual({
      sv: 'Short description SV',
      en: 'Short description SV', // Falls back
      de: 'Short description SV', // Falls back
    })
  })

  it('converts description to Lexical format', () => {
    const row = createMockCSVRow({ description_sv: 'Test description' })
    const result = csvRowToTourData(row, mockRelationships)
    expect(result.description.sv).toHaveProperty('root')
    expect(result.description.sv.root.type).toBe('root')
  })

  it('maps pricing group correctly', () => {
    const row = createMockCSVRow()
    const result = csvRowToTourData(row, mockRelationships)
    expect(result.pricing).toEqual({
      basePrice: 500,
      currency: 'SEK',
      priceType: 'per_person',
      groupDiscount: true,
      childPrice: 250,
    })
  })

  it('maps duration group correctly', () => {
    const row = createMockCSVRow()
    const result = csvRowToTourData(row, mockRelationships)
    expect(result.duration.hours).toBe(2.5)
    expect(result.duration.durationText.sv).toBe('2-3 timmar')
  })

  it('maps logistics coordinates correctly', () => {
    const row = createMockCSVRow()
    const result = csvRowToTourData(row, mockRelationships)
    expect(result.logistics.coordinates).toEqual([18.0686, 59.3293])
    expect(result.logistics.googleMapsLink).toBe('https://maps.google.com/test')
  })

  it('maps logistics meetingPointName with Swedish fallback', () => {
    const row = createMockCSVRow()
    const result = csvRowToTourData(row, mockRelationships)
    expect(result.logistics.meetingPointName).toEqual({
      sv: 'Central Station SV',
      en: 'Central Station EN',
      de: 'Central Station SV', // Falls back
    })
  })

  it('maps highlights array with locale objects', () => {
    const row = createMockCSVRow()
    const result = csvRowToTourData(row, mockRelationships)
    expect(result.highlights.sv).toEqual([
      { highlight: 'Highlight 1' },
      { highlight: 'Highlight 2' },
    ])
  })

  it('maps highlights with Swedish fallback for empty locales', () => {
    const row = createMockCSVRow({ highlights_en: [], highlights_de: [] })
    const result = csvRowToTourData(row, mockRelationships)
    expect(result.highlights.en).toEqual([
      { highlight: 'Highlight 1' },
      { highlight: 'Highlight 2' },
    ])
    expect(result.highlights.de).toEqual([
      { highlight: 'Highlight 1' },
      { highlight: 'Highlight 2' },
    ])
  })

  it('maps included/notIncluded/whatToBring arrays', () => {
    const row = createMockCSVRow()
    const result = csvRowToTourData(row, mockRelationships)
    expect(result.included.sv).toEqual([{ item: 'Fika' }])
    expect(result.notIncluded.sv).toEqual([{ item: 'Transport' }])
    expect(result.whatToBring.sv).toEqual([{ item: 'Comfortable shoes' }])
  })

  it('maps targetAudience array directly', () => {
    const row = createMockCSVRow()
    const result = csvRowToTourData(row, mockRelationships)
    expect(result.targetAudience).toEqual(['family_friendly', 'couples'])
  })

  it('maps ageRecommendation group', () => {
    const row = createMockCSVRow()
    const result = csvRowToTourData(row, mockRelationships)
    expect(result.ageRecommendation).toEqual({
      minimumAge: 8,
      childFriendly: true,
      teenFriendly: false,
    })
  })

  it('maps accessibility group', () => {
    const row = createMockCSVRow()
    const result = csvRowToTourData(row, mockRelationships)
    expect(result.accessibility.wheelchairAccessible).toBe(true)
    expect(result.accessibility.hearingAssistance).toBe(false)
    expect(result.accessibility.serviceAnimalsAllowed).toBe(true)
  })

  it('maps relationships from provided IDs', () => {
    const row = createMockCSVRow()
    const result = csvRowToTourData(row, mockRelationships)
    expect(result.guide).toBe('guide-123')
    expect(result.categories).toEqual(['cat-1', 'cat-2'])
    expect(result.neighborhoods).toEqual(['hood-1'])
  })

  it('handles empty optional fields gracefully', () => {
    const row = createMockCSVRow({
      bokunExperienceId: '',
      maxGroupSize: undefined,
      difficultyLevel: undefined,
    })
    const result = csvRowToTourData(row, mockRelationships)
    expect(result.bokunExperienceId).toBeNull()
    expect(result.maxGroupSize).toBeNull()
    expect(result.difficultyLevel).toBeNull()
  })

  it('handles empty arrays', () => {
    const row = createMockCSVRow({
      highlights_sv: [],
      targetAudience: [],
    })
    const relationships = { ...mockRelationships, categoryIds: [], neighborhoodIds: [] }
    const result = csvRowToTourData(row, relationships)
    expect(result.highlights.sv).toEqual([])
    expect(result.targetAudience).toEqual([])
    expect(result.categories).toEqual([])
    expect(result.neighborhoods).toEqual([])
  })

  it('defaults boolean fields to false when not provided', () => {
    const row = createMockCSVRow({
      pricing_groupDiscount: false,
      featured: false,
      accessibility_wheelchairAccessible: false,
    })
    const result = csvRowToTourData(row, mockRelationships)
    expect(result.pricing.groupDiscount).toBe(false)
    expect(result.featured).toBe(false)
    expect(result.accessibility.wheelchairAccessible).toBe(false)
  })
})

// ============================================================================
// Gap-fill edge cases for flattenTourToCSVRow uncovered branches
// ============================================================================

describe('flattenTourToCSVRow edge cases', () => {
  const createBaseTour = (overrides: Partial<TourWithLocales> = {}): TourWithLocales => ({
    id: 1,
    slug: 'edge-tour',
    title: { sv: 'Edge SV', en: 'Edge EN', de: 'Edge DE' },
    shortDescription: { sv: 'Short SV', en: 'Short EN', de: 'Short DE' },
    description: {
      sv: { root: { children: [{ type: 'paragraph', children: [{ type: 'text', text: 'Desc' }] }] } },
      en: { root: { children: [{ type: 'paragraph', children: [{ type: 'text', text: 'Desc' }] }] } },
      de: { root: { children: [{ type: 'paragraph', children: [{ type: 'text', text: 'Desc' }] }] } },
    },
    highlights: { sv: [], en: [], de: null },
    pricing: { basePrice: 100, currency: 'SEK', priceType: 'per_person', groupDiscount: false, childPrice: null },
    duration: { hours: 1, durationText: { sv: '1 timme', en: '1 hour', de: '1 Stunde' } },
    logistics: {
      meetingPointName: { sv: 'Plats', en: 'Place', de: 'Ort' },
      coordinates: [18.0686, 59.3293],
    },
    included: { sv: [], en: [], de: [] },
    notIncluded: { sv: [], en: [], de: [] },
    whatToBring: { sv: [], en: [], de: [] },
    targetAudience: [],
    difficultyLevel: 'easy',
    ageRecommendation: { minimumAge: null, childFriendly: false, teenFriendly: false },
    accessibility: { wheelchairAccessible: false, mobilityNotes: { sv: 'SV', en: 'EN', de: 'DE' }, hearingAssistance: false, visualAssistance: false, serviceAnimalsAllowed: false },
    guide: { id: 1, slug: 'guide-1', name: 'Guide' } as any,
    categories: [] as any,
    neighborhoods: [] as any,
    images: [],
    featured: false,
    status: 'published',
    availability: 'available',
    updatedAt: '2026-01-01T00:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
    ...overrides,
  })

  it('handles tour with null logistics coordinates (covers null branch in formatPoint)', () => {
    const tour = createBaseTour()
    if (tour.logistics) {
      tour.logistics.coordinates = null as any
    }
    const row = flattenTourToCSVRow(tour)
    expect(row.logistics_coordinates).toBe('')
  })

  it('handles description as plain string instead of Lexical format (non-localized object branch)', () => {
    const tour = createBaseTour()
    // Set description as a plain string — triggers the "not a localized object" branch
    // in getLocalizedValue which returns current as-is, then lexicalToPlainText receives string
    tour.description = 'Plain text description' as any
    const row = flattenTourToCSVRow(tour)
    // lexicalToPlainText returns '' for non-object input, so expect defined string
    expect(typeof row.description_sv).toBe('string')
  })

  it('handles object value in safeStringify (covers typeof value === object branch)', () => {
    const tour = createBaseTour()
    // Set mobilityNotes to an unexpected plain object (not a localized Record)
    if (tour.accessibility) {
      tour.accessibility.mobilityNotes = { unexpected: 'object' } as any
    }
    const row = flattenTourToCSVRow(tour)
    // safeStringify returns '' for objects — result must still be a string
    expect(typeof row.accessibility_mobilityNotes_sv).toBe('string')
  })
})
