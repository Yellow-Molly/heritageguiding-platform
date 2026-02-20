/**
 * Tests for Tour CSV Import Service
 * Verifies CSV parsing, validation, relationship resolution, tour creation, and dry-run mode
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.hoisted ensures mock functions are available when vi.mock factories are hoisted
const { mockFind, mockCreate, mockValidateCSVRow, mockCsvRowToTourData } = vi.hoisted(() => ({
  mockFind: vi.fn(),
  mockCreate: vi.fn(),
  mockValidateCSVRow: vi.fn(),
  mockCsvRowToTourData: vi.fn().mockReturnValue({ slug: 'new-tour', title: 'New Tour' }),
}))

vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue({ find: mockFind, create: mockCreate }),
}))

vi.mock('../payload.config', () => ({
  default: {},
}))

vi.mock('../lib/csv/tour-csv-schema-validation', () => ({
  validateCSVRow: (...args: unknown[]) => mockValidateCSVRow(...args),
}))

vi.mock('../lib/csv/tour-csv-column-mapping', () => ({
  csvRowToTourData: (...args: unknown[]) => mockCsvRowToTourData(...args),
}))

import { importToursFromCSV } from '../lib/csv/tour-csv-import-service'

// Minimal valid CSV for testing
const CSV_HEADERS = 'slug,title_sv,title_en,guide_slug'
const validRow = 'new-tour,Ny Tour,New Tour,erik-guide'
const validCSV = `${CSV_HEADERS}\n${validRow}`

describe('importToursFromCSV', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default: no existing tours, guide found, no categories/neighborhoods
    mockFind.mockImplementation(({ collection }: { collection: string }) => {
      switch (collection) {
        case 'tours':
          return Promise.resolve({ docs: [] })
        case 'guides':
          return Promise.resolve({ docs: [{ slug: 'erik-guide', id: 'g1' }] })
        case 'categories':
          return Promise.resolve({ docs: [] })
        case 'neighborhoods':
          return Promise.resolve({ docs: [] })
        default:
          return Promise.resolve({ docs: [] })
      }
    })

    mockValidateCSVRow.mockReturnValue({
      valid: true,
      data: { slug: 'new-tour', guide_slug: 'erik-guide', categories: [], neighborhoods: [] },
    })
    mockCreate.mockResolvedValue({ id: 1 })
  })

  it('returns parse error for invalid CSV with unclosed quote', async () => {
    const result = await importToursFromCSV('"unclosed quote')
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0].message).toContain('parse error')
  })

  it('returns warning for CSV with headers only (no data rows)', async () => {
    const result = await importToursFromCSV(CSV_HEADERS)
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0].message).toContain('empty')
  })

  it('validates each row via validateCSVRow', async () => {
    await importToursFromCSV(validCSV)
    expect(mockValidateCSVRow).toHaveBeenCalled()
  })

  it('adds error for rows that fail schema validation', async () => {
    mockValidateCSVRow.mockReturnValue({
      valid: false,
      errors: [{ row: 2, message: 'Invalid slug' }],
    })
    const result = await importToursFromCSV(validCSV)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].message).toBe('Invalid slug')
  })

  it('warns and skips row when slug already exists', async () => {
    mockFind.mockImplementation(({ collection }: { collection: string }) => {
      if (collection === 'tours') return Promise.resolve({ docs: [{ slug: 'new-tour' }] })
      if (collection === 'guides') return Promise.resolve({ docs: [{ slug: 'erik-guide', id: 'g1' }] })
      return Promise.resolve({ docs: [] })
    })
    const result = await importToursFromCSV(validCSV)
    expect(result.skipped).toBe(1)
    expect(result.warnings.some((w) => w.message.includes('already exists'))).toBe(true)
  })

  it('adds error when guide slug is not found in database', async () => {
    mockFind.mockImplementation(({ collection }: { collection: string }) => {
      if (collection === 'guides') return Promise.resolve({ docs: [] })
      return Promise.resolve({ docs: [] })
    })
    const result = await importToursFromCSV(validCSV)
    expect(
      result.errors.some((e) => e.message.includes('Guide') && e.message.includes('not found'))
    ).toBe(true)
  })

  it('creates tour via payload.create on valid row', async () => {
    await importToursFromCSV(validCSV)
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ collection: 'tours' }))
  })

  it('increments created count on successful tour creation', async () => {
    const result = await importToursFromCSV(validCSV)
    expect(result.created).toBe(1)
  })

  it('handles payload.create failure and adds error without throwing', async () => {
    mockCreate.mockRejectedValueOnce(new Error('DB error'))
    const result = await importToursFromCSV(validCSV)
    expect(result.errors.some((e) => e.message.includes('Failed to create'))).toBe(true)
  })

  it('dryRun mode increments created count but does not call payload.create', async () => {
    const result = await importToursFromCSV(validCSV, { dryRun: true })
    expect(result.created).toBe(1)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('returns zero error and skipped counts for a clean valid import', async () => {
    const result = await importToursFromCSV(validCSV)
    expect(result.errors).toHaveLength(0)
    expect(result.skipped).toBe(0)
    expect(result.created).toBe(1)
  })

  it('warns when category slug not found but still creates the tour', async () => {
    mockValidateCSVRow.mockReturnValue({
      valid: true,
      data: {
        slug: 'new-tour',
        guide_slug: 'erik-guide',
        categories: ['unknown-category'],
        neighborhoods: [],
      },
    })
    const result = await importToursFromCSV(validCSV)
    expect(result.warnings.some((w) => w.message.includes('Category'))).toBe(true)
    expect(result.created).toBe(1)
  })

  it('warns when neighborhood slug not found but still creates the tour', async () => {
    mockValidateCSVRow.mockReturnValue({
      valid: true,
      data: {
        slug: 'new-tour',
        guide_slug: 'erik-guide',
        categories: [],
        neighborhoods: ['unknown-neighborhood'],
      },
    })
    const result = await importToursFromCSV(validCSV)
    expect(result.warnings.some((w) => w.message.includes('Neighborhood'))).toBe(true)
    expect(result.created).toBe(1)
  })

  it('skips completely empty rows without counting as error or created', async () => {
    const csvWithEmptyRow = `${CSV_HEADERS}\n,,, \n${validRow}`
    const result = await importToursFromCSV(csvWithEmptyRow)
    // Only the valid non-empty row should be processed
    expect(result.created).toBe(1)
  })
})
