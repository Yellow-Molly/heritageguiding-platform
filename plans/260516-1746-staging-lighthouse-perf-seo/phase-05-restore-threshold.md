---
phase: 5
title: "Restore Lighthouse Threshold & Close Old Plan"
status: partial
priority: P1
effort: 1h
implemented_at: 2026-05-16
---

## Implementation Summary (2026-05-16)

**Change applied:**
- `apps/web/lighthouserc.cjs:40` — `categories:performance` minScore `0.7` → `0.9`. Supported by staging Lighthouse reports: 0.90-0.99 across all 6 reports (Home/TourListing/TourDetails × desktop/mobile).

**Not changed (gate still fails — by design):**
- `apps/web/lighthouserc.cjs:48` — `largest-contentful-paint` maxNumericValue `2500ms` remains. Staging mobile LCP: Home 3459ms / TourListing 3613ms / TourDetails 3161ms. **CI will fail on this assertion.** This is the signal Phase 4 follow-up is needed; the plan explicitly says "don't skip-merge a failing CI run".

**Therefore old plan NOT yet flipped to `superseded`.** `plans/260404-1815-performance-overhaul/plan.md` stays `in-progress`, blockedBy this plan. The cross-plan note from earlier work is already in place. Flip to `superseded` only when:
1. Follow-up LCP plan lands mobile LCP < 2500ms, OR
2. LCP assertion is intentionally relaxed with documented justification (e.g., to 2800ms) accompanying a follow-up plan link.

**What's complete in this phase:**
- Perf threshold restore (honest, supported)
- Honest documentation of CI status

**What's deferred to follow-up plan `260517-0225-mobile-lcp-deepdive`:**
- Mobile LCP < 2500ms across all 3 pages on 3 consecutive runs (current gap: 60-367ms)
- Green CI run end-to-end (blocked by LCP gate)
- Old plan supersession (blocked by green CI)
- Journal entry (writes once everything actually green)

**Status as of 2026-05-17:** all other Phase 5 outcomes locked in (mobile CLS=0, BP=1.00, A11y=1.00, perf 0.93-0.97). Only the LCP gate blocks the final green. User chose conservative path: keep 2500ms strict, fix via structural Home hero refactor + priority audit (see follow-up plan).



# Phase 5: Restore Lighthouse Threshold & Close Old Plan

## Context
- [Plan overview](plan.md)
- Absorbs unfinished Phase 5 of `plans/260404-1815-performance-overhaul/phase-05-validation.md`
- Lighthouse config: `apps/web/lighthouserc.cjs:40` (currently `minScore: 0.7`)
- CI workflow: `.github/workflows/lighthouse-ci.yml`
- Validation report: `plans/reports/validate-260516-1725-performance-overhaul.md`

## Why
The performance threshold was lowered to 0.7 in April 2026 as a temporary measure during image-optimization work. That work shipped 7 weeks ago and current scores are 0.90–0.99. The threshold lie is now actively masking regressions — restore it to 0.9 and close out the parent plan.

## Preconditions
- Phases 2 (CSP), 3 (contrast), 4 (LCP) merged to master
- Latest staging Lighthouse all 3 pages mobile: perf ≥ 0.9, LCP < 2500ms (measured locally before pushing the threshold change)
- Vercel Preview deploys are healthy (the CI workflow audits Preview URL — if Preview is broken, this phase blocks; see `260514-1506-go-live-readiness-review`)

## Implementation Steps

### Step 1: Local Lighthouse confidence run
Before raising the threshold, prove locally that scores hold:
```bash
cd apps/web
LHCI_BASE_URL=https://staging.privatetours.se npx @lhci/cli@0.14.x autorun
```
Run 3 iterations. Confirm:
- `categories:performance` ≥ 0.9 on all 3 URLs (worst of 3 runs)
- `largest-contentful-paint` < 2500ms on all 3 URLs
- No regressions in a11y / best-practices / SEO

### Step 2: Raise threshold in `apps/web/lighthouserc.cjs`
Single-line edit at `apps/web/lighthouserc.cjs:40`:
```diff
-        // Performance score > 70 (temporarily lowered during image optimization, restore to 0.9 in Phase 5)
-        'categories:performance': ['error', { minScore: 0.7 }],
+        'categories:performance': ['error', { minScore: 0.9 }],
```

### Step 3: Open PR, watch CI
- Commit on `feat/staging-lighthouse-fixes`
- Push, open PR
- Wait for Vercel Preview deploy
- Wait for Lighthouse CI workflow
- **Expected outcome:** workflow passes end-to-end (first green run in months)

### Step 4: Handle CI failure modes
| Failure | Cause | Action |
|---------|-------|--------|
| Preview deploy never ready (timeout) | Vercel Production health blocking Preview | Defer this phase — fix Preview deploys first (see `260514-1506-go-live-readiness-review`) |
| LCP > 2500ms on any URL | Phase 4 fix didn't hold in CI environment | Rollback threshold to 0.7, investigate variance, redo Phase 4 |
| Performance < 0.9 on any URL | Real regression | Identify which audit regressed, fix or roll back the regression PR |

Do NOT skip-merge a failing CI run. If the threshold can't hold cleanly, this phase fails — that's the signal.

### Step 5: Merge to master, watch master run
After PR merges:
- The push-to-master CI run (per `lighthouse-ci.yml`) is now PR-only, so no master run will trigger. But the merged PR's last run IS the green proof.
- Pin a note in the project README or `docs/codebase-summary.md` that the threshold is now `0.9` and what to do if it regresses.

### Step 6: Close out parent plan
Update `plans/260404-1815-performance-overhaul/plan.md`:
- Frontmatter `status: superseded`
- Add note at top of plan body:
  ```
  > **Superseded 2026-05-XX** by `plans/260516-1746-staging-lighthouse-perf-seo/`.
  > Phases 1–4 shipped in commit 665f6deaa32816beb53c4d7891a6335c9f4aa868.
  > Phase 5 (validation + threshold restore) completed in the successor plan.
  ```
- Update phase table: Phase 5 status → "absorbed by successor plan"

### Step 7: Run journal entry
After merge:
```bash
# From repo root
node ~/.claude/scripts/journal-write.cjs --topic "Lighthouse threshold restored to 0.9"
# Or invoke /ck:journal skill manually
```

## Related Code Files
- `apps/web/lighthouserc.cjs` (one line change)
- `plans/260404-1815-performance-overhaul/plan.md` (status update)
- `docs/codebase-summary.md` (optional: note threshold)

## Todo List
- [ ] Local Lighthouse run vs staging — 3 iterations, capture worst scores
- [ ] Confirm worst-case perf ≥ 0.9, LCP < 2500ms
- [ ] Edit `apps/web/lighthouserc.cjs:40` → `minScore: 0.9`
- [ ] Commit, push, open PR
- [ ] Wait for Vercel Preview + Lighthouse CI workflow
- [ ] Confirm CI green
- [ ] Merge PR
- [ ] Update `260404-1815-performance-overhaul/plan.md` → `status: superseded`
- [ ] Write journal entry

## Success Criteria
- `apps/web/lighthouserc.cjs` has `'categories:performance': ['error', { minScore: 0.9 }]`
- One end-to-end green Lighthouse CI workflow run on a PR
- `260404-1815-performance-overhaul/plan.md` marked `superseded`
- All assertions in `lighthouserc.cjs` (including `largest-contentful-paint < 2500ms`) pass

## Risk
- LCP CI assertion (`maxNumericValue: 2500`) is the strictest gate. If Phase 4 reduces LCP only marginally (e.g., to 2.7s), this phase blocks. Consider relaxing the LCP assertion separately ONLY with documented justification — don't loosen silently.
- Lighthouse score variance: a single bad run can fail the gate. CI runs 3 iterations and asserts on median — verify that behavior is intact in `lighthouserc.cjs`.

## Unresolved Questions
- Should we keep `total-blocking-time` as `warn` or promote to `error` once perf is stable? TBT 147ms (Home mobile) is well within 300ms — could tighten.
- Is there value in adding a 4th URL to the Lighthouse target list (e.g., `/en/guides` or `/en/about`)? Out of scope for this phase but worth deciding next.
