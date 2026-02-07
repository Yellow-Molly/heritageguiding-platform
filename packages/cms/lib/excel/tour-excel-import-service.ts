/**
 * Tour Excel Import Service
 * Parses .xlsx files, validates data via existing Zod schema, creates tours via Payload Local API
 * Reuses CSV validation and tour creation logic -- format-agnostic Record<string, string> interface
 */
import ExcelJS from 'exceljs'
import { getPayload } from 'payload'
import config from '../../payload.config'
import { validateCSVRow, type TourCSVRow } from '../csv/tour-csv-schema-validation'
import { csvRowToTourData, getCSVHeaders } from '../csv/tour-csv-column-mapping'
import type { ImportResult, ImportOptions } from '../csv/tour-csv-import-service'

export type { ImportResult, ImportError, ImportWarning, ImportOptions } from '../csv/tour-csv-import-service'

/**
 * Build a reverse map: display header (or raw column key) -> internal column key
 * Supports fuzzy matching: case-insensitive, whitespace-trimmed
 */
function buildHeaderToKeyMap(): Map<string, string> {
  const { displayHeaders, columnKeys } = getCSVHeaders()
  const map = new Map<string, string>()

  // Map display headers to column keys (fuzzy: lowercased + trimmed)
  displayHeaders.forEach((h, i) => {
    map.set(h.toLowerCase().trim(), columnKeys[i])
  })

  // Also map raw column keys to themselves (for spreadsheets using internal keys)
  columnKeys.forEach((k) => {
    map.set(k.toLowerCase().trim(), k)
  })

  return map
}

/**
 * Import tours from Excel buffer (.xlsx)
 * Reads first worksheet, maps headers to column keys, validates via Zod, creates tours
 */
export async function importToursFromExcel(
  buffer: Buffer,
  options: ImportOptions = {}
): Promise<ImportResult> {
  const payload = await getPayload({ config })
  const { dryRun = false } = options

  const result: ImportResult = {
    created: 0,
    skipped: 0,
    errors: [],
    warnings: [],
  }

  // Parse Excel workbook from buffer
  const workbook = new ExcelJS.Workbook()
  try {
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer)
  } catch (parseError) {
    result.errors.push({
      row: 0,
      message: `Excel parse error: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
    })
    return result
  }

  const worksheet = workbook.worksheets[0]
  if (!worksheet) {
    result.errors.push({ row: 0, message: 'No worksheet found in Excel file' })
    return result
  }

  // Build fuzzy header-to-key map
  const headerToKey = buildHeaderToKeyMap()

  // Extract header row and map column indices to internal keys
  const headerRow = worksheet.getRow(1)
  const colIndexToKey = new Map<number, string>()
  headerRow.eachCell((cell, colNumber) => {
    const headerValue = String(cell.value || '').toLowerCase().trim()
    const key = headerToKey.get(headerValue)
    if (key) colIndexToKey.set(colNumber, key)
  })

  if (colIndexToKey.size === 0) {
    result.errors.push({ row: 1, message: 'No recognized headers found in first row' })
    return result
  }

  // Column key aliases: export uses 'guide' but Zod schema expects 'guide_slug'
  const COLUMN_KEY_ALIASES: Record<string, string> = { guide: 'guide_slug' }

  // Convert data rows to Record<string, string>[]
  const records: Record<string, string>[] = []
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return // skip header
    const record: Record<string, string> = {}
    let hasData = false
    colIndexToKey.forEach((key, colIndex) => {
      const cell = row.getCell(colIndex)
      const value = cell.value != null ? String(cell.value).trim() : ''
      // Apply alias if exists (e.g., 'guide' → 'guide_slug' for Zod compatibility)
      const aliasedKey = COLUMN_KEY_ALIASES[key] || key
      // Only include non-empty values so Zod .optional().default() works correctly
      if (value) {
        record[aliasedKey] = value
        hasData = true
      }
    })
    if (hasData) records.push(record)
  })

  if (records.length === 0) {
    result.warnings.push({ row: 0, message: 'Excel file is empty or contains only headers' })
    return result
  }

  // Pre-fetch existing slugs for duplicate check
  const { docs: existingTours } = await payload.find({
    collection: 'tours',
    limit: 10000,
    select: { slug: true },
  })
  const existingSlugs = new Set(existingTours.map((t) => t.slug))

  // Pre-fetch relationships for resolution
  const { docs: guides } = await payload.find({ collection: 'guides', limit: 1000 })
  const guideMap = new Map(guides.map((g) => [g.slug, g.id]))

  const { docs: categories } = await payload.find({ collection: 'categories', limit: 100 })
  const categoryMap = new Map(categories.map((c) => [c.slug, c.id]))

  const { docs: neighborhoods } = await payload.find({ collection: 'neighborhoods', limit: 100 })
  const neighborhoodMap = new Map(neighborhoods.map((n) => [n.slug, n.id]))

  // Process each record (same logic as CSV import)
  for (let i = 0; i < records.length; i++) {
    const rowNumber = i + 2 // +2 for 1-indexed + header row
    const row = records[i]

    // Validate row against Zod schema
    const validation = validateCSVRow(row, rowNumber)
    if (!validation.valid || !validation.data) {
      result.errors.push(...(validation.errors || []))
      continue
    }

    const data: TourCSVRow = validation.data

    // Check for duplicate slug
    if (existingSlugs.has(data.slug)) {
      result.warnings.push({
        row: rowNumber,
        message: `Slug "${data.slug}" already exists, skipping`,
      })
      result.skipped++
      continue
    }

    // Resolve guide relationship
    const guideId = guideMap.get(data.guide_slug)
    if (!guideId) {
      result.errors.push({
        row: rowNumber,
        field: 'guide_slug',
        message: `Guide with slug "${data.guide_slug}" not found`,
      })
      continue
    }

    // Resolve category relationships
    const categoryIds: (string | number)[] = []
    for (const slug of data.categories || []) {
      const id = categoryMap.get(slug)
      if (id) {
        categoryIds.push(id)
      } else {
        result.warnings.push({
          row: rowNumber,
          message: `Category "${slug}" not found, skipping`,
        })
      }
    }

    // Resolve neighborhood relationships
    const neighborhoodIds: (string | number)[] = []
    for (const slug of data.neighborhoods || []) {
      const id = neighborhoodMap.get(slug)
      if (id) {
        neighborhoodIds.push(id)
      } else {
        result.warnings.push({
          row: rowNumber,
          message: `Neighborhood "${slug}" not found, skipping`,
        })
      }
    }

    // Dry run: skip actual creation
    if (dryRun) {
      result.created++
      existingSlugs.add(data.slug)
      continue
    }

    // Convert row to tour document and create
    const tourData = csvRowToTourData(data, { guideId, categoryIds, neighborhoodIds })

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await payload.create({ collection: 'tours', data: tourData as any })
      result.created++
      existingSlugs.add(data.slug)
    } catch (createError) {
      result.errors.push({
        row: rowNumber,
        message: `Failed to create tour: ${createError instanceof Error ? createError.message : 'Unknown error'}`,
      })
    }
  }

  return result
}
