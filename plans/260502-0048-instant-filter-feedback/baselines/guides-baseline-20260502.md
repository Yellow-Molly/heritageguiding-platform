# /guides staging baseline — 2026-05-02

Instrumentation in `apps/web/app/(site)/[locale]/(frontend)/guides/page.tsx` emits per-call timings to server logs:

```
[guides-perf] guides;dur=<ms>
[guides-perf] filterOptions;dur=<ms>
[guides-perf] total;dur=<ms> filters=...
```

## Capture procedure (executed)

1. Deployed `master @ f3a136a` to staging via Vercel (alias `staging.privatetours.se` → `dpl_GtFJGwZyCcXDR7KzSVaD27ZF1DFX`)
2. Generated 5 scenarios × 6 hits each (1 warm + 5 samples) via curl with cache-bust query
3. Pulled function logs via `vercel logs --since 30m --limit 2000 -j` → 2000 events in ~80s window
4. Parsed `[guides-perf]` lines into per-metric distributions

## Per-call distribution (all scenarios merged)

Source: 80-second window, all 30 test invocations + organic background traffic on `/en/guides`.

| metric | n | min | p50 | p75 | p90 | **p95** | p99 | max |
|---|---|---|---|---|---|---|---|---|
| guides | 1111 | 231 | 583 | 584 | 692 | **695** | 701 | 701 |
| filterOptions | 89 | 689 | 803 | 804 | 810 | **821** | 821 | 821 |

> **Note on sample skew:** Same truncation effect as the tours baseline — `total;dur` logs after the slowest of the two parallel calls (~820ms+) and was cut off by the 2000-event log limit. `filterOptions` is also under-represented for the same reason.

## Per-scenario totals

The `[guides-perf] total;dur=… filters=…` line did not survive log truncation. Per-scenario decomposition deferred to a structured capture (Server-Timing or longer log window).

## Decision (Phase 01 rule from plan.md)

Page-render is gated by the slowest of the two parallel fetches: `max(guides, filterOptions) ≈ filterOptions p95 821ms`.

Against `guides;dur` (the listing query):
- [ ] guides p95 < 300ms → ship perception fix only
- [x] **300–800ms → ship + open follow-up issue** (`guides` p95 695ms)

Against `filterOptions;dur` (page-render gate):
- [ ] filterOptions p95 < 300ms
- [ ] 300–800ms
- [x] **> 800ms → block ship; optimize first** (`filterOptions` p95 821ms — just over)

**Outcome: BLOCK band on `filterOptions`, SHIP+FOLLOW-UP on `guides`.**

`getGuideFilterOptions` p95 821ms is **just barely** over the 800ms threshold and is bizarrely flat (min 689ms, p99 821ms — only ~130ms spread). That shape is consistent with a fixed-cost query (full scan, COUNT DISTINCT, or aggregation) rather than dataset growth. Strong candidate for a single index or materialized view fix.

`getGuides` p95 695ms is in ship+follow-up band — perception fix masks it well in the short term, but it should be optimized.

### Recommendation

1. Open follow-up issue: **`perf(api): optimize getGuideFilterOptions — flat 800ms staging baseline (>800ms gate)`**
2. Open follow-up issue: **`perf(api): optimize getGuides — staging p95 695ms`**
3. Keep `[guides-perf]` instrumentation until both follow-ups ship; defer Phase 06 cleanup for guides
4. Re-capture after optimization before stripping instrumentation
