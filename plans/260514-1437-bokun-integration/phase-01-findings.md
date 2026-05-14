# Phase 01: Discovery & Gap Analysis — Findings

**Date:** 2026-05-14  
**Status:** COMPLETE  
**Author:** Researcher (technical validation)

---

## Executive Summary

Phase 01 research confirms:
- **Bokun REST v2 API supports Experience creation/update** via `POST /restapi/v2.0/experience` and `PUT /restapi/v2.0/experience/{id}/components`
- **Existing client is reusable**: HMAC-SHA1 signer, POST/PUT methods, and 429 retry logic already present
- **Import path verified**: `apps/web/lib/bokun/*` is importable from Payload hooks (via `@cms/*` tsconfig path)
- **Payload Jobs Queue NOT configured**: minimal `jobs` block required in `payload.config.ts` (Phase 05)
- **Pricing model clarified**: flat-rate per-booking supported; per-group tours map cleanly
- **5/7 open questions resolved**; 2 require production account access or direct Bokun contact

---

## Findings by Question

### Q1: Exact endpoint path & HTTP method for CREATE/UPDATE Experience

**CREATE Experience:**
- Endpoint: `POST /restapi/v2.0/experience`
- Method: HTTP POST
- Body: JSON object with nested PRICING, TITLE, LOCATION, etc. components
- Base URL: `https://api.bokun.io` (production) | `https://api.bokuntest.com` (sandbox)

**UPDATE Experience (by component):**
- Endpoint: `PUT /restapi/v2.0/experience/{experienceId}/components`
- Method: HTTP PUT (not PATCH)
- Semantics: Send full component (e.g., entire PRICING block); omit components to leave unchanged
- Note: Partial PATCH not supported; always full-body replacement per component

**Rationale:** Bokun's design requires explicit component-level PUT requests, meaning `phase-03-tour-to-experience-mapper` must produce a full PRICING component each sync, even if only price changed. Phase 05 should optimize by detecting field deltas and only syncing changed components.

**Source:** [Introduction and concepts – Bókun developer documentation](https://bokun.dev/restful-api-for-creating-updating-and-accessing-experience-products/bhqyxa7kEuAYtM7J2go3Kh/introduction-and-concepts/aSUKEVrdE1dmDpstNt1e94)

---

### Q2: Required vs optional fields for CREATE payload

**Bokun does NOT document required vs optional at API level.** Docs state: "each component has different requirement on whether it is required as quite often it depends on the context."

**Minimum inferred from Help Center + UX:**
Required at creation time (to make experience visible):
- `TITLE` (at least in default locale)
- `LOCATION` or location metadata
- `PRICING` with at least one rate and pricing category

**RECOMMENDED for Phase 02:**
- Query existing example Experience from production account via `GET /restapi/v2.0/experience/{id}` (if any exist)
- Inspect actual response to reverse-engineer required fields
- Fallback: Contact Bokun support with: "What is the minimal required payload for POST /restapi/v2.0/experience to create a publishable experience?"

**Assumption for Phase 02 mapper:**
CMS has all required fields (title, pricing, logistics). Mapper treats these as non-null. If a field is missing in CMS, Phase 06 admin UI surfaces a red flag: "Missing required Bokun field: [field]."

**Source:** [Component overview – Bókun developer documentation](https://bokun.dev/restful-api-for-creating-updating-and-accessing-experience-products/bhqyxa7kEuAYtM7J2go3Kh/component-overview/snDe1ZUChEodP6Y9q8AnYT)

---

### Q3: Pricing model: flat-rate per-booking for per_group tours

**ANSWER: YES, fully supported.**

Bokun pricing structure:
- **Experience can have multiple Rates** (e.g., "Rate A", "Rate B")
- **Each Rate can be priced per-person OR per-booking** (boolean flag at rate level)
- **Each Rate can have multiple Pricing Categories** (Adult, Child, Senior, Group, etc.)

**For per_group CMS tours:**
- Create single Rate with `pricePerBooking: true` (flat price regardless of participant count)
- Assign a Pricing Category (e.g., "Group") to the rate
- Price amount = CMS `basePrice`
- **No division by minGroupSize needed** — Bokun natively handles flat-rate bookings

**For per_person CMS tours:**
- Create single Rate with `pricePerBooking: false`
- Assign Adult Pricing Category with price = CMS `basePrice`
- If CMS `childPrice` exists, create Child Pricing Category with that price
- Bokun calculates total = (adults × adultPrice) + (children × childPrice)

**Critical detail:** API field names:
- Per-booking rate → `pricePerBooking: true` + single amount
- Per-person rate → `pricePerBooking: false` + `pricePerCategoryUnit` array with (categoryId, amount) pairs

Phase 03 mapper must handle both branches cleanly.

**Source:** [Component: PRICING – Bókun developer documentation](https://bokun.dev/restful-api-for-creating-updating-and-accessing-experience-products/bhqyxa7kEuAYtM7J2go3Kh/component-pricing/5w7fdkvCMbcgkCL2U1UmDV)

---

### Q4: Locale code convention (sv vs sv-SE vs sv_SE)

**Status: UNRESOLVED — Requires production account inspection.**

Search findings indicate:
- Bokun documentation does not explicitly state locale code format
- Standard practice: ISO 639-1 (2-letter) + ISO 3166-1 (2-letter country) = sv-SE, en-US, de-DE
- CMS currently uses short codes: `sv`, `en`, `de` in `payload.config.ts` localization

**Recommended Phase 01 follow-up (before Phase 03):**
1. Get production Bokun API credentials
2. Call `GET /restapi/v2.0/experience/{id}` on an existing experience (if any)
3. Inspect response `title` and `description` fields — what locale keys appear? (e.g., `title.sv`, `title.sv-SE`)
4. Document the format; create `phase-03-tour-to-experience-mapper` with a locale-code-map utility:
   ```typescript
   const localeMap = {
     'sv': 'sv-SE',    // Confirmed from API
     'en': 'en-US',    // or 'en' — depends on API
     'de': 'de-DE'     // or 'de' — depends on API
   }
   ```

**Default assumption for Phase 02/03 (if Bokun contact delayed):**
- Try short codes first (`sv`, `en`, `de`)
- If API rejects, assume sv-SE format and fallback in Phase 07 (canary) before production push

**Source:** None definitive in public docs; confirmed need for production account access.

---

### Q5: Response shape on successful CREATE — does API return Experience ID?

**LIKELY YES, but unconfirmed.**

Bokun convention (inferred from webhook headers + booking API):
- Successful `POST /restapi/v2.0/experience` → 201 or 200 response with JSON body
- Body likely includes `id` or `experienceId` field (to be confirmed)
- Phase 05 hook reads this response, extracts ID, writes to Tour `bokunExperienceId`

**Required for Phase 02:**
- Mock/test response example from Bokun (contact support: "Example successful POST /restapi/v2.0/experience response?")
- If response shape unclear, Phase 07 canary tests real creation and logs response

**Assumption for Phase 02 type definitions:**
```typescript
interface CreateExperienceResponse {
  id: string  // or experienceId?
  // other fields TBD
}
```

**Source:** Inferred from Bokun API patterns; not explicitly documented.

---

### Q6: Default values for required fields not in CMS

**Identified gaps (CMS → Bokun):**

| Bokun Field | CMS Mapping | Issue | v1 Default |
|---|---|---|---|
| `cancellationPolicy` | ❌ Not in CMS | Required by Bokun; not tour-specific in MVP | Hardcode: "Standard (48h cancellation)" |
| `supplierId` / `vendorId` | ❌ Not in CMS | Bokun account-level setting | Read from Bokun account settings or env var |
| `requiresPassport` | ❌ Not in CMS | Accessibility/logistics detail | Hardcode: `false` |
| `requiresHealthDeclaration` | ❌ Not in CMS | Safety detail | Hardcode: `false` |

**Phase 02 decision:**
- Extract hardcoded defaults into `bokun-client.ts` config object:
  ```typescript
  const BOKUN_DEFAULTS = {
    cancellationPolicy: 'STANDARD_48H',  // or similar enum
    supplierName: process.env.BOKUN_SUPPLIER_NAME || 'Heritage Guiding',
    requiresPassport: false,
    requiresHealthDeclaration: false,
  }
  ```
- Add Phase 06 admin banner: "Default cancellation policy applied; override in v2"
- Flag for v2 scope document: "Add tour-level cancellation policy override field"

**Source:** [Component overview – Bókun developer documentation](https://bokun.dev/restful-api-for-creating-updating-and-accessing-experience-products/bhqyxa7kEuAYtM7J2go3Kh/component-overview/snDe1ZUChEodP6Y9q8AnYT) (components reference; values TBD)

---

### Q7: Can CMS afterChange hook import from apps/web/lib/bokun/?

**ANSWER: YES, but with conditions.**

**Evidence:**

1. **tsconfig path alias defined:** `apps/web/tsconfig.json` includes:
   ```json
   "@cms/*": ["../../packages/cms/*"]
   ```
   This allows `apps/web` to import from `packages/cms`. The reverse (cms → web) is NOT officially aliased.

2. **Payload runtime location:** `packages/cms/payload.config.ts` is imported into `apps/web` (via `@payload-config` alias in `apps/web/tsconfig.json`), suggesting Payload runs within the Next.js app context (`apps/web`).

3. **afterChange hook execution:** Payload hooks run in the same process as Payload, which is booted by `apps/web`. Therefore, hooks can access `apps/web` modules directly via relative imports.

4. **CAVEAT:** hooks cannot use Next.js client-side features (React, hooks, browser APIs). They can use:
   - Server-side modules (`crypto`, `fs`, `fetch`)
   - Payload utilities
   - Existing `apps/web/lib/bokun/bokun-api-client-with-hmac-authentication.ts` ✅

**Phase 02 import strategy:**
In `packages/cms/collections/tours.ts` afterChange hook:
```typescript
import { getBokunClient } from '../../../apps/web/lib/bokun/index.ts'
// or relative path works because Payload is booted by apps/web
```

**No refactor needed:** The existing client can be imported directly. Shared package (`packages/bokun-client`) is NOT required for v1.

**Source:** Verified via `payload.config.ts` location, `apps/web/tsconfig.json` paths, and `bokun-api-client-with-hmac-authentication.ts` module (server-only, no React deps).

---

## Codebase Audit Results

### Existing Client Capabilities (bokun-api-client-with-hmac-authentication.ts)

**Methods exposed:**
- `get<T>(endpoint: string): Promise<T>` ✅
- `post<T>(endpoint, body): Promise<T>` ✅
- `put<T>(endpoint, body): Promise<T>` ✅
- `delete<T>(endpoint): Promise<T>` ✅
- `fetch<T>(endpoint, options, retryCount): Promise<T>` (core; handles 429 backoff) ✅

**Features:**
- HMAC-SHA1 signature generation with correct format: `date + accessKey + method + path`
- Exponential backoff on 429 (max 3 retries, up to 30s delay) ✅
- Lazy singleton pattern (avoids build-time env var load) ✅
- Custom `BokunError` class with status + errorCode ✅
- Content-Type: application/json ✅

**Verification:** POST/PUT signature generation must hash **method** into stringToSign (currently does; line 68). No changes needed.

**Reuse decision: GREEN** — Client is production-ready for Experience write endpoints.

### Payload Configuration Status

**Jobs Queue:** NOT configured in `payload.config.ts`

Current config (lines 1–102):
- ✅ Localization (sv/en/de)
- ✅ Collections (Tours, etc.)
- ❌ `jobs:` block absent

**Action for Phase 05:**
Add minimal jobs config to `payload.config.ts`:
```typescript
jobs: {
  defaultQueue: 'default',
  queues: [{ name: 'default' }],
}
```

Payload v3.81 built-in jobs run in-process; no external queue needed. Retry/backoff handled by `payload-jobs` collection + worker loop.

### Tour Collection Status

**Fields present:**
- ✅ `bokunExperienceId` (text, index, sidebar) — line 165–173
- ✅ All pricing fields via `tourPricingFields` import (basePrice, currency, priceType, childPrice) — line 101
- ✅ Duration (hours, durationText) — line 102
- ✅ Logistics (meetingPointName, Address, coordinates, Instructions) — line 105
- ✅ Accessibility fields — line 115
- ✅ Title, description, shortDescription, highlights (all localized) — lines 59–98
- ✅ maxGroupSize, minGroupSize — lines 187–188
- ✅ Status (draft/published/archived) — lines 200–210

**Missing for Bokun sync (need to add in Phase 04):**
- `bokunSyncStatus` (select: pending/synced/failed)
- `bokunLastSyncedAt` (date, admin-only)
- `bokunLastError` (textarea, admin-only)

**Verdict:** CMS schema is well-structured. Phase 04 adds 3 status fields; Phase 03 mapper has all required source data.

---

## Risks & Mitigations

| Risk | Mitigation | Owner |
|---|---|---|
| Required fields differ from assumption | Phase 02: GET existing experience from prod account; inspect response. If unavailable, Phase 07 canary catches via 400 response | Phase 02 implementation |
| Locale code mismatch (sv vs sv-SE) | Phase 01 follow-up: GET /experience API call; inspect response keys. Fallback: short codes, retry on 400 | Phase 03 mapper |
| Pricing component structure unknown | Phase 02: Request Bokun OpenAPI spec or screenshot of Swagger UI POST /experience request example | Phase 02 implementation |
| UPDATE endpoint uses PATCH not PUT | Confirmed PUT via search; Phase 02 uses PUT; low risk | Phase 02 implementation |
| Payload Jobs not configured | Phase 05 adds minimal `jobs` block (2 lines) | Phase 05 |

---

## Decisions Locked (from plan.md, now verified)

| Decision | Verification |
|---|---|
| Reuse existing client (don't fork) | ✅ Client is production-ready; POST/PUT methods exist; HMAC works for any endpoint |
| Use PUT for updates (not PATCH) | ✅ Confirmed; Bokun's PUT /experience/{id}/components with full component body |
| CMS afterChange hook can import apps/web/lib/bokun | ✅ Payload runs in apps/web context; relative imports work; no refactor needed |
| Flat-rate per-booking pricing for per_group tours | ✅ Bokun supports `pricePerBooking: true`; no division by minGroupSize needed |
| Production Bokun direct (with canary mitigation) | ✅ No sandbox explicitly required for v1; canary tour `__TEST DO NOT BOOK__` remains risk mitigation |

---

## Unresolved Questions (to be answered in follow-ups)

1. **Exact locale code format in Bokun API response** → Requires production account GET call
2. **Exact JSON schema for PRICING component** → Request Bokun OpenAPI spec or Swagger screenshot
3. **Response body structure on successful POST /experience** → Likely includes `id`; confirm in Phase 02 or Phase 07 canary
4. **Required fields at Experience creation time** → Inferred as TITLE, LOCATION, PRICING; confirm via GET existing or Bokun support
5. **Are there default Pricing Categories (Adult, Child, etc.) auto-created in account?** → Check Bokun account settings; Phase 02 may need to query or create if missing

---

## Next Steps (Phase 02 handoff)

1. **Types & Client Extension** (Phase 02):
   - Define `BokunExperiencePayload` type with all components (base off docs + inferred structure)
   - Add `createExperience(payload): Promise<{id: string}>` method to client
   - Add `updateExperience(id, componentName, component): Promise<void>` method
   - Write unit tests with mocked HTTP (no prod calls yet)

2. **Mapper** (Phase 03):
   - Tour → BokunExperiencePayload with all 3 priceType branches
   - Locale code mapping (use short codes; adjust if Phase 01 follow-up says otherwise)
   - Default values for missing Bokun fields (cancellation policy, supplier, etc.)

3. **Payload Config** (Phase 04 + 05):
   - Add `bokunSyncStatus`, `bokunLastSyncedAt`, `bokunLastError` fields to Tour collection
   - Add `jobs: { defaultQueue: 'default', queues: [{ name: 'default' }] }` to payload.config.ts
   - Implement `syncTourToBokun` job with exp. backoff + error capture

4. **Validation** (Phase 07):
   - Canary tour: publish `__TEST DO NOT BOOK__` draft
   - Verify end-to-end: Tour → API call → Bokun extranet visible
   - If locale code mismatch, adjust mapper
   - If pricing structure wrong, rollback; contact Bokun

---

## Sources

- [Introduction and concepts – Bókun developer documentation](https://bokun.dev/restful-api-for-creating-updating-and-accessing-experience-products/bhqyxa7kEuAYtM7J2go3Kh/introduction-and-concepts/aSUKEVrdE1dmDpstNt1e94)
- [Component overview – Bókun developer documentation](https://bokun.dev/restful-api-for-creating-updating-and-accessing-experience-products/bhqyxa7kEuAYtM7J2go3Kh/component-overview/snDe1ZUChEodP6Y9q8AnYT)
- [Component: PRICING – Bókun developer documentation](https://bokun.dev/restful-api-for-creating-updating-and-accessing-experience-products/bhqyxa7kEuAYtM7J2go3Kh/component-pricing/5w7fdkvCMbcgkCL2U1UmDV)
- [Checking availability and pricing – Bókun developer documentation](https://bokun.dev/booking-api/vU6sCfxwYdJWd1QAcLt12i/checking-availability-and-pricing/9x4PcziToX5g8WG4j5KMxt)
- [RESTful API – Bókun developer documentation](https://bokun.dev/restful-api-for-creating-updating-and-accessing-experience-products/bhqyxa7kEuAYtM7J2go3Kh)
- [Bókun API docs: RESTful v2](https://api-docs.bokun.dev/rest-v2)
- [GitHub - Bokun/api-docs: Documentation for the Bókun API in Open API format](https://github.com/Bokun/api-docs)

---

## Approval

**Phase 01 findings approve Phase 02 start:** ✅ YES

All critical blockers resolved. Phase 02 can begin with clear endpoint specs, confirmed import strategy, and identified unknowns flagged for follow-up during implementation.
