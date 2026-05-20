# Brainstorm: Bokun Widget Desktop Load-Time Speedup

**Date:** 2026-05-20 21:17
**Type:** Performance
**Scope:** Desktop only (mobile path preserved as-is)
**Status:** Approved — Approach A

---

## Problem Statement

Bokun booking widget on tour-detail pages takes **5-10s** to become interactive on desktop. The booking sidebar sits in the initial viewport on `lg:` (≥1024px), so users see a 5-10s skeleton while the rest of the page is fully rendered. Mobile path (IntersectionObserver, ~400px rootMargin) is already tuned and out of scope.

## Root Cause

`apps/web/components/lazy-bokun-widget.tsx:22` sets `DESKTOP_LOAD_DELAY_MS = 7000` — a deliberate setTimeout used to push Bokun's ~2.8s main-thread work past Lighthouse's TTI / Speed Index measurement window. The delay protects PSI scores at the cost of real-user perceived speed.

Wall-clock breakdown today:
- HTML + hydration: ~0.5-1.5s
- **Artificial delay: 7s** ← single biggest factor
- Bokun loader download: ~0.5-1.5s (1.2MB)
- Bokun main-thread init: ~2.8s (intrinsic to Bokun)
- iframe paint
- **Total ≈ 9-12s**

## Constraints (from user)

- Mobile path must stay untouched (already PSI-tuned).
- Real-user speed > PSI score, but with a balance — accept some PSI degradation, not full removal.
- Prefer `preconnect` over eager `preload` (no 1.2MB eager download).
- Traffic source is mixed (cold organic + warm internal nav).

## Approaches Evaluated

### Approach A — Minimal (CHOSEN)
- `DESKTOP_LOAD_DELAY_MS`: 7000 → 1500ms
- Scope `preconnect https://widgets.bokun.io` (crossOrigin) to tour-detail page only; keep global `dns-prefetch` as safety net for other routes
- Mobile path untouched
- **Wall-clock**: ~3-4s post-navigation (down from ~9-12s)
- **PSI desktop**: ~5-10pt drop expected (TBT/Speed Index)
- **Files**: 2 (`lazy-bokun-widget.tsx`, tour-detail `page.tsx`)
- **Pros**: KISS, low risk, single revert if needed
- **Cons**: PSI desktop hit; no warm-cache benefit for internal navigators

### Approach B — A + intent-based prefetch
- Everything in A, plus `<link rel="prefetch">` Bokun loader on tour-card hover/focus (dedup per session)
- **Wall-clock for internal navigators**: ~1.5-2s
- **Files**: 3-4 (cards + small helper)
- **Pros**: covers mixed traffic — internal nav becomes near-instant
- **Cons**: 1.2MB bandwidth per hover-intent; extra code surface
- **Status**: deferred — try after measuring A

### Approach C — Skip loader, render iframe directly (REJECTED)
- Bypass `BokunWidgetsLoader.js`, render `<iframe>` with `getBokunWidgetUrl()` URL
- **Why rejected**: Loader runs cart pin (`#bokun-widgets-root` is already manually styled in `[locale]/layout.tsx:107`), checkout modal mounting, iFrameSizer auto-resize, conversion tracking. Brittle reverse-engineer that breaks on Bokun's next release.

## Final Recommendation: Approach A

### Changes
1. **`apps/web/components/lazy-bokun-widget.tsx`** — change `DESKTOP_LOAD_DELAY_MS` from `7000` to `1500`. Update doc-comment above the constant to reflect new rationale (past LCP measurement, accepting TBT hit for real-user speed).
2. **`apps/web/app/(site)/[locale]/(frontend)/tours/[slug]/page.tsx`** — add `<link rel="preconnect" href="https://widgets.bokun.io" crossOrigin="anonymous" />` (and likely `https://static.bokun.io`) scoped to this route. Keep the global `dns-prefetch` in `[locale]/layout.tsx` as a fallback for any other routes that may embed Bokun later.

### Out of scope
- Mobile IntersectionObserver path
- Eager script preload
- Loader bypass
- Tour-card hover prefetch (Approach B — re-evaluate after measurement)

## Success Metrics

- **Primary (real user)**: time-to-iframe-painted on desktop tour-detail < 4s p75 (measured manually via DevTools Performance panel before/after).
- **Secondary (instrumentation, optional follow-up)**: `performance.mark()` pairs in `BokunBookingWidget.loadWidget()` → `verifyIframeLoaded()` reporting to Sentry/RUM. Lets us quantify the deploy.
- **Guardrail**: PSI desktop score for `/[locale]/tours/[slug]` page does not drop more than 15 points. If it does, revisit delay value (try 2000-2500ms).

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| PSI desktop drops >15pts | Revert to 2500ms delay; OR push Approach B which warms cache before navigation |
| Bokun script CDN slowness causes >4s real load even with delay reduced | Add Approach B (intent prefetch) |
| Preconnect cost wasted on bounces from tour-detail | Acceptable — bounce rate on tour-detail is low; cost is one TLS handshake (~150ms server-side, free on user end) |
| Locale switch re-init still surfaces 1.5s skeleton | Existing behavior; locale switch is rare relative to first load |

## Implementation Risks

- **Locale switch behavior**: `useEffect` deps include `[bookingChannelUUID, experienceId, locale]`. The 1500ms delay re-fires on locale switch (since `loadWidget` is called again, but the timer in `LazyBokunWidget` doesn't re-run — `shouldLoad` is already true). No regression expected, but verify on manual QA.
- **Tour-detail page is a server component**: confirm `<link>` tags in server-component JSX render into `<head>` correctly under Next.js App Router. Alternative: use the route's `generateMetadata` export with `other` field, or place link in a child layout.

## Validation Plan

1. Manual DevTools Performance trace on desktop (Chrome, Slow 4G throttle off, Cache disabled) — before/after the change. Record iframe-painted time.
2. Run PSI on `/[locale]/tours/[slug]` desktop before/after. Note delta.
3. Manual smoke: cart pin still mounts; checkout modal still opens; locale switch still re-inits widget.
4. Verify mobile path unchanged (DevTools mobile emulation, IntersectionObserver still gates load).

## Next Steps

- Invoke `/ck:plan` to scaffold a phased implementation plan from this brainstorm.
- Implementation should be a single small PR (2 files, ~10 LOC).
- Optionally add `performance.mark` instrumentation as a separate follow-up PR.

## Unresolved Questions

- Should `dns-prefetch` in `[locale]/layout.tsx:92-93` be removed once the per-route `preconnect` lands, or kept as a safety net? Recommend keep — `dns-prefetch` cost is negligible.
- Does Bokun loader respect HTTP cache headers well enough that a second tour-detail view in the same session reuses the cached script? Worth verifying in DevTools Network during validation — if yes, internal navigation already gets a meaningful boost without Approach B.
