/**
 * Read the CMS tours export xlsx into a typed TourRow array.
 *
 * Resilient to column reorder: looks up each field by header string, not column index.
 * Skips rows where Status !== 'published'.
 * Validates slug regex per BOKUN_DEFAULTS.SLUG_REGEX.
 *
 * See: plans/260515-2013-bokun-import-spreadsheet-generation/phase-02-generator-script.md
 */

import ExcelJS from 'exceljs'
import { SLUG_REGEX } from './bokun-import-defaults'

/** Shape of one tour row after parsing — keyed by stable names, not col indices. */
export interface TourRow {
  slug: string
  titleSv: string
  titleEn: string
  titleDe: string
  shortDescSv: string
  shortDescEn: string
  shortDescDe: string
  fullDescSv: string
  fullDescEn: string
  fullDescDe: string
  highlightsSv: string
  highlightsEn: string
  highlightsDe: string
  basePrice: number | null
  currency: string
  priceType: string
  groupDiscount: boolean
  childPrice: number | null
  durationHours: number
  durationTextSv: string
  durationTextEn: string
  durationTextDe: string
  meetingPointNameSv: string
  meetingPointNameEn: string
  meetingPointNameDe: string
  meetingPointAddressSv: string
  meetingPointAddressEn: string
  meetingPointAddressDe: string
  coordinates: string // raw "lat,lng" or empty
  googleMapsLink: string
  meetingInstructionsSv: string
  meetingInstructionsEn: string
  meetingInstructionsDe: string
  endingPointSv: string
  endingPointEn: string
  endingPointDe: string
  parkingInfoSv: string
  parkingInfoEn: string
  parkingInfoDe: string
  publicTransportSv: string
  publicTransportEn: string
  publicTransportDe: string
  includedSv: string
  includedEn: string
  includedDe: string
  notIncludedSv: string
  notIncludedEn: string
  notIncludedDe: string
  whatToBringSv: string
  whatToBringEn: string
  whatToBringDe: string
  targetAudience: string
  difficultyLevel: string
  minimumAge: number | null
  childFriendly: boolean
  teenFriendly: boolean
  wheelchairAccessible: boolean
  mobilityNotesSv: string
  mobilityNotesEn: string
  mobilityNotesDe: string
  hearingAssistance: boolean
  visualAssistance: boolean
  serviceAnimalsAllowed: boolean
  guides: string
  categoriesSlugs: string
  neighborhoodsSlugs: string
  images: string
  bokunExperienceId: string
  availability: string
  maxGroupSize: number | null
  minGroupSize: number | null
  featured: boolean
  status: string
}

// Map CMS header label → TourRow key. Single source of truth for column lookup.
const HEADER_TO_KEY: Record<string, keyof TourRow> = {
  'Slug (URL)': 'slug',
  'Title (Swedish)': 'titleSv',
  'Title (English)': 'titleEn',
  'Title (German)': 'titleDe',
  'Short Description (Swedish)': 'shortDescSv',
  'Short Description (English)': 'shortDescEn',
  'Short Description (German)': 'shortDescDe',
  'Full Description (Swedish)': 'fullDescSv',
  'Full Description (English)': 'fullDescEn',
  'Full Description (German)': 'fullDescDe',
  'Highlights (Swedish)': 'highlightsSv',
  'Highlights (English)': 'highlightsEn',
  'Highlights (German)': 'highlightsDe',
  'Base Price': 'basePrice',
  Currency: 'currency',
  'Price Type': 'priceType',
  'Group Discount?': 'groupDiscount',
  'Child Price': 'childPrice',
  'Duration (Hours)': 'durationHours',
  'Duration Text (Swedish)': 'durationTextSv',
  'Duration Text (English)': 'durationTextEn',
  'Duration Text (German)': 'durationTextDe',
  'Meeting Point Name (Swedish)': 'meetingPointNameSv',
  'Meeting Point Name (English)': 'meetingPointNameEn',
  'Meeting Point Name (German)': 'meetingPointNameDe',
  'Meeting Point Address (Swedish)': 'meetingPointAddressSv',
  'Meeting Point Address (English)': 'meetingPointAddressEn',
  'Meeting Point Address (German)': 'meetingPointAddressDe',
  'Coordinates (lat,lng)': 'coordinates',
  'Google Maps Link': 'googleMapsLink',
  'Meeting Instructions (Swedish)': 'meetingInstructionsSv',
  'Meeting Instructions (English)': 'meetingInstructionsEn',
  'Meeting Instructions (German)': 'meetingInstructionsDe',
  'Ending Point (Swedish)': 'endingPointSv',
  'Ending Point (English)': 'endingPointEn',
  'Ending Point (German)': 'endingPointDe',
  'Parking Info (Swedish)': 'parkingInfoSv',
  'Parking Info (English)': 'parkingInfoEn',
  'Parking Info (German)': 'parkingInfoDe',
  'Public Transport Info (Swedish)': 'publicTransportSv',
  'Public Transport Info (English)': 'publicTransportEn',
  'Public Transport Info (German)': 'publicTransportDe',
  'Included (Swedish)': 'includedSv',
  'Included (English)': 'includedEn',
  'Included (German)': 'includedDe',
  'Not Included (Swedish)': 'notIncludedSv',
  'Not Included (English)': 'notIncludedEn',
  'Not Included (German)': 'notIncludedDe',
  'What to Bring (Swedish)': 'whatToBringSv',
  'What to Bring (English)': 'whatToBringEn',
  'What to Bring (German)': 'whatToBringDe',
  'Target Audience': 'targetAudience',
  'Difficulty Level': 'difficultyLevel',
  'Minimum Age': 'minimumAge',
  'Child Friendly?': 'childFriendly',
  'Teen Friendly?': 'teenFriendly',
  'Wheelchair Accessible?': 'wheelchairAccessible',
  'Mobility Notes (Swedish)': 'mobilityNotesSv',
  'Mobility Notes (English)': 'mobilityNotesEn',
  'Mobility Notes (German)': 'mobilityNotesDe',
  'Hearing Assistance?': 'hearingAssistance',
  'Visual Assistance?': 'visualAssistance',
  'Service Animals Allowed?': 'serviceAnimalsAllowed',
  'Guides (slugs)': 'guides',
  'Categories (slugs)': 'categoriesSlugs',
  'Neighborhoods (slugs)': 'neighborhoodsSlugs',
  'Images (URLs)': 'images',
  'Bokun Experience ID': 'bokunExperienceId',
  Availability: 'availability',
  'Max Group Size': 'maxGroupSize',
  'Min Group Size': 'minGroupSize',
  'Featured?': 'featured',
  Status: 'status',
}

// Field-level coercion: which keys should be number vs boolean.
const NUMBER_KEYS: ReadonlySet<keyof TourRow> = new Set([
  'basePrice',
  'childPrice',
  'durationHours',
  'minimumAge',
  'maxGroupSize',
  'minGroupSize',
])
const BOOL_KEYS: ReadonlySet<keyof TourRow> = new Set([
  'groupDiscount',
  'childFriendly',
  'teenFriendly',
  'wheelchairAccessible',
  'hearingAssistance',
  'visualAssistance',
  'serviceAnimalsAllowed',
  'featured',
])

/** Stringify an ExcelJS cell value robustly (handles rich text + formula results). */
function cellToString(value: ExcelJS.CellValue): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'object') {
    // Rich text
    if ('richText' in value && Array.isArray((value as { richText?: unknown }).richText)) {
      return (value as ExcelJS.CellRichTextValue).richText.map((t) => t.text).join('')
    }
    if ('text' in value && typeof (value as { text?: unknown }).text === 'string') {
      return (value as { text: string }).text
    }
    if ('result' in value) {
      return cellToString((value as ExcelJS.CellFormulaValue).result as ExcelJS.CellValue)
    }
    if ('hyperlink' in value && typeof (value as { hyperlink?: unknown }).hyperlink === 'string') {
      return (value as { hyperlink: string }).hyperlink
    }
  }
  return String(value)
}

function coerceBool(raw: string): boolean {
  const v = raw.trim().toLowerCase()
  return v === 'true' || v === 'yes' || v === '1'
}

function coerceNumber(raw: string): number | null {
  const v = raw.trim()
  if (!v) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export interface ReadOptions {
  /** Path to the CMS export xlsx. */
  filePath: string
  /** Sheet name in the export (default: "Tours"). */
  sheetName?: string
  /** Skip rows with status !== this (default: 'published'). Pass null to include all. */
  filterStatus?: string | null
}

export async function readCmsTourExport(opts: ReadOptions): Promise<TourRow[]> {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(opts.filePath)
  const sheet = wb.getWorksheet(opts.sheetName ?? 'Tours')
  if (!sheet) throw new Error(`Sheet "${opts.sheetName ?? 'Tours'}" not found in ${opts.filePath}`)

  // Build col-index → key map from the header row.
  const headerRow = sheet.getRow(1)
  const colToKey = new Map<number, keyof TourRow>()
  const seenHeaders = new Set<string>()
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const header = cellToString(cell.value).trim()
    seenHeaders.add(header)
    const key = HEADER_TO_KEY[header]
    if (key) colToKey.set(colNumber, key)
  })

  // Sanity: warn about unmapped headers (CMS added a new column).
  for (const header of seenHeaders) {
    if (!(header in HEADER_TO_KEY)) {
      console.warn(`  ⚠  Unknown CMS column ignored: "${header}"`)
    }
  }

  const filterStatus = opts.filterStatus === undefined ? 'published' : opts.filterStatus
  const rows: TourRow[] = []

  for (let r = 2; r <= sheet.rowCount; r++) {
    const xlRow = sheet.getRow(r)
    const tour = createEmptyTourRow()
    xlRow.eachCell({ includeEmpty: true }, (cell, col) => {
      const key = colToKey.get(col)
      if (!key) return
      const raw = cellToString(cell.value)
      assignField(tour, key, raw)
    })

    if (!tour.slug) continue // blank row
    if (filterStatus !== null && tour.status !== filterStatus) continue

    if (!SLUG_REGEX.test(tour.slug)) {
      throw new Error(`Row ${r}: slug "${tour.slug}" fails ${SLUG_REGEX} — fix in CMS export before import`)
    }
    rows.push(tour)
  }

  return rows
}

function createEmptyTourRow(): TourRow {
  // Initialize every field so downstream code never sees `undefined`.
  return {
    slug: '',
    titleSv: '',
    titleEn: '',
    titleDe: '',
    shortDescSv: '',
    shortDescEn: '',
    shortDescDe: '',
    fullDescSv: '',
    fullDescEn: '',
    fullDescDe: '',
    highlightsSv: '',
    highlightsEn: '',
    highlightsDe: '',
    basePrice: null,
    currency: '',
    priceType: '',
    groupDiscount: false,
    childPrice: null,
    durationHours: 0,
    durationTextSv: '',
    durationTextEn: '',
    durationTextDe: '',
    meetingPointNameSv: '',
    meetingPointNameEn: '',
    meetingPointNameDe: '',
    meetingPointAddressSv: '',
    meetingPointAddressEn: '',
    meetingPointAddressDe: '',
    coordinates: '',
    googleMapsLink: '',
    meetingInstructionsSv: '',
    meetingInstructionsEn: '',
    meetingInstructionsDe: '',
    endingPointSv: '',
    endingPointEn: '',
    endingPointDe: '',
    parkingInfoSv: '',
    parkingInfoEn: '',
    parkingInfoDe: '',
    publicTransportSv: '',
    publicTransportEn: '',
    publicTransportDe: '',
    includedSv: '',
    includedEn: '',
    includedDe: '',
    notIncludedSv: '',
    notIncludedEn: '',
    notIncludedDe: '',
    whatToBringSv: '',
    whatToBringEn: '',
    whatToBringDe: '',
    targetAudience: '',
    difficultyLevel: '',
    minimumAge: null,
    childFriendly: false,
    teenFriendly: false,
    wheelchairAccessible: false,
    mobilityNotesSv: '',
    mobilityNotesEn: '',
    mobilityNotesDe: '',
    hearingAssistance: false,
    visualAssistance: false,
    serviceAnimalsAllowed: false,
    guides: '',
    categoriesSlugs: '',
    neighborhoodsSlugs: '',
    images: '',
    bokunExperienceId: '',
    availability: '',
    maxGroupSize: null,
    minGroupSize: null,
    featured: false,
    status: '',
  }
}

function assignField(tour: TourRow, key: keyof TourRow, raw: string): void {
  if (NUMBER_KEYS.has(key)) {
    ;(tour as Record<string, unknown>)[key] = coerceNumber(raw)
    return
  }
  if (BOOL_KEYS.has(key)) {
    ;(tour as Record<string, unknown>)[key] = coerceBool(raw)
    return
  }
  ;(tour as Record<string, unknown>)[key] = raw
}
