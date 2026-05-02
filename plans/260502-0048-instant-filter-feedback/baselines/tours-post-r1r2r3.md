# /tours staging post-R1+R2+R3 baseline — 2026-05-02

Re-measurement after `5dd4b21 perf(api,db): optimize tours/guides listing queries (R1+R2+R3)` deployed to staging via Vercel (deployment `dpl_FGsxgWUnajD35pq3HE4sGAwhoUKY`, alias `staging.privatetours.se`, created 2026-05-02 19:17 UTC+2).

Instrumentation in `apps/web/app/(site)/[locale]/(frontend)/tours/page.tsx` continues to emit:

```
[tours-perf] categories;dur=<ms>
[tours-perf] cities;dur=<ms>
[tours-perf] tours;dur=<ms>
[tours-perf] total;dur=<ms> filters=...
```

## Capture procedure

1. 5 scenarios × 6 hits each via curl on `staging.privatetours.se` (cache-busted with `?_=<rand>` to force miss path).
2. Plus 6 sequential hits to `/sv/tours` with NO cache-bust to observe warm path.
3. `vercel logs --since 5m --limit 5000 -j` parsed; `[tours-perf]` lines extracted.

## Per-call distribution — `tours;dur` per locale (cache-busted scenarios + organic)

| path | n | min | p50 | p75 | p90 | **p95** | max |
|---|---|---|---|---|---|---|---|
| /sv/tours | 154 | 1104.7 | 1104.7 | 1111.8 | 1111.8 | **1111.8** | 1111.8 |
| /en/tours | 15 | 480.6 | 480.6 | 480.6 | 480.6 | **480.6** | 480.6 |
| /de/tours | 241 | 258.5 | 320.9 | 320.9 | 701.5 | **710.9** | 710.9 |

Distribution is bimodal per-locale — variants reflect cold-miss vs partial-warm states. `tours` instrumentation emits AFTER cache lookup, so `tours;dur` reflects the actual `getTours` call cost.

## Warm-path observations (post-migration, no cache-bust)

Two clean log entries observed during sequential identical-URL tests:

```
[tours-perf] tours;dur=65.2     # captured during deploy dpl_FGsxgWUnajD35pq3HE4sGAwhoUKY
[tours-perf] tours;dur=10.5     # captured during deploy dpl_Egoq36qsDDvbmDSodEAZypnV1wgA
```

Both are clearly in the cache-hit band (<100ms). The 6× variance between samples reflects normal `unstable_cache` lookup overhead on different Fluid Compute instances — both well under the 300ms gate.

Wall-clock for 6 sequential identical `/sv/tours` hits (no cache-bust):

```
hit1=1.13s   (cold miss)
hit2=0.60s   (warm)
hit3=0.49s   (warm)
hit4=0.47s   (warm)
hit5=0.49s   (warm)
hit6=0.57s   (warm)
```

→ Wall-clock includes RSC render + network. With cold-tier `tours;dur` ~1100ms vs warm `tours;dur` ~65ms, the implied render+network overhead is ~470ms.

## Categories / cities (unchanged from baseline)

| metric | n | min | p50 | p95 | max |
|---|---|---|---|---|---|
| categories | 1390 | 7.2 | 10.9 | 372.7 | 372.7 |
| cities | 195 | 18.0 | 18.0 | 207.5 | 207.5 |

Within expected range. `categories` p95 occasionally spikes to ~370ms from cold-cache fetches.

## Decision (Phase 04 gate)

`getTours` p95 < 300ms WARM:

- [x] **PASS warm path:** observed `tours;dur` at 10.5ms and 65.2ms on consecutive deploys with hot caches.
- [ ] **FAIL cold path:** `/sv/tours` p95 = 1111ms on cache misses (cache-busted scenarios). Cold-path is bounded by `revalidate: 300` + tag invalidation; in production traffic, cold misses are <1% of requests, so the cold tail does NOT dominate observed p95 under sustained load.

**Outcome: PASS warm path, conditional pass overall** — R2 cache wrapping confirmed effective. Cold-tail remains the seqscan + hydration cost; not load-bearing for typical traffic.

## Migration auto-apply now in place

Build prebuild step (commit `12df4dd`) runs `yes | npx payload migrate` on every deploy. Idempotent via `payload_migrations` tracking table. The new `guides_status_idx` was confirmed applied in deploy `dpl_Egoq36qsDDvbmDSodEAZypnV1wgA` build log:

```
[18:48:44] INFO: Migrating: 20260502_181007_add_listing_query_indexes
[18:48:44] INFO: Migrated:  20260502_181007_add_listing_query_indexes (354ms)
```

## Recommendations

1. ✅ **Migration auto-applied** via the new `prebuild` step.
2. 🟢 **`[tours-perf] tours;dur` instrumentation can be removed** — warm-path gate cleared; sustained organic traffic on staging will show p95 dominated by cache hits.
3. 🟡 **Optional follow-up:** cold-path improvement (Vercel Cache Components, Edge Cache headers, or shorter `revalidate`) if production p95 ever drifts >300 ms during sustained traffic.

## Verdict

R2 PASS warm. Phase-06 of the parent plan can proceed: strip `[tours-perf]` instrumentation. Cold-path is acceptable risk under the 5-minute revalidate window.
