/**
 * Phase 0: Create tour prerequisites — categories, neighborhoods, city, guide validation
 * Parses Tour-data.xlsx, extracts unique slugs, creates entries via Payload Local API
 *
 * Usage:
 *   npx tsx --require ./scripts/patch-next-env.cjs scripts/create-tour-prerequisites.ts [--dry-run]
 */
import ExcelJS from 'exceljs'
import path from 'path'
import { getPayload, payloadConfig as config } from './payload-bootstrap'

const DRY_RUN = process.argv.includes('--dry-run')
const XLSX_PATH = path.resolve(__dirname, '../docx/Tour-data.xlsx')

// ── Known Swedish place name corrections ──
const SLUG_TO_NAME: Record<string, string> = {
  'gamla-stan': 'Gamla Stan',
  'djurgarden': 'Djurgården',
  'sodermalm': 'Södermalm',
  'ostermalm': 'Östermalm',
  'norrmalm': 'Norrmalm',
  'kungsholmen': 'Kungsholmen',
  'riddarholmen': 'Riddarholmen',
  'strandvagen': 'Strandvägen',
  'stadshuset': 'Stadshuset',
  'malaren': 'Mälaren',
  'malardalen': 'Mälardalen',
  'sigtuna': 'Sigtuna',
  'uppsala': 'Uppsala',
  'gamla-uppsala': 'Gamla Uppsala',
  'uppland': 'Uppland',
  'vasa-museet': 'Vasamuseet',
  'klara-malarstrand': 'Klara Mälarstrand',
  'djurgardsbrunnskanalen': 'Djurgårdsbrunnskanalen',
  'fjaderholmarna': 'Fjäderholmarna',
  'stockholms-skargard': 'Stockholms Skärgård',
  'stockholm-city': 'Stockholm City',
  'stockholm-archipelago': 'Stockholm Archipelago',
}

// ── Category type classification ──
const ACTIVITY_CATEGORIES = new Set([
  'walking-tours', 'boat-tours', 'rib-boat-tours', 'city-walk',
  'slow-travel', 'chauffeured-experience', 'private-day-trips',
  'private-day-tour', 'private-tours', 'private-walking-tour',
  'private-city-tour',
])

/** Convert kebab-slug to Title Case, with known overrides */
function slugToName(slug: string): string {
  if (SLUG_TO_NAME[slug]) return SLUG_TO_NAME[slug]
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/** Split semicolon-or-newline-or-space-separated slug values, clean up */
function splitSlugs(raw: string): string[] {
  // First split on semicolons and newlines
  const parts = raw
    .split(/[;\n]+/)
    .map((s) => s.replace(/["\r]/g, '').trim().toLowerCase())
    .filter(Boolean)

  // Some cells have space-separated slugs within a segment (e.g., "sigtuna cultural-heritage")
  // Split these further: if a part contains a space, treat each word-group as a separate slug
  const slugs: string[] = []
  for (const part of parts) {
    if (part.includes(' ')) {
      // Split on spaces — each token that looks like a slug (contains a hyphen or is a known word) is separate
      part.split(/\s+/).filter(Boolean).forEach((s) => slugs.push(s))
    } else {
      slugs.push(part)
    }
  }
  return slugs
}

/** Extract unique slugs from a specific xlsx column across all data rows */
function extractUniqueSlugs(
  worksheet: ExcelJS.Worksheet,
  colIndex: number,
): string[] {
  const slugs = new Set<string>()
  worksheet.eachRow((row, num) => {
    if (num === 1) return
    const raw = String(row.getCell(colIndex).value || '')
    splitSlugs(raw).forEach((s) => slugs.add(s))
  })
  return [...slugs].sort()
}

async function main() {
  console.log(`\n=== Phase 0: Create Tour Prerequisites ${DRY_RUN ? '(DRY RUN)' : ''} ===\n`)

  // Parse xlsx
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(XLSX_PATH)
  const worksheet = workbook.worksheets[0]
  if (!worksheet) throw new Error('No worksheet found')

  const categorySlugs = extractUniqueSlugs(worksheet, 34)
  const neighborhoodSlugs = extractUniqueSlugs(worksheet, 35)
  const guideSlugs = extractUniqueSlugs(worksheet, 33)

  console.log(`Found ${categorySlugs.length} unique categories:`, categorySlugs)
  console.log(`Found ${neighborhoodSlugs.length} unique neighborhoods:`, neighborhoodSlugs)
  console.log(`Found ${guideSlugs.length} unique guides:`, guideSlugs)

  if (DRY_RUN) {
    console.log('\n[DRY RUN] Would create the above entries. Exiting.')
    process.exit(0)
  }

  const payload = await getPayload({ config })

  // ── 1. Ensure Stockholm city exists (required for neighborhoods) ──
  let stockholmCityId: number | string
  const { docs: existingCities } = await payload.find({
    collection: 'cities',
    where: { slug: { equals: 'stockholm' } },
    limit: 1,
  })
  if (existingCities.length > 0) {
    stockholmCityId = existingCities[0].id
    console.log(`✓ City "stockholm" already exists (id: ${stockholmCityId})`)
  } else {
    const city = await payload.create({
      collection: 'cities',
      data: {
        name: 'Stockholm',
        slug: 'stockholm',
        country: 'Sweden',
        coordinates: [18.0686, 59.3293], // [lng, lat]
      },
    })
    stockholmCityId = city.id
    console.log(`+ Created city "Stockholm" (id: ${stockholmCityId})`)
  }

  // ── 2. Create categories ──
  console.log('\n--- Categories ---')
  const { docs: existingCats } = await payload.find({
    collection: 'categories',
    limit: 1000,
  })
  const existingCatSlugs = new Set(existingCats.map((c) => c.slug))
  let catsCreated = 0
  let catsSkipped = 0

  for (const slug of categorySlugs) {
    if (existingCatSlugs.has(slug)) {
      console.log(`  skip: "${slug}" (exists)`)
      catsSkipped++
      continue
    }
    const name = slugToName(slug)
    const type = ACTIVITY_CATEGORIES.has(slug) ? 'activity' : 'theme'
    try {
      await payload.create({
        collection: 'categories',
        data: {
          name, // sv is default locale
          slug,
          type,
        },
      })
      console.log(`  + created: "${slug}" (${type}) -> "${name}"`)
      catsCreated++
    } catch (err) {
      console.error(`  ! failed: "${slug}":`, err instanceof Error ? err.message : err)
    }
  }

  // ── 3. Create neighborhoods ──
  console.log('\n--- Neighborhoods ---')
  const { docs: existingHoods } = await payload.find({
    collection: 'neighborhoods',
    limit: 1000,
  })
  const existingHoodSlugs = new Set(existingHoods.map((n) => n.slug))
  let hoodsCreated = 0
  let hoodsSkipped = 0

  for (const slug of neighborhoodSlugs) {
    if (existingHoodSlugs.has(slug)) {
      console.log(`  skip: "${slug}" (exists)`)
      hoodsSkipped++
      continue
    }
    const name = slugToName(slug)
    try {
      await payload.create({
        collection: 'neighborhoods',
        data: {
          name, // sv default locale
          slug,
          city: stockholmCityId,
        },
      })
      console.log(`  + created: "${slug}" -> "${name}"`)
      hoodsCreated++
    } catch (err) {
      console.error(`  ! failed: "${slug}":`, err instanceof Error ? err.message : err)
    }
  }

  // ── 4. Validate guides ──
  console.log('\n--- Guide Validation ---')
  const { docs: existingGuides } = await payload.find({
    collection: 'guides',
    limit: 1000,
  })
  const existingGuideSlugs = new Set(existingGuides.map((g) => g.slug))

  for (const slug of guideSlugs) {
    if (existingGuideSlugs.has(slug)) {
      console.log(`  ✓ guide exists: "${slug}"`)
    } else {
      console.log(`  ⚠ guide MISSING: "${slug}" — must be created before Phase 3`)
    }
  }

  // ── Summary ──
  console.log('\n=== Summary ===')
  console.log(`Categories: ${catsCreated} created, ${catsSkipped} skipped`)
  console.log(`Neighborhoods: ${hoodsCreated} created, ${hoodsSkipped} skipped`)
  console.log(`Guides: ${guideSlugs.length} checked`)

  process.exit(0)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
