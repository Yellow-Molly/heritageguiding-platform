# Phase 01 — Scaffolding, Config & Playwright Dep

## Context Links
- Parent: [plan.md](./plan.md)
- Revalidation research: [research/researcher-wpt-catchpoint-status-revalidation.md](./research/researcher-wpt-catchpoint-status-revalidation.md)
- Precedent: `scripts/generate-bokun-import.ts`, `scripts/lib/bokun-import-defaults.ts`

## Overview
- **Priority:** P1 (foundation for all subsequent phases)
- **Status:** not-started
- **Effort:** 30-45m

Lay down static configuration, project plumbing, Playwright devDependency, and the orchestrator skeleton. No network calls yet — purely scaffolding that subsequent phases plug into. Free-tier compatible: no API key required.

## Key Insights
- `tsx` already in use for `generate-bokun-import.ts`; no new runtime dependency required
- `.env.local` is project convention; `.env*` already gitignored — **no WPT_API_KEY needed** in this plan (free-tier UI submission is anonymous)
- Playwright is the only new devDependency; ~120MB one-time browser binary install via `npx playwright install chromium`
- TourDetails URL needs a concrete slug — pick a published, stable tour and hard-code in config
- WPT location IDs use Catchpoint format: `<location-key>:Chrome` (e.g., `Stockholm:Chrome`, `ec2-us-east-1:Chrome`)

## Requirements

### Functional
- Config module exports: 5 WPT locations, 3 pages with concrete URLs, 2 form factors, runs-per-test=1, threshold constants for diff highlighting, base WPT URLs (form + result endpoints)
- Orchestrator skeleton: parses CLI args (`--no-diff`, `--verbose`, `--dry-run`, `--smoke`, `--collect-only <dir>`), prints config summary, exits cleanly (does not yet submit tests)
- Sanity helper: confirms `tsx` + `@playwright/test` resolve before any network/browser call

### Non-functional
- All new files under 200 LOC
- Match style of `scripts/generate-bokun-import.ts` (single quotes, no semicolons, ✓/✗ console output)
- Zero new runtime app deps; only devDependency additions

## Architecture

```
scripts/lighthouse-multi-location.ts   ─── reads ───▶ wpt-config.ts
                                       ─── prints ──▶ config summary
                                       (no network / browser yet)
```

No IO in this phase except reading the config module and writing to stdout.

## Related Code Files

**Create:**
- `scripts/lighthouse-multi-location.ts` — orchestrator skeleton (~80 LOC at this phase, grows)
- `scripts/lib/wpt-config.ts` — pure config module (~80 LOC)

**Update:**
- `package.json` — add `playwright` to devDependencies (use `npm i -D playwright` so version constraint matches lockfile)
- (Optional) `package.json` scripts — add `"perf:multi-loc": "tsx scripts/lighthouse-multi-location.ts"` for convenience

**Read for context:**
- `scripts/generate-bokun-import.ts` — orchestrator style precedent
- `scripts/lib/bokun-import-defaults.ts` — config module style precedent
- `package.json` — confirm `tsx` present; identify monorepo workspace placement (root or apps/web)

## Implementation Steps

1. Decide on TourDetails slug — pick a published tour (suggest stable like `/tours/stockholm-archipelago-private-tour` or whichever has reliable content). Confirm with `curl -I` it returns 200 on staging.
2. Determine `package.json` placement — same workspace where `scripts/generate-bokun-import.ts` runs from. Install Playwright there:
   ```
   npm i -D playwright
   npx playwright install chromium
   ```
3. Create `scripts/lib/wpt-config.ts`:
   ```ts
   export const WPT_BASE = 'https://www.webpagetest.org'
   export const WPT_RUNTEST_URL = `${WPT_BASE}/`                       // public web form (UI submission)
   export const WPT_JSON_RESULT_URL = `${WPT_BASE}/jsonResult.php`     // public result endpoint
   export const WPT_STATUS_URL = `${WPT_BASE}/testStatus.php`          // public status endpoint
   export const WPT_RESULT_PAGE_URL = (testId: string) => `${WPT_BASE}/result/${testId}/`

   export const WPT_LOCATIONS = [
     { id: 'stockholm', wptId: 'Stockholm:Chrome',      label: 'Stockholm' },
     { id: 'frankfurt', wptId: 'Frankfurt:Chrome',      label: 'Frankfurt' },
     { id: 'london',    wptId: 'London:Chrome',         label: 'London' },
     { id: 'us-east',   wptId: 'ec2-us-east-1:Chrome',  label: 'US East (Virginia)' },
     { id: 'us-west',   wptId: 'ec2-us-west-1:Chrome',  label: 'US West (California)' },
   ] as const

   export const PAGES = [
     { id: 'home',         url: 'https://staging.privatetours.se/',                          label: 'Home' },
     { id: 'tour-listing', url: 'https://staging.privatetours.se/tours',                     label: 'Tour Listing' },
     { id: 'tour-details', url: 'https://staging.privatetours.se/tours/<chosen-slug>',       label: 'Tour Details' },
   ] as const

   export const FORM_FACTORS = ['mobile', 'desktop'] as const
   export const RUNS_PER_TEST = 1   // Starter free tier — single run per submission, keeps quota friendly

   export const DIFF_THRESHOLDS = {
     scoreAbs: 5,        // Lighthouse score ±5 = highlight
     lcpMs: 200,
     fcpMs: 150,
     ttfbMs: 100,
     cls: 0.02,
     tbtMs: 100,
   } as const

   // Concurrency cap for Playwright submissions; be polite to free tier
   export const SUBMITTER_CONCURRENCY = 2

   // Polling for jsonResult.php; tests typically complete in 1-3 min, occasionally 10+
   export const POLL_INTERVAL_MS = 15_000
   export const POLL_MAX_MS = 20 * 60 * 1000   // 20 min cap per test

   export type LocationId = typeof WPT_LOCATIONS[number]['id']
   export type PageId     = typeof PAGES[number]['id']
   export type FormFactor = typeof FORM_FACTORS[number]
   ```
4. Create `scripts/lighthouse-multi-location.ts` skeleton:
   - JSDoc header (usage, reference to plan dir, note: no API key required, requires Playwright)
   - `parseArgs()` → `{ noDiff, verbose, dryRun, smoke, collectOnly?: string }`
   - `main()`:
     - Print mode banner: `Mode: smoke|dry-run|full|collect-only`
     - Print config summary (page count, location count, form factors, total tests = 30, concurrency cap, runs-per-test, output dir target)
     - Sanity check: `require.resolve('playwright')` — fail fast with helpful message if missing
     - Stub: `console.log('Browser submitter implemented in Phase 02; result fetcher in Phase 03')`
     - Exit 0
   - Match existing logging style (✓/✗ symbols)
5. Smoke test:
   - `npx tsx scripts/lighthouse-multi-location.ts` → prints summary, exits 0
   - `npx tsx scripts/lighthouse-multi-location.ts --smoke` → prints "Mode: smoke (1 of 30 tests planned)"
   - With Playwright uninstalled (simulate): error mentions `npm i -D playwright`
6. Verify lint passes / typecheck clean in chosen workspace

## Todo List

- [ ] Confirm staging tour slug (curl 200 check)
- [ ] Install Playwright as devDependency in the correct workspace
- [ ] Run `npx playwright install chromium` (one-time)
- [ ] Create `scripts/lib/wpt-config.ts` with locations/pages/form factors/thresholds/URLs
- [ ] Create `scripts/lighthouse-multi-location.ts` skeleton with arg parsing + config print + Playwright sanity check
- [ ] (Optional) Add `perf:multi-loc` script to `package.json`
- [ ] Smoke runs: default + `--smoke` + missing-Playwright simulation

## Success Criteria

1. `npx tsx scripts/lighthouse-multi-location.ts` runs without exception
2. Config print shows correct totals: 3 pages × 5 locations × 2 form factors = 30 tests planned (15 in `--smoke` not required; smoke = 1 test)
3. Missing-Playwright case produces actionable error linking to install command
4. No network calls made at this phase
5. Files under 200 LOC each
6. `wpt-config.ts` exports all constants needed by Phases 02-05

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Wrong workspace for Playwright install (monorepo) | Inspect `scripts/generate-bokun-import.ts` working dir; install in same workspace |
| Chosen tour slug returns 404 in future | Document in `wpt-config.ts` as `// Update if this slug is decommissioned` |
| Playwright Chromium download blocked by network policy | Document offline-install fallback (`PLAYWRIGHT_BROWSERS_PATH`) in deployment-guide later |
| Catchpoint changes WPT location IDs (e.g., renames `Stockholm:Chrome`) | Phase 02 smoke flagged when submit page rejects unknown location; bump in `wpt-config.ts` |

## Security Considerations
- No API key handling in this plan (free-tier UI submission is anonymous)
- `.env.local` not used by this script
- No secrets in `.env.example`

## Next Steps
Phase 02 — Playwright WPT browser submitter builds on this skeleton.
