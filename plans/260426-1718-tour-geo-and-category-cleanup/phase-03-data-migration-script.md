# Phase 03 — Data Migration Script

## Context Links

- `data/category-taxonomy.json` (Phase 02 output)
- `data/category-migration-map.json` (Phase 02 output)
- `packages/cms/collections/tours.ts` — needs new `cities` field (Phase 01)
- `cities`, `categories`, `neighborhoods`, `tours_rels` Postgres tables

## Overview

- **Priority:** P1 (depends on Phase 01 + 02)
- **Status:** pending
- **Effort:** 3h
- **Description:** Single idempotent script that backfills `tours.cities` from neighborhoods, applies category mapping (rename/merge/delete), and revalidates Next.js cache tags. Runs in dry-run by default.

## Key Insights

- All writes wrapped in a single Postgres transaction → automatic rollback on any failure.
- Category merge is a many-to-one tour_rels rewrite — must dedupe (a tour mapped to both `cultural-tours` AND `culture-history` collapses to one `culture-local-life` link).
- Tour↔Category and Tour↔Neighborhood both live in the polymorphic `tours_rels` table. Each row has `parent_id` (tour) plus exactly one of `categories_id`, `neighborhoods_id`, `cities_id`, `guide_id`. The script edits the relevant column only.
- `pre-flight` step: every tour must derive ≥1 city from its neighborhoods → cities link. If any tour has 0, the script aborts before writing.
- After the migration, fire revalidate via internal Next.js endpoint or direct `revalidateTag` call (script runs outside Next.js — easiest is to call `/api/revalidate` with the secret token).

## Requirements

### Functional
- CLI with flags: `--dry-run` (default), `--apply`, `--skip-prechecks` (escape hatch).
- Steps in order:
  1. **Pre-flight checks**:
     - Phase 01 schema applied (Tours has `cities` column? `cities` table has 3 rows?).
     - Mapping file covers all current category slugs.
     - Each published tour can derive ≥1 city via its neighborhoods.
  2. **Backfill `tours.cities`**: For each tour, set cities = `DISTINCT(neighborhoods.city_id)`.
  3. **Create new categories**: Insert any taxonomy slugs not present (with localized names from JSON, type theme/activity, icon).
  4. **Rewrite tour↔category relations**: Replace `categories_id` references using the mapping. Delete relations whose mapping is `delete`. Dedupe.
  5. **Delete deprecated categories**: Remove rows where `action: delete` AND mapping target is null AND no remaining tour_rels references.
  6. **Update icons / names on surviving categories**: If taxonomy specifies icon/translation updates, apply them.
  7. **Revalidate cache**: POST to `/api/revalidate` with token for tags `tours`, `categories`, `guides`.
- Outputs:
  - `migration-output-{timestamp}.json` summary (counts of inserts/updates/deletes per table).
  - Verbose log on stdout.

### Non-Functional
- Idempotent: running `--apply` twice does nothing on the second run (the rewrite step preserves slugs already in the canonical taxonomy; see `scripts/lib/compute-tour-category-rewrite.ts`).
- Safe-by-default: dry-run unless `--apply` passed.
- Per-document writes — NOT a single SQL transaction. Recovery on partial failure = idempotent re-run + `pg_dump` restore (see plan.md § Rollback).
- Locale-safe: Payload's localized fields stored in JSONB / locale-suffixed columns; the script writes via Payload Local API, not raw SQL, to keep i18n correct.
- Existing category metadata (icon, localized names) is preserved on re-runs by default. Pass `--force-meta` to overwrite from `data/category-taxonomy.json`.

## Architecture

```
scripts/migrate-tour-geo-and-categories.ts
  ├── readTaxonomyAndMapping()
  ├── runPreflightChecks()
  │     ├── schemaPresent()
  │     ├── mappingCoverageComplete()
  │     └── everyTourCanDeriveCity()  ← FAIL-STOP
  ├── backfillTourCities()             ← payload.update tour by tour
  ├── ensureNewCategoriesExist()       ← payload.create / find-or-create
  ├── rewriteTourCategoryRelations()   ← payload.update with deduped IDs
  ├── deleteDeprecatedCategories()     ← payload.delete (no orphans)
  ├── applyCategoryMetaUpdates()       ← icons, translations
  └── triggerCacheRevalidation()       ← POST /api/revalidate
```

## Related Code Files

**Create**
- `scripts/migrate-tour-geo-and-categories.ts` — main script
- `scripts/lib/load-category-mapping.ts` — JSON loader + Zod validator
- `scripts/lib/derive-tour-cities.ts` — neighborhood → city deduplication
- `plans/260426-1718-tour-geo-and-category-cleanup/backups/` — pg_dump snapshots

**Read for context**
- `packages/cms/collections/tours.ts`, `categories.ts`, `cities.ts`, `neighborhoods.ts`
- `apps/web/app/api/revalidate/route.ts`
- Existing import script: `scripts/import-tour-data.ts` (pattern reference)

## Implementation Steps

1. Set up Payload Local API entry: `import { getPayload } from 'payload'; const payload = await getPayload({ config });`
2. Implement `loadCategoryMapping()` with Zod validation; abort on any schema mismatch.
3. Implement pre-flight checks. Each returns `{ ok: boolean, errors: string[] }`. Combine; abort if any fail (unless `--skip-prechecks`).
4. Implement `backfillTourCities`:
   ```ts
   for (const tour of tours) {
     const cityIds = deriveCityIdsFromNeighborhoods(tour.neighborhoods);
     await payload.update({ collection: 'tours', id: tour.id, data: { cities: cityIds } });
   }
   ```
5. Implement category creation/upsert. Look up by slug; if missing, `payload.create({ collection: 'categories', data: { slug, name (localized), type, icon } })`.
6. Implement category-relation rewrite. For each tour, compute the new set of category IDs:
   ```ts
   const newSet = new Set<string>();
   for (const oldCat of tour.categories) {
     const action = mapping[oldCat.slug];
     if (action.action === 'merge' || action.action === 'keep') {
       newSet.add(slugToNewId[action.newSlug ?? oldCat.slug]);
     }
   }
   await payload.update({ collection: 'tours', id: tour.id, data: { categories: [...newSet] } });
   ```
7. Implement category deletion. Find all categories with `action: delete` in mapping. Confirm `tours_rels` count is 0 before delete. Skip with warning otherwise.
8. Implement metadata updates (icons + translation overrides).
9. Implement revalidation via fetch to `/api/revalidate` with `REVALIDATE_TOKEN` from env.
10. Add `--dry-run` mode: wrap all `payload.create/update/delete` in a `dryRun` switch that logs "would create/update/delete: {payload}" instead of executing.
11. Take a `pg_dump` snapshot before running `--apply`. Store in plan's `backups/` folder.
12. Run dry-run, capture output, attach to PR.
13. Run `--apply`, verify `migration-output-*.json` matches expectations.
14. Smoke test: `/tours` page renders without errors; admin shows clean category list.

## Todo List

- [x] Scaffold `scripts/migrate-tour-geo-and-categories.ts`
- [x] `loadCategoryMapping()` with Zod (`scripts/lib/load-category-mapping.ts`)
- [x] Pre-flight checks (schema, cities seeded, mapping coverage, derivable cities)
- [x] `backfillTourCities()` (uses `scripts/lib/derive-tour-cities.ts`, idempotent)
- [x] `ensureNewCategoriesExist()` (creates+localizes; reuses existing rows)
- [x] `rewriteTourCategoryRelations()` with dedup
- [x] `deleteDeprecatedCategories()` orphan-safe (skips if any tour still references)
- [x] `applyCategoryMetaUpdates()` (folded into `ensureNewCategoriesExist` — icon + sv/en/de names)
- [x] `triggerCacheRevalidation()` (POST /api/revalidate?tag=all; revalidate route now also accepts `cities`)
- [x] Dry-run mode + structured output JSON (writes to `plans/260426-1718-tour-geo-and-category-cleanup/migration-output/`)
- [ ] Pre-migration `pg_dump` snapshot in `backups/` (runtime — user)
- [ ] Run dry-run, attach output to PR (runtime — user)
- [ ] Run `--apply`, verify counts (runtime — user)
- [ ] Smoke test `/tours` and admin (runtime — user)

## Success Criteria

- All 10 published tours: `cities.length >= 1`.
- `categories` table count drops from 34 to 10 (6 themes + 4 activities), all clean slugs.
- No tour has 0 categories post-migration.
- `tours_rels` integrity intact (no orphan rows).
- `migration-output-*.json` produced; second `--apply` run is a no-op.
- `/tours` page renders, filter dropdown shows the 6 new themes.

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Translation loss on merged categories | Pre-merge, capture surviving translation per locale into JSON; validator confirms |
| Orphan tour with no categories after delete | Pre-flight: every tour must end with ≥1 mapped category — abort if any tour ends empty |
| Cache shows stale categories on prod | Step 7 hits `/api/revalidate` with all 3 tags |
| Script crashes mid-way | Per-doc writes are idempotent — re-run resumes safely; pg_dump snapshot is the disaster-recovery path |
| Dry-run drifts from apply behavior | Same code path with a single `dryRun` flag at the leaf write call |

## Security Considerations

- Script reads `DATABASE_URL` and `REVALIDATE_TOKEN` from `.env.local` — neither logged.
- No new public API surface.

## Next Steps

→ Phase 04 (filter UI) and Phase 05 (footer) can be developed in parallel branches; integration tested in Phase 06.
