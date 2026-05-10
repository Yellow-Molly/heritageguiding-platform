# Phase 04 — Tests, Docs, Final Validation

## Overview
- **Priority**: P1
- **Status**: pending
- **Effort**: S (1-2h)
- **Description**: Update affected unit tests, run full validation gates, update `docs/` for the schema/relationship change. Final manual smoke test on tour detail + admin UI.
- **Blocked by**: Phase 02 + Phase 03

## Key Insights
- Tests touching `tour.guide` or `guide_slug`: 5 files identified.
- `docs/system-architecture.md:386` documents the schema with `{ name: 'guide', type: 'relationship', relationTo: 'guides' }` — must update.
- `docs/project-changelog.md` needs a new entry once shipped.
- No test exists today for multi-guide; we add coverage for: multi-guide mapper output, CSV import multi-slug, get-guides aggregation across multi-guide tours.

## Requirements
- All existing tests pass
- New tests cover: mapper with N>1 guides, CSV import multi-slug parsing, schema.org provider as array
- Lint + type-check clean
- Manual smoke: 1-guide tour, 3-guide tour, edit-then-reorder in admin

## Related Code Files

### Modify (test files)
- `apps/web/lib/api/__tests__/get-tour-by-slug.test.ts` — line 27 (`'guide'` → `'guides'`), lines 64-69 (assert array)
- `apps/web/lib/api/__tests__/get-guide-by-slug.test.ts` — line 147 (`guide: { equals: '1' }` → `guides: { in: ['1'] }`)
- `packages/cms/__tests__/tour-csv-import-service.test.ts` — `guide_slug` → `guides_slugs`; expect array
- `packages/cms/__tests__/tour-csv-column-mapping.test.ts` — column-key + type expectations
- `packages/cms/__tests__/tour-csv-schema-validation.test.ts` — Zod schema field rename
- `packages/cms/__tests__/tour-excel-import-service.test.ts` — alias map + array expectations

### Add (new tests)
- New describe in `tour-csv-schema-validation.test.ts`: `'guides_slugs preprocessor splits semicolons and rejects empty array'`
- New describe in `tour-csv-import-service.test.ts`: `'imports multi-guide tour with semicolon-separated slugs'` + `'errors when any guide slug is missing'`
- New describe in `get-tour-by-slug.test.ts`: `'maps multiple guides preserving CMS order'`

### Modify (docs)
- `docs/system-architecture.md:386` — update Tours schema example to show `hasMany: true` for guides
- `docs/codebase-summary.md` — note hasMany guides in Tours collection summary
- `docs/project-changelog.md` — add 260510 entry under "Recent Changes"

## Implementation Steps

### Step 1 — Update existing tests

`apps/web/lib/api/__tests__/get-tour-by-slug.test.ts`:
```ts
// Line 27
expect(tour).toHaveProperty('guides')

// Lines 64-69
it('returns guides information', async () => {
  const tour = await getTourBySlug('test-slug')
  expect(Array.isArray(tour?.guides)).toBe(true)
  expect(tour?.guides.length).toBeGreaterThanOrEqual(1)
  expect(tour?.guides[0].name).toBeDefined()
  expect(tour?.guides[0].bio).toBeDefined()
  expect(tour?.guides[0].credentials).toBeInstanceOf(Array)
})
```

`apps/web/lib/api/__tests__/get-guide-by-slug.test.ts`:
```ts
// Line 147
expect.objectContaining({
  collection: 'tours',
  where: expect.objectContaining({
    guides: { in: ['1'] },
    status: { equals: 'published' },
  }),
}),
```

### Step 2 — Update CSV/Excel test fixtures + assertions

In each `packages/cms/__tests__/tour-csv-*.test.ts`:
- Replace fixture row keys: `guide_slug: 'anna-lindberg'` → `guides_slugs: ['anna-lindberg']` (or pass raw `'anna-lindberg'` to test preprocessor branch)
- Replace assertion: `relationships.guideId` → `relationships.guideIds`
- Update Excel header alias test: assert that both `guide` and `guides` map to `guides_slugs`

### Step 3 — Add new test cases

```ts
// tour-csv-schema-validation.test.ts
describe('guides_slugs preprocessor', () => {
  it('splits semicolon-separated string into array', () => {
    const result = tourCSVRowSchema.parse({ ...validRow, guides_slugs: 'anna;erik' })
    expect(result.guides_slugs).toEqual(['anna', 'erik'])
  })

  it('accepts pre-split array unchanged', () => {
    const result = tourCSVRowSchema.parse({ ...validRow, guides_slugs: ['anna', 'erik'] })
    expect(result.guides_slugs).toEqual(['anna', 'erik'])
  })

  it('trims whitespace and drops empty entries', () => {
    const result = tourCSVRowSchema.parse({ ...validRow, guides_slugs: ' anna ; ; erik ' })
    expect(result.guides_slugs).toEqual(['anna', 'erik'])
  })

  it('rejects empty array', () => {
    expect(() => tourCSVRowSchema.parse({ ...validRow, guides_slugs: [] })).toThrow(/at least one/i)
  })
})

// tour-csv-import-service.test.ts
it('imports multi-guide tour with semicolon-separated slugs', async () => {
  // mock guideMap with two slugs; row has 'anna;erik'
  // assert csvRowToTourData called with guideIds.length === 2 in correct order
})

it('returns error listing all missing guide slugs', async () => {
  // mock guideMap with only 'anna'; row has 'anna;erik;maria'
  // assert error.message contains 'erik' and 'maria'
})

// get-tour-by-slug.test.ts
it('maps multiple guides preserving CMS order', async () => {
  // mock payload result with two guides in array
  // assert tour.guides[0].id and tour.guides[1].id match CMS order
})
```

### Step 4 — Update docs

`docs/system-architecture.md:386` (Tours schema):
```ts
{ name: 'guides', type: 'relationship', relationTo: 'guides', hasMany: true, required: true, minRows: 1 },
```

`docs/codebase-summary.md`:
- In the Tours collection bullet list, note: "Guides: hasMany relationship (≥1 required); junction stored in `tours_rels` with path='guides'"

`docs/project-changelog.md` — prepend under Recent Changes:
```md
### Multi-Guide Tours (2026-05-10)
**Plan:** `plans/260510-2342-multi-guide-tours/`
- Tour `guide` (single) → `guides` (hasMany, min 1)
- DB migration: backfilled existing `tours.guide_id` into `tours_rels` (path='guides') then dropped column
- Tour detail page renders stacked guide cards with pluralized "Your Guide(s)" heading
- Schema.org `provider` emits Person array when multiple guides
- CSV/Excel: column renamed `guide` → `guides`, semicolon-separated slugs (legacy `guide` header still accepted for one release)
- get-guides.ts SQL rewritten to aggregate via tours_rels junction
```

### Step 5 — Run full validation gates

```bash
npm run type-check
npm run lint
npm test
npm run build           # full Next + Payload build
```

### Step 6 — Manual smoke test checklist

| Scenario | Expected | Pass? |
|----------|----------|-------|
| Open existing 1-guide tour at `/sv/tours/{slug}` | Heading "Din guide", one card | |
| Same tour at `/en/...` | Heading "Your Guide" | |
| Same tour at `/de/...` | Heading "Ihr Guide" | |
| Edit tour in admin → add 2nd guide → save | Both guides appear stacked on detail page | |
| Reorder guides via drag in admin | Order persists; reflected on detail page after save | |
| 3-guide tour | Heading "Your Guides"; 3 cards stacked | |
| Schema.org JSON-LD for 2-guide tour | `provider` is array of 2 Person objects | |
| Visit `/guides/{secondary-guide-slug}` | Tour where this guide is secondary appears in their tour list | |
| Trigger CSV export from admin | `guides` column populated (semicolon list for multi) | |
| Re-import that CSV | All tours preserve original guide assignments | |
| Try saving a tour with empty guides field | Validation error "At least one guide required" | |

## Todo List
- [ ] Update `get-tour-by-slug.test.ts` (rename + array assertions)
- [ ] Update `get-guide-by-slug.test.ts` (where clause)
- [ ] Update `tour-csv-import-service.test.ts` fixtures
- [ ] Update `tour-csv-column-mapping.test.ts` expectations
- [ ] Update `tour-csv-schema-validation.test.ts` field rename
- [ ] Update `tour-excel-import-service.test.ts` (alias map + array)
- [ ] Add new tests: preprocessor branches, multi-guide import, mapper order
- [ ] Update `docs/system-architecture.md` schema example
- [ ] Update `docs/codebase-summary.md` Tours bullet
- [ ] Add `docs/project-changelog.md` entry
- [ ] Run `npm run type-check && npm run lint && npm test && npm run build` clean
- [ ] Walk through manual smoke checklist

## Success Criteria
- All tests pass; coverage on new code paths matches workspace baseline (>80%)
- Build succeeds without warnings related to renamed fields
- Manual smoke checklist 100% pass
- Docs reflect new schema; changelog entry added

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Snapshot tests break due to JSON-LD shape change | Medium | Low | Update snapshots; verify by hand-reading generated JSON |
| Test mocks for Payload `where.guides.in` operator drift from real Payload behavior | Medium | Medium | One smoke test against real local DB after migration confirms mock validity |
| Lint flags unused legacy types (e.g., `PayloadGuide` if old single-guide branch removed) | Low | Low | Strip unused exports during cleanup |

## Security Considerations
- No new auth/access surface introduced in this phase
- Validation gates ensure no insecure code patterns regressed

## Next Steps
- Merge to master after validation gates pass
- Monitor `[Embedding Hook]` logs for any unexpected errors on first save
- Follow up: optional Phase 05 (out of scope) — add a `beforeDelete` hook on `Guides` collection that blocks deletion if guide is the *only* guide on any tour (currently FK cascade silently allows it)
