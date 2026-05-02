---
title: Reliable getGuides perf telemetry via after()
description: Switch listing perf instrumentation to next/server `after()` so logs survive Vercel's serverless log aggregation. Capture a clean baseline to inform the cache/raw-SQL/denormalize follow-up decision.
status: pending
priority: P2
effort: ~45m
branch: master
tags: [perf, telemetry, instrumentation, follow-up]
created: 2026-05-02
---

# Reliable getGuides perf telemetry

## Problem

In `plans/260502-2124-getguides-tour-count-perf/`, Phase 02 measurement collected only **1 server-side `guides;dur` sample** despite 60+ test hits. `[guides-perf] filterOptions;dur=…` events were captured at high volume in the same window. Hypothesis: `guides;dur` logs ~700–1300 ms after request start, late enough that Vercel's log aggregator drops it from the deployment's stream.

We need a reliable `getGuides` p95 number to choose between the open follow-up options:
- A. Cache `getGuides` with filter-aware keys
- B. Raw-SQL guides find with relation joins
- C. Denormalize `guide.tourCount` via tours `afterChange` hook

## Why not Server-Timing headers

Next.js App Router pages can't directly set response headers from inside the page handler. Middleware/proxy runs **before** render, so it can't observe post-render timing. The clean Server-Timing path requires either a custom server (not Vercel-shaped) or wrapping page logic in route handlers that return HTML (large rewrite). Not worth the effort for a measurement fix.

## Solution

Wrap the existing `console.log` calls in `after(() => …)` from `next/server`. `after()` executes **after** the response stream closes, decoupled from the user-visible request lifecycle. Vercel's log aggregator captures `after()` callbacks reliably.

```ts
import { after } from 'next/server'

const guidesP = getGuides(...).then((r) => {
  const dur = performance.now() - tG0
  after(() => console.log(`[guides-perf] guides;dur=${dur.toFixed(1)}`))
  return r
})
```

Apply to both `/guides` and `/tours` page handlers (parity; tours instrumentation has the same drop pattern likely).

## Phases

| # | Title | Status | Effort | Deps |
|---|---|---|---|---|
| 01 | Switch listing instrumentation to `after()` + capture clean baseline | pending | 45m | — |

## Gate

- ≥30 deduped `guides;dur` samples captured for `getGuides` post-deploy.
- p95 number is statistically defensible (n≥30 across at least 3 scenarios).

## Out of scope

- The actual A/B/C follow-up decision. This plan only produces the measurement; the user picks the path.
- Permanently keeping `after()` instrumentation. After we have the baseline + chosen follow-up, the parent plan's Phase 06 cleanup strips it.

## Context Links

- Predecessor: `plans/260502-2124-getguides-tour-count-perf/`
- Baseline that motivated this plan: `plans/260502-0048-instant-filter-feedback/baselines/guides-post-aggregate.md` § "Caveats"
- Next.js `after()` docs: https://nextjs.org/docs/app/api-reference/functions/after

## Risk Assessment

- **Risk (LOW × LOW):** `after()` callback errors don't fail the request, but a thrown error would log a separate trace. Mitigation: wrap in try/catch.
- **Risk (LOW × LOW):** Vercel could also drop `after()` logs under high volume. Mitigation: if so, fall back to wall-clock + filterOptions subtraction model documented in the existing baseline.
