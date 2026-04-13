/**
 * Diff Tour Data V1 vs V2 — extract changed fields per tour
 * Compares cell-by-cell, classifies content vs format-only changes,
 * outputs data/tour-v2-diff.json with delta per tour.
 *
 * Usage:
 *   npx tsx scripts/diff-tour-data-v2.ts [--dry-run]
 */
import ExcelJS from 'exceljs'
import fs from 'fs'
import path from 'path'

const DRY_RUN = process.argv.includes('--dry-run')
const V1_PATH = path.resolve(__dirname, '../docx/Tour-data.xlsx')
const V2_PATH = path.resolve(__dirname, '../docx/Tour-data-v2.xlsx')
const OUTPUT_JSON = path.resolve(__dirname, '../data/tour-v2-diff.json')

// Column positions (1-indexed) — same as translate-tour-data.ts
const COL = {
  slug: 1,
  title: 2,
  shortDescription: 3,
  description: 4,
  highlights: 5,
  basePrice: 6,
  currency: 7,
  priceType: 8,
  groupDiscount: 9,
  childPrice: 10,
  durationText: 11,
  meetingPointName: 12,
  meetingPointAddress: 13,
  coordinates: 14,
  googleMapsLink: 15,
  meetingInstructions: 16,
  endingPoint: 17,
  parkingInfo: 18,
  publicTransportInfo: 19,
  included: 20,
  notIncluded: 21,
  whatToBring: 22,
  targetAudience: 23,
  difficultyLevel: 24,
  minimumAge: 25,
  childFriendly: 26,
  teenFriendly: 27,
  wheelchairAccessible: 28,
  mobilityNotes: 29,
  hearingAssistance: 30,
  visualAssistance: 31,
  serviceAnimalsAllowed: 32,
  guideSlug: 33,
  categorySlugs: 34,
  neighborhoodSlugs: 35,
  bokunExperienceId: 41,
  availability: 42,
  maxGroupSize: 43,
  minGroupSize: 44,
  featured: 45,
  status: 46,
} as const

// Fields that need SV->EN/DE translation when changed
const TRANSLATABLE_FIELDS = new Set([
  'title', 'shortDescription', 'description', 'highlights',
  'durationText', 'meetingPointName', 'meetingInstructions',
  'endingPoint', 'parkingInfo', 'publicTransportInfo',
  'included', 'notIncluded', 'whatToBring', 'mobilityNotes',
])

// Fields that pass through without translation
const PASS_THROUGH_FIELDS = new Set([
  'basePrice', 'targetAudience', 'featured',
  'categorySlugs', 'neighborhoodSlugs', 'meetingPointAddress',
])

// List-type fields (semicolons or bullets)
const LIST_FIELDS = new Set([
  'highlights', 'included', 'notIncluded', 'whatToBring',
  'targetAudience', 'categorySlugs', 'neighborhoodSlugs',
])

// All fields we care about for diffing (column name -> COL key)
const DIFF_FIELDS: Array<{ name: string; col: number }> = [
  { name: 'title', col: COL.title },
  { name: 'shortDescription', col: COL.shortDescription },
  { name: 'description', col: COL.description },
  { name: 'highlights', col: COL.highlights },
  { name: 'basePrice', col: COL.basePrice },
  { name: 'durationText', col: COL.durationText },
  { name: 'meetingPointName', col: COL.meetingPointName },
  { name: 'meetingPointAddress', col: COL.meetingPointAddress },
  { name: 'meetingInstructions', col: COL.meetingInstructions },
  { name: 'endingPoint', col: COL.endingPoint },
  { name: 'parkingInfo', col: COL.parkingInfo },
  { name: 'publicTransportInfo', col: COL.publicTransportInfo },
  { name: 'included', col: COL.included },
  { name: 'notIncluded', col: COL.notIncluded },
  { name: 'whatToBring', col: COL.whatToBring },
  { name: 'targetAudience', col: COL.targetAudience },
  { name: 'mobilityNotes', col: COL.mobilityNotes },
  { name: 'featured', col: COL.featured },
  { name: 'categorySlugs', col: COL.categorySlugs },
  { name: 'neighborhoodSlugs', col: COL.neighborhoodSlugs },
]

/** Get cell as trimmed string */
function cell(row: ExcelJS.Row, col: number): string {
  const val = row.getCell(col).value
  if (val === null || val === undefined) return ''
  if (typeof val === 'object' && 'richText' in val)
    return (val as { richText: { text: string }[] }).richText.map((r) => r.text).join('').trim()
  if (typeof val === 'object' && 'text' in val) return String((val as { text: string }).text).trim()
  if (typeof val === 'object' && 'hyperlink' in val) return String((val as { hyperlink: string }).hyperlink).trim()
  return String(val).trim()
}

/** Parse list from various formats: bullets, semicolons, commas */
function parseList(raw: string): string[] {
  if (!raw) return []
  // Handle bullet format (• item\n• item)
  if (raw.includes('•')) {
    return raw.split('•').map((s) => s.trim()).filter(Boolean)
  }
  // Original semicolon/newline format
  return raw.split(/[;\n]+/).map((s) => s.replace(/["\r]/g, '').trim()).filter(Boolean)
}

/** Normalize text for comparison — strips formatting differences */
function normalize(s: string): string {
  return s
    .replace(/[•""„"«»]/g, '')
    .replace(/;/g, ',')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

/** Parse boolean from various formats */
function parseBool(raw: string): boolean {
  return ['yes', 'ja', 'true', '1'].includes(raw.toLowerCase())
}

/** Parse number, stripping spaces */
function parseNum(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, '')
  const match = cleaned.match(/^(\d+(?:\.\d+)?)/)
  return match ? parseFloat(match[1]) : null
}

interface TourDiff {
  slug: string
  changedTranslatable: Record<string, string | string[]>
  changedPassThrough: Record<string, string | string[] | boolean | number | null>
  changeCount: number
  formatOnlyCount: number
  changes: Array<{ field: string; type: 'content' | 'format-only'; v1Preview: string; v2Preview: string }>
}

async function main() {
  console.log(`\n=== Tour Data V1 vs V2 Diff ${DRY_RUN ? '(DRY RUN)' : ''} ===\n`)

  // Load both workbooks
  const wb1 = new ExcelJS.Workbook()
  const wb2 = new ExcelJS.Workbook()
  await wb1.xlsx.readFile(V1_PATH)
  await wb2.xlsx.readFile(V2_PATH)

  const ws1 = wb1.worksheets[0]
  const ws2 = wb2.worksheets[0]
  if (!ws1 || !ws2) throw new Error('Missing worksheet in one or both files')

  // Collect rows by slug
  const v1Rows = new Map<string, ExcelJS.Row>()
  const v2Rows = new Map<string, ExcelJS.Row>()

  ws1.eachRow((row, num) => {
    if (num === 1) return
    const slug = cell(row, COL.slug)
    if (slug) v1Rows.set(slug, row)
  })

  ws2.eachRow((row, num) => {
    if (num === 1) return
    const slug = cell(row, COL.slug)
    if (slug) v2Rows.set(slug, row)
  })

  console.log(`V1: ${v1Rows.size} tours | V2: ${v2Rows.size} tours`)

  // Validate same slugs
  const v1Slugs = [...v1Rows.keys()].sort()
  const v2Slugs = [...v2Rows.keys()].sort()
  if (JSON.stringify(v1Slugs) !== JSON.stringify(v2Slugs)) {
    console.warn('WARNING: Slug mismatch between v1 and v2!')
    const added = v2Slugs.filter((s) => !v1Rows.has(s))
    const removed = v1Slugs.filter((s) => !v2Rows.has(s))
    if (added.length) console.warn(`  Added in v2: ${added.join(', ')}`)
    if (removed.length) console.warn(`  Removed in v2: ${removed.join(', ')}`)
  }

  // Compare cell-by-cell
  const diffs: TourDiff[] = []
  let totalChanges = 0
  let totalFormatOnly = 0

  for (const slug of v2Slugs) {
    const row1 = v1Rows.get(slug)
    const row2 = v2Rows.get(slug)!
    if (!row1) {
      console.log(`  ${slug}: NEW tour in v2 (skipping diff)`)
      continue
    }

    const tourDiff: TourDiff = {
      slug,
      changedTranslatable: {},
      changedPassThrough: {},
      changeCount: 0,
      formatOnlyCount: 0,
      changes: [],
    }

    for (const { name, col } of DIFF_FIELDS) {
      const raw1 = cell(row1, col)
      const raw2 = cell(row2, col)

      // Quick identical check
      if (raw1 === raw2) continue

      // Normalized comparison
      const norm1 = normalize(raw1)
      const norm2 = normalize(raw2)
      const isFormatOnly = norm1 === norm2

      if (isFormatOnly) {
        tourDiff.formatOnlyCount++
      }
      tourDiff.changeCount++

      const v1Preview = raw1.substring(0, 60).replace(/\n/g, '\\n')
      const v2Preview = raw2.substring(0, 60).replace(/\n/g, '\\n')
      tourDiff.changes.push({
        field: name,
        type: isFormatOnly ? 'format-only' : 'content',
        v1Preview,
        v2Preview,
      })

      // Extract v2 value into appropriate bucket
      if (TRANSLATABLE_FIELDS.has(name)) {
        // For list fields, parse into array
        if (LIST_FIELDS.has(name)) {
          tourDiff.changedTranslatable[name] = parseList(raw2)
        } else {
          tourDiff.changedTranslatable[name] = raw2
        }
      } else if (PASS_THROUGH_FIELDS.has(name)) {
        if (name === 'featured') {
          tourDiff.changedPassThrough[name] = parseBool(raw2)
        } else if (name === 'basePrice') {
          tourDiff.changedPassThrough[name] = parseNum(raw2)
        } else if (LIST_FIELDS.has(name)) {
          tourDiff.changedPassThrough[name] = parseList(raw2)
        } else {
          tourDiff.changedPassThrough[name] = raw2
        }
      }
    }

    if (tourDiff.changeCount > 0) {
      diffs.push(tourDiff)
      totalChanges += tourDiff.changeCount
      totalFormatOnly += tourDiff.formatOnlyCount
    }
  }

  // Print summary
  console.log(`\n=== Diff Summary ===`)
  console.log(`Tours with changes: ${diffs.length}`)
  console.log(`Total cell changes: ${totalChanges}`)
  console.log(`  Content changes: ${totalChanges - totalFormatOnly}`)
  console.log(`  Format-only changes: ${totalFormatOnly}`)

  for (const d of diffs) {
    console.log(`\n  ${d.slug}: ${d.changeCount} changes (${d.formatOnlyCount} format-only)`)
    for (const c of d.changes) {
      const tag = c.type === 'format-only' ? '[FMT]' : '[CHG]'
      console.log(`    ${tag} ${c.field}: "${c.v1Preview}" → "${c.v2Preview}"`)
    }
  }

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Would write diff to:', OUTPUT_JSON)
    process.exit(0)
  }

  // Write output (strip verbose changes array for the JSON output)
  const output = diffs.map(({ slug, changedTranslatable, changedPassThrough, changeCount, formatOnlyCount }) => ({
    slug,
    changedTranslatable,
    changedPassThrough,
    changeCount,
    formatOnlyCount,
  }))

  fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true })
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(output, null, 2))
  console.log(`\nDiff written to: ${OUTPUT_JSON}`)

  process.exit(0)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
