---
title: Strip listing perf instrumentation (Phase 06 cleanup)
description: Remove temporary [guides-perf] and [tours-perf] after()/console.log instrumentation from listing page handlers per Phase 06 decision rule (both routes warm p95 <300ms).
status: in-progress
priority: P3
effort: ~15m
branch: master
tags: [cleanup, perf, instrumentation]
created: 2026-05-03
predecessor: plans/260503-0038-cache-getguides-listing/
parent: plans/260502-0048-instant-filter-feedback/phase-06-cleanup.md
---

# Strip listing perf instrumentation

## Why now

Parent plan's Phase 06 decision rule:
- p95 < 300ms → remove instrumentation entirely.

Both routes now meet the bar:
- `/guides` `getGuides` warm p95 = 18.6 ms (verified `qyizwjs3j` 2026-05-03).
- `/tours` `getTours` warm p95 = 10-65 ms (R1+R2+R3 changelog `5dd4b21`; wall-clock shape on `qyizwjs3j` consistent with cache hits).

Pre-strip /tours wall-clock check (n=40 sequential, no cache-bust):
- p50 ≈ 570 ms (matches /guides post-cache shape — render-bound, no DB hit).
- No regression.

## Scope

**Strip:**
- `apps/web/app/(site)/[locale]/(frontend)/guides/page.tsx` — remove `after()` blocks for `guides;dur`, `filterOptions;dur`, `total;dur`.
- `apps/web/app/(site)/[locale]/(frontend)/tours/page.tsx` — remove `after()` blocks for `categories;dur`, `cities;dur`, `tours;dur`, `total;dur`.

**Keep:**
- `getCachedGuides` wrap (just shipped).
- `cachedFetchTours` wrap (already in `get-tours.ts`).
- Tag-revalidation hooks.

**Out of scope:**
- Vercel log-aggregator drop investigation (open question; not blocking).
- Tours `afterChange` → `revalidateTag('guides')` for tourCount accuracy (defer until drift visible).

## Verification

Post-deploy:
1. `grep` source tree for `[guides-perf]` / `[tours-perf]` — must be 0 hits.
2. Hit `/guides` and `/tours` on staging — 200 responses, no console errors.
3. Spot-check wall-clock — should be unchanged from pre-strip (instrumentation overhead was sub-ms).

## Risk Assessment

- **LOW × LOW** — instrumentation is purely observational; removing it cannot affect functional behavior.
- Mitigation: keep cache wraps + tag revalidation untouched.

## Open Questions

1. Should listings emit a permanent slim metric (e.g. Server-Timing header) for prod observability? **Defer.** Wall-clock + Vercel built-in metrics are sufficient for now.
