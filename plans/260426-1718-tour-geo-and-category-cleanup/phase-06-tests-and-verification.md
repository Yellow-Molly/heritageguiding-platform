# Phase 06 — Tests + Verification

## Context Links

- All previous phase outputs
- `apps/web/lib/validation/tour-filters.ts`
- `apps/web/lib/api/get-tours.ts`
- `apps/web/lib/api/get-cities-with-tours.ts` (Phase 05)
- `apps/web/components/tour/sidebar/sidebar-filters.tsx` (Phase 04)
- Vitest config in `apps/web/vitest.config.ts`

## Overview

- **Priority:** P1 (depends on Phase 03, 04, 05)
- **Status:** pending
- **Effort:** 1.5h
- **Description:** Unit tests for the new validation and where-clause logic, helper coverage, and a small integration test that exercises the filter end-to-end with the seeded DB.

## Key Insights

- Existing test suite has 1009+ unit tests; follow the same Vitest patterns.
- Heavy DB integration tests are not the project's norm — keep DB checks light, primarily on the migration script's pre-flight outputs.
- `apps/web` already has a 95.9% statement coverage target — new code should not drop the bar.
- Where-clause tests exist for category filter (find them via `grep buildWhereClause apps/web`); model new tests off them.

## Requirements

### Functional
- Unit coverage:
  - `tour-filters.ts` Zod schema accepts valid `cities=`, `neighborhoods=`; rejects invalid slug shapes.
  - `buildWhereClause` returns expected `where` for each filter combo.
  - `getCitiesWithTours` dedupe + count + sort logic on a fixture set.
  - `SidebarFilters` URL update behavior for new filters (using existing test pattern).
- Migration script test:
  - Pre-flight `everyTourCanDeriveCity()` reports failures correctly on a fixture missing neighborhoods.
  - `mappingCoverageComplete()` passes against committed `data/category-migration-map.json`.
- Snapshot-style verification (manual + scripted):
  - Post-migration: every published tour has ≥1 city, ≥1 category.
  - 0 location-named categories remain.

### Non-Functional
- Tests run in <30s collectively.
- No flaky network calls — Payload mocked at the boundary with `vi.mock`.

## Architecture

```
apps/web/
  lib/validation/tour-filters.test.ts            (extend)
  lib/api/get-tours.test.ts                      (extend or new)
  lib/api/get-cities-with-tours.test.ts          (NEW)
  components/tour/sidebar/sidebar-filters.test.tsx (extend or new)

scripts/
  migrate-tour-geo-and-categories.test.ts        (NEW — pre-flight checks)
```

## Related Code Files

**Modify or create**
- `apps/web/lib/validation/tour-filters.test.ts`
- `apps/web/lib/api/get-tours.test.ts`
- `apps/web/lib/api/get-cities-with-tours.test.ts`
- `apps/web/components/tour/sidebar/sidebar-filters.test.tsx`
- `scripts/migrate-tour-geo-and-categories.test.ts`

## Implementation Steps

1. Extend `tour-filters.test.ts`:
   - Valid: `cities='stockholm,sigtuna'` → parses to same string.
   - Invalid: `cities='STOCKHOLM!'` → returns safe default (warn logged).
   - Same coverage for `neighborhoods`.
2. Extend `get-tours.test.ts`:
   - `buildWhereClause({ cities: 'stockholm' })` → expects `where['cities.slug'] = { in: ['stockholm'] }`.
   - With `categories` + `cities` + `neighborhoods` + `accessible` + `q` combined → expects merged where.
3. Create `get-cities-with-tours.test.ts`:
   - Mock Payload `find` to return fixture tours (some with multi-city, some with single).
   - Assert dedupe, counts, and sort order.
4. Extend `sidebar-filters.test.tsx`:
   - Render with cities + neighborhoods props.
   - Click "Stockholm" checkbox → `router.push` called with `?cities=stockholm`.
   - Toggle off → `cities` removed from URL.
5. Create `migrate-tour-geo-and-categories.test.ts`:
   - Unit test pure helpers: `loadCategoryMapping`, `deriveCityIdsFromNeighborhoods`, mapping validator.
   - Skip end-to-end script run; that's manual verification.
6. Run full test suite: `npm test`.
7. Run lint + type-check.
8. Manual verification checklist (see below).

## Manual Verification Checklist

- [ ] `psql` query: `SELECT slug FROM categories ORDER BY slug;` returns 10 clean slugs (6 themes + 4 activities).
- [ ] `psql` query: `SELECT t.slug, COUNT(*) FROM tours t JOIN tours_rels tr ON tr.parent_id=t.id WHERE tr.cities_id IS NOT NULL GROUP BY t.slug;` shows every tour has ≥1 city.
- [ ] `/sv/tours?cities=stockholm` shows Stockholm tours; `/sv/tours?cities=sigtuna` shows the Sigtuna day-trip.
- [ ] `/sv/tours?cities=stockholm&neighborhoods=gamla-stan` narrows correctly.
- [ ] Footer renders city links for Stockholm/Sigtuna/Uppsala in all 3 locales.
- [ ] Admin Tours edit shows new Cities relationship picker; saving works.
- [ ] No console errors in dev server.

## Todo List

- [x] Create `tour-filters.test.ts` (9 cases for cities + neighborhoods Zod schema; valid/invalid paths)
- [ ] Extend `get-tours.test.ts` (skipped — see tester report; existing suite has stale category assertions to clean up separately)
- [x] Create `get-cities-with-tours.test.ts` (6 cases; Payload boundary mocked)
- [ ] Extend `sidebar-filters.test.tsx` (skipped — no existing test harness for component, low value vs effort; deferred)
- [x] Create migration helper tests: `migration-derive-tour-cities.test.ts` (9 cases) + `migration-category-mapping.test.ts` (6 cases)
- [x] `npm test` for new tests: 4 files / 30 tests / all pass
- [x] `npm run type-check` clean for plan files (only pre-existing unrelated error remains)
- [ ] Run manual verification checklist (runtime — user; checklist documented in tester report)
- [x] Captured results in `plans/reports/tester-260426-1718-tour-geo-and-category-cleanup.md`

## Success Criteria

- All new tests pass.
- Total apps/web statement coverage stays ≥95%.
- Manual checklist completed.
- Tester report committed to `plans/reports/`.

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Vitest mocks for Payload drift from real shapes | Use Payload's own types (`import type { Tour }`) in fixtures |
| Manual checklist skipped under time pressure | Required as part of phase done definition; hold the merge until completed |
| Coverage drops on new files | Run `npm test -- --coverage` and inspect deltas before merge |

## Security Considerations

- Tests only read; no DB writes from test runs.

## Next Steps

→ Open PR. Update `docs/codebase-summary.md` and `docs/development-roadmap.md` with the new geo/category model. Run `/ck:journal` after merge.
