---
phase: 02
title: "CMS Schema — Tours optionalAddOns Field + Bookings addOns Column"
status: complete
priority: P1
effort: 2-3h
blocks: [03, 04]
completed: 2026-05-24
---

# Phase 02 — CMS Schema Changes

## Context Links

- Existing inclusion fields: `packages/cms/fields/tour-inclusion-fields.ts`
- Tours collection: `packages/cms/collections/tours.ts`
- Bookings collection: `packages/cms/collections/bookings.ts`
- Migration precedent: `apps/web/migrations/20260514_174200_add_bokun_sync_fields.ts`

## Overview

**Priority:** P1
**Status:** complete (2026-05-24) — migration `20260524_211041_add_optional_add_ons` applied (118ms); also backfilled 11 untracked migrations from push-mode era

Add two CMS schema pieces:
1. **Tours** — new `optionalAddOns` group with localized array (informational mirror of Bokun config)
2. **Bookings** — new `addOns` JSON column (persisted from webhook payload)

Both ship together because they reference the same domain concept and share a single migration cycle.

## Key Insights

- Bokun is source of truth for prices at checkout → CMS `adultPriceHint` is intentionally just a **hint**, not used for pricing logic
- `bokunExtraId` mirrors the existing `bokunExperienceId` pattern — operator pastes after configuring in Bokun
- Localization: `name` + `description` are `localized: true` (sv/en/de). `pricingType`, `isRequired`, prices, `bokunExtraId` are NOT localized
- Admin warning row when `bokunExtraId` is empty matches existing `bokunSyncStatus` UX

## Requirements

**Functional:**
- Editor can add up to 10 add-ons per tour with all required fields
- Empty `optionalAddOns` array means "no add-ons" (no broken UI downstream)
- `bookings.addOns` accepts the JSON shape from Phase 01 findings

**Non-functional:**
- Schema additive only — no breaking changes to existing tour data
- Migration runs forward + back cleanly on local Postgres

## Architecture

### Tours field shape (CMS)

```ts
// packages/cms/fields/tour-optional-add-ons-fields.ts (NEW)
{
  name: 'optionalAddOns',
  type: 'array',
  label: 'Optional Add-ons (Paid at Checkout)',
  maxRows: 10,
  admin: {
    description: 'Items that customers can buy as extras during Bokun checkout (e.g. museum tickets, meals). Must mirror what is configured in Bokun dashboard — CMS is informational only.',
  },
  fields: [
    { name: 'name', type: 'text', required: true, localized: true, maxLength: 100 },
    { name: 'description', type: 'textarea', localized: true, maxLength: 300 },
    {
      name: 'pricingType',
      type: 'select',
      required: true,
      defaultValue: 'perPerson',
      options: [
        { label: 'Per person', value: 'perPerson' },
        { label: 'Per booking (flat)', value: 'perBooking' },
      ],
    },
    { name: 'adultPriceHint', type: 'number', required: true, min: 0 },
    { name: 'childPriceHint', type: 'number', min: 0 },
    {
      name: 'currency',
      type: 'select',
      defaultValue: 'SEK',
      options: [
        { label: 'SEK', value: 'SEK' },
        { label: 'EUR', value: 'EUR' },
        { label: 'USD', value: 'USD' },
      ],
    },
    { name: 'isRequired', type: 'checkbox', defaultValue: false, label: 'Required at checkout' },
    {
      name: 'bokunExtraId',
      type: 'text',
      admin: {
        description: 'Paste from Bokun dashboard after configuring the matching Extra. Empty = not yet wired.',
      },
    },
    { name: 'displayOrder', type: 'number', defaultValue: 0, admin: { description: 'Lower numbers display first.' } },
  ],
}
```

Wire into `packages/cms/fields/index.ts` exports + insert into Tours collection field list right after `tourInclusionFields`.

### Bookings field shape (CMS)

```ts
// packages/cms/collections/bookings.ts — add after the participants field
{
  name: 'addOns',
  type: 'json',
  admin: {
    description: 'Paid add-ons purchased at checkout. Captured from Bokun webhook.',
    readOnly: true,
  },
}
```

Shape stored (informed by Phase 01 findings; placeholder shown):
```json
[
  {
    "bokunExtraId": "12345",
    "name": "Museum admission ticket",
    "qty": 3,
    "unitPrice": "100.00",
    "totalPrice": "300.00",
    "currency": "SEK",
    "perPerson": true
  }
]
```

### Migration

`apps/web/migrations/20260520_000000_add_addons_columns.ts`:
- Add `addons` JSONB column to `bookings` table (nullable)
- Tours' `optionalAddOns` is a Payload array → Payload generates its own related-table migration automatically on regeneration; verify after `payload migrate:create`

## Related Code Files

**Create:**
- `packages/cms/fields/tour-optional-add-ons-fields.ts`
- `apps/web/migrations/20260520_000000_add_addons_columns.ts` (or whatever Payload generates)

**Modify:**
- `packages/cms/fields/index.ts` — export `tourOptionalAddOnsFields`
- `packages/cms/collections/tours.ts` — import + insert in field list after `tourInclusionFields`
- `packages/cms/collections/bookings.ts` — add `addOns` JSON field
- `apps/web/migrations/index.ts` — register new migration
- `packages/cms/payload-types.ts` — regenerated by Payload, do not hand-edit

## Implementation Steps

1. Create `packages/cms/fields/tour-optional-add-ons-fields.ts` with the field group above
2. Export from `packages/cms/fields/index.ts`
3. Import + place in Tours collection field list (after `tourInclusionFields`, before SEO)
4. Add `addOns` JSON field to `Bookings` collection (after `participants`)
5. Run Payload migration generator: `npm run payload migrate:create -- --name add_optional_addons` (or project's equivalent)
6. Inspect generated SQL — confirm:
   - `tours__optional_add_ons` related table created with all columns
   - `tours__optional_add_ons_locales` for localized `name` + `description`
   - `bookings.addons` JSONB column added
7. Run `npm run payload generate:types` to regenerate `packages/cms/payload-types.ts`
8. Run migration locally: `npm run payload migrate`
9. Open admin UI on a sample tour → verify field renders, can save a row, can localize name in sv/en/de
10. Open admin UI on a sample booking → verify `addOns` field shows as read-only JSON viewer
11. `npm run typecheck` green; `npm run lint` green

## Todo List

- [x] Create `tour-optional-add-ons-fields.ts`
- [x] Export from fields index
- [x] Insert into Tours collection (between inclusions and audience)
- [x] Add `addOns` JSON field to Bookings (after `participants`)
- [x] Generate Payload migration
- [x] Inspect SQL → trim noise from snapshot drift (removed pre-existing bokun_sync_* + payload_jobs schema)
- [x] Regenerate types
- [x] Run migration locally (118ms, 13/13 migrations tracked)
- [x] Verify admin UI for Tours + Bookings (user confirmed "looks good")
- [x] Typecheck green

**Bonus work done during Phase 02:**
- [x] Added custom RowLabel (`tour-add-on-row-label.tsx`) showing add-on name as collapsed-row title with "— not yet wired" suffix when `bokunExtraId` is empty
- [x] Switched default `pricingType` from `perPerson` → `perBooking` based on Phase 01 finding (Private Tours' "Per group" model)
- [x] Renamed all "Optional Add-ons" labels to "Add-ons" (some rows can be Required)

## Success Criteria

- Editor can create a tour with 2+ add-ons, localized name in sv/en/de, save successfully
- Existing tours load without errors (additive schema)
- Bookings admin shows `addOns` as JSON column
- Migration is reversible (test `payload migrate:down` once on a throwaway DB)

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Payload migration generator creates unexpected schema (drops, renames) | Always review generated SQL before running. Backup local DB before migration. |
| Localized array tables break under heavy tour count | Same pattern as existing `highlights` array — no new risk |
| `bokunExtraId` paste with whitespace | Trim in Phase 04 mapper lookup; not required at CMS-input stage |

## Security Considerations

- `addOns` field on Bookings is `readOnly: true` in admin — only webhook can write
- No customer-facing exposure of `bokunExtraId` — internal field only

## Next Steps

- Phase 03 (tour page UI) can start as soon as types are regenerated
- Phase 04 (mapper) needs both this AND Phase 01 findings

## Unresolved Questions

- Should add-on currency inherit from tour currency at the field level (computed default)? **v1 decision:** no — explicit select, defaults to SEK, operator chooses. Revisit if friction reported.
