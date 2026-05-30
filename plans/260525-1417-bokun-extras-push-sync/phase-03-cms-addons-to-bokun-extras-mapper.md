---
phase: 03
title: "CMS Add-ons → Bokun Extras Mapper"
status: complete
effort: 2-3h
blocks: [04]
---

# Phase 03 — CMS Add-ons → Bokun Extras Mapper

## Context links

- Existing mapper pattern: `apps/web/lib/bokun/tour-to-bokun-experience-mapper.ts`
- CMS schema: `packages/cms/fields/tour-optional-add-ons-fields.ts`
- Phase 02 types: `apps/web/lib/bokun/bokun-types.ts` (BokunExtraInput)

## Overview

**Priority:** P1
**Status:** pending
**Goal:** Pure function `mapAddOnsToBokunExtras(addOns, defaultCurrency)` that converts the CMS `optionalAddOns` array (fetched with `locale: 'all'`) into the `BokunExtraInput[]` shape consumed by Phase 02's serializer.

Mirrors the design of `tour-to-bokun-experience-mapper.ts` — pure, no I/O, heavily unit-tested.

## Key insights from CMS schema

- Field names: `name` (localized), `description` (localized), `pricingType` (`'perBooking' | 'perPerson'`), `adultPriceHint` (number), `childPriceHint` (optional number), `currency` (`'SEK' | 'EUR' | 'USD'`), `isRequired` (boolean — note: `isRequired`, not `required`), `bokunExtraId` (string, optional), `displayOrder` (number)
- `name` is REQUIRED — rows without name fail Payload validation upstream
- `bokunExtraId` may be empty (= "not yet wired") — must be coerced to `existingBokunExtraId: undefined` so Phase 04 triggers CREATE
- `displayOrder` controls array order in Bokun (mapper sorts by displayOrder asc, ties broken by CMS array order)
- `childPriceHint` exists but Bokun extras pricing is single `amount` per pricingRule — for v1, only `adultPriceHint` is pushed; child pricing requires a separate Adult/Child pricing-category setup not modeled here

## Requirements

### Functional
- Sort CMS rows by `displayOrder` ascending before mapping (stable for ties)
- Map `pricingType: 'perBooking' → pricedPerPerson: false`, `'perPerson' → true`
- Generate stable `externalId` per row — use CMS row's `id` (Payload auto-assigns string IDs to array rows)
- Pass through `bokunExtraId` if present (as `existingBokunExtraId`)
- Convert `adultPriceHint` (number) → `priceAmount` (string, 2 decimals)
- Empty/null name in primary locale → log warning + skip row (don't push half-configured to Bokun)
- Empty `optionalAddOns` → return empty array (caller decides to omit from payload)

### Non-functional
- Pure: no I/O, no globals, no Date.now/Math.random
- Co-located unit tests covering ≥8 scenarios

## Architecture

```
CMS Tour.optionalAddOns[]              mapAddOnsToBokunExtras           BokunExtraInput[]
─────────────────────────              ─────────────────────────         ──────────────────
[                                                                       [
  {                                                                       {
    id: "row-uuid-1",                                                       externalId: "row-uuid-1",
    name: {sv,en,de},                                                       existingBokunExtraId: "276080",
    description: {sv,en,de},                                                title: [{locale:'sv',value:'...'},{locale:'en',...}],
    pricingType: 'perBooking',          ──►   pure transform   ──►          description: [...],
    adultPriceHint: 150,                                                    pricedPerPerson: false,
    currency: 'SEK',                                                        priceAmount: "150.00",
    isRequired: false,                                                      currency: 'SEK',
    bokunExtraId: "276080",                                                 isRequired: false,
    displayOrder: 1                                                       }, ...
  }, ...                                                                ]
]
```

## Related code files

**Read:**
- `packages/cms/fields/tour-optional-add-ons-fields.ts` — schema authority
- `apps/web/lib/bokun/tour-to-bokun-experience-mapper.ts` — pattern reference (localizedField helper)
- `apps/web/lib/bokun/__tests__/tour-to-bokun-experience-mapper.test.ts` — test pattern

**Create:**
- `apps/web/lib/bokun/map-addons-to-bokun-extras.ts`
- `apps/web/lib/bokun/__tests__/map-addons-to-bokun-extras.test.ts`

**Modify:**
- `apps/web/lib/bokun/tour-to-bokun-experience-mapper.ts` — extend `TourSource` to include `optionalAddOns?: AddOnSource[]`; call new mapper from `tourToBokunExperiencePayload`

## Implementation steps

1. Define `AddOnSource` interface mirroring CMS schema with localized name/description as `Partial<Record<CmsLocale, string>>`.
2. Implement `mapAddOnsToBokunExtras(addOns, defaultCurrency)`:
   - Filter rows where name is empty across ALL locales → skip with `console.warn`
   - Sort by `displayOrder` asc (stable; ties keep CMS order)
   - For each row, build `BokunExtraInput` per Phase 02 types
   - Use `localizedField()` helper from existing mapper (or copy if extracting is cleaner)
   - `priceAmount` = `formatPrice(adultPriceHint)` (reuse pattern from `mapPricingToBokunRates`)
3. In `tour-to-bokun-experience-mapper.ts`:
   - Add `optionalAddOns?: AddOnSource[]` to `TourSource` interface
   - In `tourToBokunExperiencePayload`, after existing fields, call `mapAddOnsToBokunExtras` and assign to `payload.extras` if non-empty
4. Unit tests:
   - Empty array → returns `[]`
   - Single per-booking row → emits per Phase 02 contract
   - Single per-person row → `pricedPerPerson: true`
   - Row missing `bokunExtraId` → `existingBokunExtraId: undefined`
   - Row with `bokunExtraId: ""` → coerced to undefined (whitespace trim)
   - Localized name (sv only) → BokunExperienceLocalizedString array with one entry
   - Two rows with displayOrder 2, 1 → sorted [1, 2]
   - Row with all-locale-empty name → skipped with warning (spy on console.warn)
   - Invalid price (NaN, negative) → "0.00" emitted (same convention as tour pricing)

## Todo list

- [ ] Define `AddOnSource` interface
- [ ] Implement `mapAddOnsToBokunExtras` (pure)
- [ ] Extend `TourSource` in tour-to-bokun-experience-mapper.ts
- [ ] Wire into `tourToBokunExperiencePayload`
- [ ] Unit tests — 9 scenarios above
- [ ] Verify existing mapper tests still pass (no regression)
- [ ] `npm run build` → zero TS errors

## Success criteria

- Pure mapper, no I/O
- All unit tests green
- Existing tour mapper tests unchanged + still green
- Output of `tourToBokunExperiencePayload` now includes `extras` for tours with `optionalAddOns`

## Risks

- **CMS row `id` shape unknown for Payload array rows** — Payload auto-assigns string UUIDs. If a row was created in older Payload version without `id`, fall back to deterministic hash of (name+displayOrder). Verify in step 2.
- **Coupling to schema field names** — if CMS schema renames (e.g. `isRequired → required`), mapper breaks silently. Mitigate via explicit TypeScript narrowing in `AddOnSource`; broken type signature surfaces at compile time.

## Security considerations

- Localized name/description originate from CMS plain-text fields (validated upstream by Payload). Mapper does NOT need to HTML-escape — the wire serializer's primary-locale picker emits plain strings.

## Next steps

- Phase 04 (sync job) consumes the extended `tourToBokunExperiencePayload` output
