---
plan: bokun-extras-add-ons-checkout
title: "Bokun Extras (Optional Paid Add-ons) at Checkout"
description: "Surface paid add-ons (museum tickets, meals) in Bokun checkout with CMS-side informational mirror + booking record persistence."
status: complete
priority: P2
effort: 1-2d
branch: master
created: 2026-05-19
completed: 2026-05-25
tags: [bokun, cms, payload, checkout, extras, add-ons, i18n]
blockedBy: []
blocks: []
related:
  - plans/260514-1437-bokun-integration/  # Outbound CMS→Bokun text sync (sibling). Phase 2 of this plan would extend that pipeline.
  - plans/260430-1520-bokun-go-live/      # Bokun commercial go-live umbrella.
context:
  brainstorm: plans/reports/brainstorm-260519-2046-bokun-extras-add-ons-checkout.md
---

# Bokun Extras (Optional Paid Add-ons) at Checkout

## Summary

Some tours have "Not Included" items the customer may want to purchase (museum admission, meals). Configure those as **Bokun Extras** so customers pick quantity and pay inside the embedded widget. Platform-side: surface the available add-ons on the tour page (CMS informational mirror, not a sync), capture purchased lines in the Booking record, render in admin UI + emails. **No CMS→Bokun write sync in v1** — operator configures both sides (same pattern as rates today).

## Scope Boundaries

**In v1:**
- CMS `optionalAddOns` array field on Tours (localized; mirrors what's configured in Bokun)
- Tour page UI section between "Included" and "Not Included"
- Bookings collection: `addOns` JSON column + migration
- Webhook mapper extracts purchased extras → `addOns`
- Admin booking detail renders add-on lines
- Confirmation + cancellation emails render add-on lines
- Operator SOP doc (Bokun dashboard config → paste extra ID into CMS)

**Out of v1 (Phase 2 candidates):**
- CMS→Bokun push sync of extras (would extend `260514-1437-bokun-integration`)
- Live validation that `bokunExtraId` exists in Bokun
- Audit script flagging price drift between CMS hint and Bokun actual
- Date/time-slot-conditional add-on availability

## Unresolved (operator-facing, blocks final cutover)

1. **Bokun plan tier supports Extras feature** — confirm via dashboard before Phase 01 spike
2. **Bokun localization model** — per-product vs per-channel-language for extra names; affects Phase 06 SOP step

## Architecture

```
┌─────────────────┐         ┌──────────────────┐
│  Bokun Dashboard│ ◄────── │   Operator (SOP) │ ── paste extra ID ──┐
│  Extras config  │                                                 ▼
│  (truth)        │                                          ┌─────────────┐
└────────┬────────┘                                          │ Payload CMS │
         │                                                   │  Tours →    │
         │ widget renders                                    │  optional   │
         │ extras at checkout                                │  AddOns     │
         ▼                                                   └──────┬──────┘
┌─────────────────┐                                                 │
│ Customer checks │                                                 │ tour page
│ out via widget  │                                                 │ renders
│ (picks qty +    │                                                 ▼
│  pays)          │                                          ┌─────────────┐
└────────┬────────┘                                          │ Tour Detail │
         │ booking webhook                                   │ Page (sv/   │
         ▼                                                   │  en/de)     │
┌─────────────────┐    ┌──────────────────┐                  └─────────────┘
│ /api/bokun/     │ ─► │ map-bokun-       │ ─► bookings.addOns JSON
│ webhook         │    │ webhook-to-      │
└─────────────────┘    │ booking-row      │ ─► admin detail + emails
                       └──────────────────┘
```

## Phases

| # | File | Status | Effort | Blocks |
|---|------|--------|--------|--------|
| 01 | [phase-01-bokun-sandbox-spike-and-webhook-payload-capture.md](./phase-01-bokun-sandbox-spike-and-webhook-payload-capture.md) | complete | 1-2h | 04 |
| 02 | [phase-02-cms-schema-tours-addons-and-bookings-column.md](./phase-02-cms-schema-tours-addons-and-bookings-column.md) | complete | 2-3h | 03, 04 |
| 03 | [phase-03-tour-page-optional-addons-section.md](./phase-03-tour-page-optional-addons-section.md) | complete | 2-3h | — |
| 04 | [phase-04-webhook-mapper-extract-extras-into-bookings.md](./phase-04-webhook-mapper-extract-extras-into-bookings.md) | complete | 2-3h | 05 |
| 05 | [phase-05-email-templates-render-addon-lines.md](./phase-05-email-templates-render-addon-lines.md) | complete | 1-2h | — |
| 06 | [phase-06-operator-sop-documentation.md](./phase-06-operator-sop-documentation.md) | complete | 30m | — |

Total: ~10–14h (1–2 working days). **All phases shipped 2026-05-25.**

## Completion summary

- **Code/UI:** New `Add-ons` section on tour pages (sv/en/de), CMS `optionalAddOns` field group with custom RowLabel, `bookings.add_ons` JSON column live in DB
- **Mapper:** `mapBokunExtras` extracts purchased extras from `productBookings[].lineItems[]` into `MappedAddOnLine[]`, envelope-tolerant for both webhook + checkout-API shapes
- **Emails:** Confirmation itemizes add-ons, cancellation summarizes
- **Operator docs:** [docs/bokun-extras-setup.md](../../docs/bokun-extras-setup.md) — 130-line SOP including the "Price is per pricing category" trap that broke 10 tours during Phase 01
- **Infra cleanup:** Backfilled 11 untracked Payload migrations (push-mode artifact)
- **Tests:** 25 new unit tests (mapper +7, tour section +10, total project still green)
- **Webhook capture:** Checkout-API shape captured + sanitized in `research/`; mapper handles both envelopes pending first real paid sandbox booking

## Out-of-scope items remaining for v2

- CMS→Bokun push sync of extras (extends `260514-1437-bokun-integration`)
- Live validation that `bokunExtraId` exists in Bokun
- Audit script for CMS hint vs Bokun price drift
- Date/time-slot-conditional add-on availability
- Localized customer emails (today English-only)

## Key Dependencies

- **External**: Bokun account plan supports Extras feature (operator check)
- **Internal**: Existing webhook handler (`apps/web/app/api/bokun/webhook/route.ts`), mapper (`map-bokun-webhook-to-booking-row.ts`), bookings collection (`packages/cms/collections/bookings.ts`), inclusions UI (`apps/web/components/tour/inclusions-section.tsx`)

## Success Criteria

- Customer books a tour with museum ticket × N people; quantity picker + payment happen in widget (no platform redirect)
- Webhook arrives → booking row has structured `addOns` lines
- Admin booking detail shows add-on lines under tour info
- Confirmation email renders add-on lines under tour line
- Tours without add-ons show no new UI (zero visual regression)
- All copy localized in sv/en/de

## Out of Scope (explicit)

- Add-on prices are NOT pushed from CMS to Bokun (manual sync, same as rates)
- No platform-side checkout UI (Bokun widget is the only checkout surface)
- No tax/VAT computation on add-ons (Bokun handles)
