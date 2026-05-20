# Phase 04 — Documentation + stakeholder sign-off

## Context Links

- Plan: [plan.md](./plan.md)
- Final CSS source-of-truth lives in Bokun admin; this phase mirrors it into version control
- `docs/deployment-guide.md` — note Bokun theme as load-bearing
- Or new file: `docs/bokun-cart-css-customization.md` (preferred — dedicated)

## Overview

- **Priority:** Required — without this, the next developer wipes the CSS without knowing
- **Status:** pending (blocked by Phase 02; Phase 03 informational)
- **Estimated effort:** 1 hour
- **Description:** Mirror the applied CSS into version-controlled docs, note the maintenance contract (class name churn watch), get stakeholder sign-off on before/after screenshots.

## Key Insights

- Bokun admin is the canonical store but is NOT git → doc-as-code mirror is the only audit trail
- Future devs need to know: selector contract, why we did this, how to update if Bokun classes change
- Stakeholder approval closes the loop; required because no quantitative metric exists for this UX change

## Requirements

### Functional
- Create or update `docs/bokun-cart-css-customization.md` containing:
  - Final CSS block (paste exactly as in Bokun admin)
  - Selector contract: which classes were targeted and why
  - Maintenance protocol: what to do if Bokun renames classes
  - Last-verified date + Bokun deploy ref if visible
- Update `docs/deployment-guide.md` with a short pointer to the above file
- Optionally update `docs/system-architecture.md` if there's a Bokun integration section

### Non-functional
- Documents follow existing doc style (kebab-case filenames, concise prose)
- Documents under 800 LOC per `docs.maxLoc` rule

## Architecture

Docs-only. No code change.

## Related Code Files

**Files to create:**
- `docs/bokun-cart-css-customization.md`

**Files to update:**
- `docs/deployment-guide.md` — add link to new doc + note "Bokun theme load-bearing"
- (Conditional) `docs/system-architecture.md` — if it already has Bokun integration section

## Implementation Steps

1. Copy the final CSS block from Bokun admin (the same block applied in Phase 02)
2. Create `docs/bokun-cart-css-customization.md` with sections:
   - **Why this exists** — brief problem statement, link to brainstorm + plan
   - **Where it lives** — Bokun admin path: Settings → Booking channels → [channel] → Widget → Theme → Show advanced options
   - **The CSS** — full block, formatted
   - **Selector contract** — list each readable class and its purpose
   - **Maintenance** — if you see the cart delete button look broken again after a Bokun deploy, classes likely changed; reinspect via DevTools, update selectors, re-paste in admin
   - **Last verified** — date + Bokun channel UUID (the public env var, not anything sensitive)
3. Add pointer to the new doc in `docs/deployment-guide.md` under a "Bokun" section (create section if missing)
4. Bundle final before/after screenshots (Phase 02 visuals/) into a stakeholder review message — paste in the relevant channel (Slack / email / whatever stakeholder uses)
5. Get explicit sign-off — "approved" / "looks good" / etc. — log it in the plan dir as `phase-04-stakeholder-signoff.md` with date + quote
6. Mark plan status = complete in `plan.md` frontmatter
7. Commit docs change with conventional commit message (separate commit; no code changes bundled): `docs(bokun): record cart delete-button CSS customization`

## Todo List

- [ ] Copy final CSS from Bokun admin
- [ ] Create `docs/bokun-cart-css-customization.md`
- [ ] Update `docs/deployment-guide.md` with pointer
- [ ] (If Bokun section exists) update `docs/system-architecture.md`
- [ ] Compile before/after screenshot bundle for stakeholder
- [ ] Send to stakeholder, request sign-off
- [ ] Log stakeholder response in `phase-04-stakeholder-signoff.md`
- [ ] Update `plan.md` status → complete
- [ ] Commit docs change with conventional message

## Success Criteria

- `docs/bokun-cart-css-customization.md` exists with all required sections
- `docs/deployment-guide.md` references it
- Stakeholder sign-off captured
- Plan status updated to complete

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Doc rots when Bokun classes change | Maintenance section explicitly documents the inspect → update protocol |
| Stakeholder asks for additional changes (scope creep) | Treat as new ticket — document the ask, do not extend this plan |
| Doc commit accidentally includes secrets (channel UUID is PUBLIC, but verify) | Channel UUID is `NEXT_PUBLIC_*` — safe; do NOT include any API keys |

## Security Considerations

- `NEXT_PUBLIC_BOKUN_UUID` is already public — safe to include in docs as a reference
- Do NOT include any HMAC secrets, vendor credentials, or backend API keys

## Next Steps

- Plan complete after sign-off
- If hosted-checkout test (Phase 03) found a clear winner, file follow-up ticket — out of scope here
- Run `/ck:journal` to log the work
