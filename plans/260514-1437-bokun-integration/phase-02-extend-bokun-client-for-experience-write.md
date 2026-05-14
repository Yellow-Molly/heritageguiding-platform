# Phase 02: Extend Bokun Client for Experience Write

## Context Links
- Plan: [plan.md](./plan.md)
- Depends on: [Phase 01 findings](./phase-01-findings.md)
- Existing client: `apps/web/lib/bokun/bokun-api-client-with-hmac-authentication.ts`

## Overview
- **Priority:** P1
- **Status:** not-started
- **Effort:** 2-3h
- **Description:** Add `createExperience` and `updateExperience` methods to the existing Bokun client, plus TypeScript types for the Experience write payload and response.

## Key Insights
- Reuse existing HMAC signer, retry/backoff, error class, base URL switching — proven and tested
- Add types in existing `bokun-types.ts` (DRY) rather than a new file
- Method signatures should be thin: take a typed payload, sign + POST/PUT, return typed response
- No business logic — that lives in the mapper (Phase 03) and job (Phase 05)

## Requirements

### Functional
- `createExperience(payload: BokunExperienceCreatePayload): Promise<BokunExperienceCreateResponse>`
- `updateExperience(id: string, payload: BokunExperienceUpdatePayload): Promise<BokunExperienceUpdateResponse>`
- Both methods sign with existing HMAC signer
- Both methods reuse existing 429 backoff logic
- Both methods throw `BokunError` on non-2xx (existing error class)

### Non-Functional
- Zero behavior change for existing methods (`fetch`, availability, booking)
- 100% unit test coverage for both new methods (mock fetch)
- Type-only addition for payload shapes (no runtime deps)

## Related Code Files

### Modify
- `apps/web/lib/bokun/bokun-api-client-with-hmac-authentication.ts` — add 2 methods
- `apps/web/lib/bokun/bokun-types.ts` — add Experience write/response interfaces

### Create
- `apps/web/lib/bokun/__tests__/bokun-experience-write-methods.test.ts` — unit tests for new methods

## Implementation Steps

1. **Define types in `bokun-types.ts`** (append, don't replace)
   ```typescript
   // Locale code from Phase 01 findings (sv | sv-SE | etc.)
   export type BokunLocale = 'sv' | 'en' | 'de' // adjust per findings

   export interface BokunLocalizedString {
     locale: BokunLocale
     value: string
   }

   export interface BokunPricingCategory {
     title: string                 // e.g. "Adult", "Child", "Per group"
     pricePerPerson?: string       // String per Bokun spec (never float)
     pricePerBooking?: string      // For per_group flat-rate
     minAge?: number
     maxAge?: number
   }

   export interface BokunRate {
     title: string
     pricingCategories: BokunPricingCategory[]
     currency: 'SEK' | 'EUR' | 'USD'
   }

   export interface BokunMeetingPoint {
     title: BokunLocalizedString[]
     address?: BokunLocalizedString[]
     instructions?: BokunLocalizedString[]
     latitude?: number
     longitude?: number
   }

   export interface BokunExperienceCreatePayload {
     title: BokunLocalizedString[]
     description: BokunLocalizedString[]      // HTML allowed
     summary: BokunLocalizedString[]
     highlights?: BokunLocalizedString[]
     durationISO: string                      // PT3H format
     minParticipants: number
     maxParticipants: number
     rates: BokunRate[]
     meetingPoint: BokunMeetingPoint
     inclusions?: BokunLocalizedString[]
     exclusions?: BokunLocalizedString[]
     bringList?: BokunLocalizedString[]
     activityLevel?: 'EASY' | 'MODERATE' | 'CHALLENGING'
     wheelchairAccessible?: boolean
     // ... extend per Phase 01 findings (cancellation policy, supplier, etc.)
   }

   export type BokunExperienceUpdatePayload = Partial<BokunExperienceCreatePayload>

   export interface BokunExperienceCreateResponse {
     id: string                               // Persist as Tour.bokunExperienceId
     status: string
     createdAt: number                        // UTC ms
   }

   export interface BokunExperienceUpdateResponse {
     id: string
     status: string
     updatedAt: number
   }
   ```

2. **Add methods to client class**
   ```typescript
   // In BokunApiClient class:

   async createExperience(
     payload: BokunExperienceCreatePayload
   ): Promise<BokunExperienceCreateResponse> {
     return this.fetch<BokunExperienceCreateResponse>(
       '/restapi/v2.0/experience',           // confirm path in Phase 01
       {
         method: 'POST',
         body: JSON.stringify(payload),
       }
     )
   }

   async updateExperience(
     id: string,
     payload: BokunExperienceUpdatePayload
   ): Promise<BokunExperienceUpdateResponse> {
     return this.fetch<BokunExperienceUpdateResponse>(
       `/restapi/v2.0/experience/${encodeURIComponent(id)}`,
       {
         method: 'PUT',                       // confirm method in Phase 01
         body: JSON.stringify(payload),
       }
     )
   }
   ```
   - `encodeURIComponent(id)` defense against injection — IDs come from CMS strings
   - **No new error handling** — `fetch` already handles 429/non-2xx

3. **Unit tests** (`bokun-experience-write-methods.test.ts`)
   - Mock `global.fetch`
   - Test: `createExperience` calls correct path with POST + body
   - Test: `createExperience` includes signature headers
   - Test: `createExperience` propagates `BokunError` on 4xx
   - Test: `updateExperience` calls correct path with PUT + ID encoded
   - Test: `updateExperience` passes partial payload through
   - Test: 429 retry behavior triggers for new methods (reuses existing retry — verify path exercised)
   - Test: monetary values remain strings end-to-end

4. **Type-check + test**
   - `npm -w apps/web test bokun-experience-write-methods`
   - `npm -w apps/web tsc --noEmit`

## Todo List

- [ ] Append Experience write types to `bokun-types.ts`
- [ ] Add `createExperience` method to client
- [ ] Add `updateExperience` method to client
- [ ] Write 6+ unit tests covering happy path, errors, retry, string-formatted prices
- [ ] Run typecheck + tests; ensure no regression in existing client tests

## Success Criteria
- New methods exposed on `BokunApiClient` instance
- All new tests pass
- All existing client tests still pass (no regression)
- Types compile across `apps/web` and `packages/cms`

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Endpoint path differs from `/restapi/v2.0/experience` | Phase 01 findings confirm; update before commit |
| Bokun requires multipart/form-data instead of JSON | Phase 01 verifies; if so, add content-type branch |
| Required field missing from payload causes 4xx | Phase 03 mapper enforces required-field defaults; this phase just exposes types |
| Concurrent edits with bokun-go-live security fixes | Coordinate PR timing with that plan's Phase 02 |

## Security Considerations
- IDs passed to `updateExperience` are URL-encoded
- No new env vars — reuses existing `BOKUN_API_KEY` / `BOKUN_SECRET_KEY`
- New methods inherit all existing security checks (HMAC, HTTPS, credential validation)

## Next Steps
- Phase 03 consumes these types in the mapper
- Phase 05 consumes these methods in the Payload job
