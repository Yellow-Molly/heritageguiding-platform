# Phase 02 — WPT Browser Submitter (Playwright)

## Context Links
- Parent: [plan.md](./plan.md)
- Depends on: [phase-01-scaffolding-config-env.md](./phase-01-scaffolding-config-env.md)
- Replaces predecessor's: `plans/260516-2135-multi-location-lighthouse-report/phase-02-wpt-api-client.md` (API approach — DEAD; see plan.md validation log)
- Playwright docs: https://playwright.dev/docs/intro
- WPT submit form (manual reference): https://www.webpagetest.org/

## Overview
- **Priority:** P1
- **Status:** not-started
- **Effort:** 1.5-2h

Implement headless browser-driven submission to the WebPageTest Starter web form. For each of the 30 submissions (3 pages × 5 locations × 2 form factors), Playwright opens the WPT homepage, fills URL + location + advanced options (form factor, runs-per-test, Lighthouse on), clicks **Start Test**, waits for the result page redirect, and captures the `testId` from the URL. Persists `submissions.json` immediately after each successful submit for durability.

**Why browser-driven, not API:** Catchpoint blocks `runtest.php` for free Starter tier (HTTP 403 verified 2026-05-17). The web form remains anonymously usable within the 150-tests/month quota.

## Key Insights
- WPT result page URL pattern: `https://www.webpagetest.org/result/<testId>/` — `testId` extractable from URL pathname
- After form submit, page either redirects to `/result/<id>/` (test queued) or shows a queue-position page that itself redirects
- Anonymous submissions work for Starter quota; no login flow needed
- Form selectors on `https://www.webpagetest.org/`:
  - URL input: `input[name="url"]` (label: "Website URL")
  - Location dropdown: `select[name="location"]` (option `value="<wptId>"` matches our config)
  - Advanced settings panel: collapsible — may need to click an "Advanced Settings" toggle first
  - Number of runs: `select[name="runs"]` (set to `1`)
  - Connection: leave default (`Cable`)
  - Form factor: typically a "Mobile" checkbox or a separate Mobile tab — verify in smoke
  - Lighthouse: usually an "Include Lighthouse Audit" checkbox in advanced — verify in smoke
  - Submit button: `button[type="submit"]` with text "Start Test"
- **Selector audit is the riskiest piece** — Phase 02 smoke step explicitly validates selectors before running 30
- Catchpoint may rebrand UI without notice; Phase 02 plan includes Plan B (manual paste mode)

## Requirements

### Functional
- `submitOne(page, submission)` → returns `{ testId: string, resultPageUrl: string }` or throws
- `submitAll(submissions, opts)` → uses Playwright `chromium.launch({ headless: true })`, runs `SUBMITTER_CONCURRENCY` browser contexts in parallel, returns `SubmissionRecord[]`
- Writes `submissions.json` to run directory after each successful submission (atomic-ish: write to `.tmp` + rename)
- `--smoke` mode: builds a single submission (home + stockholm + mobile), runs end-to-end to verify selectors
- `--collect-only <run-dir>` mode: SKIP submission, load existing `submissions.json`, hand off testIds to Phase 03 fetcher (resume after partial run)
- Robust to single-test failure: never throws for the whole batch; failure recorded
- Verbose mode prints per-submission state: `[03/30] submitting home @ frankfurt (mobile) ...`

### Non-functional
- Bounded concurrency: 2 browser contexts max (configurable via `SUBMITTER_CONCURRENCY` in `wpt-config.ts`)
- Per-submission timeout: 90s (generous for slow WPT homepage loads)
- Retry-once on transient failure (e.g., redirect timeout); track retry in record
- Browser uses default Playwright Chromium; no system-Chrome dependency
- Verbose logs include `testId` + result page URL once captured (useful for manual recovery)
- All new files <200 LOC

## Architecture

```
submitAll(submissions[], runDir, opts)
   ├─▶ chromium.launch({ headless })
   │       │
   │       ├─▶ p-limit(2) ── for each submission:
   │       │       │
   │       │       browser.newContext() ──▶ context.newPage()
   │       │       │
   │       │       submitOne(page, submission)
   │       │       │     ├─ goto WPT_BASE
   │       │       │     ├─ fill url, location, runs
   │       │       │     ├─ toggle advanced; set Lighthouse + form factor
   │       │       │     ├─ click "Start Test"
   │       │       │     ├─ wait for result page (URL match /result/<id>/)
   │       │       │     └─ extract testId from URL
   │       │       │
   │       │       record submission → append + flush submissions.json
   │       │       │
   │       │       context.close()
   │       │
   │       └─▶ all done → browser.close()
   │
   └─▶ return SubmissionRecord[]
```

## Related Code Files

**Create:**
- `scripts/lib/wpt-submitter-browser.ts` (~180 LOC)

**Update:**
- `scripts/lighthouse-multi-location.ts` — replace Phase 01 stub:
  - Build `SubmissionInput[]` from `wpt-config.ts` cross-product (filtered to 1 if `--smoke`)
  - Create run directory `perf/multi-location-{YYMMDD-HHmm}/`
  - If `--collect-only <dir>`: skip submitAll; load existing `submissions.json`
  - Else: call `submitAll(...)`; pass results to Phase 03 fetcher (placeholder for now)

**Read for context:**
- `scripts/lib/wpt-config.ts` (Phase 01 output)

## Implementation Steps

1. Define types in `wpt-submitter-browser.ts`:
   ```ts
   export interface SubmissionInput {
     pageId: PageId
     url: string
     locationId: LocationId
     wptLocation: string
     formFactor: FormFactor
     runs: number
   }
   export interface SubmissionRecord {
     submission: SubmissionInput
     status: 'submitted' | 'failed'
     testId?: string
     resultPageUrl?: string
     attempts: number
     error?: string
     submittedAt?: string  // ISO
   }
   ```
2. Implement `submitOne(page, submission)`:
   - `await page.goto(WPT_BASE, { waitUntil: 'domcontentloaded', timeout: 30_000 })`
   - Fill URL: `await page.fill('input[name="url"]', submission.url)`
   - Pick location: `await page.selectOption('select[name="location"]', submission.wptLocation)`
   - Expand advanced settings (if not already): try clicking `text=Advanced Settings` (best-effort, ignore if not collapsible)
   - Set runs: `await page.selectOption('select[name="runs"]', String(submission.runs))`
   - Toggle form factor: if `mobile` → check `input[name="mobile"]`; if `desktop` → uncheck (or skip — selector audit in smoke)
   - Toggle Lighthouse: check `input[name="lighthouse"]` (or label `text=Include Lighthouse Audit`)
   - Click submit: `await page.click('button[type="submit"]')`
   - Wait for redirect to result page: `await page.waitForURL(/\/result\/[^\/]+/, { timeout: 60_000 })`
   - Parse testId: `const m = page.url().match(/\/result\/([^\/]+)/); if (!m) throw new Error('no testId in result url')`
   - Return `{ testId: m[1], resultPageUrl: page.url() }`
3. Implement `submitAll(submissions, runDir, opts)`:
   - Launch Chromium headless
   - Minimal concurrency limiter (no new dep — semaphore via in-flight promise array + `Promise.race`)
   - Per submission: `try` → record `status:'submitted'`, write `submissions.json`; `catch` → retry once after 2s; on second failure → `status:'failed'`, record error message (sanitised — no full HTML pages)
   - Append `submitted` records to `submissions.json` atomically (write `.tmp` → rename)
   - Always close browser in `finally`
4. `submissions.json` schema:
   ```json
   {
     "runStartedAt": "2026-05-17T11:02:33.000Z",
     "totalPlanned": 30,
     "records": [
       { "submission": {...}, "status": "submitted", "testId": "240517_AB1C", "resultPageUrl": "...", "attempts": 1, "submittedAt": "..." }
     ]
   }
   ```
5. Wire orchestrator in `scripts/lighthouse-multi-location.ts`:
   - Build submission list from `WPT_LOCATIONS × PAGES × FORM_FACTORS`
   - If `--smoke`: keep only `{ home + stockholm + mobile }`
   - If `--collect-only <dir>`: load `submissions.json` from `<dir>`; skip submitAll
   - Else: `await submitAll(submissions, runDir, { headless: !verbose, verbose })`
   - Log progress line per submission completion: `[N/M] ✓ home — frankfurt — mobile (testId=240517_AB1C)` or `✗ failed: <reason>`
6. Selector audit during smoke: if `--smoke` AND `--verbose`, take screenshot of WPT homepage to `runDir/smoke-form.png` for manual selector verification
7. Smoke test: `npx tsx scripts/lighthouse-multi-location.ts --smoke --verbose`
   - Expected: 1 record in `submissions.json` with valid testId
   - Result page URL visitable manually to confirm
   - Selectors-screenshot saved for audit reference

## Todo List

- [ ] Define `SubmissionInput` / `SubmissionRecord` types
- [ ] Implement `submitOne(page, submission)` with all form-field selectors
- [ ] Manual selector audit on https://www.webpagetest.org/ (DevTools) BEFORE coding — document exact selectors in file header
- [ ] Implement `submitAll(submissions, runDir, opts)` with bounded concurrency + retry-once
- [ ] Implement atomic `submissions.json` append (write .tmp + rename)
- [ ] Wire orchestrator: build submission list + create run dir + `--smoke` + `--collect-only`
- [ ] `--smoke --verbose`: capture form-screenshot for selector reference
- [ ] Smoke test passes: 1 valid testId captured, submissions.json well-formed
- [ ] Manually verify testId on `https://www.webpagetest.org/result/<testId>/` shows queued/running

## Success Criteria

1. `--smoke` run produces `submissions.json` with one record `status:'submitted'` + valid `testId` within ~90s
2. Full run produces up to 30 records; individual failures logged but do not abort batch
3. Concurrency cap respected (no more than 2 simultaneous browser contexts)
4. `submissions.json` is well-formed after every successful submit (durability against process kill)
5. `--collect-only <run-dir>` correctly skips submission and reads existing `submissions.json`
6. No selector failures in smoke; if any, plan documents the corrected selector in file header before full run
7. Smoke screenshot of WPT form saved to `runDir/smoke-form.png` when `--smoke --verbose`

## Risk Assessment

| Risk | Mitigation |
|---|---|
| WPT form selectors change between smoke and full run | Smoke + screenshot establishes baseline; selectors centralised in one place |
| Catchpoint adds CAPTCHA on rapid submissions | Concurrency capped at 2 with natural pacing (UI fills take 2-5s); if CAPTCHA appears → Plan B: manual paste mode (config-driven `submissions.json` input) |
| Headless detection blocks submission | Try standard Playwright launch first; if blocked, switch to `chromium.launch({ headless: false })` for visible mode; document in deployment-guide |
| WPT queue spike → result page never appears | 60s timeout per submission; record failure; batch continues |
| `submissions.json` corrupted by concurrent writes | Single writer (main thread), atomic `.tmp`+rename; concurrent submissions return records, main loop serialises writes |
| Process killed mid-run | `submissions.json` durable; `--collect-only <dir>` resumes from existing testIds |
| Browser binary missing | Phase 01 sanity check ensures `playwright` resolves; document `npx playwright install chromium` |
| WPT Starter quota tripped (~150/month) | Each full run = 30; pre-deploy cadence ~5/month = 150 → exactly the cap; warn in verbose log when approaching |

## Plan B — Manual Paste Mode (if Playwright submission becomes blocked)

If CAPTCHA / detection blocks browser submission entirely:
1. Tool prints 30 pre-filled WPT URLs (one per submission)
2. User opens each in a browser tab, hits Start Test, copies the resulting `/result/<id>/` URL
3. Paste 30 testIds into `submissions.json` manually (template provided)
4. Run `--collect-only <run-dir>` to skip submission and proceed to fetcher

This fallback already supported by `--collect-only` mode; no extra work needed if Plan A fails.

## Security Considerations
- Browser context isolated per submission; no persistent storage / cookies cross-pollution
- No credentials stored; anonymous submission
- Result page URLs are public (anyone with `testId` can view); fine to persist in `submissions.json`
- Sanitise error messages before writing — strip any embedded HTML page content

## Next Steps
Phase 03 — Poll public `jsonResult.php` per captured testId, parse to typed `RunSummary`.
