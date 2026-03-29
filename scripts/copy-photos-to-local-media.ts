/**
 * Copy uploaded photos to Payload's local media directory for dev environment.
 * Reads media entries from DB, finds matching source photos, copies with expected filename.
 *
 * Usage: npx tsx --require ./scripts/patch-next-env.cjs scripts/copy-photos-to-local-media.ts
 */
import fs from 'fs'
import path from 'path'
import { getPayload, payloadConfig as config } from './payload-bootstrap'

const PHOTOS_DIR = path.resolve(__dirname, '../docx/Photos')
const MEDIA_DIR = path.resolve(__dirname, '../apps/web/media')

async function main() {
  console.log('=== Copy Photos to Local Media ===\n')

  const payload = await getPayload({ config })

  // Get all media entries
  const { docs } = await payload.find({ collection: 'media', limit: 10000, depth: 0 })
  console.log(`Found ${docs.length} media entries in DB`)

  // Build a map of all source photos (original filename → file path)
  const sourceMap = new Map<string, string>()
  const tourDirs = fs.readdirSync(PHOTOS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())

  for (const dir of tourDirs) {
    const tourDir = path.join(PHOTOS_DIR, dir.name)
    for (const file of fs.readdirSync(tourDir)) {
      if (/medium\.(jpg|jpeg)$/i.test(file)) {
        // Create the slugified name that import-tour-photos.ts would have generated
        const slugified = file
          .toLowerCase()
          .replace(/\s*(medium|large)\s*/gi, '')
          .replace(/[^a-z0-9.-]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
        sourceMap.set(slugified, path.join(tourDir, file))
      }
    }
  }

  console.log(`Found ${sourceMap.size} source photos`)

  // Create media directory
  fs.mkdirSync(MEDIA_DIR, { recursive: true })

  let copied = 0
  let skipped = 0
  let missing = 0

  for (const doc of docs) {
    const filename = (doc as Record<string, unknown>).filename as string
    if (!filename) continue

    const destPath = path.join(MEDIA_DIR, filename)

    // Skip if already exists
    if (fs.existsSync(destPath)) {
      skipped++
      continue
    }

    // Find source file
    const sourcePath = sourceMap.get(filename)
    if (!sourcePath) {
      console.log(`  ! missing source for: ${filename}`)
      missing++
      continue
    }

    fs.copyFileSync(sourcePath, destPath)
    copied++
  }

  console.log(`\n=== Summary ===`)
  console.log(`Copied: ${copied}`)
  console.log(`Skipped (exists): ${skipped}`)
  console.log(`Missing source: ${missing}`)

  process.exit(0)
}

main().catch((e) => { console.error(e); process.exit(1) })
