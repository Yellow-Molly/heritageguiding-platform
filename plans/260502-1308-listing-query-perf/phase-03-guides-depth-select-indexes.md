---
phase: 03
title: getGuides depth + select + missing indexes (R3)
status: done
priority: P2
effort: 1.5h
depends: []
---

# Phase 03 — `getGuides` depth + select + missing indexes (R3)

## Context Links
- Brainstorm § Recommended Path R3: `plans/reports/brainstorm-260502-1112-listing-query-perf.md`
- Baseline: `plans/260502-0048-instant-filter-feedback/baselines/guides-baseline-20260502.md`
- Mapper consumed fields: `apps/web/lib/api/get-guides.ts:62-92`
- Guides collection schema: `packages/cms/collections/guides.ts`
- Tours collection schema: `packages/cms/collections/tours.ts`
- Existing migration example: `packages/cms/migrations/20260203-add-pgvector-extension.ts`

## Overview
**Priority:** P2 (soft gate — `guides` p95 695 ms is in ship+follow-up band, not BLOCK; close it now while neighbouring R1/R2 are in-flight)
**Status:** pending
**Brief:** Drop `getGuides` `depth: 2` → `depth: 1`, add `select` projection, add `index: true` on `tours.categories` and `guides.status`, generate Payload migration, verify Postgres index reality.

## Key Insights
- `mapGuideToListItem` (`get-guides.ts:62-92`) consumes only: `id, name, slug, photo.{url, alt, blurDataUrl, sizes.thumbnail.url}, languages, additionalLanguages, specializations[].{id,name,slug}, operatingAreas[].{id,name,slug}, credentials[].credential, bio (richText for excerpt), yearsExperience`.
- Card extras: tour-count comes from separate batch query (`get-guides.ts:141-153`) — that path stays at `depth: 0` and is fast (<50 ms).
- DO NOT cache `getGuides` itself (brainstorm Bucket B rejected for guides) — filter cardinality (language ⊗ specialization ⊗ area ⊗ q ⊗ page) explodes with low hit rate.
- Indexes:
  - `tours.categories` lacks `index: true` in collection config — but the underlying DB index `tours_rels_categories_id_idx` ALREADY exists from the base migration (`apps/web/migrations/20260202_221539.ts:489`, full btree on `categories_id`). Adding `index: true` brings collection config into parity with DB reality; no new DDL needed.
  - `guides.status` lacks `index: true` (`guides.ts:56-69`) AND no DB index exists for it — this is the only genuine missing index. Migration creates `guides_status_idx`.
  - Open Q1+Q2: verify on staging via `psql \d` that `guides_status_idx` was applied and `tours_rels` already has `categories_id_idx`.

## Requirements
**Functional**
- `apps/web/lib/api/get-guides.ts:127`: `depth: 2` → `depth: 1`.
- `apps/web/lib/api/get-guides.ts:127`: add Payload `select` (see Architecture below).
- `packages/cms/collections/tours.ts:127-132`: add `index: true` to `categories` field.
- `packages/cms/collections/guides.ts:56-69`: add `index: true` to `status` field.
- Generate Payload migration via `npx payload migrate:create` from `packages/cms`.
- Verify Postgres index reality on staging via `psql \d` before relying on Payload behavior.

**Non-functional**
- `mapGuideToListItem` shape unchanged.
- `bioExcerpt` continues to extract from `bio` richText (must be in `select`).
- Tour-count batch query untouched.
- `email` and `phone` MUST stay excluded from `select` — privacy-critical (collection comment at `get-guides.ts:3`: "email and phone fields are NEVER exposed").

## Architecture

### Select projection for `getGuides` (Payload 3.81)
INCLUDE (set `true`):
- `id`, `name`, `slug`, `status`
- `photo` (relationship → media doc + sizes at depth:1)
- `bio` (richText — needed for `extractBioExcerpt`)
- `languages`, `additionalLanguages`
- `specializations` (relationship hasMany)
- `operatingAreas` (relationship hasMany)
- `credentials` (array)
- `yearsExperience`

EXCLUDE (omit):
- `email`, `phone` — **privacy-critical exclusion**
- `guideStyle`, `whatGuestsAppreciate`, `uniqueAspectsQuote`, `uniqueAspectsBody`, `specialtyDescriptions` (profile-section fields not consumed by listing card — owned by `guideProfileFields`, see `packages/cms/collections/fields/guide-profile-fields.ts`)
- `createdAt`, `updatedAt`

### Index additions
```ts
// packages/cms/collections/tours.ts:127-132
{
  name: 'categories',
  type: 'relationship',
  relationTo: 'categories',
  hasMany: true,
  index: true,                       // ← add
  admin: { description: '...' },
}

// packages/cms/collections/guides.ts:56-69
{
  name: 'status',
  type: 'select',
  required: true,
  defaultValue: 'active',
  index: true,                       // ← add
  options: [...],
  admin: { ... },
}
```

### Payload migration
- Run `cd packages/cms && npx payload migrate:create add-listing-query-indexes` (or equivalent project script).
- Migration name: `260502-add-listing-query-indexes.ts` (or whatever Payload generates — confirm format matches `20260203-add-pgvector-extension.ts`).
- Migration `up()` should issue `CREATE INDEX IF NOT EXISTS` for the two new indexes.
- Migration `down()` reverses with `DROP INDEX IF EXISTS`.
- If `payload migrate:create` does NOT auto-generate index DDL from collection-config diffs, hand-write the SQL — confirm with one round of dry-run.

### Postgres index reality verification (Open Q1+Q2)
Before merge, on staging:
```
psql $DATABASE_URL -c "\d tours" | grep -i index
psql $DATABASE_URL -c "\d guides" | grep -i index
psql $DATABASE_URL -c "\d tours_rels" | grep -i index
psql $DATABASE_URL -c "\d guides_rels" | grep -i index
```
Expected (per `tours.ts` / `guides.ts` `index: true` declarations):
- `tours`: `slug`, `guide`, `cities`, `bokunExperienceId`, `availability`, `featured`, `status`
- `guides`: `slug`, `specializations`, `operatingAreas`
- `tours_rels`, `guides_rels`: at minimum FK indexes on `parent_id` and the relation-target columns.

If FK indexes missing on `*_rels`: add explicit DDL to the same migration.

## Related Code Files
**Modified:**
- `apps/web/lib/api/get-guides.ts` — `payload.find` at line 127: drop `depth:2`→`depth:1`, add `select`.
- `packages/cms/collections/tours.ts` — add `index: true` to `categories` field (line ~127-132).
- `packages/cms/collections/guides.ts` — add `index: true` to `status` field (line ~56-69).

**Created:**
- `packages/cms/migrations/<timestamp>-add-listing-query-indexes.ts` — Payload migration.

**Deleted:** none.

## Implementation Steps
1. Read `mapGuideToListItem` at `get-guides.ts:62-92` to lock the field set.
2. Apply `select` + `depth: 1` to `payload.find` at `get-guides.ts:127`. Keep both `needsPostFilter` branches behavior identical (still pulls `limit:200` when filtering by spec/area; `select` reduces per-row cost).
3. Add `index: true` to `tours.categories` (`tours.ts:127-132`).
4. Add `index: true` to `guides.status` (`guides.ts:56-69`).
5. From `packages/cms`: `npx payload migrate:create add-listing-query-indexes`.
6. Inspect generated migration; if it does not include `CREATE INDEX` for the two new fields, hand-write the SQL inside `up()` / `down()` (see Architecture § migration template).
7. **On staging DB only**, verify current index state with `psql \d tours \d guides \d tours_rels \d guides_rels`. Capture output to migration PR description.
8. If `tours_rels` / `guides_rels` FK indexes are missing, add to same migration.
9. Run migration locally: `npx payload migrate` against dev DB.
10. Run typecheck: `npm run typecheck` (apps/web + packages/cms).
11. Run tests: `npm run test -- get-guides`.
12. Local smoke: `/sv/guides`, `/en/guides`, `/sv/guides?language=de&specialization=history-culture`, `/en/guides?area=stockholm`. Cards render identical, photos load, bio excerpt present.
13. Apply migration on staging via deploy pipeline or `npx payload migrate` (confirm project deployment pattern first).
14. Commit code changes + migration in two commits:
    - `perf(api): guides depth:1 + select projection (R3)`
    - `perf(db): index tours.categories and guides.status`

## Todo List
- [ ] Lock select field set against `mapGuideToListItem` (`get-guides.ts:62-92`)
- [ ] Apply `depth:1` + `select` to `get-guides.ts:127`
- [ ] Confirm `email`/`phone` excluded from `select`
- [ ] Add `index: true` to `tours.categories`
- [ ] Add `index: true` to `guides.status`
- [ ] `npx payload migrate:create add-listing-query-indexes` from `packages/cms`
- [ ] Inspect generated migration; hand-edit if `CREATE INDEX` not auto-generated
- [ ] **Verify Postgres index reality on staging via `psql \d`** (Open Q1+Q2)
- [ ] If `tours_rels`/`guides_rels` FK indexes missing, add to migration
- [ ] Run migration on dev DB; verify schema
- [ ] `npm run typecheck` clean
- [ ] `npm run test -- get-guides` passes
- [ ] Smoke 4 filter combos
- [ ] Apply migration on staging
- [ ] Commit code + migration (2 commits)

## Success Criteria
- Staging `getGuides` p95 (re-measured Phase 04): 695 ms → **<300 ms**.
- `\d tours_rels` / `\d guides_rels` confirm FK indexes exist (or are added by migration).
- All existing tests pass without modification.
- `mapGuideToListItem` output unchanged on /guides smoke.

## Risk Assessment
- **Risk (LOW × HIGH):** `select` accidentally includes `email` or `phone` — privacy regression. **Mitigation:** explicit field whitelist; integration test `get-guide-by-slug.test.ts` and `get-guides.test.ts` already assert these are absent (re-verify); code review checklist flags any change to the include list.
- **Risk (MEDIUM × LOW):** Payload `migrate:create` does not auto-generate index DDL on field-config changes (Payload 3.x behavior varies). **Mitigation:** hand-write `CREATE INDEX IF NOT EXISTS` in the migration `up()`; `\d` verification confirms reality regardless.
- **Risk (LOW × MEDIUM):** `bio` field still in `select` — large richText still hydrated. **Mitigation:** acceptable — needed for `bioExcerpt`; `select` still drops profile-section richText fields which are larger.
- **Risk (LOW × LOW):** Migration `down()` removes a pre-existing index inadvertently. **Mitigation:** `DROP INDEX IF EXISTS` only on indexes the migration created; never touch indexes auto-created by older migrations.

**Rollback:**
- Code: `git revert` of `get-guides.ts` change — independent of migration.
- Migration: `npx payload migrate:down` reverses index changes (`DROP INDEX`); zero data risk.

## Security Considerations
- **CRITICAL:** `select` MUST omit `email` and `phone`. The `Guides` collection comment at `get-guides.ts:3-4` explicitly states "email and phone fields are NEVER exposed". The mapper at `get-guides.ts:62-92` already enforces this — `select` reaffirms it at the query layer (defense in depth).
- No new endpoints, no new auth surface.
- Postgres indexes are not user-visible; no security delta.

## Next Steps
- Phase 04 re-measures all three queries.
- If gates pass, parent plan Phase 06 cleanup unblocks.
