---
title: getGuides tour-count batch query — replace with SQL aggregate
description: Drop the residual /guides p95 ~800ms after R1+R2+R3. Replace the limit:0 batch find with a single SQL count-aggregate.
status: completed-gate-failed
priority: P2
effort: ~1.5h
branch: master
tags: [perf, payload, postgres, listing, follow-up]
created: 2026-05-02
completed: 2026-05-02
outcome: correctness-shipped-perf-gate-failed
---

> **Outcome:** Phase 01 SQL aggregate shipped (correctness — no errors, tour counts render). Required mid-flight fix `c31334b` for an `ANY()` vs `IN()` Drizzle binding bug. Phase 02 gate `<300ms` FAILED — `getGuides` p95 ≈ 700ms; tour-count batch was not the dominant cost. Listing instrumentation NOT stripped. See `plans/260502-0048-instant-filter-feedback/baselines/guides-post-aggregate.md` for analysis + follow-up options.

# getGuides tour-count perf

## Problem
After R1+R2+R3 (commits `5dd4b21` … `12df4dd`), `getGuides` staging p95 still sits at ~700–800 ms. Cause is the **second** query in `apps/web/lib/api/get-guides.ts:141-153`:

```ts
const tours = await payload.find({
  collection: 'tours',
  where: { status: { equals: 'published' }, guide: { in: guideIds } },
  depth: 0,
  limit: 0,            // ← fetches ALL matching tours, then iterates client-side
  select: { guide: true },
})
for (const tour of tours.docs) { tourCountMap.set(...) }
```

Payload hydrates every matching tour doc, then we throw the docs away — only counts matter. With ~10 guides on a page and 5–20 tours per guide, this returns hundreds of rows just to compute 10 integers. The new `guides_status_idx` doesn't touch this path.

## Solution
Replace the batch find + client loop with a single raw SQL aggregate via Payload's Drizzle adapter:

```sql
SELECT guide_id, COUNT(*)::int AS count
FROM tours
WHERE status = 'published' AND guide_id = ANY($1)
GROUP BY guide_id
```

Returns one row per guide with a count. Zero hydration cost. Index on `tours.guide` (already exists per `tours.ts:123 index: true`) plus `tours.status` (existing index) cover the query.

## Phases

| # | Title | Status | Effort | Deps |
|---|---|---|---|---|
| 01 | Replace tour-count batch with SQL aggregate | completed (+1 fix commit `c31334b`) | 1h | — |
| 02 | Re-measure + strip listing perf instrumentation | completed-fail (gate <300ms not met; ~700ms) | 30m | 01 |

## Gate
- `getGuides` staging p95 → **<300 ms** sustained.
- After gate passes: strip remaining `[tours-perf]` and `[guides-perf]` instrumentation; flip parent plan `260502-0048-instant-filter-feedback/phase-06-cleanup.md` to ready.

## Context Links
- Predecessor plan: `plans/260502-1308-listing-query-perf/`
- Post-R1+R2+R3 baselines: `plans/260502-0048-instant-filter-feedback/baselines/{tours,guides}-post-r1r2r3.md`
- Brainstorm (B-bucket alt approaches): `plans/reports/brainstorm-260502-1112-listing-query-perf.md`
- Drizzle raw-SQL example in this repo: `apps/web/lib/ai/pgvector-semantic-search-service.ts` (uses `sql` template)

## Open Questions
1. Does Payload's Drizzle adapter expose a stable way to run raw SQL via `payload.db.drizzle`? Verify in Phase 01 by reading existing usage in `pgvector-semantic-search-service.ts`.
2. Is `tours.guide_id` actually the column name on the `tours` table (vs a join via `tours_rels`)? `tours.guide` is a single-relationship field with `index: true` — Drizzle/Payload should generate `guide_id` directly on `tours`. Confirm via `psql \d tours`.
3. Should the count batch run in parallel with the guide find? Currently sequential. Probably negligible vs query cost — defer unless aggregate query lands above 100 ms.
