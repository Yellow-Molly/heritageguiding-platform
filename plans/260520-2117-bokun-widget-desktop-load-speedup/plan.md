---
plan: bokun-widget-desktop-load-speedup
title: "Bokun Widget Desktop Load-Time Speedup (Approach A)"
description: "Reduce desktop perceived load of Bokun booking widget on tour-detail page from ~9-12s to ~3-4s by trimming artificial setTimeout and scoping a preconnect to the tour-detail route. Mobile path untouched."
status: complete
priority: P2
effort: <1d
branch: master
created: 2026-05-20
tags: [perf, bokun, tour-detail, desktop, lighthouse]
blockedBy: []
blocks: []
related:
  - plans/260517-0225-mobile-lcp-deepdive/      # Created the LazyBokunWidget wrapper (complete)
  - plans/260516-1746-staging-lighthouse-perf-seo/  # PSI guardrail context
context:
  brainstorm: plans/reports/brainstorm-260520-2117-bokun-widget-desktop-load-speedup.md
---

# Bokun Widget Desktop Load-Time Speedup

## Problem

Desktop tour-detail page shows Bokun booking widget skeleton for 5-10s before iframe paints. Root cause: `DESKTOP_LOAD_DELAY_MS = 7000` in `apps/web/components/lazy-bokun-widget.tsx:22` — an artificial setTimeout that pushes Bokun's main-thread work past Lighthouse's TTI window. Booking sidebar sits in initial viewport on `lg:` so users actively wait.

## Solution (Approach A — Minimal)

1. **Trim delay**: `DESKTOP_LOAD_DELAY_MS` 7000 → 1500ms (past LCP measurement window, accept TBT hit).
2. **Scope preconnect**: add `<link rel="preconnect" crossOrigin>` for `widgets.bokun.io` + `static.bokun.io` only on the tour-detail route. Keep global `dns-prefetch` in `[locale]/layout.tsx` as fallback.
3. **Mobile path**: untouched (IntersectionObserver, 400px rootMargin).

Expected: widget paints ~3-4s post-navigation (down from ~9-12s). Desktop PSI ~5-10pt drop on TBT/Speed Index — acceptable per brainstorm.

## Phases

| # | Phase | Status |
|---|---|---|
| 01 | [Implementation](./phase-01-implementation.md) — code change in 2 files | complete |
| 02 | [Validation](./phase-02-validation.md) — perf measurement, PSI delta, smoke tests | complete (2-4s paint, PSI within guardrail, all smoke pass) |

## Out of Scope

- Mobile IntersectionObserver path
- Eager `<link rel="preload">` of loader script
- Bypassing Bokun loader / direct iframe rendering
- Tour-card hover prefetch (Approach B — deferred until post-measurement)
- `performance.mark` / Sentry RUM instrumentation (separate follow-up)

## Success Criteria

- Desktop tour-detail Bokun iframe paints in < 4s p75 (manual DevTools verification).
- Desktop PSI for `/[locale]/tours/[slug]` does not drop more than 15pts vs baseline.
- Mobile path unchanged (IntersectionObserver still gates load).
- Cart pin, checkout modal, locale switch all functional post-change.

## Rollback

Single revert: restore `DESKTOP_LOAD_DELAY_MS = 7000` and remove the per-route preconnect lines. No data migrations, no schema changes.
