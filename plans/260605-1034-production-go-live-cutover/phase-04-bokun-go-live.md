---
phase: 4
title: "Bokun Production Go-Live"
status: pending
priority: P0
effort: "external (commercial) + 1h config"
dependencies: [3]
---

# Phase 4: Bokun Production Go-Live

## Overview

Make "Book Now" actually transact in production. The code already targets the live Bokun environment automatically (`NODE_ENV=production` switch) — the blockers are **commercial** (onboarding) and **data** (Experience-ID mapping), owned by `260430-1520-bokun-go-live`. This phase tracks those to closure and verifies prod config. Per the launch decision, this does NOT block the Phase 01 domain flip, but it gates a "bookable" launch in the Phase 08 matrix. It is a **thin gate input** — `260430-1520-bokun-go-live` remains the source of truth for execution and status; do not duplicate its task tracking here.

## Requirements

- Bokun commercial account live (KYC, payout/Stripe Connect, bank).
- Published tours mapped to Bokun Experience IDs (currently 0/10).
- Production booking-channel UUID + (optional) webhook secret configured.
- Booking widget renders and accepts a test booking on prod.

## Architecture

- `bokun-api-client-with-hmac-authentication.ts:81` → `api.bokun.io` when `NODE_ENV==='production'`, else `api.bokuntest.com`.
- `bokun-booking-service-and-widget-url-generator.ts:104` → `widgets.bokun.io` vs `widgets.bokuntest.com`, same switch.
- `tours/[slug]/page.tsx:69` → tour-detail `<link rel=preconnect>` to `widgets.bokun.io`/`static.bokun.io` (the 3rd `NODE_ENV` site; all auto-switch together — listed for inventory completeness).
- On Vercel both Preview and Production have `NODE_ENV=production` → staging already hits the LIVE Bokun account (canary-tour pattern mitigates). So no env flip needed; the gate is data + commercial.
- `NEXT_PUBLIC_BOKUN_UUID` must be the **production** booking-channel UUID; loading the prod widget against a test UUID silently 404s the iframe.
- `BOKUN_WEBHOOK_SECRET` optional (handler 401s when unset, fails closed) — required only once Bokun registers our webhook endpoint.

## Related Code Files

- Reference (execution owned by `260430-1520-bokun-go-live`): `lib/bokun/*`, webhook route, Bookings collection.
- Verify config: `NEXT_PUBLIC_BOKUN_UUID`, `BOKUN_API_KEY/SECRET_KEY`, `BOKUN_WEBHOOK_SECRET` on Vercel prod (Phase 03 step 4).

## Implementation Steps

1. Track `260430-1520-bokun-go-live` phase-01 (commercial onboarding) + phase-03 (config/test) to done.
2. Map all published tours → Bokun Experience IDs (content; coordinate with `260425-1207-mvp-launch-content-audit` phase-02 + `260430-1520` phase-03). Verify 10/10 (or agreed subset) mapped.
3. Set production `NEXT_PUBLIC_BOKUN_UUID` (prod booking channel) on Vercel.
4. If webhook onboarded: set `BOKUN_WEBHOOK_SECRET`; verify webhook → Bookings persistence + confirmation email (ties to Phase 03 S10 email fix).
5. Verify on prod (or canary): widget loads against `widgets.bokun.io`, availability fetch returns, a test booking completes end-to-end.

## Success Criteria

- [ ] Bokun commercial account live + payouts configured.
- [ ] Published tours mapped to Experience IDs (no unmapped published tour).
- [ ] Prod `NEXT_PUBLIC_BOKUN_UUID` = production channel; widget renders on prod tour pages.
- [ ] Test booking completes; (if webhooks live) booking persists + confirmation email sends.

## Risk Assessment

- **Onboarding is external** — longest pole; may lag the domain flip. Phase 08 records as risk-waiver if launching "browse-only".
- **Test UUID in prod** → silent empty widget. Mitigation: explicit UUID verification + visual check.
- Staging writes to the live Bokun account (shared) — use canary tour for tests, never live-tour test bookings.
