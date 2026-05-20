---
plan: bokun-cart-css-fix
title: "Bokun Embedded-Checkout Cart Delete-Button UX Fix (CSS Injection)"
description: "Improve discoverability of the cart item delete button (currently tiny gray ×) by injecting custom CSS via Bokun channel admin Theme → Show advanced options. Includes hosted-checkout UX comparison as escape-hatch evaluation."
status: complete
priority: P3
effort: <1d
branch: master
created: 2026-05-20
tags: [bokun, checkout, ui, css, accessibility, wcag, theme]
blockedBy: []
blocks: []
related:
  - plans/260519-2046-bokun-extras-add-ons-checkout/    # Sibling checkout-stage plan (different concern: extras config)
  - plans/260520-2117-bokun-widget-desktop-load-speedup/ # Sibling: same widget, perf concern (complete)
  - plans/260430-1520-bokun-go-live/                    # Bokun commercial go-live umbrella
context:
  brainstorm: plans/reports/brainstorm-260520-2316-bokun-cart-delete-button-css-fix.md
  research: plans/reports/researcher-260520-2257-bokun-checkout-customization-options.md
---

# Bokun Embedded-Checkout Cart Delete-Button UX Fix

## Problem

Bokun's embedded checkout cart shows delete control as tiny gray `×` icon flush against price (`SEK 5,500.00 ×`). Reads as decorative chrome, not interactive button. WCAG fails: target size <24×24px and contrast <4.5:1. Stakeholder complaint; no abandonment data.

## Solution Summary

Inject custom CSS via **Bokun admin → Settings → Booking channels → [channel] → Widget → Theme → Show advanced options**. Bokun serves the CSS inside their iframe — sidesteps the cross-origin block from our domain. Target: increase size ≥24×24px, contrast ≥4.5:1, add hover/focus-visible affordance, separate from price text.

Paired with 1-hour empirical test of Bokun hosted-checkout URL (already available via `getBokunCheckoutUrl`) to evaluate whether redirecting users to Bokun's full-page checkout is better/worse UX than the embedded iframe.

## Scope Boundaries

**In scope:**
- Custom CSS in Bokun channel admin
- Version-controlled mirror of the CSS in `docs/` (Bokun admin is not git)
- Cross-browser smoke (Chrome, Safari) + breakpoint check (desktop + mobile)
- Hosted-checkout side-by-side comparison
- Stakeholder before/after screenshots

**Out of scope:**
- No code rewrite of `lazy-bokun-widget.tsx` or `bokun-booking-widget-with-fallback.tsx`
- No payment flow changes
- No own-cart build via REST/OCTO API
- No analytics instrumentation (defer until/unless stakeholder wants ROI)
- No i18n work beyond verifying icon-only fix is locale-neutral

## Phases

| # | Phase | Status | Est |
|---|---|---|---|
| 01 | [Recon — verify CSS editor + selector mapping](./phase-01-recon-verify-and-selector-map.md) | complete | 1h |
| 02 | [CSS implementation + cross-browser validation](./phase-02-css-implementation-and-validation.md) | complete | 2h |
| 03 | [Hosted-checkout comparison test](./phase-03-hosted-checkout-comparison.md) | deferred — optional, not needed for primary fix | 1h |
| 04 | [Documentation + stakeholder sign-off](./phase-04-documentation-and-signoff.md) | docs complete; stakeholder sign-off pending user | 1h |

**Total: ~5 hours (half-day with buffers).**

## Hard Gate

Phase 01 verifies the "Show advanced options" CSS editor is exposed on our Bokun tier. **If absent**, halt plan and revisit Path B/C trade-off from brainstorm with stakeholder — do NOT proceed with phases 02-04.

## Success Criteria

- Delete button bounding box ≥24×24px (DevTools measurement)
- Contrast ratio ≥4.5:1 against cart-row background (axe DevTools or contrast checker)
- Focus-visible ring on keyboard tab
- No regression to other checkout chrome (contact form, payment buttons, gift-card/promo fields)
- Stakeholder visual sign-off on before/after screenshots (desktop + mobile)
- CSS persisted in `docs/bokun-cart-css-customization.md` with selector contract + maintenance notes

## Key Dependencies

- Bokun admin credentials (assumed available)
- Access to staging or production tour page for live DevTools inspection
- Chrome + axe DevTools extension

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| CSS editor not on our tier | Low-Med | Blocks plan | Phase 01 hard gate; fallback = revisit Path B/C |
| Class name churn on Bokun deploy | Med | CSS breaks silently | Target readable classes, document selector contract, add staging visual check |
| Pseudo-content (`::after`) not honored | Med | No text label, icon-only fix | Already plan-B in design — size+color+frame suffice |
| Bokun theme cache delay | Low | Confusing iteration | Hard refresh + incognito; document in maintenance notes |
| Cross-locale rendering | Low | Text label awkward in some langs | Icon-only fix is locale-neutral; defer label until evidence |
