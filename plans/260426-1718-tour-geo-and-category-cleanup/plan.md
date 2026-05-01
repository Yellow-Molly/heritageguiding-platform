---
title: "Tour Geo Relations + Category Taxonomy Cleanup"
description: "Add Tour↔City relationship, fix Sigtuna/Uppsala geo classification, redesign category taxonomy to remove location/duplicate noise, add city/neighborhood filters, replace footer Tours column with city listings."
status: done
priority: P1
effort: 11.5h
branch: master
tags: [cms, payload, taxonomy, filters, footer, migration, geo]
created: 2026-04-26
completed: 2026-04-26
blockedBy: []
blocks: []
---

# Tour Geo Relations + Category Taxonomy Cleanup

## Context

Current data model has two interconnected problems:

### Problem 1 — Tours have no direct City relationship

`Tours` collection has `categories[]` and `neighborhoods[]` only. Cities link only via `Neighborhood→City` (depth:2). Filter UI cannot filter by city, footer cannot list cities, and editorial control over the city dimension is impossible.

Aggravating fact: `cities` table has only `stockholm`. Tours that visit Sigtuna and Uppsala model those as Stockholm neighborhoods (`neighborhoods.city_id = 1`), which is wrong — they are independent cities reachable on day-trips.

### Problem 2 — Categories collection mixes themes, activities, cities, and neighborhoods

34 categories, with three classes of pollution:

- **Location-as-category (8 rows):** `stockholm`, `uppsala`, `sigtuna` (cities), `gamla-stan`, `stockholm-archipelago`, `vasa-museum`, `city-hall`, `day-trips-from-stockholm`, `stockholm-from-the-water` — all duplicate the geo dimension.
- **Theme duplicates:** `cultural-experience` / `cultural-heritage` / `cultural-tours` / `culture-history` (4 ways to say culture); `history` / `history-and-architecture` / `history-and-heritage` / `viking-history` / `pre-christian-scandinavia` / `academic-heritage` (6 history variants); `urban-geography` vs `local-life`.
- **Activity duplicates:** `boat-tours` / `rib-boat-tours`; `walking-tours` / `private-walking-tour` / `city-walk`; `private-tours` / `private-city-tour` / `private-day-tour` / `private-day-trips`.

This results in noisy filter dropdowns, confused editors, and category counts that lie.

## Goals

1. Tours have a first-class `cities` (hasMany) relationship; data backfilled from neighborhoods.
2. `Sigtuna` and `Uppsala` exist as proper Cities; their corresponding neighborhood rows reparented (or deleted if redundant).
3. Categories collection contains ONLY clean themes + activities (no locations, no duplicates). Tour↔category relations migrated to the new taxonomy.
4. Tours listing filter UI supports City + Neighborhood (alongside existing Categories, Duration, Accessibility). URL state shareable.
5. Footer "Tours" column shows Cities-with-tours instead of arbitrary featured tours.

## Non-Goals

- No changes to Bokun integration, pricing, or availability.
- No changes to tour content (titles, descriptions, images).
- No changes to Guides collection structure.
- No localization expansion beyond what's needed for new UI labels.

## Phases

| # | Phase | File | Status | Effort | Depends On |
|---|-------|------|--------|--------|------------|
| 1 | CMS schema + geo cleanup | [phase-01](phase-01-cms-schema-and-geo-cleanup.md) | done | 2h | — |
| 2 | New category taxonomy + mapping | [phase-02](phase-02-category-taxonomy-redesign.md) | done | 1.5h | 1 |
| 3 | Data migration script | [phase-03](phase-03-data-migration-script.md) | done (script applied to DB) | 3h | 1, 2 |
| 4 | City + Neighborhood filter UI | [phase-04](phase-04-filter-ui-city-neighborhood.md) | done | 2.5h | 1 |
| 5 | Footer Cities listing | [phase-05](phase-05-footer-cities-listing.md) | done | 1h | 1 |
| 6 | Tests + verification | [phase-06](phase-06-tests-and-verification.md) | done (manual checklist runtime) | 1.5h | 3, 4, 5 |

## Key Decisions (confirmed via interview, 2026-04-26)

- **Tour.cities**: `hasMany` relationship — tours like "Sigtuna heritage tour from Stockholm" need to belong to both cities.
- **Sigtuna + Uppsala promoted to Cities**: cleaner model; matches reality. Existing `sigtuna` and `uppsala` neighborhood rows will be reparented or merged with their new city counterparts.
- **Strict taxonomy**: location-named categories deleted. Duplicates merged. Final set defined in Phase 2 design doc.
- **Footer**: replaces featured-tour list with cities-with-tours; keeps "View all tours" link.

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Migration drops valid relations | High | Idempotent script with dry-run mode; pre-migration `pg_dump`; per-document writes survive partial failure (re-run resumes via idempotency, see Rollback) |
| Tours end up with 0 cities after backfill | High | Pre-flight check fails the script if any tour has 0 derivable cities; manual fix needed before apply |
| Cache stale after migration | Medium | Trigger `revalidateTag('tours' \| 'categories' \| 'guides' \| 'cities')` after script completes |
| ESLint / type errors from new field | Low | Run `npm run type-check` + `npm run lint` after schema change |
| New filter UX hard to discover | Medium | City + Neighborhood placed above Categories in sidebar; mobile drawer mirrors order |
| `gamla-stan` neighborhood vs `gamla-stan` category slug collision in URL params | Medium | Use distinct query param names (`cities=`, `neighborhoods=`, `categories=`) |

## Rollback

The migration script does NOT wrap writes in a single Postgres transaction —
each `payload.update`/`create`/`delete` is a discrete commit. Recovery on
partial failure relies on:

1. **Idempotent re-run.** `--apply` after a partial failure resumes safely:
   backfill skips matching tours; `ensureNewCategoriesExist` skips existing
   slugs; `rewriteTourCategoryRelations` preserves canonical slugs already
   in place; `deleteDeprecatedCategories` is no-op for already-deleted rows.
2. **`pg_dump` snapshot.** Take one before `--apply` (stored in this plan's
   `backups/` folder). Full restore is the disaster-recovery path.
3. **Code rollback.** `git revert` for schema + UI commits; the schema
   change is additive (new column) so revert doesn't lose data.

## Success Criteria

- [ ] All 10 published tours have ≥1 city.
- [ ] `categories` table contains 0 location-named entries.
- [ ] `categories` table has no semantic duplicates (validated against mapping doc).
- [ ] `/tours` page filters by `?cities=stockholm` and `?neighborhoods=gamla-stan` correctly.
- [ ] Footer "Tours" column lists cities with ≥1 published tour.
- [ ] All existing tests pass; new tests cover migration + filter logic.
- [ ] `npm run lint && npm run type-check && npm test` clean.

## Open Questions

- None at planning time — all 4 design decisions confirmed in interview.
