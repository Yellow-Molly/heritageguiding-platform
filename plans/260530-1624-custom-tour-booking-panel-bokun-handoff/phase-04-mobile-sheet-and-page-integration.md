---
phase: 4
title: "Mobile Sheet and Page Integration"
status: pending
priority: P1
effort: "1-1.5d"
dependencies: [2, 3]
---

# Phase 4: Mobile Sheet and Page Integration

## Overview
Wire `TourBookingPanel` into the Tour Detail page (desktop sidebar), build the mobile collapsed-bar → bottom-sheet flow (Pencil frame `uyeIW`), and retire the embedded widget to a fallback role.

## Design source map (Pencil node → behavior)
Frame `uyeIW` "Booking Panel — Mobile (375px)":
- `Z4oSu` **Collapsed** → sticky bottom bar: left price ("3 900 kr"/"895 SEK / person"), right accent "Check availability" button. Always visible.
- `YYkxa` **Expanded bottom sheet** → header "Book this tour" + close (X); price; date chip + "Change"; **"Start time"** pills (09:00 selected / 14:00); Participants (Adult/Child steppers); "Optional extras" (qty); Total; accent "Continue to secure checkout"; trust row. Dismissible.

## Requirements
- Functional: desktop renders panel in the sticky sidebar; mobile shows collapsed bar that opens a bottom sheet containing the full panel flow; CTA performs the Phase 2 handoff (redirect to Bokun-hosted payment).
- Non-functional: ≥44px tap targets in the sheet; sheet traps focus + closes on Esc/backdrop; widget retained only as graceful fallback.

## Architecture
- Reuse the Phase 3 `booking-panel/` components inside both desktop sidebar and mobile sheet (DRY — one panel, two shells).
- Desktop: replace `LazyBokunWidget` in `booking-section.tsx` with `TourBookingPanel`. Keep the Bokun widget mountable as an **error fallback** if `/api/bokun/reserve` or availability hard-fails (preserve the existing "Book on Bokun directly" escape hatch).
- Mobile: collapsed bar built on / replacing the visual of `tour-mobile-price-bar.tsx`; opens a bottom-sheet shell wrapping `TourBookingPanel`.
- Over-capacity + no-Bokun-integration tours keep current behavior (inquiry / GroupInquiryModal).

## Related Code Files
- Modify: `apps/web/components/tour/booking-section.tsx` (swap widget → panel; keep fallback), `apps/web/components/tour/tour-mobile-price-bar.tsx` (collapsed bar + open sheet).
- Create: `apps/web/components/tour/booking-panel/booking-sheet-mobile.tsx` (bottom-sheet shell), reuse `booking-panel/*`.
- Read: `apps/web/components/lazy-bokun-widget.tsx`, `bokun-booking-widget-with-fallback.tsx` (fallback wiring), `plans/260519-2313-mobile-sticky-bar-hide-on-booking-section/` (existing mobile bar behavior).

## Implementation Steps
1. Swap desktop: render `TourBookingPanel` where `hasBokunIntegration` is true; keep widget import for fallback; preserve third-party disclosure line.
2. Build `booking-sheet-mobile.tsx` (accessible dialog/sheet: focus trap, Esc, backdrop close, scroll lock).
3. Update `tour-mobile-price-bar.tsx`: price + "Check availability" → open the sheet; respect existing hide-on-booking-section scroll behavior.
4. Wire CTA → `/api/bokun/reserve` → `window.location` redirect to returned hosted-checkout URL; handle hold-expiry/error (toast + retry, fallback to widget/inquiry).
5. Ensure no-Bokun and over-capacity tours keep inquiry/group-quote paths.
6. Typecheck + lint.

## Success Criteria
- [ ] Desktop tour page shows the custom panel (not the iframe); widget only appears as fallback on hard failure.
- [ ] Mobile collapsed bar opens an accessible bottom sheet with the full flow; ≥44px targets; Esc/backdrop close.
- [ ] CTA redirects to Bokun-hosted payment with selection applied (sandbox verified).
- [ ] No regression for no-Bokun tours or over-capacity (group quote) paths.
- [ ] Typecheck + lint green.

## Risk Assessment
- Locale-switch iframe quirk only matters for the fallback path (documented in `bokun-booking-widget-with-fallback.tsx`) — panel itself is locale-clean.
- Sheet a11y is easy to get wrong → reuse an accessible primitive; verify in Phase 5.
- Don't double-mount the widget loader when falling back — guard the existing script-exists check.

## Security
- Redirect host allowlist comes from the **Phase-1-verified host(s)** (may NOT be `widgets.bokun.io` — could be a payment-link/checkout host); validation is enforced **server-side in Phase 2** (this phase just navigates to the already-validated URL). Client re-checks as defense-in-depth.

## Red Team Hardening (applied 2026-05-31)
- **Sheet a11y primitive (#14)** <!-- Updated: Validation Session 1 - add @radix-ui/react-dialog -->: **add the `@radix-ui/react-dialog` dependency** and build the bottom sheet on it (focus-trap + Esc + scroll-lock for free; matches the Radix popover already used for the calendar). Do NOT hand-harden `components/ui/dialog.tsx` (it has no focus-trap/Esc; only `react-accordion`/`react-popover` are installed). This is the decided approach — Phase 5's a11y gate depends on it.
- **Redirect host (#11):** consume the verified host list from Phase 1; do NOT hardcode widget hosts.
- **Feature-flag rollback (#17/T):** add a flag to revert the tour page to widget-only WITHOUT a code deploy — the in-page widget fallback shares Bokun's failure domain (if Bokun is down, both panel and fallback fail), and a flag is the real rollback. (The widget loader already guards against double-injection at `bokun-booking-widget-with-fallback.tsx:182`, so the in-page fallback won't double-mount.)
- **Path (#17):** `LazyBokunWidget` is `@/components/lazy-bokun-widget` (top-level `components/`).
