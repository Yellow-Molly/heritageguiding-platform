/**
 * Upload v3 web-optimized guide photos to Payload Media.
 *
 * Reads from docx/Guide-photos-web/ (Phase 1 output), uploads each file,
 * and updates data/guide-photo-media-mapping.json in place — preserving
 * unchanged slug entries and replacing the 10 v3 targets.
 *
 * Forces fresh uploads (no alt-text dedupe) so placeholder replacements +
 * file refreshes get new media records. Logs orphan (replaced) media IDs
 * for a follow-up cleanup ticket.
 *
 * Usage:
 *   npx tsx --require ./scripts/patch-next-env.cjs scripts/upload-v3-guide-photos.ts [--dry-run]
 */
import fs from 'fs'
import path from 'path'
import { getPayload, payloadConfig } from './payload-bootstrap'

const DRY_RUN = process.argv.includes('--dry-run')
const SRC_DIR = path.resolve(__dirname, '../docx/Guide-photos-web')
const MAPPING_PATH = path.resolve(__dirname, '../data/guide-photo-media-mapping.json')
/**
 * Optional filename prefix — required for staging because dev and staging share
 * the same Vercel Blob bucket and identical filenames collide. Pass `--prefix=stg-`
 * to match the existing staging convention (e.g. `stg-jack-voldstad.jpg`).
 */
const PREFIX = process.argv.find((a) => a.startsWith('--prefix='))?.split('=')[1] ?? ''

interface UploadTarget {
  slug: string
  file: string
  alt: string
}

const TARGETS: UploadTarget[] = [
  { slug: 'anette-gustafsson', file: 'anette-gustafsson.jpg', alt: 'Anette Gustafsson' },
  { slug: 'leo-eriksson',      file: 'leo-eriksson.jpg',      alt: 'Leo Eriksson' },
  { slug: 'mats-quist',        file: 'mats-quist.jpg',        alt: 'Mats Quist' },
  { slug: 'asa-ovrelid',       file: 'asa-ovrelid.jpg',       alt: 'Åsa Övrelid' },
  { slug: 'svante-bergqvist',  file: 'svante-bergqvist.jpg',  alt: 'Svante Bergqvist' },
  { slug: 'tommy-nilsson',     file: 'tommy-nilsson.jpg',     alt: 'Tommy Nilsson' },
  { slug: 'jack-voldstad',     file: 'jack-voldstad.jpg',     alt: 'Jack Voldstad' },
  { slug: 'sophie-sahlin',     file: 'sophie-sahlin.jpg',     alt: 'Sophie Sahlin' },
  { slug: 'anders-boysen',     file: 'anders-boysen.jpg',     alt: 'Anders Boysen' },
  { slug: 'annika-bernholm',   file: 'annika-bernholm.jpg',   alt: 'Annika Bernholm' },
]

function loadMapping(): Record<string, number> {
  if (!fs.existsSync(MAPPING_PATH)) return {}
  return JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf-8'))
}

function saveMapping(map: Record<string, number>): void {
  // Sort keys for stable diffs
  const sorted = Object.fromEntries(
    Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  )
  fs.writeFileSync(MAPPING_PATH, JSON.stringify(sorted, null, 2) + '\n', 'utf-8')
}

async function main(): Promise<void> {
  console.log(`\n=== Guide Photo Upload v3 ${DRY_RUN ? '(DRY RUN)' : ''} ===\n`)

  // Validate all source files exist
  const missing: string[] = []
  for (const t of TARGETS) {
    const p = path.join(SRC_DIR, t.file)
    if (!fs.existsSync(p)) missing.push(t.file)
  }
  if (missing.length) {
    console.error(`Missing source files in ${SRC_DIR}:`)
    missing.forEach((f) => console.error(`  - ${f}`))
    process.exit(1)
  }

  const mapping = loadMapping()
  console.log(`Loaded mapping with ${Object.keys(mapping).length} existing entries`)
  console.log(`Targets: ${TARGETS.length} photos\n`)

  if (PREFIX) console.log(`Filename prefix: "${PREFIX}"\n`)

  if (DRY_RUN) {
    for (const t of TARGETS) {
      const oldId = mapping[t.slug] ?? '(none)'
      const sz = fs.statSync(path.join(SRC_DIR, t.file)).size
      const name = `${PREFIX}${t.file}`
      console.log(`  ${t.slug.padEnd(22)} ← ${name.padEnd(32)} ${(sz / 1024).toFixed(0)}KB  oldId=${oldId}`)
    }
    console.log('\n[DRY RUN] Would upload the above. Exiting.')
    process.exit(0)
  }

  const payload = await getPayload({ config: payloadConfig })
  const orphans: Array<{ slug: string; oldId: number; newId: number }> = []
  let uploaded = 0
  let errors = 0

  for (const t of TARGETS) {
    const p = path.join(SRC_DIR, t.file)
    const buf = fs.readFileSync(p)
    const oldId = mapping[t.slug]
    try {
      const media = await payload.create({
        collection: 'media',
        data: { alt: t.alt },
        file: {
          data: buf,
          mimetype: 'image/jpeg',
          name: `${PREFIX}${t.file}`,
          size: buf.length,
        },
      })
      const newId = media.id as number
      if (oldId && oldId !== newId) {
        orphans.push({ slug: t.slug, oldId, newId })
      }
      mapping[t.slug] = newId
      uploaded++
      console.log(`  + ${t.slug.padEnd(22)} id=${newId}  (was ${oldId ?? '—'})`)
    } catch (err) {
      errors++
      console.error(`  ! ${t.slug}:`, err instanceof Error ? err.message : err)
    }
  }

  saveMapping(mapping)

  console.log('\n=== Summary ===')
  console.log(`Uploaded : ${uploaded}`)
  console.log(`Errors   : ${errors}`)
  console.log(`Total mapped: ${Object.keys(mapping).length}`)

  if (orphans.length) {
    console.log('\n=== Orphan media IDs (for cleanup ticket) ===')
    for (const o of orphans) {
      console.log(`  ${o.slug.padEnd(22)} oldId=${o.oldId} → newId=${o.newId}`)
    }
  }

  if (errors > 0) process.exit(1)
  process.exit(0)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
