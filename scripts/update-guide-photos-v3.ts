/**
 * Patch the `photo` field on 7 existing guide records to point at the v3
 * web-optimized media uploaded in Phase 3.
 *
 * Targets only the 7 slugs whose photos were placeholders or were refreshed
 * since v2 import. Bio, credentials, specializations are left untouched —
 * v3 docx is byte-identical to v2 for these guides, so no content drift.
 *
 * Usage:
 *   npx tsx --require ./scripts/patch-next-env.cjs scripts/update-guide-photos-v3.ts [--dry-run]
 */
import fs from 'fs'
import path from 'path'
import { getPayload, payloadConfig } from './payload-bootstrap'

const DRY_RUN = process.argv.includes('--dry-run')
const MAPPING_PATH = path.resolve(__dirname, '../data/guide-photo-media-mapping.json')

const TARGETS = [
  'asa-ovrelid',
  'svante-bergqvist',
  'tommy-nilsson',
  'jack-voldstad',
  'sophie-sahlin',
  'anders-boysen',
  'annika-bernholm',
]

async function main(): Promise<void> {
  console.log(`\n=== Guide Photo Refresh v3 ${DRY_RUN ? '(DRY RUN)' : ''} ===\n`)

  const mapping: Record<string, number> = JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf-8'))

  const missing = TARGETS.filter((s) => !mapping[s])
  if (missing.length) {
    console.error(`Missing media IDs in mapping for: ${missing.join(', ')}`)
    process.exit(1)
  }

  const payload = await getPayload({ config: payloadConfig })
  let updated = 0
  let errors = 0

  for (const slug of TARGETS) {
    const newPhotoId = mapping[slug]
    try {
      const { docs } = await payload.find({
        collection: 'guides',
        where: { slug: { equals: slug } },
        limit: 1,
      })
      if (docs.length === 0) {
        console.warn(`  ! ${slug.padEnd(22)} not found in CMS — skipping`)
        continue
      }
      const guide = docs[0] as { id: number | string; photo?: number | { id: number } | null }
      const oldPhotoId =
        typeof guide.photo === 'number'
          ? guide.photo
          : guide.photo && typeof guide.photo === 'object'
            ? guide.photo.id
            : null

      if (oldPhotoId === newPhotoId) {
        console.log(`  = ${slug.padEnd(22)} already ${newPhotoId} — skipping`)
        continue
      }

      if (DRY_RUN) {
        console.log(`  ${slug.padEnd(22)} ${oldPhotoId ?? '—'} → ${newPhotoId}`)
        continue
      }

      await payload.update({
        collection: 'guides',
        id: guide.id,
        data: { photo: newPhotoId },
      })
      updated++
      console.log(`  ✓ ${slug.padEnd(22)} ${oldPhotoId ?? '—'} → ${newPhotoId}`)
    } catch (err) {
      errors++
      console.error(`  ! ${slug}:`, err instanceof Error ? err.message : err)
    }
  }

  console.log('\n=== Summary ===')
  console.log(`Updated : ${updated}`)
  console.log(`Errors  : ${errors}`)
  console.log(`Skipped : ${TARGETS.length - updated - errors}`)

  if (errors > 0) process.exit(1)
  process.exit(0)
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
