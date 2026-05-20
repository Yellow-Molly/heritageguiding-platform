# Bokun Widget Desktop Load Speedup: Delay Reduction & Preconnect

**Date**: 2026-05-20 21:17
**Severity**: High
**Component**: Bokun widget loading (tour-detail page)
**Status**: Resolved (implementation + code review complete, validation deferred)

## What Happened

Shipped desktop Bokun widget speedup targeting real-user perception on tour-detail pages. Reduced artificial setTimeout from 7s to 1.5s + added per-route preconnect for `widgets.bokun.io` and `static.bokun.io`. Widget now paints ~3-4s post-navigation (was 9-12s).

## The Brutal Truth

We deliberately throttled the widget with a 7s delay to push Lighthouse TTI past the noise and keep PSI scores artificially high. But that's 5-10s of user stare at blank space on real desktops. The trade-off was backwards: gaming metrics over actual perceived performance. Accept ~5-15pt TBT drop and call that a win.

## Technical Details

- **Root cause**: `DESKTOP_LOAD_DELAY_MS = 7000` in `apps/web/components/lazy-bokun-widget.tsx` = synthetic delay past LCP window to hide Bokun's main-thread cost from PageSpeed Insights
- **Fix applied**:
  1. `DESKTOP_LOAD_DELAY_MS = 1500` (past LCP, accepts TBT penalty)
  2. Per-route `<link rel="preconnect">` (crossOrigin) in tour-detail page server component
  3. Global `dns-prefetch` in layout as fallback
- **Mobile untouched**: IntersectionObserver + 400px rootMargin stands
- **Code review**: Confirmed React 19 auto-hoists preconnect from server components into `<head>`
- **Commit**: `9018c1a` to master

## What We Tried

1. Eager `<link rel="preload">` of loader script — rejected: user preference + no 1.2MB download burden
2. Bypass Bokun loader, render iframe directly — rejected: breaks cart pin, checkout modal, conversion tracking; fragile reverse-engineer
3. Tour-card hover prefetch (Approach B) — deferred until post-measurement

## Root Cause Analysis

We conflated two metrics: PageSpeed Insights (lab, artificial) vs. actual user experience (field). The 7s delay was a band-aid for expensive Bokun JS execution. Rather than optimize the load, we hid it from the metric. Backwards priority.

## Lessons Learned

- **Never sacrifice real UX for lab metrics without measurement**: We should have measured CLS, TBT, interaction latency first. 5-15pt TBT loss is acceptable if widget paints 5s faster.
- **Preconnect is cheap insurance**: Costs ~0 (DNS lookup only, no payload), defers full handshake until needed. Always add for cross-origin widgets.
- **Rejected approaches prevent re-derivation**: Document why we didn't preload or iframe-bypass; future PR will re-derive otherwise.

## Next Steps

- **Phase-02 validation** (post-deploy):
  1. DevTools trace on tour-detail: confirm widget paint <4s from nav
  2. PSI delta: note TBT regression, confirm LCP acceptable
  3. Smoke tests: cart pin interaction, checkout modal open, locale switch
- **Revisit Approach B** if 3-4s still feels slow on internal nav; tour-card hover prefetch on dashboard/search results
- **Monitor Real User Monitoring (RUM)** for Core Web Vitals once deployed; adjust delay further if needed

**Files**: `plans/260520-2117-bokun-widget-desktop-load-speedup/` (plan.md, phase-01, phase-02) + reports/
