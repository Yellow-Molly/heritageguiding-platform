/**
 * Parse Guides.xlsx, translate Swedish guide bios/certifications/specializations
 * to EN/DE via Claude API. Outputs data/translated-guides.json + review markdowns.
 *
 * Usage:
 *   npx tsx --require ./scripts/patch-next-env.cjs scripts/translate-guide-data.ts [--dry-run] [--guides=slug1,slug2]
 */
import ExcelJS from 'exceljs'
import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'

const DRY_RUN = process.argv.includes('--dry-run')
const GUIDES_FILTER = process.argv.find((a) => a.startsWith('--guides='))?.split('=')[1]?.split(',') || null
const XLSX_PATH = path.resolve(__dirname, '../docx/Guides.xlsx')
const OUTPUT_JSON = path.resolve(__dirname, '../data/translated-guides.json')
const REVIEW_DIR = path.resolve(__dirname, '../data/translations-review')

// ── Column positions (1-indexed) matching xlsx headers ──
const COL = { email: 1, name: 2, bio: 3, certifications: 4, telephone: 5, languages: 6, specializations: 7, operatingAreas: 8, additionalLanguages: 9 } as const

// ── Guide-to-Tour mapping ──
const GUIDE_TO_TOURS: Record<string, string[]> = {
  'sabine-gruen': ['private-medieval-stockholm-walking-tour'],
  'sophie-sahlin': ['gamla-stan-and-vasa-museum-private-walking-tour'],
  'anders-boysen': ['private-rib-tour-stockholm-3h'],
  'niklas-lofstrom': ['stockholm-islands-and-districts-private-overview-by-car-3-hour'],
  'christian-arnet': ['private-sigtuna-heritage-tour-from-stockholm', 'private-uppsala-day-tour-from-stockholm'],
  'olof-naslund': ['gamla-stan-and-stockholm-city-hall-private-walking-tour', 'stockholm-everyday-life-private-tour'],
  'annika-bernholm': ['slow-travel-malaren-classic-boat-stockholm', 'slow-travel-stockholm-archipelago-classic-boat'],
}

// ── Language mapping ──
const LANGUAGE_MAP: Record<string, string> = {
  svenska: 'sv', swedish: 'sv',
  engelska: 'en', english: 'en',
  tyska: 'de', german: 'de',
  franska: 'fr', french: 'fr',
  spanska: 'es', spanish: 'es',
  italienska: 'it', italian: 'it',
}

const ADDITIONAL_LANGUAGE_MAP: Record<string, string> = {
  japanska: 'ja', japanese: 'ja',
  norska: 'no', norwegian: 'no',
  danska: 'da', danish: 'da',
  finska: 'fi', finnish: 'fi',
  holländska: 'nl', dutch: 'nl',
  polska: 'pl', polish: 'pl',
  ryska: 'ru', russian: 'ru',
}

/** Get cell as trimmed string — handles hyperlinks and rich text */
function cell(row: ExcelJS.Row, col: number): string {
  const val = row.getCell(col).value
  if (val === null || val === undefined) return ''
  if (typeof val === 'object' && 'text' in val) return String((val as { text: string }).text).trim()
  if (typeof val === 'object' && 'hyperlink' in val) return String((val as { hyperlink: string }).hyperlink).trim()
  return String(val).trim()
}

/** Derive slug: simplified diacritics, first + last name only */
function toSlug(rawName: string): string {
  const name = rawName.trim()
  const parts = name.split(/\s+/).filter(Boolean)
  // Use first + last word only (handles "Olof Lars Alvar Näslund" → "olof-naslund")
  const first = parts[0] ?? ''
  const last = parts[parts.length - 1] ?? ''
  const combined = `${first} ${last}`.toLowerCase()
  return combined
    .replace(/[åä]/g, 'a').replace(/[öø]/g, 'o').replace(/[ü]/g, 'u')
    .replace(/[éè]/g, 'e').replace(/[ñ]/g, 'n')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

/** Parse comma-separated list */
function parseCommaList(raw: string): string[] {
  return raw.split(',').map((s) => s.trim()).filter(Boolean)
}

/** Parse semicolon-separated list */
function parseSemicolonList(raw: string): string[] {
  return raw.split(/[;\n]+/).map((s) => s.replace(/["\r]/g, '').trim()).filter(Boolean)
}

/** Map language strings to enum codes */
function mapLanguages(raw: string): { languages: string[]; additionalLanguages: string[] } {
  const languages: string[] = []
  const additionalLanguages: string[] = []
  const items = raw.toLowerCase().split(/[,;]+/).map((s) => s.trim()).filter(Boolean)
  for (const item of items) {
    if (LANGUAGE_MAP[item]) {
      languages.push(LANGUAGE_MAP[item])
    } else if (ADDITIONAL_LANGUAGE_MAP[item]) {
      additionalLanguages.push(ADDITIONAL_LANGUAGE_MAP[item])
    }
  }
  return { languages, additionalLanguages }
}

/** Parse a guide row — returns null on empty rows */
function parseGuideRow(row: ExcelJS.Row) {
  const rawName = cell(row, COL.name)
  if (!rawName) return null

  // Clean trailing junk from name (e.g. "Niklas Löfström e" → "Niklas Löfström")
  const name = rawName.replace(/\s+[a-z]$/, '').trim()
  const slug = toSlug(name)

  // Email may be a hyperlink cell with "mailto:" prefix
  const emailRaw = cell(row, COL.email)
  const email = emailRaw.replace(/^mailto:/i, '')

  const langRaw = cell(row, COL.languages)
  const addLangRaw = cell(row, COL.additionalLanguages)
  const allLangRaw = [langRaw, addLangRaw].filter(Boolean).join(',')
  const { languages, additionalLanguages } = mapLanguages(allLangRaw)

  return {
    slug,
    name,
    email,
    phone: cell(row, COL.telephone),
    sv: {
      bio: cell(row, COL.bio),
      certifications: parseCommaList(cell(row, COL.certifications)),
      specializations: parseCommaList(cell(row, COL.specializations)),
    },
    passThrough: {
      languages,
      additionalLanguages,
      operatingAreas: parseCommaList(cell(row, COL.operatingAreas)),
      tourSlugs: GUIDE_TO_TOURS[slug] ?? [],
    },
  }
}

// ── Translation via Claude API ──

const TRANSLATION_SYSTEM_PROMPT = `You are a professional tourism content translator. Translate Swedish guide bios, certifications, and specializations to both English and German.

Rules:
- Keep Swedish place names as-is: Stockholm, Gamla stan, Djurgården, Södermalm, etc.
- Keep organization abbreviations: FSAG, etc.
- Use professional tourism register — inviting, clear, informative
- For arrays: translate each item individually, return as JSON array
- For multi-paragraph bios: preserve paragraph structure
- Return valid JSON only, no markdown fences`

interface GuideTranslatable {
  bio: string
  certifications: string[]
  specializations: string[]
}

async function translateGuide(
  client: Anthropic,
  sv: GuideTranslatable,
): Promise<{ en: GuideTranslatable; de: GuideTranslatable }> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: TRANSLATION_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Translate the following Swedish guide content to both English and German. Return JSON with "en" and "de" keys, each containing: bio (string), certifications (array), specializations (array).

Swedish content:
${JSON.stringify(sv, null, 2)}

Return format:
{"en": {"bio": "...", "certifications": [...], "specializations": [...]}, "de": {"bio": "...", "certifications": [...], "specializations": [...]}}`,
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  try {
    const parsed = JSON.parse(jsonStr)
    if (!parsed.en || !parsed.de) throw new Error('Missing "en" or "de" keys in response')
    return parsed
  } catch (parseErr) {
    console.error(`    JSON parse failed. Raw (first 500 chars): ${jsonStr.substring(0, 500)}`)
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

/** Generate review markdown for a guide */
function generateReviewMarkdown(slug: string, sv: GuideTranslatable, en: GuideTranslatable, de: GuideTranslatable): string {
  let md = `# Translation Review: ${slug}\n\n`
  md += `## bio\n\n**SV:** ${sv.bio}\n\n**EN:** ${en.bio}\n\n**DE:** ${de.bio}\n\n---\n\n`
  md += `## certifications\n\n**SV:** ${sv.certifications.join(' | ')}\n\n**EN:** ${en.certifications.join(' | ')}\n\n**DE:** ${de.certifications.join(' | ')}\n\n---\n\n`
  md += `## specializations\n\n**SV:** ${sv.specializations.join(' | ')}\n\n**EN:** ${en.specializations.join(' | ')}\n\n**DE:** ${de.specializations.join(' | ')}\n\n---\n\n`
  return md
}

async function main() {
  console.log(`\n=== Guide Data Translation ${DRY_RUN ? '(DRY RUN)' : ''} ===\n`)

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(XLSX_PATH)
  const worksheet = workbook.worksheets[0]
  if (!worksheet) throw new Error('No worksheet found in Guides.xlsx')

  const guides: NonNullable<ReturnType<typeof parseGuideRow>>[] = []
  worksheet.eachRow((row, num) => {
    if (num === 1) return // skip header
    const guide = parseGuideRow(row)
    if (!guide) return
    if (GUIDES_FILTER && !GUIDES_FILTER.includes(guide.slug)) return
    guides.push(guide)
  })

  console.log(`Parsed ${guides.length} guides from xlsx`)

  if (DRY_RUN) {
    for (const g of guides) {
      console.log(`\n  ${g.slug}:`)
      console.log(`    name: ${g.name}`)
      console.log(`    email: ${g.email}`)
      console.log(`    bio: ${g.sv.bio.substring(0, 60)}...`)
      console.log(`    certifications: ${g.sv.certifications.length} items`)
      console.log(`    specializations: ${g.sv.specializations.length} items`)
      console.log(`    languages: ${g.passThrough.languages.join(', ')}`)
      console.log(`    tours: ${g.passThrough.tourSlugs.join(', ')}`)
    }
    console.log('\n[DRY RUN] Would translate the above. Exiting.')
    process.exit(0)
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY env var not set')
    process.exit(1)
  }

  const client = new Anthropic()
  const results: Array<{
    slug: string; name: string; email: string; phone: string
    sv: GuideTranslatable; en: GuideTranslatable; de: GuideTranslatable
    passThrough: NonNullable<ReturnType<typeof parseGuideRow>>['passThrough']
  }> = []

  for (let i = 0; i < guides.length; i++) {
    const guide = guides[i]
    console.log(`\n[${i + 1}/${guides.length}] Translating: ${guide.slug}`)

    const { en, de } = await withRetry(() => translateGuide(client, guide.sv))
    console.log(`  Translated bio + ${guide.sv.certifications.length} certifications + ${guide.sv.specializations.length} specializations`)

    results.push({ slug: guide.slug, name: guide.name, email: guide.email, phone: guide.phone, sv: guide.sv, en, de, passThrough: guide.passThrough })
  }

  fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true })
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(results, null, 2))
  console.log(`\nTranslations written to: ${OUTPUT_JSON}`)

  fs.mkdirSync(REVIEW_DIR, { recursive: true })
  for (const r of results) {
    fs.writeFileSync(path.join(REVIEW_DIR, `guide-${r.slug}.md`), generateReviewMarkdown(r.slug, r.sv, r.en, r.de))
  }
  console.log(`Review files written to: ${REVIEW_DIR}/`)

  console.log('\n=== Summary ===')
  console.log(`Guides translated: ${results.length}`)
  console.log(`Output: ${OUTPUT_JSON}`)
  process.exit(0)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
