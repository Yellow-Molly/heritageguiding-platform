# /guides staging baseline — 2026-05-02

Instrumentation in `apps/web/app/(site)/[locale]/(frontend)/guides/page.tsx` emits per-call timings to server logs:

```
[guides-perf] guides;dur=<ms>
[guides-perf] filterOptions;dur=<ms>
[guides-perf] total;dur=<ms> filters=...
```

## Capture procedure

1. Deploy branch to staging
2. Open `/guides`, run 5 scenarios (no filter / language / specialization / area / search query)
3. Warm-cache pass once, then capture 5 samples per scenario
4. Record p50/p95 below
5. Apply decision rule at bottom

## Samples

| # | Scenario | guides (ms) | filterOptions (ms) | total (ms) |
|---|----------|-------------|--------------------|------------|
| 1 | No filter | _pending_ | | |
| 2 | Language | _pending_ | | |
| 3 | Specialization | _pending_ | | |
| 4 | Area | _pending_ | | |
| 5 | Search | _pending_ | | |

## p50 / p95

| metric | p50 | p95 |
|--------|-----|-----|
| guides | _pending_ | |
| filterOptions | _pending_ | |
| total | _pending_ | |

## Decision (apply Phase 01 rule from plan.md)

- [ ] guides p95 < 300ms → ship perception fix only
- [ ] 300–800ms → ship + open follow-up issue
- [ ] > 800ms → block ship; optimize first

**Outcome:** _pending — populate after staging capture._
