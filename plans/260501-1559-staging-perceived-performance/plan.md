---
title: "Staging Perceived Performance — Click→Freeze Fix"
description: "Eliminate 1–3s click-freeze symptom on mobile. Approach: ship navigation-feedback quick wins Day 1, measurement infrastructure Day 2, data-driven targeted fixes Day 3–5."
status: done*
priority: P1
effort: 3-5 days
branch: master
tags: [performance, ux, mobile, loading-states, hydration, measurement]
created: 2026-05-01
blockedBy: []
blocks: []
related:
  - plans/260404-1815-performance-overhaul/plan.md
  - plans/reports/brainstorm-260501-1559-staging-perceived-performance.md
---

# Staging Perceived Performance — Click→Freeze Fix

## Context
- **Brainstorm:** [`reports/brainstorm-260501-1559-staging-perceived-performance.md`](../reports/brainstorm-260501-1559-staging-perceived-performance.md)
- **Symptom:** 1–3s "frozen" feel after clicking nav links, tour/guide cards, buttons inside detail pages. Most severe on mobile.
- **Root cause:** Perceived performance gap — zero `loading.tsx`, no `useLinkStatus`, 64 client components (many static), Lighthouse CI broken.
- **Related plan:** `260404-1815-performance-overhaul` is in-progress with overlapping Lighthouse CI work (Phase 5 pending). This plan **coordinates, does not duplicate** — Phase 2 verifies `260404` Phase 5 status first.

## Approved Approach: C — Combined
Quick wins (Day 1) + measurement infrastructure (Day 2) + data-driven fixes (Day 3–5).

## Phases

| # | Phase | Status | Priority | Effort |
|---|-------|--------|----------|--------|
| 1 | [Quick Wins — Navigation Feedback](phase-01-quick-wins-navigation-feedback.md) | done | P0 | 1 day |
| 2 | [Measurement Infrastructure](phase-02-measurement-infrastructure.md) | done* | P1 | 1 day |
| 3 | [Targeted Fixes by Data](phase-03-targeted-fixes-by-data.md) | done | P1 | 2-3 days |

## Dependencies
- **Phase 1** independent — can start immediately, no blockers.
- **Phase 2** soft dependency on `260404-1815-performance-overhaul` Phase 5 (Lighthouse CI restore). If still pending, absorb that work; if complete, verify and skip.
- **Phase 3** strictly depends on Phase 2 baseline — without numbers, no targeted fixes.

> **Phase 2 done* note:** Tracks B (bundle analyzer), C (Web Vitals validation), and baseline capture COMPLETE. Track A (Lighthouse CI threshold restore in `260404` Phase 5) **BLOCKED** — original blocker (missing repository-scope secrets) FIXED in commit `0945a73` by scoping the workflow to the `Production` GitHub environment where the existing 4 env-scoped secrets live. New blocker surfaced: `generateStaticParams` for `/[locale]/guides/[slug]` hits Postgres at build time and the DB host is unreachable from GitHub runners (`ENETUNREACH ...:5432`, IPv6). This belongs in `260404` Phase 5 — needs DB IP allowlist, mock-DB build env, or `force-dynamic` on the affected route. Phase 3 unblocked here either way.

## Phase 11 Reuse (do NOT duplicate)
Already complete in Phase 11 + `260404-1815-performance-overhaul`:
- `unstable_cache` on 8 API files + `revalidateTag` endpoint
- Image config (`deviceSizes`, `imageSizes`, `minimumCacheTTL`, `optimizePackageImports`)
- Dynamic imports for `ConciergeWizardContainer`, `BookingSection`
- Web Vitals reporter + `/api/analytics/vitals` endpoint
- `lighthouserc.js` config + workflow file
- Image blur placeholders (`260404` Phase 2)
- CMS image pipeline (`260404` Phase 3)

## Success Metrics
- **Day 1 (subjective):** Mobile click → visual feedback in <100ms. No more "frozen" perception on staging.
- **Day 2 (baseline captured):** Lighthouse CI green. Mobile Lighthouse Performance score recorded for 5 routes.
- **Day 5 (targets):** INP < 200ms, LCP < 2.5s, TTFB < 600ms (cached) / < 1200ms (uncached), Lighthouse Mobile ≥ 85.

## Final Outcome

**Shipped:** Phase 1 (loading.tsx + useLinkStatus + RSC conversions) addresses the click-freeze UX gap. Phase 3 (Branch C LCP priority + Branch D Bubblav deferral) measurably improved detail-page LCP. Lab measurements show ±5-10 point variance per run — single Lighthouse audits unreliable; RUM tracking via Web Vitals reporter is the ground truth. Remaining "16s LCP" on listings is simulator projection under extreme throttling (4x CPU + Slow 4G); real users see ~1/4 that penalty. Blockers: Phase 2 Track A (Lighthouse CI) still BLOCKED on GitHub Actions secrets (DB unreachable from runners — IPv6 DNS issue on generateStaticParams build step; belongs in `260404` Phase 5). **Follow-ups:** (1) Observe RUM for 7 days; (2) if Phase 3 branches don't move RUM numbers, revisit React Compiler or DB optimization; (3) escalate DB connectivity to DevOps for Lighthouse CI fix.

## Validation
- Manual: throttled Chrome DevTools (4x CPU, Slow 4G) on key flows.
- Automated: Lighthouse CI in PR pipeline.
- RUM: Web Vitals reporter data over 7 days post-deploy.
- A/B feel test: before/after video recording of click flows.

## Open Questions
1. Is staging DB cold-starting (e.g., Neon scale-to-zero) and adding latency? Verify in Phase 2 measurement.
2. Are images served via Vercel Image Optimization or hitting blob storage directly? Check network tab during Phase 2.
3. Does Bokun booking iframe block paint on tour detail? May need `loading="lazy"` or behind-fold mount — defer to Phase 3 if data shows LCP impact.
