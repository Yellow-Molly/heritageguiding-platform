---
phase: 01
title: Replace getGuides tour-count batch with SQL aggregate
status: completed
priority: P2
effort: 1h
depends: []
---

# Phase 01 — Replace tour-count batch with SQL aggregate

## Context Links
- Parent plan: `plans/260502-2124-getguides-tour-count-perf/plan.md`
- Target file: `apps/web/lib/api/get-guides.ts:137-154`
- Existing raw-SQL pattern: `apps/web/lib/ai/pgvector-semantic-search-service.ts:108-130`
- Payload Drizzle adapter docs: https://payloadcms.com/docs/database/postgres#accessing-the-database

## Overview
**Priority:** P2
**Brief:** Swap `payload.find({ collection: 'tours', limit: 0, ... })` followed by a client-side `for` loop for one Drizzle-template raw SQL `GROUP BY guide_id` query. Returns counts directly; no doc hydration.

## Key Insights
- The current batch query returns hundreds of rows + Payload doc shape just so we can `tourCountMap.set(gid, count + 1)`. Counts are <1% of payload size.
- `tours.guide` already has `index: true` (`packages/cms/collections/tours.ts:123`) → DB column `tours.guide_id` is indexed.
- `tours.status` already has `index: true` (`packages/cms/collections/tours.ts:200`) → covers the WHERE.
- Drizzle's `sql` template + `payload.db.drizzle.execute(...)` is the existing pattern (`pgvector-semantic-search-service.ts`).

## Requirements

### Functional
- `tourCountMap` populated with the same `Map<guideIdString, count>` shape as today.
- `mapGuideToListItem(doc, tourCountMap)` interface unchanged.
- Empty `guideIds` short-circuit preserved (no query when no guides).
- `getCachedGuides` (homepage) keeps working — it wraps the same `getGuides`.

### Non-functional
- `apps/web/lib/api/__tests__/get-guides.test.ts` passes unchanged. If a test mocks `payload.find` for the second query, it must be updated to mock the raw-SQL path instead.
- No new public exports.
- Keep the privacy invariant: only `guide_id` and `count` exit the query — no other tour fields read.

## Architecture

### Replacement code (sketch)

```ts
import { sql } from '@payloadcms/db-postgres'
// ... inside getGuides ...

const guideIds = result.docs.map((doc) => Number(doc.id))
const tourCountMap = new Map<string, number>()
if (guideIds.length > 0) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = payload.db as any
  const rows = await adapter.drizzle.execute(sql`
    SELECT guide_id::text AS guide_id, COUNT(*)::int AS count
    FROM tours
    WHERE status = 'published' AND guide_id = ANY(${guideIds})
    GROUP BY guide_id
  `)
  for (const row of rows.rows ?? rows) {
    tourCountMap.set(String(row.guide_id), Number(row.count))
  }
}
```

Notes:
- `guideIds` cast to `Number` because `tours.guide_id` is `integer` per migration `20260202_221539.ts` schema.
- `::text` cast on output so the Map key matches the existing `String(doc.id)` convention used by `mapGuideToListItem`.
- `rows.rows ?? rows` handles drizzle adapter result shape variance — same defensive read used in `pgvector-semantic-search-service.ts`.

### Why no transaction wrapping
Read-only count aggregate — no transaction needed; the surrounding `getGuides` is also non-transactional.

### Tour-count integrity edge cases
- Tour with `guide` pointing to a deleted guide: row would not match any `guideIds` in the page → ignored (correct).
- Tour with `status` other than `published`: filtered out by WHERE (correct, matches today's behavior).
- Tour created/edited mid-request: ineligible to read both guide page and aggregate atomically; same eventual-consistency window as today.

## Related Code Files

**Modified:**
- `apps/web/lib/api/get-guides.ts` — replace lines 137-154 (the second `payload.find` + loop).

**Tests:**
- `apps/web/lib/api/__tests__/get-guides.test.ts` — existing tests use real DB (integration). Should pass without modification. If any test stubs `payload.find` for the inner tours query, it needs to stub `payload.db.drizzle.execute` instead.

**Not modified:** all other code paths.

## Implementation Steps
1. Re-read `apps/web/lib/api/get-guides.ts:137-154` and `apps/web/lib/ai/pgvector-semantic-search-service.ts:108-130` to confirm import shape and `execute` API.
2. Verify column name: `psql $DATABASE_URL -c "\d tours" | grep -E "guide|status"` from a local dev shell. Expected: `guide_id integer`, `status varchar`.
3. Apply the replacement per Architecture sketch above.
4. `npm run test -- get-guides` (apps/web). All integration tests should pass.
5. `npm run type-check` — fix any drift.
6. Local smoke: `npm run dev`, hit `/sv/guides` and `/en/guides`. Tour counts on guide cards match expectations (compare to a single-guide query manually if uncertain).
7. Commit `perf(api): getGuides tour-count via SQL aggregate`.
8. Push → Vercel build picks up; existing `prebuild` runs `payload migrate` (no new migration here, just code).

## Todo List
- [x] Confirm `tours.guide_id` column name via `psql \d tours` — verified via migration 20260202_221539.ts
- [x] Confirm Drizzle `execute` shape via existing pgvector usage
- [x] Replace batch find with SQL aggregate
- [x] `npm run test -- get-guides` clean (10/10 pass)
- [x] `npm run type-check` clean
- [ ] Local smoke: tour counts render correctly on `/sv/guides`, `/en/guides` — deferred to user (requires commit push)
- [ ] Commit + push — deferred to user

## Success Criteria
- All existing tests pass without changes (or with minimal mock updates if any used `payload.find` stubs for tours).
- Local smoke: tour-count badges on `/guides` cards match pre-change values for ≥3 representative guides.
- TypeScript clean.

## Risk Assessment
- **Risk (LOW × MEDIUM):** Drizzle adapter `execute` API drift between Payload versions. **Mitigation:** mirror the exact import + result-handling shape used in `pgvector-semantic-search-service.ts` which is known-working in this repo.
- **Risk (LOW × LOW):** SQL injection via `guideIds`. **Mitigation:** `${guideIds}` is a parameterized binding through Drizzle's `sql` template — not string interpolation; values are bound as a numeric array.
- **Risk (LOW × LOW):** Type coercion mismatch (`Number(doc.id)` for guideIds). Payload returns numeric IDs as `number` for Postgres adapter. ✓
- **Risk (LOW × MEDIUM):** Test that mocks the inner `payload.find({collection:'tours', ...})` would break. **Mitigation:** check before merge; integration tests against a real DB are the bulk and unaffected.

**Rollback:** `git revert` of the single function change. No schema, no migration.

## Security Considerations
- Query reads only `guide_id` and `COUNT(*)` from `tours` — no PII exposure.
- Filter is `status='published'` (not unfiltered) — same visibility rules as today.
- Parameterized binding for `guideIds` prevents SQL injection.

## Next Steps
- Phase 02: re-measure on staging, strip listing instrumentation if gate passes.
