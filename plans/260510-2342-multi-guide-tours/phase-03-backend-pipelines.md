# Phase 03 — Backend Queries + CSV/Excel Pipelines

## Overview
- **Priority**: P0 (parallelizable with Phase 02 once Phase 01 lands)
- **Status**: pending
- **Effort**: M (2-3h)
- **Description**: Update backend queries and import/export pipelines for the new junction storage. Three workstreams: (1) `get-guide-by-slug.ts` Payload `where` clause, (2) `get-guides.ts` raw-SQL aggregation rewrite, (3) CSV/Excel column rename + multi-slug parsing.
- **Blocked by**: Phase 01 (DB schema must match)

## Key Insights
- Payload `where` syntax for hasMany relationships: `guides: { in: [doc.id] }` or `guides: { contains: doc.id }` — verify which Payload v3.81 supports. Easier path: query `tours_rels` directly via raw SQL when we already have the guide ID, OR use Payload's `where: { 'guides.id': { equals: doc.id } }` deep filter (works if Payload joins automatically).
- `get-guides.ts:165-176` aggregates published-tour counts grouped by guide. Must change from `tours.guide_id` (column) → `tours_rels` (junction) joined with `tours.status`.
- CSV `guide` column today expects exactly one slug. Migration: rename to `guides`, parse semicolon-separated list. Accept legacy `guide` column header (with single slug) for one release for backward compatibility.
- Excel import already has alias logic (`guide` → `guide_slug`); extend it to support `guides` → `guides_slugs`.
- The Zod schema `guide_slug: z.string().min(1)` becomes `guides_slugs: z.array(z.string().min(1)).min(1)`.
- `revalidate-cache-tags-hook` already invalidates both `tours` and `guides` tags on Tour upsert (no change needed).

## Requirements

### Functional
- `getGuideBySlug(slug)` returns the guide AND any tour where this guide appears in the `guides` array (regardless of position)
- `getGuides()` returns each guide with `tourCount` reflecting all published tours where the guide appears
- CSV/Excel import: a row with `guides=anna-lindberg;erik-svensson` resolves to two guide IDs and links them to the tour in that order
- CSV/Excel export: a tour with N guides emits semicolon-joined slugs in the `guides` column
- Importer accepts legacy `guide` (single slug) header for backward compatibility, with deprecation warning logged

### Non-Functional
- `get-guides.ts` SQL aggregation latency stays within current p95 (<50ms for ~50 guides) — junction table already indexed (we add `tours_rels (path, guides_id)` index in Phase 01)
- Roundtrip CSV export → import preserves multi-guide assignments and order

## Architecture

### `get-guides.ts` SQL rewrite
```sql
-- BEFORE
SELECT guide_id::text AS guide_id, COUNT(*)::int AS count
FROM tours
WHERE status = 'published' AND guide_id IN (...)
GROUP BY guide_id

-- AFTER
SELECT r.guides_id::text AS guide_id, COUNT(DISTINCT t.id)::int AS count
FROM tours_rels r
JOIN tours t ON t.id = r.parent_id
WHERE r.path = 'guides'
  AND r.guides_id IN (...)
  AND t.status = 'published'
GROUP BY r.guides_id
```
`COUNT(DISTINCT t.id)` defends against the (unlikely) case where the same guide appears twice on the same tour due to data error.

### CSV column model
```
csvColumn: 'guides' (was 'guide')
type: 'relationshipMany'  (was 'relationship')
label: 'Guides (slugs)'   (was 'Guide (slug)')
```
The `relationshipMany` mapping type already exists for `categories` and `neighborhoods` — same parsing path applies.

## Related Code Files

### Modify
- `apps/web/lib/api/get-guide-by-slug.ts:67-77` — change `where: { guide: { equals: doc.id } }` → multi-relationship filter
- `apps/web/lib/api/get-guides.ts:157-176` — rewrite raw SQL aggregation
- `apps/web/lib/api/__tests__/get-guide-by-slug.test.ts:147` — update mock expectation (test only — defer detail to Phase 04)
- `packages/cms/lib/csv/tour-csv-column-mapping.ts:96` — change to `relationshipMany`, rename column
- `packages/cms/lib/csv/tour-csv-column-mapping.ts:393-397, 519` — `CSVImportRelationships.guideId` → `guideIds: (string|number)[]`; `guide: relationships.guideIds`
- `packages/cms/lib/csv/tour-csv-import-service.ts:86-185` — rename `guide_slug` → `guides_slugs`, parse semicolon list, lookup multiple
- `packages/cms/lib/excel/tour-excel-import-service.ts:89-206` — same parsing; extend alias map (`guide` → `guides_slugs` legacy, `guides` → `guides_slugs`)
- `packages/cms/lib/csv/tour-csv-schema-validation.ts:67` — Zod schema: `guides_slugs: z.array(z.string().min(1)).min(1, 'At least one guide slug required')`

### Read for Context
- `packages/cms/lib/csv/tour-csv-export-service.ts:29` — depth:2 already populates relationships
- `packages/cms/lib/csv/tour-csv-import-service.ts:86-185` — full import flow

## Implementation Steps

### Step 1 — Update `get-guide-by-slug.ts`

```ts
// Replace lines 67-77
const toursResult = await payload.find({
  collection: 'tours',
  where: {
    guides: { in: [doc.id] },          // Payload hasMany filter
    status: { equals: 'published' },
  },
  depth: 2,
  locale: locale as 'sv' | 'en' | 'de',
  limit: 20,
  sort: '-createdAt',
})
```

Verify the `in` operator works on hasMany relationship in Payload 3.81. Fallback: use raw SQL or `where: { 'guides.id': { equals: doc.id } }`.

### Step 2 — Rewrite `get-guides.ts` SQL aggregation

Replace lines 157-176:

```ts
// Aggregate published tour counts per guide via tours_rels junction.
// Switched from tours.guide_id (legacy single-relationship column, dropped
// in 260510 migration) to the hasMany junction table.
const guideIds = result.docs.map((doc) => Number(doc.id)).filter((n) => Number.isFinite(n))
const tourCountMap = new Map<string, number>()
if (guideIds.length > 0) {
  const drizzle = (payload.db as unknown as { drizzle: DrizzleDB }).drizzle
  const idList = sql.join(guideIds.map((id) => sql`${id}`), sql`, `)
  const tourCounts = await drizzle.execute(sql`
    SELECT r.guides_id::text AS guide_id, COUNT(DISTINCT t.id)::int AS count
    FROM tours_rels r
    JOIN tours t ON t.id = r.parent_id
    WHERE r.path = 'guides'
      AND r.guides_id IN (${idList})
      AND t.status = 'published'
    GROUP BY r.guides_id
  `)
  for (const row of tourCounts.rows) {
    tourCountMap.set(String(row.guide_id), Number(row.count))
  }
}
```

### Step 3 — Update CSV column mapping (`packages/cms/lib/csv/tour-csv-column-mapping.ts`)

Line 96:
```ts
{ csvColumn: 'guides', tourPath: 'guides', type: 'relationshipMany', label: 'Guides (slugs)' },
```

Lines 393-397 (`CSVImportRelationships`):
```ts
export interface CSVImportRelationships {
  guideIds: (string | number)[]
  categoryIds: (string | number)[]
  neighborhoodIds: (string | number)[]
}
```

Line 519 (`csvRowToTourData` return):
```ts
guides: relationships.guideIds,
```

### Step 4 — Update Zod schema (`packages/cms/lib/csv/tour-csv-schema-validation.ts`)

Line 67:
```ts
// Replace
guide_slug: z.string().min(1, 'Guide slug is required'),

// With (preprocessor splits semicolon string OR accepts array)
guides_slugs: z.preprocess(
  (val) => {
    if (typeof val === 'string') return val.split(';').map((s) => s.trim()).filter(Boolean)
    if (Array.isArray(val)) return val
    return val
  },
  z.array(z.string().min(1)).min(1, 'At least one guide slug is required')
),
```

### Step 5 — Update CSV import service (`packages/cms/lib/csv/tour-csv-import-service.ts`)

Replace lines 86-185 region. Key changes:

```ts
// Pre-fetch guides for relationship resolution
const { docs: guides } = await payload.find({
  collection: 'guides',
  limit: 1000,
})
const guideMap = new Map(guides.map((g) => [g.slug, g.id]))

// ... later, where guide_slug was resolved:

// Resolve guide relationships (multi)
const guideSlugs: string[] = data.guides_slugs || []
const guideIds: (string | number)[] = []
const missingSlugs: string[] = []
for (const slug of guideSlugs) {
  const id = guideMap.get(slug)
  if (id) guideIds.push(id)
  else missingSlugs.push(slug)
}
if (missingSlugs.length > 0) {
  errors.push({
    row: rowNum,
    field: 'guides_slugs',
    message: `Guide slug(s) not found: ${missingSlugs.join(', ')}`,
  })
  continue
}
if (guideIds.length === 0) {
  errors.push({
    row: rowNum,
    field: 'guides_slugs',
    message: 'At least one guide slug is required',
  })
  continue
}

// ... when calling csvRowToTourData:
const tourData = csvRowToTourData(data, { guideIds, categoryIds, neighborhoodIds })
```

### Step 6 — Update Excel import service (`packages/cms/lib/excel/tour-excel-import-service.ts`)

Extend `COLUMN_KEY_ALIASES` at line 90:

```ts
const COLUMN_KEY_ALIASES: Record<string, string> = {
  guide: 'guides_slugs',    // legacy single-slug column header (backward-compat for one release)
  guides: 'guides_slugs',   // new multi-slug column header
}
```

Mirror the multi-guide resolution logic from CSV import service (Step 5).

### Step 7 — Verify CSV/Excel export

`tour-csv-export-service.ts:29` already uses `depth:2`, so `tour.guides` will be a populated array. Confirm the column-mapping serializer for `relationshipMany` already handles arrays (it does, for categories/neighborhoods). The `guides` column will emit semicolon-joined slugs out of the box.

Smoke test:
```bash
# In admin: trigger CSV export → open file → verify `guides` column shows semicolon list
# Then re-import the same file → verify all tours preserve their guide assignments
```

## Todo List
- [ ] Update `get-guide-by-slug.ts` `where` clause for hasMany filter
- [ ] Verify Payload 3.81 `where: { guides: { in: [...] } }` operator support; fallback to deep `'guides.id'` if needed
- [ ] Rewrite `get-guides.ts` raw SQL aggregation (junction join + DISTINCT)
- [ ] Update `tour-csv-column-mapping.ts` (column rename + type change)
- [ ] Update `CSVImportRelationships.guideId` → `guideIds`
- [ ] Update `csvRowToTourData` to map `guides: relationships.guideIds`
- [ ] Update Zod schema in `tour-csv-schema-validation.ts` (preprocessor + array)
- [ ] Update CSV import service: parse `guides_slugs`, resolve multiple, error on missing
- [ ] Update Excel import service: alias map + same parsing
- [ ] Smoke test CSV export/import roundtrip on a multi-guide tour
- [ ] Test legacy CSV (single-slug `guide` column) still imports successfully

## Success Criteria
- `getGuideBySlug('anna-lindberg')` returns Anna's profile + every published tour where Anna is in the `guides` list (primary or secondary)
- `getGuides()` returns Erik with `tourCount=2` if Erik appears on two published tours (regardless of being primary or secondary on each)
- CSV export of a 2-guide tour shows `anna-lindberg;erik-svensson` in `guides` column
- CSV import of `guides=anna-lindberg;erik-svensson` creates a tour with both guides linked, in that order
- CSV import of legacy `guide=anna-lindberg` (single-slug, old column header) still works (deprecation warning logged)
- CSV import of `guides=non-existent-slug` returns a clear error with the missing slug listed
- Empty `guides` cell triggers Zod validation error (`At least one guide slug is required`)
- `npm run type-check` clean across both `apps/web` and `packages/cms`

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Payload `where: { guides: { in: [...] } }` not supported | Low | High | Verify on local first; fallback to `where: { 'guides.id': { equals: id } }` or raw SQL via drizzle |
| Junction-table query slower than column scan | Low | Medium | Index on `tours_rels (path, guides_id)` added in Phase 01; `EXPLAIN` after migration |
| Existing CSV exports break re-import (column header changed) | Medium | Low | Alias `guide` → `guides_slugs` keeps legacy headers working |
| Multi-slug CSV cell with leading/trailing whitespace fails | Medium | Low | Preprocessor trims each slug |
| Excel column-key mismatch between `guide` and `guides` | Medium | Low | Alias map handles both |

## Security Considerations
- Raw SQL uses Drizzle parameterized templates — no injection risk
- CSV import already validated by `isAdmin` access control upstream
- No new public-API endpoint introduced

## Next Steps
- Phase 04 (tests + docs) verifies the refactor end-to-end
