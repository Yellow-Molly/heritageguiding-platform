# Phase 03 — Result Fetcher + Parser

## Context Links
- Parent: [plan.md](./plan.md)
- Depends on: [phase-02-wpt-browser-submitter.md](./phase-02-wpt-browser-submitter.md)
- Replaces predecessor's: `plans/260516-2135-multi-location-lighthouse-report/phase-03-result-parser.md` (merged fetcher + parser; fetch path now public)
- WPT result schema: https://docs.webpagetest.org/api/reference/result/

## Overview
- **Priority:** P1
- **Status:** not-started
- **Effort:** 1-1.5h

Poll the **public** `jsonResult.php?test={id}` endpoint for each captured testId until the test completes, then parse raw WPT JSON into a typed `RunSummary` consumable by the HTML renderer (Phase 04) and the diff engine (Phase 05). Public endpoint requires no auth — verified 2026-05-17 (`jsonResult.php?test=fake` returns 404, not 401/403; meaning endpoint is reachable, just returns 404 for unknown IDs).

The `RunSummary` shape is the **stable contract** between data and presentation — pin it down here.

## Key Insights
- Poll endpoint: `GET https://www.webpagetest.org/jsonResult.php?test=<id>` returns JSON with top-level `statusCode`:
  - `100` / `101` = waiting / running
  - `200` = complete
  - `4xx` = failed
- When `statusCode === 200`, `data.median.firstView` holds CWV; `data.lighthouse.categories` holds Lighthouse scores
- Lighthouse JSON lives at `data.lighthouse` when the submitter requested Lighthouse — Phase 02 enables this; verify shape in smoke
- Accessibility audits under `data.lighthouse.audits` — filter `score < 1` to surface failures
- CWV fields on `firstView`: `TTFB`, `firstContentfulPaint`, `LargestContentfulPaint`, `TotalBlockingTime`, `CumulativeLayoutShift`, `SpeedIndex`
- Starter-tier result schema may differ subtly from historical Pro samples; parser is forgiving (`?? null` everywhere)
- Raw JSON sometimes large (1-5 MB per test); persist as-is for diff re-rendering without re-fetching

## Requirements

### Functional
- `pollAndFetch(testId, opts)` → resolves with raw result JSON when `statusCode === 200`; rejects on terminal failure or `POLL_MAX_MS` timeout
- `fetchAll(submissionRecords, runDir, opts)` → orchestrates parallel polling (concurrency cap, separate from submitter cap), writes each raw JSON to `runDir/raw/{page}-{location}-{form-factor}.json`, returns `FetchResult[]`
- `parseWptResult(submission, raw)` → returns one `RunSummary` entry
- `buildSummaryJson(fetchResults, timing)` → returns top-level `SummaryFile`
- Failed fetches become `RunSummary` with `status:'failed'`, `error` populated, all metrics `null`
- A11y failures captured as `Array<{ id, title, description, severity, failingNodes }>` per run; deduped per page in renderer (Phase 04)

### Non-functional
- Pure functions in parser; fetcher does IO (network + disk write)
- Defensive: every field access guarded with `??` / optional chaining
- Schema documented inline as JSDoc — contract for Phases 04-05
- Polling: 15s interval, exponential backoff to 60s, total cap 20 min per test
- Fetcher concurrency: 6 simultaneous polls (lightweight — GET requests, not browser contexts)

## Data Schema

```ts
export interface LighthouseScores {
  performance: number | null      // 0–100 (multiplied from WPT 0–1)
  accessibility: number | null
  bestPractices: number | null
  seo: number | null
}

export interface CoreWebVitals {
  ttfbMs: number | null
  fcpMs: number | null
  lcpMs: number | null
  tbtMs: number | null
  cls: number | null
  speedIndexMs: number | null
}

export interface A11yAudit {
  id: string
  title: string
  description: string
  severity: 'error' | 'warning' | 'info'   // derived from score
  failingNodes: number
}

export interface RunSummary {
  pageId: PageId
  pageLabel: string
  pageUrl: string
  locationId: LocationId
  locationLabel: string
  formFactor: FormFactor
  wptTestId: string | null
  wptReportUrl: string | null            // human-readable WPT result page
  status: 'success' | 'failed'
  error: string | null
  scores: LighthouseScores
  cwv: CoreWebVitals
  a11yAudits: A11yAudit[]               // failed audits only (score < 1)
}

export interface SummaryFile {
  generatedAt: string                   // ISO timestamp
  gitSha: string | null
  targetEnv: 'staging'
  totalSubmissions: number
  successful: number
  failed: number
  durationMs: number
  runs: RunSummary[]
}
```

## Architecture

```
SubmissionRecord[] (from Phase 02)
        │
        ▼
   fetchAll(records, runDir)
   ├─▶ p-limit(6) ── pollAndFetch(testId)
   │       │   GET jsonResult.php?test=<id>
   │       │   while statusCode in {100,101}: wait+backoff
   │       │   when statusCode === 200 → return data
   │       │   on 4xx / timeout → throw
   │       │
   │       └─▶ write runDir/raw/{slug}.json
   │
   └─▶ FetchResult[]  (raw + record + status)
                │
                ▼
        parseWptResult per entry
                │
                ▼
        buildSummaryJson(results, timing)
                │
                ▼
        runDir/summary.json
```

## Related Code Files

**Create:**
- `scripts/lib/wpt-result-fetcher.ts` (~80 LOC)
- `scripts/lib/wpt-result-parser.ts` (~120 LOC)

**Update:**
- `scripts/lighthouse-multi-location.ts` — after `submitAll` (or `--collect-only`), call `fetchAll(records, runDir)` → `parseWptResult` per entry → `buildSummaryJson` → write `summary.json`

**Read for context:**
- `scripts/lib/wpt-config.ts` (resolves labels, supplies `WPT_JSON_RESULT_URL`, poll constants)
- `scripts/lib/wpt-submitter-browser.ts` (SubmissionRecord type)

## Implementation Steps

1. **Fetcher** — `wpt-result-fetcher.ts`:
   - `pollAndFetch(testId, { intervalMs, maxMs, onTick })`:
     ```ts
     const start = Date.now()
     let backoff = intervalMs
     while (Date.now() - start < maxMs) {
       const res = await fetch(`${WPT_JSON_RESULT_URL}?test=${testId}`)
       if (!res.ok) throw new Error(`HTTP ${res.status} for ${testId}`)
       const json = await res.json() as { statusCode: number, statusText?: string, data?: unknown }
       onTick?.(json.statusCode, json.statusText)
       if (json.statusCode === 200) return json.data
       if (json.statusCode >= 400) throw new Error(`WPT failed ${json.statusCode}: ${json.statusText ?? 'unknown'}`)
       await sleep(backoff)
       backoff = Math.min(backoff * 1.5, 60_000)
     }
     throw new Error(`Timeout after ${maxMs}ms for ${testId}`)
     ```
   - `fetchAll(records, runDir, opts)`:
     - Bounded concurrency 6 (semaphore via in-flight promise array, `Promise.race` when at cap)
     - For each `record.status === 'submitted'`:
       - Try `pollAndFetch(record.testId)` → on success, `fs.writeFileSync(runDir/raw/<slug>.json, JSON.stringify(data))`, push `{ record, raw, status: 'success' }`
       - On failure, push `{ record, raw: null, status: 'failed', error: e.message }`
     - For each `record.status === 'failed'` (from Phase 02): pass through as `{ record, raw: null, status: 'failed', error: record.error }`
     - Verbose: log `[N/M] ✓/✗ <slug> testId=<id> (Xs)` per completion
   - Helper: `slugFor(submission)` → `<pageId>-<locationId>-<formFactor>`
2. **Parser** — `wpt-result-parser.ts`:
   - Define types listed in **Data Schema** section
   - Implement `parseWptResult(submission, rawResult)`:
     - Extract `rawResult?.median?.firstView` for CWV — guard each numeric field
     - Extract `rawResult?.lighthouse?.categories?.<id>?.score` and multiply by 100 (round to int)
     - Extract failing a11y audits: filter `audits` where `score !== null && score < 1`
     - Severity heuristic: `score === 0` → `error`, `0 < score < 0.5` → `warning`, else `info`
     - Failing nodes: count `details?.items?.length ?? 0`
     - Build WPT report URL from testId: `WPT_RESULT_PAGE_URL(testId)`
   - Implement helper `safeNumber(value)` — returns `null` if not finite number
   - Implement `buildSummaryJson(fetchResults, { startedAt, finishedAt })`:
     - Resolve `gitSha` from `process.env.VERCEL_GIT_COMMIT_SHA` || shelling `git rev-parse HEAD` (graceful → null)
     - Iterate, parse each, count success/failed
     - Return `SummaryFile`
3. Wire orchestrator (`scripts/lighthouse-multi-location.ts`):
   - After `submitAll` (or load via `--collect-only`):
     - `mkdir runDir/raw`
     - `const fetchResults = await fetchAll(records, runDir, { verbose })`
     - `const summary = buildSummaryJson(fetchResults, { startedAt, finishedAt: new Date().toISOString() })`
     - `fs.writeFileSync(runDir/summary.json, JSON.stringify(summary, null, 2))`
4. Smoke validation:
   - After Phase 02 smoke produced `submissions.json` with 1 testId, run `npx tsx scripts/lighthouse-multi-location.ts --collect-only <runDir> --verbose`
   - Expected: 1 raw JSON written, summary.json shows `successful: 1`, parser extracted Lighthouse perf score + LCP
   - Validate Starter-tier shape matches expectations; flag discrepancies

## Todo List

- [ ] Implement `pollAndFetch(testId, opts)` with exponential backoff and timeout
- [ ] Implement `fetchAll(records, runDir, opts)` with bounded concurrency 6
- [ ] Implement `slugFor(submission)` helper (shared with Phase 02 if useful)
- [ ] Write raw JSON to `runDir/raw/<slug>.json` immediately on success (durability)
- [ ] Define `RunSummary` + `SummaryFile` + sub-types in `wpt-result-parser.ts`
- [ ] Implement `parseWptResult(submission, raw)` with defensive guards
- [ ] Implement `buildSummaryJson(results, timing)` including git SHA resolution
- [ ] Add `safeNumber` helper
- [ ] Wire orchestrator to call fetcher + parser, write `summary.json`
- [ ] Smoke validation: `--collect-only` produces valid summary.json from Phase 02 smoke testId
- [ ] Document Starter-tier schema differences (if any) inline

## Success Criteria

1. `pollAndFetch` resolves within 20-min cap for typical WPT response times
2. Failed individual tests do not abort batch; recorded as `status:'failed'` in `FetchResult`
3. Raw JSON written to `runDir/raw/<slug>.json` for every successful fetch (durability for re-render)
4. `summary.json` is valid JSON, schema matches `SummaryFile`
5. For successful runs, all four Lighthouse scores are integers 0–100 (or `null` if WPT omitted)
6. CWV numbers are non-negative integers (ms) / float (cls, rounded to 3dp)
7. Failed entries appear in `runs` with `status:'failed'`, `error` populated, all metrics `null`
8. Parser does not throw on malformed/partial raw input — returns failed entry instead
9. Git SHA resolved when available, otherwise `null`

## Risk Assessment

| Risk | Mitigation |
|---|---|
| `jsonResult.php` requires auth in future (Catchpoint policy change) | Detect 401/403 in `pollAndFetch` → fallback: scrape `WPT_RESULT_PAGE_URL(testId)` HTML for embedded JSON (`document.getElementById('runtest_data')`) |
| WPT result missing `lighthouse` block (Starter omits?) | All score fields → null; downstream renderer shows "—"; flag in plan validation if reproducible |
| Test still queued after 20 min cap | Record as failed with helpful "still queued" message; user can re-fetch later via `--collect-only` (testId persists in `submissions.json`) |
| Audit `details.items` is undefined / non-array | `?? 0`; never crash |
| `git rev-parse` fails | try/catch → null |
| Raw JSON >5 MB writes slow disk | Single sync write per file; 30 files × 5 MB = 150 MB acceptable; consider gzip in follow-up if it becomes problem |
| Number precision (CLS as 0.123456789…) | Round CLS to 3 dp; ms to int |

## Security Considerations
- No secrets in raw result body — parser does no scrubbing
- `wptReportUrl` is public (anyone with the testId can view); fine to persist
- `submissions.json` + raw JSON contain no credentials

## Next Steps
Phase 04 — HTML renderer consumes `SummaryFile`.
