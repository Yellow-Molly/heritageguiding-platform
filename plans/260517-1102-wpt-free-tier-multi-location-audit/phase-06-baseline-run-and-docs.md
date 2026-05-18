# Phase 06 — Baseline Run + Docs

## Context Links
- Parent: [plan.md](./plan.md)
- Depends on: all previous phases (01–05)

## Overview
- **Priority:** P1
- **Status:** not-started
- **Effort:** 30m

Execute the first end-to-end run, sanity-review the dashboard, commit the baseline artefacts, and add a usage section to `docs/deployment-guide.md`. After this phase the tool is "live" and reproducible by anyone with the repo + Playwright Chromium installed.

## Key Insights
- First run sets the diff baseline for all future runs
- Commit message should clearly mark it as the baseline (other engineers will diff against it)
- `docs/deployment-guide.md` already lists CSP and Bokun setup — short perf section fits naturally
- **No WPT API key required** — Playwright drives anonymous UI submission; only setup step is `npx playwright install chromium`

## Requirements

### Functional
- Run `npx tsx scripts/lighthouse-multi-location.ts --verbose` end-to-end against staging
- Inspect `index.html`: visually verify all 30 cells populated (or failures explained)
- Commit `perf/multi-location-{YYMMDD-HHmm}/` (HTML + summary.json + submissions.json + raw/*.json)
- Update `docs/deployment-guide.md` with usage section
- Update `MEMORY.md` index entry if learnings are surprising

### Non-functional
- Total run time within 25 min window (Playwright submit ~5-8 min + WPT processing ~10-15 min)
- Commit is clean: only the new perf folder + docs change + scripts/lib/wpt-*.ts

## Architecture
No new code. Pure operational + docs phase.

## Related Code Files

**Create:**
- `perf/multi-location-{YYMMDD-HHmm}/` (artefact directory — generated)

**Update:**
- `docs/deployment-guide.md` — new section `## Multi-location performance check`
- (Optional) `README.md` — single-line link to deployment-guide section

**Read for context:**
- `docs/deployment-guide.md` — find natural insertion point

## Implementation Steps

1. Pre-flight:
   - Confirm Playwright Chromium installed: `npx playwright install chromium` (idempotent)
   - Confirm staging.privatetours.se reachable: `curl -I https://staging.privatetours.se` returns 200
   - Confirm chosen tour-details slug returns 200
2. Selector audit (one-time per WPT-UI change): `npx tsx scripts/lighthouse-multi-location.ts --smoke --verbose`
   - Inspect `runDir/smoke-form.png` to confirm selectors match current WPT homepage
   - If selectors changed, fix `wpt-submitter-browser.ts` selector constants before full run
3. Full run: `npx tsx scripts/lighthouse-multi-location.ts --verbose`
   - Watch progress log; note any per-test failures
   - Expected duration: 15–22 min
4. Inspect `perf/multi-location-{timestamp}/index.html`:
   - All three page sections render
   - Score grid: 5 locations × 4 categories × 2 form factors per page
   - CWV table populated
   - A11y findings non-empty (some sub-100 audit always present)
   - Bokun caveat visible only on Tour Details
   - "First run, no diff" footer note
   - "WPT Starter (free tier)" badge in header
5. Inspect `summary.json`:
   - `totalSubmissions: 30`
   - `successful` close to 30; failures noted
   - `gitSha` populated
6. If significant failures (>3 of 30), rerun the failed tests via `--collect-only <dir>` (after re-submitting just the failed ones manually — Plan B), or rerun whole batch off-peak; otherwise accept
7. Update `docs/deployment-guide.md` — add section:
   ````markdown
   ## Multi-location performance check

   Free Lighthouse + accessibility audit from 5 global locations (Stockholm, Frankfurt, London, US East, US West) for Home, Tour Listing, Tour Details (mobile + desktop). Driven by Playwright against WebPageTest Starter (free tier — no API key required).

   ### One-time setup
   ```
   npm i -D playwright
   npx playwright install chromium
   ```

   ### Run
   ```
   npx tsx scripts/lighthouse-multi-location.ts --verbose
   ```

   Useful flags:
   - `--smoke` — single test (home / stockholm / mobile) for selector audit
   - `--collect-only <run-dir>` — skip submission; re-fetch results from existing `submissions.json`
   - `--no-diff` — skip diff vs previous run

   Output: `perf/multi-location-{YYMMDD-HHmm}/index.html` (self-contained dashboard, opens in any browser). Each run also writes `summary.json`, `submissions.json`, and `raw/*.json` for diff comparison and re-rendering.

   Subsequent runs auto-diff vs the previous committed folder.

   Quota: WebPageTest Starter allows 150 tests/month. Each full run uses 30 tests → ~5 audits/month safe (pre-deploy cadence).

   See [plan](../plans/260517-1102-wpt-free-tier-multi-location-audit/plan.md) for design details.
   ````
8. Commit:
   ```
   git add perf/multi-location-{ts}/ docs/deployment-guide.md scripts/ package.json package-lock.json
   git commit -m "perf: add free-tier multi-location Lighthouse tool + baseline run"
   ```
   (User runs git commands; not auto-committed by script)
9. Sanity check: copy the dashboard HTML to a temp dir, open it offline → confirms self-contained
10. Memory hygiene: if any non-obvious learning surfaced (e.g. WPT UI quirk, Catchpoint behaviour), add a one-line entry to `MEMORY.md`

## Todo List

- [ ] Confirm staging reachability + slug 200
- [ ] Confirm Playwright Chromium installed
- [ ] Smoke run + selector audit via `runDir/smoke-form.png`
- [ ] Execute full run with `--verbose`
- [ ] Visually inspect `index.html` against success criteria
- [ ] Inspect `summary.json` totals
- [ ] Re-run any failed tests if necessary
- [ ] Update `docs/deployment-guide.md` with usage section
- [ ] Verify self-contained: copy HTML out of repo, open offline
- [ ] Commit baseline + docs + scripts in single commit
- [ ] Add `MEMORY.md` note if learning surfaced

## Success Criteria

1. First baseline `perf/multi-location-{timestamp}/` committed
2. `docs/deployment-guide.md` documents Playwright setup + run command + quota note
3. Dashboard opens offline (verified by copying HTML out of repo)
4. `summary.json` shows ≥27 of 30 successful (allow ≤3 transient WPT failures)
5. No secrets in any committed artefact
6. Subsequent runs successfully diff against this baseline

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Staging down or partial deploy during baseline run | Pre-flight check; reschedule if down |
| WPT queue spike → many failures | Retry whole batch off-peak; if persistent, mark known-issue and proceed |
| Baseline scores embarrassingly low | This is the point — surface it; readiness review (260514-1506) consumes the data |
| Committed perf folder bloats repo | Single committed folder ~5–10MB (raw JSON heavy); acceptable for ~5/month cadence; reassess in 6 months |
| Tour-details slug becomes invalid later | Caught by next run's 404 logging; bump slug in `wpt-config.ts` |
| WPT UI redesign breaks selectors mid-cycle | Smoke run before each full run; selector constants centralised |

## Security Considerations
- Pre-commit check: `git diff --cached` for credential-like substrings (defensive even though no API key in this plan)
- `.env.local` confirmed gitignored (verified Phase 01)
- Raw JSON contains no credentials (WPT response body is public regardless)

## Next Steps
Plan complete after this phase. Possible follow-ups (defer, do not scope-creep):
- Add scheduled CI run (separate plan if needed) — note CI Playwright cost
- Performance budget enforcement (separate plan)
- Production environment variant (separate plan)
- Switch to LHCI on every PR for fast in-CI regression catch (separate plan)
