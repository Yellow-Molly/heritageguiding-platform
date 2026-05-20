# Phase 01 — Implementation

## Context Links
- Plan: [plan.md](./plan.md)
- Brainstorm: [plans/reports/brainstorm-260520-2117-bokun-widget-desktop-load-speedup.md](../reports/brainstorm-260520-2117-bokun-widget-desktop-load-speedup.md)
- Files touched: 2
- Estimated LOC: ~10

## Overview
- **Priority**: P2 (perf win, not blocker)
- **Status**: complete (2026-05-20)
- **Description**: Two surgical edits — change one constant + add two `<link>` tags on tour-detail route.
- **Code review**: `plans/reports/code-reviewer-260520-2137-bokun-widget-desktop-load-speedup.md` — DONE, no blockers.

## Key Insights
- The 7s delay was deliberate Lighthouse-protection (see comment at `lazy-bokun-widget.tsx:18-22`). Trimming it is a conscious trade — accept TBT degradation for real-user speed.
- Existing global `dns-prefetch` in `[locale]/layout.tsx:92-93` stays as safety net. Per-route `preconnect` adds TLS handshake on top.
- Tour-detail `page.tsx` is a server component — `<link>` elements in JSX hoist into `<head>` natively under Next.js 16 App Router. No `next/head` needed.
- `loadWidget` in `BokunBookingWidget` checks `window.BokunWidgets` existence before re-injecting script, so locale switches and remounts won't re-download the loader.

## Requirements

### Functional
- Desktop (`min-width: 1024px`): Bokun loader auto-loads 1500ms after `LazyBokunWidget` mounts.
- Mobile (`<1024px`): IntersectionObserver path unchanged.
- Tour-detail route warms TLS connection to `widgets.bokun.io` and `static.bokun.io` before user hits booking section.

### Non-Functional
- Zero new dependencies.
- Zero changes to mobile path, locale switch behavior, or error handling.
- Single-revert rollback (1 constant + 2 link tags).

## Architecture
No architectural change. Same render flow:
```
TourPage (server) → BookingSection (client) → LazyBokunWidget (client)
                                                ↓ (1500ms timer on desktop)
                                              BokunBookingWidget → injects loader script
```
New: `<head>` of tour-detail route includes 2 `preconnect` link tags emitted by the server component.

## Related Code Files

**Modify:**
- `apps/web/components/lazy-bokun-widget.tsx` — constant value + adjacent comment
- `apps/web/app/(site)/[locale]/(frontend)/tours/[slug]/page.tsx` — add `<link rel="preconnect">` tags

**Read for context (no changes):**
- `apps/web/components/bokun-booking-widget-with-fallback.tsx`
- `apps/web/app/(site)/[locale]/layout.tsx` (lines 90-93 for current `dns-prefetch`)
- `apps/web/components/tour/booking-section.tsx`

**Create:** none
**Delete:** none

## Implementation Steps

### Step 1 — Trim desktop delay
File: `apps/web/components/lazy-bokun-widget.tsx`

Change line 22 from:
```ts
const DESKTOP_LOAD_DELAY_MS = 7000
```
to:
```ts
const DESKTOP_LOAD_DELAY_MS = 1500
```

Update comment block above (lines 18-22) to reflect new rationale:
```ts
// Delay before auto-loading Bokun on desktop. Picks a window past LCP
// measurement (~2.5s "good" threshold) so the booking iframe isn't
// fighting hero/title paint, but well below the 5-10s perceived-load
// ceiling that hurt real-user conversion. TBT/Speed Index will rise
// (Bokun's ~2.8s main-thread work now lands in 1.5-4.3s post-FCP);
// accepted trade — real-user speed > Lighthouse desktop vanity metric.
const DESKTOP_LOAD_DELAY_MS = 1500
```

### Step 2 — Add scoped preconnect to tour-detail route
File: `apps/web/app/(site)/[locale]/(frontend)/tours/[slug]/page.tsx`

In the JSX returned from `TourPage`, add two `<link>` elements as siblings of `<TourSchema />` (Next.js will hoist them into `<head>`):

```tsx
return (
  <>
    {/* Warm TLS handshake to Bokun origins. Tour-detail is the only route
        that embeds the booking widget, so per-route preconnect avoids
        wasting handshakes on bouncers from other routes. Global dns-prefetch
        in [locale]/layout.tsx stays as a safety net. */}
    <link rel="preconnect" href="https://widgets.bokun.io" crossOrigin="anonymous" />
    <link rel="preconnect" href="https://static.bokun.io" crossOrigin="anonymous" />
    <TourSchema tour={tour} reviews={reviews} />
    <Header variant="solid" />
    {/* ...rest unchanged */}
```

### Step 3 — Verify build + types
```bash
cd apps/web && npm run typecheck
cd apps/web && npm run build
```
No errors expected (no API changes, no new imports).

## Todo List
- [x] Edit `apps/web/components/lazy-bokun-widget.tsx`: change constant + update comment
- [x] Edit `apps/web/app/(site)/[locale]/(frontend)/tours/[slug]/page.tsx`: add 2 preconnect link tags
- [x] Run `npm run type-check` in `apps/web` — only 2 pre-existing unrelated errors (BubblaVWidget, get-tours test); `ignoreBuildErrors: true` is intentional per MEMORY.md
- [x] Run `npm run build` in `apps/web` — clean, `/[locale]/tours/[slug]` route compiled
- [ ] Verify in browser (post-deploy or local prod build): `view-source` on `/en/tours/<any-slug>` shows both `preconnect` links in `<head>` — covered by phase-02

## Success Criteria
- TypeScript clean.
- Build succeeds.
- Server-rendered HTML for any `/[locale]/tours/[slug]` includes both `preconnect` tags in `<head>`.
- Mobile path untouched (no edits to IntersectionObserver branch).

## Risk Assessment

| Risk | Likelihood | Mitigation |
|---|---|---|
| Preconnect doesn't hoist into `<head>` from a server component returning fragment | Low | Next.js 16 App Router auto-hoists `<link>` elements. Fallback: move to `generateMetadata.other` |
| Locale switch re-fires 1.5s timer because `LazyBokunWidget` remounts | Low | Acceptable: locale switch is rare, and 1.5s vs prior 7s is still a win |
| `crossOrigin="anonymous"` on preconnect causes Bokun to refuse credentials | Very Low | Bokun loader uses standard cookies; preconnect crossOrigin only affects CORS-aware fetches. If issues, drop crossOrigin attr |

## Security Considerations
- No new data flows.
- No new third-party origins (already in `dns-prefetch`).
- No env vars touched.

## Next Steps
- After implementation passes typecheck + build → proceed to [phase-02-validation.md](./phase-02-validation.md).
