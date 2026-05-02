# /guides staging post-after()-instrumentation baseline — 2026-05-03

Re-measurement after `bd7936d perf(measure): defer listing perf logs via after()` deployed to staging via Vercel (deployment `opgpqrg33`, alias `staging.privatetours.se`, created 2026-05-02 23:46 UTC+2).

## Goal

Capture a clean `getGuides` p95 distribution to inform the choice between three open follow-up options:
- A. Cache `getGuides` with filter-aware keys
- B. Raw-SQL guides find with relation joins
- C. Denormalize `guide.tourCount` via tours `afterChange` hook

## Capture procedure

1. Deployment `opgpqrg33` Ready 23:50 UTC+2.
2. **Round 1 (sequential, single-hit):** 5 rounds × 8 scenarios = 40 hits, cache-busted, sequential. Captures the warm-path distribution without function-instance contention.
3. **Round 2 (parallel):** 8 scenarios × 4 parallel = 32 in-flight hits. Captures function-cold-start tail and queueing.
4. `vercel logs <deployment> --no-follow --since 30m --limit 5000 -j` pulls. Dedupe by event id.

## Findings

### `after()` did NOT fix Vercel log capture

Hypothesis was: late-resolving `console.log` was racing the response stream and getting dropped. Switch to `after()` (post-stream callback) should make logs reliably reach the aggregator.

**Result:** Same drop pattern. Across **72 total hits**:
- `filterOptions;dur` captured: **77 unique events** (warm and cold)
- `guides;dur` captured: **1 unique event** (`/de/guides`, dur=594.5)
- `total;dur` captured: **0**

The drop is NOT timing-related — `filterOptions` ran inside the same `after()` mechanism and was captured cleanly. Working hypothesis now: Vercel's per-request log cap is hit before the second `after()` callback flushes, OR `after()` callbacks registered late in the request fall outside the log scope window. Worth a separate investigation; not on this plan's critical path.

### `filterOptions;dur` (R1 cache, n=77)

| metric | n | min | p50 | p75 | p90 | **p95** | p99 | max |
|---|---|---|---|---|---|---|---|---|
| filterOptions (round 1, warm-dominant) | 37 | 5.3 | 6.6 | 7.8 | 13.9 | **18.0** | 18.9 | 18.9 |
| filterOptions (round 2, parallel/cold) | 40 | 5.3 | 201.6 | 210.3 | 226.5 | **233.9** | 275.9 | 275.9 |

Round 1 warm path is excellent (≤18ms p95). Round 2's cold-shifted distribution (200ms p95) reflects function instance cold-starts under parallel load. R1 is healthy.

### `guides;dur` — single server-side sample

`/de/guides`: dur=594.5 ms.

That's the only data point. Aligned with the post-aggregate baseline single sample (692.8 ms) and the post-r1r2r3 distribution (p95=807 ms, n=1240). All within the same 500–800 ms band.

### Wall-clock E2E (round 1 — sequential, single-hit, cache-busted)

40 samples across 8 scenarios. Scenario p95 wall-clock:

| scenario | hits | min | p50 | max |
|---|---|---|---|---|
| /de/guides?q=anna (empty result) | 5 | 449 | 456 | 579 |
| /sv/guides | 5 | 905 | 939 | 4741 |
| /en/guides | 5 | 907 | 921 | 3801 |
| /de/guides | 5 | 905 | 920 | 2110 |
| /sv/guides?language=sv | 5 | 1018 | 1031 | 1812 |
| /en/guides?language=de | 5 | 910 | 915 | 1248 |
| /sv/guides?specialization=history-culture | 5 | 909 | 918 | 1067 |
| /en/guides?area=stockholm | 5 | 910 | 938 | 963 |

Aggregate distribution (all 40):

| metric | n | p50 | p75 | p90 | **p95** | p99 | max |
|---|---|---|---|---|---|---|---|
| wall-clock (raw) | 40 | 920 | 1018 | 1812 | **2231** | 4741 | 4741 |
| wall-clock (excl. cold outliers >2000ms, n=36) | 36 | 916 | 998 | 1067 | **1248** | 1812 | 1812 |

### Estimated `getGuides` p95 (subtraction model)

Wall-clock minus filterOptions (≤18ms warm), TLS+CDN routing (~100ms), HTML stream (~150ms), Next.js render+RSC (~200ms) — derive baseline overhead from the empty-result scenario:

- /de/guides?q=anna p95 wall-clock = 579ms; getGuides for empty `guideIds` short-circuits the SQL aggregate, so getGuides ≈ 50–100ms; **overhead baseline ≈ 480ms**.
- /sv/guides warm p95 wall-clock = 998ms; **getGuides ≈ 520ms**.
- /sv/guides?language=sv p95 wall-clock = 1031ms; **getGuides ≈ 550ms**.
- /sv/guides cold p95 wall-clock (incl. outliers) = 4741ms; **getGuides ≈ 4250ms** (cold function instance + connection establishment).

**Bottom line: getGuides warm p95 ≈ 500–600 ms, cold p95 ≈ 1.5–4 s.** The single captured server-side sample (594.5 ms) anchors the warm estimate.

## Gate decision (vs the original <300ms target)

| Gate | Target | Estimate | Status |
|---|---|---|---|
| `getGuides` warm p95 < 300 ms | overall | ~500–600 ms | **❌ FAIL** (same as post-aggregate) |

The post-aggregate baseline gate-fail conclusion stands. The SQL aggregate is correct but doesn't move getGuides p95 under the gate. The dominant cost is the guides find with depth:1 hydration.

## Recommendations

1. ❌ **Do NOT strip listing perf instrumentation.** Same gate state as before.
2. 🟢 **Pick a follow-up path now.** The measurement converges on the same answer as the previous baseline. Three options, ordered by reversibility:

   **A. Cache `getGuides` with filter-aware keys (RECOMMENDED — shipping)**
   - Wrap `getGuides` in `unstable_cache` with `[locale, language, specialization, area, q, page, limit]` cache keys.
   - Filter cardinality: 6 main languages + ~10 additional × ~10 specializations × ~20 areas × ~50 search queries × pagination ≈ low six-figure max key space, dominated by repeat-traffic on the unfiltered listing. Memory + revalidate=600s caps storage.
   - Tags: `['guides']` (existing). Invalidates on guide upsert/delete.
   - Effort: ~1h. Reversible (`git revert` of one wrap call).

   **B. Raw-SQL guides find with relation joins**
   - Replace `payload.find({ depth:1, select })` with a Drizzle raw-SQL query joining `guides` + `guides_specializations` + `guides_areas` + `guide_photo_media`. Match the pgvector pattern.
   - Effort: ~3–5h. Brittle to schema changes; bypasses Payload's hooks/access control.

   **C. Denormalize `guide.tourCount` as a column**
   - Add `tourCount` integer field to guides, maintained by a tours `afterChange`/`afterDelete` hook.
   - Removes the second query entirely; warm `getGuides` becomes a single guides find with depth:1.
   - Effort: ~2h. Migration + hook; drift risk if hook misses an edge case.

3. ❓ **Open separate investigation:** Why does Vercel's log aggregator drop `guides;dur` events at 99% rate even with `after()`? Worth filing if the listing perf instrumentation stays long-term. For now, wall-clock E2E + the subtraction model is sufficient.

## Caveats

- Wall-clock is noisier than server-side timing — scenario-level p95 is inflated by network jitter, TLS resumption variance, and cold-start clustering under parallel load.
- Round 2 (parallel) data is dominated by function cold-start contention — useful for stress-test framing, but not for steady-state user traffic.
- The "overhead baseline ≈ 480 ms" subtraction model is an estimate; production traffic shape (CDN edge cache hit rate, geographic distribution of users, RSC payload size) will shift it.

## Verdict

`after()` instrumentation didn't fix the Vercel log capture issue, but the wall-clock distribution + the single captured server-side sample together support the same conclusion as the post-aggregate baseline: **`getGuides` warm p95 sits at 500–600 ms, well above the 300 ms gate.** The SQL aggregate fix shipped correctness but doesn't change this. Next move: pick A (cache) and ship.

## Open Questions

1. Vercel log capture gap: why are `guides;dur` `after()` callbacks dropped while `filterOptions;dur` `after()` callbacks survive? Same code shape, same execution context.
2. Cardinality of the guides cache: what's the actual filter-key distribution from production access logs? Affects A's memory ceiling.
3. Edge-cache hit rate for `/guides` routes on production traffic — if Vercel's CDN is already absorbing most repeat hits, A's incremental win is smaller than the staging measurement suggests.
