---
phase: 01
title: "Bokun Sandbox Spike — Verify Extras Write API"
status: complete
effort: 2-3h
blocks: [02, 04]
---

# Phase 01 — Bokun Sandbox Spike

## Context links

- Brainstorm: [plans/reports/brainstorm-260525-1417-bokun-extras-push-sync.md](../reports/brainstorm-260525-1417-bokun-extras-push-sync.md)
- API research: [plans/reports/researcher-260525-1417-bokun-extras-write-api.md](../reports/researcher-260525-1417-bokun-extras-write-api.md)
- Existing client: `apps/web/lib/bokun/bokun-api-client-with-hmac-authentication.ts`
- Existing read of Bokun extras (shape findings): `plans/260519-2046-bokun-extras-add-ons-checkout/research/bokun-extras-shape-findings.md`

## Overview

**Priority:** P0 (blocks all subsequent phases)
**Status:** pending
**Goal:** Hit Bokun sandbox (`api.bokuntest.com`) with ad-hoc requests to confirm the write-side behavior of extras. Three unresolved questions from the research must be answered before we commit to a wire serializer shape.

## Key questions to answer

1. **PUT response shape:** Does `PUT /restapi/v2.0/experience/{id}/components` with an `extras` array return 204, or the updated experience? Determines whether GET-after-PUT is strictly required (decision says yes, but we want the actual response logged for debugging).
2. **`externalId` correlation:** If we send a new extra with `externalId: "cms-row-uuid-abc"`, does Bokun:
   - (a) Persist the externalId so a subsequent GET returns it, enabling round-trip correlation?
   - (b) Silently drop it?
   - (c) Reject the request?
3. **PRICING component coupling:** Extras price + per-person flag live in PRICING component (`pricingRules[]`). Can we send `pricingRules` referencing a new extra by `externalId` (since `extraId` doesn't exist yet on CREATE)? Or must we two-phase: PUT extras → GET to learn IDs → PUT pricingRules?
4. **PRICING component preservation:** PRICING is also full-replacement. If we send `pricingRules` for our extras only, does Bokun delete pre-existing tour-level pricing rules (rates, etc.)? Critical — could break checkout.
5. **Plan tier:** Does the current Bokun plan permit extras writes? Existing text sync works on this plan; extras-specific tier-gating possible but unlikely.
6. **Required toggle:** Where does the "Required" UI flag map in the EXTRAS DTO? Research findings note `included` on the booking-side envelope doesn't match the dashboard "Required" state — verify what field on the write side controls this.

## Steps

1. Set up a throwaway sandbox tour with 1-2 existing extras configured via the Bokun dashboard. Note IDs.
2. Write a one-off Node script (or use `apps/web/scripts/` if a similar pattern exists) that calls `getBokunClient()` to:
   - GET `/restapi/v2.0/experience/{id}` → dump full response, identify where extras + pricingRules sit
   - PUT `/restapi/v2.0/experience/{id}/components` with **just** the existing extras unchanged + log response status/body
   - PUT again **adding a new extra** with an `externalId` field → GET → confirm whether externalId round-trips
   - PUT again with the **extras array empty** → GET → confirm extras were deleted, pricingRules state, tour-level rates state
3. Note all observed behavior in research file (see deliverables).
4. If PRICING component shows pre-existing tour rates getting wiped → escalate immediately: need to widen scope to mirror all pricingRules in CMS too, or find a way to send extras pricingRules independently.

## Deliverables

- `plans/260525-1417-bokun-extras-push-sync/research/bokun-extras-write-api-sandbox-findings.md` — captured request/response samples (PII redacted) + verdict on each question above
- Decision: confirm "GET after PUT" remains the ID backfill strategy, OR switch to externalId-based correlation (skips the GET if Bokun preserves externalId)
- Decision: PRICING component handling — `pricingRules` sent inline with PUT, vs separate call, vs only updating extras component (research notes pricingRules are required for extras to be sellable)

## Related code files

- Read: `apps/web/lib/bokun/bokun-api-client-with-hmac-authentication.ts` (existing client + HMAC flow)
- Read: `apps/web/lib/bokun/serialize-bokun-wire-payload.ts` (current wire payload only carries text fields)
- Write: `plans/260525-1417-bokun-extras-push-sync/research/bokun-extras-write-api-sandbox-findings.md`
- No production code changes in this phase.

## Todo list

- [ ] Identify or create sandbox tour with extras
- [ ] Write throwaway script calling getBokunClient() against sandbox
- [ ] Run GET baseline → log response
- [ ] Run PUT preserving existing extras → log response status
- [ ] Run PUT adding new extra with externalId → GET → verify round-trip
- [ ] Run PUT with extras: [] → verify deletion + pricingRules side-effects
- [ ] Run PUT with new extra + new pricingRule (referencing extra by externalId or array position) → verify pricing got applied
- [ ] Document plan-tier behavior (any 403/422 → record exact error code)
- [ ] Write findings doc
- [ ] Update Phase 02/04 plans if decisions shift (e.g. externalId is reliable → simpler ID backfill)

## Success criteria

- All 6 questions answered with concrete request/response evidence
- Findings doc committed to research/
- Either: confirmed approach matches brainstorm, OR an explicit revised approach documented before Phase 02 starts

## Risks

- **Sandbox extras may behave differently from production** — Bokun's test environment historically has small drift. Mitigate by spot-checking with one production read (no write) before Phase 06 canary.
- **Required toggle confusion** — if mapping isn't obvious, defer to Phase 02 as known limitation; ship `isRequired: false` for v1 and document workaround.
- **Plan tier rejects extras writes** — escalate immediately. Workaround: keep manual SOP active for now, scope this plan down to "drift audit only" (Approach C from brainstorm).

## Next steps

- Phase 02 (types + wire serializer) consumes Phase 01 findings
- Phase 04 (sync job) depends on the confirmed ID backfill mechanism
