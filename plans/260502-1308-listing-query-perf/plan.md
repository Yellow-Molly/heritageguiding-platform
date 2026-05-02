---
title: Listing Query Performance — R1+R2+R3
description: Cache + depth/select projections + missing indexes to clear BLOCK gates on /tours and /guides
status: pending
priority: P1
effort: ~5-6h
branch: master
tags: [perf, payload, cache, postgres, listing]
created: 2026-05-02
---

# Listing Query Performance — R1+R2+R3

## Problem
Phase 01 baselines put `/tours` and `/guides` in **BLOCK** band:

| route | dominant metric | p95 | gate |
|---|---|---|---|
| /tours | `getTours` | 1396 ms | <300 ms |
| /guides | `getGuideFilterOptions` | 821 ms | <300 ms |
| /guides | `getGuides` | 695 ms | <300 ms (soft) |

Phase 06 of `plans/260502-0048-instant-filter-feedback/` is blocked on these landing.

## Solution
Three surgical changes — sequenced — per `plans/reports/brainstorm-260502-1112-listing-query-perf.md` § Recommended Path:

1. **R1** — wrap `getGuideFilterOptions` in `unstable_cache` (mirror `get-categories.ts:82`).
2. **R2** — drop `getTours` `depth:2`→`depth:1`, add `select` projection, wrap in `unstable_cache`.
3. **R3** — drop `getGuides` `depth:2`→`depth:1`, add `select`, add `index: true` to `tours.categories` + `guides.status` (Payload migration).

## Phases

| # | Title | Status | Effort | Deps |
|---|---|---|---|---|
| 01 | Cache `getGuideFilterOptions` (R1) | done | 30m | — |
| 02 | Tours depth + select + cache (R2) | done | 1.5–2h | — |
| 03 | Guides depth + select + indexes (R3) | done | 1.5h | — |
| 04 | Re-measure + close out | done — R1 PASS, R2 PASS warm, R3 partial (index applied; tour-count batch query is residual bottleneck) | 1h | 01, 02, 03 |

Phases 01–03 are independent; recommended order R1→R2→R3 lets each ship + re-measure on staging using existing `[tours-perf]` / `[guides-perf]` instrumentation. Do NOT remove instrumentation until Phase 04.

## Gate Criteria (from Phase 01 baselines)
- `getTours` p95 1396 → **<300 ms warm** on staging
- `getGuideFilterOptions` p95 821 → **<300 ms warm** on staging
- `getGuides` p95 695 → **<300 ms** on staging (soft)

## Context Links
- Brainstorm: `plans/reports/brainstorm-260502-1112-listing-query-perf.md`
- Baselines: `plans/260502-0048-instant-filter-feedback/baselines/{tours,guides}-baseline-20260502.md`
- Parent plan: `plans/260502-0048-instant-filter-feedback/plan.md` (Phase 06 blocked on this)
- Revalidation hook: `packages/cms/hooks/revalidate-cache-tags-hook.ts`

## Dependencies
- Existing `unstable_cache` patterns: `apps/web/lib/api/get-categories.ts:82`, `get-cities.ts:35`
- Existing tag wiring: `tours.afterChange` → `['tours']`; `guides.afterChange` → `['guides','tours']`; `categories.afterChange` → `['categories']`; `cities.afterChange` → `['cities']`
- Payload 3.81 `select` projection support
- Vercel Data Cache (Fluid Compute)

## Open Questions (lifted from brainstorm § 5)
1. Verify Payload auto-creates Postgres indexes for `index: true` (Phase 03 todo: `psql \d tours \d guides`).
2. Verify `tours_rels` / `guides_rels` FK indexes exist (Phase 03 todo).
3. `unstable_cache` key cardinality budget for `getTours` (Phase 04 monitor).
4. Locale-table join cost — out of scope.
5. `depth:1` populates `images[].image.sizes.card.url`? — Phase 02 smoke test.
6. `getTours` cold-path target — Phase 04 monitor; revalidate tunable.
7. Delete dead `getCachedGuides` at `get-guides.ts:191`? — Phase 01 decision.
