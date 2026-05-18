/**
 * Build the 13-sheet Bokun import xlsx by loading the official template and
 * appending mapped data rows to the 5 populated sheets:
 *   Products, Pricing categories, Rates, Photos, Meeting points
 *
 * Other 8 sheets stay header-only. Headers come from the template verbatim —
 * header drift in the template would fail-fast here, not silently in Bokun.
 */

import ExcelJS from 'exceljs'
import type {
  BokunMeetingPointRow,
  BokunPhotoRow,
  BokunPricingCategoryRow,
  BokunProductRow,
  BokunRateRow,
  BokunRowBundle,
} from './bokun-import-mapper'

// ─── Column order per sheet — index in array matches xlsx column 1..N ────────

const PRODUCTS_COL_ORDER: ReadonlyArray<keyof BokunProductRow> = [
  'id',
  'productCode',
  'title',
  'experienceType',
  'bookingType',
  'capacityType',
  'scheduleType',
  'passExpiryType',
  'passCapacity',
  'fixedPassExpiryDate',
  'passValidForDays',
  'meetingType',
  'categories',
  'attributes',
  'accessibilityTypes',
  'guidances',
  'difficultyLevel',
  'minimumAge',
  'durationWeeks',
  'durationDays',
  'durationHours',
  'durationMinutes',
  'cutoffWeeks',
  'cutoffDays',
  'cutoffHours',
  'cutoffMinutes',
  'cutoffType',
  'cutoffReferenceHour',
  'cutoffReferenceMinute',
  'excerpt',
  'description',
  'keywords',
  'flags',
  'included',
  'excluded',
  'inclusions',
  'exclusions',
  'knowBeforeYouGo',
  'requirements',
  'attention',
  'ticketPerPerson',
  'privateExperience',
  'requestDeadlineWeeks',
  'requestDeadlineDays',
  'requestDeadlineHours',
  'requestDeadlineMinutes',
  'allowCustomBookings',
  'customPickupAllowed',
  'pickupMinutesBefore',
  'dropoffService',
  'customDropoffAllowed',
  'location',
  'defaultRate',
  'defaultPricingCategory',
  'timeZone',
]

const PRICING_CATEGORIES_COL_ORDER: ReadonlyArray<keyof BokunPricingCategoryRow> = [
  'productId',
  'productCode',
  'title',
  'ticketCategory',
]

const RATES_COL_ORDER: ReadonlyArray<keyof BokunRateRow> = [
  'productId',
  'productCode',
  'code',
  'title',
  'description',
  'minPerBooking',
  'maxPerBooking',
  'pricedPerPerson',
  'pickupSelectionType',
  'pickupPricingType',
  'pickupPricedPerPerson',
  'dropoffSelectionType',
  'dropoffPricingType',
  'dropoffPricedPerPerson',
  'cancellationPolicy',
]

const PHOTOS_COL_ORDER: ReadonlyArray<keyof BokunPhotoRow> = [
  'productId',
  'productCode',
  'photoCode',
  'photoUrl',
  'photoDescription',
]

const MEETING_POINTS_COL_ORDER: ReadonlyArray<keyof BokunMeetingPointRow> = [
  'productId',
  'productCode',
  'title',
  'addressLine1',
  'addressLine2',
  'addressLine3',
  'city',
  'countryCode',
  'state',
  'postalCode',
  'latitude',
  'longitude',
  'zoomLevel',
  'unLocodeCountry',
  'unLocodeCity',
]

// ─── Expected header strings — must match template exactly (fail-fast on drift) ─

const EXPECTED_HEADERS: Record<string, ReadonlyArray<string>> = {
  Products: [
    'ID', 'Product code', 'Title', 'Experience type', 'Booking type', 'Capacity type',
    'Schedule type', 'Pass expiry type', 'Pass capacity', 'Fixed pass expiry date',
    'Pass valid for days', 'Meeting type', 'Categories', 'Attributes', 'Accessibility types',
    'Guidances', 'Difficulty level', 'Minimum age', 'Duration weeks', 'Duration days',
    'Duration hours', 'Duration minutes', 'Cutoff weeks', 'Cutoff days', 'Cutoff hours',
    'Cutoff minutes', 'Cutoff type', 'Cutoff reference hour', 'Cutoff reference minute',
    'Excerpt', 'Description', 'Keywords', 'Flags', 'Included', 'Excluded', 'Inclusions',
    'Exclusions', 'KnowBeforeYouGo', 'Requirements', 'Attention', 'Ticket per person',
    'Private experience', 'Request deadline weeks', 'Request deadline days',
    'Request deadline hours', 'Request deadline minutes', 'Allow custom bookings',
    'Custom pickup allowed', 'Pickup minutes before', 'Dropoff service',
    'Custom dropoff allowed', 'Location', 'Default rate', 'Default pricing category',
    'Time zone',
  ],
  'Pricing categories': ['Product ID', 'Product code', 'Title', 'Ticket category'],
  Rates: [
    'Product ID', 'Product code', 'Code', 'Title', 'Description', 'Min per booking',
    'Max per booking', 'Priced per person', 'Pickup selection type', 'Pickup pricing type',
    'Pickup priced per person', 'Dropoff selection type', 'Dropoff pricing type',
    'Dropoff priced per person', 'Cancellation policy',
  ],
  Photos: ['Product ID', 'Product code', 'Photo code', 'Photo URL', 'Photo description'],
  'Meeting points': [
    'Product ID', 'Product code', 'Title', 'Address line 1', 'Address line 2',
    'Address line 3', 'City', 'Country code', 'State', 'Postal code', 'Latitude',
    'Longitude', 'Zoom level', 'UN/Locode country', 'UN/Locode city',
  ],
}

// ─── Cell stringifier (mirrors reader util — local copy to avoid cross-import) ─

function cellHeaderText(value: ExcelJS.CellValue): string {
  if (value == null) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'object' && 'richText' in value) {
    return (value as ExcelJS.CellRichTextValue).richText.map((t) => t.text).join('').trim()
  }
  return String(value).trim()
}

function assertSheetHeaders(wb: ExcelJS.Workbook, sheetName: string): void {
  const sheet = wb.getWorksheet(sheetName)
  if (!sheet) throw new Error(`Template missing sheet "${sheetName}"`)
  const expected = EXPECTED_HEADERS[sheetName]
  if (!expected) return // Sheet not validated (empty-passthrough sheets).
  const headerRow = sheet.getRow(1)
  for (let i = 0; i < expected.length; i++) {
    const actual = cellHeaderText(headerRow.getCell(i + 1).value)
    if (actual !== expected[i]) {
      throw new Error(
        `Template drift in sheet "${sheetName}" col ${i + 1}: expected "${expected[i]}", got "${actual}". ` +
        `Update bokun-import-writer.ts EXPECTED_HEADERS to match.`
      )
    }
  }
}

// ─── Row serializer — map object keys → positional array per col-order constant ─
//
// Empty values must be emitted as `null` (truly blank cell), not `''`. Bokun
// validates numeric columns by cell type — `''` is parsed as STRING and rejected
// for cols like "Fixed pass expiry date" (NUMERIC/FORMULA/BLANK only).

function buildRow<T>(obj: T, order: ReadonlyArray<keyof T>): unknown[] {
  return order.map((k) => {
    const v = obj[k]
    if (v === null || v === undefined || v === '') return null
    return v
  })
}

// ─── Public API ──────────────────────────────────────────────────────────────

export interface WriteOptions {
  templatePath: string
  outputPath: string
  bundles: BokunRowBundle[]
}

export async function writeBokunImportXlsx(opts: WriteOptions): Promise<{
  productRows: number
  pricingRows: number
  rateRows: number
  photoRows: number
  meetingPointRows: number
}> {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.readFile(opts.templatePath)

  // Validate the 5 sheets we'll populate.
  for (const name of Object.keys(EXPECTED_HEADERS)) {
    assertSheetHeaders(wb, name)
  }

  const products = wb.getWorksheet('Products')!
  const pricing = wb.getWorksheet('Pricing categories')!
  const rates = wb.getWorksheet('Rates')!
  const photos = wb.getWorksheet('Photos')!
  const meeting = wb.getWorksheet('Meeting points')!

  let productRows = 0
  let pricingRows = 0
  let rateRows = 0
  let photoRows = 0
  let meetingPointRows = 0

  for (const b of opts.bundles) {
    products.addRow(buildRow(b.product, PRODUCTS_COL_ORDER))
    productRows++
    pricing.addRow(buildRow(b.pricingCategory, PRICING_CATEGORIES_COL_ORDER))
    pricingRows++
    rates.addRow(buildRow(b.rate, RATES_COL_ORDER))
    rateRows++
    for (const p of b.photos) {
      photos.addRow(buildRow(p, PHOTOS_COL_ORDER))
      photoRows++
    }
    meeting.addRow(buildRow(b.meetingPoint, MEETING_POINTS_COL_ORDER))
    meetingPointRows++
  }

  await wb.xlsx.writeFile(opts.outputPath)

  return { productRows, pricingRows, rateRows, photoRows, meetingPointRows }
}
