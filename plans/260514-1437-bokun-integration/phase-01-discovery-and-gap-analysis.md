# Phase 01: Discovery & Gap Analysis

## Context Links
- Plan: [plan.md](./plan.md)
- Research: `plans/reports/researcher-260514-1437-bokun-api-integration.md`
- Existing infra: `apps/web/lib/bokun/`, `plans/mvp-implementation/phase-08.1-bokun-integration.md`

## Overview
- **Priority:** P1 (blocker for all subsequent phases)
- **Status:** not-started
- **Effort:** 1-2h
- **Description:** Verify assumptions about Bokun Experience write API and confirm import/runtime structure before extending the client.

## Key Insights
- Existing client signs `GET availability` + `POST booking`. Adding `POST/PUT experience` reuses signer but is a new endpoint surface.
- Payload runs inside Next.js (verify); if so, the `afterChange` hook can import from `apps/web/lib/bokun/*` directly.
- Several Bokun specifics flagged unresolved in research report — must verify against live API or docs before Phase 02.

## Requirements

### Functional
- Confirm endpoint path, HTTP method, and required payload fields for Experience creation/update
- Verify locale codes Bokun expects (sv / sv-SE / sv_SE) by inspecting an existing Experience's response
- Confirm pricing model accepts a flat-rate per-booking category (for `per_group` tours)
- Verify import path from CMS afterChange hook to existing Bokun client

### Non-Functional
- No production writes during discovery — read-only API calls (GET existing experience, GET vendor info) only
- Document findings in this phase file before proceeding

## Related Code Files

### Read
- `apps/web/lib/bokun/bokun-api-client-with-hmac-authentication.ts`
- `apps/web/lib/bokun/bokun-types.ts`
- `apps/web/lib/bokun/bokun-availability-service-with-caching.ts`
- `apps/web/lib/bokun/bokun-booking-service-and-widget-url-generator.ts`
- `packages/cms/collections/tours.ts` (verify `bokunExperienceId` field present)
- `packages/cms/payload.config.ts` (check Jobs Queue config, hook registration patterns)
- Wherever Payload runtime lives — likely `apps/web/app/(payload)/...`

### Modify
- (none — discovery only; create a `phase-01-findings.md` notes file inside this plan dir for recording answers)

## Implementation Steps

1. **Audit existing client capabilities**
   - Read `bokun-api-client-with-hmac-authentication.ts` end-to-end
   - List: methods exposed, headers set, signature format, error class, retry behavior
   - Note any hard-coded paths or assumptions that block adding new endpoints

2. **Confirm Payload runtime + import path**
   - Locate `payload.config.ts` and identify which app boots Payload (`apps/web`? `packages/cms` standalone?)
   - Test that a hook defined in `packages/cms/collections/tours.ts` can import from `apps/web/lib/bokun/*`. If not, decide on:
     - (a) Extract Bokun client to a shared internal package
     - (b) Co-locate the new mapper + job in the importing app
   - Document decision

3. **Read Bokun Experience write API spec**
   - Fetch official docs at `https://api-docs.bokun.dev/rest-v2`
   - Confirm endpoint paths (CREATE vs UPDATE), HTTP methods, content-type
   - List ALL required vs optional fields for create
   - Document the rate-plan + pricing-category structure with one concrete example
   - Note response shape (does it return the created `id` to persist as `bokunExperienceId`?)

4. **Verify locale codes against a real Experience**
   - Use existing client to GET an existing Experience (if any in account) OR vendor info
   - Inspect the locale tags returned (`sv` vs `sv-SE`)
   - Document Bokun's locale convention

5. **Validate per_group pricing model**
   - Test in Bokun extranet UI: can a pricing category be priced per-booking (flat) instead of per-person?
   - If not, document fallback: `flatPrice / minGroupSize` → per-person Adult rate
   - Update phase-03 plan accordingly

6. **Confirm Jobs Queue availability in Payload 3.81**
   - Check `payload.config.ts` for existing `jobs` config
   - If absent, add minimal `jobs` block (task registry + worker settings)
   - Verify Payload admin UI surfaces job runs (built-in `payload-jobs` collection)

7. **Capture answers**
   - Create `plans/260514-1437-bokun-integration/phase-01-findings.md` with sections matching each open question
   - Mark plan.md open questions as resolved or roll forward to Phase 02

## Todo List

- [ ] Audit existing `bokun-api-client-with-hmac-authentication.ts` — list capabilities
- [ ] Confirm Payload runtime location and verify hook → `apps/web/lib/bokun/*` import works (or decide alternative)
- [ ] Read Bokun Experience write API spec; document endpoints + required fields
- [ ] GET existing Experience to confirm locale codes
- [ ] Verify per_group pricing category support in Bokun
- [ ] Confirm Payload Jobs Queue is configured (or add minimal config)
- [ ] Write `phase-01-findings.md` capturing all answers

## Success Criteria
- All 5 open questions from plan.md have documented answers
- Decision recorded on import strategy (in-place reuse vs extract to shared package)
- Phase 02 has unambiguous endpoint spec to implement against
- No code committed in this phase

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Bokun docs don't fully spec the create endpoint | Fall back to calling support, or extranet network inspection |
| Payload runtime split prevents shared imports | Extract Bokun client to `packages/bokun-client` (small internal package); ~30min refactor |
| Locale code mismatch surfaces late | Resolved here; mapper in Phase 03 uses confirmed format |

## Security Considerations
- Use sandbox-style read-only calls if possible (GET vendor info, GET existing experiences)
- Do NOT create/update/delete any production data during discovery
- Credentials stay in `.env.local`; never commit

## Next Steps
- Findings doc feeds Phase 02 (types + client extension) and Phase 03 (mapper rules)
