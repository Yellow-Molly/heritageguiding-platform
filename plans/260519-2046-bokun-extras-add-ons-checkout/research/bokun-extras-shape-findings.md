---
type: research
phase: 01
status: captured-checkout-api-shape-documented
date: 2026-05-24
slug: bokun-extras-shape-findings
---

# Bokun Extras Payload Shape — Findings

**Status:** Authoritative for **frontend checkout API response** (the booking object Bokun returns to the embedded widget at `https://widgets.bokun.io/widgets/<channel-uuid>/checkout`). Webhook payload (Bokun → our `/api/bokun/webhook` server) likely uses the same extras subset but with a different outer envelope.

Capture context: Sandbox booking `PRI-92631591` on tour `1215959` ("Guided City Walk Including Vasa Museum"), with one Extra (`id: 276080`, title "QA Test Museum Ticket", pricingType `PER_PERSON`, unit price 150 SEK).

Sample file: `bokun-checkout-api-response-sample.json` (PII redacted).

## Where extras live in the payload

Extras data is replicated across **three locations** in `booking.activityBookings[N]`:

1. **`activityBookings[].lineItems[]`** — **AUTHORITATIVE SOURCE for purchased extras + pricing.** Filter where `lineItem.extraId` is defined. Each row has:
   - `extraId` (number) — matches CMS `bokunExtraId`
   - `pricingCategoryId` (number) — the "Per group" / "Adult" / etc category this line was sold under
   - `title` (string) — prefixed with pricing category, e.g. `"Per group: QA Test Museum Ticket"`
   - `quantity` (number) — units purchased
   - `unitPrice` (number — float, not string)
   - `total` (number — float)
   - `currency` (string — ISO 4217, e.g. "SEK")
2. **`activityBookings[].extras[]`** — envelope-only: `{ bookingId, title, unitCount, extra: { id, title, pricingType, type, ... }, bookableExtra: {...} }`. No pricing. Useful only for cross-reference (`extra.id` ↔ `lineItem.extraId`).
3. **`activityBookings[].pricingCategoryBookings[].extras[]`** — same envelope shape as #2, nested per pricing category. Redundant for v1 (we use #1).

**Mapper rule:** walk `activityBookings[]` → walk `lineItems[]` → filter `extraId !== undefined` → build `MappedAddOnLine[]`.

## Field name reference

| Concept | Field name | Type | Notes |
|---|---|---|---|
| Extra ID | `lineItem.extraId` | `number` | Coerce to string when comparing against CMS `bokunExtraId` |
| Pricing-category ID | `lineItem.pricingCategoryId` | `number` | Optional context — not required for v1 mapper |
| Display title | `lineItem.title` | `string` | Prefixed with category, e.g. `"Per group: QA Test Museum Ticket"`. For clean display use `activityBookings[].extras[N].title` instead (no prefix) |
| Quantity | `lineItem.quantity` | `number` | |
| Unit price | `lineItem.unitPrice` | `number` (float) | **Coerce to string** when persisting to match existing booking convention |
| Total price | `lineItem.total` | `number` (float) | Also available as `totalAsText` (formatted string, e.g. "SEK 150.00") |
| Currency | `lineItem.currency` | `string` | ISO 4217 |
| Per-person flag | `extras[N].extra.pricingType` | `"PER_PERSON"` \| `"PER_BOOKING"` | Note: on `extras[]` envelope, not on `lineItem` |
| Extra type | `extras[N].extra.type` | `"OTHERS"` \| `"FOOD"` \| `"DRINKS"` \| `"SAFETY"` \| `"TRANSPORT"` \| `"DONATION"` | GetYourGuide channel hint; v1 ignores |
| Extra is required | `extras[N].extra.included` | boolean | Required = auto-included extras |
| Extra is free | `extras[N].extra.free` | boolean | |

## Outer-envelope shape difference (checkout vs webhook)

The checkout API response uses these top-level keys on `booking`:
- `customer` (not `customerDetails`)
- `activityBookings` (not `productBookings`)

But the existing `BokunBooking` interface in `apps/web/lib/bokun/bokun-types.ts` declares:
- `customerDetails`
- `productBookings`

This means **either**:
- The webhook payload uses `customerDetails`/`productBookings` (existing types are correct for webhooks; checkout API uses different keys)
- OR Bokun emits one shape and the existing types are stale (less likely given existing webhook handler is working in production)

**Mapper strategy (Phase 04):** support BOTH key names defensively. `booking.productBookings ?? booking.activityBookings`. Existing mapper uses `productBookings` and will continue to; the new extras extraction will look in whichever array exists.

## Critical observations for Phase 03 (Tour Page UI) + Phase 06 (SOP)

- **PER_PERSON extras on a "Per group" tour effectively price per-booking.** The captured payload shows the extra configured as `PER_PERSON` but priced as 1 × 150 SEK total (one "Per group" pricing category covering 5 actual participants). For the Private Tours account model (all tours flat-priced per group), Phase 03 price hint copy should say **"per booking"** regardless of Bokun-side `pricingType`. The `pricingType` flag will only diverge if the account introduces multi-tier pricing categories in the future.
- **Bokun does NOT localize extra `title` in the payload.** Title is single-string. To support sv/en/de UI rendering, we must rely on CMS `optionalAddOns[].name` (localized) — never read from the Bokun payload for display. This confirms Phase 03's design.

## Unresolved (low-priority)

- **Webhook envelope shape** still not captured (would need a `BOOKING_CREATED` or `BOOKING_CONFIRMED` event from Bokun → our server). The captured shape is from the checkout-time draft booking call, not Bokun's webhook. Mapper handles both defensively. Capture later when a sandbox booking is paid + the webhook fires; not blocking Phase 02–06.
- **`PER_PERSON` extra on multi-category tours** (e.g. a tour with Adult + Child pricing categories) would emit one line item per category. Not tested here because Private Tours uses single "Per group" category. Mapper handles N line items naturally (each becomes one `MappedAddOnLine`).
- **Required/auto-included extras** — captured one (`included: false` on the extra metadata even though it was set Required on tour 1215959). The "Required" UI flag in Bokun doesn't seem to map to `extras[N].extra.included`. Phase 06 SOP should warn that operator-side "Required" toggle has subtle behavior; verify if needed.

## Decisions locked in by this capture

- **`bokunExtraId` CMS field** stores Bokun's numeric Extra ID as a string. Type already correct.
- **`MappedAddOnLine` shape** for Phase 04 — confirmed: `{ bokunExtraId: string, name: string, qty: number, unitPrice: string, totalPrice: string, currency: string, perPerson: boolean }`. The `name` should come from the lineItem.title or extras envelope title — leaning lineItem.title with category prefix stripped, OR extras envelope title (cleaner). Mapper uses cleanest available.
- **`addOns` JSONB column on bookings** — shape locked per above.
- **No type tightening risk** for Phase 02 onward.
