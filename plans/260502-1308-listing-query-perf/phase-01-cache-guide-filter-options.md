---
phase: 01
title: Cache getGuideFilterOptions (R1)
status: done
priority: P1
effort: 30m
depends: []
---

# Phase 01 — Cache `getGuideFilterOptions` (R1)

## Context Links
- Brainstorm § Recommended Path R1: `plans/reports/brainstorm-260502-1112-listing-query-perf.md`
- Baseline: `plans/260502-0048-instant-filter-feedback/baselines/guides-baseline-20260502.md`
- Existing pattern: `apps/web/lib/api/get-categories.ts:82`, `apps/web/lib/api/get-cities.ts:35`
- Hook: `packages/cms/hooks/revalidate-cache-tags-hook.ts`

## Overview
**Priority:** P1 (BLOCK gate)
**Status:** pending
**Brief:** Wrap `getGuideFilterOptions` in `unstable_cache` — output rarely changes; current 821 ms p95 is ~100% wasted hydration on every page render.

## Key Insights
- Function fetches all active guides at `depth:2, limit:200` just to extract three taxonomy lists (languages / specializations / areas).
- Flat 689–821 ms shape (130 ms spread) = fixed-cost full scan — perfect cache target.
- All three relevant `revalidateTag` hooks already wired: `guides.ts:29` (`['guides','tours']`), `categories.ts:29` (`['categories']`), `cities.ts:29` (`['cities']`).
- Dead code: `getCachedGuides` at `get-guides.ts:191` is exported but unused — decide delete vs keep.

## Requirements
**Functional**
- Wrap `getGuideFilterOptions(locale)` body in `unstable_cache(...)`.
- Cache key: `['guide-filter-options', locale]`.
- Tags: `['guides', 'categories', 'cities']`.
- `revalidate: 3600` (1 hour soft TTL; tag invalidation is the primary refresh path).
- Locale moved into key array per `get-categories.ts:82` pattern (locale stays first arg of inner fn; outer wrapper passes through).
- Decide on dead `getCachedGuides` (`get-guides.ts:191`) — delete unless a consumer is found.

**Non-functional**
- Output shape unchanged (`GuideFilterOptions` interface unchanged).
- No new public exports.
- `getGuideFilterOptions` call site in `apps/web/app/(site)/[locale]/(frontend)/guides/page.tsx:43` unchanged.

## Architecture
Surgical edit — same `unstable_cache` pattern as cities/categories. Inner `fetchGuideFilterOptions(locale)` performs work, exported `getGuideFilterOptions = unstable_cache(fetchGuideFilterOptions, ['guide-filter-options'], { tags, revalidate })`. Locale becomes part of the auto-generated key suffix.

## Related Code Files
**Modified:**
- `apps/web/lib/api/get-guides.ts` — wrap `getGuideFilterOptions` (line 207); optionally remove dead `getCachedGuides` (line 191)

**Created:** none
**Deleted:** `getCachedGuides` block at `get-guides.ts:191-195` (if no consumer found)

## Implementation Steps
1. Open `apps/web/lib/api/get-guides.ts`.
2. Rename existing `getGuideFilterOptions` → `fetchGuideFilterOptions` (private).
3. Export `getGuideFilterOptions = unstable_cache(fetchGuideFilterOptions, ['guide-filter-options'], { tags: ['guides', 'categories', 'cities'], revalidate: 3600 })`.
4. Confirm `unstable_cache` is already imported (it is — line 6).
5. Grep `getCachedGuides` repo-wide: `apps/web/**`, `packages/**`. If zero non-test consumers, delete the export (lines 187–195).
6. Run `npm run typecheck` (apps/web).
7. Run `npm run test -- get-guides` (apps/web).
8. Local smoke: `npm run dev`, visit `/sv/guides` and `/en/guides`; verify filter chips render.
9. Admin smoke: edit a guide → save → reload `/guides` → verify new specialization/area shows up immediately (revalidateTag round-trip).

## Todo List
- [ ] Read `get-categories.ts:82` and `get-cities.ts:35` to confirm pattern shape
- [ ] Rename `getGuideFilterOptions` → `fetchGuideFilterOptions`
- [ ] Wrap with `unstable_cache(['guide-filter-options'], { tags: ['guides','categories','cities'], revalidate: 3600 })`
- [ ] Grep for `getCachedGuides` consumers; delete if dead
- [ ] `npm run typecheck` clean
- [ ] `npm run test -- get-guides` passes
- [ ] Local smoke: `/sv/guides`, `/en/guides`
- [ ] Admin smoke: edit guide → reload → tag invalidation works
- [ ] Commit `perf(api): cache getGuideFilterOptions (R1)`

## Success Criteria
- `getGuideFilterOptions` returns identical shape pre/post-change.
- Staging p95 (re-measured in Phase 04): 821 ms → **<300 ms warm** (target <20 ms warm per brainstorm).
- Tag invalidation verified end-to-end (admin edit guide/category/city → next render fresh).
- TypeScript clean. All existing tests pass.

## Risk Assessment
- **Risk:** Stale filter options between guide edits. **Likelihood:** low (hooks wired). **Mitigation:** verify admin smoke; `revalidate: 3600` is the worst-case staleness window if hooks fail.
- **Risk:** Cache key collision across locales. **Likelihood:** none — `unstable_cache` auto-keys all fn args after the named key array.
- **Risk:** Cold start adds 600–800 ms once per hour per locale per Vercel region. **Likelihood:** known. **Mitigation:** acceptable; warm path dominates p95.

## Security Considerations
- Output never includes `email`/`phone` (function only extracts `languages`/`specializations`/`operatingAreas` — already safe).
- No new attack surface.

## Next Steps
- Phase 02 (R2 — tours depth+select+cache).
- Phase 04 re-measures and unblocks parent plan Phase 06.
