---
title: "Custom Tour Booking Panel with Bokun Hosted Checkout Handoff"
description: "Replace the embedded Bokun checkout widget with our own selection panel (date/time/participants/add-ons) that hands off to Bokun-hosted payment. Per-group + per-person. UI matches verified Pencil design (Option B). Spike-gated handoff."
status: pending
priority: P1
branch: "master"
tags: [bokun, booking, checkout, ui, payments-adjacent]
blockedBy: []
blocks: []
created: "2026-05-30T14:29:46.750Z"
createdBy: "ck:plan"
source: skill
---

# Custom Tour Booking Panel with Bokun Hosted Checkout Handoff

## Overview

Replace the embedded Bokun widget (iframe) on the Tour Detail page with our own **selection panel** — date → time → participants → add-ons → live total → "Continue to secure checkout". **Bokun keeps payment** (merchant of record, PCI, payout); we hand off to Bokun-hosted checkout to pay. Supports **per-group flat** and **per-person** pricing, plus Bokun Extras (add-ons) in-panel. UI is a 1:1 build of the **verified Pencil design** (Option B Booking-First, frames `De84B` desktop + `uyeIW` mobile in `pencils/tour-detail.pen`).

**Spike-gated:** Phase 1 decides the handoff mechanism on the Bokun sandbox before UI/services are committed. Add-ons-in-panel requires the reservation/cart path (Plan B). If the spike disproves it, fall back to deferring add-ons (Plan A) or restyling the widget (Phase 6) — re-confirm scope with user at the gate; do not silently drop add-ons.

## Context / Inputs (read these)

- Brainstorm summary: `plans/reports/brainstorm-260530-1429-custom-booking-selection-panel-bokun-handoff-report.md`
- Handoff research (ranked mechanisms): `plans/reports/researcher-260530-1437-bokun-hosted-checkout-handoff-report.md`
- Design brief: `plans/reports/design-brief-260530-1511-tour-booking-panel-ai-designer-prompt-report.md`
- **Verified design**: `pencils/tour-detail.pen` → `De84B` "Booking Panel — Desktop Sidebar (380px)", `uyeIW` "Booking Panel — Mobile (375px)" (verified 2026-05-30 vs brief; PASS).

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Sandbox Spike - Bokun Handoff Gate](./phase-01-sandbox-spike-bokun-handoff-gate.md) | **DONE — gate decided (A+B disproven), escalated to user** |
| 2 | [Booking Services and Pricing](./phase-02-booking-services-and-pricing.md) | BLOCKED (gate) |
| 3 | [Booking Panel UI Desktop](./phase-03-booking-panel-ui-desktop.md) | BLOCKED (gate) |
| 4 | [Mobile Sheet and Page Integration](./phase-04-mobile-sheet-and-page-integration.md) | BLOCKED (gate) |
| 5 | [Tests Accessibility and Sandbox E2E](./phase-05-tests-accessibility-and-sandbox-e2e.md) | BLOCKED (gate) |
| 6 | [Contingency Widget Restyle](./phase-06-contingency-widget-restyle.md) | **ACTIVE — only viable path (gate-fail fallback, user pre-authorized)** |

## ⚠️ Phase 1 Gate Outcome — FINAL (2026-05-31)
Spike ran on the Bokun sandbox (`scripts/spike-bokun-checkout-handoff.ts`, `e2e/spike-bokun-widget-*.mjs`; evidence in `research/handoff-spike-findings.md` + `research/raw-output/`).
**All three candidate handoffs disproven:**
- **Plan A** (deep-link pre-fill): widget ignores `date`/`startTimeId`/`participants` (identical blank screenshots).
- **Plan B** (HMAC reserve → hosted-payment URL): no URL returned; `RESERVE_FOR_EXTERNAL_PAYMENT` puts payment on us (rejected Plan D).
- **Plan B'** (pre-build widget `shoppingCart` session, resume in-widget — user-authorized follow-up): **not feasible** — session is cookie-bound + server-signed (`bokun_widgets_sign…` bcrypt); widget ignores injected `?sessionId=` / localStorage; cross-origin cookie can't be forged or transferred.

**Decision (user pre-authorized "if B' dead-ends → restyle"): proceed with Phase 6 (restyle the live widget).** Phases 2–5 (custom panel) are **CANCELLED — not achievable** against this Bokun account.
**Side-finding (VERIFIED both hosts directly, 2026-05-31):** `getBokunAvailability`'s `/restapi/v2.0/activity/{id}/availabilities` returns **404 on BOTH sandbox (`api.bokuntest.com`, exp 24010) AND prod (`api.bokun.io`, exp 1215959)** — confirmed via direct HMAC probe (`scripts/bokun-availability-host-probe.ts`), not the app route. Only the OLD **`/activity.json/{id}/availabilities`** serves availability (200 both hosts). So the production availability service is a **confirmed latent bug** (wrong endpoint for Bokun's "experience" model) — but **dead code with no UI consumer** (real availability = widget's `/widgets/` API), **zero user impact**, site pre-launch. Fix = repoint to `/activity.json/{id}/availabilities` (different response shape; mapped in the spike) or delete the service+route. Not a launch blocker.
**⚠️ Phase 6 caveat:** its core steps (dashboard pricing-category occupancy/maxPerBooking + Theme CSS injection) modify the **shared production Bokun account** (staging+prod share it) — production-affecting, applied in Bokun admin, not code.

## Dependency graph

- **P1 (gate)** → unblocks all. Decides Plan B (primary) vs Plan A (fallback) vs Plan C (Phase 6).
- **P2** depends P1. **P3** UI can start after P1 (design known); its handoff wiring depends P2.
- **P4** depends P2 + P3. **P5** depends P3 + P4. **P6** runs ONLY if P1 gate fails (A+B both dead).

## Key decisions (locked)

- Payment stays on Bokun (no in-house PCI). Selection-only panel.
- Per-group flat + per-person both supported; **per-person requires data plumbing** (`priceType`/`currency`/`childPrice` onto `TourDetail`) + Phase-1 confirmation that Bokun availability returns per-age-band rates (red-team #6/#8).
- **Add-ons in-panel is the target, but the Phase-1 spike decides**: if extras-carry into the hosted-checkout handoff cannot be proven, auto-fall to deferring add-ons to Bokun's own checkout (no second ask). Requires `bokunExtraId` surfaced to the client (red-team #7/#16).
- Calendar = **popover** from a trigger field (not inline).
- Pricing authority = **the Bokun reservation response `totalDue`** (reconcile the cache-derived quote against it before redirect); availability `rates[]` are a 60s-cached display estimate only (red-team #12).
- **Color tokens: live `globals.css` is canonical** — accent `#C05030`, secondary `#856C2D` (NOT the Pencil coral `#E67E5A`/`#C4A052`). Build the panel from live tokens; it will differ slightly from the `.pen` (red-team #9).
- Reuse: `apps/web/lib/bokun/*` (availability service, HMAC client), `components/booking/group-inquiry-modal.tsx`. **NOTE:** the webhook round-trip is NOT reservation-ready (`RESERVED` unmapped, email gate skips `PAYMENT_RECEIVED`) — must be extended (red-team #3). The existing `createBokunBooking`→`/restapi/v2.0/booking` is the WRONG endpoint (mock-only) — the reservation service is net-new (red-team #5).

## Estimate (honest, revised post-red-team)

~**9–12 working days** excl. contingency. The red-team added real prerequisite work the first estimate (6.5–8.5d) missed: TourDetail/OptionalAddOn data plumbing + cache bump, webhook RESERVED/PAYMENT_RECEIVED extension, server-side reserve auth/rate-limit/IDOR/redirect validation, idempotency store, `@radix-ui/react-dialog` a11y sheet, and the existing-e2e fix. If the Phase-1 spike forces add-ons to defer (Plan A), trim ~1.5–2d. Phase 6 adds ~0.5–1d only if the gate fails. **All downstream estimates are contingent on a successful Phase-1 gate.**

## External dependency (in-code, partially ready)

Add-ons rely on Bokun Extras push-sync, already implemented (`apps/web/lib/bokun/map-addons-to-bokun-extras.ts`, `packages/cms/lib/bokun-sync-job.ts`) — so Extras exist Bokun-side. BUT `bokunExtraId` is NOT surfaced to the client `OptionalAddOn` (`tour-payload-mapper.ts:303` filters on it but omits it) — Phase 2 must add it before the panel can attach extras (red-team #7). No blocking dependency on an unfinished plan.

## Red Team Review

### Session — 2026-05-31
**Reviewers:** 4 (Security Adversary, Failure Mode Analyst, Assumption Destroyer, Scope & Complexity Critic) · Full tier.
**Findings:** 17 adjudicated (28 raw, deduped). **15 accepted**, 2 routed to user decision.
**Severity:** 7 Critical, 8 High, 2 Medium.
**Inter-reviewer reconciliations:** Playwright e2e harness DOES exist at repo-root `e2e/` (not `apps/web/e2e/`); widget script-exists guard DOES exist (`bokun-booking-widget-with-fallback.tsx:182`).

**User decisions on routed findings:**
- #8 Per-person: **KEEP + add plumbing** (priceType/currency/childPrice onto TourDetail; Phase 1 confirms per-age-band rates).
- #16 Add-ons-in-panel: **Phase-1 spike decides** — auto-defer to Bokun checkout if extras-carry unproven (no second ask).
- #9 Tokens: **live `globals.css` canonical** (`#C05030`/`#856C2D`), not Pencil coral.

| # | Finding | Severity | Disposition | Applied To |
|---|---------|----------|-------------|------------|
| 1 | Staging/preview writes hit PROD Bokun (NODE_ENV-only host switch) | Critical | Accept | Phase 1, 2 |
| 2 | `/api/bokun/reserve` unauth + unrate-limited → inventory-DoS | Critical | Accept | Phase 2 |
| 3 | Webhook can't confirm RESERVED→card-paid (status unmapped, email gate skips PAYMENT_RECEIVED) | Critical | Accept | Phase 1, 2 |
| 4 | confirm-reserved semantics unresolved; RESERVE_FOR_EXTERNAL_PAYMENT may contradict "Bokun pays" | Critical | Accept | Phase 1 |
| 5 | Assumed checkout.json/cart.json endpoints don't exist; existing booking endpoint wrong + mock-only | Critical | Accept | Phase 2 |
| 6 | TourDetail lacks priceType/currency/childPrice | Critical | Accept | Phase 2 |
| 7 | OptionalAddOn has no bokunExtraId at client | Critical | Accept | Phase 2 |
| 8 | Per-person has no data path / may be gold-plating | High | User: KEEP+plumb | Phase 2, 3 |
| 9 | Token palette mismatch (#E67E5A vs live #C05030) | High | User: live canonical | Phase 3 |
| 10 | Price/IDOR: extras not validated vs experience; counts vs rates | High | Accept | Phase 2 |
| 11 | Open-redirect validated client-side; no validator; host = Phase-1 output | High | Accept | Phase 1, 2, 4 |
| 12 | 60s cache vs 30-min hold → reserve sold-out; quote ≠ totalDue | High | Accept | Phase 2 |
| 13 | Hold lifecycle: idempotency stateless/no-store; orphan holds starve prod inventory | High | Accept | Phase 1, 2 |
| 14 | No usable mobile-sheet a11y primitive (no focus-trap/Esc; no radix-dialog) | High | Accept | Phase 4 |
| 15 | Existing e2e asserts widget DOM → silently skips on swap; Phase 5 wrong path | High | Accept | Phase 4, 5 |
| 16 | Add-ons-in-panel forces undocumented Plan B | High | User: spike decides | Phase 1 |
| 17 | Path/scaffold: lazy-bokun-widget path ×3; missing reports/research dirs; over-modularized tree; rollback flag | Medium | Accept | Phase 1, 3, 4 |

### Whole-Plan Consistency Sweep
- Files reread/grepped: plan.md, phase-01…06.
- Decision deltas checked: 10 (tokens→live #C05030; pricing authority→reservation `totalDue`; add-ons→spike-decides; per-person→keep+plumb; endpoints→net-new; webhook→not-ready; NODE_ENV≠safety; widget path; e2e root path; data plumbing).
- Reconciled stale references: 2 (phase-05 `apps/web/e2e/`→`e2e/`; estimate 6.5–8.5d→9–12d).
- Remaining illustrative-only (intentionally kept, pre-disclaimed in Phase 3 Key Insight): Pencil hex `#E67E5A0D`/`#1E3A5F08` in the Phase 3 design source map (layout reference, not build values).
- **Unresolved contradictions: 0.** Plan is internally consistent post-edits.

## Validation Log

### Session 1 — 2026-05-31
Verification pass skipped (Red Team Review already provides `file:line` evidence per validate-workflow guard; no `[UNVERIFIED]` tags). 4 interview questions on remaining decision points:

| Q | Decision | Propagated to |
|---|----------|---------------|
| Custom `priceType` | **Inquiry-only** — `priceType: 'custom'` tours render a "Request a quote"/inquiry path (reuse `GroupInquiryModal`/mailto), never instant booking; no total computed. | Phase 2, 3 |
| Hold dedup | **Client single-submit guard + Bokun idempotency token if Phase 1 finds one.** No Vercel KV in v1 (deferred to v2); log reserve-issued-vs-paid for orphan observability. | Phase 2, 3, 4 |
| Mobile sheet primitive | **Add `@radix-ui/react-dialog`** (focus-trap/Esc/scroll-lock); do NOT hand-harden `dialog.tsx`. | Phase 4 |
| Per-person build trigger | **Build + test per-person this cycle now** (synthetic fixtures if no live `per_person` tour); not gated behind a real tour. Phase 1 must still capture the real per-age-band rate shape so the build is correct. | Phase 2, 3, 5 |

### Whole-Plan Consistency Sweep
- Files reread: plan.md, phase-01…06.
- Decision deltas checked: 4 (custom→inquiry; dedup→client-guard+token, KV dropped; sheet→radix-dialog; per-person→build-now).
- Reconciled stale references: 3 (Phase 2 idempotency "Vercel KV" option removed; Phase 4 "or harden dialog.tsx" alternative removed; Phase 3 per-person "gate" hedge removed).
- Unresolved contradictions: **0.** Verification failures: **0** → plan eligible for implementation.
