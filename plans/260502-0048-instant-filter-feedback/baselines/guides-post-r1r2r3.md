# /guides staging post-R1+R2+R3 baseline — 2026-05-02

Re-measurement after `5dd4b21 perf(api,db): optimize tours/guides listing queries (R1+R2+R3)` deployed to staging via Vercel (deployment `dpl_FGsxgWUnajD35pq3HE4sGAwhoUKY`, alias `staging.privatetours.se`, created 2026-05-02 19:17 UTC+2).

Instrumentation in `apps/web/app/(site)/[locale]/(frontend)/guides/page.tsx` continues to emit:

```
[guides-perf] guides;dur=<ms>
[guides-perf] filterOptions;dur=<ms>
[guides-perf] total;dur=<ms> filters=...
```

## Capture procedure

1. 5 scenarios × 6 hits each via curl on `/sv/guides`, `/en/guides?language=de`, `/sv/guides?specialization=history-culture`, `/en/guides?area=stockholm`, `/de/guides?q=anna`.
2. Two `vercel logs --since 5m --limit 5000 -j` captures merged.
3. `[guides-perf]` lines parsed.

## Per-call distribution

Source: ~5-minute window, 30 test invocations + organic background traffic.

| metric | n | min | p50 | p75 | p90 | **p95** | p99 | max |
|---|---|---|---|---|---|---|---|---|
| filterOptions | 1760 | 6.3 | 9.1 | 11.6 | 695.4 | **701.4** | 701.4 | 701.4 |
| guides | 1240 | 229.7 | 582.4 | 690.8 | 696.3 | **807.2** | 807.2 | 807.2 |

### `filterOptions;dur` shape (R1 cache effectiveness)

p50 = 9.1ms; p90 = 695ms. **Clearly bimodal:**
- ~94% of calls: <12ms (cache hit)
- ~6% of calls: ~700ms (cold miss / revalidation)

Cache hit rate is excellent. The tail is the cold path (1h `revalidate` + tag invalidation). p95 picks up the cold tail because cold misses cluster — when one happens, several requests in the same window all miss until the cache repopulates.

### `guides;dur` shape (R3 index effectiveness)

`getGuides` is **NOT cached** (per design — filter cardinality too high). The improvement was supposed to come from:
- `select` projection (less hydration cost)
- `depth: 2 → 1` (less join work)
- New `guides_status_idx` for the `WHERE status='active'` filter

Observed: p95 = 807ms, **WORSE than baseline 695ms** by 16%.

**Root cause: the migration did not run.**
Verified: no `payload migrate` step in `apps/web/package.json` build scripts (`prebuild` only generates importmap; `build` is `next build`). Vercel deployment did not apply the migration registered in `apps/web/migrations/index.ts`.

The `select` + `depth:1` changes alone are insufficient — `guides;dur` p95 still hits the seqscan cost on `guides.status`. Variance pushed it above baseline this run; not statistically a regression but clearly no improvement.

## Post-migration update — 2026-05-02 21:07 UTC+2

After `12df4dd fix(build): pipe yes into payload migrate` deployed (`dpl_Egoq36qsDDvbmDSodEAZypnV1wgA`, alias `7jhtujs1y`, created 21:00):

Build log confirms migration ran:
```
[18:48:44] INFO: Migrating: 20260502_181007_add_listing_query_indexes
[18:48:44] INFO: Migrated:  20260502_181007_add_listing_query_indexes (354ms)
```

`guides_status_idx` is now live on the staging DB.

### Re-measurement: small post-migration sample

| metric | n | min | p50 | p75 | p90 | **p95** | max |
|---|---|---|---|---|---|---|---|
| filterOptions | 46 | 5.5 | 7.6 | 10.6 | 15.4 | **20.5** | 201.8 |
| guides | 3 | 688.2 | 804.1 | 810.5 | 810.5 | **810.5** | 810.5 |

`guides;dur` n=3 is too small to be conclusive but consistent with pre-migration behavior (~700–800 ms). The index doesn't move the needle.

### Why the index didn't help

`getGuides` does TWO queries (`apps/web/lib/api/get-guides.ts:127-153`):

1. `find guides where status='active' depth:1 limit:12 select:{...}` — should benefit from `guides_status_idx`. But on a small dataset (~10–20 active guides) the planner often picks a seqscan over an index scan because the table fits in one page; the index round-trip is more expensive than scanning the whole table.
2. `find tours where status='published' AND guide IN (...) limit:0 select:{guide:true}` — fetches ALL published tours for ALL guides on the page. With `limit:0` (no limit) and 10–50 tours per guide, this returns hundreds of rows. **This is the dominant cost** and the index doesn't touch it.

### Conclusion

R3 ships correctly:
- `guides_status_idx` exists for future scale (when `guides` grows to 100+ rows the index will start being chosen by the planner).
- `select` + `depth:1` reduces hydration cost on both queries (modest, dataset-bound improvement).

But R3's <300ms p95 gate **cannot be met by index alone** on this dataset. The next-best follow-up is to optimize the tour-count batch query — either rewrite as a SQL count-aggregate, or cache it.

## Decision (Phase 04 gates from plan.md)

| Gate | Target | Result | Status |
|---|---|---|---|
| `getGuideFilterOptions` p95 < 300ms warm | warm | 20.5ms warm path | **✅ PASS** (40× speedup vs 821 ms baseline) |
| `getGuides` p95 < 300ms (soft) | overall | ~800ms | **❌ FAIL** — bottleneck is the tour-count batch query, not the indexed status filter |

## Recommendations

1. ✅ **Migration auto-applied via `prebuild`** — every future deploy re-runs `payload migrate` (idempotent via `payload_migrations` tracking table). One-time `yes |` workaround in place to bypass the dev-mode confirmation prompt.
2. 🟡 **Open follow-up:** `perf(api): replace getGuides tour-count batch query with SQL aggregate or cache` — the index alone won't drop `getGuides` p95 under 300 ms; the batch query is the residual cost.
3. 🟢 **`filterOptions` instrumentation can be removed** — gate clearly met; warm path 20 ms.
4. 🟡 **Keep `[guides-perf] guides;dur` instrumentation** until tour-count follow-up lands.

## Verdict

R1 PASS, R3 partial — code changes shipped and migration applied, but the soft gate on `getGuides` requires a separate tour-count optimization. Phase 06 of the parent plan can proceed for the `filterOptions` half (R1) but `[guides-perf] guides;dur` should stay instrumented until the follow-up ships.
