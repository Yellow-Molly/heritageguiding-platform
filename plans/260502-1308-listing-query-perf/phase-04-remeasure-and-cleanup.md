---
phase: 04
title: Re-measure + close out
status: done (R1 PASS, R2 PASS warm, R3 partial — index applied but bottleneck shifted to tour-count batch query)
priority: P1
effort: 1h
depends: [01, 02, 03]
---

# Phase 04 — Re-measure + close out

## Context Links
- Brainstorm: `plans/reports/brainstorm-260502-1112-listing-query-perf.md`
- Phase 01 baselines (capture procedure): `plans/260502-0048-instant-filter-feedback/baselines/{tours,guides}-baseline-20260502.md`
- Parent plan Phase 06 (blocked): `plans/260502-0048-instant-filter-feedback/phase-06-cleanup.md`
- Tour page instrumentation: `apps/web/app/(site)/[locale]/(frontend)/tours/page.tsx:37-63`
- Guides page instrumentation: `apps/web/app/(site)/[locale]/(frontend)/guides/page.tsx:34-51`

## Overview
**Priority:** P1 (this is the gate that unblocks parent plan)
**Status:** pending
**Brief:** Re-run the staging baseline capture against post-R1+R2+R3 deploy. Update baseline files with new numbers. If all three gates pass with margin, unblock parent plan Phase 06 to remove `[tours-perf]` / `[guides-perf]` instrumentation.

## Key Insights
- Capture procedure already documented in baseline files — re-use exactly. Same 5 scenarios × 6 hits, same `vercel logs --since 30m --limit 2000 -j` parse.
- "Margin" = at least 2× headroom under the 300 ms gate (so <150 ms p95) — gives confidence that production load won't tip back into BLOCK.
- Instrumentation lives in TWO files only — `tours/page.tsx` and `guides/page.tsx`. No `console.time` calls anywhere else.
- Post-numbers can either UPDATE the existing baseline files (note "Re-measured 2026-05-XX after R1+R2+R3") OR add `*-post-r1r2r3.md` siblings. Decision: **add siblings** so original BLOCK numbers remain auditable in the file history without `git blame` archaeology.

## Requirements
**Functional**
- Deploy `master` HEAD (post-R1+R2+R3) to Vercel staging.
- Run baseline capture procedure.
- Write `plans/260502-0048-instant-filter-feedback/baselines/tours-post-r1r2r3.md` and `guides-post-r1r2r3.md` with new distributions + decision against the gate.
- If all gates pass: mark parent plan Phase 06 unblocked (edit `phase-06-cleanup.md` status header) and remove `[tours-perf]` / `[guides-perf]` instrumentation from both `page.tsx` files.
- Update `docs/project-changelog.md` with one consolidated R1+R2+R3 entry.
- Evaluate `docs/code-standards.md` — only update if a new caching convention emerged (likely not — R1/R2 mirror existing pattern).

**Non-functional**
- Baseline files self-contained: include capture commit SHA, deploy alias, sample distribution table, decision verdict.
- Changelog entry under 5 lines.

## Architecture
N/A (measurement + docs).

## Related Code Files
**Modified:**
- `apps/web/app/(site)/[locale]/(frontend)/tours/page.tsx` — remove `[tours-perf]` instrumentation (lines 37-63 → restore plain `await Promise.all([categories, cities, tours])`).
- `apps/web/app/(site)/[locale]/(frontend)/guides/page.tsx` — remove `[guides-perf]` instrumentation (lines 34-51 → restore plain await).
- `docs/project-changelog.md` — add R1+R2+R3 entry.
- `plans/260502-0048-instant-filter-feedback/phase-06-cleanup.md` — flip status header from "deferred" to "ready".

**Created:**
- `plans/260502-0048-instant-filter-feedback/baselines/tours-post-r1r2r3.md`
- `plans/260502-0048-instant-filter-feedback/baselines/guides-post-r1r2r3.md`

**Conditional:**
- `docs/code-standards.md` — update only if new pattern emerged.

## Implementation Steps
1. Confirm R1+R2+R3 commits all on `master` and deployed to staging.
2. Capture baselines using procedure from `tours-baseline-20260502.md` "Capture procedure (executed)" section:
   - 5 scenarios × 6 curl hits each (cache-busted with `?_=<rand>`) for `/tours` and `/guides`.
   - `vercel logs --since 30m --limit 2000 -j > tours-logs.json`, same for guides.
   - Parse `[tours-perf]` / `[guides-perf]` lines into per-metric distributions.
3. Write `tours-post-r1r2r3.md` with the same table format as `tours-baseline-20260502.md` (n / min / p50 / p75 / p90 / p95 / p99 / max for `categories`, `cities`, `tours`).
4. Write `guides-post-r1r2r3.md` with the same format for `guides`, `filterOptions`.
5. Apply decision rule per gate:
   - `getTours` p95 < 300 ms → R2 PASS
   - `getGuideFilterOptions` p95 < 300 ms → R1 PASS
   - `getGuides` p95 < 300 ms → R3 PASS (soft)
6. **If all three gates pass:**
   - Remove `[tours-perf]` block (lines 37-63) from `tours/page.tsx` — restore to:
     ```ts
     const [categories, cities, { tours, total, totalPages }] = await Promise.all([
       getCategories('theme', locale),
       getCities(locale),
       getTours(filters, locale),
     ])
     ```
   - Remove `[guides-perf]` block from `guides/page.tsx` — same restoration pattern.
   - Update parent plan `phase-06-cleanup.md` status header: "deferred" → "ready / pending".
   - Add `docs/project-changelog.md` entry:
     ```
     ## 2026-05-XX — perf: listing query optimization (R1+R2+R3)
     - getTours p95 1396 ms → <X ms (depth:1 + select + unstable_cache)
     - getGuideFilterOptions p95 821 ms → <X ms (unstable_cache)
     - getGuides p95 695 ms → <X ms (depth:1 + select + tours.categories/guides.status indexes)
     - Plan: plans/260502-1308-listing-query-perf/
     ```
7. **If any gate fails:**
   - Document failure in the post-r1r2r3 baseline file with hypothesis (cache miss rate? cold start? un-flushed CDN?).
   - Do NOT remove instrumentation.
   - Open follow-up issue or escalate to lead.
8. Re-evaluate `docs/code-standards.md` — if R1/R2 caching is now a generalizable convention (e.g., "all listing-query helpers SHOULD use `unstable_cache`"), document. Else skip.
9. `npm run typecheck` and `npm run test -- tours guides` after instrumentation removal.
10. Commit:
    - `perf(api): re-measure post R1+R2+R3 baselines`
    - `chore: remove listing-query perf instrumentation` (only if gates pass)
    - `docs: log R1+R2+R3 listing-query perf in changelog`

## Todo List
- [ ] Confirm R1+R2+R3 deployed to staging (verify SHAs)
- [ ] Re-run capture procedure for /tours
- [ ] Re-run capture procedure for /guides
- [ ] Write `tours-post-r1r2r3.md`
- [ ] Write `guides-post-r1r2r3.md`
- [ ] Apply decision rule per gate
- [ ] **If all pass:** remove `[tours-perf]` from `tours/page.tsx`
- [ ] **If all pass:** remove `[guides-perf]` from `guides/page.tsx`
- [ ] **If all pass:** flip parent plan phase-06 status to ready
- [ ] Update `docs/project-changelog.md`
- [ ] Evaluate `docs/code-standards.md` (likely no-op)
- [ ] `npm run typecheck` clean
- [ ] `npm run test -- tours guides` passes
- [ ] Commit
- [ ] **If any fail:** document failure, escalate

## Success Criteria
- Two new baseline files exist with post-R1+R2+R3 distributions.
- All three gates pass with at least 2× margin (<150 ms p95) — OR failure is documented with next-action plan.
- Instrumentation removed from `page.tsx` files (only on PASS).
- Parent plan Phase 06 unblocked (only on PASS).
- `docs/project-changelog.md` updated.

## Risk Assessment
- **Risk (LOW × HIGH):** Vercel log truncation truncates p95 sample (same effect as Phase 01 — see baseline note "Note on sample skew"). **Mitigation:** capture twice with separated time windows; if `tours;dur` n < 30 use `--since 60m` and merge.
- **Risk (LOW × MEDIUM):** Cold-start spikes on first-of-hour requests skew p95 upward when warm path is fast. **Mitigation:** discard first sample per scenario (warm-up hit) — same as Phase 01.
- **Risk (LOW × MEDIUM):** Removing instrumentation prematurely if production load shape differs from staging curl traffic. **Mitigation:** require 2× margin under gate; instrumentation re-add is a 5-minute revert if production p95 disagrees.
- **Risk (LOW × LOW):** Editing parent plan phase-06 status causes confusion if other team work has touched it. **Mitigation:** read parent plan first; preserve any manual edits.

**Rollback:** Trivial — instrumentation is two `console.log` blocks; restoration is a `git revert` of the cleanup commit. R1/R2/R3 themselves are independent of this phase and not affected.

## Security Considerations
- Confirm no debug instrumentation leaks DB query text or PII into logs after removal.
- `[tours-perf]` / `[guides-perf]` lines log only timings + `JSON.stringify(filters)` — filters are validated, no leak risk; remove anyway per cleanup goal.

## Next Steps
- On gate pass: parent plan `plans/260502-0048-instant-filter-feedback/` proceeds to Phase 06 completion + archive.
- On gate fail: open dedicated follow-up plan (e.g., FTS migration, deeper schema rework, or Vercel Cache Components opt-in per brainstorm B5).
