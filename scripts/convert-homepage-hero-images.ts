/**
 * Convert raw homepage hero candidate photos to web-optimized, SEO-named JPEGs.
 *
 * Reads each image's embedded IPTC metadata (Headline / Caption / Keywords) via
 * ImageMagick to derive an SEO filename + alt text, then downscales/strips/compresses
 * to stay under the Vercel Blob 4.5 MB server-upload cap. Emits a manifest consumed
 * by scripts/import-homepage-hero-photos.ts.
 *
 * Usage:
 *   npx tsx scripts/convert-homepage-hero-images.ts [--dry-run]
 *
 * Requires ImageMagick 7 on PATH (`magick`), or set MAGICK_BIN to its full path.
 */
import fs from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'

const DRY_RUN = process.argv.includes('--dry-run')
const INPUT_DIR = path.resolve(__dirname, '../media/New image for the homepage before release')
const OUTPUT_DIR = path.resolve(__dirname, '../media/homepage-hero-optimized')
const MANIFEST_PATH = path.resolve(__dirname, '../data/homepage-hero-image-manifest.json')
const HERO_SOURCE = 'iStock-2200820707.jpg' // user-selected hero ("Boats in front of Stockholm")
const MAX_BYTES = Math.floor(4.5 * 1024 * 1024)
const MAX_DIM = 2560 // gives next/image headroom above its 1920 deviceSize cap
const QUALITY_LADDER = [82, 78, 72, 66]
const MAGICK = process.env.MAGICK_BIN || 'magick'

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

interface Iptc {
  headline: string
  caption: string
  keywords: string[]
}

/** Junk caption guard — iStock-503977946 carries a leftover CMS path as its caption */
const JUNK_CAPTION = /file_thumbview|\.php|^\s*$/i

function magick(args: string[]): string {
  return execFileSync(MAGICK, args, { encoding: 'utf-8', maxBuffer: 128 * 1024 * 1024 })
}

/** ASCII-fold Swedish + common diacritics so slugs stay URL-clean */
function asciiFold(s: string): string {
  return s
    .replace(/[åäàáâ]/gi, 'a')
    .replace(/[öòóô]/gi, 'o')
    .replace(/[éèêë]/gi, 'e')
    .replace(/[üùúû]/gi, 'u')
    .replace(/ç/gi, 'c')
    .replace(/ñ/gi, 'n')
}

function slugify(text: string, maxLen = 60): string {
  const full = asciiFold(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  if (full.length <= maxLen) return full
  // Truncate on a word boundary so slugs never end mid-word
  const cut = full.slice(0, maxLen)
  const lastDash = cut.lastIndexOf('-')
  return (lastDash > 0 ? cut.slice(0, lastDash) : cut).replace(/-$/, '')
}

/** A 1–2 word headline (e.g. "Old town") makes a weak SEO slug — prefer the caption then */
function isDescriptive(s: string): boolean {
  return s.split(/\s+/).filter(Boolean).length >= 3 || s.length >= 15
}

function readIptc(file: string): Iptc {
  const verbose = magick(['identify', '-verbose', file])
  const grab = (re: RegExp): string => {
    const m = verbose.match(re)
    return m ? m[1].trim() : ''
  }
  return {
    headline: grab(/Headline\[[^\]]*\]:\s*(.+)/),
    caption: grab(/Caption\[[^\]]*\]:\s*(.+)/),
    keywords: [...verbose.matchAll(/Keyword\[[^\]]*\]:\s*(.+)/g)].map((m) => m[1].trim()),
  }
}

function deriveSlug(iptc: Iptc, source: string): string {
  // Descriptive headline wins; a too-generic headline yields to a clean caption
  if (iptc.headline && isDescriptive(iptc.headline)) {
    const s = slugify(iptc.headline)
    if (s) return s
  }
  if (iptc.caption && !JUNK_CAPTION.test(iptc.caption)) {
    const s = slugify(iptc.caption)
    if (s) return s
  }
  if (iptc.headline) {
    const s = slugify(iptc.headline) // short headline still beats raw keywords
    if (s) return s
  }
  if (iptc.keywords.length) {
    const s = slugify(iptc.keywords.slice(0, 4).join(' '))
    if (s) return s
  }
  return slugify(path.basename(source, path.extname(source)))
}

function deriveAlt(iptc: Iptc): string {
  const raw = (iptc.caption && !JUNK_CAPTION.test(iptc.caption) ? iptc.caption : iptc.headline)
    .replace(/\s+/g, ' ')
    .trim()
  if (raw.length <= 125) return raw
  // Trim long alt text on a word boundary, drop trailing punctuation
  const cut = raw.slice(0, 125)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 60 ? cut.slice(0, lastSpace) : cut).replace(/[.,;:]$/, '')
}

function dimsOf(file: string): { width: number; height: number } {
  const [w, h] = magick(['identify', '-format', '%w %h', file]).trim().split(/\s+/).map(Number)
  return { width: w, height: h }
}

/** Resize/strip/compress; step quality down until under the Blob cap */
function convert(input: string, output: string): number {
  let bytes = Infinity
  for (const q of QUALITY_LADDER) {
    magick([
      input,
      '-auto-orient',
      '-resize', `${MAX_DIM}x${MAX_DIM}>`,
      '-strip',
      '-interlace', 'Plane',
      '-quality', String(q),
      output,
    ])
    bytes = fs.statSync(output).size
    if (bytes <= MAX_BYTES) break
  }
  return bytes
}

function main(): void {
  if (!fs.existsSync(INPUT_DIR)) throw new Error(`Input dir not found: ${INPUT_DIR}`)

  const files = fs.readdirSync(INPUT_DIR).filter((f) => /\.(jpe?g)$/i.test(f)).sort()
  console.log(`\n=== Convert Homepage Hero Images ${DRY_RUN ? '(DRY RUN)' : ''} ===`)
  console.log(`Found ${files.length} source images\n`)

  if (!DRY_RUN) fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  const seen = new Map<string, number>()
  const manifest: ManifestEntry[] = []

  for (const source of files) {
    const inPath = path.join(INPUT_DIR, source)
    const iptc = readIptc(inPath)

    let slug = deriveSlug(iptc, source)
    const n = (seen.get(slug) || 0) + 1
    seen.set(slug, n)
    if (n > 1) slug = `${slug}-${n}` // collision guard

    const filename = `${slug}.jpg`
    const alt = deriveAlt(iptc) || slug.replace(/-/g, ' ')
    const isHero = source === HERO_SOURCE

    if (DRY_RUN) {
      const d = dimsOf(inPath)
      console.log(`${isHero ? '★' : ' '} ${source}  ->  ${filename}`)
      console.log(`    alt: ${alt}`)
      console.log(`    src: ${d.width}x${d.height} | keywords: ${iptc.keywords.slice(0, 5).join(', ') || '—'}`)
      continue
    }

    const outPath = path.join(OUTPUT_DIR, filename)
    const bytes = convert(inPath, outPath)
    const { width, height } = dimsOf(outPath)
    manifest.push({ source, slug, filename, alt, caption: iptc.caption, keywords: iptc.keywords, isHero, width, height, bytes })
    console.log(`${isHero ? '★' : '+'} ${source} -> ${filename} (${width}x${height}, ${(bytes / 1024 / 1024).toFixed(2)} MB)`)
  }

  if (DRY_RUN) {
    console.log('\n[DRY RUN] No files written.')
    return
  }

  manifest.sort((a, b) => a.slug.localeCompare(b.slug))
  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true })
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n')

  const oversize = manifest.filter((m) => m.bytes > MAX_BYTES)
  console.log('\n=== Summary ===')
  console.log(`Converted: ${manifest.length}`)
  console.log(`Hero: ${manifest.filter((m) => m.isHero).map((h) => h.filename).join(', ') || 'NONE (check HERO_SOURCE)'}`)
  if (oversize.length) console.log(`⚠ Over 4.5 MB (Blob upload will reject): ${oversize.map((m) => m.filename).join(', ')}`)
  console.log(`Manifest: ${MANIFEST_PATH}`)
}

main()
