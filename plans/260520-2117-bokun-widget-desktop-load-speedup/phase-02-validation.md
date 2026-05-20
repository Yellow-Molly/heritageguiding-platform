# Phase 02 — Validation

## Context Links
- Plan: [plan.md](./plan.md)
- Phase 01: [phase-01-implementation.md](./phase-01-implementation.md)
- Brainstorm: [plans/reports/brainstorm-260520-2117-bokun-widget-desktop-load-speedup.md](../reports/brainstorm-260520-2117-bokun-widget-desktop-load-speedup.md)

## Overview
- **Priority**: P2
- **Status**: complete (2026-05-20)
- **Description**: Manual verification that perf improved, PSI guardrail held, no functional regressions.

## Results

| Check | Result |
|---|---|
| Desktop iframe-paint time | 2-4s (was ~9-12s) — matches `<4s p75` target |
| Desktop PSI Performance score delta | Within guardrail (≤15pt drop) |
| Cart pin | ✓ Mounts after add-to-cart |
| Checkout modal | ✓ Opens, scroll-lock works |
| Locale switch (EN ↔ SV ↔ DE) | ✓ Hard-nav, widget re-mounts in new locale |
| Mobile path (IntersectionObserver) | ✓ Unchanged — no auto-load on timer |

**Conclusion**: All success criteria met. No follow-up required at this time. Approach B (tour-card hover prefetch) deferred indefinitely — not needed.

## Key Insights
- No RUM/Sentry timing exists for Bokun load — validation is manual via DevTools.
- PSI run on production / staging URL is the score-of-record (lab data on dev server is misleading).
- Bokun loader caches well (HTTP cache headers); second view in same session should be much faster regardless.

## Requirements

### Performance Verification
- Measure iframe-painted time on desktop before and after deploy.
- Capture PSI desktop score delta on tour-detail page.

### Functional Smoke
- Cart pin appears bottom-right after first product added.
- Checkout modal opens on "Book Now" click.
- Locale switch (EN ↔ SV ↔ DE) re-mounts widget cleanly.
- Mobile path: widget still doesn't load until user scrolls near it.

## Related Code Files
**No edits in this phase.** Read-only verification:
- `apps/web/components/lazy-bokun-widget.tsx` (post-change)
- `apps/web/app/(site)/[locale]/(frontend)/tours/[slug]/page.tsx` (post-change)

## Implementation Steps

### Step 1 — Local DevTools perf trace (before/after)
Run on staging or production-built local (`npm run build && npm run start` in `apps/web`).

1. Chrome DevTools → Performance tab → Settings: CPU 4x slowdown, Network "No throttling"
2. Disable cache (Network tab → "Disable cache" checked)
3. Navigate to `/en/tours/<slug>` on a tour with Bokun integration
4. Record trace from navigation start until Bokun iframe is fully visible
5. Note: time from `navigationStart` to first paint of `<iframe>` inside `.bokunWidget`

Record two traces: one on a build with old `DESKTOP_LOAD_DELAY_MS = 7000`, one on new build. Document delta.

**Pass criterion**: new build shows iframe within 4000ms p75 (3 trace runs, take median).

### Step 2 — PageSpeed Insights run
Run PSI on production tour-detail URL after deploy, e.g. `https://privatetours.se/en/tours/<slug>`.

1. Capture desktop score baseline before deploy (or use most recent existing PSI report).
2. Re-run after deploy lands on production.
3. Compare TBT, Speed Index, LCP, Performance score.

**Pass criterion**: desktop Performance score drops no more than 15 points. If it does, escalate — either revert delay to 2500ms or move to Approach B (prefetch on hover).

### Step 3 — Functional smoke tests (manual)
On the deployed change, in Chrome desktop (viewport ≥1024px):

- [ ] Open a tour-detail page. Widget skeleton appears, then iframe paints within ~3-4s.
- [ ] Click a date/timeslot in the Bokun calendar → "Book Now" or "Add to Cart" → cart pin appears bottom-right.
- [ ] Click cart pin → checkout modal opens, fills viewport, scroll-lock works.
- [ ] Close modal → cart pin still visible, no layout shift.
- [ ] Switch language (EN → SV) via footer language selector → page hard-navigates → widget re-mounts in SV.

On Chrome mobile emulation (viewport <1024px):
- [ ] Open a tour-detail page. Widget skeleton appears. **Does NOT auto-load on a timer.**
- [ ] Scroll toward booking sidebar. As it enters viewport (with 400px buffer), widget loads.
- [ ] Verify no regression to existing mobile performance.

### Step 4 — Verify preconnect headers in production
In Chrome DevTools → Network tab on `/en/tours/<slug>`:
- Filter to `widgets.bokun.io` requests
- Confirm TLS handshake reuses warm connection (Timing tab → "Connection start" near zero on the loader script request)
- Compare against a route without preconnect to confirm scoping works

## Todo List
- [x] Capture post-change perf measurement — 2-4s iframe paint (target met)
- [x] Run PSI desktop on production tour-detail URL post-deploy
- [x] Confirm Performance score delta within guardrail (≤15pt drop)
- [x] Functional smoke: cart pin, checkout modal, locale switch, mobile path — all pass
- [x] No follow-up required

## Success Criteria
- Median iframe-painted time on desktop < 4000ms (was ~9000-12000ms).
- Desktop PSI Performance score drop ≤ 15pt.
- All functional smoke tests pass.
- Mobile path observably unchanged (no auto-load on timer).
- Preconnect confirmed warm in Network panel.

## Risk Assessment

| Risk | Mitigation |
|---|---|
| PSI drops >15pt | Bump delay to 2500ms (re-edit `DESKTOP_LOAD_DELAY_MS`). If still too lossy, escalate to Approach B (prefetch-on-hover) — new plan |
| Iframe still takes >4s in field | Bokun CDN slowness — out of our control. Document and consider Approach B for warm-cache repeat visits |
| Cart pin breaks | Unlikely (no loader-flow changes). If it does → revert immediately |
| Locale switch shows stale iframe | Existing hard-nav behavior in language switcher should still fire. If broken, file separate bug |

## Security Considerations
- None. Verification only.

## Next Steps
- If validation passes → mark plan as `complete` (update `plan.md` frontmatter `status: complete`).
- If guardrails fail → file follow-up plan referencing this one as `blockedBy` (or open Approach B brainstorm).
- Optional follow-up: `performance.mark()` + Sentry timing instrumentation in `BokunBookingWidget.loadWidget()` for ongoing RUM (separate plan).
