/**
 * Validate the category taxonomy + migration map for internal consistency.
 *
 * Checks:
 *   1. Both files parse against their Zod schema.
 *   2. Every `merge`/`keep` in the map points to a slug that exists in the taxonomy.
 *   3. Every taxonomy slug ends up referenced by at least one map entry
 *      (catches orphaned new slugs that nothing maps to).
 *   4. No duplicate slugs across themes + activities.
 *
 * Optional: pass --against=<path-to-current-slugs.json> to confirm the live
 * DB's slug list is fully covered by the map.
 *
 * Usage:
 *   npx tsx scripts/validate-category-mapping.ts
 *   npx tsx scripts/validate-category-mapping.ts --against=current-slugs.json
 */
import fs from 'fs'
import path from 'path'
import { z } from 'zod'

const TAXONOMY_PATH = path.resolve(__dirname, '../data/category-taxonomy.json')
const MAP_PATH = path.resolve(__dirname, '../data/category-migration-map.json')
const SLUG_RE = /^[a-z0-9-]+$/

const localizedName = z.object({
  sv: z.string().min(1),
  en: z.string().min(1),
  de: z.string().min(1),
})

const taxonomyEntry = z.object({
  slug: z.string().regex(SLUG_RE),
  icon: z.string().min(1),
  name: localizedName,
})

const taxonomySchema = z.object({
  themes: z.array(taxonomyEntry).min(1),
  activities: z.array(taxonomyEntry).min(1),
})

const mapEntry = z.discriminatedUnion('action', [
  z.object({ action: z.literal('merge'), newSlug: z.string().regex(SLUG_RE) }),
  z.object({ action: z.literal('keep'), newSlug: z.string().regex(SLUG_RE) }),
  z.object({ action: z.literal('delete'), reason: z.string().min(1) }),
])

const mapSchema = z.record(z.string().regex(SLUG_RE), mapEntry)

function readJson(p: string): unknown {
  const raw = fs.readFileSync(p, 'utf-8')
  return JSON.parse(raw)
}

function main() {
  const errors: string[] = []
  const warnings: string[] = []

  const taxonomyRaw = readJson(TAXONOMY_PATH)
  const taxonomy = taxonomySchema.parse(taxonomyRaw)
  const allSlugs = [...taxonomy.themes, ...taxonomy.activities].map((c) => c.slug)
  const slugSet = new Set(allSlugs)

  if (allSlugs.length !== slugSet.size) {
    errors.push('Duplicate slug detected within taxonomy')
  }

  const mapRaw = readJson(MAP_PATH)
  const map = mapSchema.parse(mapRaw)

  const referencedNewSlugs = new Set<string>()
  for (const [oldSlug, entry] of Object.entries(map)) {
    if (entry.action === 'merge' || entry.action === 'keep') {
      if (!slugSet.has(entry.newSlug)) {
        errors.push(`map["${oldSlug}"].newSlug = "${entry.newSlug}" not found in taxonomy`)
      } else {
        referencedNewSlugs.add(entry.newSlug)
      }
    }
  }

  for (const slug of allSlugs) {
    if (!referencedNewSlugs.has(slug)) {
      warnings.push(`taxonomy slug "${slug}" is not referenced by any merge/keep in the map`)
    }
  }

  // Optional: check coverage against a live slug list passed via --against=path.json
  const againstArg = process.argv.find((a) => a.startsWith('--against='))?.split('=')[1]
  if (againstArg) {
    const liveSlugs = readJson(path.resolve(process.cwd(), againstArg)) as string[]
    const mappedKeys = new Set(Object.keys(map))
    for (const slug of liveSlugs) {
      if (!mappedKeys.has(slug)) {
        errors.push(`live DB slug "${slug}" not present in migration map`)
      }
    }
  }

  console.log(`\n=== Category Mapping Validator ===`)
  console.log(`Taxonomy: ${taxonomy.themes.length} themes + ${taxonomy.activities.length} activities = ${allSlugs.length} slugs`)
  console.log(`Map:      ${Object.keys(map).length} old slugs covered`)
  console.log(`Actions:  merge=${Object.values(map).filter((e) => e.action === 'merge').length}, keep=${Object.values(map).filter((e) => e.action === 'keep').length}, delete=${Object.values(map).filter((e) => e.action === 'delete').length}`)

  if (warnings.length) {
    console.log(`\nWarnings:`)
    for (const w of warnings) console.log(`  ! ${w}`)
  }

  if (errors.length) {
    console.error(`\nErrors:`)
    for (const e of errors) console.error(`  ✗ ${e}`)
    process.exit(1)
  }

  console.log(`\n✓ All checks passed`)
}

main()
