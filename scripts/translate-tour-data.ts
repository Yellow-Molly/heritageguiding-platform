/**
 * Phase 2: Parse xlsx and translate Swedish tour data to EN/DE via Claude API
 * Outputs data/translated-tours.json and data/translations-review/{slug}.md
 *
 * Usage:
 *   npx tsx --require ./scripts/patch-next-env.cjs scripts/translate-tour-data.ts [--dry-run] [--tours=slug1,slug2]
 */
import ExcelJS from 'exceljs'
import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'

const DRY_RUN = process.argv.includes('--dry-run')
const TOURS_FILTER = process.argv.find((a) => a.startsWith('--tours='))?.split('=')[1]?.split(',') || null
const XLSX_PATH = path.resolve(__dirname, '../docx/Tour-data.xlsx')
const OUTPUT_JSON = path.resolve(__dirname, '../data/translated-tours.json')
const REVIEW_DIR = path.resolve(__dirname, '../data/translations-review')

// ── Column positions (1-indexed) matching xlsx headers ──
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
  // 36-40: image URLs (ignored)
  bokunExperienceId: 41,
  availability: 42,
  maxGroupSize: 43,
  minGroupSize: 44,
  featured: 45,
  status: 46,
} as const

// Fields that need SV->EN/DE translation
const TRANSLATABLE_FIELDS = [
  'title', 'shortDescription', 'description', 'highlights',
  'durationText', 'meetingPointName', 'meetingInstructions',
  'endingPoint', 'parkingInfo', 'publicTransportInfo',
  'included', 'notIncluded', 'whatToBring', 'mobilityNotes',
] as const

// meetingPointAddress intentionally excluded — addresses stay in Swedish

/** Get cell as trimmed string */
function cell(row: ExcelJS.Row, col: number): string {
  const val = row.getCell(col).value
  if (val === null || val === undefined) return ''
  // Handle hyperlinks / rich text objects
  if (typeof val === 'object' && 'text' in val) return String((val as { text: string }).text).trim()
  if (typeof val === 'object' && 'hyperlink' in val) return String((val as { hyperlink: string }).hyperlink).trim()
  return String(val).trim()
}

/** Parse semicolon-separated list */
function parseSemicolonList(raw: string): string[] {
  return raw.split(/[;\n]+/).map((s) => s.replace(/["\r]/g, '').trim()).filter(Boolean)
}

/** Parse boolean from various Swedish/English formats */
function parseBool(raw: string): boolean {
  return ['yes', 'ja', 'true', '1'].includes(raw.toLowerCase())
}

/** Parse a number, returning null if invalid */
function parseNum(raw: string): number | null {
  // Handle "120 cm" -> 120
  const match = raw.match(/^(\d+(?:\.\d+)?)/)
  return match ? parseFloat(match[1]) : null
}

/** Normalize priceType to schema values */
function normalizePriceType(raw: string): string {
  const lower = raw.toLowerCase()
  if (lower.includes('person')) return 'per_person'
  if (lower.includes('group')) return 'per_group'
  // "Per boat", "Per tour", "Per tur" -> per_group
  return 'per_group'
}

/** Parse duration hours from Swedish text like "3 timmar" */
function parseDurationHours(raw: string): number {
  const match = raw.match(/(\d+(?:[.,]\d+)?)/)
  return match ? parseFloat(match[1].replace(',', '.')) : 0
}

/** Parse coordinates from "lat, lng" string to [lng, lat] GeoJSON */
function parseCoordinates(raw: string): [number, number] | null {
  const match = raw.match(/([\d.]+)\s*,\s*([\d.]+)/)
  if (!match) return null
  const lat = parseFloat(match[1])
  const lng = parseFloat(match[2])
  return [lng, lat]
}

/** Parse a single tour row from xlsx */
function parseTourRow(row: ExcelJS.Row) {
  const slug = cell(row, COL.slug)
  if (!slug) return null

  return {
    slug,
    // Swedish text fields (to be translated)
    sv: {
      title: cell(row, COL.title),
      shortDescription: cell(row, COL.shortDescription),
      description: cell(row, COL.description),
      highlights: parseSemicolonList(cell(row, COL.highlights)),
      durationText: cell(row, COL.durationText),
      meetingPointName: cell(row, COL.meetingPointName),
      meetingPointAddress: cell(row, COL.meetingPointAddress),
      meetingInstructions: cell(row, COL.meetingInstructions),
      endingPoint: cell(row, COL.endingPoint),
      parkingInfo: cell(row, COL.parkingInfo),
      publicTransportInfo: cell(row, COL.publicTransportInfo),
      included: parseSemicolonList(cell(row, COL.included)),
      notIncluded: parseSemicolonList(cell(row, COL.notIncluded)),
      whatToBring: parseSemicolonList(cell(row, COL.whatToBring)),
      mobilityNotes: cell(row, COL.mobilityNotes),
    },
    // Pass-through fields (no translation needed)
    passThrough: {
      basePrice: parseNum(cell(row, COL.basePrice)),
      currency: cell(row, COL.currency) || 'SEK',
      priceType: normalizePriceType(cell(row, COL.priceType)),
      groupDiscount: parseBool(cell(row, COL.groupDiscount)),
      childPrice: parseNum(cell(row, COL.childPrice)),
      durationHours: parseDurationHours(cell(row, COL.durationText)),
      meetingPointAddress: cell(row, COL.meetingPointAddress),
      coordinates: parseCoordinates(cell(row, COL.coordinates)),
      googleMapsLink: cell(row, COL.googleMapsLink),
      targetAudience: parseSemicolonList(cell(row, COL.targetAudience)),
      difficultyLevel: cell(row, COL.difficultyLevel).toLowerCase() || 'easy',
      minimumAge: parseNum(cell(row, COL.minimumAge)),
      childFriendly: parseBool(cell(row, COL.childFriendly)),
      teenFriendly: parseBool(cell(row, COL.teenFriendly)),
      wheelchairAccessible: parseBool(cell(row, COL.wheelchairAccessible)),
      hearingAssistance: parseBool(cell(row, COL.hearingAssistance)),
      visualAssistance: parseBool(cell(row, COL.visualAssistance)),
      serviceAnimalsAllowed: parseBool(cell(row, COL.serviceAnimalsAllowed)),
      guideSlug: cell(row, COL.guideSlug).replace(/["\r\n]/g, '').trim(),
      categorySlugs: parseSemicolonList(cell(row, COL.categorySlugs)),
      neighborhoodSlugs: parseSemicolonList(cell(row, COL.neighborhoodSlugs)),
      bokunExperienceId: cell(row, COL.bokunExperienceId) || null,
      availability: cell(row, COL.availability) || 'available',
      maxGroupSize: parseNum(cell(row, COL.maxGroupSize)),
      minGroupSize: parseNum(cell(row, COL.minGroupSize)) || 1,
      featured: parseBool(cell(row, COL.featured)),
    },
  }
}

// ── Translation via Claude API ──

const TRANSLATION_SYSTEM_PROMPT = `You are a professional tourism content translator. Translate Swedish tour descriptions to both English and German.

Rules:
- Keep Swedish place names as-is: Gamla Stan, Stortorget, Djurgården, Kungsträdgården, Södermalm, Östermalm, Norrmalm, Kungsholmen, Riddarholmen, Sigtuna, Uppsala, Vaxholm, Fjäderholmarna
- Keep Swedish street names and addresses as-is (Strandvägen, Kajplats, etc.)
- Keep brand/museum names in their common English form: Vasa Museum, Nobel Prize Museum, Royal Palace
- Use professional tourism register — inviting, clear, informative
- For arrays: translate each item individually, return as JSON array
- For multi-paragraph descriptions: preserve paragraph structure (separate with \\n\\n)
- Return valid JSON only, no markdown fences`

async function translateTour(
  client: Anthropic,
  svFields: Record<string, string | string[]>,
): Promise<{ en: Record<string, string | string[]>; de: Record<string, string | string[]> }> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: TRANSLATION_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Translate the following Swedish tour content to both English and German. Return JSON with "en" and "de" keys, each containing the same field names with translated values. Array fields must remain arrays.

Swedish content:
${JSON.stringify(svFields, null, 2)}

Return format:
{"en": {...translated fields...}, "de": {...translated fields...}}`,
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  // Parse JSON, strip any markdown fences
  const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  try {
    const parsed = JSON.parse(jsonStr)
    if (!parsed.en || !parsed.de) throw new Error('Missing "en" or "de" keys in response')
    return parsed
  } catch (parseErr) {
    console.error(`    JSON parse failed. Raw response (first 500 chars): ${jsonStr.substring(0, 500)}`)
    throw parseErr
  }
}

/** Retry wrapper with exponential backoff */
async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (err) {
      if (i === retries - 1) throw err
      const delay = Math.pow(2, i + 1) * 1000
      console.log(`    Retry in ${delay / 1000}s...`, err instanceof Error ? err.message : '')
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  throw new Error('Unreachable')
}

/** Generate review markdown for a tour */
function generateReviewMarkdown(
  slug: string,
  sv: Record<string, string | string[]>,
  en: Record<string, string | string[]>,
  de: Record<string, string | string[]>,
): string {
  let md = `# Translation Review: ${slug}\n\n`
  for (const key of Object.keys(sv)) {
    md += `## ${key}\n\n`
    md += `**SV:** ${Array.isArray(sv[key]) ? (sv[key] as string[]).join(' | ') : sv[key]}\n\n`
    md += `**EN:** ${Array.isArray(en[key]) ? (en[key] as string[]).join(' | ') : en[key]}\n\n`
    md += `**DE:** ${Array.isArray(de[key]) ? (de[key] as string[]).join(' | ') : de[key]}\n\n---\n\n`
  }
  return md
}

async function main() {
  console.log(`\n=== Phase 2: Tour Data Translation ${DRY_RUN ? '(DRY RUN)' : ''} ===\n`)

  // Parse xlsx
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(XLSX_PATH)
  const worksheet = workbook.worksheets[0]
  if (!worksheet) throw new Error('No worksheet found')

  // Parse all tours
  const tours: ReturnType<typeof parseTourRow>[] = []
  worksheet.eachRow((row, num) => {
    if (num === 1) return
    const tour = parseTourRow(row)
    if (tour) {
      if (TOURS_FILTER && !TOURS_FILTER.includes(tour.slug)) return
      tours.push(tour)
    }
  })

  console.log(`Parsed ${tours.length} tours from xlsx`)

  if (DRY_RUN) {
    for (const tour of tours) {
      if (!tour) continue
      console.log(`\n  ${tour.slug}:`)
      console.log(`    title: ${tour.sv.title.substring(0, 60)}...`)
      console.log(`    highlights: ${tour.sv.highlights.length} items`)
      console.log(`    guide: ${tour.passThrough.guideSlug}`)
      console.log(`    categories: ${tour.passThrough.categorySlugs.join(', ')}`)
      console.log(`    neighborhoods: ${tour.passThrough.neighborhoodSlugs.join(', ')}`)
    }
    console.log('\n[DRY RUN] Would translate the above. Exiting.')
    process.exit(0)
  }

  // Validate API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY env var not set')
    process.exit(1)
  }

  const client = new Anthropic()
  const results: Array<{
    slug: string
    sv: Record<string, string | string[]>
    en: Record<string, string | string[]>
    de: Record<string, string | string[]>
    passThrough: Record<string, unknown>
  }> = []

  // Translate each tour
  for (let i = 0; i < tours.length; i++) {
    const tour = tours[i]
    if (!tour) continue

    console.log(`\n[${i + 1}/${tours.length}] Translating: ${tour.slug}`)

    // Build translatable fields object (only non-empty)
    const svFields: Record<string, string | string[]> = {}
    for (const field of TRANSLATABLE_FIELDS) {
      const val = tour.sv[field as keyof typeof tour.sv]
      if (val && (typeof val === 'string' ? val.length > 0 : val.length > 0)) {
        svFields[field] = val
      }
    }

    const { en, de } = await withRetry(() => translateTour(client, svFields))
    console.log(`  ✓ Translated ${Object.keys(svFields).length} fields to EN + DE`)

    results.push({
      slug: tour.slug,
      sv: svFields,
      en,
      de,
      passThrough: tour.passThrough,
    })
  }

  // Write output JSON
  fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true })
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(results, null, 2))
  console.log(`\nTranslations written to: ${OUTPUT_JSON}`)

  // Write review markdown files
  fs.mkdirSync(REVIEW_DIR, { recursive: true })
  for (const r of results) {
    const md = generateReviewMarkdown(r.slug, r.sv, r.en, r.de)
    fs.writeFileSync(path.join(REVIEW_DIR, `${r.slug}.md`), md)
  }
  console.log(`Review files written to: ${REVIEW_DIR}/`)

  console.log('\n=== Summary ===')
  console.log(`Tours translated: ${results.length}`)
  console.log(`Output: ${OUTPUT_JSON}`)

  process.exit(0)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
