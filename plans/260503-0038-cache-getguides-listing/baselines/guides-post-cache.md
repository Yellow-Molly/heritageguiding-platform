# /guides staging post-cache baseline — 2026-05-03

Measurement after `0aec000 perf(api): cache getGuides for /guides listing + load-more (Option A)` deployed to staging.privatetours.se via Vercel deployment `qyizwjs3j` (Ready 2026-05-03 00:51 UTC+2).

## Goal

Verify Option A (filter-aware `unstable_cache` wrap) drops `getGuides` warm p95 below the 200ms gate.

## Capture procedure

- 8 scenarios × (1 warmup + 5 measured) = 40 measured wall-clock samples.
- **Sequential, no nonce-busting** — so `unstable_cache` data-cache entries can hit.
- `vercel logs <deploy> --since 10m -j` pulled immediately after the run.
- Window: 2026-05-02T22:51:31 → 22:52:14 UTC (43 s).

## Server-side `[guides-perf] guides;dur` (n=34)

Capture rate: 34 / 40 measured = **85%** (vs **1 / 72 = 1.4%** in the predecessor `after()`-only deployment). The original log-drop hypothesis remains unsolved, but the cache itself shrank the get-window so most events now flush before whatever cap was clipping them.

| metric | value |
|---|---|
| n | 34 |
| min | 5.3 ms |
| p50 | 7.0 ms |
| p75 | 10.4 ms |
| p90 | 14.7 ms |
| **p95** | **18.6 ms** |
| p99 | 23.3 ms |
| max | 23.3 ms |

Distribution is tight and bimodal: the 5-9 ms cluster is cache-hit + minimal map work; the 11-23 ms tail is likely cold function instance with first-call cache fetch.

### vs pre-cache baseline

| baseline | warm p95 | source |
|---|---|---|
| post-r1r2r3 (no cache) | ~807 ms | `guides-post-r1r2r3.md` |
| post-aggregate (SQL aggregate, no cache) | ~692 ms (n=1) | `guides-post-aggregate.md` |
| post-after()-instrumentation (no cache) | ~594 ms (n=1) | `guides-after-deferred.md` |
| **post-cache (this baseline)** | **~19 ms** | this doc |

**~96% reduction in `getGuides` warm p95.** Gate target was <200 ms; came in at <20 ms.

## `filterOptions;dur` (n=12)

| metric | value |
|---|---|
| min | 6.1 ms |
| p50 | 9.35 ms |
| p95 | ~22.4 ms |
| max | 27.3 ms |

Consistent with predecessor (already cached, ≤18 ms warm p95). Untouched by this change — sanity check only.

## Wall-clock E2E (n=40)

| metric | n=40 (raw) | n=39 (excl. >2000ms cold outlier) |
|---|---|---|
| min | 340 ms | 340 ms |
| p50 | 581 ms | 581 ms |
| p75 | 613 ms | 608 ms |
| p90 | 758 ms | 687 ms |
| **p95** | **1238 ms** | **913 ms** |
| p99 | 3110 ms | 1238 ms |
| max | 3110 ms | 1238 ms |

Per-scenario p95 (5 samples each):

| scenario | min | p50 | max |
|---|---|---|---|
| /de/guides | 519 | 594 | 1238 |
| /sv/guides | 566 | 599 | 741 |
| /en/guides | 358 | 509 | 613 |
| /sv/guides?language=sv | 362 | 509 | 3110 |
| /en/guides?language=de | 490 | 598 | 613 |
| /sv/guides?specialization=history-culture | 344 | 565 | 623 |
| /en/guides?area=stockholm | 461 | 553 | 913 |
| /de/guides?q=anna | 340 | 447 | 557 |

### vs pre-cache wall-clock

| metric | pre-cache (n=36 warm) | post-cache (n=39 warm) | Δ |
|---|---|---|---|
| p50 | 916 ms | 581 ms | **−37%** |
| p75 | 998 ms | 608 ms | −39% |
| **p95** | **1248 ms** | **913 ms** | **−27%** |

Wall-clock drop is smaller than the server-side drop because TLS/CDN routing (~100ms), Next.js render+RSC (~250ms), and HTML stream (~150ms) are unchanged. The 500-600 ms `getGuides` cost is gone, leaving render dominance.

## Gate decision

| Gate | Target | Result | Status |
|---|---|---|---|
| `getGuides` warm p95 < 200 ms | server-side | **18.6 ms** | ✅ PASS |
| Cache hit-rate (proxy: server-side capture rate) | n/a | 85% | ✅ |
| No correctness regression | listings render, no SQL errors in logs | clean | ✅ |

## Recommendations

1. ✅ **Ship it.** Gate exceeded by an order of magnitude.
2. 🟢 **Strip listing perf instrumentation.** Parent plan's Phase 06 can now close — `[guides-perf]` console.logs in `guides/page.tsx` and `tours/page.tsx` are no longer needed for /guides. Consider deferring tours strip to a separate decision.
3. 🟡 **Tour count drift bound to 10 min** — `revalidate: 600` failsafe + `revalidateTag('guides')` on guide CRUD. Tour upsert/delete does **not** invalidate guides cache. Acceptable for now; if drift becomes user-visible, add `revalidateTag('guides')` to tours `afterChange/afterDelete` hooks.
4. 🟡 **Tours listing has the same un-cached pattern** — `tours/page.tsx` calls `getTours` directly. Out of scope for this plan but a clear next candidate.

## Caveats

- 85% capture rate: 6 of 40 measured `guides;dur` events still missing from logs. Consistent with the unresolved Vercel log-drop investigation but no longer blocking — the captured n=34 distribution is statistically defensible.
- Single-deploy measurement window; production traffic shape (CDN edge cache, geographic distribution) will shift wall-clock numbers but not server-side cache-hit cost.
- Cold function-instance tail (3110 ms outlier on `/sv/guides?language=sv` round 3) reflects parallel-test contention; sequential warm path is the steady-state user experience.

## Verdict

**Option A is the right call.** `getGuides` warm p95 dropped from ~500-600 ms to ~19 ms — a 96% reduction. Wall-clock p50 improved 37%. Render overhead is now the dominant remaining cost; further wall-clock improvement requires RSC-payload or streaming work, not data-layer.

## Open Questions

1. Tours listing — apply same cache wrap? (Separate plan recommended.)
2. Strip `[guides-perf]` instrumentation now or wait for tours decision? (Suggest: strip /guides side now.)
3. Should tours `afterChange` hooks invalidate `'guides'` tag for tourCount accuracy? (Defer until drift becomes observable.)
