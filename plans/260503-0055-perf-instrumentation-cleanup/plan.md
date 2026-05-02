---
title: Strip listing perf instrumentation (Phase 06 cleanup)
description: Remove temporary [guides-perf] and [tours-perf] after()/console.log instrumentation from listing page handlers per Phase 06 decision rule (both routes warm p95 <300ms).
status: completed
priority: P3
effort: ~15m
branch: master
tags: [cleanup, perf, instrumentation]
created: 2026-05-03
completed: 2026-05-03
deploy: heritageguiding-platform-nt092hnny (commit 490d4d6)
outcome: instrumentation-removed-routes-clean
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

Post-deploy `nt092hnny` (Ready 2026-05-03 01:11 UTC+2):
1. ✅ Source tree grep `[guides-perf]` / `[tours-perf]` / `PERF-MEASURE` → 0 hits.
2. ✅ Smoke check: 24 hits across 8 scenarios × 3 rounds → all HTTP 200.
3. ✅ Wall-clock distribution (warm hits 350-770 ms with cold-instance outliers) consistent with pre-strip cache-hit profile.
4. ✅ `vercel logs --since 5m` for the new deploy contains zero `*-perf` event strings.

## Outcome

Both listing pages now serve from cache without observability noise. `getCachedGuides` (revalidate=600, tags=['guides']) and `cachedFetchTours` (revalidate=300, tags=['tours']) remain untouched. Tag-revalidation hooks remain wired (packages/cms `revalidate-cache-tags-hook`).

## Risk Assessment

- **LOW × LOW** — instrumentation is purely observational; removing it cannot affect functional behavior.
- Mitigation: keep cache wraps + tag revalidation untouched.

## Open Questions

1. Should listings emit a permanent slim metric (e.g. Server-Timing header) for prod observability? **Defer.** Wall-clock + Vercel built-in metrics are sufficient for now.
