---
phase: 6
title: "Contingency Widget Restyle"
status: pending
priority: P3
effort: "0.5-1d"
dependencies: [1]
---

# Phase 6: Contingency Widget Restyle (CONDITIONAL)

## Overview
Fallback path that runs ONLY if the Phase 1 gate proves no clean Bokun-pays handoff exists (Plan B and Plan A both dead). Delivers a "visibly better this week" improvement by reconfiguring + restyling the existing embedded widget instead of replacing it. Guarantees the user is never left empty-handed.

## Trigger (do not start otherwise)
Phase 1 outcome = neither reservation/cart-resume (B) nor deep-link pre-fill (A) works. At that gate, re-confirm scope with the user (per locked decision: do not silently drop add-ons) — they choose: (a) accept this restyle, or (b) accept Plan A with add-ons deferred (preferred over restyle if A actually works for selection).

## Requirements
- Functional: remove the two complaints that are config-driven — the multi-group stepper and the redundant group-size dropdown — and de-uglify the widget to align with Option B brand.
- Non-functional: no PCI/in-house payment; CSS via Bokun's supported injection (cross-origin safe).

## Architecture
- Bokun dashboard config: adjust pricing-category occupancy/`maxPerBooking` so the widget stops offering "number of groups" > 1 and the group-size control behaves sensibly for private tours (verify per `bokun-checkout-api-response-sample.json` occupancy/groupSize semantics).
- CSS injection via Bokun admin Theme → "Show advanced options" (per `docs/bokun-cart-css-customization.md` + memory note): target `data-testid` selectors, expect `!important` over the iframe; apply brand tokens (navy/terracotta/gold, Inter/Playfair, radii) to approximate Option B.
- Keep `LazyBokunWidget` / `bokun-booking-widget-with-fallback.tsx` as-is structurally; only theme + config change.

## Related Code Files
- Read: `docs/bokun-cart-css-customization.md`, `docs/bokun-extras-setup.md`, `apps/web/app/globals.css` (token values), `apps/web/components/bokun-booking-widget-with-fallback.tsx`.
- Modify (if any local CSS hook exists): widget container styles; otherwise changes live in Bokun admin (document them in `docs/`).

## Implementation Steps
1. In Bokun sandbox then prod: set pricing-category occupancy/max so multi-group + redundant group-size disappear; verify on the test widget link.
2. Author brand CSS targeting widget `data-testid` selectors; inject via Bokun admin advanced options; iterate against Option B look.
3. Validate on staging (shared prod Bokun account — be careful) across sv/en/de + mobile.
4. Document the dashboard config + CSS in `docs/` so it's reproducible.

## Success Criteria
- [ ] Widget no longer shows a multi-group stepper or a redundant group-size dropdown for private tours.
- [ ] Widget visually aligns with Option B brand (colors/type/radii) on desktop + mobile, sv/en/de.
- [ ] No payment/PCI change; booking + webhook flow unaffected.
- [ ] Config + CSS documented in `docs/`.

## Risk Assessment
- Bokun CSS is `!important`-heavy and selector-fragile (Bokun can change `data-testid`s) → document selectors + revisit if Bokun updates.
- Staging/prod share the same Bokun production account (memory: bokun-environment-topology) → config changes affect prod; stage carefully.
- This is a floor, not the goal — if chosen, log it as tech-debt to revisit when a handoff becomes available.

## Security
- CSS/theme only; no credential or payment surface changes.
