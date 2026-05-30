---
phase: 04
title: "Sync Job Extras Integration + ID Backfill"
status: complete
effort: 2-3h
blocks: [05, 06]
---

# Phase 04 — Sync Job Extras Integration + ID Backfill

## Context links

- Existing job: `packages/cms/lib/bokun-sync-job.ts`
- Existing client: `apps/web/lib/bokun/bokun-api-client-with-hmac-authentication.ts`
- Mapper (Phase 03): `apps/web/lib/bokun/map-addons-to-bokun-extras.ts`
- Phase 01 findings (GET-after-PUT response shape)

## Overview

**Priority:** P1
**Status:** pending
**Goal:** Wire the extras mapper into `runBokunSyncForTour`. After PUT components, GET the experience, correlate Bokun extra IDs by `externalId` (CMS row UUID), and persist new IDs back to the tour's `optionalAddOns[].bokunExtraId` rows.

Includes the **per-tour baseline gate** that excludes extras from the payload until operator explicitly opts the tour in via Phase 05.

## Requirements

### Functional
- Add `getExperience(experienceId)` method to `BokunApiClient` (read endpoint for ID backfill)
- Sync job checks `tour.bokunExtrasBaselineAt` — if null, omit extras from payload (text-only sync, current behavior)
- If baselineAt is set: include `optionalAddOns` in `tourToBokunExperiencePayload` call
- After successful PUT, do GET to retrieve the updated extras with assigned IDs
- For each CMS row that lacked `bokunExtraId`: match by externalId (or array position fallback if Phase 01 confirms externalId not supported), write the new Bokun ID back to CMS via `payload.update` with `skipBokunSync: true` context
- New global env var `BOKUN_EXTRAS_PUSH_ENABLED` (default `false`) — additional kill switch above the per-tour baseline. When `false`, skip extras entirely regardless of baseline state. Lets us deploy phases 02-04 dark before flipping on.
- Tour schema: add `bokunExtrasBaselineAt` (date, sidebar, readOnly) — set by Phase 05 admin button

### Non-functional
- No recursive sync loops — reuse existing `skipBokunSync` context flag
- ID backfill errors do NOT roll back the PUT (Bokun state is already updated) — log warning + leave row with empty `bokunExtraId` → next save retries the same correlation logic
- All net-new Bokun calls (GET) covered by existing HMAC + retry infra
- Errors surface in `bokunLastError` per existing pattern

## Architecture

```
runBokunSyncForTour(payload, tourId)
  └── load tour with locale='all', depth=2
  └── if status='disabled' → skip
  └── ASSEMBLE PAYLOAD:
        ├── existing text fields (unchanged)
        └── if env BOKUN_EXTRAS_PUSH_ENABLED && tour.bokunExtrasBaselineAt:
              add optionalAddOns → mapAddOnsToBokunExtras
  └── tourToBokunExperiencePayload(tour) → wire payload
  └── PUT /experience/{id}/components
  └── if payload had extras:
        ├── GET /experience/{id}
        ├── extract extras[] from response (path TBD by Phase 01)
        ├── for each CMS row WITHOUT existing bokunExtraId:
        │     find Bokun extra where externalId === CMS row.id
        │     → write Bokun.id back into CMS row.bokunExtraId
        └── payload.update with skipBokunSync context (no recursion)
  └── persist bokunSyncStatus='synced' etc. (existing path)
```

## Related code files

**Read:**
- `packages/cms/lib/bokun-sync-job.ts` (existing job — extend `runBokunSyncForTour`)
- `apps/web/lib/bokun/bokun-api-client-with-hmac-authentication.ts` (add `getExperience`)
- Phase 01 findings (GET response shape — where extras live in the response body)

**Modify:**
- `apps/web/lib/bokun/bokun-api-client-with-hmac-authentication.ts` — add `getExperience(experienceId): Promise<BokunExperienceFullResponse>`
- `apps/web/lib/bokun/bokun-types.ts` — add `BokunExperienceFullResponse` for GET response
- `packages/cms/lib/bokun-sync-job.ts` — extras gate + GET-after-PUT + ID backfill
- `packages/cms/collections/tours.ts` — add `bokunExtrasBaselineAt: Date` (sidebar, readOnly, position right under `bokunLastError`)
- Existing afterChange hook should NOT need changes — it already triggers on any tour change including `optionalAddOns` edits

**Create:**
- `packages/cms/lib/bokun-extras-id-backfill.ts` — pure helper: given Bokun GET response extras + CMS rows, return updates `[{rowIndex, bokunExtraId}]`
- `packages/cms/lib/__tests__/bokun-extras-id-backfill.test.ts`
- `apps/web/lib/bokun/__tests__/bokun-api-client-get-experience.test.ts` — extends existing client tests

## Implementation steps

1. Add `getExperience(id)` to client — GET `/restapi/v2.0/experience/{encodeURIComponent(id)}`. Return type per Phase 01 findings. Reuse existing fetch wrapper.
2. Tour schema: add `bokunExtrasBaselineAt` field (Date, sidebar, readOnly with description "Set when operator clicks 'Adopt baseline'; until set, extras are not pushed to Bokun"). Run Payload migration generator.
3. In `runBokunSyncForTour`:
   - Read env `BOKUN_EXTRAS_PUSH_ENABLED` (default false)
   - Read `tour.bokunExtrasBaselineAt`
   - Gate condition: `extrasEnabled = process.env.BOKUN_EXTRAS_PUSH_ENABLED === 'true' && tour.bokunExtrasBaselineAt != null`
   - Build payload — pass `tour.optionalAddOns` to mapper ONLY if `extrasEnabled`
   - Call existing PUT path (no changes to retry/error logic)
   - After successful PUT, if `extrasEnabled` AND any CMS row lacks `bokunExtraId`:
     - GET experience
     - Call new `backfillExtraIds(cmsRows, bokunExtras)` helper
     - If updates non-empty: `payload.update({collection:'tours', id, data:{optionalAddOns: updatedRows}, context:{skipBokunSync:true}})`
     - Wrap in try/catch — log warn on GET/backfill failure, don't throw (PUT already succeeded)
4. `bokun-extras-id-backfill.ts`:
   - Input: CMS rows array, Bokun extras array from GET
   - For each CMS row WITHOUT bokunExtraId, find Bokun extra where `externalId === row.id` (Phase 01 may shift to position-based if externalId unsupported)
   - Return new CMS rows array with bokunExtraId populated where matched
   - Pure, easily testable
5. Unit tests for backfill helper:
   - All rows already have IDs → input === output
   - One new row with matching externalId → bokunExtraId populated
   - One new row, no matching externalId → row unchanged (warn case)
   - Two new rows, both match → both populated
6. Integration-level test (mocked client) covering the new branch in `runBokunSyncForTour` — adds to existing sync-job test file if present.

## Todo list

- [ ] Phase 01 findings reviewed; ID backfill strategy locked (externalId vs position)
- [ ] Add `getExperience` to BokunApiClient
- [ ] Add `BokunExperienceFullResponse` type per Phase 01 findings
- [ ] Add `bokunExtrasBaselineAt` field to Tours collection
- [ ] Generate Payload migration; commit
- [ ] Implement `bokun-extras-id-backfill.ts` helper + unit tests
- [ ] Extend `runBokunSyncForTour` with gate + GET-after-PUT + backfill
- [ ] Add `BOKUN_EXTRAS_PUSH_ENABLED` env var (document in .env.example)
- [ ] Update existing sync-job tests for new branch (no regressions in disabled state)
- [ ] `npm run build` + run all bokun-related tests

## Success criteria

- With `BOKUN_EXTRAS_PUSH_ENABLED=false`: zero behavioral change vs today
- With env=true + tour without baseline: zero behavioral change (text-only sync)
- With env=true + tour with baseline: extras included in PUT, IDs backfilled after GET
- Recursion guard: backfill `payload.update` does NOT re-enqueue sync (verified by counting hook invocations in test)
- Manual canary against sandbox tour in Phase 06 confirms end-to-end flow

## Risks

- **GET response shape differs from Phase 01 sandbox** (prod drift) — mitigate by parsing defensively (`response?.extras ?? response?.activityComponents?.extras ?? []`). Same envelope-flexibility used in webhook mapper.
- **externalId not preserved by Bokun** → fall back to position-based correlation (sort both arrays by displayOrder, zip by index). Brittle if Bokun re-orders. Phase 01 must confirm.
- **GET fails or returns stale data after PUT** — possible eventual-consistency. If first attempt finds no match for a new row, leave it unwired. Next save will re-attempt. Acceptable degradation.
- **Migration on production tours** — `bokunExtrasBaselineAt` added as nullable, no backfill. All existing tours start un-baselined → safe rollout. Only tours where operator explicitly opts in get the push behavior.
- **Loop on backfill** — even with `skipBokunSync`, a stale hook config could re-trigger. Add a backstop: skip extras push if `tour.bokunExtrasBaselineSyncInProgress` (rejected; YAGNI per current single-tenant volume).

## Security considerations

- GET on `/experience/{id}` reuses HMAC client — no new auth surface
- ID backfill writes use `skipBokunSync` context — same trust boundary as current `bokun-sync-job` self-updates
- `BOKUN_EXTRAS_PUSH_ENABLED` env var is server-only (never exposed to client). Document in deployment guide.

## Next steps

- Phase 05 builds the admin "Adopt baseline" UI that sets `bokunExtrasBaselineAt`
- Phase 06 canaries the full flow end-to-end
