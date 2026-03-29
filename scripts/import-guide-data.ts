/**
 * Import translated guide data into Payload CMS.
 * Reads data/translated-guides.json + data/guide-photo-media-mapping.json,
 * creates real guide entries (3 locales), reassigns tours, deletes placeholders.
 *
 * Usage:
 *   npx tsx --require ./scripts/patch-next-env.cjs scripts/import-guide-data.ts [--dry-run] [--update] [--status=active]
 */
import fs from 'fs'
import path from 'path'
import { getPayload, payloadConfig } from './payload-bootstrap'
import { markdownToLexical } from '../packages/cms/lib/csv/tour-csv-markdown-to-lexical-converter'

const DRY_RUN = process.argv.includes('--dry-run')
const UPDATE_MODE = process.argv.includes('--update')
const VALID_STATUSES = ['active', 'inactive', 'on-leave'] as const
const STATUS = process.argv.find((a) => a.startsWith('--status='))?.split('=')[1] || 'active'
if (!VALID_STATUSES.includes(STATUS as (typeof VALID_STATUSES)[number])) {
  console.error(`Invalid --status="${STATUS}". Must be: ${VALID_STATUSES.join(', ')}`)
  process.exit(1)
}

const TRANSLATED_JSON = path.resolve(__dirname, '../data/translated-guides.json')
const MEDIA_MAPPING_JSON = path.resolve(__dirname, '../data/guide-photo-media-mapping.json')

// Placeholder guide slugs to delete after creating real guides
const PLACEHOLDER_SLUGS = [
  'stockholm-authorized-guide',
  'stockholm-authorized-guide-chauffeur-tour',
  'stockholm-authorized-guide-city-hall-walking-tour',
  'stockholm-authorized-guide-everyday-life-tour',
  'stockholm-authorized-guide-rib-skipper',
  'stockholm-authorized-guide-sigtuna-tour',
  'stockholm-authorized-guide-uppsala-tour',
  'stockholm-authorized-guide-walking-tour',
  'stockholm-authorized-guide-walking-tour-vasa-museum',
]

// ── Specialization text → CMS category slug mapping ──
// Maps keywords from guide specialization descriptions to existing category slugs
const SPECIALIZATION_KEYWORDS: Record<string, string> = {
  'gamla stan': 'gamla-stan',
  'medeltid': 'history-and-heritage',
  'medieval': 'history-and-heritage',
  'historia': 'history',
  'history': 'history',
  'kunglig': 'history-and-heritage',
  'royal': 'history-and-heritage',
  'kultur': 'cultural-experience',
  'cultural': 'cultural-experience',
  'stadsvandring': 'walking-tours',
  'vandring': 'walking-tours',
  'walking': 'walking-tours',
  'promenad': 'walking-tours',
  'buss': 'private-city-tour',
  'bus': 'private-city-tour',
  'båt': 'boat-tours',
  'boat': 'boat-tours',
  'rib': 'rib-boat-tours',
  'vikingar': 'viking-history',
  'viking': 'viking-history',
  'arkitektur': 'history-and-architecture',
  'architecture': 'history-and-architecture',
  'mat': 'cultural-experience',
  'djurgården': 'cultural-experience',
  'vasamuseet': 'vasa-museum',
  'vasa': 'vasa-museum',
  'stadshus': 'city-hall',
  'city hall': 'city-hall',
  'sigtuna': 'day-trips-from-stockholm',
  'uppsala': 'day-trips-from-stockholm',
  'skärgård': 'stockholm-archipelago',
  'archipelago': 'stockholm-archipelago',
  'slow travel': 'slow-travel',
}

// Operating area text → CMS city slug mapping
const AREA_TO_CITY: Record<string, string> = {
  'stockholm': 'stockholm',
  'stockholms kommun': 'stockholm',
  'stockholms stad': 'stockholm',
  'gamla stan': 'stockholm',
  'södermalm': 'stockholm',
  'kungsholmen': 'stockholm',
  'norrmalm': 'stockholm',
  'östermalm': 'stockholm',
  'djurgården': 'stockholm',
  'skeppsholmen': 'stockholm',
  'drottningholm': 'stockholm',
  'lidingö': 'stockholm',
  'sigtuna': 'sigtuna',
  'uppsala': 'uppsala',
  'gamla uppsala': 'uppsala',
  'göteborg': 'gothenburg',
  'gotland': 'gotland',
  'visby': 'gotland',
}

interface TranslatedGuide {
  slug: string
  name: string
  email: string
  phone: string
  sv: { bio: string; certifications: string[]; specializations: string[] }
  en: { bio: string; certifications: string[]; specializations: string[] }
  de: { bio: string; certifications: string[]; specializations: string[] }
  passThrough: {
    languages: string[]
    additionalLanguages: string[]
    operatingAreas: string[]
    tourSlugs: string[]
  }
}

/** Resolve specialization text to category IDs */
function resolveSpecializations(
  specializations: string[],
  categoryMap: Map<string, string | number>,
): (string | number)[] {
  const ids = new Set<string | number>()
  for (const spec of specializations) {
    const lower = spec.toLowerCase()
    for (const [keyword, catSlug] of Object.entries(SPECIALIZATION_KEYWORDS)) {
      if (lower.includes(keyword)) {
        const id = categoryMap.get(catSlug)
        if (id) ids.add(id)
      }
    }
  }
  return [...ids]
}

/** Resolve operating area strings to city IDs */
function resolveOperatingAreas(
  areas: string[],
  cityMap: Map<string, string | number>,
): (string | number)[] {
  const ids = new Set<string | number>()
  for (const area of areas) {
    const lower = area.toLowerCase().trim()
    const citySlug = AREA_TO_CITY[lower]
    if (citySlug) {
      const id = cityMap.get(citySlug)
      if (id) ids.add(id)
    }
  }
  return [...ids]
}

async function main() {
  console.log(`\n=== Guide Data Import ${DRY_RUN ? '(DRY RUN)' : ''} ===`)
  console.log(`  Status: ${STATUS} | Update mode: ${UPDATE_MODE}\n`)

  if (!fs.existsSync(TRANSLATED_JSON)) {
    console.error(`Error: ${TRANSLATED_JSON} not found. Run Phase 1 first.`)
    process.exit(1)
  }
  if (!fs.existsSync(MEDIA_MAPPING_JSON)) {
    console.error(`Error: ${MEDIA_MAPPING_JSON} not found. Run Phase 2 first.`)
    process.exit(1)
  }

  const guides: TranslatedGuide[] = JSON.parse(fs.readFileSync(TRANSLATED_JSON, 'utf-8'))
  const photoMapping: Record<string, number> = JSON.parse(fs.readFileSync(MEDIA_MAPPING_JSON, 'utf-8'))

  console.log(`Loaded ${guides.length} guides, ${Object.keys(photoMapping).length} photo mappings`)

  if (DRY_RUN) {
    for (const g of guides) {
      console.log(`\n  ${g.slug}: ${g.name}`)
      console.log(`    photo: ${photoMapping[g.slug] || 'none'}`)
      console.log(`    languages: ${g.passThrough.languages.join(', ')}`)
      console.log(`    tours: ${g.passThrough.tourSlugs.join(', ')}`)
      console.log(`    operatingAreas: ${g.passThrough.operatingAreas.length} areas`)
    }
    console.log('\n[DRY RUN] Would create the above guides. Exiting.')
    process.exit(0)
  }

  const payload = await getPayload({ config: payloadConfig })

  // Pre-fetch reference data
  const { docs: existingGuides } = await payload.find({ collection: 'guides', limit: 1000 })
  const existingSlugs = new Set(existingGuides.map((g) => g.slug))

  const { docs: categories } = await payload.find({ collection: 'categories', limit: 1000 })
  const categoryMap = new Map(categories.map((c) => [c.slug, c.id]))

  const { docs: cities } = await payload.find({ collection: 'cities', limit: 1000 })
  const cityMap = new Map(cities.map((c) => [c.slug, c.id]))

  const { docs: allTours } = await payload.find({ collection: 'tours', limit: 1000 })
  const tourMap = new Map(allTours.map((t) => [t.slug, t]))

  let created = 0, updated = 0, skipped = 0, errors = 0

  // ── Create guides ──
  const newGuideMap = new Map<string, string | number>()

  for (const guide of guides) {
    console.log(`\nProcessing: ${guide.slug}`)

    const photoId = photoMapping[guide.slug]
    if (!photoId) console.log(`  ⚠ no photo mapping for ${guide.slug}`)

    const specializationIds = resolveSpecializations(guide.sv.specializations, categoryMap)
    const operatingAreaIds = resolveOperatingAreas(guide.passThrough.operatingAreas, cityMap)

    const wasExisting = existingSlugs.has(guide.slug)

    if (wasExisting && !UPDATE_MODE) {
      console.log(`  skip: slug exists (use --update to overwrite)`)
      const existing = existingGuides.find((g) => g.slug === guide.slug)
      if (existing) newGuideMap.set(guide.slug, existing.id)
      skipped++
      continue
    }

    try {
      // SV locale — full data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const svData: Record<string, any> = {
        name: guide.name,
        slug: guide.slug,
        status: STATUS,
        bio: markdownToLexical(guide.sv.bio),
        credentials: guide.sv.certifications.map((c) => ({ credential: c })),
        photo: photoId || undefined,
        email: guide.email,
        phone: guide.phone,
        languages: guide.passThrough.languages,
        additionalLanguages: guide.passThrough.additionalLanguages.length > 0
          ? guide.passThrough.additionalLanguages
          : undefined,
        specializations: specializationIds.length > 0 ? specializationIds : undefined,
        operatingAreas: operatingAreaIds.length > 0 ? operatingAreaIds : undefined,
      }

      let guideId: string | number

      if (wasExisting && UPDATE_MODE) {
        const existing = existingGuides.find((g) => g.slug === guide.slug)!
        await payload.update({ collection: 'guides', id: existing.id, locale: 'sv', data: svData })
        guideId = existing.id
      } else {
        const result = await payload.create({ collection: 'guides', locale: 'sv', data: svData })
        guideId = result.id
        existingSlugs.add(guide.slug)
      }

      // Fetch created guide to get credentials array item IDs for locale updates.
      // The credentials array is non-localized but inner `credential` text is localized,
      // so EN/DE updates must reference existing array item IDs to avoid overwriting rows.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const savedGuide = await payload.findByID({ collection: 'guides', id: guideId, locale: 'sv' }) as any
      const savedCreds = savedGuide.credentials || []

      // EN + DE locale updates — only localized fields
      for (const locale of ['en', 'de'] as const) {
        const localeFields = guide[locale]
        // Map translated certifications onto existing array items by index, preserving IDs
        const updatedCreds = savedCreds.map((cred: { id: string; credential: string }, i: number) => ({
          id: cred.id,
          credential: localeFields.certifications[i] || cred.credential,
        }))
        await payload.update({
          collection: 'guides',
          id: guideId,
          locale,
          data: {
            bio: markdownToLexical(localeFields.bio),
            credentials: updatedCreds,
          },
        })
      }

      newGuideMap.set(guide.slug, guideId)
      const action = wasExisting && UPDATE_MODE ? 'updated' : 'created'
      console.log(`  ✓ ${action} (3 locales, ${specializationIds.length} specializations, ${operatingAreaIds.length} areas)`)
      if (action === 'updated') updated++
      else created++
    } catch (err) {
      console.error(`  ! failed:`, err instanceof Error ? err.message : err)
      errors++
    }
  }

  // ── Tour reassignment ──
  console.log('\n--- Tour Reassignment ---')
  let toursReassigned = 0

  for (const guide of guides) {
    const newGuideId = newGuideMap.get(guide.slug)
    if (!newGuideId) continue

    for (const tourSlug of guide.passThrough.tourSlugs) {
      const tour = tourMap.get(tourSlug)
      if (!tour) {
        console.log(`  ⚠ tour "${tourSlug}" not found`)
        continue
      }
      try {
        await payload.update({ collection: 'tours', id: tour.id, data: { guide: newGuideId } })
        console.log(`  ✓ ${tourSlug} → ${guide.slug}`)
        toursReassigned++
      } catch (err) {
        console.error(`  ! tour reassign failed: ${tourSlug}`, err instanceof Error ? err.message : err)
        errors++
      }
    }
  }

  // ── Placeholder cleanup ──
  console.log('\n--- Placeholder Cleanup ---')
  let deleted = 0

  for (const slug of PLACEHOLDER_SLUGS) {
    const placeholder = existingGuides.find((g) => g.slug === slug)
    if (!placeholder) {
      console.log(`  skip: "${slug}" not found`)
      continue
    }
    // Safety: re-query tours referencing this placeholder (data may have changed during reassignment)
    const { docs: referencingTours } = await payload.find({
      collection: 'tours',
      where: { guide: { equals: placeholder.id } },
      limit: 1,
    })
    if (referencingTours.length > 0) {
      console.log(`  ⚠ skipping "${slug}" — still referenced by tour "${referencingTours[0].slug}"`)
      continue
    }
    try {
      await payload.delete({ collection: 'guides', id: placeholder.id })
      console.log(`  ✗ deleted: ${slug}`)
      deleted++
    } catch (err) {
      console.error(`  ! delete failed: ${slug}`, err instanceof Error ? err.message : err)
      errors++
    }
  }

  console.log('\n=== Summary ===')
  console.log(`Created: ${created}`)
  console.log(`Updated: ${updated}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`Tours reassigned: ${toursReassigned}`)
  console.log(`Placeholders deleted: ${deleted}`)
  console.log(`Errors: ${errors}`)

  if (errors > 0) process.exit(1)
  process.exit(0)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
