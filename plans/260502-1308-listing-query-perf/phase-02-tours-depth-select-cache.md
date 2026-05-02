---
phase: 02
title: getTours depth + select + cache (R2)
status: done
priority: P1
effort: 1.5–2h
depends: []
---

# Phase 02 — `getTours` depth + select + cache (R2)

## Context Links
- Brainstorm § Recommended Path R2: `plans/reports/brainstorm-260502-1112-listing-query-perf.md`
- Baseline: `plans/260502-0048-instant-filter-feedback/baselines/tours-baseline-20260502.md`
- Mapper consumed fields: `apps/web/lib/api/tour-payload-mapper.ts:170-201`
- Card consumed fields: `apps/web/components/tour/tour-card.tsx:51-138`
- Tours collection schema: `packages/cms/collections/tours.ts`
- Existing cache pattern: `apps/web/lib/api/get-categories.ts:82`
- Tag wiring: `packages/cms/collections/tours.ts:53` → `['tours']`; `guides.ts:29` → `['guides','tours']`

## Overview
**Priority:** P1 (BLOCK gate — single biggest factor in 1.4 s p95)
**Status:** pending
**Brief:** Drop `depth: 2` → `depth: 1` on `payload.find` at `get-tours.ts:124`, add a Payload `select` projection limited to fields the catalog card actually reads, then wrap result in `unstable_cache`.

## Key Insights
- Card consumes ONLY: `id, title, slug, shortDescription, pricing.basePrice, duration.hours, maxGroupSize, featured, accessibility.{wheelchairAccessible,hearingAssistance,visualAssistance}, images[primary].sizes.card.url + alt + blurDataUrl` — verified against mapper at `tour-payload-mapper.ts:170-201` and card at `tour-card.tsx:51-138`.
- `guide`, `categories`, `cities`, `neighborhoods` are NOT consumed by catalog card — pure waste at `depth:2`.
- `WHERE` clauses on `categories.slug` / `cities.slug` (at `get-tours.ts:66, 74`) are query-time joins — they continue to work at `depth:1`; only result hydration is reduced.
- `select` cardinality bounded: filters = categories ⊗ cities ⊗ duration ⊗ accessible ⊗ sort ⊗ q ⊗ page. Hot keys (default sort, no filter, page 1) dominate.
- Open Q5 (brainstorm § 5): does `depth:1` populate `images[].image.sizes.card.url`? Payload media populates row + sizes (variants live on same row) at `depth:1` — must smoke-test before merge.

## Requirements
**Functional**
- Drop `depth: 2` → `depth: 1` at `get-tours.ts:124`.
- Add Payload `select` matching the mapper consumption set (see Architecture § Select Projection below).
- Wrap `getTours` body in `unstable_cache` keyed by `[JSON.stringify(filters), locale]`.
- Tags: `['tours']`. `revalidate: 300` (5 min).
- Existing call signatures unchanged: `getTours(filters: TourFilters, locale: string): Promise<ToursResponse>`.

**Non-functional**
- `apps/web/components/tour/__tests__/tour-card.test.tsx` passes unchanged.
- `apps/web/lib/api/__tests__/get-tours.test.ts` passes unchanged (integration, requires DB).
- `apps/web/components/seo/TourListSchema` (used at `tours/page.tsx:67`) renders identically.
- Card image rendering unchanged on staging (smoke).

## Architecture

### Select projection (Payload 3.81 select shape)
INCLUDE (set `true`):
- `id`, `title`, `slug`, `shortDescription`
- `pricing` (group → returns `{basePrice, ...}`)
- `duration` (group → returns `{hours, ...}`)
- `maxGroupSize`, `featured`, `bokunExperienceId`
- `accessibility` (group → returns `{wheelchairAccessible, hearingAssistance, visualAssistance, ...}`)
- `images` (array → row hydrated; `images[].image` follows depth:1)

EXCLUDE (omit / not in `select`):
- `description` (richText — large)
- `highlights`, `included`, `notIncluded`, `whatToBring` (array fields on richText/text — unused by card)
- `audienceTags`, `tourDifficulty` group fields not on card
- `logistics` (group)
- `seo` (group)
- `guide` (relationship)
- `categories` (relationship)
- `cities` (relationship)
- `neighborhoods` (relationship)
- `availability`, `minGroupSize`, `status` (status filter is in WHERE; not needed in result)
- `createdAt`, `updatedAt` (sort uses createdAt internally; Payload returns it regardless)

### Cache wrapper
```
fetchTours(filters, locale) → ToursResponse  // existing logic
getTours = unstable_cache(
  fetchTours,
  ['tours-list'],
  { tags: ['tours'], revalidate: 300 }
)
```
Per `get-categories.ts:82` pattern, args (`filters`, `locale`) auto-suffix the key. Filters are a plain object — `unstable_cache` JSON-serializes args, so cardinality is bounded by validated filter combinations.

### Tag invalidation
- `tours.afterChange` already calls `revalidateTag('tours', { expire: 0 })` (`packages/cms/collections/tours.ts:53` + `revalidate-cache-tags-hook.ts:33`).
- `guides.afterChange` calls `revalidateTag('tours')` too — covers cards that previously embedded guide info (no longer needed at depth:1, but keeps invariant safe).

## Related Code Files
**Modified:**
- `apps/web/lib/api/get-tours.ts` — at lines 112–144: rename body to `fetchTours`, add `select` to `payload.find`, drop `depth:2`→`depth:1`, export `getTours = unstable_cache(...)`.

**Read (no edit):**
- `apps/web/lib/api/tour-payload-mapper.ts:139-201` — verify consumed fields match `select`.
- `apps/web/components/tour/tour-card.tsx:51-138` — verify rendered fields match `select`.
- `packages/cms/collections/tours.ts` — verify field names exactly (case + nesting).

**Created / Deleted:** none.

## Implementation Steps
1. Re-read mapper at `tour-payload-mapper.ts:170-201` and card at `tour-card.tsx:51-138`; lock the field-set list above.
2. Rename existing `getTours` body to private `fetchTours`.
3. Modify `payload.find` call:
   - `depth: 2` → `depth: 1`
   - Add `select: { id: true, title: true, slug: true, shortDescription: true, pricing: true, duration: true, maxGroupSize: true, featured: true, bokunExperienceId: true, accessibility: true, images: true }`
4. Add `import { unstable_cache } from 'next/cache'` at top.
5. Export `getTours = unstable_cache(fetchTours, ['tours-list'], { tags: ['tours'], revalidate: 300 })`.
6. Run `npm run typecheck` — fix any inferred-type drift caused by `select`.
7. Run `npm run test -- get-tours tour-card` (apps/web).
8. **Smoke Q5 — image sizes:** local `npm run dev`, hit `/sv/tours`, devtools network tab inspect a card `<img src>`. Must end in `…-card.jpg` (or whatever the configured `card` size suffix is), NOT the original. If empty or wrong size → `select: { images: { image: true } }` may be needed — Payload behavior on array-of-upload at `depth:1` requires verification.
9. Smoke filtered routes: `/sv/tours?categories=history`, `/en/tours?cities=stockholm&q=walking`, `/de/tours?duration=120&accessible=true`. Cards render identically pre/post.
10. Smoke admin: edit a published tour title → save → reload `/tours` → new title visible (tag invalidation).
11. Commit `perf(api): tours depth:1 + select projection + unstable_cache (R2)`.

## Todo List
- [ ] Confirm mapper field set (re-read `tour-payload-mapper.ts:170-201`)
- [ ] Verify exact field names against `packages/cms/collections/tours.ts`
- [ ] Rename `getTours` body → `fetchTours`
- [ ] Apply `depth: 1` + `select` projection
- [ ] Wrap with `unstable_cache(['tours-list'], { tags: ['tours'], revalidate: 300 })`
- [ ] `npm run typecheck` clean
- [ ] `tour-card.test.tsx` passes
- [ ] `get-tours.test.ts` passes (integration, with DB)
- [ ] **Smoke Q5: confirm `images[].image.sizes.card.url` populated at depth:1**
- [ ] Smoke 4 filter combos render identical cards
- [ ] Smoke admin tour edit → tag invalidation works
- [ ] Commit

## Success Criteria
- Staging p95 (re-measured in Phase 04): 1396 ms → **<300 ms warm** (target <200 ms per brainstorm; cold 400–600 ms acceptable).
- All existing tests pass without modification — if `tour-card.test.tsx` fails, the `select` is wrong (missing field), not the test.
- Manual QA: `/tours` and 3+ filter combos render identical cards pre/post.
- Tag invalidation verified end-to-end.

## Risk Assessment
- **Risk (HIGH likelihood × LOW impact):** `select` omits a field the mapper or card silently uses. **Mitigation:** field set derived from concrete code reads (mapper lines + card lines); tests catch regressions; manual smoke covers visual.
- **Risk (LOW × MEDIUM):** Q5 — `depth:1` doesn't populate `images[].image.sizes.card.url`. **Mitigation:** smoke step 8 explicitly checks; fallback is `select: { images: { image: true } }` or restore `depth: 2` on the images array path.
- **Risk (MEDIUM × MEDIUM):** Cache poisoning — bad data cached for up to 5 min × no edit. **Mitigation:** any tour edit triggers `revalidateTag('tours')`. Manual rollback: bump cache key (e.g., `['tours-list-v2']`) or call `revalidateTag('tours')` via `/api/revalidate`.
- **Risk (LOW × LOW):** Vercel Data Cache budget pressure from `q`/`page` cardinality. **Mitigation:** monitor in Phase 04; brainstorm Q3 — option to drop `q`/`page` from key on followup.
- **Risk (LOW × HIGH):** `getFeaturedTours` (`get-featured-tours.ts`) shares `tours` tag and would be invalidated by edits — already current behavior, no change.

**Rollback:** `git revert` of single function. If cache poisoning persists post-revert, bump cache key in followup commit OR call `revalidateTag('tours')` via existing `/api/revalidate` route.

## Security Considerations
- `select` excludes nothing user-sensitive (no PII on tours).
- Cache keys derived from validated `TourFilters` (Zod-validated upstream at `validateTourFilters`), so attacker cannot inject arbitrary key cardinality.
- No regression on `status: published` filter (still in WHERE clause at `get-tours.ts:60`).

## Next Steps
- Phase 03 (R3 — guides depth+select + indexes), independent.
- Phase 04 re-measures and unblocks parent plan Phase 06.
