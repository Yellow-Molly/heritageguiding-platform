# Phase 05 — Diff vs Previous Run

## Context Links
- Parent: [plan.md](./plan.md)
- Depends on: [phase-03-result-parser.md](./phase-03-result-parser.md), [phase-04-html-report-renderer.md](./phase-04-html-report-renderer.md)
- Thresholds defined in: [phase-01-scaffolding-config-env.md](./phase-01-scaffolding-config-env.md) (`DIFF_THRESHOLDS`)

## Overview
- **Priority:** P1
- **Status:** not-started
- **Effort:** 30-45m

Add the "compare to previous run" overlay on top of the renderer. Locate the latest sibling `perf/multi-location-*` directory, load its `summary.json`, compute per-metric deltas, render arrows + signed values inline next to current values. Highlight when delta exceeds threshold.

## Key Insights
- Previous run = immediately preceding sibling directory by name sort (since names are `multi-location-{YYMMDD-HHmm}`, lexicographic = chronological)
- Skip diff cleanly when no previous run exists; never error
- Direction convention: scores ↑ is good (green), CWV metrics ↓ is good (green except CLS)
- Threshold-exceeded deltas get bold + arrow icon; sub-threshold deltas shown muted small text

## Requirements

### Functional
- `findPreviousSummary(currentDir, perfRoot)` → `SummaryFile | null`
- `computeDelta(current, previous, metric, direction)` → `{ raw: number | null, exceedsThreshold: boolean, isImprovement: boolean | null }`
- `renderDelta(delta, formatType)` → small HTML span with arrow + signed value
- Renderer integration: scores grid + CWV table cells get optional second-line delta
- CLI flag `--no-diff` to skip overlay even when previous exists (useful for clean baseline rebuild)
- First-run auto-skip: no previous → log "first run, no diff" and proceed

### Non-functional
- Pure functions, deterministic
- No new files larger than ~100 LOC

## Architecture

```
orchestrator
   │
   ├─▶ findPreviousSummary(currentDir, 'perf/')
   │        │
   │        ▼
   │   read sibling summary.json or return null
   │
   ├─▶ renderReport(currentSummary, previousSummary)
   │        │
   │        ▼
   │   report-builder calls report-diff helpers per-metric
   │
   ▼
write index.html
```

## Related Code Files

**Create:**
- `scripts/lib/report-diff.ts` (~100 LOC)

**Update:**
- `scripts/lighthouse-multi-location.ts` — load previous (respecting `--no-diff`), pass to renderer
- `scripts/lib/report-builder.ts` — accept `previousSummary?`, lookup matching previous run by `(pageId, locationId, formFactor)` tuple, call `renderDelta` per metric cell
- `scripts/lib/report-template.ts` — add `renderDelta` atom helper

## Implementation Steps

1. Implement `findPreviousSummary(currentRunDir, perfRoot = 'perf/')`:
   - List `perf/multi-location-*` dirs
   - Sort lex desc
   - Pick first that is not the current run
   - Read its `summary.json`; return parsed `SummaryFile` or null on any error
2. Implement `findMatchingRun(runs, target)` — finds entry by `(pageId, locationId, formFactor)`
3. Implement `computeDelta(currentVal, previousVal, metricKind)`:
   - `metricKind ∈ { 'score' | 'cwv-lower-better' | 'cwv-cls' }`
   - If either value null → return `{ raw: null, ... }`
   - `raw = current - previous`
   - `isImprovement`: scores → raw > 0; lower-better → raw < 0; CLS → raw < 0
   - `exceedsThreshold`: compare `|raw|` to corresponding `DIFF_THRESHOLDS` entry
4. Implement `renderDelta(delta, formatType)`:
   - Returns HTML span: `"↑5"` / `"↓120 ms"` / `"−0.03"` etc.
   - Class: `delta-up`, `delta-down`, `delta-flat`; bold when `exceedsThreshold`
5. Wire renderer:
   - In scores grid cells: if previous has matching run, append `renderDelta` span
   - In CWV table cells: same
6. Wire orchestrator: load previous summary unless `--no-diff`; log path of comparison source
7. Add CSS for `.delta-up.improve`, `.delta-down.improve`, `.delta-up.regress`, `.delta-down.regress` (green vs red regardless of direction)
8. Smoke test:
   - Take two summary.json files (one synthetic if no real history) and verify deltas render correctly in both directions

## Todo List

- [ ] Implement `findPreviousSummary` with safe fallback
- [ ] Implement `findMatchingRun` matcher
- [ ] Implement `computeDelta` with three metric kinds
- [ ] Implement `renderDelta` template helper
- [ ] Wire `report-builder` to call delta helpers per cell
- [ ] Wire orchestrator: `--no-diff` flag, auto-skip on first run
- [ ] Add CSS classes for improvement/regression delta colours
- [ ] Smoke test with two synthetic summaries

## Success Criteria

1. First run (no previous): dashboard renders cleanly, no errors, log says "first run, no diff"
2. Second run (previous exists): every metric cell shows current value + delta span when both values exist
3. Improvement deltas render green; regressions render red; sub-threshold deltas muted
4. `--no-diff` flag forces skip even when previous exists
5. Mismatched runs (e.g. previous didn't include `tour-details` mobile) render current only, no broken layout
6. CLS direction handled correctly (lower CLS = improvement)

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Previous summary schema differs from current (older code) | Parser is forgiving; missing fields → null → no delta rendered |
| Wrong run picked as "previous" (e.g. an aborted/empty run) | Filter previous summaries with `successful === 0` → skip |
| Visual noise from many small sub-threshold deltas | Muted styling + small font; user can grep `bold delta` in HTML for highlights |
| Time-zone differences in folder names | Use UTC for folder timestamp; doc note in plan |

## Security Considerations
- Reads only files under repo's `perf/` directory; no path traversal opportunity beyond config

## Next Steps
Phase 06 — first end-to-end run, commit baseline, document workflow.
