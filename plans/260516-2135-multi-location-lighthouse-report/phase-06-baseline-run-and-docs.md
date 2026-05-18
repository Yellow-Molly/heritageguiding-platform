# Phase 06 — Baseline Run + Docs

## Context Links
- Parent: [plan.md](./plan.md)
- Depends on: all previous phases (01–05)

## Overview
- **Priority:** P1
- **Status:** not-started
- **Effort:** 30m

Execute the first end-to-end run, sanity-review the dashboard, commit the baseline artefacts, and add a short usage section to `docs/deployment-guide.md`. After this phase the tool is "live" and reproducible by anyone with a free WPT key.

## Key Insights
- First run sets the diff baseline for all future runs
- Commit message should clearly mark it as the baseline (other engineers will diff against it)
- `docs/deployment-guide.md` already lists CSP and Bokun setup — short perf section fits naturally

## Requirements

### Functional
- Run `npx tsx scripts/lighthouse-multi-location.ts` end-to-end against staging
- Inspect `index.html`: visually verify all 30 cells populated (or failures explained)
- Commit `perf/multi-location-{YYMMDD-HHmm}/` (HTML + summary.json + raw/*.json)
- Update `docs/deployment-guide.md` with usage section
- Update `MEMORY.md` index entry if learnings are surprising

### Non-functional
- Total run time within 20 min window (else investigate WPT throttling)
- Commit is clean: only the new perf folder + docs change

## Architecture

No new code. Pure operational + docs phase.

## Related Code Files

**Create:**
- `perf/multi-location-{YYMMDD-HHmm}/` (artefact directory — generated)

**Update:**
- `docs/deployment-guide.md` — new section `## Multi-location performance check`
- (Optional) `README.md` — single line link to deployment-guide section

**Read for context:**
- `docs/deployment-guide.md` — find natural insertion point

## Implementation Steps

1. Pre-flight:
   - Confirm `WPT_API_KEY` present in `.env.local`
   - Confirm staging.privatetours.se reachable: `curl -I https://staging.privatetours.se` returns 200
   - Confirm chosen tour-details slug returns 200
2. Run: `npx tsx scripts/lighthouse-multi-location.ts --verbose`
   - Watch progress log; note any per-test failures
   - Expected duration: 10–18 min
3. Inspect `perf/multi-location-{timestamp}/index.html`:
   - All three page sections render
   - Score grid: 5 locations × 4 categories × 2 form factors per page
   - CWV table populated
   - A11y findings section non-empty (some sub-100 audit always present)
   - Bokun caveat visible only on Tour Details
   - "First run, no diff" footer note
4. Inspect `summary.json`:
   - `totalSubmissions: 30`
   - `successful` close to 30; failures noted
   - `gitSha` populated
5. If significant failures (>3 of 30), rerun the failed tests manually via WPT UI or rerun whole batch; otherwise accept
6. Update `docs/deployment-guide.md` — add section:
   ```markdown
   ## Multi-location performance check

   Free Lighthouse + accessibility audit from 5 global locations (Stockholm, Frankfurt, London, US East, US West) for Home, Tour Listing, Tour Details (mobile + desktop).

   ### Prerequisites
   - Free WebPageTest API key: https://www.webpagetest.org/getkey.php
   - Add to `.env.local`: `WPT_API_KEY=<your-key>`

   ### Run
   ```
   npx tsx scripts/lighthouse-multi-location.ts --verbose
   ```

   Output: `perf/multi-location-{YYMMDD-HHmm}/index.html` (self-contained dashboard, opens in any browser). Each run also writes `summary.json` and `raw/*.json` for diff comparison and re-rendering.

   Subsequent runs auto-diff vs the previous committed folder. Pass `--no-diff` to skip.

   See [plan](../plans/260516-2135-multi-location-lighthouse-report/plan.md) for design details.
   ```
7. Commit:
   ```
   git add perf/multi-location-{ts}/ docs/deployment-guide.md scripts/
   git commit -m "perf: add multi-location Lighthouse tool + baseline run"
   ```
   (User runs git commands; not auto-committed by script)
8. Sanity check: clone the dashboard HTML to a temp dir, open it offline → confirms self-contained
9. Memory hygiene: if any non-obvious learning surfaced (e.g. WPT quirk, slug-routing surprise), add a one-line entry to `MEMORY.md`

## Todo List

- [ ] Confirm staging reachability + slug 200
- [ ] Execute full run with `--verbose`
- [ ] Visually inspect `index.html` against success criteria
- [ ] Inspect `summary.json` totals
- [ ] Re-run any failed tests if necessary
- [ ] Update `docs/deployment-guide.md` with usage section
- [ ] Verify self-contained: copy HTML out of repo, open offline
- [ ] Commit baseline + docs in single commit
- [ ] Add MEMORY.md note if learning surfaced

## Success Criteria

1. First baseline `perf/multi-location-{timestamp}/` committed
2. `docs/deployment-guide.md` documents prerequisite + run command
3. Dashboard opens offline (verified by copying HTML out of repo)
4. `summary.json` shows ≥27 of 30 successful (allow ≤3 transient WPT failures)
5. No secrets in any committed artefact
6. Subsequent runs (later) successfully diff against this baseline

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Staging down or partial deploy during baseline run | Pre-flight check; reschedule if down |
| WPT queue spike → many failures | Retry whole batch off-peak; if persistent, mark known-issue and proceed |
| Baseline scores embarrassingly low | This is the point — surface it; readiness review (260514-1506) consumes the data |
| Committed perf folder bloats repo | Single committed folder ~5MB; acceptable for occasional cadence; reassess after 6 months |
| Tour-details slug becomes invalid later | Caught by next run's 404 logging; bump slug in `wpt-config.ts` |

## Security Considerations
- Pre-commit check: `git diff --cached` for `WPT_API_KEY` substring
- `.env.local` confirmed gitignored (already verified Phase 01)

## Next Steps
Plan complete after this phase. Possible follow-ups (defer, do not scope-creep):
- Add scheduled CI run (separate plan if needed)
- Performance budget enforcement (separate plan)
- Production environment variant (separate plan)
