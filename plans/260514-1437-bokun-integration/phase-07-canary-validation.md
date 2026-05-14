# Phase 07: Canary Validation

## Context Links
- Plan: [plan.md](./plan.md)
- Depends on: All prior phases

## Overview
- **Priority:** P1 (final acceptance gate)
- **Status:** not-started
- **Effort:** 1-2h
- **Description:** Validate the entire pipeline end-to-end against production Bokun using a single canary tour. Confirm Experience creation, update, error handling, and admin UI. Then archive the canary in Bokun.

## Key Insights
- Production-first mitigation: single isolated test tour, never bookable
- Title prefix `__TEST DO NOT BOOK__` makes the entry obvious in Bokun extranet
- Use the manual-sync button (Phase 06) to control timing — don't rely on auto hook for canary
- Walk a full lifecycle: create → update → simulate failure → recover

## Requirements

### Functional
- One canary tour created in Payload with all required fields populated
- Successful CREATE in Bokun observed in extranet
- Tour edited in Payload; successful UPDATE in Bokun observed
- Forced failure (e.g. invalid env var) reproduces `failed` state in admin
- Recovery (env restored + manual sync) returns state to `synced`
- Canary archived in Bokun extranet before considering phase complete

### Non-Functional
- No public exposure: canary tour stays as `status: draft` in Payload
- Canary `availability: unavailable` to ensure it never renders on widget
- Manual cleanup checklist documented for any orphan Experiences created during pre-canary testing

## Related Files

### Create
- Canary Tour entry in Payload (via admin, not in fixtures)
- `phase-07-canary-validation-log.md` in plan dir — record observations + screenshots

## Implementation Steps

1. **Pre-flight check**
   - Verify all phases 01-06 complete and merged
   - Verify env vars set in dev: `BOKUN_API_KEY`, `BOKUN_SECRET_KEY` (production credentials)
   - Verify Bokun extranet account is the intended target

2. **Create canary tour in Payload**
   - Title (en): `__TEST DO NOT BOOK__ Canary Tour`
   - Title (sv): `__TEST BOKA INTE__ Kanariefärd`
   - Title (de): `__TEST NICHT BUCHEN__ Kanaren-Tour`
   - Status: `draft`
   - Availability: `unavailable`
   - Pricing: `per_person`, basePrice 1, currency SEK, childPrice unset
   - Duration: 1h
   - Meeting point: dummy address (e.g. office)
   - Group size: min 1, max 1
   - At least 1 guide (existing) assigned
   - Save → triggers afterChange → job enqueues

3. **Observe CREATE**
   - Wait up to 60s, refresh tour in admin
   - Verify: `bokunSyncStatus='synced'`, `bokunExperienceId` populated, `bokunLastSyncedAt` set
   - Log in to Bokun extranet, find the new Experience by ID
   - Verify all v1 fields look correct (title localized, price 1 SEK, duration, meeting point, group size)
   - Screenshot extranet view → save to phase-07-canary-validation-log.md

4. **Observe UPDATE**
   - Edit canary in Payload: change `shortDescription` to "Updated <timestamp>"
   - Save → triggers job
   - Verify Bokun extranet reflects update
   - Verify `bokunLastSyncedAt` advanced

5. **Simulate failure**
   - In `.env.local`, temporarily set `BOKUN_API_KEY` to invalid value
   - Restart dev server
   - Click "Sync now" in admin
   - Verify: status pill → `failed`, `bokunLastError` populated with auth error
   - Restore valid env var; restart; click "Sync now"
   - Verify recovery → `synced`

6. **Cleanup**
   - In Bokun extranet: archive (or delete) the canary Experience
   - In Payload: set canary tour `bokunSyncStatus = 'disabled'` to prevent further sync
   - Document any other orphan Experiences from pre-canary testing and clean them up
   - Update plan.md `status: pending` → `validation-complete`

7. **Sign-off checklist** — fill in `phase-07-canary-validation-log.md`:
   - [ ] CREATE successful, screenshot captured
   - [ ] UPDATE successful, screenshot captured
   - [ ] FAILURE state reproducible
   - [ ] RECOVERY successful
   - [ ] Canary archived in Bokun
   - [ ] All orphan Experiences cleaned up
   - [ ] Build + tests pass
   - [ ] No regression in existing inbound flow (widget loads, availability still readable on a real tour)

## Todo List

- [ ] Pre-flight: confirm env, confirm all phases merged
- [ ] Create canary tour in Payload
- [ ] Observe successful CREATE in Bokun
- [ ] Observe successful UPDATE in Bokun
- [ ] Simulate + observe FAILURE state
- [ ] Observe RECOVERY to synced
- [ ] Archive canary in Bokun, set Payload tour to `disabled`
- [ ] Clean up any orphan Experiences
- [ ] Verify no regression in existing inbound flow
- [ ] Complete validation log with screenshots

## Success Criteria
- All 7 sign-off checklist items completed
- Validation log committed to plan dir
- Canary cleaned up in both systems
- Plan marked validation-complete

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Canary tour accidentally published / booked | Status=draft + availability=unavailable + obvious title prefix |
| Orphan Experiences accumulate in Bokun during dev iterations | Track every create during this phase; clean up before sign-off |
| Bokun extranet UI doesn't show all v1 fields immediately | Some fields may be in nested tabs; check carefully |
| Test run produces real bookings (extreme edge case) | Canary is draft + unavailable; widget won't render; even direct Bokun calendar visit shows no slots since no departures defined |

## Security Considerations
- After validation, **rotate** any credentials that were temporarily downgraded or exposed during failure-simulation testing
- Confirm no canary data leaked to public Bokun search/listings (it shouldn't — no departures, but verify)

## Next Steps
- v2 planning: image upload, category mapping, departure sync (separate plan)
- Coordinate with `260430-1520-bokun-go-live` for any overlap with security-fix changes
- Update `docs/` if any deployment guide needs to reflect the new env vars or job worker setup
