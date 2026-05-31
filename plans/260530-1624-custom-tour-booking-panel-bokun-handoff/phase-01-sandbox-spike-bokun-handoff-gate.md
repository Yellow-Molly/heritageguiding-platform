---
phase: 1
title: "Sandbox Spike - Bokun Handoff Gate"
status: gate-decided-escalated
priority: P1
effort: "0.5-1d"
dependencies: []
---

# Phase 1: Sandbox Spike - Bokun Handoff Gate

## GATE OUTCOME (2026-05-31) — FINAL: A, B, B' all disproven → Phase 6
**Run:** local → `api.bokuntest.com`. Full evidence: `research/handoff-spike-findings.md` + `research/raw-output/`.
- **Plan A (widget deep-link pre-fill): DISPROVEN.** Widget ignores `date`/`startTimeId`/`participants` (baseline vs with-params screenshots pixel-identical, both blank).
- **Plan B (HMAC reserve → Bokun-hosted-payment redirect URL): NOT SUPPORTED.** `/checkout.json/*` endpoints exist but return no hosted-payment URL; `RESERVE_FOR_EXTERNAL_PAYMENT` = caller collects payment (= rejected Plan D). No redirect host anywhere.
- **Plan B' (pre-build widget `shoppingCart` session + resume in-widget — user-authorized follow-up): NOT FEASIBLE.** Widget session is cookie-bound + server-signed (`bokun_widgets_sign…` bcrypt); widget ignores injected `?sessionId=` and preset localStorage; cross-origin signed cookie can't be forged/transferred. Server-prebuilt cart cannot be resumed in the user's browser.
- **Notable side-finding:** prod availability path `/restapi/v2.0/activity/{id}/availabilities` **404s** on this sandbox account (account uses the old `/activity.json` Booking API). Must resolve regardless.
- **Per-person (#8): not verifiable** — no per-person experience on this sandbox.
- **Decision (user pre-authorized restyle fallback): proceed Phase 6.** Phases 2–5 (custom panel) CANCELLED — not achievable. ⚠️ Phase 6 core steps modify the shared PROD Bokun account (admin config + Theme CSS), not code.

## Overview
Decide HOW our selection hands off to Bokun-hosted payment, verified on the Bokun **sandbox** before any UI/services are built. This is a hard gate: its outcome selects what Phases 2–4 implement (Plan B primary; Plan A fallback; Plan C → Phase 6).

## Key Insight
Every clean "Bokun-pays" handoff relies on an undocumented Bokun capability (research report). Add-ons-in-panel REQUIRES the reservation/cart path (Plan B) because deep-links (Plan A) cannot carry Extras. The make-or-break unknown: **does a "resume Bokun-hosted checkout for a reserved cart (with extras)" URL exist?**

## Requirements
- Functional: produce a verified, repeatable handoff that lands a sandbox customer on Bokun-hosted payment with date + time + participants (+ extras) pre-applied, for BOTH per-group and per-person experiences.
- Non-functional: zero in-house card handling; findings documented; decision recorded.

## Architecture / what to probe (in priority order)
1. **Plan B — reservation/cart → resume hosted checkout (PRIMARY):**
   - `POST /checkout.json/submit` with `paymentMethod: RESERVE_FOR_EXTERNAL_PAYMENT` → expect `status: RESERVED`, `confirmationCode`, 30-min hold. Inspect response for any hosted/redirect/payment-link URL.
   - And/or `/cart.json/create` → `/cart.json/{cartUUID}/activity` (with extras) → look for a hosted checkout URL for `{cartUUID}`.
   - Find the URL that RESUMES that cart/booking on Bokun-hosted payment. This is the gating unknown.
2. **Extras attach:** confirm Extras (our pushed `bokunExtraId`s) can be added to the reservation/cart and appear in its total.
3. **Per-person vs per-group wire shape:** capture `pricingCategoryBookings` / `bookedPricingCategories` (occupancy/groupSize) for a flat "Per group" category AND an Adult/Child per-person experience.
4. **Plan A — deep-link (FALLBACK):** test whether `widgets.bokun.io/online-sales/{uuid}/experience/{expId}?date=&startTimeId=&participants=` (and multi-category quantities) pre-selects on the hosted page. (Cannot carry extras.)
5. **Confirm semantics:** on CARD payment, does Bokun auto-confirm or require `POST /checkout.json/confirm-reserved/{code}`? Does our existing `/api/bokun/webhook` fire on the reserved→paid transition?

## Related Code Files
- Reuse/extend: `scripts/spike-bokun-extras-write-api.ts` (precedent), `apps/web/lib/bokun/bokun-api-client-with-hmac-authentication.ts`.
- Create: `scripts/spike-bokun-checkout-handoff.ts` (sandbox-only; reads `BOKUN_API_KEY`/`BOKUN_SECRET_KEY`/`NEXT_PUBLIC_BOKUN_UUID` for `bokuntest.com`).
- Output: `plans/260530-1624-custom-tour-booking-panel-bokun-handoff/research/handoff-spike-findings.md` + a captured sample JSON.

## Implementation Steps
1. Identify/create a sandbox per-group experience (have one) AND a per-person experience (may need to push via existing sync). Note experience IDs + an Extra id.
2. Script Plan B: create reservation/cart with slot + participants (+ extras); capture full response; extract any hosted/redirect URL; open it in a browser and confirm the selection + total are pre-applied and payment can proceed.
3. If no resume URL on the response, probe documented hosted URL shapes for resuming a cart/booking (`cartUUID`, `confirmationCode`).
4. Test Plan A deep-link pre-fill for both pricing modes.
5. Record: which path works, exact endpoints/URLs/params/bodies, hold TTL, confirm semantics, whether webhook fires.
6. **Decision gate** — pick the path. If Plan B works → Phases 2–4 build it with add-ons. If only Plan A works → re-confirm with user: defer add-ons (hold ~5d) or go Phase 6. If neither → Phase 6 (restyle).

## Success Criteria
- [ ] Documented, repeatable handoff to Bokun-hosted payment for per-group AND per-person, with selection pre-applied.
- [ ] Extras-carry verified (Plan B) OR explicitly proven impossible (triggers scope re-confirm).
- [ ] Exact endpoints/URLs/bodies/params + 30-min hold + confirm semantics recorded in findings file.
- [ ] Path decision (B / A / C) written into `plan.md` and this phase.

## Risk Assessment
- **Resume-checkout URL may not exist** → Plan B dead → add-ons can't ride to Bokun payment. Mitigation: documented fallback to Plan A (defer add-ons) or Phase 6; re-confirm scope with user (do not silently drop add-ons).
- Sandbox writes hit a shared test account — use clearly-labelled QA data; never run against prod creds.
- Per-person multi-category handoff is less certain than per-group — both must be proven here, not assumed.

## Security
- **Run the spike LOCAL-only (`next dev` / a node script on localhost).** Do NOT run reservation writes from a deployed (staging/preview/prod) environment: the Bokun host switch keys on `NODE_ENV` only (`bokun-api-client-with-hmac-authentication.ts:81`) and Vercel runs staging as `NODE_ENV=production` → staging/preview hit the **live Bokun.io production account** (memory: bokun-environment-topology). A deployed write = a real prod hold (red-team #1).
- Never commit creds or captured PII (redact sample JSON). Mirror the refuse-on-prod guard in `scripts/spike-bokun-extras-write-api.ts`.

## Red Team Hardening (applied 2026-05-31) — additional REQUIRED gate outputs
The spike must produce ALL of these before Phase 2 starts (each was a red-team blocker):
1. **Event + status capture (#3):** the exact Bokun webhook event(s) and `booking.status` string emitted (a) on reserve and (b) on reserve→CARD-paid. Confirm whether `/api/bokun/webhook` even fires for the external-payment transition. (Drives the webhook `STATUS_MAP` + email-gate extension in Phase 2.)
2. **confirm-reserved semantics (#4):** does the Bokun-hosted CARD checkout AUTO-confirm a `RESERVE_FOR_EXTERNAL_PAYMENT` booking, or require `POST /checkout.json/confirm-reserved/{code}`? If the reserve-for-external method means *we* must collect/confirm payment, that contradicts "Bokun keeps payment" → STOP and escalate; the architecture is wrong. Capture which hosted URL actually collects card payment.
3. **Resolved redirect host(s) (#11):** record the exact host(s) of the working hosted-checkout/payment URL (may NOT be `widgets.bokun.io`). This list becomes the Phase 2/4 server-side redirect allowlist — do not assume widget hosts.
4. **Extras-carry proof (#16 decision):** prove selected Extras ride into the hosted-checkout total. **If unproven → auto-decide: defer add-ons to Bokun's own checkout (Plan A), panel = date/time/people only. No second user ask.** Record the decision in findings.
5. **Per-person rate shape (#8):** capture a REAL per-person availability response and confirm `rates[]` carries usable per-age-band unit prices (`ageBand` + price). If availability only returns a flat rate (per-age-band pricing lives on the separate experience-pricing type, not `/availabilities`), flag it — per-person total cannot be computed from `rates[]` and Phase 2/3 per-person scope must change.
6. **Idempotency token (#13):** does Bokun's submit/cart accept a client idempotency token? If yes, Phase 2 passes it; if no, Phase 2 must build server-side dedup.
7. **Hold TTL + orphan behavior (#13):** confirm the 30-min hold and what happens to inventory on abandon (for the orphan-hold risk in Phase 2).

## Output location fix (#17)
Create `plans/260530-1624-custom-tour-booking-panel-bokun-handoff/research/` before writing `handoff-spike-findings.md` (the subdir does not exist yet).
