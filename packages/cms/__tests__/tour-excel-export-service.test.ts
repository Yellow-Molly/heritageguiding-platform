/**
 * Tests for Tour Excel Export Service
 * Verifies ExcelJS output structure, headers, styling, and data integrity
 * Uses ExcelJS to parse generated buffer (no mocks for ExcelJS itself)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ExcelJS from 'exceljs'
import { getCSVHeaders } from '../lib/csv/tour-csv-column-mapping'

// Mock getPayload to return controlled tour data
vi.mock('payload', () => ({
  getPayload: vi.fn(),
}))

vi.mock('../payload.config', () => ({
  default: {},
}))

import { getPayload } from 'payload'

// Mock tour data matching TourWithLocales shape
const createMockTour = (slug: string, titleSv: string) => ({
  id: 1,
  slug,
  title: { sv: titleSv, en: `${titleSv} EN`, de: `${titleSv} DE` },
  shortDescription: { sv: 'Kort beskrivning', en: 'Short desc', de: 'Kurzbeschreibung' },
  description: {
    sv: { root: { children: [{ type: 'paragraph', children: [{ type: 'text', text: 'Beskrivning' }] }] } },
    en: { root: { children: [{ type: 'paragraph', children: [{ type: 'text', text: 'Description' }] }] } },
    de: { root: { children: [{ type: 'paragraph', children: [{ type: 'text', text: 'Beschreibung' }] }] } },
  },
  highlights: { sv: [{ highlight: 'Höjdpunkt 1', id: '1' }], en: [{ highlight: 'Highlight 1', id: '1' }], de: null },
  pricing: { basePrice: 500, currency: 'SEK', priceType: 'per_person', groupDiscount: false, childPrice: null },
  duration: { hours: 2, durationText: { sv: '2 timmar', en: '2 hours', de: '2 Stunden' } },
  logistics: {
    meetingPointName: { sv: 'Stortorget', en: 'Main Square', de: 'Hauptplatz' },
    meetingPointAddress: { sv: null, en: null, de: null },
    coordinates: [18.0686, 59.3293],
    googleMapsLink: null,
    meetingPointInstructions: { sv: null, en: null, de: null },
    endingPoint: { sv: null, en: null, de: null },
    parkingInfo: { sv: null, en: null, de: null },
    publicTransportInfo: { sv: null, en: null, de: null },
  },
  included: { sv: [{ item: 'Fika', id: '1' }], en: [{ item: 'Coffee', id: '1' }], de: [{ item: 'Kaffee', id: '1' }] },
  notIncluded: { sv: [], en: [], de: [] },
  whatToBring: { sv: [], en: [], de: [] },
  targetAudience: ['family_friendly'],
  difficultyLevel: 'easy',
  ageRecommendation: { minimumAge: null, childFriendly: true, teenFriendly: false },
  accessibility: {
    wheelchairAccessible: false,
    mobilityNotes: { sv: null, en: null, de: null },
    hearingAssistance: false,
    visualAssistance: false,
    serviceAnimalsAllowed: false,
  },
  guide: { id: 1, slug: 'erik-guide', name: 'Erik' },
  categories: [{ id: 1, slug: 'history', name: 'History' }],
  neighborhoods: [{ id: 1, slug: 'gamla-stan', name: 'Gamla Stan' }],
  images: [],
  bokunExperienceId: null,
  availability: 'available',
  maxGroupSize: 15,
  minGroupSize: 2,
  featured: false,
  status: 'published',
  updatedAt: '2026-02-05T10:00:00Z',
  createdAt: '2026-02-01T10:00:00Z',
})

function setupMockPayload(tours: unknown[]) {
  const mockPayload = {
    find: vi.fn().mockResolvedValue({ docs: tours }),
  }
  vi.mocked(getPayload).mockResolvedValue(mockPayload as any)
  return mockPayload
}

// Dynamic import to get fresh module after mocks
async function getExportService() {
  const mod = await import('../lib/excel/tour-excel-export-service')
  return mod
}

describe('exportToursToExcel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('generates valid XLSX buffer', async () => {
    setupMockPayload([createMockTour('test-tour', 'Test Tur')])
    const { exportToursToExcel } = await getExportService()

    const buffer = await exportToursToExcel()

    expect(buffer).toBeInstanceOf(Buffer)
    expect(buffer.length).toBeGreaterThan(0)

    // Verify parseable by ExcelJS
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)
    expect(workbook.worksheets.length).toBeGreaterThan(0)
  })

  it('header row matches CSV headers', async () => {
    setupMockPayload([createMockTour('test-tour', 'Test Tur')])
    const { exportToursToExcel } = await getExportService()

    const buffer = await exportToursToExcel()
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)
    const sheet = workbook.worksheets[0]

    const { displayHeaders } = getCSVHeaders()
    const headerRow = sheet.getRow(1)
    const excelHeaders: string[] = []
    headerRow.eachCell((cell) => {
      excelHeaders.push(String(cell.value || ''))
    })

    expect(excelHeaders).toEqual(displayHeaders)
  })

  it('data rows contain flattened tour values', async () => {
    setupMockPayload([createMockTour('stockholm-walk', 'Stockholm Promenad')])
    const { exportToursToExcel } = await getExportService()

    const buffer = await exportToursToExcel()
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)
    const sheet = workbook.worksheets[0]

    // Row 2 = first data row
    const dataRow = sheet.getRow(2)
    // First column is slug
    expect(String(dataRow.getCell(1).value)).toBe('stockholm-walk')
  })

  it('header row is bold', async () => {
    setupMockPayload([createMockTour('test-tour', 'Test')])
    const { exportToursToExcel } = await getExportService()

    const buffer = await exportToursToExcel()
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)
    const sheet = workbook.worksheets[0]

    expect(sheet.getRow(1).font?.bold).toBe(true)
  })

  it('header row is frozen', async () => {
    setupMockPayload([createMockTour('test-tour', 'Test')])
    const { exportToursToExcel } = await getExportService()

    const buffer = await exportToursToExcel()
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)
    const sheet = workbook.worksheets[0]

    expect(sheet.views.length).toBeGreaterThan(0)
    expect(sheet.views[0].state).toBe('frozen')
    expect(sheet.views[0].ySplit).toBe(1)
  })

  it('section colors applied to header cells', async () => {
    setupMockPayload([createMockTour('test-tour', 'Test')])
    const { exportToursToExcel } = await getExportService()

    const buffer = await exportToursToExcel()
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)
    const sheet = workbook.worksheets[0]

    // First header cell (slug) should have Basic Info color
    const firstCell = sheet.getRow(1).getCell(1)
    expect(firstCell.fill).toBeDefined()
    const fill = firstCell.fill as ExcelJS.FillPattern
    expect(fill.type).toBe('pattern')
    expect(fill.fgColor?.argb).toBe('FFD6EAF8') // Basic Info blue
  })

  it('UTF-8 characters preserved (Swedish/German)', async () => {
    const tour = createMockTour('test-utf8', 'Ångström Ö Ä')
    // Override with special chars
    ;(tour.title as any).de = 'Über Straße'
    setupMockPayload([tour])
    const { exportToursToExcel } = await getExportService()

    const buffer = await exportToursToExcel()
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)
    const sheet = workbook.worksheets[0]

    const { columnKeys } = getCSVHeaders()
    const titleSvIdx = columnKeys.indexOf('title_sv') + 1
    const titleDeIdx = columnKeys.indexOf('title_de') + 1

    expect(String(sheet.getRow(2).getCell(titleSvIdx).value)).toBe('Ångström Ö Ä')
    expect(String(sheet.getRow(2).getCell(titleDeIdx).value)).toBe('Über Straße')
  })

  it('empty tours returns worksheet with header row only', async () => {
    setupMockPayload([])
    const { exportToursToExcel } = await getExportService()

    const buffer = await exportToursToExcel()
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)
    const sheet = workbook.worksheets[0]

    expect(sheet.rowCount).toBe(1) // Header row only
  })

  it('multiple tours produce multiple data rows', async () => {
    setupMockPayload([
      createMockTour('tour-1', 'Tour Ett'),
      createMockTour('tour-2', 'Tour Två'),
      createMockTour('tour-3', 'Tour Tre'),
    ])
    const { exportToursToExcel } = await getExportService()

    const buffer = await exportToursToExcel()
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)
    const sheet = workbook.worksheets[0]

    // 1 header + 3 data rows
    expect(sheet.rowCount).toBe(4)
  })
})

describe('generateExcelExportFilename', () => {
  it('returns filename with .xlsx extension and current date', async () => {
    const { generateExcelExportFilename } = await getExportService()
    const filename = generateExcelExportFilename()

    expect(filename).toMatch(/^tours-export-\d{4}-\d{2}-\d{2}\.xlsx$/)
  })
})
