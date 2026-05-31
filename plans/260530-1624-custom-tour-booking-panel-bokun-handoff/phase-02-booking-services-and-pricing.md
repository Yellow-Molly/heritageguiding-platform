---
phase: 2
title: "Booking Services and Pricing"
status: pending
priority: P1
effort: "1.5-2d"
dependencies: [1]
---

# Phase 2: Booking Services and Pricing

## Overview
Server-side booking layer: build the reservation/handoff service + money-critical pricing/total computation from live Bokun rates, exposed via an API route the panel calls. Implements the handoff path chosen in Phase 1.

## Key Insight
The panel total must EQUAL what Bokun charges. Compute from live availability `rates[]` (per-person) or the flat group rate (per-group) + Extras — never from CMS `basePrice` (display hint only). Money path → mandatory tests.

## Requirements
- Functional: given experienceId + date + startTimeId + participants (+ selected extras), (a) compute an authoritative total, (b) create a Bokun reservation/cart (Plan B) and return a hosted-checkout redirect URL — OR build a deep-link (Plan A) if that is the chosen path.
- Non-functional: input validation, idempotency on reservation create, 30-min hold awareness, typed errors, no secrets to client, rate-limit/backoff (reuse client).

## Architecture
- Reuse `getBokunClient()` (HMAC) and `getCachedBokunAvailability()` from `apps/web/lib/bokun/`.
- New pricing module: pure functions, deterministic, unit-tested. Per-group → flat rate (qty 1 group, group-size does not multiply). Per-person → Σ(ageBand count × rate.price). Extras → per-booking (×1) or per-person (×participants or ×qty) per the captured shape from `plans/260519-2046-.../research/bokun-extras-shape-findings.md`.
- New reservation service: maps panel selection → Bokun reservation/cart payload (using Phase 1's verified wire shape incl. `pricingCategory`/occupancy and extras), returns `{ redirectUrl, confirmationCode, holdExpiresAt, total }`.
- New API route validates + orchestrates; client never holds HMAC secret.
- All money as strings/integers per Bokun convention (never float arithmetic for currency).

## Related Code Files
- Read for context: `apps/web/lib/bokun/bokun-types.ts`, `bokun-availability-service-with-caching.ts`, `bokun-booking-service-and-widget-url-generator.ts`, `apps/web/lib/env.ts`, `apps/web/app/api/bokun/availability/route.ts`.
- Create:
  - `apps/web/lib/bokun/compute-booking-total-from-rates.ts` (+ `__tests__/`)
  - `apps/web/lib/bokun/create-bokun-reservation-and-handoff-url.ts` (+ `__tests__/`) — name the export by behavior, not "Plan B"
  - `apps/web/app/api/bokun/reserve/route.ts` (POST; validate, orchestrate, return redirect URL)
- Modify: `apps/web/lib/bokun/index.ts` (export new modules); `bokun-types.ts` (add reservation request/response types).
- Keep each file < 200 lines (modularize per repo rule).

## Implementation Steps
1. Implement `compute-booking-total-from-rates`: inputs (priceType, rates, participants, extras[]) → `{ lines: [...], total, currency }`. Cover per-group flat, per-person age bands, per-booking + per-person extras.
2. Implement reservation service using Phase 1's verified endpoint/body; return redirect URL + holdExpiresAt + confirmationCode. Add idempotency key (experienceId+startTimeId+participants hash) to avoid duplicate holds on double-submit.
3. Add `POST /api/bokun/reserve` route: validate (experienceId regex, date, startTimeId, participant bounds, extra ids), call service, map `BokunError` → status; return `{ redirectUrl, total, currency, holdExpiresAt }`.
4. If Phase 1 chose Plan A: implement `build-checkout-handoff-url` (deep-link) instead of reservation; route returns the URL. Keep total computation either way.
5. Export from `lib/bokun/index.ts`; add types; run typecheck.

## Success Criteria
- [ ] Pricing fns return exact totals matching Phase 1 sandbox captures for per-group, per-person, +extras (unit-tested).
- [ ] `POST /api/bokun/reserve` returns a working hosted-checkout redirect URL (or deep-link) for a sandbox booking.
- [ ] Idempotent reservation create (same selection within hold window does not create a second hold).
- [ ] No HMAC secret reachable from client; inputs validated; `BokunError` mapped to sane HTTP codes.
- [ ] Typecheck + unit tests green.

## Risk Assessment
- Wire-shape drift from Phase 1 assumptions → keep the reservation payload builder thin and covered by a fixture test using the Phase 1 captured JSON.
- 30-min hold expiry → return `holdExpiresAt`; panel/Phase 4 must redirect promptly; abandoned holds expire server-side (no cleanup needed for v1, note it).
- Currency precision → integers/strings only; add a test asserting no float drift.

## Security
- Server-only HMAC; validate + sanitize all inputs; never echo Bokun raw error bodies with secrets.

## Red Team Hardening (applied 2026-05-31)
Mandatory additions before this phase is "done":

**Data-contract prerequisites (do FIRST — Phase 3 has no data without these):**
- **(#6)** Extend `FeaturedTour`/`TourDetail` + `mapPayloadTourToTourDetail` to surface `priceType`, `currency`, `childPrice` (exist CMS-side: `tour-pricing-fields.ts:19,30,44`; dropped at `tour-payload-mapper.ts:356-370`). Pick ONE canonical literal set (reuse `per_group`/`per_person`/`custom` from CMS). Handle `priceType: 'custom'` (a real CMS value) — decide its UI (default to per-group flat or inquiry). Bump `getTourBySlug` cache key `v3`→`v4` (`get-tour-by-slug.ts:140`). Audit homepage `FeaturedTour` consumers for the new fields.
- **(#7)** Add `bokunExtraId` to the client `OptionalAddOn` + mapper output (currently filtered-on but omitted at `tour-payload-mapper.ts:303`). Without it the panel cannot attach extras to a reservation.

**Endpoint reality (#5):** `create-bokun-reservation-and-handoff-url.ts` is NET-NEW. Do NOT reuse `createBokunBooking` (`bokun-booking-service-and-widget-url-generator.ts:38` → `/restapi/v2.0/booking`) — it is the wrong endpoint, has a customer-details body (not `RESERVE_FOR_EXTERNAL_PAYMENT`/`pricingCategoryBookings`), and is covered only by a mocked-client test. Treat it as possibly-dead-code (decide its fate). Use the exact endpoint/body Phase 1 verified; back the money path with an integration test against the Phase-1 captured fixture, not just unit mocks.

**Prod-write safety gate (#1):** the reservation write path must refuse to call prod Bokun unless explicitly enabled. Add an independent gate (e.g. `BOKUN_RESERVE_WRITE_ENABLED` + assert genuine prod via `VERCEL_ENV==='production' && IS_STAGING!=='true'`) — do NOT rely on `NODE_ENV`. Mirror the spike script's refuse-on-prod guard.

**Inbound abuse control (#2):** apply `checkRateLimit` (`lib/rate-limit-by-ip.ts`, as `/api/contact` does) to `POST /api/bokun/reserve`, keyed per IP+experienceId, tighter than the contact default; return 429 before any Bokun write. Note the limiter is in-memory/per-instance — add a short server-side reserve cooldown per experienceId+slot as defense-in-depth.

**Authorization / anti-tampering (#10):** server re-loads the tour by `experienceId`; assert every submitted `extraId ∈ tour.optionalAddOns[].bokunExtraId`; assert participant counts against the live `rates[]`/occupancy; compute the total ONLY from server-fetched rates. Reject foreign extras (unit test).

**Server-side redirect validation (#11):** validate the Bokun-returned `redirectUrl` ON THE SERVER before returning it: `new URL()`, assert `https:` + `hostname` ∈ the Phase-1-verified host allowlist (env-appropriate). Reject otherwise. Client re-asserts as defense-in-depth, never as the primary gate.

**Authoritative total + sold-out (#12):** after creating the reservation, treat its `totalDue` as authoritative; if it diverges from the cache-derived quote, re-present the corrected total and require explicit re-confirm before redirect (never silently redirect at an unseen price). Map a "slot unavailable at reserve" rejection to a distinct user-facing state that cache-busts + refetches availability (not a blind retry).

**Idempotency / hold lifecycle (#13)** <!-- Updated: Validation Session 1 - dedup = client guard + Bokun token, KV dropped for v1 -->: v1 dedup = **client single-submit guard** (disable CTA on click + immediate redirect) **plus a Bokun idempotency token IF Phase 1 finds one** (pass it on submit). **No Vercel KV store in v1** (cross-instance dedup deferred to v2 — document the gap honestly; do not claim cross-instance idempotency). Regardless, **log reserve-issued-vs-paid** for orphan-hold observability (#13 orphan risk: low per-slot capacity on private tours → abandoned 30-min holds can show "sold out"; treat as a real risk, not a deferred note). Update the Phase-2 success criterion to match (client-guard, not a store).

**Custom pricing → inquiry-only (#validation):** when `tour.priceType === 'custom'`, do NOT compute a total or create a reservation — there is no flat/per-person price to authoritatively price. The tour surfaces an inquiry/"Request a quote" path instead (reuse the existing inquiry flow). The pricing fn + reserve route should reject/short-circuit `custom`.

**Webhook extension (#3)** (own sub-task here or a dedicated step): add `RESERVED` to `BokunBooking['status']` (`bokun-types.ts:60`) + `STATUS_MAP` (`map-bokun-webhook-to-booking-row.ts:20`); extend `isFirstActive` (`persist-bokun-booking.ts:88`) and `revalidateAvailability` (`webhook/route.ts:164`) to include `PAYMENT_RECEIVED`; define RESERVED-row semantics (persist but do NOT email until paid). Add `RESERVED`/reserved tracking to the `bookings.lastWebhookEvent` options if needed for ops visibility.

**Per-person gating (#8):** only implement per-person `Σ(ageBand × rate.price)` if Phase 1 confirmed availability `rates[]` carries per-age-band unit prices; otherwise per-person pricing comes from a different endpoint and this phase's scope changes — flag at the gate.
