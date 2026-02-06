/**
 * Tour CSV Export Service
 * Exports tours collection to CSV format with UTF-8 BOM for Excel compatibility
 * Supports all locales (sv/en/de) with flattened column structure
 */
import { stringify } from 'csv-stringify/sync'
import { getPayload } from 'payload'
import config from '../../payload.config'
import { getCSVHeaders, flattenTourToCSVRow, type TourWithLocales } from './tour-csv-column-mapping'

export interface ExportOptions {
  /** Filter by status (e.g., 'published') */
  status?: 'draft' | 'published' | 'archived'
  /** Maximum number of tours to export */
  limit?: number
}

/**
 * Export all tours to CSV string with UTF-8 BOM
 * Fetches tours with all locales and relationships populated
 */
export async function exportToursToCSV(options: ExportOptions = {}): Promise<string> {
  const payload = await getPayload({ config })

  // Fetch all tours with depth for relationships and all locales
  const { docs: tours } = await payload.find({
    collection: 'tours',
    limit: options.limit || 10000,
    depth: 2, // Populate relationships (guide, categories, neighborhoods, images)
    locale: 'all', // Get all localized content
    where: options.status
      ? {
          status: { equals: options.status },
        }
      : undefined,
  })

  // Flatten each tour to CSV row format
  const rows = tours.map((tour) => flattenTourToCSVRow(tour as unknown as TourWithLocales))

  // Get headers - display labels for header row, column keys for data mapping
  const { displayHeaders, columnKeys } = getCSVHeaders()

  // Generate CSV without BOM (we'll add it manually with sep hint)
  // Use column keys for data, but display headers for header row
  const csv = stringify(rows, {
    header: true,
    columns: columnKeys.map((key, i) => ({ key, header: displayHeaders[i] })),
  })

  // UTF-8 BOM + sep=, hint for Excel to recognize comma delimiter
  // (needed for European locales where semicolon is default)
  const BOM = '\uFEFF'
  return BOM + 'sep=,\n' + csv
}

/**
 * Generate export filename with current date
 */
export function generateExportFilename(): string {
  const date = new Date().toISOString().slice(0, 10)
  return `tours-export-${date}.csv`
}
