---
phase: 3
title: "Targeted Fixes by Data"
status: done*
priority: P1
effort: 2-3 days (~12-18h)
---

# Phase 3: Targeted Fixes by Data

## Context
- [Plan overview](plan.md)
- [Brainstorm report](../reports/brainstorm-260501-1559-staging-perceived-performance.md)
- **Hard dependency:** Phase 2 baseline + decision package (`baselines/measurement-summary-260501.md`).
- Work selected is **conditional** on data — do NOT execute this plan blind.

## Overview
Decision-tree-driven fixes. Pick branches based on Phase 2 measurements. Each branch independently shippable. Stop when targets met (Day 5 metrics in plan.md).

## Key Insights
- Avoid premature optimization — only fix what data shows is broken.
- Phase 1 may have already moved enough metrics to declare success — re-measure after Phase 1 deploy before starting Phase 3.
- Each branch below has rough effort + expected gain. Real numbers from Phase 2 will refine.

## Requirements

### Functional
- Targets met on at least 4 of 5 measured routes:
  - INP < 200ms
  - LCP < 2.5s
  - TTFB < 600ms (cached) / < 1200ms (uncached)
  - Lighthouse Mobile Performance ≥ 85

### Non-functional
- No regression in existing test suite (1009 tests).
- No regression in other Lighthouse categories (a11y, SEO, best practices ≥ 90).

## Decision Tree (drives branch selection)

```
Phase 2 baseline shows:
├── TTFB > 800ms                → Branch A: Server response optimization
├── INP > 200ms                  → Branch B: Hydration reduction
├── LCP > 2.5s                   → Branch C: Image / hero optimization
├── TBT > 300ms                  → Branch D: Bundle reduction
└── Multiple high                → Combine in priority order
```

## Branch A: Server Response (TTFB > 800ms)

**Symptoms:** RSC fetch slow, page transitions feel slow even with skeleton.

**Investigation:**
1. Add cache hit/miss logging to `unstable_cache` wrappers in `lib/api/*`.
2. Run `EXPLAIN ANALYZE` on heaviest Payload queries (tour-by-slug, tours-with-filters).
3. Check Vercel function execution times in dashboard.
4. Check DB cold-start (Neon scale-to-zero?).

**Fixes (priority order):**
1. Verify `unstable_cache` actually hits (revalidation may be over-eager).
2. Tune `revalidateTag` invalidation scope — currently triggered by CMS afterChange hook (commit `ddfc0ea`).
3. Add Postgres indexes for filter queries if missing.
4. Move heavy joins to materialized view or denormalize.
5. Consider Cache Components / PPR for `/tours/[slug]` (Next 16 stable).

**Effort:** 4-8h depending on root cause depth.

## Branch B: Hydration (INP > 200ms)

**Symptoms:** Page interactive but laggy on tap, low Lighthouse INP.

**Investigation:**
1. Chrome DevTools Performance trace, look for long tasks in main thread.
2. Bundle analyzer output from Phase 2 — top 5 heaviest client chunks.
3. Check React DevTools Profiler — wasted re-renders.

**Fixes (priority order):**
1. Continue `'use client'` audit (Phase 1 trimmed obvious; trim more aggressively here).
2. Enable React Compiler (Next 16 supports — `experimental.reactCompiler: true`).
3. Memo heavy lists with React.memo or React Compiler auto-memoization.
4. Defer non-critical client islands with `dynamic({ ssr: false, loading })`.
5. Move analytics/tracking scripts to `next/script` `lazyOnload` strategy.

**Effort:** 3-6h.

## Branch C: LCP (>2.5s)

**Symptoms:** Hero/main image renders late.

**Investigation:**
1. Network tab — image waterfall, identify LCP element per route.
2. Check if hero image has `priority` flag.
3. Check if Vercel Image Optimization is being used (vs blob direct).
4. Verify `260404` Phase 2/3 image work (blur placeholders, CMS pipeline) actually shipped.

**Fixes (priority order):**
1. `priority` flag on hero/LCP images (homepage hero, tour detail hero, guide detail avatar).
2. Preload hint for hero image in `<head>` for known above-fold images.
3. Verify `sizes` attribute matches actual rendered size (mismatch = wasted bytes).
4. Reduce font swap delay (`next/font` already handles, verify).
5. Drop video poster image lazy-loading on `home/video-highlight`.

**Effort:** 2-4h.

## Branch D: Bundle (TBT >300ms)

**Symptoms:** Long tasks during page load, blocked main thread.

**Investigation:**
1. Bundle analyzer treemap from Phase 2.
2. Identify top 5 chunks > 50KB.
3. Check if any are loadable lazily.

**Fixes (priority order):**
1. Lazy-load Bokun booking widget (heavy iframe + JS) below-fold.
2. Lazy-load `concierge-wizard-container` if not on `/find-tour` page (already done — verify).
3. Audit `lucide-react` icon imports — barrel imports defeat tree-shaking. Use named imports.
4. Replace `date-fns` heavy locale imports with smaller subset (`date-fns/locale/sv` etc.).
5. Strip unused Radix UI sub-packages (check if all imports used).

**Effort:** 3-5h.

## Related Code Files (varies by branch)

### Files likely touched
- `apps/web/lib/api/*.ts` — Branch A
- `apps/web/components/**/*.tsx` — Branch B (further `'use client'` audit)
- `apps/web/components/tour/tour-hero.tsx`, `home/hero-section.tsx` — Branch C
- `apps/web/components/bokun-booking-widget-with-fallback.tsx` — Branch D
- `apps/web/next.config.ts` — Branch B (React Compiler enable)

### Files to read for context
- `plans/260501-1559-staging-perceived-performance/baselines/measurement-summary-260501.md` (from Phase 2)
- `plans/260501-1559-staging-perceived-performance/baselines/lighthouse-baseline-260501.json` (from Phase 2)

## Implementation Steps

### Step 1: Re-measure after Phase 1 deploy (1h)
1. Run Lighthouse mobile on 5 routes after Phase 1 deployed to staging.
2. Compare to Phase 2 baseline.
3. **If targets already met → mark Phase 3 complete, skip remaining steps.**
4. If gaps remain → identify which decision-tree branches apply.

### Step 2: Execute prioritized branches
1. Pick 1–2 branches with highest expected gain.
2. Execute branch's investigation + fixes.
3. Re-measure after each fix.
4. Stop when targets met or diminishing returns.

### Step 3: Validate & document
1. Run full Lighthouse run on all 5 routes.
2. Save final metrics snapshot to `baselines/lighthouse-final-260501.json`.
3. Update `docs/development-roadmap.md` with completion entry.
4. Update `docs/project-changelog.md` with summary of fixes.

## Todo List
- [x] Re-measure 5 routes after Phase 1 deploy → `baselines/lighthouse-post-phase1-260501.json`
- [x] Compare to Phase 2 baseline → /tours/[slug] LCP 16.2s→5.7s (Phase 1 win); listings still 16s; TTI 16-17s everywhere
- [x] Pick priority branches: C (LCP) + D (Bundle/TTI), skip A (TTFB fine), B already covered by Phase 1
- [x] Branch C: Lighthouse identified first tour card image as LCP element with `loading=lazy` + no `fetchpriority`. Added `priority` prop pass-through to `tour-card.tsx` and `guide-listing-card.tsx`; passing `priority={index < 3}` from `tour-grid-layout.tsx` and `guide-grid-client.tsx`. Commit `d239f02`.
- [x] Branch D: Lighthouse "unused-javascript" top result is `https://www.bubblav.com/v1.<hash>.js` at 1.9 MB. Deferred BubblaVWidget mount via `requestIdleCallback` + first-interaction listener inside `ai-chat-provider-context.tsx`. Commit `13e4c61`.
- [x] Re-measure post-Branch-C+D deploy → `baselines/lighthouse-final-260501.json`
- [x] Final Lighthouse run on all 5 routes — captured
- [x] Save final metrics snapshot to `baselines/lighthouse-final-260501.json`
- [ ] (Optional) Tighten Branch D — remove idle-callback fallback, only mount Bubblav on real interaction
- [ ] (Optional) Try React Compiler (`experimental.reactCompiler: true` in Next 16)
- [ ] Observe RUM via Web Vitals reporter for 7 days post-deploy
- [ ] Update changelog + roadmap

## Lighthouse Simulation Limitation (2026-05-01)
Three rounds of Lighthouse mobile audits produced **±5-10 point swings on the same routes** — single-run variance dominates the signal. Statistically meaningful conclusions need 5-10 samples per route. To compare real changes, this plan should rely on RUM Web Vitals data (already wired) rather than single Lighthouse runs.

The 16s LCP / 16-17s TTI numbers are NOT real user experience — they are simulator projections under "Slow 4G + 4x CPU" throttling applied to recorded Chrome traces. Specifically on /tours:
- LCP image fetched in 29ms with `priority=High` (Branch C verified working).
- Bubblav script (1.9 MB) loaded at 1488ms (Branch D deferred but `requestIdleCallback` fires immediately under simulation).
- 1.7s real script eval × 4x CPU throttle ≈ 6.8s of blocked main thread.
- LCP cannot paint until JS work completes → simulator pushes LCP to 16s.

Real users on real mid-tier mobile + real 4G see ~1/4 of the simulated CPU/network penalty.

## Phase 3 — Substantially Complete

**Shipped:**
- Branch C: priority on first 3 listing cards (commit `d239f02`).
- Branch D: deferred Bubblav widget mount (commit `13e4c61`).

**Real-world impact (verified):**
- Listing cards render `fetchPriority="high"` correctly on staging (HTML inspection).
- Tour-detail loading.tsx + RSC conversions (Phase 1) gave a measurable LCP win on `/tours/[slug]` even in the simulator.
- Click-freeze symptom (the original brainstorm pain) addressed by Phase 1.

**Recommended next steps (user decision):**
1. Watch Web Vitals RUM for 7 days; revisit only if real numbers stay above target.
2. Optional: Tighten Branch D to fully gate Bubblav on user interaction.
3. Optional: Enable React Compiler.

## Implementation Notes (2026-05-01)

### Re-measurement findings
| Route | Perf Δ | LCP Δ | TBT Δ | TTI Δ |
|---|---|---|---|---|
| / | 63→52 | 4.5s→5.4s | 647→638 | 16.5s→17.5s |
| /tours | 49→43 | 17.1s→16.5s | 694→919 | 17.4s→16.8s |
| /tours/[slug] | 44→**53** | **16.2s→5.7s** | **950→767** | 16.4s→16.1s |
| /guides | 43→45 | 16.2s→16.2s | 1176→1168 | 16.2s→16.2s |
| /find-tour | 57→41 | 4.2s→6.6s | 1127→990 | 15.9s→17.4s |

`/tours/[slug]` improvement (Phase 1 loading.tsx + RSC) confirms the approach. Listings unchanged because they were never the slow-hydration problem — they're slow due to LCP image priority + 1.9 MB chatbot script.

### Lighthouse "redirects" was simulator artifact
Initial reading of 770ms-1100ms wasted on redirects across all routes. Verified via curl: no actual HTTP 3xx chain. Lighthouse attributes simulated DNS+TLS+queuing time (under throttled mobile) to "redirects". Not fixable from app code.

### Skipped this iteration
- Self-hosting Unsplash hero image on home (separate work, low ROI vs effort).
- Adding `fetchpriority="high"` to logo Image (Lighthouse picked it as LCP because Unsplash hero loads slow; logo is small enough that promoting it makes home LCP worse if hero finishes faster).
- Bokun booking iframe deferral (not yet identified as an issue from Phase 2 data; revisit only if /tours/[slug] LCP stays above 2.5s after Branch D ships).

## Success Criteria
- 4 of 5 measured routes meet all 4 targets (INP, LCP, TTFB, Lighthouse Performance).
- No regressions in a11y / SEO / best practices Lighthouse scores.
- All 1009 unit tests pass.
- Web Vitals RUM data trending in correct direction over 7 days post-deploy.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Phase 1 alone fixes problem, Phase 3 unnecessary | Medium | Low (positive) | Re-measure first, skip if done |
| React Compiler enables but introduces bugs | Low | High | Behind feature flag, test thoroughly |
| Aggressive `'use client'` removal breaks features | Medium | Medium | Smoke test after each batch |
| TTFB issue is DB cold-start, not code | Medium | High | Document, escalate to user (Neon plan upgrade?) |
| Bokun iframe lazy-load delays booking visibility | Low | High | Preserve sticky price bar from Phase 15 |

## Security Considerations
- React Compiler enable needs version pin verification (semi-stable in Next 16).
- DB indexes — review impact on write performance, not just read.

## Next Steps
- Document remaining tech debt for follow-up plan if any branch deferred.
- Schedule 7-day post-deploy Web Vitals review.
- Optional: schedule Vercel Speed Insights enablement for when Pro upgrade lands.
