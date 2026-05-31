---
phase: 5
title: "Tests Accessibility and Sandbox E2E"
status: pending
priority: P1
effort: "1.5d"
dependencies: [3, 4]
---

# Phase 5: Tests Accessibility and Sandbox E2E

## Overview
Lock in correctness (pricing/handoff are money-critical) and quality: unit + component tests, Playwright happy-paths per pricing mode + mobile sheet, accessibility, and a sandbox end-to-end run through to the `bookings` webhook persistence.

## Requirements
- Functional: tests prove panel total === Bokun-charged total for per-group, per-person, and +add-ons; handoff redirect works; webhook creates a `bookings` row.
- Non-functional: WCAG AA (axe), keyboard operability, ≥44px mobile targets; no flaky tests.

## Architecture / coverage
- Unit (Vitest): `compute-booking-total-from-rates` (per-group flat, per-person age bands, per-booking + per-person extras, currency no-float); reservation payload builder (fixture from Phase 1 capture); `/api/bokun/reserve` input validation + error mapping.
- Component (Vitest + Testing Library): mode switch by `priceType`; stepper min/max; CTA disabled until valid; over-capacity → GroupInquiryModal; empty/error/loading states; calendar enable/disable/select.
- E2E (Playwright): desktop per-group + per-person happy paths to the redirect boundary; mobile collapsed-bar → sheet → CTA; i18n route smoke (sv/en/de); a11y (axe + keyboard calendar/steppers/sheet). Follow existing Playwright phase patterns in `plans/260212-2142-playwright-e2e-testing/`.
- Sandbox E2E (manual or scripted, gated): one real sandbox booking through Bokun-hosted payment → confirm `/api/bokun/webhook` fires → `bookings` row created with correct total + add-ons.

## Related Code Files
- Read existing test patterns: `apps/web/lib/bokun/__tests__/*`, `packages/cms/__tests__/*`, `plans/260212-2142-playwright-e2e-testing/`.
- Create: `__tests__` beside new modules; booking-panel specs under the repo-root `e2e/` tree (match existing `e2e/tests/` + `e2e/page-objects/` layout). Update the existing `e2e/tests/customer-journey/tour-detail-and-booking.spec.ts` + `e2e/page-objects/tour-detail.ts` (see hardening below).
- Modify: test fixtures (add per-person + extras sample from Phase 1 capture).

## Implementation Steps
1. Unit tests for pricing + reservation payload + route validation (use Phase 1 captured JSON as fixtures).
2. Component tests for panel states + interactions.
3. Playwright specs: per-group, per-person, mobile sheet, i18n smoke; mock `/api/bokun/*` for deterministic runs; one live-sandbox-tagged spec (opt-in).
4. a11y: axe on each state; keyboard calendar/stepper/sheet; assert ≥44px mobile targets.
5. Run full suite; fix to green (no skips, no fake passes). Manual sandbox e2e → confirm webhook → bookings row.

## Success Criteria
- [ ] Pricing unit tests cover all modes + extras; assert exact totals (= sandbox captures); no float drift.
- [ ] Component + Playwright happy-paths green for both modes + mobile sheet + i18n.
- [ ] axe clean; keyboard-operable calendar/steppers/sheet; ≥44px mobile targets.
- [ ] One sandbox booking reaches Bokun payment and produces a correct `bookings` row via webhook.
- [ ] Whole suite green (no skipped/fake tests).

## Risk Assessment
- Playwright flakiness on async availability → mock the API for deterministic UI specs; isolate the live-sandbox spec behind a tag.
- Sandbox e2e writes to shared test account → label QA data; don't run in CI by default.

## Security
- No real card data; sandbox only. Don't commit captured PII; redact fixtures.

## Red Team Hardening (applied 2026-05-31)
- **E2E harness exists at repo-root `e2e/`** (NOT `apps/web/e2e/` — correct all path references). Playwright config + page objects already present.
- **Save the existing booking spec (#15):** `e2e/tests/customer-journey/tour-detail-and-booking.spec.ts:30` asserts the Bokun widget DOM (`div[data-src*="bokun"]`, via `e2e/page-objects/tour-detail.ts:20`) and has a `test.skip(widgetCount===0)` that will SILENTLY skip once the swap removes the iframe from the default render — booking e2e coverage would evaporate unnoticed. Update the spec + page object to assert the new panel (e.g. the "Continue to secure checkout" CTA) and remove the skip mask.
- **Required additional tests (from accepted findings):**
  - Foreign `extraId` rejected by `/api/bokun/reserve` (#10).
  - Concurrent double-submit does not create two holds (#13).
  - Available-in-cache but sold-out-at-reserve → distinct "just sold out" state, not blind retry (#12).
  - Rate-drift: cache quote ≠ reservation `totalDue` → re-present + re-confirm before redirect (#12).
  - Webhook: `RESERVED`→CARD-paid transition creates/updates the `bookings` row to a paid state AND sends exactly one confirmation email (#3) — assert against the Phase-1-captured event/status.
  - Prod-write gate: reserve route refuses to call prod Bokun when the write flag is off / not genuine prod (#1).
- **Sandbox e2e is LOCAL-only** (#1): never point the live-sandbox-tagged spec at a deployed staging URL (staging writes hit prod Bokun).
- **Per-person tested this cycle** <!-- Updated: Validation Session 1 - test now with fixtures -->: do NOT skip per-person specs. Use a synthetic per-age-band fixture built from the Phase-1-captured real rate shape; assert the per-person total math + mode switch. (User decision: build+test now, not gated behind a live tour.)
- **Custom pricing path:** test that a `priceType: 'custom'` tour renders the inquiry CTA and never calls `/api/bokun/reserve`.
