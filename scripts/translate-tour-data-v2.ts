/**
 * Phase 2: Translate only changed Swedish fields (delta) to EN/DE via Claude API
 * Merges with v1 translations to produce complete updated translated-tours-v2.json
 *
 * Usage:
 *   npx tsx --require ./scripts/patch-next-env.cjs scripts/translate-tour-data-v2.ts [--dry-run] [--tours=slug1,slug2]
 */
import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'

const DRY_RUN = process.argv.includes('--dry-run')
const RESUME = process.argv.includes('--resume')
const TOURS_FILTER = process.argv.find((a) => a.startsWith('--tours='))?.split('=')[1]?.split(',') || null

const DIFF_JSON = path.resolve(__dirname, '../data/tour-v2-diff.json')
const V1_JSON = path.resolve(__dirname, '../data/translated-tours.json')
const OUTPUT_JSON = path.resolve(__dirname, '../data/translated-tours-v2.json')
const PROGRESS_JSON = path.resolve(__dirname, '../data/translated-tours-v2-progress.json')
const REVIEW_DIR = path.resolve(__dirname, '../data/translations-review-v2')

// ── Types ──

interface TourDiffEntry {
  slug: string
  changedTranslatable: Record<string, string | string[]>
  changedPassThrough: Record<string, string | string[] | boolean | number | null>
  changeCount: number
  formatOnlyCount: number
}

interface V1TourEntry {
  slug: string
  sv: Record<string, string | string[]>
  en: Record<string, string | string[]>
  de: Record<string, string | string[]>
  passThrough: Record<string, unknown>
}

// ── Translation (reused from translate-tour-data.ts) ──

const TRANSLATION_SYSTEM_PROMPT = `You are a professional tourism content translator. Translate Swedish tour descriptions to both English and German.

Rules:
- Keep Swedish place names as-is: Gamla Stan, Stortorget, Djurgården, Kungsträdgården, Södermalm, Östermalm, Norrmalm, Kungsholmen, Riddarholmen, Sigtuna, Uppsala, Vaxholm, Fjäderholmarna
- Keep Swedish street names and addresses as-is (Strandvägen, Kajplats, etc.)
- Keep brand/museum names in their common English form: Vasa Museum, Nobel Prize Museum, Royal Palace
- Use professional tourism register — inviting, clear, informative
- For arrays: translate each item individually, return as JSON array
- For multi-paragraph descriptions: preserve paragraph structure (separate with \\n\\n)
- Return valid JSON only, no markdown fences`

async function translateFields(
  client: Anthropic,
  slug: string,
  title: string,
  svFields: Record<string, string | string[]>,
): Promise<{ en: Record<string, string | string[]>; de: Record<string, string | string[]> }> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: TRANSLATION_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `You are updating translations for an existing tour. The following Swedish fields have been revised. Translate each to English and German, maintaining consistency with the tour's theme.

Tour: ${slug} - ${title}

Swedish content to translate:
${JSON.stringify(svFields, null, 2)}

Return format:
{"en": {...translated fields...}, "de": {...translated fields...}}`,
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  // Extract JSON object — handle markdown fences and surrounding text
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    console.error(`    No JSON object found. Raw (first 500 chars): ${text.substring(0, 500)}`)
    throw new Error('No JSON object found in translation response')
  }
  try {
    const parsed = JSON.parse(jsonMatch[0])
    if (!parsed.en || !parsed.de) throw new Error('Missing "en" or "de" keys in response')
    return parsed
  } catch (parseErr) {
    console.error(`    JSON parse failed. Raw (first 500 chars): ${jsonMatch[0].substring(0, 500)}`)
    throw parseErr
  }
}

/** Retry wrapper with exponential backoff (longer delays for overloaded API) */
async function withRetry<T>(fn: () => Promise<T>, retries = 6): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (err) {
      if (i === retries - 1) throw err
      // Start at 5s, then 10s, 20s, 40s, 80s for overloaded API
      const delay = Math.pow(2, i) * 5000
      console.log(`    Retry ${i + 1}/${retries - 1} in ${delay / 1000}s...`, err instanceof Error ? err.message : '')
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  throw new Error('Unreachable')
}

/** Generate review markdown for changed fields only */
function generateReviewMarkdown(
  slug: string,
  changedFields: string[],
  sv: Record<string, string | string[]>,
  en: Record<string, string | string[]>,
  de: Record<string, string | string[]>,
): string {
  let md = `# Translation Review (V2 Delta): ${slug}\n\n`
  md += `Changed fields: ${changedFields.length}\n\n`
  for (const key of changedFields) {
    md += `## ${key}\n\n`
    md += `**SV:** ${Array.isArray(sv[key]) ? (sv[key] as string[]).join(' | ') : sv[key]}\n\n`
    md += `**EN:** ${Array.isArray(en[key]) ? (en[key] as string[]).join(' | ') : en[key]}\n\n`
    md += `**DE:** ${Array.isArray(de[key]) ? (de[key] as string[]).join(' | ') : de[key]}\n\n---\n\n`
  }
  return md
}

async function main() {
  console.log(`\n=== Phase 2: Delta Translation ${DRY_RUN ? '(DRY RUN)' : ''} ===\n`)

  // Load inputs
  if (!fs.existsSync(DIFF_JSON)) {
    console.error(`Error: ${DIFF_JSON} not found. Run Phase 1 (diff) first.`)
    process.exit(1)
  }
  if (!fs.existsSync(V1_JSON)) {
    console.error(`Error: ${V1_JSON} not found.`)
    process.exit(1)
  }

  const diffs: TourDiffEntry[] = JSON.parse(fs.readFileSync(DIFF_JSON, 'utf-8'))
  const v1Tours: V1TourEntry[] = JSON.parse(fs.readFileSync(V1_JSON, 'utf-8'))
  const v1Map = new Map(v1Tours.map((t) => [t.slug, t]))

  console.log(`Diff entries: ${diffs.length} | V1 baseline tours: ${v1Tours.length}`)

  // Filter if needed
  const toProcess = TOURS_FILTER
    ? diffs.filter((d) => TOURS_FILTER.includes(d.slug))
    : diffs

  if (DRY_RUN) {
    let totalFields = 0
    for (const diff of toProcess) {
      const fields = Object.keys(diff.changedTranslatable)
      totalFields += fields.length
      console.log(`\n  ${diff.slug}: ${fields.length} translatable fields to translate`)
      for (const f of fields) {
        const val = diff.changedTranslatable[f]
        const preview = Array.isArray(val) ? `[${val.length} items]` : String(val).substring(0, 50)
        console.log(`    ${f}: ${preview}`)
      }
      if (Object.keys(diff.changedPassThrough).length > 0) {
        console.log(`    + ${Object.keys(diff.changedPassThrough).length} pass-through fields`)
      }
    }
    console.log(`\n[DRY RUN] Would translate ${totalFields} fields across ${toProcess.length} tours. Exiting.`)
    process.exit(0)
  }

  // Validate API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY env var not set')
    process.exit(1)
  }

  const client = new Anthropic()

  // Load progress from previous interrupted run if --resume
  const completedSlugs = new Map<string, V1TourEntry>()
  if (RESUME && fs.existsSync(PROGRESS_JSON)) {
    const progress: V1TourEntry[] = JSON.parse(fs.readFileSync(PROGRESS_JSON, 'utf-8'))
    for (const p of progress) completedSlugs.set(p.slug, p)
    console.log(`Resuming: ${completedSlugs.size} tours already translated`)
  }

  const results: V1TourEntry[] = [...completedSlugs.values()]

  for (let i = 0; i < toProcess.length; i++) {
    const diff = toProcess[i]

    // Skip already completed tours on resume
    if (completedSlugs.has(diff.slug)) {
      console.log(`\n[${i + 1}/${toProcess.length}] ${diff.slug} — already done (resume)`)
      continue
    }

    const v1 = v1Map.get(diff.slug)
    if (!v1) {
      console.error(`  ! No v1 baseline for "${diff.slug}" — SKIPPING`)
      continue
    }

    console.log(`\n[${i + 1}/${toProcess.length}] ${diff.slug}`)

    // Start with v1 data as baseline
    const merged: V1TourEntry = {
      slug: diff.slug,
      sv: { ...v1.sv },
      en: { ...v1.en },
      de: { ...v1.de },
      passThrough: { ...v1.passThrough },
    }

    // Update SV fields from delta
    for (const [field, value] of Object.entries(diff.changedTranslatable)) {
      merged.sv[field] = value
    }

    // Translate changed translatable fields
    const translatableFields = diff.changedTranslatable
    if (Object.keys(translatableFields).length > 0) {
      const title = (translatableFields.title as string) || (merged.sv.title as string)
      const { en, de } = await withRetry(() => translateFields(client, diff.slug, title, translatableFields))

      // Merge new translations
      for (const field of Object.keys(translatableFields)) {
        if (en[field] !== undefined) merged.en[field] = en[field]
        if (de[field] !== undefined) merged.de[field] = de[field]
      }
      console.log(`  ✓ Translated ${Object.keys(translatableFields).length} fields to EN + DE`)
    }

    // Update pass-through fields
    for (const [field, value] of Object.entries(diff.changedPassThrough)) {
      merged.passThrough[field] = value
    }
    if (Object.keys(diff.changedPassThrough).length > 0) {
      console.log(`  ✓ Updated ${Object.keys(diff.changedPassThrough).length} pass-through fields`)
    }

    results.push(merged)

    // Save incremental progress after each tour
    fs.mkdirSync(path.dirname(PROGRESS_JSON), { recursive: true })
    fs.writeFileSync(PROGRESS_JSON, JSON.stringify(results, null, 2))
  }

  // Include unchanged tours from v1 baseline
  for (const v1 of v1Tours) {
    if (!results.find((r) => r.slug === v1.slug)) {
      results.push(v1)
    }
  }

  // Sort by original v1 order
  const slugOrder = v1Tours.map((t) => t.slug)
  results.sort((a, b) => slugOrder.indexOf(a.slug) - slugOrder.indexOf(b.slug))

  // Write output
  fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true })
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(results, null, 2))
  console.log(`\nTranslations written to: ${OUTPUT_JSON}`)

  // Write review markdown files (only for changed tours)
  fs.mkdirSync(REVIEW_DIR, { recursive: true })
  for (const diff of toProcess) {
    const merged = results.find((r) => r.slug === diff.slug)
    if (!merged) continue
    const changedFields = Object.keys(diff.changedTranslatable)
    const md = generateReviewMarkdown(diff.slug, changedFields, merged.sv, merged.en, merged.de)
    fs.writeFileSync(path.join(REVIEW_DIR, `${diff.slug}.md`), md)
  }
  console.log(`Review files written to: ${REVIEW_DIR}/`)

  // Clean up progress file on success
  if (fs.existsSync(PROGRESS_JSON)) fs.unlinkSync(PROGRESS_JSON)

  console.log('\n=== Summary ===')
  console.log(`Tours processed: ${toProcess.length}`)
  console.log(`Total tours in output: ${results.length}`)
  console.log(`Output: ${OUTPUT_JSON}`)

  process.exit(0)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
