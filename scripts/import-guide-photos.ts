/**
 * Upload guide profile photos to Payload CMS media collection.
 * Reads photos from docx/Guide-photos/, outputs data/guide-photo-media-mapping.json.
 *
 * Usage:
 *   npx tsx --require ./scripts/patch-next-env.cjs scripts/import-guide-photos.ts [--dry-run]
 */
import fs from 'fs'
import path from 'path'
import { getPayload, payloadConfig } from './payload-bootstrap'

const DRY_RUN = process.argv.includes('--dry-run')
const PHOTOS_DIR = path.resolve(__dirname, '../docx/Guide-photos')
const OUTPUT_PATH = path.resolve(__dirname, '../data/guide-photo-media-mapping.json')

/**
 * Manual map: photo filename stem (without extension) → guide slug.
 * Slug must match Phase 1 slug derivation from guide name in Excel.
 *
 * Windows NTFS encoding note: the 3 files with Swedish diacritics (ö, ä, ü)
 * are stored on disk with a corrupted byte sequence — U+2560 (╠) + U+00EA (ê)
 * in place of the intended diacritic character. This is a filename-level
 * encoding artefact; it cannot be fixed via Unicode normalisation.
 * The keys below use the literal codepoints fs.readdirSync returns so that
 * lookups succeed. The human-readable alt text is derived separately.
 *
 * Verified codepoints (from fs.readdirSync output):
 *   "Niklas_Lo╠êfstrom"  → U+004C U+006F U+2560 U+00EA U+0066 ...
 *   "Olof_Na╠êslund"     → U+004E U+0061 U+2560 U+00EA U+0073 ...
 *   "Sabine_Gru╠ên"      → U+0047 U+0072 U+0075 U+2560 U+00EA U+006E ...
 */
const PHOTO_TO_GUIDE_SLUG: Record<string, string> = {
  /* eslint-disable no-irregular-whitespace */
  'Anders_Boysen': 'anders-boysen',
  'Annika_Bernholm': 'annika-bernholm',
  'Christian_Arnet': 'christian-arnet',
  'Niklas_Lo\u2560\u00EAfstrom': 'niklas-lofstrom',  // corrupted ö on disk
  'Olof_Na\u2560\u00EAslund': 'olof-naslund',         // corrupted ä on disk
  'Sabine_Gru\u2560\u00EAn': 'sabine-gruen',          // corrupted ü; Excel name: Gruen
  'Sophie_Sahlin': 'sophie-sahlin',
  /* eslint-enable no-irregular-whitespace */
}

interface GuidePhotoEntry {
  guideSlug: string
  filePath: string
  filename: string
  /** Human-readable name for alt text: "Niklas Löfström" */
  altText: string
}

/**
 * Map of corrupted-stem → clean alt text for the 3 files whose on-disk names
 * contain the U+2560 U+00EA mojibake sequence instead of the intended diacritic.
 * Without this, the alt text stored in CMS would contain garbage characters.
 */
const CLEAN_ALT_TEXT: Record<string, string> = {
  'Niklas_Lo\u2560\u00EAfstrom': 'Niklas Löfström',
  'Olof_Na\u2560\u00EAslund': 'Olof Näslund',
  'Sabine_Gru\u2560\u00EAn': 'Sabine Grün',
}

/**
 * Derive alt text from the raw filename stem (before extension).
 * For stems with encoding corruption, returns the clean human-readable name.
 * For normal stems, replaces underscores with spaces.
 * e.g. "Anders_Boysen" → "Anders Boysen"
 */
function filenameToAltText(stem: string): string {
  return CLEAN_ALT_TEXT[stem] ?? stem.replace(/_/g, ' ').trim()
}

/** Scan PHOTOS_DIR and build list of guide photos to upload. */
function scanPhotos(): GuidePhotoEntry[] {
  if (!fs.existsSync(PHOTOS_DIR)) {
    throw new Error(`Guide photos directory not found: ${PHOTOS_DIR}`)
  }

  const files = fs.readdirSync(PHOTOS_DIR)
    .filter((f) => /\.(jpg|jpeg|png)$/i.test(f))
    .sort()

  const entries: GuidePhotoEntry[] = []

  for (const filename of files) {
    // stem is used as-is for map lookup; keys use Unicode escapes matching
    // the exact codepoints fs.readdirSync returns on this Windows machine.
    const stem = filename.replace(/\.(jpg|jpeg|png)$/i, '')

    const guideSlug = PHOTO_TO_GUIDE_SLUG[stem]
    if (!guideSlug) {
      console.warn(`  warn: no slug mapping for "${filename}" (stem: "${stem}") — skipping`)
      continue
    }

    entries.push({
      guideSlug,
      filePath: path.join(PHOTOS_DIR, filename),
      filename,
      altText: filenameToAltText(stem),
    })
  }

  return entries
}

async function main() {
  console.log(`\n=== Guide Photo Upload ${DRY_RUN ? '(DRY RUN)' : ''} ===\n`)

  const photos = scanPhotos()
  console.log(`Found ${photos.length} guide photo(s)\n`)

  if (DRY_RUN) {
    for (const p of photos) {
      console.log(`  ${p.filename} → slug: "${p.guideSlug}", alt: "${p.altText}"`)
    }
    console.log('\n[DRY RUN] Would upload the above. Exiting.')
    process.exit(0)
  }

  const payload = await getPayload({ config: payloadConfig })

  // Pre-fetch existing media to enable idempotent re-runs (keyed by alt text)
  const { docs: existingMedia } = await payload.find({
    collection: 'media',
    limit: 10000,
    select: { alt: true },
  })
  const existingAltToId = new Map<string, number>()
  for (const m of existingMedia) {
    const alt = typeof m.alt === 'string' ? m.alt : ''
    existingAltToId.set(alt.toLowerCase(), m.id as number)
  }

  const mapping: Record<string, number> = {}
  let uploaded = 0
  let skipped = 0
  let errors = 0

  for (const photo of photos) {
    // Idempotency: skip if alt text already exists in media collection
    const existingId = existingAltToId.get(photo.altText.toLowerCase())
    if (existingId) {
      mapping[photo.guideSlug] = existingId
      console.log(`  skip: "${photo.altText}" (exists, id: ${existingId})`)
      skipped++
      continue
    }

    try {
      const buffer = fs.readFileSync(photo.filePath)
      const mimetype = /\.png$/i.test(photo.filename) ? 'image/png' : 'image/jpeg'

      // Slugify filename for clean storage: lowercase, diacritics stripped, spaces → hyphens
      const cleanName = photo.filename
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9.]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')

      const media = await payload.create({
        collection: 'media',
        data: { alt: photo.altText },
        file: {
          data: buffer,
          mimetype,
          name: cleanName,
          size: buffer.length,
        },
      })

      mapping[photo.guideSlug] = media.id as number
      uploaded++
      console.log(`  + [${uploaded}] ${photo.filename} → guide "${photo.guideSlug}" (id: ${media.id})`)
    } catch (err) {
      errors++
      console.error(`  ! failed: ${photo.filename}:`, err instanceof Error ? err.message : err)
    }
  }

  // Write output mapping: { guideSlug: mediaId }
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true })
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(mapping, null, 2))
  console.log(`\nMapping written to: ${OUTPUT_PATH}`)

  console.log('\n=== Summary ===')
  console.log(`Uploaded : ${uploaded}`)
  console.log(`Skipped  : ${skipped}`)
  console.log(`Errors   : ${errors}`)
  console.log(`Mapped   : ${Object.keys(mapping).length} guides`)

  if (errors > 0) process.exit(1)
  process.exit(0)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
