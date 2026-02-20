/**
 * Tests for Tour CSV Export Service
 * Verifies CSV generation, BOM prefix, sep hint, and payload.find arguments
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// vi.hoisted ensures these declarations are available when vi.mock factories run
const { mockFind, mockGetCSVHeaders, mockFlattenTourToCSVRow } = vi.hoisted(() => {
  return {
    mockFind: vi.fn(),
    mockGetCSVHeaders: vi.fn().mockReturnValue({
      displayHeaders: ['Slug', 'Title (SV)', 'Title (EN)', 'Title (DE)'],
      columnKeys: ['slug', 'title_sv', 'title_en', 'title_de'],
    }),
    mockFlattenTourToCSVRow: vi.fn().mockReturnValue({
      slug: 'test-tour',
      title_sv: 'Test SV',
      title_en: 'Test EN',
      title_de: 'Test DE',
    }),
  }
})

vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue({ find: mockFind }),
}))

vi.mock('../payload.config', () => ({
  default: {},
}))

// Mock column mapping - let csv-stringify/sync run for real (pure function)
vi.mock('../lib/csv/tour-csv-column-mapping', () => ({
  getCSVHeaders: (...args: unknown[]) => mockGetCSVHeaders(...args),
  flattenTourToCSVRow: (...args: unknown[]) => mockFlattenTourToCSVRow(...args),
}))

import { exportToursToCSV, generateExportFilename } from '../lib/csv/tour-csv-export-service'

describe('generateExportFilename', () => {
  it('returns string matching tours-export-YYYY-MM-DD.csv', () => {
    expect(generateExportFilename()).toMatch(/^tours-export-\d{4}-\d{2}-\d{2}\.csv$/)
  })

  it('includes today\'s date in the filename', () => {
    const today = new Date().toISOString().slice(0, 10)
    expect(generateExportFilename()).toBe(`tours-export-${today}.csv`)
  })
})

describe('exportToursToCSV', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetCSVHeaders.mockReturnValue({
      displayHeaders: ['Slug', 'Title (SV)', 'Title (EN)', 'Title (DE)'],
      columnKeys: ['slug', 'title_sv', 'title_en', 'title_de'],
    })
    mockFlattenTourToCSVRow.mockReturnValue({
      slug: 'test-tour',
      title_sv: 'Test SV',
      title_en: 'Test EN',
      title_de: 'Test DE',
    })
    mockFind.mockResolvedValue({
      docs: [{ id: 1, slug: 'test-tour', title: { en: 'Test', sv: 'Test', de: 'Test' } }],
    })
  })

  it('calls payload.find with tours collection', async () => {
    await exportToursToCSV()
    expect(mockFind).toHaveBeenCalledWith(expect.objectContaining({ collection: 'tours' }))
  })

  it('passes depth: 2 and locale: all', async () => {
    await exportToursToCSV()
    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({ depth: 2, locale: 'all' })
    )
  })

  it('filters by status when option provided', async () => {
    await exportToursToCSV({ status: 'published' })
    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: { equals: 'published' } } })
    )
  })

  it('does not add where clause when no status option', async () => {
    await exportToursToCSV()
    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({ where: undefined })
    )
  })

  it('uses limit from options', async () => {
    await exportToursToCSV({ limit: 50 })
    expect(mockFind).toHaveBeenCalledWith(expect.objectContaining({ limit: 50 }))
  })

  it('defaults limit to 10000 when not specified', async () => {
    await exportToursToCSV()
    expect(mockFind).toHaveBeenCalledWith(expect.objectContaining({ limit: 10000 }))
  })

  it('returns string starting with UTF-8 BOM', async () => {
    const csv = await exportToursToCSV()
    expect(csv.charCodeAt(0)).toBe(0xfeff)
  })

  it('includes sep=, hint on first line after BOM', async () => {
    const csv = await exportToursToCSV()
    const withoutBom = csv.slice(1)
    const firstLine = withoutBom.split('\n')[0]
    expect(firstLine).toContain('sep=,')
  })

  it('includes CSV header row with column labels', async () => {
    const csv = await exportToursToCSV()
    expect(csv).toContain('Slug')
  })

  it('includes data row for each tour', async () => {
    const csv = await exportToursToCSV()
    expect(csv).toContain('test-tour')
    expect(mockFlattenTourToCSVRow).toHaveBeenCalledTimes(1)
  })

  it('returns valid CSV structure when no tours found', async () => {
    mockFind.mockResolvedValue({ docs: [] })
    const csv = await exportToursToCSV()
    // Should still have BOM + sep + header even with no data rows
    expect(csv.charCodeAt(0)).toBe(0xfeff)
    expect(csv).toContain('sep=,')
  })
})
