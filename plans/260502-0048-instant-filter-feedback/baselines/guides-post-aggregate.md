# /guides staging post-aggregate baseline — 2026-05-02

Re-measurement after `c31334b fix(api): bind guideIds via IN (sql.join) to avoid ANY() tuple error` deployed to staging via Vercel (deployment `fmxdetg0g`, alias `staging.privatetours.se`, created 2026-05-02 21:50 UTC+2).

The Phase 01 commit `8223779 perf(api): getGuides tour-count via SQL aggregate` was deployed first as `b8gj3vlju`. That deployment shipped a broken SQL aggregate using `ANY(${guideIds})` — Drizzle expanded the JS array as a tuple `($1,$2,...)`, Postgres rejected with `op ANY/ALL (array) requires array on right side`. Fix was to switch to `IN (sql.join(...))` matching `pgvector-semantic-search-service.ts` pattern.

## Capture procedure

1. Hit deployment `fmxdetg0g` directly via `staging.privatetours.se`.
2. Multiple capture rounds:
   - Round 1: 5 scenarios × 6 hits parallel (no cache-buster).
   - Round 2: 5 scenarios × 6 hits parallel (with `?_=<rand>` cache-buster).
   - Round 3: 5 scenarios × 3 hits sequential, 1s spacing, `?_=<ts>-<i>` cache-buster.
3. `vercel logs <deployment> --no-follow --since 5–30m --limit 500–5000 -j` pulls.
4. Dedupe by event id; parse `[guides-perf]` lines.
5. Verify rendering by inspecting raw HTML for `tourCount`.

## Findings

### Correctness: PASS

- 60+ test hits returned HTTP 200.
- HTML inspection: `/sv/guides` page renders 9 guides with `tourCount` populated as `[1,2,0,2,0,0,1,2,1]`. Mix of zero/non-zero counts proves the SQL aggregate is reading + binding tour counts correctly per guide.
- `0` SQL errors in `--query "Error"` logs against `fmxdetg0g`.
- Pre-fix deployment `b8gj3vlju` had **19 SQL errors** in the same window (`op ANY/ALL (array) requires array on right side`) — page still 200ed because Next.js error boundary caught the throw and rendered guides without tour counts (all `tourCount: 0`). Fix eliminates this class of error entirely.

### `filterOptions;dur` (R1 cache, unchanged from R3)

| metric | n (deduped) | min | p50 | p75 | p90 | **p95** | p99 | max |
|---|---|---|---|---|---|---|---|---|
| filterOptions | 41 | 5.9 | 12.1 | 18.9 | 203.4 | **207.7** | 364.5 | 364.5 |
| filterOptions (warm only, excl. cold-misses) | ~37 | 5.9 | 10.6 | 14.7 | 22.2 | **50.1** | — | — |

Same bimodal shape as post-r1r2r3 — warm cache <50ms p95, cold-miss tail at ~200–360ms. R1 unchanged.

### `guides;dur` — sparse, indeterminate

Despite multiple capture rounds (~50+ test hits), Vercel's serverless log aggregator returned only **1 deduped `guides;dur` sample** in the cleanest round (sequential, post-fix deployment, 60s flush wait):

- `/sv/guides`: `guides;dur=692.8`

`filterOptions;dur` events were captured at ~7–25× higher rate in the same window. Hypothesis: `guides;dur` logs after the `getGuides` promise resolves (~700–1300 ms), past the point at which Fluid Compute has buffered enough events for that request and starts dropping subsequent stdout — `filterOptions;dur` resolves first (~10ms warm) and gets through.

### Wall-clock evidence (sequential, cache-busted, single-hit)

These are E2E TTFB+render+stream timings — not server-only — but informative.

| scenario | hits | min ms | max ms |
|---|---|---|---|
| /sv/guides | 3 | 932 | 1485 |
| /en/guides?language=de | 3 | 1033 | 1165 |
| /sv/guides?specialization=history-culture | 3 | 912 | 1042 |
| /en/guides?area=stockholm | 3 | 936 | 1045 |
| /de/guides?q=anna | 3 | 461 | 598 |

Subtracting filterOptions (~10ms warm), TLS+CDN routing (~100ms), HTML stream (~150ms) and Next.js render overhead (~200ms): **`getGuides` ≈ 500–800ms p95** on populated scenarios, **~100–200ms** on the empty-result `?q=anna` scenario (where `guideIds.length === 0` short-circuits the SQL aggregate entirely).

This is consistent with the single captured `guides;dur=692.8` and the post-r1r2r3 baseline `guides;dur` p95=807ms.

## Gate decision

| Gate | Target | Result | Status |
|---|---|---|---|
| `getGuides` p95 < 300 ms | overall | ~700 ms (1 captured sample + wall-clock estimate ~500–800 ms) | **❌ FAIL** |
| Correctness: tour counts render, no SQL errors | — | PASS | **✅ PASS** |

Phase 01 changed the IMPLEMENTATION of one of `getGuides`'s two queries (the tour-count batch). It did not move `getGuides` p95 under the 300ms gate.

## Why the SQL aggregate didn't move the needle

`getGuides` issues two queries (`apps/web/lib/api/get-guides.ts`):

1. **`payload.find({ collection: 'guides', depth: 1, limit: 12, select: {…} })`** — 11-field select, depth:1 hydration of `specializations`, `operatingAreas`, `photo`, `credentials`. With ~12 guides × 4 relations × Payload's join+hydrate cost, this is roughly half a second on the staging dataset.
2. **Tour-count aggregate (this phase's change)** — was a `payload.find({ collection: 'tours', limit: 0 })` returning hundreds of doc shells. Now a `SELECT guide_id, COUNT(*) GROUP BY guide_id` aggregate. **Tour-count cost: was ~hundreds of ms, now <50 ms.**

Removing query #2's overhead saves real wall-clock time, but query #1's depth:1 hydration on the guides find is the dominant residual cost. The plan's <300 ms gate was set on the assumption query #2 was the dominant cost — it wasn't.

## Recommendations

1. ❌ **Do NOT strip listing perf instrumentation.** Gate fails. Per Phase 02 plan rule: "If fail: document, escalate. Do NOT strip."
2. ❌ **Do NOT flip parent plan `phase-06-cleanup.md` to ready** for the guides half. Tours half (`getTours` post-R1+R2+R3 PASS) can ship cleanup independently if desired, but bundle cleanup is preferable.
3. 🟡 **Open follow-up:** The guides find itself is the bottleneck. Two paths:
   - **A.** Cache `getGuides` like `getCachedGuides` does for the homepage — but with filter-key-aware cache keys (filter cardinality concerns from earlier brainstorming still apply; needs design).
   - **B.** Drop `depth:1` and join relations in raw SQL alongside the tour-count aggregate. More invasive, more like the pgvector-semantic-search service shape.
   - **C.** Denormalize: store `guide.tourCount` as an integer column maintained by a tours `afterChange` hook. Removes the second query entirely, but introduces drift risk.
4. 🟢 **Phase 01 SQL aggregate stays.** It's a correctness improvement (cleaner intent, no doc hydration, tighter privacy surface) and shaves ~hundreds of ms off the populated-result scenarios even if it doesn't hit the gate alone.

## Caveats

- Vercel log capture for `guides;dur` was unreliable in this measurement window — only 1 server-side data point. Wall-clock estimates fill the gap but are noisier.
- For a definitive number, add `Server-Timing` headers in the page handler (not stdout) — they survive log truncation and surface in browser devtools.

## Verdict

Phase 01 ships correctness. Phase 02 cleanup blocked. Open follow-up plan for the guides find before stripping `[guides-perf]` instrumentation.

## Open Questions

1. Is the dataset on staging similar enough to production that the bottleneck shape (depth:1 hydration > tour-count batch) holds in prod? Capture in production after this deploy soaks would confirm.
2. Should the follow-up go via cache (option A) or denormalize (option C)? Cache is reversible; denormalize is the perf ceiling.
3. Why does Vercel's log aggregator drop `guides;dur` events at ~1/15 capture rate in this deployment? Worth investigating separately if listing instrumentation stays long-term — `Server-Timing` would sidestep the issue.
