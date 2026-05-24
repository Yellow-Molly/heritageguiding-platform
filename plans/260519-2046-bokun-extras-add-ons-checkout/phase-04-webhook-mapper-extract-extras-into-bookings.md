---
phase: 04
title: "Webhook Mapper — Extract Bokun Extras Into bookings.addOns"
status: complete
priority: P1
effort: 2-3h
blockedBy: [01, 02]
blocks: [05]
completed: 2026-05-25
---

# Phase 04 — Webhook Mapper Extension

## Context Links

- Mapper to extend: `apps/web/lib/bokun/map-bokun-webhook-to-booking-row.ts`
- Mapper unit tests: `apps/web/lib/bokun/__tests__/map-bokun-webhook-to-booking-row.test.ts`
- Persistence caller: `apps/web/lib/bokun/persist-bokun-booking.ts`
- Phase 01 findings: `plans/260519-2046-bokun-extras-add-ons-checkout/research/bokun-extras-shape-findings.md`

## Overview

**Priority:** P1
**Status:** complete (2026-05-25) — `mapBokunExtras` extracts from `lineItems` (filtered by `extraId`), envelope-tolerant for `productBookings` and `activityBookings`; 7 new unit tests (15 total mapper tests pass)

Extend `mapBokunWebhookToBookingRow` to extract extras into the new `addOns` column. Pure mapper — no Payload calls (matches existing pattern). Persistence layer (`persist-bokun-booking.ts`) automatically writes the new field because it spreads `...row` into `writeData`.

## Key Insights

- Mapper stays pure → unit-testable from a fixture JSON
- If extras array missing/empty → `addOns: undefined` (column nullable), no row noise
- Currency on each line — may differ from booking currency in some Bokun setups; preserve per-line currency
- `unitPrice` + `totalPrice` both stored as **strings** (Bokun monetary convention; matches existing `totalPrice` field)

## Requirements

**Functional:**
- Webhook with extras → `bookings.addOns` populated with array of `{ bokunExtraId, name, qty, unitPrice, totalPrice, currency, perPerson }`
- Webhook without extras → `bookings.addOns` is `undefined` (not written)
- Webhook update flow (existing booking + new event) overwrites `addOns` with latest payload state (matches existing "last write wins" behavior for other fields)

**Non-functional:**
- Mapper remains pure (no I/O)
- Existing tests still pass; new fixture-based test covers extras path

## Architecture

### Mapped row shape addition

`apps/web/lib/bokun/map-bokun-webhook-to-booking-row.ts`:

```ts
export interface MappedAddOnLine {
  bokunExtraId: string
  name: string
  qty: number
  unitPrice: string
  totalPrice: string
  currency: string
  perPerson: boolean
}

export interface MappedBookingRow {
  // ...existing fields...
  addOns?: MappedAddOnLine[]
}
```

### Extraction function

Exact JSON path determined by Phase 01 findings. Placeholder (assume `booking.extras[]` based on common Bokun docs):

```ts
function mapBokunExtras(booking: BokunBooking): MappedAddOnLine[] | undefined {
  // Adjust path per Phase 01 findings:
  const raw = (booking as unknown as { extras?: BokunExtraLine[] }).extras
  if (!raw || raw.length === 0) return undefined

  return raw.map((e) => ({
    bokunExtraId: String(e.id ?? e.extraId ?? ''),  // confirm key in Phase 01
    name: e.title ?? e.name ?? 'Add-on',
    qty: e.quantity ?? e.count ?? 1,
    unitPrice: String(e.unitPrice ?? e.pricePerUnit ?? '0'),
    totalPrice: String(e.totalPrice ?? e.price ?? '0'),
    currency: e.currency ?? booking.currency,
    perPerson: Boolean(e.perPerson ?? e.pricedPerPerson ?? false),
  }))
}
```

Then in `mapBokunWebhookToBookingRow`:
```ts
return {
  // ...existing fields...
  addOns: mapBokunExtras(booking),
}
```

### Persistence — no changes needed

`persist-bokun-booking.ts` uses `...row` spread into `writeData`, so `addOns` flows through automatically.

## Related Code Files

**Modify:**
- `apps/web/lib/bokun/bokun-types.ts` — add `BokunExtraLine` interface (from Phase 01)
- `apps/web/lib/bokun/map-bokun-webhook-to-booking-row.ts` — add `MappedAddOnLine`, `mapBokunExtras`, extend `MappedBookingRow`
- `apps/web/lib/bokun/__tests__/map-bokun-webhook-to-booking-row.test.ts` — new test cases

**Create:**
- `apps/web/lib/bokun/__tests__/fixtures/bokun-webhook-with-extras.json` — sanitized copy of Phase 01 sample for test isolation

**Read (do not modify):**
- `apps/web/lib/bokun/persist-bokun-booking.ts` — verify spread still covers new field
- `packages/cms/collections/bookings.ts` — confirm `addOns` field present

## Implementation Steps

1. Copy Phase 01 sanitized fixture into `__tests__/fixtures/bokun-webhook-with-extras.json`
2. Add `BokunExtraLine` interface to `bokun-types.ts` matching observed Phase 01 shape
3. Implement `mapBokunExtras` in `map-bokun-webhook-to-booking-row.ts`
4. Wire into `mapBokunWebhookToBookingRow` return object
5. Add unit tests:
   - Fixture with 2 extras → 2 add-on lines, correct fields
   - Fixture with 0 extras / no extras key → `addOns: undefined`
   - Edge: missing optional fields default sensibly (qty=1, currency falls back to booking currency)
6. Run existing tests — all pass (no regressions)
7. Manual integration: hit the webhook handler locally with the fixture payload; verify a booking row is created with `addOns` populated
8. Typecheck + lint green

## Todo List

- [x] Fixture file in `__tests__/fixtures/bokun-webhook-with-extras.json` (sanitized from Phase 01 capture)
- [x] Extras types added to `bokun-types.ts` (split into `BokunExtraEnvelope` + `BokunExtraDefinition` + `BokunBookingLineItem` per observed shape)
- [x] `MappedAddOnLine` + `addOns?` on `MappedBookingRow`
- [x] `mapBokunExtras` implemented (walks lineItems filtered by `extraId`, cross-refs envelope for clean name + perPerson flag)
- [x] Wired into mapper return
- [x] Unit tests: with extras, without, lineItem-title-fallback, currency-fallback, activityBookings-envelope, multi-line flatten (7 new tests)
- [x] Existing mapper tests still pass (15/15 total, 171/171 across project)
- [ ] Manual local webhook test → DB row has `addOns` (pending real paid sandbox booking — non-blocking)
- [x] Typecheck green

## Success Criteria

- Unit test coverage for both extras paths (with + without)
- Real fixture from Phase 01 round-trips correctly
- No regression in existing booking mapper tests
- DB row inspected post-webhook shows structured `addOns` JSON

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Phase 01 findings wrong on exact JSON path | Mapper has fallback chains (`e.id ?? e.extraId`) for known alt-names; tests pinned to observed shape |
| Bokun emits extras differently in `BOOKING_MODIFIED` vs `BOOKING_CREATED` | Phase 01 todo includes capturing both; test fixture for each |
| Numeric `qty` arrives as string | `Number()` coerce in mapper; test covers |
| `addOns` column not yet migrated when webhook arrives | Migration runs as part of Phase 02 deploy step — gate Phase 04 deploy on Phase 02 deploy |

## Security Considerations

- `name` rendered as plain text downstream (admin JSON viewer, email template escaped) — no injection vector if treated as data
- No PII in extras fields → safe to log

## Next Steps

- Phase 05 (emails) consumes `MappedAddOnLine[]` shape directly
- Future Phase 2 work: same shape could power a "purchased add-ons" report in admin dashboard

## Unresolved Questions

- If Bokun separates extras by `productBooking`, do we flatten across all products or namespace per product? **Default v1:** flatten (MVP bookings have one product anyway, per existing mapper comment).
