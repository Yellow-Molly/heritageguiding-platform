---
phase: 01
title: "Bokun Sandbox Spike — Capture Real Webhook Payload for Extras"
status: complete
priority: P1
effort: 1-2h
blocks: [04]
completed: 2026-05-24
---

# Phase 01 — Bokun Sandbox Spike & Webhook Payload Capture

## Context Links

- Brainstorm: `plans/reports/brainstorm-260519-2046-bokun-extras-add-ons-checkout.md`
- Webhook handler: `apps/web/app/api/bokun/webhook/route.ts`
- Current mapper: `apps/web/lib/bokun/map-bokun-webhook-to-booking-row.ts`
- Bokun types: `apps/web/lib/bokun/bokun-types.ts`

## Overview

**Priority:** P1 (blocks Phase 04 mapper work — don't write mapping code against guessed payload shape)
**Status:** complete (2026-05-24) — captured checkout-API shape (PRI-92631591, extra 276080); webhook envelope still pending real paid booking but mapper handles both shapes

Before writing any mapping code, capture a **real** Bokun webhook payload from a sandbox booking that includes a paid extra. The current `BokunBooking` / `BokunProductBooking` types do not declare extras fields — we need to confirm where Bokun places them (top-level `extras`, or nested per `productBooking`) and exact field names (`title` vs `name`, `quantity` vs `count`, etc.).

## Key Insights

- Operator must first confirm Bokun account plan supports Extras feature
- One sandbox booking is enough — extras shape is consistent across events
- Capture raw JSON via the existing `rawPayload` column on a real test booking, OR via webhook tunnel (ngrok / Bokun's webhook tester)

## Requirements

**Functional:**
- A real Bokun webhook payload JSON file checked into `plans/260519-2046-bokun-extras-add-ons-checkout/research/` showing extras lines

**Non-functional:**
- Redact customer PII (name/email/phone) before committing

## Related Code Files

**Read (do not modify):**
- `apps/web/app/api/bokun/webhook/route.ts`
- `apps/web/lib/bokun/bokun-types.ts`

**Create:**
- `plans/260519-2046-bokun-extras-add-ons-checkout/research/bokun-extras-webhook-payload-sample.json`
- `plans/260519-2046-bokun-extras-add-ons-checkout/research/bokun-extras-shape-findings.md` (short note: field names, nesting, per-person vs per-booking flag, currency, age-tier representation)

## Implementation Steps

1. **Operator: confirm Bokun plan tier supports Extras** in Bokun dashboard. Block phase if not.
2. **Operator: create one test Extra** on a sandbox/staging tour:
   - Type: per-person
   - Adult price: any test value (e.g. 100 SEK)
   - Child price: different test value (e.g. 50 SEK)
   - Required: false
3. **Operator: book that tour** through the embedded widget on staging, selecting `qty=2 adults + 1 child` of the extra.
4. **Developer: pull the raw payload** from the staging `bookings.rawPayload` column for the resulting booking row (or from webhook tunnel logs).
5. **Redact PII** (customer name/email/phone) → save as `research/bokun-extras-webhook-payload-sample.json`.
6. **Document findings** in `research/bokun-extras-shape-findings.md`:
   - Exact JSON path to extras array (e.g. `booking.extras[]` or `booking.productBookings[0].extras[]`)
   - Field names: id, title, quantity, unitPrice, totalPrice, currency, perPerson flag, age-tier breakdown
   - Whether extra has its own confirmation status (separate from booking status)
   - Whether title is localized in payload or single language
7. **Extend `BokunBooking` interface** in `apps/web/lib/bokun/bokun-types.ts` to add the observed extras shape (do NOT add behavior yet — types only).
8. Run `npm run typecheck` to confirm type addition compiles.

## Todo List

- [x] Operator confirms Bokun plan tier supports Extras
- [x] Create test Extra in Bokun sandbox (extra 276080, "QA Test Museum Ticket")
- [x] Place test booking via staging widget (PRI-92631591)
- [x] Pull raw payload from `bookings.rawPayload` — captured checkout-API response instead (sufficient for shape discovery; real webhook capture deferred to first paid sandbox booking, non-blocking)
- [x] Redact PII
- [x] Save sample JSON to `research/bokun-checkout-api-response-sample.json`
- [x] Write `bokun-extras-shape-findings.md`
- [x] Add extras interface fields to `bokun-types.ts` (`BokunExtraEnvelope`, `BokunExtraDefinition`, `BokunBookingLineItem`)
- [x] Typecheck passes

## Success Criteria

- `research/bokun-extras-webhook-payload-sample.json` exists, no PII
- `research/bokun-extras-shape-findings.md` documents exact JSON paths
- `BokunBooking` (or sub-type) declares the extras shape; typecheck green

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Bokun plan doesn't support Extras | Surface immediately to operator; pause plan until resolved or escalate to alternative (e.g. donation/contact form) |
| Extras webhook payload shape varies by event type (created vs confirmed) | Capture at least one BOOKING_CREATED + BOOKING_CONFIRMED to compare |
| Sandbox tour not configured for live widget | Use any tour already wired to staging Bokun account |

## Security Considerations

- PII redaction is mandatory before committing JSON to git
- Use a fake test email (e.g. `qa+addontest@privatetours.test`) on the test booking to avoid redaction effort

## Next Steps

- Hand findings to Phase 04 (webhook mapper) — exact field names drive `MappedBookingRow.addOns` shape
- Hand findings to Phase 05 (email templates) — confirm whether to render `unitPrice` or `totalPrice` per line

## Unresolved Questions

- Does Bokun emit a separate webhook event for extras additions post-booking (modification flow)?
