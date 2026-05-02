---
phase: 01
title: Measurement Instrumentation & Staging Baseline
status: code-complete (staging capture pending)
priority: high
effort: 30m
---

# Phase 01 — Measurement Instrumentation & Staging Baseline

## Context Links
- Brainstorm: `plans/reports/brainstorm-260501-1949-instant-filter-feedback.md`
- Related plan: `plans/260501-1559-staging-perceived-performance/` (Phase 3 measurement track)

## Overview
**Priority:** High (gates ship/follow-up decision in Phase 06)
**Status:** Pending

Add temporary `Server-Timing` header + `console.time` instrumentation to `tours/page.tsx` and `guides/page.tsx`. Capture 5 staging samples per route. Decision rule (from brainstorm) determines whether perception fix is sufficient or query optimization is needed.

## Key Insights
- `getTours` is wrapped in `Promise.all([getCategories, getCities, getTours])` — server roundtrip dominated by slowest of 3
- Need to time `getTours` independently AND total
- Instrumentation is **temporary** — Phase 06 removes or converts to permanent observability per docs/system-architecture decision

## Requirements
**Functional**
- Emit `Server-Timing` header with entries: `categories;dur=<ms>`, `cities;dur=<ms>`, `tours;dur=<ms>`, `total;dur=<ms>`
- Log to console in dev for fast iteration
- Sample 5 measurements on staging at varied filter states (no filter, single category, multi-category, search query, multi-filter)

**Non-functional**
- Zero impact on production payload (header only, gated to staging if needed via `process.env.VERCEL_ENV !== 'production'`, but per brainstorm scope it's removed Phase 06 anyway — keep simple, no env gate)

## Architecture
```
tours/page.tsx
  ├─ const t0 = performance.now()
  ├─ Promise.all with per-call timing
  └─ headers: Server-Timing entries

baselines/
  ├─ tours-baseline-20260502.md
  └─ guides-baseline-20260502.md
```

## Related Code Files
**Modified:**
- `apps/web/app/(site)/[locale]/(frontend)/tours/page.tsx`
- `apps/web/app/(site)/[locale]/(frontend)/guides/page.tsx`

**Created:**
- `plans/260502-0048-instant-filter-feedback/baselines/tours-baseline-20260502.md`
- `plans/260502-0048-instant-filter-feedback/baselines/guides-baseline-20260502.md`

## Implementation Steps
1. Read `apps/web/app/(site)/[locale]/(frontend)/tours/page.tsx` to confirm Promise.all shape and how response is constructed
2. Wrap each call with `performance.now()` deltas; aggregate into Server-Timing header value
3. Use `headers()` mutation pattern (Next.js App Router server component) — likely needs `Response` construction or attach via metadata if not directly possible. Confirm path during impl. Fallback: log via `console.timeEnd` only if header injection too invasive
4. Repeat for `guides/page.tsx`
5. Deploy to staging (existing workflow), open `/tours` 5x with varied filters, copy `Server-Timing` from DevTools Network tab
6. Record p50/p95 in `baselines/tours-baseline-20260502.md` (markdown table: scenario | categories | cities | tours | total)
7. Same for `/guides`
8. Apply decision rule, note outcome in baseline file footer

## Todo List
- [ ] Read `tours/page.tsx` and confirm timing injection point
- [ ] Add timing wrappers + Server-Timing header in `tours/page.tsx`
- [ ] Add timing wrappers + Server-Timing header in `guides/page.tsx`
- [ ] Local smoke test (npm run dev, hit `/tours`, verify header appears)
- [ ] Push branch, deploy to staging
- [ ] Capture 5 samples per route (10 total) at varied filter states
- [ ] Write `baselines/tours-baseline-20260502.md`
- [ ] Write `baselines/guides-baseline-20260502.md`
- [ ] Apply decision rule, document outcome at bottom of each baseline file

## Success Criteria
- Server-Timing header visible in DevTools Network on both `/tours` and `/guides` staging
- 10 samples captured with measurable per-call breakdown
- Decision (ship-as-is / ship+follow-up / block-ship) documented

## Risk Assessment
- **Risk:** Server-Timing injection in App Router server component may require unusual response handling. **Mitigation:** Fall back to `console.time` + manual capture from staging logs if needed
- **Risk:** Staging DB may be empty/cold-cached → unrealistic numbers. **Mitigation:** Run at least 2 warm-cache passes per scenario before recording

## Security
- No PII in timing logs
- Server-Timing header is debug-only; remove in Phase 06 before final merge to prod

## Next Steps
- Phase 02 begins regardless of Phase 01 outcome (provider scaffold is ship-blocker independent of query perf)
- Phase 06 acts on Phase 01 decision rule
