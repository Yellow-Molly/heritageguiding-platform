/**
 * Phase 1: Upload tour photos to Vercel Blob via Payload media Local API
 * Scans docx/Photos/{tour-slug}/ for Medium JPEGs, creates media entries,
 * outputs data/photo-media-mapping.json for Phase 3
 *
 * Usage:
 *   npx tsx --require ./scripts/patch-next-env.cjs scripts/import-tour-photos.ts [--dry-run]
 */
import fs from 'fs'
import path from 'path'
import { getPayload, payloadConfig } from './payload-bootstrap'

const DRY_RUN = process.argv.includes('--dry-run')
const PHOTOS_DIR = path.resolve(__dirname, '../docx/Photos')
const OUTPUT_PATH = path.resolve(__dirname, '../data/photo-media-mapping.json')
const BATCH_DELAY_MS = 200

interface PhotoEntry {
  tourSlug: string
  filePath: string
  filename: string
  isHero: boolean
  altText: string
}

interface TourMediaMapping {
  mediaIds: number[]
  heroMediaId: number | null
}

/** Derive alt text from photo filename: strip "Medium.jpg" suffix */
function filenameToAltText(filename: string): string {
  return filename
    .replace(/\s*(Medium|Large)\s*\.(jpg|jpeg|png)$/i, '')
    .trim()
}

/** Slugify a filename for clean media storage */
function slugifyFilename(filename: string): string {
  return filename
    .toLowerCase()
    .replace(/\s*(medium|large)\s*/gi, '')
    .replace(/[^a-z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Scan photo directories and build list of photos to upload */
function scanPhotos(): PhotoEntry[] {
  const photos: PhotoEntry[] = []

  if (!fs.existsSync(PHOTOS_DIR)) {
    throw new Error(`Photos directory not found: ${PHOTOS_DIR}`)
  }

  const tourDirs = fs.readdirSync(PHOTOS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()

  for (const tourSlug of tourDirs) {
    const tourDir = path.join(PHOTOS_DIR, tourSlug)
    const files = fs.readdirSync(tourDir)
      .filter((f) => /medium\.(jpg|jpeg)$/i.test(f))
      .sort()

    for (const filename of files) {
      photos.push({
        tourSlug,
        filePath: path.join(tourDir, filename),
        filename,
        isHero: /hero/i.test(filename),
        altText: filenameToAltText(filename),
      })
    }
  }

  return photos
}

/** Delay helper */
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function main() {
  console.log(`\n=== Phase 1: Photo Upload ${DRY_RUN ? '(DRY RUN)' : ''} ===\n`)

  const photos = scanPhotos()
  console.log(`Found ${photos.length} Medium photos across ${new Set(photos.map((p) => p.tourSlug)).size} tours\n`)

  if (DRY_RUN) {
    // Show what would be uploaded
    const tourGroups = new Map<string, PhotoEntry[]>()
    for (const p of photos) {
      if (!tourGroups.has(p.tourSlug)) tourGroups.set(p.tourSlug, [])
      tourGroups.get(p.tourSlug)!.push(p)
    }
    for (const [slug, entries] of tourGroups) {
      const hero = entries.find((e) => e.isHero)
      console.log(`  ${slug}: ${entries.length} photos${hero ? ` (hero: ${hero.filename})` : ' (no hero)'}`)
    }
    console.log('\n[DRY RUN] Would upload the above. Exiting.')
    process.exit(0)
  }

  const payload = await getPayload({ config: payloadConfig })

  // Build mapping
  const mapping: Record<string, TourMediaMapping> = {}
  let uploaded = 0
  let skipped = 0
  let errors = 0

  // Pre-fetch existing media to check for duplicates (by alt text)
  const { docs: existingMedia } = await payload.find({
    collection: 'media',
    limit: 10000,
    select: { alt: true },
  })
  // Map alt text (lowercased) -> media ID for idempotent re-runs
  const existingAltToId = new Map<string, number>()
  for (const m of existingMedia) {
    const alt = typeof m.alt === 'string' ? m.alt : ''
    existingAltToId.set(alt.toLowerCase(), m.id as number)
  }

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i]

    // Initialize tour mapping
    if (!mapping[photo.tourSlug]) {
      mapping[photo.tourSlug] = { mediaIds: [], heroMediaId: null }
    }

    // Idempotency: skip if alt text already exists, but capture existing ID into mapping
    const existingId = existingAltToId.get(photo.altText.toLowerCase())
    if (existingId) {
      mapping[photo.tourSlug].mediaIds.push(existingId)
      if (photo.isHero) mapping[photo.tourSlug].heroMediaId = existingId
      console.log(`  skip: "${photo.altText}" (exists, id: ${existingId})`)
      skipped++
      continue
    }

    try {
      // Read file buffer
      const buffer = fs.readFileSync(photo.filePath)
      const cleanName = slugifyFilename(photo.filename)

      // Create media entry via Payload Local API
      const media = await payload.create({
        collection: 'media',
        data: {
          alt: photo.altText, // sv default locale; same text works for all locales on photos
        },
        file: {
          data: buffer,
          mimetype: 'image/jpeg',
          name: cleanName,
          size: buffer.length,
        },
      })

      mapping[photo.tourSlug].mediaIds.push(media.id as number)
      if (photo.isHero) {
        mapping[photo.tourSlug].heroMediaId = media.id as number
      }

      uploaded++
      console.log(`  + [${uploaded}/${photos.length}] ${photo.tourSlug}/${photo.filename}${photo.isHero ? ' (HERO)' : ''}`)
    } catch (err) {
      errors++
      console.error(`  ! failed: ${photo.filename}:`, err instanceof Error ? err.message : err)
    }

    // Batch delay every 10 uploads
    if (i > 0 && i % 10 === 0) {
      await delay(BATCH_DELAY_MS)
    }
  }

  // Write mapping file
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(mapping, null, 2))
  console.log(`\nMapping written to: ${OUTPUT_PATH}`)

  // Summary
  console.log('\n=== Summary ===')
  console.log(`Uploaded: ${uploaded}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`Errors: ${errors}`)
  console.log(`Tours with heroes: ${Object.values(mapping).filter((m) => m.heroMediaId).length}/${Object.keys(mapping).length}`)

  if (errors > 0) process.exit(1)
  process.exit(0)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
