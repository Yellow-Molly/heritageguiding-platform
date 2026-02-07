/**
 * Tests for Tour Excel Import Service
 * Builds .xlsx buffers programmatically with ExcelJS, verifies import logic
 * Mocks Payload for DB operations (find/create)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ExcelJS from 'exceljs'
import { getCSVHeaders } from '../lib/csv/tour-csv-column-mapping'

// Mock getPayload
vi.mock('payload', () => ({
  getPayload: vi.fn(),
}))

vi.mock('../payload.config', () => ({
  default: {},
}))

import { getPayload } from 'payload'

/**
 * Minimal valid row data using column keys from getCSVHeaders()
 * Note: uses 'guide' (column key) not 'guide_slug' (Zod field) —
 * the import service aliases 'guide' → 'guide_slug' for Zod compatibility
 */
const validTourRecord: Record<string, string> = {
  slug: 'test-tour',
  title_sv: 'Test Tur',
  shortDescription_sv: 'En kort beskrivning',
  pricing_basePrice: '500',
  pricing_priceType: 'per_person',
  duration_hours: '2',
  guide: 'erik-guide',
  logistics_meetingPointName_sv: 'Stortorget',
}

/**
 * Helper: build an .xlsx buffer with given headers and rows
 */
async function buildExcelBuffer(
  headers: string[],
  rows: Record<string, string>[]
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Tours')

  // Add header row
  sheet.addRow(headers)

  // Add data rows
  for (const row of rows) {
    const values = headers.map((h) => row[h] || '')
    sheet.addRow(values)
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Build buffer using the record's own keys as headers
 * This matches the Zod schema field names (e.g., guide_slug, not guide)
 */
async function buildBufferWithRecordKeys(
  rows: Record<string, string>[]
): Promise<Buffer> {
  // Collect all unique keys from all rows
  const allKeys = [...new Set(rows.flatMap((r) => Object.keys(r)))]
  return buildExcelBuffer(allKeys, rows)
}

/**
 * Build buffer using display headers from getCSVHeaders()
 * Maps Zod schema keys to their display header equivalents
 * Note: guide_slug maps to Guide (slug) display header via the 'guide' column
 */
async function buildBufferWithDisplayHeaders(
  rows: Record<string, string>[]
): Promise<Buffer> {
  const { displayHeaders, columnKeys } = getCSVHeaders()

  // Build column key -> display header index map
  const keyToIdx = new Map(columnKeys.map((k, i) => [k, i]))

  const remappedRows = rows.map((row) => {
    const mapped: Record<string, string> = {}
    for (const [key, value] of Object.entries(row)) {
      const idx = keyToIdx.get(key)
      if (idx !== undefined) {
        mapped[displayHeaders[idx]] = value
      }
    }
    return mapped
  })
  return buildExcelBuffer(displayHeaders, remappedRows)
}

function setupMockPayload(options?: {
  existingSlugs?: string[]
  guides?: { slug: string; id: string }[]
  categories?: { slug: string; id: string }[]
  neighborhoods?: { slug: string; id: string }[]
}) {
  const {
    existingSlugs = [],
    guides = [{ slug: 'erik-guide', id: 'guide-1' }],
    categories = [],
    neighborhoods = [],
  } = options || {}

  const mockPayload = {
    find: vi.fn().mockImplementation(({ collection }: { collection: string }) => {
      switch (collection) {
        case 'tours':
          return { docs: existingSlugs.map((slug) => ({ slug })) }
        case 'guides':
          return { docs: guides }
        case 'categories':
          return { docs: categories }
        case 'neighborhoods':
          return { docs: neighborhoods }
        default:
          return { docs: [] }
      }
    }),
    create: vi.fn().mockResolvedValue({ id: 'new-tour-1' }),
  }
  vi.mocked(getPayload).mockResolvedValue(mockPayload as any)
  return mockPayload
}

async function getImportService() {
  const mod = await import('../lib/excel/tour-excel-import-service')
  return mod
}

describe('importToursFromExcel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('parses valid XLSX and creates tours', async () => {
    const mockPayload = setupMockPayload()
    const buffer = await buildBufferWithRecordKeys([validTourRecord])
    const { importToursFromExcel } = await getImportService()

    const result = await importToursFromExcel(buffer)

    expect(result.created).toBe(1)
    expect(result.errors).toHaveLength(0)
    expect(mockPayload.create).toHaveBeenCalledOnce()
  })

  it('dry run does not create tours', async () => {
    const mockPayload = setupMockPayload()
    const buffer = await buildBufferWithRecordKeys([validTourRecord])
    const { importToursFromExcel } = await getImportService()

    const result = await importToursFromExcel(buffer, { dryRun: true })

    expect(result.created).toBe(1)
    expect(mockPayload.create).not.toHaveBeenCalled()
  })

  it('handles empty worksheet (header only)', async () => {
    setupMockPayload()
    // Build buffer with headers but no data rows
    const { columnKeys } = getCSVHeaders()
    const buffer = await buildExcelBuffer(columnKeys, [])
    const { importToursFromExcel } = await getImportService()

    const result = await importToursFromExcel(buffer)

    expect(result.created).toBe(0)
    expect(result.warnings.length).toBeGreaterThan(0)
    expect(result.warnings[0].message).toContain('empty')
  })

  it('validates required fields and reports errors', async () => {
    setupMockPayload()
    const invalidRow = { ...validTourRecord, slug: '', title_sv: '' }
    const buffer = await buildBufferWithRecordKeys([invalidRow])
    const { importToursFromExcel } = await getImportService()

    const result = await importToursFromExcel(buffer)

    expect(result.created).toBe(0)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('skips duplicate slugs with warning', async () => {
    setupMockPayload({ existingSlugs: ['test-tour'] })
    const buffer = await buildBufferWithRecordKeys([validTourRecord])
    const { importToursFromExcel } = await getImportService()

    const result = await importToursFromExcel(buffer)

    expect(result.created).toBe(0)
    expect(result.skipped).toBe(1)
    expect(result.warnings.some((w) => w.message.includes('already exists'))).toBe(true)
  })

  it('resolves guide relationship', async () => {
    const mockPayload = setupMockPayload({
      guides: [{ slug: 'erik-guide', id: 'guide-42' }],
    })
    const buffer = await buildBufferWithRecordKeys([validTourRecord])
    const { importToursFromExcel } = await getImportService()

    await importToursFromExcel(buffer)

    expect(mockPayload.create).toHaveBeenCalledOnce()
    const createCall = mockPayload.create.mock.calls[0][0]
    expect(createCall.data.guide).toBe('guide-42')
  })

  it('reports error for missing guide', async () => {
    setupMockPayload({ guides: [] })
    const buffer = await buildBufferWithRecordKeys([validTourRecord])
    const { importToursFromExcel } = await getImportService()

    const result = await importToursFromExcel(buffer)

    expect(result.created).toBe(0)
    expect(result.errors.some((e) => e.message.includes('Guide'))).toBe(true)
  })

  it('handles display headers (fuzzy matching)', async () => {
    const mockPayload = setupMockPayload()
    const buffer = await buildBufferWithDisplayHeaders([validTourRecord])
    const { importToursFromExcel } = await getImportService()

    const result = await importToursFromExcel(buffer)

    expect(result.created).toBe(1)
    expect(mockPayload.create).toHaveBeenCalledOnce()
  })

  it('fuzzy matches case-insensitive headers', async () => {
    const mockPayload = setupMockPayload()
    const { displayHeaders, columnKeys } = getCSVHeaders()
    // Lowercase all headers
    const lowercaseHeaders = displayHeaders.map((h) => h.toLowerCase())
    const remappedRows = [{} as Record<string, string>]
    const mapped: Record<string, string> = {}
    lowercaseHeaders.forEach((lh, i) => {
      mapped[lh] = validTourRecord[columnKeys[i]] || ''
    })
    remappedRows[0] = mapped

    const buffer = await buildExcelBuffer(lowercaseHeaders, remappedRows)
    const { importToursFromExcel } = await getImportService()

    const result = await importToursFromExcel(buffer)

    expect(result.created).toBe(1)
    expect(mockPayload.create).toHaveBeenCalledOnce()
  })

  it('handles ExcelJS cell types (numbers coerced to strings)', async () => {
    const mockPayload = setupMockPayload()
    // Build a workbook with a numeric cell value instead of string
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Tours')
    const { columnKeys } = getCSVHeaders()

    sheet.addRow(columnKeys)
    const rowValues = columnKeys.map((k) => {
      const val = validTourRecord[k] || ''
      // pricing_basePrice as actual number
      if (k === 'pricing_basePrice') return 500
      if (k === 'duration_hours') return 2
      return val
    })
    sheet.addRow(rowValues)

    const arrayBuffer = await workbook.xlsx.writeBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const { importToursFromExcel } = await getImportService()

    const result = await importToursFromExcel(buffer)

    expect(result.created).toBe(1)
    expect(mockPayload.create).toHaveBeenCalledOnce()
  })

  it('returns error for invalid Excel file', async () => {
    setupMockPayload()
    const invalidBuffer = Buffer.from('not a valid xlsx file')
    const { importToursFromExcel } = await getImportService()

    const result = await importToursFromExcel(invalidBuffer)

    expect(result.created).toBe(0)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0].message).toContain('Excel parse error')
  })

  it('reports error when no recognized headers found', async () => {
    setupMockPayload()
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Tours')
    sheet.addRow(['Foo', 'Bar', 'Baz'])
    sheet.addRow(['1', '2', '3'])
    const arrayBuffer = await workbook.xlsx.writeBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const { importToursFromExcel } = await getImportService()

    const result = await importToursFromExcel(buffer)

    expect(result.created).toBe(0)
    expect(result.errors.some((e) => e.message.includes('No recognized headers'))).toBe(true)
  })

  it('processes multiple valid rows', async () => {
    const mockPayload = setupMockPayload()
    const rows = [
      { ...validTourRecord, slug: 'tour-1' },
      { ...validTourRecord, slug: 'tour-2' },
      { ...validTourRecord, slug: 'tour-3' },
    ]
    const buffer = await buildBufferWithRecordKeys(rows)
    const { importToursFromExcel } = await getImportService()

    const result = await importToursFromExcel(buffer)

    expect(result.created).toBe(3)
    expect(mockPayload.create).toHaveBeenCalledTimes(3)
  })
})
