---
phase: 02
title: Re-measure + strip listing perf instrumentation
status: completed-fail
priority: P2
effort: 30m
depends: [01]
---

# Phase 02 — Re-measure + close out listing instrumentation

> **Outcome (2026-05-02 22:00 UTC+2): GATE FAILED.** `getGuides` p95 ≈ 700 ms (single captured sample 692.8 ms; wall-clock estimate 500–800 ms on populated scenarios). Phase 01 SQL aggregate is correct (no errors, tour counts render) but does not move `getGuides` p95 under the 300 ms gate — the dominant cost is the guides `find` with `depth:1`, not the tour-count batch. Listing instrumentation stays. Parent plan Phase 06 stays blocked. See `plans/260502-0048-instant-filter-feedback/baselines/guides-post-aggregate.md` for the full analysis and follow-up options (cache, raw-SQL guides find, or denormalize `guide.tourCount`).

> **Mid-flight bug + fix (2026-05-02 21:45–21:50 UTC+2):** First Phase 01 deploy `b8gj3vlju` shipped a broken SQL aggregate using `ANY(${guideIds})` — Drizzle expanded the JS array as a tuple `($1,$2,...)`, Postgres rejected. Pages still 200ed via Next.js error boundary, tour counts silently zeroed. Fix `c31334b fix(api): bind guideIds via IN (sql.join)` switched to `IN (sql.join(...))` (the existing pattern in `pgvector-semantic-search-service.ts`). Verified: 0 SQL errors on `fmxdetg0g`, tour counts render correctly.

## Context Links
- Parent plan: `plans/260502-2124-getguides-tour-count-perf/plan.md`
- Phase 01 baseline procedure: `plans/260502-0048-instant-filter-feedback/baselines/{tours,guides}-baseline-20260502.md`
- Post-R1+R2+R3 baselines (this is the new "before"): `plans/260502-0048-instant-filter-feedback/baselines/{tours,guides}-post-r1r2r3.md`
- Parent plan Phase 06 (still blocked): `plans/260502-0048-instant-filter-feedback/phase-06-cleanup.md`
- Listing instrumentation: `apps/web/app/(site)/[locale]/(frontend)/{tours,guides}/page.tsx`

## Overview
**Priority:** P2
**Brief:** Re-run staging capture against the post-aggregate-query deploy. If `getGuides` p95 lands <300 ms, strip ALL `[tours-perf]` and `[guides-perf]` instrumentation, flip parent plan Phase 06 to ready, close the changelog entry.

## Key Insights
- The previous `tours-post-r1r2r3.md` already showed PASS warm for `getTours` and `filterOptions`; only `getGuides` was the residual blocker. Phase 01 of this plan addresses that.
- Capture procedure unchanged — re-use the script in `tours-baseline-20260502.md` "Capture procedure (executed)" section.
- After this phase: parent plan `260502-0048-instant-filter-feedback/` is fully unblocked.

## Requirements
**Functional**
- Deploy Phase 01 commit to staging.
- Run capture for `/guides` (and `/tours` as a sanity-check — should still PASS).
- Write `plans/260502-0048-instant-filter-feedback/baselines/guides-post-aggregate.md` with the new distribution.
- If gate passes:
  - Strip `[tours-perf]` instrumentation from `apps/web/app/(site)/[locale]/(frontend)/tours/page.tsx`.
  - Strip `[guides-perf]` instrumentation from `apps/web/app/(site)/[locale]/(frontend)/guides/page.tsx`.
  - Flip parent plan `phase-06-cleanup.md` status from blocked → ready.
- Update `docs/project-changelog.md` with the close-out delta vs the R1+R2+R3 entry.

**Non-functional**
- Two new commits: one for the doc + status flip, one for the instrumentation strip. Allows `git revert` of just the strip if production traffic disagrees with staging numbers.

## Architecture
N/A (measurement + cleanup).

## Related Code Files

**Modified:**
- `apps/web/app/(site)/[locale]/(frontend)/tours/page.tsx` — remove `[tours-perf]` block, restore plain `await Promise.all([categories, cities, tours])`.
- `apps/web/app/(site)/[locale]/(frontend)/guides/page.tsx` — remove `[guides-perf]` block, restore plain `await Promise.all([guides, filterOptions])`.
- `plans/260502-0048-instant-filter-feedback/phase-06-cleanup.md` — flip status header.
- `docs/project-changelog.md` — append close-out delta.

**Created:**
- `plans/260502-0048-instant-filter-feedback/baselines/guides-post-aggregate.md`

## Implementation Steps
1. Confirm Phase 01 commit deployed to staging via `vercel ls` and build log shows the prebuild migration step ran (it's idempotent; just confirms pipeline still works).
2. Run capture for `/guides`:
   - 5 scenarios × 6 hits each (no cache-bust): default, `?language=de`, `?specialization=history-culture`, `?area=stockholm`, `?q=anna`.
   - `vercel logs --since 5m --limit 5000 -j > /tmp/post-aggregate.json`
   - Parse `[guides-perf] guides;dur` distribution.
3. Write `guides-post-aggregate.md` with the new table (n / min / p50 / p75 / p90 / p95 / p99 / max).
4. Apply gate: `getGuides` p95 < 300 ms?
   - **PASS** → strip instrumentation (steps 5–7).
   - **FAIL** → document, escalate to user. Do NOT strip.
5. Strip `[tours-perf]` from `tours/page.tsx` (lines ~37-63 — see Phase 04 of the predecessor plan for the exact restoration block).
6. Strip `[guides-perf]` from `guides/page.tsx` (lines ~34-51).
7. Flip parent plan `phase-06-cleanup.md` status header from "blocked" / "deferred" to "ready / pending".
8. Update `docs/project-changelog.md`:
   ```
   ### [2026-MM-DD] — getGuides tour-count aggregate query (close-out)
   - getGuides p95 ~700–800 ms → <X ms (raw SQL aggregate replaces limit:0 batch find)
   - Listing perf instrumentation removed.
   - Plan: plans/260502-2124-getguides-tour-count-perf/
   ```
9. Run `npm run type-check` and `npm run test -- tours guides` after instrumentation strip.
10. Commit:
    - `perf(api): getGuides tour-count post-deploy baseline (post-aggregate)`
    - `chore: remove listing-query perf instrumentation`
    - `docs: log getGuides aggregate close-out`

## Todo List
- [ ] Confirm Phase 01 deployed
- [ ] Capture `/guides` post-aggregate distribution
- [ ] Write `guides-post-aggregate.md`
- [ ] Apply gate decision
- [ ] **If pass:** strip `[tours-perf]` instrumentation
- [ ] **If pass:** strip `[guides-perf]` instrumentation
- [ ] **If pass:** flip parent plan phase-06 to ready
- [ ] Update changelog
- [ ] `npm run type-check` clean
- [ ] `npm run test -- tours guides` passes
- [ ] Commit
- [ ] **If fail:** document failure mode, escalate

## Success Criteria
- `guides-post-aggregate.md` exists with measured distribution.
- `getGuides` p95 < 300 ms with 2× margin (<150 ms ideal).
- Instrumentation removed from both `page.tsx` files (only on PASS).
- Parent plan Phase 06 unblocked (only on PASS).
- `docs/project-changelog.md` reflects the final state.

## Risk Assessment
- **Risk (LOW × MEDIUM):** Vercel log truncation (same as Phase 01 baselines noted). **Mitigation:** capture in two windows; merge.
- **Risk (LOW × LOW):** Removing instrumentation while production traffic shape differs from staging curl traffic. **Mitigation:** require 2× margin under gate; restore is a `git revert`.
- **Risk (LOW × LOW):** Editing parent plan phase-06 status conflicts with concurrent work. **Mitigation:** read first, preserve any manual edits.

**Rollback:** Trivial — instrumentation strip is a `git revert`.

## Security Considerations
- Confirm no debug instrumentation leaks DB query text or PII into logs after removal.
- Phase 01's aggregate query parameter-binds `guideIds`; verified safe in that phase.

## Next Steps
- On gate pass: parent plan `260502-0048-instant-filter-feedback/` proceeds to Phase 06 completion + archive. R1+R2+R3 + this aggregate are the closeout.
- On gate fail: open dedicated follow-up. Likely candidates: cache `getGuides` (filter-cardinality concerns from brainstorm § B require fresh thinking), or denormalize `guide.tourCount` as a column maintained by tours `afterChange` hook.
