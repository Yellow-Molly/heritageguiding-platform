---
title: "Phase 2 Measurement Summary — Decision Package for Phase 3"
date: 2026-05-01
sources:
  - lighthouse-baseline-260501.json
  - bundle-analyzer-baseline-260501.md
  - web-vitals-baseline-260501.md
---

# Phase 2 Decision Package

## Lighthouse Mobile Baseline (5 staging routes)

| Route | Perf | LCP_ms | FCP_ms | TBT_ms | CLS | TTI_ms | TTFB_ms |
|-------|-----:|-------:|-------:|-------:|----:|-------:|--------:|
| `/sv` (home) | 63 | 4457 | 1382 | 647 | 0.101 | 16478 | 5 |
| `/sv/tours` | 49 | **17058** | 1609 | 694 | 0.101 | **17393** | 4 |
| `/sv/tours/[slug]` | 44 | **16162** | 1398 | **950** | 0.101 | **16356** | 4 |
| `/sv/guides` | 43 | **16157** | 1402 | **1176** | 0.101 | **16172** | 4 |
| `/sv/find-tour` | 57 | 4209 | 1402 | **1127** | 0.101 | **15883** | 5 |

Bold = exceeds Phase 3 target.

**Phase 3 targets:** INP < 200ms, LCP < 2.5s, TTFB < 600ms cached / 1200ms uncached, Lighthouse Mobile Performance ≥ 85.

## Findings

### TTFB is NOT the problem
TTFB is 4–5ms on every route. Server response is excellent — Vercel + Payload + Postgres are not bottlenecking. **Branch A (server response optimization) is NOT needed.**

### LCP is catastrophic on listing pages
- `/tours`, `/tours/[slug]`, `/guides` all show LCP ≈ 16–17s.
- `/` and `/find-tour` show LCP ≈ 4.2–4.5s (still above 2.5s target but order of magnitude better).
- Pattern: routes with image grids/galleries are the worst offenders.
- Hypothesis: hero/list images served unsized, no `priority`, blob fetches not waterfall-optimized, OR image processing pipeline (CMS → Vercel Image) doing per-request resize.

### TBT is consistently high
- 647–1176ms across all 5 routes. Target < 300ms.
- TTI 15–17s confirms heavy main-thread blocking.
- Bundle analyzer shows public site critical path JS ≈ 220 KB gzip (normal). The 15s TTI is NOT explained by JS size alone.
- Hypothesis: Third-party scripts (Bokun booking iframe, Bubblav AI chatbot) loading synchronously on every page → main thread pegged during init.

### CLS at threshold
0.101 on all routes — exactly at the failure boundary. Phase 1 loading.tsx skeletons may improve this once deployed.

### FCP is fine
~1.4s on every route. First HTML paint happens promptly.

## Top 3 Hypotheses for Phase 3

1. **Hero/list images not optimized** — missing `priority`, `sizes` mismatch, or non-Vercel-Image direct blob hits. **Branch C, priority 1.**
2. **Bokun + Bubblav scripts blocking main thread** — verify with Performance trace, defer with `next/script` `lazyOnload`. **Branch D, priority 2.**
3. **Listing pages render too many image components on first paint** — virtualize or paginate above the fold. **Branch C/D combo.**

## Phase 3 Branch Plan

| Branch | Run? | Reason |
|--------|------|--------|
| A — Server response | NO | TTFB 4–5ms, no problem |
| B — Hydration reduction | RE-MEASURE | Phase 1 RSC conversions may have moved this — measure after deploy |
| C — Image / hero LCP | **YES, FIRST** | LCP 16–17s on listings is the dominant pain |
| D — Bundle / TBT | **YES, SECOND** | 1.2s TBT + 16s TTI suggests script-blocking, not bundle size |

## Phase 1 Re-measurement Gate
Before starting Phase 3:
1. Deploy Phase 1 to staging.
2. Re-run Lighthouse mobile on the 5 routes above.
3. Compare LCP/TBT/TTI deltas. Phase 1 may move TBT down via fewer hydration boundaries (9 RSC conversions).
4. Adjust branch priorities if Phase 1 already meets targets on any route.

## Open Questions
1. Is Bokun iframe synchronous on tour detail page? (Phase 3 Branch D investigation)
2. Are CMS images going through Vercel Image Optimization or hitting blob directly? (Network tab inspection during Phase 3)
3. Is staging DB cold-starting? Despite TTFB looking good, this could surface under cold cache. (Test pages after 5+ min idle)
4. Why is `/find-tour` LCP only 4.2s while `/tours` is 17s, given both have lazy-loaded heavy widgets? (Compare images-vs-wizard rendering)

## Coordination with `260404-1815-performance-overhaul`
- `260404` Phase 5 (Lighthouse CI threshold restore): **BLOCKED** on missing GitHub Actions secrets.
- `gh secret list` returns empty. Recent CI runs all fail with "PAYLOAD_SECRET is required in production".
- User action required: set `DATABASE_URL`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_URL`, `BLOB_READ_WRITE_TOKEN` in repo Settings > Secrets and variables > Actions.
- Once set, threshold restore (0.7 → 0.9 in `lighthouserc.js:30`) is a 1-line change. Decision: **stays in `260404` Phase 5 — do not absorb into this plan.**
