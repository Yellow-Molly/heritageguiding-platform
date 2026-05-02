---
title: Cache getGuides for /guides listing (Option A)
description: Wire /guides + load-more action to existing getCachedGuides; add 10 min revalidate failsafe. Target getGuides warm p95 <100ms (cache hit) vs current 500-600ms.
status: in-progress
priority: P2
effort: ~30m
branch: master
tags: [perf, cache, follow-up]
created: 2026-05-03
predecessor: plans/260502-2215-perf-measurement-fix/
baseline: plans/260502-0048-instant-filter-feedback/baselines/guides-after-deferred.md
---

# Option A — Cache getGuides for /guides listing

## Problem

`getGuides` warm p95 ≈ 500-600ms. Dominant cost is `payload.find({ depth:1 })` hydration. Predecessor plan converged on Option A (cache wrap with filter-aware keys) as the next move.

## Discovery

`getCachedGuides` **already exists** at `apps/web/lib/api/get-guides.ts:213`:
```ts
export const getCachedGuides = unstable_cache(
  getGuides,
  ['guides-list'],
  { tags: ['guides'] }
)
```

But:
1. `/guides/page.tsx:41` calls `getGuides` **directly**, bypassing the cache.
2. `guide-load-more-action.ts:20` (load-more server action) also calls `getGuides` directly.
3. `getCachedGuides` has **no `revalidate`** — relies solely on tag invalidation.

`unstable_cache` auto-keys by call args (locale + filter object), so the existing wrap is already filter-aware.

## Solution

Three small edits:

1. **`get-guides.ts`** — add `revalidate: 600` to `getCachedGuides` options (10 min failsafe). Update doc comment to drop "homepage only" framing.
2. **`guides/page.tsx`** — swap import + call: `getGuides` → `getCachedGuides`.
3. **`guide-load-more-action.ts`** — same swap; load-more pagination across the same filter set should hit the same cache entries.

## Why minimal

- Existing `unstable_cache` wrap is the project's established pattern (12 files use it). DRY.
- Args auto-keyed → no manual `[locale, language, ...]` key-list needed.
- Tag `['guides']` already wired to `revalidateTag('guides')` via packages/cms `revalidate-cache-tags-hook.ts` (fires on guide upsert/delete).
- 600s revalidate covers tourCount drift (tour CRUD doesn't tag-bust guides, but staleness ≤ 10 min is acceptable).

## Phases

| # | Title | Status | Effort |
|---|---|---|---|
| 01 | Plan + implement + commit | in-progress | 30m |
| 02 | Measure staging post-deploy | pending | 30m |

## Gate

`getGuides` warm p95 < 200 ms (cache hit) on staging post-deploy.
- Target was <300ms in predecessor; cache hit should be sub-50ms in practice.
- If gate fails, fall back to Option C (denormalize tourCount).

## Files Changed

- `apps/web/lib/api/get-guides.ts` (+1 line, +comment update)
- `apps/web/app/(site)/[locale]/(frontend)/guides/page.tsx` (1 line: import + call)
- `apps/web/components/guide/guide-load-more-action.ts` (1 line: import + call)

## Out of scope

- Tours listing cache (similar pattern, separate plan if needed).
- Stripping `[guides-perf]` instrumentation (parent plan's Phase 06 cleanup).
- Edge-cache vs function-cache tradeoff investigation (open question 3 from baseline).

## Risk Assessment

- **LOW × LOW** — adds revalidate to existing cache wrap; tag invalidation already proven (homepage uses same cache).
- **Stale tourCount up to 10 min** — acceptable; tours don't change frequently.
- **Cardinality** — filter-key space dominated by unfiltered traffic; estimated low six-figure max keys, well within Next.js cache memory.

## Measurement Protocol (Phase 02)

- Re-run staging hits **without** cache-busting nonce so the function-level cache can hit.
- Sequential round (warm cache hits): same 8 scenarios × 5 rounds.
- Parallel round (cold instances): 8 × 4 in-flight.
- Pull `vercel logs` for `[guides-perf] guides;dur` events.
- Compare against `guides-after-deferred.md` (~500-600ms warm p95 estimate).

## Open Questions

1. Vercel CDN edge-cache hit rate on `/guides` in production — if CDN already absorbs repeats, function cache win is incremental.
2. Should tours `afterChange` revalidate `guides` tag for tourCount accuracy? (Option C territory; defer.)
