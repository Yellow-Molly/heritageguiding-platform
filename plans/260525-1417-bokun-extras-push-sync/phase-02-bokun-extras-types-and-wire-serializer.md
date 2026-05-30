---
phase: 02
title: "Bokun Extras Types + Wire Serializer Extension"
status: complete
effort: 2h
blocks: [03]
---

# Phase 02 — Types + Wire Serializer Extension

## Context links

- Phase 01 findings: `plans/260525-1417-bokun-extras-push-sync/research/bokun-extras-write-api-sandbox-findings.md`
- Existing types: `apps/web/lib/bokun/bokun-types.ts`
- Existing wire serializer: `apps/web/lib/bokun/serialize-bokun-wire-payload.ts`
- Research: `plans/reports/researcher-260525-1417-bokun-extras-write-api.md`

## Overview

**Priority:** P1
**Status:** pending
**Goal:** Add TypeScript types for the EXTRAS + PRICING component DTOs and extend `serialize-bokun-wire-payload.ts` to emit them when the mapper provides extras.

Pure additive change. Existing text-field sync output is unaffected when extras are absent.

## Requirements

### Functional
- Type-safe DTOs matching the Bokun wire shape confirmed in Phase 01
- Serializer emits `extras` + `pricingRules` only when provided (omission = leave unchanged on Bokun side)
- Primary-locale picker reused from existing `pickPrimaryLocaleValue` for extra title/description
- Empty/null fields stripped from output (keep payloads small + match existing convention)

### Non-functional
- Zero regressions in existing tour text-field sync
- All new types exported from `bokun-types.ts` (single source for the integration)

## Architecture

```
internal mapper payload          serialize             Bokun wire payload
─────────────────────             ─────────             ──────────────────
BokunExperienceCreatePayload ──► serializeBokun ──►   BokunExperienceWirePayload {
  + extras?: BokunExtraInput[]   ExperiencePayload     title?, shortDescription?,
  + pricingRules?: BokunExtra      (existing fn)       description?, included?, ...
    PricingRuleInput[]                                  + extras?: BokunExtraComponentDto[]
                                                        + pricingRules?: BokunExtraPricingRuleDto[]
                                                      }
```

## Related code files

**Read:**
- `apps/web/lib/bokun/bokun-types.ts` (current types)
- `apps/web/lib/bokun/serialize-bokun-wire-payload.ts` (current serializer)
- Phase 01 findings file

**Modify:**
- `apps/web/lib/bokun/bokun-types.ts` — add new types (additive)
- `apps/web/lib/bokun/serialize-bokun-wire-payload.ts` — extend output shape

**Create:**
- `apps/web/lib/bokun/__tests__/serialize-bokun-wire-payload.test.ts` — if missing; otherwise extend existing test file

## Implementation steps

1. Add to `bokun-types.ts`:
   ```ts
   /** EXTRAS component entry — single-locale per Bokun's wire shape. */
   export interface BokunExtraComponentDto {
     id?: number               // omit → CREATE; present → UPDATE in place
     externalId?: string       // CMS-supplied stable correlator (Phase 01 verifies support)
     title: string
     description?: string
     maxPerBooking?: number
     limitByPax?: boolean
   }

   /** PRICING component entry — links an extra to a rate + price. */
   export interface BokunExtraPricingRuleDto {
     extraId?: number          // matches BokunExtraComponentDto.id (existing extras)
     extraExternalId?: string  // OR externalId for new extras pending ID assignment (Phase 01 verifies)
     pricedPerPerson: boolean
     amount: string            // 2-decimal string (Bokun never accepts floats)
     currency: 'SEK' | 'EUR' | 'USD'
     // rate.id reference: Phase 01 verifies if optional for per-booking flat
     rateId?: number
   }

   /** Internal mapper payload — pre-serialization. */
   export interface BokunExtraInput {
     externalId: string        // CMS row UUID (always present for new+existing)
     existingBokunExtraId?: string  // if CMS row has bokunExtraId populated
     title: BokunExperienceLocalizedString[]  // localized; picker flattens
     description?: BokunExperienceLocalizedString[]
     pricedPerPerson: boolean
     priceAmount: string       // 2-decimal string
     currency: 'SEK' | 'EUR' | 'USD'
     // isRequired: Phase 01 confirms which field controls this
     isRequired?: boolean
   }
   ```

2. Extend `BokunExperienceCreatePayload` / `BokunExperienceUpdatePayload` to include `extras?: BokunExtraInput[]` (additive, optional).

3. Extend `BokunExperienceWirePayload` to include `extras?: BokunExtraComponentDto[]` and `pricingRules?: BokunExtraPricingRuleDto[]`.

4. In `serialize-bokun-wire-payload.ts`, add helper `serializeBokunExtras(extras, primaryLocale)` returning `{ extras, pricingRules }`:
   - For each `BokunExtraInput`: pick primary-locale title + description, build `BokunExtraComponentDto` (with id if existing, with externalId always)
   - For each: build `BokunExtraPricingRuleDto` linked by `extraId` (existing) or `extraExternalId` (new)
5. Wire into `serializeBokunExperiencePayload`: if `payload.extras?.length > 0`, call helper and merge into output.
6. Unit tests cover: empty extras → no `extras`/`pricingRules` keys in output; mixed existing+new → correct id vs externalId on each; per-person + per-booking variants; locale picker fallback (sv-only tour falls through to en→sv).

## Todo list

- [ ] Verify Phase 01 sandbox findings are committed (gate)
- [ ] Add types to `bokun-types.ts`
- [ ] Extend `BokunExperienceCreatePayload` / `UpdatePayload`
- [ ] Extend `BokunExperienceWirePayload`
- [ ] Implement `serializeBokunExtras` helper
- [ ] Wire helper into `serializeBokunExperiencePayload`
- [ ] Unit tests — empty, new-only, existing-only, mixed, locale fallback
- [ ] Run `npm run build` (or workspace equivalent) → zero TS errors
- [ ] Run wire-serializer test file → all green

## Success criteria

- New types exist, exported, no `any`
- Serializer emits valid extras+pricingRules JSON matching Phase 01 sandbox findings
- Existing text-only payloads serialize identically to before (no regressions)
- Unit tests cover ≥5 scenarios above

## Risks

- **Phase 01 surfaces a different DTO shape than research suggested** → types defined here may need rework. Mitigate by gating Phase 02 start on Phase 01 sign-off.
- **`limitByPax` / `maxPerBooking` not modeled in CMS** — for v1, hardcode defaults (`limitByPax: false`, omit `maxPerBooking`); document in SOP that operator can still tweak in Bokun dashboard. Or add CMS fields if research shows they're customer-facing.

## Security considerations

- Monetary values must be 2-decimal strings (existing convention in `mapPricingToBokunRates`). Reuse `formatPrice` pattern (NaN/Infinity/negative → "0.00").
- No new external endpoints introduced; auth/HMAC unchanged.

## Next steps

- Phase 03 (mapper) consumes these types
