---
title: Instant Listing Filter Feedback
slug: instant-filter-feedback
date: 2026-05-02
status: in_progress
priority: high
related: [plans/260501-1559-staging-perceived-performance/]
brainstorm: plans/reports/brainstorm-260501-1949-instant-filter-feedback.md
blockedBy: []
blocks: []
---

# Instant Listing Filter Feedback

## Problem
Phase 1 perceived-performance work shipped `loading.tsx` skeletons, but `loading.tsx` does **not** fire on `searchParams` change — only path navigation. Filter clicks on `/tours` and `/guides` still wait for full server roundtrip before chip flips selected. User reported as "slow reaction" on mobile + desktop.

## Solution
Single React 19 `<FilterStateProvider>` with `useOptimistic` over `searchParams.toString()` + `useTransition` wrapping `router.push`. Chips/sidebar/drawer/sort/search consume one hook → instant visual flip + grid pending overlay. Server still authoritative; React 19 auto-reverts on conflict.

Full design rationale, alternatives, risks: see brainstorm report.

## Phases

| # | Title | Status | Effort | Deps |
|---|-------|--------|--------|------|
| 01 | Measurement instrumentation + staging baseline | **complete — BLOCK band on both routes** | 30m | — |
| 02 | Provider scaffold + shared overlay | complete | 45m | 02 |
| 03 | Tour catalog migration | complete | 1h | 02 |
| 04 | Guides catalog migration | complete | 45m | 02 |
| 05 | Tests + manual verification | tests complete; manual matrix pending | 45m | 03, 04 |
| 06 | Cleanup measurement + docs sync | **deferred until follow-up perf issues ship** | 20m | 05, follow-ups |

Total: ~3.5–4h. Phases 03 + 04 parallelizable after 02.

## Phase 01 outcome (2026-05-02)

Staging baseline (`baselines/{tours,guides}-baseline-20260502.md`):

| route | dominant metric | p95 | band |
|---|---|---|---|
| /tours | `getTours` | 1396 ms | **BLOCK** |
| /guides | `getGuideFilterOptions` | 821 ms | **BLOCK** |
| /guides | `getGuides` | 695 ms | ship+follow-up |

Implication: perception fix is in production but server roundtrip is too slow to justify removing instrumentation. Phase 06 is **blocked on**:
- `perf(api): optimize getTours — staging p95 1.4s`
- `perf(api): optimize getGuideFilterOptions — flat 800ms staging baseline`
- (softer) `perf(api): optimize getGuides — staging p95 695ms`

## Key Files
- New: `apps/web/components/tour/filter-state-provider.tsx`, `apps/web/components/shared/grid-pending-overlay.tsx`, `apps/web/app/(site)/[locale]/(frontend)/guides/guide-catalog-client.tsx`
- Modified (~12): tour filter components, sort, search, grid layouts, page.tsx (both routes), guide filter bar + drawer, tests

## Decision Rule (Phase 01 output gates Phase 06 follow-up)
- `getTours` p95 < 300ms → ship perception fix only
- 300–800ms → ship + open follow-up issue for query optimization
- \> 800ms → block ship; optimize query before merge

## Success Criteria
- Chip-click visual flip < 50ms (target <16ms)
- Grid pending overlay visible within 100ms of click
- No regression: deep-linking, browser back/forward, infinite scroll
- Lighthouse staging mobile: no LCP/TTI regression on `/tours`, `/guides`
- All existing tests pass + new optimistic-state assertion
