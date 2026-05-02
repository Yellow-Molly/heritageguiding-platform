# /tours staging baseline — 2026-05-02

Instrumentation in `apps/web/app/(site)/[locale]/(frontend)/tours/page.tsx` emits per-call timings to server logs:

```
[tours-perf] categories;dur=<ms>
[tours-perf] cities;dur=<ms>
[tours-perf] tours;dur=<ms>
[tours-perf] total;dur=<ms> filters=...
```

## Capture procedure (executed)

1. Deployed `master @ f3a136a` to staging via Vercel (alias `staging.privatetours.se` → `dpl_GtFJGwZyCcXDR7KzSVaD27ZF1DFX`)
2. Generated 5 scenarios × 6 hits each (1 warm + 5 samples) via curl (cache-busted with `?_=<rand>` to avoid edge-cache reuse)
3. Pulled function logs via `vercel logs --since 30m --limit 2000 -j` → 2000 events covering ~80s window
4. Parsed `[tours-perf]` lines into per-metric distributions

## Per-call distribution (all scenarios merged)

Source: 80-second window, all 30 test invocations + organic background traffic.

| metric | n | min | p50 | p75 | p90 | **p95** | p99 | max |
|---|---|---|---|---|---|---|---|---|
| categories | 649 | 6 | 6 | 6 | 15 | **18** | 18 | 18 |
| cities | 114 | 6 | 6 | 6 | 6 | **6** | 6 | 6 |
| tours | 37 | 1280 | 1284 | 1322 | 1396 | **1396** | 1396 | 1396 |

> **Note on sample skew:** Vercel's `--limit 2000` returns most-recent events. Because `[total;dur=...]` logs ~1.3s after request start, the `total` line was truncated out of the window for the test traffic. `tours;dur` n=37 reflects only the fastest tail of slow events — true p95 is ≥ 1396ms. Categories/cities are over-represented because they log first and survive truncation.

## Per-scenario totals

The `[tours-perf] total;dur=… filters=…` line did not survive log truncation (logs after ~1.3s, beyond the 2000-event window for organic-busy `/en/guides`). Per-scenario breakdown deferred to a future capture run with longer log windows or redirected to Vercel's structured Server-Timing pipeline.

## Decision (Phase 01 rule from plan.md)

Threshold based on `tours;dur` p95 (the dominant query):

- [ ] tours p95 < 300ms → ship perception fix only
- [ ] 300–800ms → ship + open follow-up issue
- [x] **> 800ms → block ship; optimize first**

**Outcome: tours p95 ≈ 1396ms — `getTours` is the dominant bottleneck.**

The perception fix is already shipped to staging, so "block" reads as: **must ship a follow-up `getTours` query optimization before this is acceptable on production**. Categories/cities are negligible (<20ms p95). Optimization should target the tours collection query itself — likely indexes, eager-loaded relations, or pagination of the count query.

### Recommendation

1. Open follow-up issue: **`perf(api): optimize getTours query — staging p95 1.4s`**
2. Keep `[tours-perf]` instrumentation in place until the optimization ships (defer Phase 06 cleanup for tours)
3. After optimization, re-capture this baseline before removing instrumentation
