# /tours staging baseline — 2026-05-02

Instrumentation in `apps/web/app/(site)/[locale]/(frontend)/tours/page.tsx` emits per-call timings to server logs:

```
[tours-perf] categories;dur=<ms>
[tours-perf] cities;dur=<ms>
[tours-perf] tours;dur=<ms>
[tours-perf] total;dur=<ms> filters=...
```

## Capture procedure

1. Deploy branch to staging
2. Open `/tours`, run 5 scenarios, do 1 warm-cache pass first then capture 5 samples per scenario
3. Pull samples from Vercel Functions logs (filter by `tours-perf`)
4. Record p50/p95 below
5. Apply decision rule at bottom

## Samples

| # | Scenario | categories (ms) | cities (ms) | tours (ms) | total (ms) |
|---|----------|-----------------|-------------|------------|------------|
| 1 | No filter | _pending_ | | | |
| 2 | Single category | _pending_ | | | |
| 3 | Multi-category | _pending_ | | | |
| 4 | Search query | _pending_ | | | |
| 5 | Multi-filter | _pending_ | | | |

## p50 / p95

| metric | p50 | p95 |
|--------|-----|-----|
| categories | _pending_ | |
| cities | _pending_ | |
| tours | _pending_ | |
| total | _pending_ | |

## Decision (apply Phase 01 rule from plan.md)

- [ ] tours p95 < 300ms → ship perception fix only
- [ ] 300–800ms → ship + open follow-up issue
- [ ] > 800ms → block ship; optimize first

**Outcome:** _pending — populate after staging capture._
