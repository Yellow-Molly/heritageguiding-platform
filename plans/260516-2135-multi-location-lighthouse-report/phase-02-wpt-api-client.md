# Phase 02 — WebPageTest API Client

> ⚠️ **SUPERSEDED 2026-05-17** — `runtest.php` requires paid Catchpoint Pro API key (HTTP 403 on free tier verified). Replacement: [`plans/260517-1102-wpt-free-tier-multi-location-audit/phase-02-wpt-browser-submitter.md`](../260517-1102-wpt-free-tier-multi-location-audit/phase-02-wpt-browser-submitter.md) — Playwright drives WPT Starter web UI instead.

## Context Links
- Parent: [plan.md](./plan.md)
- Depends on: [phase-01-scaffolding-config-env.md](./phase-01-scaffolding-config-env.md)
- WPT REST docs: https://docs.webpagetest.org/api/runtest/
- WPT result JSON: https://docs.webpagetest.org/api/reference/result/

## Overview
- **Priority:** P1
- **Status:** not-started
- **Effort:** 1-1.5h

Implement the WebPageTest REST client: submit a test, poll for completion, fetch result JSON. Orchestrate 30 parallel submissions with sane concurrency and exponential backoff. Smoke-test against one URL before wiring all 30.

## Key Insights
- WPT submission endpoint: `https://www.webpagetest.org/runtest.php` — accepts GET or POST with query params
- Response is JSON when `f=json` is included: returns `data.testId` + `data.statusUrl` + `data.jsonUrl`
- Poll `https://www.webpagetest.org/testStatus.php?f=json&test={id}` — `statusCode` 200 = done, 100-101 = waiting/running, 4xx = failed
- Result fetched from `https://www.webpagetest.org/jsonResult.php?test={id}` — contains `data.lighthouse` (when `lighthouse=1`) and `data.median` with run metrics
- Lighthouse-only mode (`lighthouseTrace=1` + `f=json`) is supported in free tier
- Form factor controlled by `mobile=1` (default desktop), `lighthouseConfig=desktop|mobile` (explicit)

## Requirements

### Functional
- `submitTest(input)` → returns `{ testId: string, statusUrl: string }`
- `pollTestUntilDone(testId, opts)` → resolves when `statusCode === 200`, rejects on terminal failure or timeout
- `fetchResult(testId)` → returns raw WPT result JSON (`unknown`-typed; parsing in Phase 03)
- `runAll(submissions, opts)` → submits all 30 jobs (bounded concurrency 6), polls each, returns array of `{ submission, status, raw|error }`
- Robust to single-test failure: never throws for the whole batch
- CLI smoke flag `--smoke` submits exactly one test (home, stockholm, mobile) and prints status as it changes

### Non-functional
- Concurrency cap: 6 simultaneous submissions (WPT public API friendly)
- Poll interval: 15s, exponential backoff to 60s max, total wait cap 20min per test
- Use `fetch` (Node 24 LTS native — confirmed by project memory: Next.js 16 / Node 24 default)
- Verbose mode prints per-test state transitions

## Architecture

```
runAll(submissions[])
   ├─▶ p-limit(6) ── submitTest()         ───▶ WPT runtest.php
   │                  ↓
   │                pollTestUntilDone()   ───▶ WPT testStatus.php (loop)
   │                  ↓
   │                fetchResult()         ───▶ WPT jsonResult.php
   │                  ↓
   │                { submission, status, raw }
   └─▶ collected results array
```

## Related Code Files

**Create:**
- `scripts/lib/wpt-client.ts` (~150 LOC)

**Update:**
- `scripts/lighthouse-multi-location.ts` — replace stub print with call to `runAll(...)`, write each raw result to `perf/<run-dir>/raw/{page}-{location}-{formFactor}.json`

**Read for context:**
- `scripts/lib/wpt-config.ts` (Phase 01 output)

## Implementation Steps

1. Define types in `wpt-client.ts`:
   ```ts
   export interface SubmissionInput {
     pageId: PageId
     url: string
     locationId: LocationId
     wptLocation: string
     formFactor: FormFactor
     runs: number
     apiKey: string
   }
   export interface SubmissionResult {
     submission: SubmissionInput
     status: 'success' | 'failed'
     testId?: string
     raw?: unknown        // result JSON shape, parsed in Phase 03
     error?: string
   }
   ```
2. Implement `submitTest(input)`:
   - Build URL: `https://www.webpagetest.org/runtest.php?url=<url>&location=<wptLocation>&runs=<runs>&fvonly=1&lighthouse=1&f=json&k=<apiKey>&mobile=<0|1>&lighthouseConfig=<mobile|desktop>`
   - GET → JSON → `data.testId`
   - Throw on `statusCode >= 400` or missing `testId`
3. Implement `pollTestUntilDone(testId, { intervalMs, maxWaitMs, onTick })`:
   - Loop until `statusCode === 200` or timeout
   - On `statusCode === 100|101`: wait, backoff
   - On `statusCode >= 400`: reject
   - On timeout: reject with helpful message
4. Implement `fetchResult(testId)`:
   - GET `jsonResult.php?test={id}` → return JSON `data` block
5. Implement `runAll(submissions, opts)`:
   - Minimal concurrency limiter (no new dep): semaphore via array of in-flight promises, awaiting `Promise.race` when at cap
   - Per submission: wrap in try/catch, never throw upward
   - Return collected results array
6. Wire into orchestrator:
   - Build submission list from `wpt-config.ts` cross-product
   - Create run directory `perf/multi-location-{YYMMDD-HHmm}/raw/`
   - Write each successful raw result to disk immediately (durability)
   - Log progress: `[12/30] ✓ home — frankfurt — mobile (testId=240517_AB1C)`
7. Add `--smoke` arg path: build 1-item submission list, otherwise full 30
8. Manual smoke: `npx tsx scripts/lighthouse-multi-location.ts --smoke --verbose` → verify single raw JSON saved

## Todo List

- [ ] Define `SubmissionInput` / `SubmissionResult` types
- [ ] Implement `submitTest(input)`
- [ ] Implement `pollTestUntilDone(testId, opts)` with exponential backoff
- [ ] Implement `fetchResult(testId)`
- [ ] Implement bounded-concurrency `runAll(submissions, opts)` (no new deps)
- [ ] Wire orchestrator to build submission list + create run dir + write raw files
- [ ] Add `--smoke` flag handling (1 submission, mobile + stockholm + home)
- [ ] Smoke test passes: 1 raw JSON written, exit code 0

## Success Criteria

1. `--smoke` run produces one raw JSON in `perf/multi-location-*/raw/home-stockholm-mobile.json` within ~3min
2. Full run produces up to 30 raw JSONs; individual failures logged but do not abort batch
3. Concurrency cap respected (never more than 6 in-flight observable via verbose log)
4. Polling completes well under 20-min cap for typical WPT response times
5. No `WPT_API_KEY` appears in any output or saved file

## Risk Assessment

| Risk | Mitigation |
|---|---|
| WPT queue spike causes some tests to timeout | Generous 20-min cap; failed tests recorded, batch continues |
| Network blip between submit and poll | Retry submit once with 2s delay before marking failed |
| WPT result JSON shape changes for a field | Phase 03 parser handles missing fields; raw stored regardless |
| Concurrent submissions overwhelm WPT public quota | Cap of 6 stays well under documented public rate limits |
| `fetch` not available | Confirmed Node 24 LTS default — global `fetch` available |

## Security Considerations
- API key passed only in query string to WPT (their endpoint requires it there); never logged
- Raw JSON sanitised — WPT does not echo the API key in result body, but parser verifies no `WPT_API_KEY` substring before persisting

## Next Steps
Phase 03 — parse raw JSON into a typed `RunSummary` for the dashboard renderer.
