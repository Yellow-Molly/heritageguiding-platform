/**
 * Upload web-optimized homepage hero images to Vercel Blob via the Payload Media
 * Local API — the same mechanism used for tour photos (scripts/import-tour-photos.ts).
 * The storage-vercel-blob plugin uploads each file to Blob; the Media afterChange
 * hook auto-generates blurDataUrl. Writes data/homepage-hero-media-mapping.json
 * (slug -> { mediaId, url, heroUrl, blurDataUrl, isHero, alt }) for wiring the hero.
 *
 * TARGET ENV: writes to whichever env's DATABASE_URL + BLOB_READ_WRITE_TOKEN are
 * live at runtime. patch-next-env.cjs loads apps/web/.env*, but shell-set vars win —
 * set the target env's creds explicitly to control where images land.
 *
 * Usage:
 *   npx tsx --require ./scripts/patch-next-env.cjs scripts/import-homepage-hero-photos.ts [--dry-run] [--allow-local]
 */
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { getPayload, payloadConfig } from './payload-bootstrap'

const DRY_RUN = process.argv.includes('--dry-run')
const ALLOW_LOCAL = process.argv.includes('--allow-local')
const OPTIMIZED_DIR = path.resolve(__dirname, '../media/homepage-hero-optimized')
const MANIFEST_PATH = path.resolve(__dirname, '../data/homepage-hero-image-manifest.json')
const MAPPING_PATH = path.resolve(__dirname, '../data/homepage-hero-media-mapping.json')
const MAX_BYTES = Math.floor(4.5 * 1024 * 1024)
const BATCH_DELAY_MS = 200
const JUNK_CAPTION = /file_thumbview|\.php/i

interface ManifestEntry {
  source: string
  slug: string
  filename: string
  alt: string
  caption: string
  keywords: string[]
  isHero: boolean
  width: number
  height: number
  bytes: number
}

interface MappingEntry {
  mediaId: number
  url: string
  blurDataUrl: string | null
  isHero: boolean
  alt: string
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Generate a tiny 8x6 base64 JPEG blur placeholder from an image buffer.
 * Done locally because the Media afterChange blur hook skips the relative,
 * access-controlled `/api/media/file/...` URLs these uploads produce.
 */
async function generateBlur(buffer: Buffer): Promise<string | null> {
  try {
    const blur = await sharp(buffer).resize(8, 6).jpeg({ quality: 20 }).toBuffer()
    return `data:image/jpeg;base64,${blur.toString('base64')}`
  } catch {
    return null
  }
}

async function main(): Promise<void> {
  console.log(`\n=== Upload Homepage Hero Images ${DRY_RUN ? '(DRY RUN)' : ''} ===\n`)

  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error(`Manifest not found: ${MANIFEST_PATH}\nRun convert-homepage-hero-images.ts first.`)
    process.exit(1)
  }
  const manifest: ManifestEntry[] = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'))
  console.log(`Manifest: ${manifest.length} images (hero: ${manifest.find((m) => m.isHero)?.filename || 'none'})`)

  // Env guard — without a Blob token, files land on local disk (relative URL) and
  // the blur hook is skipped (it only fetches absolute http(s) URLs). Refuse unless allowed.
  const hasBlob = !!process.env.BLOB_READ_WRITE_TOKEN
  if (!hasBlob && !DRY_RUN && !ALLOW_LOCAL) {
    console.error('\nBLOB_READ_WRITE_TOKEN is not set — images would be written to LOCAL DISK, not Vercel Blob,')
    console.error("and blur placeholders would be skipped. Set the target env's token, or pass --allow-local to override.")
    process.exit(1)
  }
  console.log(`Target Blob: ${hasBlob ? 'YES (storage-vercel-blob active)' : 'NO — LOCAL DISK'}`)
  const dbUrl = process.env.DATABASE_URL || ''
  console.log(`Database: ${dbUrl ? dbUrl.replace(/:\/\/[^@]*@/, '://***@') : '(default/local)'}`)

  // Guard split-brain: Blob token set (→ files go remote) but DB empty/local
  // (→ docs go to a different DB). Mapping would then point at orphaned docs.
  const dbIsLocal = !dbUrl || /localhost|127\.0\.0\.1/.test(dbUrl)
  if (hasBlob && dbIsLocal && !DRY_RUN && !ALLOW_LOCAL) {
    console.error('\nBlob token is set but DATABASE_URL is empty/local — media docs (local DB) would be split')
    console.error('from files (remote Blob). Set the matching env DATABASE_URL, or pass --allow-local to override.')
    process.exit(1)
  }

  if (DRY_RUN) {
    for (const m of manifest) {
      const exists = fs.existsSync(path.join(OPTIMIZED_DIR, m.filename))
      console.log(`  ${m.isHero ? '★' : '+'} ${m.filename}  [${exists ? 'file ok' : 'MISSING FILE'}]  alt="${m.alt}"`)
    }
    console.log('\n[DRY RUN] No uploads. Exiting.')
    process.exit(0)
  }

  const payload = await getPayload({ config: payloadConfig })

  // Idempotency: match existing media by FILENAME (unique per slug). Keying on alt
  // would risk a false match against unrelated media (e.g. a tour photo sharing a title).
  const { docs: existing } = await payload.find({
    collection: 'media',
    where: { filename: { in: manifest.map((m) => m.filename) } },
    limit: 10000,
    select: { filename: true },
  })
  const filenameToId = new Map<string, number>()
  for (const d of existing) {
    const fn = typeof d.filename === 'string' ? d.filename : ''
    if (fn) filenameToId.set(fn, d.id as number)
  }

  const mapping: Record<string, MappingEntry> = {}
  let uploaded = 0
  let skipped = 0
  let errors = 0

  for (let i = 0; i < manifest.length; i++) {
    const m = manifest[i]
    const filePath = path.join(OPTIMIZED_DIR, m.filename)
    if (!fs.existsSync(filePath)) {
      console.error(`  ! missing file: ${m.filename}`)
      errors++
      continue
    }
    const buffer = fs.readFileSync(filePath)
    if (buffer.length > MAX_BYTES) {
      console.error(`  ! ${m.filename} exceeds 4.5MB Blob cap — skip`)
      errors++
      continue
    }

    let mediaId: number
    const existingId = filenameToId.get(m.filename)
    if (existingId) {
      mediaId = existingId
      skipped++
      console.log(`  skip: ${m.filename} exists (id ${existingId})`)
    } else {
      try {
        const data: Record<string, unknown> = { alt: m.alt }
        if (m.caption && !JUNK_CAPTION.test(m.caption)) data.caption = m.caption
        const created = await payload.create({
          collection: 'media',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data: data as any,
          file: { data: buffer, mimetype: 'image/jpeg', name: m.filename, size: buffer.length },
        })
        mediaId = created.id as number
        uploaded++
        console.log(`  ${m.isHero ? '★' : '+'} [${uploaded}] ${m.filename} -> media ${mediaId}`)
      } catch (err) {
        errors++
        console.error(`  ! failed ${m.filename}:`, err instanceof Error ? err.message : err)
        continue
      }
    }

    // Re-fetch to get the canonical (proxied) url; this project serves all media
    // via /api/media/file/<filename> (no sharp in config → no responsive sizes).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc = (await payload.findByID({ collection: 'media', id: mediaId, depth: 0 })) as any

    // Auto-blur hook skips relative URLs, so generate locally and backfill the doc.
    let blurDataUrl: string | null = (doc.blurDataUrl as string) || null
    if (!blurDataUrl) {
      blurDataUrl = await generateBlur(buffer)
      if (blurDataUrl) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await payload.update({ collection: 'media', id: mediaId, data: { blurDataUrl } as any })
      }
    }

    mapping[m.slug] = {
      mediaId,
      url: (doc.url as string) || `/api/media/file/${m.filename}`,
      blurDataUrl,
      isHero: m.isHero,
      alt: m.alt,
    }

    if (i > 0 && i % 10 === 0) await delay(BATCH_DELAY_MS)
  }

  fs.mkdirSync(path.dirname(MAPPING_PATH), { recursive: true })
  fs.writeFileSync(MAPPING_PATH, JSON.stringify(mapping, null, 2) + '\n')

  console.log('\n=== Summary ===')
  console.log(`Uploaded: ${uploaded} | Skipped: ${skipped} | Errors: ${errors}`)
  console.log(`Mapping: ${MAPPING_PATH}`)

  const hero = Object.values(mapping).find((e) => e.isHero)
  if (hero) {
    console.log('\n┌─ HERO — hardcode in hero-section.tsx + image-blur-constants.ts ─')
    console.log(`│ src (url):   ${hero.url}`)
    console.log(`│ blurDataUrl: ${hero.blurDataUrl ? hero.blurDataUrl.slice(0, 48) + '…' : '(NONE — generation failed)'}`)
    console.log('└──────────────────────────────────────────────────────────────')
  }

  if (errors > 0) process.exit(1)
  process.exit(0)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
