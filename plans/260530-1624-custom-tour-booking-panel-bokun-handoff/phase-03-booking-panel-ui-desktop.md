---
phase: 3
title: "Booking Panel UI Desktop"
status: pending
priority: P1
effort: "2-2.5d"
dependencies: [1, 2]
---

# Phase 3: Booking Panel UI Desktop

## Overview
Build `TourBookingPanel` (desktop 380px sidebar) as a 1:1 implementation of the **verified Pencil design** (`pencils/tour-detail.pen` frame `De84B`). Covers all selection states; calls Phase 2's `/api/bokun/availability` (read) and `/api/bokun/reserve` (handoff).

## Key Insight
Design is verified (PASS) — implement the LAYOUT/structure faithfully, but use the **live `globals.css` tokens, NOT the Pencil hex values** (red-team #9: the `.pen` is on an older coral palette that no longer matches the site). Authoritative live tokens: `--color-primary` **#1E3A5F**, `--color-accent` **#C05030** (NOT #E67E5A), `--color-secondary` **#856C2D** (NOT #C4A052), `--color-success` #10B981, Playfair Display headings, Inter body, radius/spacing scale. Reference CSS vars (never hardcode hex) exactly as `booking-section.tsx` does. Derive alpha tints from the live tokens (e.g. `color-mix`/opacity), NOT the Pencil literals `#E67E5A0D`/`#1E3A5F08` in the design map below — those are illustrative only. The panel will look slightly different from the `.pen` coral; that is expected and correct.

## Design source map (Pencil node → component / behavior)
Frame `De84B` "Booking Panel — Desktop Sidebar (380px)":
- `JAmim` **Default** → CTA **disabled** until a date is chosen; price "3 900 kr / group", sub "Private group · up to 9 people", green free-cancellation pill ("Free cancellation up to 48h before"), "Date" trigger field "Choose a date…", helper "Select a date to see availability and the exact price.", gold-outline "Inquire about this tour", trust row (zap "Instant confirmation" + lock "Booking & payment handled securely by Bokun"). NO "Powered by Bokun" badge.
- `dWGCT` **Calendar popover** → opens from the date trigger field: month header w/ chevrons ("June 2026"), Mo–Su, day grid (past/sold-out = `--color-text-light`, available = `--color-text`, selected = `--color-primary` filled white text), legend "Selected" / "Sold out / past".
- `dTx8H` **Date selected** → filled date chip ("Sat · 14 Jun 2026" + "Change", navy tint `#1E3A5F08`, primary border) + **time-slot** pills (09:00 / 14:00; show only when >1 start time).
- `ttrRF` **Per-group** → group-size counter ("How many in your group?" − value +), helper "Flat price — the same for 1 to 9 guests. You book one private group.", total "Total · 1 private group" = flat (does NOT multiply), accent CTA "Continue to secure checkout".
- `DW4VO` **Per-person** → Adult ("895 SEK each") + Child ("595 SEK each · age 6–15") counters, "Minimum 1 · maximum 9 guests", live total (e.g. 2 adults + 1 child = "2 385 SEK").
- `Zwyym` **Add-ons** → "Optional extras"; selected row (accent tint `#E67E5A0D`, accent border, qty stepper); unselected row (gold-outline "Add"); per-person vs per-booking hint; line breakdown + total.
- `WGKRL` **Loading** (skeleton), `R876vM` **Empty/no-availability** (+ next-date hint + inquire), `a6pICs` **Error** (+ retry + inquire), `HD1qC` **Over-capacity** → CTA becomes **"Request Group Quote"** → existing `GroupInquiryModal`.

## Requirements
- Functional: mode by `tour.priceType` (per_group | per_person); date popover; time slot; participant selection; add-ons; live total from server pricing; CTA disabled until valid; over-cap → group quote; loading/empty/error states.
- Non-functional: i18n sv/en/de (text expansion safe), currency per tour, a11y (labels, focus, keyboard calendar), tokens only.

## Architecture
- Client component tree under `apps/web/components/tour/booking-panel/` (each file < 200 lines):
  - `tour-booking-panel.tsx` (orchestrator: state machine date→time→participants→addons→total→CTA)
  - `booking-calendar-popover.tsx`, `booking-time-slots.tsx`
  - `participant-stepper.tsx` (shared − value +; disable at min/max)
  - `per-group-selector.tsx`, `per-person-selector.tsx`, `add-ons-selector.tsx`
  - `booking-total.tsx`, `booking-trust-row.tsx`
  - `booking-panel-states.tsx` (loading/empty/error/over-capacity)
- Data: fetch availability via `/api/bokun/availability` (group by date for the popover, derive enabled dates, time slots, rates). On CTA → POST `/api/bokun/reserve` (Phase 2) → redirect to returned URL.
- Pricing display from server response; client may show optimistic computed total but the server total is authoritative before redirect.

## Related Code Files
- Read: `apps/web/components/tour/booking-section.tsx`, `lazy-bokun-widget.tsx`, `optional-add-ons-section.tsx`, `components/booking/group-inquiry-modal.tsx`, `apps/web/app/globals.css`, `apps/web/messages/{en,sv,de}.json`, `lib/api/get-tour-by-slug.ts` (TourDetail: priceType, maxCapacity, currency, optionalAddOns, bokunExperienceId).
- Create: the `booking-panel/` component tree above; i18n keys under `tourDetail.booking.*`.
- Modify: `messages/{en,sv,de}.json` (add keys); `booking-section.tsx` wiring happens in Phase 4.

## Implementation Steps
1. Scaffold `booking-panel/` tree; map tokens to CSS vars; build the shared `participant-stepper`.
2. Build calendar popover + time slots from availability (enabled/disabled/selected; keyboard nav; dismiss on outside-click/Esc).
3. Build per-group + per-person selectors (mode switch on `tour.priceType`); wire live total from server pricing.
4. Build add-ons selector (selected/unselected, qty, per-person/per-booking hints) from `tour.optionalAddOns`.
5. Build states (loading/empty/error/over-capacity → GroupInquiryModal). CTA disabled until date+valid participants.
6. Add i18n keys (sv/en/de); standardize currency formatting (resolve the `kr` vs `SEK` mock inconsistency — pick one per-locale via `formatPrice`/Intl); derive alpha tints from tokens, not hardcoded hex.
7. Typecheck + lint; visual check against `De84B` (screenshot compare).

## Success Criteria
- [ ] Renders all states from `De84B`; per-group total stays flat; per-person total matches server (incl. add-ons).
- [ ] Calendar popover works (keyboard + mouse), only available dates selectable; time slot shown when >1.
- [ ] Over-capacity routes to `GroupInquiryModal`; CTA disabled until valid.
- [ ] Tokens only (no off-brand colors/fonts); i18n keys for sv/en/de; currency format consistent.
- [ ] Typecheck + lint green.

## Risk Assessment
- Currency-format inconsistency in the mock → standardize at build (flagged in verification).
- Per-person availability rate mapping → drive from `rates[]`; cover with the per-person sandbox capture.
- Component sprawl → keep files < 200 lines, compose small pieces (KISS/DRY).

## Security
- No secrets client-side; CTA calls server route. Sanitize any user free-text before passing to inquiry mailto.

## Red Team Hardening (applied 2026-05-31)
- **Tokens (#9):** use live `globals.css` values per Key Insight — accent `#C05030`, secondary `#856C2D`. No hardcoded Pencil hex.
- **Correct path (#17):** the widget is at `apps/web/components/lazy-bokun-widget.tsx` (top-level `components/`, NOT `components/tour/`). Import: `@/components/lazy-bokun-widget`.
- **Collapse the component tree (#17/over-modularization):** start with ~4-5 files — `tour-booking-panel.tsx` (orchestrator + total + trust row inline), `booking-calendar-popover.tsx` (the one genuinely complex piece; back it with the existing Radix popover `components/ui/popover.tsx`), `participant-stepper.tsx` (shared), `booking-panel-states.tsx` (loading/empty/error/over-cap). Split per-person/add-ons/time-slots into their own files only if a file crosses ~180 lines. The 200-line rule is a ceiling, not a target.
- **Data prerequisites (#6/#7):** `tour.priceType`, `tour.currency`, `tour.childPrice`, and `OptionalAddOn.bokunExtraId` only exist after the Phase 2 plumbing lands — do not start mode-switch/add-ons wiring until they're on `TourDetail`.
- **Per-person (#8)** <!-- Updated: Validation Session 1 - build+test now -->: build AND test per-person this cycle (not gated behind a live tour). Phase 1 must still capture the real per-age-band rate shape so the math is correct; if no live `per_person` tour exists, use synthetic fixtures for tests (Phase 5). Coordinate the rate source with Phase 2.
- **Custom pricing → inquiry-only (#validation):** add a third mode — when `tour.priceType === 'custom'`, the panel does NOT show date/participants/total; it renders an inquiry/"Request a quote" CTA (reuse `GroupInquiryModal`). No reserve call.
