---
title: "Staging Lighthouse — Perf, SEO & A11y Fixes + Threshold Restore"
description: "Address findings from 2026-05-16 staging Lighthouse audit (6 reports). Fix CSP-blocked Bokun widget, low-contrast booking buttons, LCP resource-load-delay, verify production SEO env-gating. Closes out perf overhaul Phase 5."
status: in-progress
priority: P1
effort: 4h
branch: feat/staging-lighthouse-fixes
tags: [performance, seo, a11y, lighthouse, csp, bokun, lcp, canonical]
created: 2026-05-16
blockedBy: []
blocks: [260404-1815-performance-overhaul]
related:
  - plans/260404-1815-performance-overhaul/plan.md
  - plans/260514-1506-go-live-readiness-review/plan.md
  - plans/260408-1512-staging-seo-safety/plan.md
---

# Staging Lighthouse — Perf, SEO & A11y Fixes + Threshold Restore

## Context
- Source data: `perf/local Lighthouse report/staging.privatetours.se-{Home,TourListing,TourDetails}-{desktop,mobile}.json`
- Validation report on prior plan: `plans/reports/validate-260516-1725-performance-overhaul.md`
- This plan **supersedes Phase 5** of `260404-1815-performance-overhaul`.

## Lighthouse Baseline (2026-05-16, staging)

| Page | Perf D / M | A11y D / M | BP D / M | SEO D / M |
|------|------------|-------------|----------|-----------|
| Home | 0.99 / 0.90 | 1.00 / 1.00 | 1.00 / 1.00 | 0.61 / 0.61 |
| TourListing | 0.98 / 0.90 | 1.00 / 1.00 | 1.00 / 1.00 | 0.61 / 0.61 |
| TourDetails | 0.91 / 0.93 | 0.96 / 0.96 | 0.92 / 0.92 | 0.61 / 0.61 |

Performance already meets 0.9 threshold across all 6 reports. **SEO 0.61 is fully attributable to two staging-intentional audits** (see Phase 1).

## Phases

| # | Phase | Status | Priority | Effort |
|---|-------|--------|----------|--------|
| 1 | [Verify Production SEO Env-Gating](phase-01-verify-production-seo.md) | complete | P1 | 0.5h |
| 2 | [CSP Whitelist Bokun Widget Origin](phase-02-csp-bokun-widget.md) | complete | P0 | 0.5h |
| 3 | [Fix Booking Button Color Contrast](phase-03-booking-button-contrast.md) | complete | P1 | 0.5h |
| 4 | [LCP Resource Load Delay](phase-04-lcp-resource-load-delay.md) | partial → follow-up | P2 | 1.5h |
| 5 | [Restore Lighthouse Threshold & Close Old Plan](phase-05-restore-threshold.md) | partial → blocked | P1 | 1h |

**Follow-up plan:** `plans/260517-0225-mobile-lcp-deepdive/` tracks the remaining mobile LCP gap (60-367ms over 2500ms gate). Phase 5 unblocks when that plan ships.

## Findings Summary

**SEO failures (both 0/1, identical across all 6 reports):**
- `is-crawlable`: blocked by `x-robots-tag: noindex, nofollow` + `robots.txt: Disallow: /`. **Intentional on staging.** Phase 1 verifies production is open.
- `canonical`: staging canonical points to `https://privatetours.se/...` (production host). **Intentional on staging.** Phase 1 verifies production canonical matches its own host.

**Best Practices failure (TourDetails only):**
- `errors-in-console` + `inspector-issues`: CSP `script-src` blocks `https://widgets.bokun.io/.../BokunWidgetsLoader.js`. Booking widget cannot load. **Real bug.** → Phase 2.

**A11y failure (TourDetails only):**
- `color-contrast`: 2 buttons in sticky booking sidebar (`div.sticky > div.mt-5 > div.rounded-lg > button.inline-flex` and `div.sticky > div.mt-3 > span > button.inline-flex`) fail WCAG. → Phase 3.

**Perf — borderline:**
- Mobile LCP: Home 3459ms / TourListing 3613ms / TourDetails 3161ms. All > 2500ms `largest-contentful-paint` CI assertion threshold.
- Root cause: `resourceLoadDelay` of 1020–1498ms (image not requested early enough).
- Home-specific: LCP element detected as **header logo** (22×40px), not hero — confirms hero paints > 3.5s. → Phase 4.

## Dependencies
- Phase 1: Independent. Read-only verification (curl prod).
- Phase 2: Independent. Single CSP header edit + staging redeploy.
- Phase 3: Independent. UI tweak.
- Phase 4: Independent. Investigation may discover root causes in Payload media route.
- Phase 5: Blocked by Phases 2–4 landing + one green Lighthouse CI run.

## Success Criteria
- Production SEO score ≥ 0.95 (only staging-intentional audits dropped; prod opens those).
- TourDetails Best Practices: 1.0 (Bokun widget loads without CSP errors).
- TourDetails A11y: 1.0 (booking buttons meet WCAG AA contrast).
- All pages mobile LCP < 2500ms.
- `apps/web/lighthouserc.cjs` restored to `'categories:performance': ['error', { minScore: 0.9 }]`.
- One green Lighthouse CI run on master.
- `260404-1815-performance-overhaul/plan.md` status → `superseded` with link to this plan.

## Cross-Plan Note
This plan **blocks** completion of `260404-1815-performance-overhaul` (Phase 5 absorbed here). When Phase 5 of THIS plan completes, the old plan flips to `superseded`.
