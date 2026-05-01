/**
 * Phase 03 — Tour Geo + Category cleanup migration.
 *
 * Single idempotent script that:
 *   1. Pre-flight checks (schema, mapping coverage, derivable cities).
 *   2. Backfills `tours.cities` from `tour.neighborhoods[*].city`.
 *   3. Ensures the new canonical category rows exist (themes + activities).
 *   4. Rewrites tour↔category relations per `data/category-migration-map.json`,
 *      deduping merges.
 *   5. Updates icons + localized names on surviving categories.
 *   6. Deletes deprecated category rows once they have no remaining tour_rels.
 *   7. Triggers Next.js cache revalidation for `tours`, `categories`, `cities`,
 *      `guides`.
 *
 * Dry-run by default; pass --apply to write. Use --skip-prechecks as an escape
 * hatch only when you've manually verified the failing precheck.
 *
 * Usage:
 *   npx tsx --require ./scripts/patch-next-env.cjs scripts/migrate-tour-geo-and-categories.ts
 *   npx tsx --require ./scripts/patch-next-env.cjs scripts/migrate-tour-geo-and-categories.ts --apply
 */
import fs from 'fs'
import path from 'path'
import { getPayload, payloadConfig as config } from './payload-bootstrap'
import {
  loadTaxonomy,
  loadMigrationMap,
  allTaxonomySlugs,
  slugTypeMap,
  type Taxonomy,
  type MigrationMap,
} from './lib/load-category-mapping'
import { deriveCityIdsFromNeighborhoods } from './lib/derive-tour-cities'
import { computeTourCategoryRewrite } from './lib/compute-tour-category-rewrite'

const APPLY = process.argv.includes('--apply')
const SKIP_PRECHECKS = process.argv.includes('--skip-prechecks')
// On re-runs, editors may have polished category names/icons via the admin UI.
// By default we leave existing metadata alone; pass --force-meta to overwrite
// from data/category-taxonomy.json.
const FORCE_META = process.argv.includes('--force-meta')

// Suppress in-hook revalidateTag calls — they fail outside Next.js request
// context anyway, and we trigger /api/revalidate explicitly at the end.
const SCRIPT_CONTEXT = { context: { disableRevalidation: true } } as const
const REVALIDATE_URL = process.env.REVALIDATE_URL || 'http://localhost:3000/api/revalidate'
const REVALIDATE_SECRET =
  process.env.REVALIDATION_SECRET || process.env.PAYLOAD_SECRET || ''

// ── Output summary collected throughout the run ───────────────────────────
interface MigrationSummary {
  startedAt: string
  applied: boolean
  preflight: { ok: boolean; errors: string[]; warnings: string[] }
  toursWithBackfilledCities: number
  newCategoriesCreated: number
  categoriesUpdated: number
  toursWithRewrittenRelations: number
  categoriesDeleted: number
  categoriesSkippedDelete: number
  revalidate: { ok: boolean; tags: string[]; error?: string }
}

const summary: MigrationSummary = {
  startedAt: new Date().toISOString(),
  applied: APPLY,
  preflight: { ok: false, errors: [], warnings: [] },
  toursWithBackfilledCities: 0,
  newCategoriesCreated: 0,
  categoriesUpdated: 0,
  toursWithRewrittenRelations: 0,
  categoriesDeleted: 0,
  categoriesSkippedDelete: 0,
  revalidate: { ok: false, tags: [] },
}

function log(msg: string) {
  console.log(msg)
}

// ── Type helpers (no `any`) ───────────────────────────────────────────────
type IdLike = number | string

interface MinimalCategory { id: IdLike; slug: string }
interface MinimalCity { id: IdLike; slug: string }

function isMinimalCategory(x: unknown): x is MinimalCategory {
  return !!x && typeof x === 'object' && 'id' in x && 'slug' in x
}

// ── Pre-flight ────────────────────────────────────────────────────────────
async function runPreflight(
  payload: Awaited<ReturnType<typeof getPayload>>,
  taxonomy: Taxonomy,
  map: MigrationMap,
): Promise<{ ok: boolean; errors: string[]; warnings: string[] }> {
  const errors: string[] = []
  const warnings: string[] = []

  // Schema: Tour collection has `cities` field
  const toursCollection = payload.config.collections.find((c) => c.slug === 'tours')
  const hasCitiesField = toursCollection?.fields?.some(
    (f) => 'name' in f && f.name === 'cities',
  )
  if (!hasCitiesField) errors.push('Tours collection is missing the `cities` field — apply Phase 01 schema first')

  // Cities: must have ≥3 (stockholm, sigtuna, uppsala)
  const cities = await payload.find({ collection: 'cities', limit: 100, depth: 0 })
  const citySlugs = new Set(cities.docs.map((c) => c.slug))
  for (const required of ['stockholm', 'sigtuna', 'uppsala']) {
    if (!citySlugs.has(required)) {
      errors.push(`Required city "${required}" missing — run scripts/seed-sigtuna-uppsala-cities.ts`)
    }
  }

  // Every DB category must be either:
  //   (a) covered by the migration map (legacy slug awaiting rewrite/delete), or
  //   (b) one of the new canonical taxonomy slugs (already-migrated rows from
  //       a previous partial run). Anything else is an unknown row that the
  //       script wouldn't know how to handle.
  const allCategories = await payload.find({ collection: 'categories', limit: 1000, depth: 0 })
  const liveSlugs = allCategories.docs.map((c) => c.slug)
  const mapKeys = new Set(Object.keys(map))
  const taxonomySlugs = new Set(allTaxonomySlugs(taxonomy))
  for (const slug of liveSlugs) {
    if (!mapKeys.has(slug) && !taxonomySlugs.has(slug)) {
      errors.push(`Category "${slug}" in DB but not in migration map nor taxonomy`)
    }
  }

  // Every published tour can derive ≥1 city from its neighborhoods
  const tours = await payload.find({
    collection: 'tours',
    where: { status: { equals: 'published' } },
    limit: 1000,
    depth: 2,
  })
  const orphans: string[] = []
  for (const t of tours.docs) {
    const cityIds = deriveCityIdsFromNeighborhoods(t.neighborhoods as never)
    if (cityIds.length === 0) orphans.push(t.slug)
  }
  if (orphans.length) {
    errors.push(`Published tours with 0 derivable cities: ${orphans.join(', ')}`)
  }

  // Every taxonomy slug should be referenced by something (warn, not fail)
  const referenced = new Set<string>()
  for (const e of Object.values(map)) {
    if (e.action === 'merge' || e.action === 'keep') referenced.add(e.newSlug)
  }
  for (const slug of allTaxonomySlugs(taxonomy)) {
    if (!referenced.has(slug)) warnings.push(`taxonomy slug "${slug}" not referenced by any merge/keep — only fresh tour-tagging will populate it`)
  }

  return { ok: errors.length === 0, errors, warnings }
}

// ── Backfill Tour.cities ──────────────────────────────────────────────────
async function backfillTourCities(
  payload: Awaited<ReturnType<typeof getPayload>>,
): Promise<number> {
  const tours = await payload.find({
    collection: 'tours',
    limit: 1000,
    depth: 2,
  })

  let updated = 0
  for (const tour of tours.docs) {
    const cityIds = deriveCityIdsFromNeighborhoods(tour.neighborhoods as never)
    if (cityIds.length === 0) continue

    // Idempotency: skip if existing cities match the derived set.
    const existingIds = Array.isArray(tour.cities)
      ? tour.cities.map((c: unknown) => (typeof c === 'object' && c !== null && 'id' in c ? (c as { id: IdLike }).id : (c as IdLike)))
      : []
    const existingSet = new Set(existingIds.map(String))
    const derivedSet = new Set(cityIds.map(String))
    const same = existingSet.size === derivedSet.size && [...existingSet].every((x) => derivedSet.has(x))
    if (same) continue

    log(`  ${APPLY ? '+' : '~'} backfill cities on "${tour.slug}": [${cityIds.join(', ')}]`)
    if (APPLY) {
      await payload.update({
        collection: 'tours',
        id: tour.id,
        data: { cities: cityIds as number[] },
        ...SCRIPT_CONTEXT,
      })
    }
    updated++
  }
  return updated
}

// ── Ensure new canonical categories exist ─────────────────────────────────
async function ensureNewCategories(
  payload: Awaited<ReturnType<typeof getPayload>>,
  taxonomy: Taxonomy,
): Promise<{ slugToId: Map<string, IdLike>; created: number; updated: number }> {
  const slugToId = new Map<string, IdLike>()
  const typeMap = slugTypeMap(taxonomy)

  const allEntries = [...taxonomy.themes, ...taxonomy.activities]
  let created = 0
  let updated = 0

  for (const entry of allEntries) {
    const { docs } = await payload.find({
      collection: 'categories',
      where: { slug: { equals: entry.slug } },
      limit: 1,
      depth: 0,
    })

    if (docs.length === 0) {
      log(`  ${APPLY ? '+' : '~'} create category "${entry.slug}" (${typeMap.get(entry.slug)})`)
      if (APPLY) {
        // Create in default locale (sv), then patch en/de via locale-scoped updates.
        const doc = await payload.create({
          collection: 'categories',
          data: {
            slug: entry.slug,
            name: entry.name.sv,
            type: typeMap.get(entry.slug)!,
            icon: entry.icon,
          },
          ...SCRIPT_CONTEXT,
        })
        await payload.update({
          collection: 'categories',
          id: doc.id,
          locale: 'en',
          data: { name: entry.name.en },
          ...SCRIPT_CONTEXT,
        })
        await payload.update({
          collection: 'categories',
          id: doc.id,
          locale: 'de',
          data: { name: entry.name.de },
          ...SCRIPT_CONTEXT,
        })
        slugToId.set(entry.slug, doc.id)
      } else {
        slugToId.set(entry.slug, '<would-create>')
      }
      created++
    } else {
      const existing = docs[0]
      slugToId.set(entry.slug, existing.id)
      if (!FORCE_META) {
        log(`  = keep existing meta on "${entry.slug}" (use --force-meta to overwrite)`)
        continue
      }
      // Refresh icon + localized names from the JSON taxonomy.
      log(`  ${APPLY ? '~' : '?'} force-overwrite meta on "${entry.slug}" (icon=${entry.icon})`)
      if (APPLY) {
        await payload.update({
          collection: 'categories',
          id: existing.id,
          data: { icon: entry.icon, type: typeMap.get(entry.slug)! },
          ...SCRIPT_CONTEXT,
        })
        for (const loc of ['sv', 'en', 'de'] as const) {
          await payload.update({
            collection: 'categories',
            id: existing.id,
            locale: loc,
            data: { name: entry.name[loc] },
            ...SCRIPT_CONTEXT,
          })
        }
      }
      updated++
    }
  }

  return { slugToId, created, updated }
}

// ── Rewrite Tour↔Category relations ───────────────────────────────────────
async function rewriteTourCategoryRelations(
  payload: Awaited<ReturnType<typeof getPayload>>,
  map: MigrationMap,
  slugToNewId: Map<string, IdLike>,
  taxonomySlugs: Set<string>,
): Promise<number> {
  const tours = await payload.find({ collection: 'tours', limit: 1000, depth: 2 })
  let touched = 0

  for (const tour of tours.docs) {
    const oldCats = Array.isArray(tour.categories) ? tour.categories : []
    const validCats = oldCats.filter(isMinimalCategory)

    const { newIds, changed } = computeTourCategoryRewrite(
      validCats,
      map,
      slugToNewId,
      taxonomySlugs,
    )
    if (!changed) continue

    log(`  ${APPLY ? '~' : '?'} rewrite "${tour.slug}" categories: [${validCats.map((c) => c.slug).join(', ')}] -> [${newIds.join(', ')}]`)
    if (APPLY) {
      await payload.update({
        collection: 'tours',
        id: tour.id,
        data: { categories: newIds as unknown as number[] },
        ...SCRIPT_CONTEXT,
      })
    }
    touched++
  }
  return touched
}

// ── Delete deprecated categories ──────────────────────────────────────────
async function deleteDeprecatedCategories(
  payload: Awaited<ReturnType<typeof getPayload>>,
  map: MigrationMap,
): Promise<{ deleted: number; skipped: number }> {
  // Both `delete` and `merge` action sources should be removed:
  //   - `delete`: slug is purged outright (location-as-category, etc.)
  //   - `merge`: slug's tour relations were rewritten to the merge target,
  //     leaving the source row orphaned. Without this, the categories table
  //     still contains the duplicate semantic noise the plan set out to fix.
  // `keep` action (single survivor in our map: `family-friendly`) is preserved.
  const toDelete = Object.entries(map)
    .filter(([, e]) => e.action === 'delete' || e.action === 'merge')
    .map(([slug]) => slug)
  let deleted = 0
  let skipped = 0

  for (const slug of toDelete) {
    const { docs } = await payload.find({
      collection: 'categories',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
    })
    if (docs.length === 0) continue
    const cat = docs[0]

    // Confirm no tour still references it.
    const refs = await payload.find({
      collection: 'tours',
      where: { 'categories.slug': { equals: slug } },
      limit: 1,
      depth: 0,
    })
    if (refs.totalDocs > 0) {
      log(`  ! skip delete "${slug}" — still referenced by ${refs.totalDocs} tour(s)`)
      skipped++
      continue
    }

    log(`  ${APPLY ? '-' : '?'} delete category "${slug}"`)
    if (APPLY) {
      await payload.delete({ collection: 'categories', id: cat.id, ...SCRIPT_CONTEXT })
    }
    deleted++
  }
  return { deleted, skipped }
}

// ── Cache revalidation ────────────────────────────────────────────────────
async function triggerRevalidation(): Promise<{ ok: boolean; tags: string[]; error?: string }> {
  const tags = ['tours', 'categories', 'cities', 'guides']
  if (!APPLY) {
    log(`  ~ would revalidate tags: ${tags.join(', ')}`)
    return { ok: true, tags }
  }
  if (!REVALIDATE_SECRET) {
    return { ok: false, tags, error: 'REVALIDATION_SECRET / PAYLOAD_SECRET not set' }
  }
  try {
    const res = await fetch(
      `${REVALIDATE_URL}?secret=${encodeURIComponent(REVALIDATE_SECRET)}&tag=all`,
      { method: 'POST' },
    )
    if (!res.ok) {
      return { ok: false, tags, error: `HTTP ${res.status}` }
    }
    return { ok: true, tags }
  } catch (err) {
    return {
      ok: false,
      tags,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  log(`\n=== Tour Geo + Category Migration ${APPLY ? '(APPLY)' : '(DRY RUN)'} ===\n`)

  const taxonomy = loadTaxonomy()
  const map = loadMigrationMap()
  const payload = await getPayload({ config })

  log('--- Pre-flight ---')
  const preflight = await runPreflight(payload, taxonomy, map)
  summary.preflight = preflight
  for (const w of preflight.warnings) log(`  ! warning: ${w}`)
  for (const e of preflight.errors) log(`  ✗ error:   ${e}`)
  if (!preflight.ok && !SKIP_PRECHECKS) {
    log('\nAborting due to pre-flight errors. Use --skip-prechecks to override (only after manual review).')
    writeSummary()
    process.exit(1)
  }

  log('\n--- Backfill Tour.cities ---')
  summary.toursWithBackfilledCities = await backfillTourCities(payload)

  log('\n--- Ensure canonical categories ---')
  const { slugToId, created, updated } = await ensureNewCategories(payload, taxonomy)
  summary.newCategoriesCreated = created
  summary.categoriesUpdated = updated

  log('\n--- Rewrite Tour↔Category relations ---')
  summary.toursWithRewrittenRelations = await rewriteTourCategoryRelations(
    payload,
    map,
    slugToId,
    new Set(allTaxonomySlugs(taxonomy)),
  )

  log('\n--- Delete deprecated categories ---')
  const del = await deleteDeprecatedCategories(payload, map)
  summary.categoriesDeleted = del.deleted
  summary.categoriesSkippedDelete = del.skipped

  log('\n--- Revalidate caches ---')
  summary.revalidate = await triggerRevalidation()
  if (!summary.revalidate.ok) {
    log(`  ! revalidation failed: ${summary.revalidate.error}`)
  } else {
    log(`  ✓ revalidated: ${summary.revalidate.tags.join(', ')}`)
  }

  log('\n--- Summary ---')
  log(JSON.stringify({ ...summary, finishedAt: new Date().toISOString() }, null, 2))
  writeSummary()
  process.exit(0)
}

function writeSummary() {
  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  const dir = path.resolve(__dirname, '../plans/260426-1718-tour-geo-and-category-cleanup/migration-output')
  fs.mkdirSync(dir, { recursive: true })
  const file = path.join(dir, `migration-output-${ts}${APPLY ? '' : '-dryrun'}.json`)
  fs.writeFileSync(file, JSON.stringify({ ...summary, finishedAt: new Date().toISOString() }, null, 2))
  log(`\nSummary written to: ${file}`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  writeSummary()
  process.exit(1)
})
