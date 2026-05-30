---
phase: 06
title: "Canary Validation + SOP Rewrite"
status: complete
effort: 1-2h
blocks: []
---

# Phase 06 — Canary Validation + SOP Rewrite

## Context links

- All prior phases (01-05 complete)
- Current SOP: `docs/bokun-extras-setup.md` (rewrite target)
- Original parent plan: `plans/260519-2046-bokun-extras-add-ons-checkout/plan.md` (mark as superseded for extras-sync portion)

## Overview

**Priority:** P1
**Status:** pending
**Goal:** End-to-end sandbox validation of the full CMS → Bokun extras push flow, plus rewrite the operator SOP to retire the manual mirror workflow.

## Requirements

### Functional canary
- Pick one sandbox tour with 1-2 existing dashboard extras
- Walk through full lifecycle: adopt baseline → edit CMS row → save → verify Bokun update → add new CMS row → save → verify Bokun create + ID backfill → delete CMS row → save → verify Bokun delete

### Documentation
- Rewrite `docs/bokun-extras-setup.md` end-to-end. New flow: operator works in CMS only; first-time tours require one-time "Adopt baseline" click; the manual "Copy Bokun Extra ID" step is gone for new tours
- Document the env var `BOKUN_EXTRAS_PUSH_ENABLED` in deployment notes / `.env.example`
- Document the "Re-baseline" path: when to use it (operator manually edited Bokun dashboard), what it does
- Cross-link to the new plan from prior brainstorm/plan history
- Keep the Critical Warning about "Price is per pricing category" — that's tour-rate config, unrelated to this work, still bites operators

## Canary checklist (sandbox, single tour)

1. **Pre-flight**
   - [ ] All Phase 02-05 changes deployed to staging
   - [ ] `BOKUN_EXTRAS_PUSH_ENABLED=true` on staging (test env only — production stays false until Phase 06 ships)
   - [ ] Pick canary tour with `bokunExperienceId` set + 1-2 manually-configured extras already mirrored in CMS via the old SOP

2. **Baseline adoption**
   - [ ] Open canary tour in Payload admin
   - [ ] Click "Adopt baseline" → diff modal opens
   - [ ] Verify diff shows existing extras as "In both" (CMS + Bokun matched by ID)
   - [ ] Operator confirms → modal closes → `bokunExtrasBaselineAt` populated
   - [ ] No immediate sync triggered (verify via job queue inspection or `bokunLastSyncedAt` unchanged)

3. **Update flow (existing extra)**
   - [ ] Edit one CMS add-on row: change `adultPriceHint` from 150 → 175
   - [ ] Save tour
   - [ ] Verify `bokunSyncStatus: synced`, `bokunLastSyncedAt` updated
   - [ ] Check Bokun dashboard or via GET — extra price now 175

4. **Create flow (new extra)**
   - [ ] Add new CMS add-on row, leave `bokunExtraId` empty
   - [ ] Save tour
   - [ ] Verify `bokunSyncStatus: synced`
   - [ ] Verify CMS row's `bokunExtraId` now populated (ID backfill worked)
   - [ ] Verify Bokun dashboard shows the new extra

5. **Delete flow**
   - [ ] Remove one CMS add-on row (note its `bokunExtraId` before removal)
   - [ ] Save tour
   - [ ] Verify `bokunSyncStatus: synced`
   - [ ] Verify Bokun dashboard no longer shows that extra (deleted by omission)

6. **Disabled state**
   - [ ] Pick a second sandbox tour (NOT baselined)
   - [ ] Edit its `optionalAddOns` rows
   - [ ] Save
   - [ ] Verify Bokun extras for that tour are UNCHANGED (gate working — text-only sync)
   - [ ] Verify text fields (title, description) DID sync (no regression on existing flow)

7. **Error path**
   - [ ] Temporarily put an invalid `bokunExperienceId` on a baselined tour
   - [ ] Save with an add-on edit
   - [ ] Verify `bokunSyncStatus: failed`, `bokunLastError` populated with sanitized HTTP details
   - [ ] Fix ID, save again → recovers to `synced`

8. **Widget sanity**
   - [ ] Open public tour page on staging with the canary tour
   - [ ] Click Book Now → walk through to extras step → confirm extras still render with correct prices in the widget
   - [ ] No zero-extra "ghost" rows, no double-displays

## Related code files

**Modify:**
- `docs/bokun-extras-setup.md` — full rewrite per new workflow
- `.env.example` — add `BOKUN_EXTRAS_PUSH_ENABLED` with comment
- `docs/deployment-guide.md` (if exists) — note new env var
- `plans/260519-2046-bokun-extras-add-ons-checkout/plan.md` — append note: "Phase-2 push sync shipped in plans/260525-1417-bokun-extras-push-sync"

**Create (optional):**
- `plans/260525-1417-bokun-extras-push-sync/canary-validation-log.md` — captured results from the checklist above (kept for posterity / audit trail)

## Implementation steps

1. Execute canary checklist on staging — record outcomes
2. If any step fails: file a fix issue, address before SOP rewrite (don't ship docs ahead of confidence)
3. Rewrite SOP:
   - Move "Adopt baseline" to a new Step 1
   - Step 2: edit CMS rows directly (no more "create in Bokun first")
   - Step 3: Save tour → automatic push
   - Step 4: localization (unchanged — Bokun-side translations still needed for sv/de widget copy if BOKUN_SYNC_LOCALE is 'en')
   - Step 5: verification (visit tour page + widget)
   - Troubleshooting section: add "Stuck on Pending after save" / "bokunLastError says X" rows
   - Limitations section: keep multi-locale push as known gap; remove "no automatic CMS→Bokun push" (now obsolete)
4. Update `.env.example` + deployment guide
5. Annotate prior plan(s) so future readers find this work
6. Flip production `BOKUN_EXTRAS_PUSH_ENABLED=true` only after team sign-off post-staging canary

## Todo list

- [ ] Run canary checklist on staging
- [ ] Capture results in `canary-validation-log.md`
- [ ] Rewrite `docs/bokun-extras-setup.md`
- [ ] Update `.env.example`
- [ ] Annotate `plans/260519-2046-bokun-extras-add-ons-checkout/plan.md` as superseded
- [ ] Open PR for docs + env changes
- [ ] Team sign-off → flip production env var
- [ ] Verify production canary on one real tour
- [ ] Mark plan status: complete

## Success criteria

- All 8 canary sections pass on staging
- New SOP under 150 lines, scannable, no references to the obsolete manual-paste-ID step (except in "if migrating legacy tours" Adopt-baseline section)
- Production env var flipped without incident
- One production tour successfully cycled through CMS → Bokun without manual Bokun-side touches

## Risks

- **Production drift between staging and prod Bokun environments** — mitigate by repeating sections 3-5 of the checklist on ONE real tour after enabling in prod, before broad announcement to operators
- **Operator confusion during transition** — schedule a 15-minute walkthrough with operator(s); SOP rewrite alone isn't sufficient onboarding for a workflow change
- **Discovered API limit during canary** (e.g. rate-limit on rapid edits) — mitigate by debouncing tour saves if observed; not expected at our volume

## Security considerations

- Production rollout: confirm `BOKUN_EXTRAS_PUSH_ENABLED` is set ONLY in production env (not leaked to client bundle — server-only var)
- Audit trail: Payload's built-in versioning should capture the `bokunExtrasBaselineAt` field flip per tour

## Next steps

- Monitor `bokunLastError` field across all baselined tours for 1 week post-rollout
- If error rate < 1% of saves → confidence to encourage broader operator adoption
- If drift observed between CMS and Bokun (operators side-channel-editing dashboard) → revisit deferred drift audit (Approach C from brainstorm)
