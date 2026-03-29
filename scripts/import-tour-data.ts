/**
 * Phase 3+4: Import translated tour data into Payload CMS with SEO fields
 * Reads data/translated-tours.json + data/photo-media-mapping.json,
 * resolves relationships, creates tour entries via Payload Local API
 *
 * Usage:
 *   npx tsx --require ./scripts/patch-next-env.cjs scripts/import-tour-data.ts [--dry-run] [--update] [--status=draft]
 */
import fs from 'fs'
import path from 'path'
import { getPayload, payloadConfig } from './payload-bootstrap'
import { markdownToLexical } from '../packages/cms/lib/csv/tour-csv-markdown-to-lexical-converter'

const DRY_RUN = process.argv.includes('--dry-run')
const UPDATE_MODE = process.argv.includes('--update')
const VALID_STATUSES = ['draft', 'published', 'archived'] as const
const STATUS = process.argv.find((a) => a.startsWith('--status='))?.split('=')[1] || 'draft'
if (!VALID_STATUSES.includes(STATUS as (typeof VALID_STATUSES)[number])) {
  console.error(`Invalid --status="${STATUS}". Must be: ${VALID_STATUSES.join(', ')}`)
  process.exit(1)
}

const TRANSLATED_JSON = path.resolve(__dirname, '../data/translated-tours.json')
const MEDIA_MAPPING_JSON = path.resolve(__dirname, '../data/photo-media-mapping.json')

// ── Types matching translate-tour-data.ts output ──
interface TranslatedTour {
  slug: string
  sv: Record<string, string | string[]>
  en: Record<string, string | string[]>
  de: Record<string, string | string[]>
  passThrough: {
    basePrice: number | null
    currency: string
    priceType: string
    groupDiscount: boolean
    childPrice: number | null
    durationHours: number
    meetingPointAddress: string
    coordinates: [number, number] | null
    googleMapsLink: string
    targetAudience: string[]
    difficultyLevel: string
    minimumAge: number | null
    childFriendly: boolean
    teenFriendly: boolean
    wheelchairAccessible: boolean
    hearingAssistance: boolean
    visualAssistance: boolean
    serviceAnimalsAllowed: boolean
    guideSlug: string
    categorySlugs: string[]
    neighborhoodSlugs: string[]
    bokunExperienceId: string | null
    availability: string
    maxGroupSize: number | null
    minGroupSize: number
    featured: boolean
  }
}

interface TourMediaMapping {
  mediaIds: number[]
  heroMediaId: number | null
}

/** Get string value for a specific locale with SV fallback */
function getStr(
  fields: Record<string, string | string[]>,
  svFields: Record<string, string | string[]>,
  field: string,
): string {
  return (fields[field] as string) || (svFields[field] as string) || ''
}

/** Get array value for a specific locale with SV fallback, mapped to item objects */
function getArr(
  fields: Record<string, string | string[]>,
  svFields: Record<string, string | string[]>,
  field: string,
  itemField: string,
): Array<Record<string, string>> {
  const arr = (fields[field] as string[]) || (svFields[field] as string[]) || []
  return arr.map((v) => ({ [itemField]: v }))
}

/** Truncate text at word boundary */
function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  const truncated = text.substring(0, max - 3)
  const lastSpace = truncated.lastIndexOf(' ')
  return (lastSpace > max / 2 ? truncated.substring(0, lastSpace) : truncated) + '...'
}

/** Map targetAudience from Swedish/English free text to schema enum values */
function mapTargetAudience(raw: string[]): string[] {
  const AUDIENCE_MAP: Record<string, string> = {
    'familjer': 'family_friendly',
    'families': 'family_friendly',
    'par': 'couples',
    'couples': 'couples',
    'enskilda resenärer': 'solo_travelers',
    'solo travelers': 'solo_travelers',
    'företag': 'corporate',
    'corporate': 'corporate',
    'seniorer': 'seniors',
    'seniors': 'seniors',
    'historieintresserade': 'history_nerds',
    'history enthusiasts': 'history_nerds',
    'fotografer': 'photography',
    'photography': 'photography',
    'äventyrare': 'adventure',
    'adventure': 'adventure',
    'arkitekturintresserade': 'architecture',
    'architecture': 'architecture',
    'mat och vin': 'food_wine',
    'food and wine': 'food_wine',
    'konstintresserade': 'art_lovers',
    'art lovers': 'art_lovers',
  }

  return raw
    .map((item) => {
      const lower = item.toLowerCase().trim()
      // Direct match
      if (AUDIENCE_MAP[lower]) return AUDIENCE_MAP[lower]
      // Partial match
      for (const [key, val] of Object.entries(AUDIENCE_MAP)) {
        if (lower.includes(key) || key.includes(lower)) return val
      }
      return null
    })
    .filter((v): v is string => v !== null)
    // Deduplicate
    .filter((v, i, a) => a.indexOf(v) === i)
}

/** Build localized tour data for a single locale */
function buildLocaleData(
  tour: TranslatedTour,
  locale: 'sv' | 'en' | 'de',
  mediaMapping: TourMediaMapping | undefined,
  relationships: { guideId: number | string; categoryIds: (number | string)[]; neighborhoodIds: (number | string)[] },
) {
  const fields = tour[locale]
  const svFields = tour.sv // fallback
  const { passThrough } = tour

  // Build images array (only on first locale creation, not on locale updates)
  const images = mediaMapping
    ? mediaMapping.mediaIds.map((id) => ({
        image: id,
        isPrimary: id === mediaMapping.heroMediaId,
      }))
    : []

  const primaryImageId = mediaMapping?.heroMediaId || mediaMapping?.mediaIds[0] || null

  const title = getStr(fields, svFields, 'title')
  const shortDesc = truncate(getStr(fields, svFields, 'shortDescription'), 160)
  const desc = getStr(fields, svFields, 'description')

  // Base document — all fields included for SV create, localized fields only for EN/DE update
  const localeData: Record<string, unknown> = {
    title,
    shortDescription: shortDesc,
    description: markdownToLexical(desc),
    highlights: getArr(fields, svFields, 'highlights', 'highlight'),
    duration: {
      ...(locale === 'sv' ? { hours: passThrough.durationHours } : {}),
      durationText: getStr(fields, svFields, 'durationText') || null,
    },
    logistics: {
      meetingPointName: getStr(fields, svFields, 'meetingPointName'),
      meetingPointAddress: passThrough.meetingPointAddress || null,
      ...(locale === 'sv' ? {
        coordinates: passThrough.coordinates,
        googleMapsLink: passThrough.googleMapsLink || null,
      } : {}),
      meetingPointInstructions: getStr(fields, svFields, 'meetingInstructions') || null,
      endingPoint: getStr(fields, svFields, 'endingPoint') || null,
      parkingInfo: getStr(fields, svFields, 'parkingInfo') || null,
      publicTransportInfo: getStr(fields, svFields, 'publicTransportInfo') || null,
    },
    included: getArr(fields, svFields, 'included', 'item'),
    notIncluded: getArr(fields, svFields, 'notIncluded', 'item'),
    whatToBring: getArr(fields, svFields, 'whatToBring', 'item'),
    accessibility: {
      ...(locale === 'sv' ? {
        wheelchairAccessible: passThrough.wheelchairAccessible,
        hearingAssistance: passThrough.hearingAssistance,
        visualAssistance: passThrough.visualAssistance,
        serviceAnimalsAllowed: passThrough.serviceAnimalsAllowed,
      } : {}),
      mobilityNotes: getStr(fields, svFields, 'mobilityNotes') || null,
    },
    seo: {
      metaTitle: truncate(title, 60),
      metaDescription: truncate(shortDesc, 160),
      ...(locale === 'sv' ? { ogImage: primaryImageId } : {}),
    },
  }

  // Non-localized fields only on SV create
  if (locale === 'sv') {
    Object.assign(localeData, {
      slug: tour.slug,
      pricing: {
        basePrice: passThrough.basePrice,
        currency: passThrough.currency,
        priceType: passThrough.priceType,
        groupDiscount: passThrough.groupDiscount,
        childPrice: passThrough.childPrice,
      },
      targetAudience: mapTargetAudience(passThrough.targetAudience),
      difficultyLevel: passThrough.difficultyLevel || 'easy',
      ageRecommendation: {
        minimumAge: passThrough.minimumAge,
        childFriendly: passThrough.childFriendly,
        teenFriendly: passThrough.teenFriendly,
      },
      guide: relationships.guideId,
      categories: relationships.categoryIds,
      neighborhoods: relationships.neighborhoodIds,
      images,
      bokunExperienceId: passThrough.bokunExperienceId,
      availability: 'available', // xlsx has free-text schedules; all tours are "available"
      maxGroupSize: passThrough.maxGroupSize,
      minGroupSize: passThrough.minGroupSize,
      featured: passThrough.featured,
      status: STATUS,
    })
  }

  return localeData
}

async function main() {
  console.log(`\n=== Phase 3+4: Tour Data Import ${DRY_RUN ? '(DRY RUN)' : ''} ===`)
  console.log(`  Status: ${STATUS} | Update mode: ${UPDATE_MODE}\n`)

  // Load input files
  if (!fs.existsSync(TRANSLATED_JSON)) {
    console.error(`Error: ${TRANSLATED_JSON} not found. Run Phase 2 first.`)
    process.exit(1)
  }
  if (!fs.existsSync(MEDIA_MAPPING_JSON)) {
    console.error(`Error: ${MEDIA_MAPPING_JSON} not found. Run Phase 1 first.`)
    process.exit(1)
  }

  const tours: TranslatedTour[] = JSON.parse(fs.readFileSync(TRANSLATED_JSON, 'utf-8'))
  const mediaMapping: Record<string, TourMediaMapping> = JSON.parse(fs.readFileSync(MEDIA_MAPPING_JSON, 'utf-8'))

  console.log(`Loaded ${tours.length} tours, ${Object.keys(mediaMapping).length} media mappings`)

  if (DRY_RUN) {
    for (const tour of tours) {
      const media = mediaMapping[tour.slug]
      console.log(`\n  ${tour.slug}:`)
      console.log(`    title_sv: ${(tour.sv.title as string)?.substring(0, 50)}...`)
      console.log(`    title_en: ${(tour.en.title as string)?.substring(0, 50)}...`)
      console.log(`    photos: ${media?.mediaIds.length || 0} (hero: ${media?.heroMediaId || 'none'})`)
      console.log(`    guide: ${tour.passThrough.guideSlug}`)
      console.log(`    categories: ${tour.passThrough.categorySlugs.length}`)
      console.log(`    neighborhoods: ${tour.passThrough.neighborhoodSlugs.length}`)
    }
    console.log('\n[DRY RUN] Would create the above tours. Exiting.')
    process.exit(0)
  }

  const payload = await getPayload({ config: payloadConfig })

  // Pre-fetch existing data for relationship resolution
  const { docs: existingTours } = await payload.find({ collection: 'tours', limit: 10000, select: { slug: true } })
  const existingSlugs = new Set(existingTours.map((t) => t.slug))

  const { docs: guides } = await payload.find({ collection: 'guides', limit: 1000 })
  const guideMap = new Map(guides.map((g) => [g.slug, g.id]))

  const { docs: categories } = await payload.find({ collection: 'categories', limit: 1000 })
  const categoryMap = new Map(categories.map((c) => [c.slug, c.id]))

  const { docs: neighborhoods } = await payload.find({ collection: 'neighborhoods', limit: 1000 })
  const neighborhoodMap = new Map(neighborhoods.map((n) => [n.slug, n.id]))

  let created = 0
  let updated = 0
  let skipped = 0
  let errors = 0

  for (const tour of tours) {
    console.log(`\nProcessing: ${tour.slug}`)

    // Resolve guide
    const guideId = guideMap.get(tour.passThrough.guideSlug)
    if (!guideId) {
      console.error(`  ! guide "${tour.passThrough.guideSlug}" not found — SKIPPING`)
      errors++
      continue
    }

    // Resolve categories (warn on missing, don't fail)
    const categoryIds: (string | number)[] = []
    for (const slug of tour.passThrough.categorySlugs) {
      // Handle space-separated slugs (same as Phase 0)
      const subSlugs = slug.includes(' ') ? slug.split(/\s+/) : [slug]
      for (const s of subSlugs) {
        const id = categoryMap.get(s)
        if (id) categoryIds.push(id)
        else console.log(`  ⚠ category "${s}" not found, skipping`)
      }
    }

    // Resolve neighborhoods
    const neighborhoodIds: (string | number)[] = []
    for (const slug of tour.passThrough.neighborhoodSlugs) {
      const id = neighborhoodMap.get(slug)
      if (id) neighborhoodIds.push(id)
      else console.log(`  ⚠ neighborhood "${slug}" not found, skipping`)
    }

    const rels = { guideId, categoryIds, neighborhoodIds }
    const media = mediaMapping[tour.slug]

    // Check existing
    if (existingSlugs.has(tour.slug)) {
      if (!UPDATE_MODE) {
        console.log(`  skip: slug already exists (use --update to overwrite)`)
        skipped++
        continue
      }
      // Update existing — all 3 locales
      try {
        const existing = existingTours.find((t) => t.slug === tour.slug)!
        for (const locale of ['sv', 'en', 'de'] as const) {
          const data = buildLocaleData(tour, locale, media, rels)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await payload.update({ collection: 'tours', id: existing.id, locale, data: data as any })
        }
        console.log(`  ✓ updated (3 locales)`)
        updated++
      } catch (err) {
        console.error(`  ! update failed:`, err instanceof Error ? err.message : err)
        errors++
      }
      continue
    }

    // Create new — SV first, then update EN/DE
    try {
      const svData = buildLocaleData(tour, 'sv', media, rels)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await payload.create({ collection: 'tours', locale: 'sv', data: svData as any })

      // Update EN and DE locales
      for (const locale of ['en', 'de'] as const) {
        const localeData = buildLocaleData(tour, locale, media, rels)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await payload.update({ collection: 'tours', id: result.id, locale, data: localeData as any })
      }

      const imgCount = media?.mediaIds.length || 0
      console.log(`  ✓ created (${imgCount} photos, 3 locales, status: ${STATUS})`)
      created++
      existingSlugs.add(tour.slug)
    } catch (err) {
      console.error(`  ! create failed:`, err instanceof Error ? err.message : err)
      errors++
    }
  }

  console.log('\n=== Summary ===')
  console.log(`Created: ${created}`)
  console.log(`Updated: ${updated}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`Errors: ${errors}`)

  if (errors > 0) process.exit(1)
  process.exit(0)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
