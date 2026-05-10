---
name: Multi-Guide Tours
slug: 260510-2342-multi-guide-tours
status: completed
created: 2026-05-10
completed: 2026-05-11
branch: master
priority: medium
effort: medium
mode: auto
blockedBy: []
blocks: []
relatedPlans: []
---

# Multi-Guide Tours

## Goal
Convert `tours.guide` (single relationship, required) → `tours.guides` (hasMany, min 1) so a tour can be linked to multiple guides. Migrate existing single-guide data into the new junction storage with no data loss. Update every consumer of `tour.guide` end-to-end (frontend mapper, tour detail UI, schema.org JSON-LD, CSV/Excel pipelines, raw-SQL tour-count aggregation, tests, docs).

## Locked Decisions (validated 2026-05-10)
| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Rename field `guide` → `guides` (hasMany) | Clearer semantics; matches existing `categories`/`cities` plural hasMany pattern |
| 2 | Required, min 1 | Preserves current invariant: every published tour has ≥1 guide |
| 3 | UI = stacked vertical guide cards | Reuse `GuideCard`, just `.map()`. Heading switches to "Your Guides" when length > 1 (i18n key updated) |
| 4 | CSV/Excel: rename column `guide` → `guides`, semicolon-separated slugs | Matches `categories`/`neighborhoods` pattern. Importer accepts single slug for backward compat |
| 5 | No "primary" guide concept | Order in array determines display order; admin can drag-reorder in Payload UI |

## Out of Scope
- Per-guide availability scheduling (still tour-level)
- Guide-specific pricing on a tour
- Bokun integration changes (bookings still attached to tour, not guides)
- Tour embedding regeneration content change (embedding doesn't include guide name today; no need to add)

## Context Inputs
- Current schema: `packages/cms/collections/tours.ts:118-125` — `guide` field
- Current frontend mapper: `apps/web/lib/api/tour-payload-mapper.ts:280-301` (single guide block)
- Tour detail render: `apps/web/app/(site)/[locale]/(frontend)/tours/[slug]/page.tsx:82`
- Schema.org provider: `apps/web/components/tour/tour-schema.tsx:42-49`
- Guide-by-slug tour list: `apps/web/lib/api/get-guide-by-slug.ts:67-77` (uses `guide: { equals: doc.id }`)
- Raw SQL tour-count aggregation: `apps/web/lib/api/get-guides.ts:157-176` (queries `tours.guide_id` directly — must change to junction-table query)
- CSV column mapping: `packages/cms/lib/csv/tour-csv-column-mapping.ts:96, 519`
- CSV import service: `packages/cms/lib/csv/tour-csv-import-service.ts:86-185`
- Excel import service: `packages/cms/lib/excel/tour-excel-import-service.ts:89-206`
- CSV schema: `packages/cms/lib/csv/tour-csv-schema-validation.ts:67`
- Initial migration (single-guide FK): `apps/web/migrations/20260202_221539.ts:156, 413`

## Phases

| # | Phase | Status | Effort |
|---|-------|--------|--------|
| 1 | [CMS schema + DB migration + data backfill](./phase-01-cms-schema-and-migration.md) | completed | M |
| 2 | [Frontend types, mapper, UI, schema.org](./phase-02-frontend-rendering.md) | completed | S |
| 3 | [Backend queries + CSV/Excel pipelines](./phase-03-backend-pipelines.md) | completed | M |
| 4 | [Tests, docs, validation](./phase-04-tests-and-docs.md) | completed | S |

## Key Risks
- **DB migration data loss**: Existing `tours.guide_id` values must be backfilled into `tours_rels` (path='guides') before dropping the column. Single transaction — abort + rollback if any tour ends up with 0 guides.
- **Raw SQL in `get-guides.ts`**: Aggregates published tour counts from `tours.guide_id`. Must rewrite as a join over `tours_rels` (path='guides') × tours.status. Performance-sensitive — add index `tours_rels (path, guides_id) WHERE path='guides'`.
- **CSV/Excel backward compatibility**: Existing exports use `guide` column header. Keep importer accepting both `guide` and `guides` aliases for one release cycle.
- **Cache invalidation**: Both `tours` and `guides` tags must invalidate on any guide-relationship change (afterChange hook in tours already revalidates tours; guide afterChange already revalidates both — no change needed).
- **Min-1 enforcement**: Payload `hasMany` + `required: true` enforces at least one entry, but verify with a custom validation message.

## Success Criteria
- Tour detail page shows N guide cards stacked when tour has N guides; heading "Your Guide" (n=1) / "Your Guides" (n>1) localized SV/EN/DE
- Admin UI lets editor add/remove/reorder multiple guides on a tour
- Existing tours render identically (no visual regression for single-guide tours)
- Migration up/down runs cleanly on staging with no data loss
- `get-guide-by-slug` still returns the correct tour list for guides newly assigned as secondary on a tour
- CSV roundtrip (export → re-import) preserves multi-guide data
- All tests pass; type-check + lint clean
- `/api/revalidate` still triggers on guide & tour changes

## Validation Gates
- Local: `npm run type-check && npm run lint && npm test`
- Manual: 1-guide tour, 2-guide tour, 3-guide tour each render correctly on `/sv/tours/{slug}`, `/en/...`, `/de/...`
- Admin: Reorder guides → save → confirm display order matches
- CSV: Export a multi-guide tour → reimport → diff fields

## Open Questions
None at planning time. (Resolved during scope challenge: field rename, required-min-1, vertical stack, semicolon CSV.)
