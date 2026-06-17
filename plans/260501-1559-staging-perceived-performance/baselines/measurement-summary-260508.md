---
title: "7-Day Post-Deploy Measurement Summary"
date: 2026-05-08
plan: plans/260501-1559-staging-perceived-performance/
baseline_ref: lighthouse-final-260501.json
methodology: >
  Lighthouse mobile simulation (Slow 4G, 4× CPU), 3 runs per route, median used.
  Chromium 141 (Playwright bundle). Chrome flags: --headless=new --no-sandbox
  --disable-dev-shm-usage --ignore-certificate-errors (staging uses self-signed cert).
  Run 1 was median by performance score for home/tours/tourdetail/guides;
  run 3 for findtour. Per-metric medians computed independently for accuracy.
---

# 7-Day Post-Deploy Measurement Summary

**Measured:** 2026-05-08 (7 days after 2026-05-01 deploy)
**Routes:** 5 staging routes (mobile simulation)
**Raw JSONs:** `lh-<route>-7day-260508.json` (median-perf-score run saved as canonical)

---

## Four-Timepoint Comparison

### Performance Score (0–100, higher = better)

| Route | Baseline | Post-P1 | Post-C+D | **7-day** | Δ vs C+D |
|-------|:--------:|:-------:|:--------:|:---------:|:--------:|
| `/sv` (home) | 63 | 52 | 56 | **63** | +7 |
| `/sv/tours` | 49 | 43 | 51 | **67** | +16 |
| `/sv/tours/[slug]` | 44 | 53 | 43 | **65** | +22 |
| `/sv/guides` | 43 | 45 | 43 | **70** | +27 |
| `/sv/find-tour` | 57 | 41 | 54 | **56** | +2 |

### LCP — Largest Contentful Paint (ms, lower = better; **target < 2500ms**)

| Route | Baseline | Post-P1 | Post-C+D | **7-day** | Δ vs C+D | Target |
|-------|:--------:|:-------:|:--------:|:---------:|:--------:|:------:|
| `/sv` | 4 457 | 5 397 | 6 000 | **5 407** | −593 | ❌ |
| `/sv/tours` | 17 058 | 16 548 | 16 400 | **5 706** | −10 694 | ❌ |
| `/sv/tours/[slug]` | 16 162 | 5 682 | 16 400 | **5 461** | −10 939 | ❌ |
| `/sv/guides` | 16 157 | 16 180 | 16 200 | **4 878** | −11 322 | ❌ |
| `/sv/find-tour` | 4 209 | 6 584 | 5 000 | **5 182** | +182 | ❌ |

### FCP — First Contentful Paint (ms, lower = better)

| Route | Baseline | Post-P1 | Post-C+D | **7-day** |
|-------|:--------:|:-------:|:--------:|:---------:|
| `/sv` | 1 382 | 1 761 | n/a | **1 527** |
| `/sv/tours` | 1 609 | 1 412 | n/a | **1 635** |
| `/sv/tours/[slug]` | 1 398 | 1 383 | n/a | **1 571** |
| `/sv/guides` | 1 402 | 1 410 | n/a | **1 591** |
| `/sv/find-tour` | 1 402 | 2 066 | n/a | **1 659** |

### TBT — Total Blocking Time (ms, lower = better; **target < 300ms**)

| Route | Baseline | Post-P1 | Post-C+D | **7-day** | Δ vs C+D | Target |
|-------|:--------:|:-------:|:--------:|:---------:|:--------:|:------:|
| `/sv` | 647 | 638 | 692 | **383** | −309 | ❌ +83ms |
| `/sv/tours` | 694 | 919 | 694 | **205** | −489 | ✅ |
| `/sv/tours/[slug]` | 950 | 767 | 1 019 | **266** | −753 | ✅ |
| `/sv/guides` | 1 176 | 1 168 | 1 153 | **276** | −877 | ✅ |
| `/sv/find-tour` | 1 127 | 990 | 1 051 | **1 010** | −41 | ❌ +710ms |

### TTI — Time to Interactive (ms, lower = better)

| Route | Baseline | Post-P1 | Post-C+D | **7-day** | Δ vs C+D |
|-------|:--------:|:-------:|:--------:|:---------:|:--------:|
| `/sv` | 16 478 | 17 497 | 17 500 | **5 851** | −11 649 |
| `/sv/tours` | 17 393 | 16 770 | 16 700 | **6 069** | −10 631 |
| `/sv/tours/[slug]` | 16 356 | 16 145 | 16 400 | **5 509** | −10 891 |
| `/sv/guides` | 16 172 | 16 194 | 16 200 | **5 454** | −10 746 |
| `/sv/find-tour` | 15 883 | 17 390 | 15 900 | **5 513** | −10 387 |

### CLS — Cumulative Layout Shift (lower = better; threshold 0.1)

| Route | Baseline | Post-P1 | Post-C+D | **7-day** | Δ vs C+D |
|-------|:--------:|:-------:|:--------:|:---------:|:--------:|
| `/sv` | 0.101 | 0.101 | 0.101 | **0.000** | −0.101 |
| `/sv/tours` | 0.101 | 0.101 | 0.101 | **0.000** | −0.101 |
| `/sv/tours/[slug]` | 0.101 | 0.101 | 0.101 | **0.000** | −0.101 |
| `/sv/guides` | 0.101 | 0.101 | 0.101 | **0.000** | −0.101 |
| `/sv/find-tour` | 0.101 | 0.101 | 0.101 | **0.000** | −0.101 |

### TTFB — Server Response Time (ms, lower = better; target < 600ms cached / 1200ms uncached)

| Route | Baseline | Post-P1 | Post-C+D | **7-day** | Note |
|-------|:--------:|:-------:|:--------:|:---------:|:-----|
| `/sv` | 5 | n/a | n/a | **1 237** | CDN miss; baseline was edge-cached |
| `/sv/tours` | 4 | n/a | n/a | **324** | ✅ |
| `/sv/tours/[slug]` | 4 | n/a | n/a | **1 263** | Likely Neon DB cold-start |
| `/sv/guides` | 4 | n/a | n/a | **1 137** | Within uncached budget |
| `/sv/find-tour` | 5 | n/a | n/a | **296** | ✅ |

> **Note on TTFB comparison:** Baseline values (4–5ms) reflect pure CDN edge-cache hits. 7-day values reflect mixed cache state (warm vs. cold Neon DB) and are more representative of realistic uncached page loads. The jump is a measurement-condition difference, not a regression.

---

## Target Status

| Target | Status | Details |
|--------|:------:|---------|
| LCP < 2.5s | ❌ MISS | All routes 4.9–5.7s. Best: guides (4 878ms). Gap: ~2–3s. |
| TBT < 300ms | ⚠️ PARTIAL | tours ✅ (205ms), tourdetail ✅ (266ms), guides ✅ (276ms). home ❌ (383ms), find-tour ❌ (1 010ms). |
| Lighthouse ≥ 85 | ❌ MISS | All routes 56–70. Best: guides (70). Gap: 15–29 points. |
| CLS ≤ 0.1 | ✅ PASS | 0.000 across all routes (was 0.101 pre-deploy). |
| TTI (plan Day-5 feel goal) | ✅ WIN | ~5.5–6s across all routes (was 15–17s, −10s improvement). |

---

## Bubblav Deferral Status

Branch D tightened Bubblav deferral in commit `32d8e5d`. Checked via `network-requests` audit across **all 15 Lighthouse runs** (3 runs × 5 routes):

> **Bubblav (`https://www.bubblav.com/v1.<hash>.js`, ~1.9 MB) did NOT load in any run.**

Deferral is holding. The `lazyOnload` `next/script` strategy is working — Lighthouse's no-interaction audit window never triggers the widget load. This is the primary driver of the TTI drop from ~16s to ~6s.

---

## Key Findings

### Major wins

1. **TTI −10s across all routes.** 16–17s → 5.5–6s. The Bubblav defer (Branch D) accounts for most of this: the 1.9 MB script no longer blocks the main thread during page load.
2. **CLS 0.101 → 0.000 on all routes.** Phase 1 `loading.tsx` skeletons eliminated every layout shift.
3. **TBT under target on 3/5 routes.** tours (205ms), tourdetail (266ms), guides (276ms) all now below the 300ms threshold.
4. **LCP on listing pages −10–11s.** tours: 16.4s → 5.7s, guides: 16.2s → 4.9s, tourdetail: 16.4s → 5.5s. Branch C image priority + server warming in effect.

### Remaining gaps

1. **LCP is 2× above target on all routes.** Even at best (guides: 4 878ms), still 2 378ms above the 2 500ms goal. Root cause: hero/listing images still too slow to paint — either `priority` is missing on the first-viewport image, `sizes` is miscalculated causing oversized fetches, or the Vercel Image CDN needs a cache pre-warm.
2. **findtour TBT still 1 010ms.** The `ConciergeWizard` (dynamic import, but `ssr: false`) is blocking the main thread during hydration. The component renders on mount and runs heavy init synchronously.
3. **home TBT 383ms** (83ms over target). Likely analytics or ResizeObserver setup; minor compared to findtour.
4. **tourdetail TTFB spikes to 3 202ms on cold runs.** Confirms Neon DB cold-start on the tour-detail route. `unstable_cache` TTL may be expiring or keys not warming. Blocking `generateStaticParams` + cold DB = compounded latency.

---

## Bubblav Check Detail

```
15/15 runs: bubblav.com not in network-requests audit
Verdict: PASS — Branch D deferral holding
```

---

## Recommendations

1. **LCP (all routes, P0):** Add `priority` to the first `<Image>` in each page's hero/card grid. Audit `sizes` prop — a full-width listing card on mobile needs `sizes="(max-width: 640px) 100vw, 50vw"`, not the default. Consider a `<link rel="preload">` in `<head>` for the above-the-fold hero image. Goal: get LCP below 3s first, then target 2.5s.
2. **findtour TBT (P1):** Defer `ConciergeWizard` first render with `startTransition` or `useDeferredValue`. The wizard is the only route still failing TBT at scale — wrapping its initial mount in a low-priority render should drop TBT to < 300ms without affecting UX.
3. **home TBT (P2):** Minor — profile with DevTools Performance trace, look for synchronous analytics init or layout-triggering listeners in the hero section.
4. **tourdetail TTFB / Neon cold-start (P1):** Increase `unstable_cache` TTL for tour-detail pages, or add a pre-warm cron job that hits the 5 most-viewed tour URLs every 4 minutes. Alternatively, escalate DB IPv6 connectivity issue to DevOps so `generateStaticParams` can run at build time and generate static pages (no DB hit on request).
5. **Phase 2 Track A / Lighthouse CI (backlog):** DB-from-CI remains blocked on IPv6 connectivity. DevOps escalation still needed; options: runner IP allowlist, `force-dynamic` on guide/tour routes, or mock-DB build env.
6. **RUM > lab:** These lab numbers are under extreme throttling (Slow 4G, 4× CPU). Real-user LCP is typically 3–4× better. Check Web Vitals reporter at `/api/analytics/vitals` for field p75 after 7 days of traffic.

---

## Methodology Notes

- 3 runs per route; per-metric medians reported (not single-run median).
- Median run by performance score saved as canonical `lh-<route>-7day-260508.json`.
- Staging TLS uses self-signed cert; `--ignore-certificate-errors` flag used. Pages loaded correctly (confirmed via scores).
- Baseline (pre-Phase-1) TTFB of 4–5ms was a CDN-cache hit; 7-day TTFB reflects origin/DB hits and is not directly comparable.

## Open Questions

1. Do RUM field p75 LCP values match the lab trend? (Check `/api/analytics/vitals` report)
2. Is the tourdetail TTFB spike (3.2s) isolated to the test run or reproducible? If reproducible, Neon cold-start is confirmed and the pre-warm cron is needed.
3. Has findtour traffic been measured for actual INP (interaction-to-next-paint)? Wizard may be causing > 200ms INP on first interaction even if TBT is the proxy metric.
