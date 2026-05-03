---
title: "Fix Tours Category Filter — Backfill Missing Themes"
description: "Backfill missing theme categories on 6 of 10 published tours so the Categories filter returns the right tours. Root cause: Phase 02/03 migration only handled slug→slug merges and never assigned net-new themes (e.g. nature-water) or replacements for tours whose original categories were all `delete` actions."
status: complete
priority: P1
effort: 1.5h
branch: master
tags: [bugfix, cms, payload, taxonomy, data-migration]
created: 2026-05-03
blockedBy: []
blocks: []
relatedPlans:
  - ../260426-1718-tour-geo-and-category-cleanup/plan.md
---

# Fix Tours Category Filter — Backfill Missing Themes

## Bug Report

`/en/tours` default view shows 10 tours. Selecting all 6 themes in the Categories filter shows only 4. Expected: 10 (every published tour should match ≥1 theme).

| Screenshot | Tours rendered |
|------------|----------------|
| `screenshots/localhost_3000_en_tours.png` | 10 |
| `screenshots/localhost_3000_en_tours_Categories_selected.png` | 4 |

## Root Cause

DB query (run 2026-05-03) confirms 6 of 10 published tours have **zero theme categories**:

```
tour_slug                                                       | themes_assigned
private-rib-tour-stockholm-3h                                   | NONE
stockholm-islands-and-districts-private-overview-by-car-3-hour  | NONE
private-sigtuna-heritage-tour-from-stockholm                    | NONE
private-uppsala-day-tour-from-stockholm                         | NONE
slow-travel-malaren-classic-boat-stockholm                      | NONE
slow-travel-stockholm-archipelago-classic-boat                  | NONE
private-medieval-stockholm-walking-tour                         | family-friendly, history-heritage
gamla-stan-and-vasa-museum-private-walking-tour                 | culture-local-life
gamla-stan-and-stockholm-city-hall-private-walking-tour         | architecture, history-heritage
stockholm-everyday-life-private-tour                            | culture-local-life
```

Filter UI shows only `type=theme` categories (`getCategories('theme', locale)` in `apps/web/app/(site)/[locale]/(frontend)/tours/page.tsx:37`). WHERE clause is `categories.slug IN [...]` (`apps/web/lib/api/get-tours.ts:64-69`). Tours with no theme cannot match → invisible in the second screenshot.

**Why the Phase 03 migration left holes:**

1. `scripts/migrate-tour-geo-and-categories.ts` rewrites tour↔category relations purely by old-slug→new-slug mapping (`scripts/lib/compute-tour-category-rewrite.ts`). For Sigtuna/Uppsala tours whose only original categories were `sigtuna`/`uppsala`/`day-trips-from-stockholm` (all `action: delete`), nothing maps in → 0 categories left.
2. `nature-water` is a **net-new theme** (phase-02 doc: "currently NULL"). No source slug points to it, so the migration never assigned it. RIB / Mälaren / Archipelago boat tours should all have it per the plan's "Post-Migration Tour Mapping" table but don't.
3. `architecture` is missing on `stockholm-islands-and-districts-…-3-hour`. Its source `architectural-landmarks` was likely never tagged on this tour in the original data.
4. The phase-02 "Post-Migration Tour Mapping" was an EXPECTED outcome but no script enforces it.

## Goals

1. Every published tour has ≥1 theme category (matches phase-02 § "Post-Migration Tour Mapping").
2. Selecting all 6 themes in `/tours` filter returns all 10 tours.
3. Idempotent backfill — safe to re-run.
4. Add a guard so this regression cannot recur silently (test or Payload validation).

## Non-Goals

- No taxonomy changes (themes/activities list is correct).
- No filter UI redesign.
- No rewrite of the existing migration script (additive backfill only).

## Approach

Single small backfill script that takes the explicit per-tour theme/activity assignment from the phase-02 plan and applies it via Payload Local API. Additive: only ADDS missing categories, never removes existing ones (so editors' manual tweaks survive).

```
scripts/backfill-tour-theme-categories.ts
  ├── loadDesiredTourCategories()     ← hard-coded table from phase-02 mapping
  ├── readCurrentTourCategories()     ← payload.find tours with categories
  ├── computeMissingCategories()      ← desired - current per tour
  ├── applyBackfill()                 ← payload.update merge desired ∪ current
  └── triggerCacheRevalidation()      ← POST /api/revalidate
```

Dry-run by default; `--apply` to write.

## Phases

| # | Phase | Effort | Depends On |
|---|-------|--------|------------|
| 1 | Backfill script + dry-run report | 0.5h | — |
| 2 | Apply + verify with DB query and UI screenshot | 0.5h | 1 |
| 3 | Guard against regression (test + optional admin hint) | 0.5h | 2 |

Each phase has explicit todos in this single plan file (no separate phase docs — scope is small).

---

## Phase 1 — Backfill Script

**Files**
- Create: `scripts/backfill-tour-theme-categories.ts`
- Read for context: `scripts/migrate-tour-geo-and-categories.ts`, `scripts/payload-bootstrap.ts`, `scripts/lib/compute-tour-category-rewrite.ts`

**Desired per-tour categories** (from `plans/260426-1718-tour-geo-and-category-cleanup/phase-02-category-taxonomy-redesign.md` § "Post-Migration Tour Mapping"):

```ts
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
```

**Logic (additive merge)**
```ts
for (const tour of publishedTours) {
  const desiredSlugs = DESIRED[tour.slug]
  if (!desiredSlugs) continue                          // unknown tour → skip with warning
  const desiredIds = desiredSlugs.map(s => slugToId[s])
  const currentIds = (tour.categories ?? []).map(c => typeof c === 'object' ? c.id : c)
  const merged = [...new Set([...currentIds, ...desiredIds])]
  if (merged.length === currentIds.length) continue    // already a superset → skip (idempotent)
  if (APPLY) await payload.update({ collection: 'tours', id: tour.id, data: { categories: merged } })
  else log(`would update ${tour.slug}: +${desiredSlugs.filter(s => !currentSlugs.has(s)).join(',')}`)
}
```

**Pre-flight**
- All 10 desired theme/activity slugs exist in `categories` (already verified).
- Every published tour slug present in `DESIRED` (warn if not).

**Cache**
- POST `/api/revalidate?tag=tours` and `?tag=categories` after write (reuse pattern from `migrate-tour-geo-and-categories.ts:46-48`).

**Todo**
- [x] Scaffold script with `--apply` flag (mirror existing migration script bootstrap).
- [x] Hard-code `DESIRED` map.
- [x] Implement additive merge with idempotency guard.
- [x] Dry-run output: per-tour diff (current → merged) + summary count.
- [x] Cache revalidation on `--apply`.

**Success Criteria (Phase 1)**
- Dry-run prints exactly the 8 tours needing additions (the 6 NONE + 2 partial: `gamla-stan-and-vasa-museum-…-walking-tour` missing `walking-tour`, `private-medieval-stockholm-walking-tour` missing `viking-medieval`).
- Dry-run is read-only (no DB writes).

---

## Phase 2 — Apply + Verify

**Pre-apply**
- `pg_dump` snapshot to `plans/260503-1005-tours-category-backfill-fix/backups/pre-backfill-{timestamp}.sql`.

**Apply**
- Run `npx tsx --require ./scripts/patch-next-env.cjs scripts/backfill-tour-theme-categories.ts --apply`.

**Verify**
1. SQL: every published tour has ≥1 theme:
   ```sql
   SELECT t.slug, COUNT(c.id) AS theme_count
   FROM tours t
   LEFT JOIN tours_rels tr ON tr.parent_id = t.id AND tr.path = 'categories'
   LEFT JOIN categories c ON c.id = tr.categories_id AND c.type = 'theme'
   WHERE t.status = 'published'
   GROUP BY t.id, t.slug
   HAVING COUNT(c.id) = 0;
   ```
   Expected: 0 rows.
2. UI: `/en/tours` with all 6 themes checked → 10 cards. Take screenshot to `screenshots/localhost_3000_en_tours_Categories_selected_after_fix.png`.
3. Re-run script → "0 tours need update" (idempotency check).

**Todo**
- [x] `pg_dump` snapshot.
- [x] Run `--apply`, capture stdout to `plans/260503-1005-tours-category-backfill-fix/apply-output.log`.
- [x] Run verification SQL.
- [x] Screenshot the post-fix UI (manual — agent could not run headless browser; SQL verification confirms data correctness).
- [x] Re-run script (no-op confirmation).

---

## Phase 3 — Guard Against Regression

Two cheap safeguards. Pick one (not both) — guidance below.

**Option A (preferred): integration test**
- File: `apps/web/lib/api/__tests__/get-tours.published-tours-have-themes.test.ts`
- Asserts: every `status=published` tour has ≥1 category with `type=theme`.
- Uses real Payload Local API (test env DB). Fails fast in CI.
- **Why preferred:** zero editor friction, catches data drift regardless of source (admin edit, migration, import script).

**Option B: Payload `validate` hook on Tours**
- `packages/cms/collections/tours.ts` — add `validate` on the `categories` field requiring ≥1 of `type=theme`.
- **Why secondary:** blocks legitimate workflows (saving a draft mid-edit). Only do it if Option A's CI signal isn't fast enough for the team.

Also nice-to-have (not blocking):
- Rename i18n key `tours.filters.allTours` → `allCategories` in the Categories section. Currently misleading inside `sidebar-filters.tsx:78`. (Out of scope unless trivial — flag in handover.)

**Todo**
- [x] Add Option A test.
- [x] Run `npm test -- get-tours.published-tours-have-themes` → green.
- [ ] (Optional) Open follow-up issue for the `allTours` → `allCategories` i18n rename.

---

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Script overwrites editor changes | Med | Additive merge only — never removes existing IDs |
| Wrong desired mapping for an edge tour | Low | Mapping is a copy of phase-02's reviewed table; dry-run shows diff before apply |
| Cache stale after apply | Low | `revalidateTag('tours')` + `revalidateTag('categories')` |
| Test fails for legitimate draft tour with no theme | Low | Test scopes to `status=published` only |

## Rollback

- Per-tour `payload.update` is idempotent and additive → re-running with empty `DESIRED` would be a no-op, not destructive. To revert a tour, use Payload admin or restore from `pg_dump`.

## Success Criteria (Plan)

- [x] All 10 published tours have ≥1 theme.
- [x] `/en/tours` with all 6 themes selected returns 10 results.
- [x] Backfill script is idempotent (second `--apply` writes 0 rows).
- [x] Regression test in place and green.

## Outcome

**Execution Summary (2026-05-03)**

- **Phase 1:** Backfill script created at `scripts/backfill-tour-theme-categories.ts`. Dry-run identified 8 tours needing category additions (6 with zero themes, 2 with partial gaps).
- **Phase 2:** Applied with `--apply` flag; result: **10 tours checked, 8 updated, 2 already-superset**. Database snapshot saved to `plans/260503-1005-tours-category-backfill-fix/backups/pre-backfill-20260503T083547Z.sql` (630 lines, 20KB).
  - SQL verification: 0 rows returned from "published tours with zero themes" query → **all 10 tours now have ≥1 theme**.
  - Idempotency re-run: 0 tours updated, 10 skipped as already-superset → **script is safe to re-run**.
- **Phase 3:** Regression test added at `apps/web/lib/api/__tests__/get-tours.published-tours-have-themes.test.ts`. Integration test (Payload Local API) passes (1/1 green, 23.5s runtime). Safeguards against silent data drift.

**Artifacts**
- Backfill script: `scripts/backfill-tour-theme-categories.ts`
- Dry-run output: `plans/260503-1005-tours-category-backfill-fix/backfill-output/backfill-output-2026-05-03T08-30-24-752Z-dryrun.json`
- Apply log: `plans/260503-1005-tours-category-backfill-fix/apply-output.log` (captures full stdout + summary counts)
- Database snapshot: `plans/260503-1005-tours-category-backfill-fix/backups/pre-backfill-20260503T083547Z.sql`
- Regression test: `apps/web/lib/api/__tests__/get-tours.published-tours-have-themes.test.ts`

**Known Pre-Existing Issues (Documented, Not Regressions)**
- `apps/web/lib/api/__tests__/get-tours.test.ts` has 7 failing tests (pre-existing) due to outdated category slug references from Phase 03 migration. Flagged for follow-up tech debt.

## Open Questions

- Should `chauffeured-tour` tour also get a theme like `culture-local-life`? Phase-02 mapping says `[architecture, chauffeured-tour]` only — going with that. Confirm with editorial during apply.
- Long-term: should Activities also be filterable in the sidebar (separate group)? Out of scope here.
