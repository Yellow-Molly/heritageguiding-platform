/**
 * Tour Excel Export Service
 * Exports tours collection to .xlsx format with styled headers and auto-width columns
 * Reuses existing CSV column mapping and flattening logic
 */
import ExcelJS from 'exceljs'
import { getPayload } from 'payload'
import config from '../../payload.config'
import {
  getCSVHeaders,
  flattenTourToCSVRow,
  TOUR_CSV_COLUMNS,
  type TourWithLocales,
} from '../csv/tour-csv-column-mapping'
import type { ExportOptions } from '../csv/tour-csv-export-service'

export type { ExportOptions } from '../csv/tour-csv-export-service'

/**
 * Section color mapping for header cells (ARGB format)
 * Groups columns by their section comments in TOUR_CSV_COLUMNS
 */
const SECTION_COLORS: Record<string, string> = {
  'Basic Information': 'FFD6EAF8',
  'Pricing Group': 'FFD5F5E3',
  'Duration Group': 'FFFEF9E7',
  'Logistics Group': 'FFFDEBD0',
  'Inclusions': 'FFE8DAEF',
  'Audience & Difficulty': 'FFFDEDEC',
  'Accessibility Group': 'FFD1F2EB',
  'Relationships': 'FFF2F3F4',
  'Status/Meta': 'FFFFFFFF',
}

/**
 * Build a map from column key to section color based on TOUR_CSV_COLUMNS order
 * Sections are inferred from the column grouping structure
 */
function buildColumnSectionColorMap(): Map<string, string> {
  const colorMap = new Map<string, string>()
  const sections = Object.keys(SECTION_COLORS)
  // Column ranges for each section (index into TOUR_CSV_COLUMNS)
  const sectionRanges: [number, number][] = [
    [0, 4],   // Basic Information: slug through highlights
    [5, 9],   // Pricing: basePrice through childPrice
    [10, 11], // Duration: hours, durationText
    [12, 19], // Logistics: meetingPointName through publicTransportInfo
    [20, 22], // Inclusions: included, notIncluded, whatToBring
    [23, 27], // Audience: targetAudience through teenFriendly
    [28, 32], // Accessibility: wheelchair through serviceAnimals
    [33, 36], // Relationships: guide, categories, neighborhoods, images
    [37, 42], // Status/Meta: bokunExperienceId through status
  ]

  const { columnKeys } = getCSVHeaders()
  let keyIndex = 0

  for (const col of TOUR_CSV_COLUMNS) {
    const colIdx = TOUR_CSV_COLUMNS.indexOf(col)
    // Find which section this column belongs to
    let sectionName = 'Status/Meta'
    for (let s = 0; s < sectionRanges.length; s++) {
      if (colIdx >= sectionRanges[s][0] && colIdx <= sectionRanges[s][1]) {
        sectionName = sections[s]
        break
      }
    }
    const color = SECTION_COLORS[sectionName] || 'FFFFFFFF'

    if (col.localized) {
      // Localized columns expand to 3 keys (_sv, _en, _de)
      for (let l = 0; l < 3; l++) {
        colorMap.set(columnKeys[keyIndex + l], color)
      }
      keyIndex += 3
    } else {
      colorMap.set(columnKeys[keyIndex], color)
      keyIndex += 1
    }
  }

  return colorMap
}

/**
 * Export all tours to Excel buffer (.xlsx)
 * Fetches tours with all locales and relationships populated
 */
export async function exportToursToExcel(options: ExportOptions = {}): Promise<Buffer> {
  const payload = await getPayload({ config })

  const { docs: tours } = await payload.find({
    collection: 'tours',
    limit: options.limit || 10000,
    depth: 2,
    locale: 'all',
    where: options.status
      ? { status: { equals: options.status } }
      : undefined,
  })

  const rows = tours.map((tour) => flattenTourToCSVRow(tour as unknown as TourWithLocales))
  const { displayHeaders, columnKeys } = getCSVHeaders()
  const sectionColorMap = buildColumnSectionColorMap()

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Tours')

  // Define columns with headers
  sheet.columns = columnKeys.map((key, i) => ({
    header: displayHeaders[i],
    key,
    width: 15, // default, will be auto-fitted below
  }))

  // Style header row: bold + section-colored fills
  const headerRow = sheet.getRow(1)
  headerRow.font = { bold: true }
  headerRow.eachCell((cell, colNumber) => {
    const key = columnKeys[colNumber - 1]
    const color = sectionColorMap.get(key) || 'FFFFFFFF'
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: color },
    }
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
    }
  })

  // Add data rows
  for (const row of rows) {
    sheet.addRow(row)
  }

  // Auto-fit column widths based on content (clamp 10-50)
  for (const col of sheet.columns) {
    let maxLen = col.header ? String(col.header).length : 10
    if (col.eachCell) {
      col.eachCell({ includeEmpty: false }, (cell) => {
        const len = cell.value ? String(cell.value).length : 0
        if (len > maxLen) maxLen = len
      })
    }
    col.width = Math.min(50, Math.max(10, Math.ceil(maxLen * 1.2)))
  }

  // Freeze header row
  sheet.views = [{ state: 'frozen' as const, ySplit: 1 }]

  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer)
}

/**
 * Generate export filename with current date
 */
export function generateExcelExportFilename(): string {
  const date = new Date().toISOString().slice(0, 10)
  return `tours-export-${date}.xlsx`
}
