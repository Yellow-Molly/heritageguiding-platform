/**
 * Backfill missing theme/activity categories on published tours.
 *
 * Phase 03 migration only handled slug→slug merges; tours whose original
 * categories were all `delete` (e.g. Sigtuna/Uppsala) ended up with zero
 * categories, and net-new themes (e.g. `nature-water`) were never assigned.
 * This script reads the explicit per-tour mapping from the phase-02 plan and
 * additively merges it into each tour's existing categories — never removes,
 * so editor tweaks survive.
 *
 * Dry-run by default; pass --apply to write.
 *
 * Usage:
 *   npx tsx --require ./scripts/patch-next-env.cjs scripts/backfill-tour-theme-categories.ts
 *   npx tsx --require ./scripts/patch-next-env.cjs scripts/backfill-tour-theme-categories.ts --apply
 */
import fs from 'fs'
import path from 'path'
import { getPayload, payloadConfig as config } from './payload-bootstrap'

const APPLY = process.argv.includes('--apply')

// Mirror the migration script's pattern: in-hook revalidateTag fails outside
// Next.js request context; we explicitly POST /api/revalidate at the end.
const SCRIPT_CONTEXT = { context: { disableRevalidation: true } } as const
const REVALIDATE_URL = process.env.REVALIDATE_URL || 'http://localhost:3000/api/revalidate'
const REVALIDATE_SECRET =
  process.env.REVALIDATION_SECRET || process.env.PAYLOAD_SECRET || ''

// ── Desired per-tour category slugs ───────────────────────────────────────
// Source of truth: plans/260426-1718-tour-geo-and-category-cleanup/
//                  phase-02-category-taxonomy-redesign.md § "Post-Migration Tour Mapping"
const DESIRED: Record<string, string[]> = {
  'private-rib-tour-stockholm-3h':                                  ['boat-tour', 'nature-water'],
  'private-medieval-stockholm-walking-tour':                        ['history-heritage', 'viking-medieval', 'walking-tour', 'family-friendly'],
  'private-sigtuna-heritage-tour-from-stockholm':                   ['history-heritage', 'viking-medieval', 'day-trip'],
  'private-uppsala-day-tour-from-stockholm':                        ['history-heritage', 'day-trip'],
  'gamla-stan-and-vasa-museum-private-walking-tour':                ['culture-local-life', 'walking-tour'],
  'gamla-stan-and-stockholm-city-hall-private-walking-tour':        ['architecture', 'history-heritage', 'walking-tour'],
  'slow-travel-malaren-classic-boat-stockholm':                     ['nature-water', 'boat-tour', 'day-trip'],
  'slow-travel-stockholm-archipelago-classic-boat':                 ['nature-water', 'boat-tour', 'day-trip'],
  'stockholm-everyday-life-private-tour':                           ['culture-local-life', 'walking-tour'],
  'stockholm-islands-and-districts-private-overview-by-car-3-hour': ['architecture', 'chauffeured-tour'],
}

// ── Type helpers ──────────────────────────────────────────────────────────
type IdLike = number | string

interface MinimalCategory { id: IdLike; slug: string }

function isMinimalCategory(x: unknown): x is MinimalCategory {
  return !!x && typeof x === 'object' && 'id' in x && 'slug' in x
}

interface BackfillSummary {
  startedAt: string
  applied: boolean
  toursChecked: number
  toursUpdated: number
  toursSkippedAlreadySuperset: number
  toursSkippedUnknown: string[]
  perTourDiffs: Array<{ slug: string; added: string[] }>
  preflight: { ok: boolean; missingDesiredSlugs: string[]; unmappedPublishedTours: string[] }
  revalidate: { ok: boolean; tags: string[]; error?: string }
}

const summary: BackfillSummary = {
  startedAt: new Date().toISOString(),
  applied: APPLY,
  toursChecked: 0,
  toursUpdated: 0,
  toursSkippedAlreadySuperset: 0,
  toursSkippedUnknown: [],
  perTourDiffs: [],
  preflight: { ok: false, missingDesiredSlugs: [], unmappedPublishedTours: [] },
  revalidate: { ok: false, tags: [] },
}

function log(msg: string) {
  console.log(msg)
}

async function buildSlugToIdMap(
  payload: Awaited<ReturnType<typeof getPayload>>,
): Promise<Map<string, IdLike>> {
  const { docs } = await payload.find({
    collection: 'categories',
    limit: 1000,
    depth: 0,
  })
  const m = new Map<string, IdLike>()
  for (const d of docs) m.set(d.slug, d.id)
  return m
}

async function runPreflight(
  payload: Awaited<ReturnType<typeof getPayload>>,
  slugToId: Map<string, IdLike>,
): Promise<void> {
  // Every desired slug must exist as a category row.
  const allDesiredSlugs = new Set(Object.values(DESIRED).flat())
  const missing = [...allDesiredSlugs].filter((s) => !slugToId.has(s))
  summary.preflight.missingDesiredSlugs = missing

  // Every published tour should be present in DESIRED (warn-level only).
  const tours = await payload.find({
    collection: 'tours',
    where: { status: { equals: 'published' } },
    limit: 1000,
    depth: 0,
  })
  const unmapped = tours.docs.filter((t) => !DESIRED[t.slug]).map((t) => t.slug)
  summary.preflight.unmappedPublishedTours = unmapped

  summary.preflight.ok = missing.length === 0
}

async function applyBackfill(
  payload: Awaited<ReturnType<typeof getPayload>>,
  slugToId: Map<string, IdLike>,
): Promise<void> {
  const tours = await payload.find({
    collection: 'tours',
    where: { status: { equals: 'published' } },
    limit: 1000,
    depth: 1,
  })
  summary.toursChecked = tours.docs.length

  for (const tour of tours.docs) {
    const desiredSlugs = DESIRED[tour.slug]
    if (!desiredSlugs) {
      summary.toursSkippedUnknown.push(tour.slug)
      log(`  ! skip unknown tour "${tour.slug}" (not in DESIRED)`)
      continue
    }

    const desiredIds = desiredSlugs
      .map((s) => slugToId.get(s))
      .filter((id): id is IdLike => id != null)

    const currentCats = Array.isArray(tour.categories) ? tour.categories : []
    const validCurrent = currentCats.filter(isMinimalCategory)
    const currentIds = validCurrent.map((c) => c.id)
    const currentSlugs = new Set(validCurrent.map((c) => c.slug))

    // Additive merge — preserve current order, append missing desired IDs.
    const seen = new Set<string>()
    const merged: IdLike[] = []
    for (const id of [...currentIds, ...desiredIds]) {
      const k = String(id)
      if (seen.has(k)) continue
      seen.add(k)
      merged.push(id)
    }

    if (merged.length === currentIds.length) {
      summary.toursSkippedAlreadySuperset++
      continue
    }

    const added = desiredSlugs.filter((s) => !currentSlugs.has(s))
    summary.perTourDiffs.push({ slug: tour.slug, added })
    log(`  ${APPLY ? '+' : '~'} update "${tour.slug}": +[${added.join(', ')}]`)

    if (APPLY) {
      await payload.update({
        collection: 'tours',
        id: tour.id,
        data: { categories: merged as unknown as number[] },
        ...SCRIPT_CONTEXT,
      })
    }
    summary.toursUpdated++
  }
}

async function triggerRevalidation(): Promise<{ ok: boolean; tags: string[]; error?: string }> {
  const tags = ['tours', 'categories']
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
    if (!res.ok) return { ok: false, tags, error: `HTTP ${res.status}` }
    return { ok: true, tags }
  } catch (err) {
    return { ok: false, tags, error: err instanceof Error ? err.message : String(err) }
  }
}

function writeSummary() {
  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  const dir = path.resolve(__dirname, '../plans/260503-1005-tours-category-backfill-fix/backfill-output')
  fs.mkdirSync(dir, { recursive: true })
  const file = path.join(dir, `backfill-output-${ts}${APPLY ? '' : '-dryrun'}.json`)
  fs.writeFileSync(file, JSON.stringify({ ...summary, finishedAt: new Date().toISOString() }, null, 2))
  log(`\nSummary written to: ${file}`)
}

async function main() {
  log(`\n=== Tour Theme Backfill ${APPLY ? '(APPLY)' : '(DRY RUN)'} ===\n`)

  const payload = await getPayload({ config })

  log('--- Pre-flight ---')
  const slugToId = await buildSlugToIdMap(payload)
  await runPreflight(payload, slugToId)

  if (summary.preflight.missingDesiredSlugs.length) {
    log(`  ✗ missing category slugs in DB: ${summary.preflight.missingDesiredSlugs.join(', ')}`)
    log('\nAborting: required categories do not exist. Run scripts/migrate-tour-geo-and-categories.ts first.')
    writeSummary()
    process.exit(1)
  }
  log(`  ✓ all ${new Set(Object.values(DESIRED).flat()).size} desired category slugs exist`)

  if (summary.preflight.unmappedPublishedTours.length) {
    log(`  ! published tours not in DESIRED (will skip): ${summary.preflight.unmappedPublishedTours.join(', ')}`)
  } else {
    log(`  ✓ every published tour is mapped in DESIRED`)
  }

  log('\n--- Backfill diff ---')
  await applyBackfill(payload, slugToId)

  log('\n--- Revalidate caches ---')
  summary.revalidate = await triggerRevalidation()
  if (!summary.revalidate.ok) {
    log(`  ! revalidation failed: ${summary.revalidate.error}`)
  } else if (APPLY) {
    log(`  ✓ revalidated: ${summary.revalidate.tags.join(', ')}`)
  }

  log('\n--- Summary ---')
  log(JSON.stringify({ ...summary, finishedAt: new Date().toISOString() }, null, 2))
  writeSummary()
  process.exit(0)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  writeSummary()
  process.exit(1)
})
