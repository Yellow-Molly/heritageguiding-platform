/**
 * Tour CSV Import Service
 * Parses CSV files, validates data, and creates new tours via Payload Local API
 * Create-only mode: skips existing slugs with warning (no updates)
 */
import { parse } from 'csv-parse/sync'
import { getPayload } from 'payload'
import config from '../../payload.config'
import { validateCSVRow, type TourCSVRow } from './tour-csv-schema-validation'
import { csvRowToTourData } from './tour-csv-column-mapping'

export interface ImportError {
  row: number
  field?: string
  message: string
}

export interface ImportWarning {
  row: number
  message: string
}

export interface ImportResult {
  created: number
  skipped: number
  errors: ImportError[]
  warnings: ImportWarning[]
}

export interface ImportOptions {
  /** Dry run - validate only, don't create tours */
  dryRun?: boolean
}

/**
 * Import tours from CSV content
 * @param csvContent Raw CSV string with UTF-8 encoding
 * @param options Import options
 * @returns Import result with counts and error details
 */
export async function importToursFromCSV(
  csvContent: string,
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

  // Parse CSV with header row
  let records: Record<string, string>[]
  try {
    records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true, // Handle UTF-8 BOM
      relax_column_count: true, // Allow rows with different column counts
    })
  } catch (parseError) {
    result.errors.push({
      row: 0,
      message: `CSV parse error: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
    })
    return result
  }

  if (records.length === 0) {
    result.warnings.push({ row: 0, message: 'CSV file is empty or contains only headers' })
    return result
  }

  // Pre-fetch existing slugs for duplicate check
  const { docs: existingTours } = await payload.find({
    collection: 'tours',
    limit: 10000,
    select: { slug: true },
  })
  const existingSlugs = new Set(existingTours.map((t) => t.slug))

  // Pre-fetch guides for relationship resolution
  const { docs: guides } = await payload.find({
    collection: 'guides',
    limit: 1000,
  })
  const guideMap = new Map(guides.map((g) => [g.slug, g.id]))

  // Pre-fetch categories for relationship resolution
  const { docs: categories } = await payload.find({
    collection: 'categories',
    limit: 100,
  })
  const categoryMap = new Map(categories.map((c) => [c.slug, c.id]))

  // Pre-fetch neighborhoods for relationship resolution
  const { docs: neighborhoods } = await payload.find({
    collection: 'neighborhoods',
    limit: 100,
  })
  const neighborhoodMap = new Map(neighborhoods.map((n) => [n.slug, n.id]))

  // Process each row
  for (let i = 0; i < records.length; i++) {
    const rowNumber = i + 2 // +2 for 1-indexed + header row
    const row = records[i]

    // Skip completely empty rows
    const hasData = Object.values(row).some((v) => v && v.trim())
    if (!hasData) {
      continue
    }

    // Validate row against schema
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

    // Resolve category relationships (optional, warn if not found)
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

    // Resolve neighborhood relationships (optional, warn if not found)
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
      existingSlugs.add(data.slug) // Track for duplicate detection within file
      continue
    }

    // Convert CSV row to tour document structure
    const tourData = csvRowToTourData(data, {
      guideId,
      categoryIds,
      neighborhoodIds,
    })

    // Create tour
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await payload.create({
        collection: 'tours',
        data: tourData as any,
      })

      result.created++
      existingSlugs.add(data.slug) // Track newly created
    } catch (createError) {
      result.errors.push({
        row: rowNumber,
        message: `Failed to create tour: ${createError instanceof Error ? createError.message : 'Unknown error'}`,
      })
    }
  }

  return result
}
