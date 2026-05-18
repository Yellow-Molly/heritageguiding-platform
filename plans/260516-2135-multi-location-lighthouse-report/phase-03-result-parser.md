# Phase 03 — Result Parser (Raw WPT JSON → Typed Summary)

## Context Links
- Parent: [plan.md](./plan.md)
- Depends on: [phase-02-wpt-api-client.md](./phase-02-wpt-api-client.md)
- WPT result schema: https://docs.webpagetest.org/api/reference/result/

## Overview
- **Priority:** P1
- **Status:** not-started
- **Effort:** 45m-1h

Transform raw WPT result JSON (free-form, large, deeply nested) into a small typed `RunSummary` consumable by the HTML renderer (Phase 04) and the diff engine (Phase 05). The shape becomes the **stable contract** between data and presentation — pin it down here.

## Key Insights
- WPT median run lives at `data.median.firstView` (first-view = uncached, what we want)
- Lighthouse JSON lives at `data.lighthouse` when `lighthouse=1` was sent — categories under `data.lighthouse.categories.{performance|accessibility|best-practices|seo}.score` (0–1 fractional)
- Accessibility audits under `data.lighthouse.audits` — filter `score < 1` to surface failures
- CWV fields on `firstView`: `TTFB`, `firstContentfulPaint`, `LargestContentfulPaint`, `TotalBlockingTime`, `CumulativeLayoutShift`, `SpeedIndex`
- All numeric values may be missing if a test errored mid-run; parser must tolerate `undefined`

## Requirements

### Functional
- `parseWptResult(submission, raw)` → returns one `RunSummary` entry
- `buildSummaryJson(results)` → returns top-level `SummaryFile` with metadata + per-run array
- Failed submissions become `RunSummary` with `status: 'failed'` and `error` populated; all metrics `null`
- Accessibility failures captured as `Array<{ id, title, description, severity, failingNodes }>` per run; later deduped per page in renderer

### Non-functional
- Pure functions, no IO (except where orchestrator writes the final `summary.json`)
- Defensive: every field access guarded
- Schema documented inline as JSDoc — the contract for downstream phases

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
  severity: 'error' | 'warning' | 'info'   // derived from score + audit weight
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
  wptReportUrl: string | null            // human-readable WPT page
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
SubmissionResult[] ──▶ parseWptResult(each) ──▶ RunSummary
                                                   ▼
                                            buildSummaryJson()
                                                   ▼
                                              SummaryFile
                                                   ▼
                                       perf/<run-dir>/summary.json
```

## Related Code Files

**Create:**
- `scripts/lib/wpt-result-parser.ts` (~120 LOC)

**Update:**
- `scripts/lighthouse-multi-location.ts` — after `runAll`, call parser, write `summary.json` before passing to renderer

**Read for context:**
- `scripts/lib/wpt-config.ts` (resolves labels)

## Implementation Steps

1. Define types listed in **Data Schema** section
2. Implement `parseWptResult(submission, rawResult)`:
   - Extract `data.median.firstView` for CWV — guard each numeric field
   - Extract `data.lighthouse.categories.<id>.score` and multiply by 100 (round to int)
   - Extract failing a11y audits: filter `score !== null && score < 1` under `data.lighthouse.audits`
   - Severity heuristic: `score === 0` → error, `0 < score < 1` → warning
   - Failing nodes: count `details.items?.length ?? 0`
   - Build WPT report URL from testId: `https://www.webpagetest.org/result/<testId>/`
3. Implement helper `safeNumber(value)` — returns `null` if not finite number
4. Implement `buildSummaryJson(submissionResults, { startedAt, finishedAt })`:
   - Resolve `gitSha` from `process.env.VERCEL_GIT_COMMIT_SHA` || `git rev-parse HEAD` (graceful fail → null)
   - Iterate, parse each, count success/failed
   - Return `SummaryFile`
5. Wire orchestrator to call parser + `fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2))`
6. Unit-style smoke: copy one raw JSON from a Phase 02 smoke run, run a tiny test harness inline that asserts non-null `scores.performance` and at least one `a11yAudits` entry (a11y always has some sub-100 audit in practice)

## Todo List

- [ ] Define all `RunSummary` + `SummaryFile` interfaces in `wpt-result-parser.ts`
- [ ] Implement `parseWptResult(submission, raw)` with defensive guards
- [ ] Implement `buildSummaryJson(results, timing)` including git SHA resolution
- [ ] Add `safeNumber` helper
- [ ] Wire orchestrator to write `summary.json`
- [ ] Smoke check on one real raw JSON

## Success Criteria

1. `summary.json` is valid JSON, schema matches `SummaryFile`
2. For successful runs, all four Lighthouse scores are integers 0–100 (or null if WPT genuinely omitted)
3. CWV numbers are non-negative integers (ms) / floats (cls)
4. Failed submissions appear in `runs` with `status: 'failed'`, `error` populated, all metrics `null`
5. Parser does not throw on a malformed/partial raw input — returns failed entry instead
6. Git SHA resolved when available, otherwise `null` (no crash on missing git)

## Risk Assessment

| Risk | Mitigation |
|---|---|
| WPT result missing `lighthouse` block (older test, wrong flag) | All score fields → null; downstream renderer shows "—" |
| Audit `details.items` is undefined / non-array | `?? 0`; never crash |
| `git rev-parse` fails (e.g. CI without git) | try/catch → null |
| Number precision (CLS as 0.123456789…) | Round CLS to 3 dp; ms to int |

## Security Considerations
- No secrets in raw result body — parser does no scrubbing
- `wptReportUrl` is public anyway (anyone with the testId can view); fine to persist

## Next Steps
Phase 04 — HTML renderer consumes `SummaryFile`.
