# Phase 01 — CMS Schema + Geo Cleanup

## Context Links

- `packages/cms/collections/tours.ts` — needs new `cities` field
- `packages/cms/collections/cities.ts` — Sigtuna + Uppsala seeded
- `packages/cms/collections/neighborhoods.ts` — re-parent rows where city changes
- `packages/cms/hooks/*` — confirm revalidate-tags fire on city change

## Overview

- **Priority:** P1 (blocks all later phases)
- **Status:** pending
- **Effort:** 2h
- **Description:** Add `cities` hasMany field on Tours collection. Seed Sigtuna and Uppsala as Cities. Re-parent neighborhoods that belong to the new cities.

## Key Insights

- `Cities` collection already supports the basic shape (`name`, `slug`, `country`, `coordinates`, `description`). No schema changes needed there.
- `Neighborhoods.city` is **required** — re-parenting `sigtuna` and `uppsala` (and their satellites like `gamla-uppsala`, `uppland`, `malardalen`) is straightforward.
- `Tours` schema currently lists `categories`, `neighborhoods` under `===== RELATIONSHIPS =====`. Insert `cities` immediately above `neighborhoods` to keep geo grouped.
- The Tours afterChange hook revalidates tag `tours` only. City changes already revalidate `guides`; need to add `tours` since Tour↔City is a new relation. Update `Cities.hooks.afterChange` accordingly.
- No localization on `cities` field admin label needed — Payload uses the relationship target's localized `name` automatically.

## Requirements

### Functional
- Add `cities` field on Tours: relationship → cities, hasMany, optional, indexed.
- Seed Cities: `sigtuna` (Sweden), `uppsala` (Sweden) with name + slug + country='Sweden'. Coordinates and description optional.
- Re-parent neighborhoods to their correct cities:
  - `sigtuna` → city = sigtuna (currently stockholm)
  - `uppsala`, `gamla-uppsala`, `uppland` → city = uppsala
  - `malardalen` — keep as Stockholm region neighborhood (Mälardalen valley); document the choice in the migration script comments
- Update `Cities.hooks.afterChange` and `afterDelete` to revalidate `['guides', 'tours']`.

### Non-Functional
- Backwards compatibility: existing `neighborhoods[]` field on Tours stays untouched in this phase. Phase 03 backfills `cities` from neighborhoods.
- Schema change must not break existing Payload migrations — Payload auto-generates a migration; review before commit.

## Architecture

```
Tours
  ├── categories[]      (existing)
  ├── cities[]          (NEW — hasMany, relationship → cities)
  └── neighborhoods[]   (existing)

Cities
  └── (no schema change; seed Sigtuna + Uppsala rows)

Neighborhoods
  └── city  (existing required field; re-parent some rows)
```

## Related Code Files

**Modify**
- `packages/cms/collections/tours.ts` — insert `cities` field
- `packages/cms/collections/cities.ts` — extend revalidate hook tags
- `packages/cms/collections/neighborhoods.ts` — no schema change; data update via SQL/Payload script

**Read for context**
- `packages/cms/hooks/index.ts`
- `packages/cms/migrations/` (Payload auto-generated dir)
- `apps/web/lib/api/get-tours.ts` — to confirm depth:2 covers new field

**Create**
- `scripts/seed-sigtuna-uppsala-cities.ts` — idempotent Payload Local API seeder

## Implementation Steps

1. Add `cities` field to `Tours.fields` between `categories` and `neighborhoods`:
   ```ts
   {
     name: 'cities',
     type: 'relationship',
     relationTo: 'cities',
     hasMany: true,
     index: true,
     admin: { description: 'Cities covered by this tour (multi-city day trips supported)' },
   },
   ```
2. Update `defaultColumns` on Tours admin to include `cities` if it improves admin scanability (optional, do if the column doesn't push the table too wide).
3. Run `npm run dev` once to let Payload generate a migration file. Inspect the SQL — confirm it creates a `tours_rels` row type for cities and an index on the new join column.
4. Edit `packages/cms/collections/cities.ts` hooks:
   ```ts
   afterChange: [createRevalidateTagsAfterChangeHook(['guides', 'tours'])],
   afterDelete: [createRevalidateTagsAfterDeleteHook(['guides', 'tours'])],
   ```
5. Create `scripts/seed-sigtuna-uppsala-cities.ts`:
   - Use Payload Local API.
   - Upsert by slug: `sigtuna` and `uppsala`.
   - Idempotent — re-running is a no-op if rows exist.
6. Run the seeder: `npx tsx scripts/seed-sigtuna-uppsala-cities.ts`.
7. Re-parent neighborhoods. Use a small TS script (under `scripts/repair-neighborhood-cities.ts`) that uses Payload Local API:
   - For each neighborhood slug in `['sigtuna']`, set `city` to the new sigtuna city ID.
   - For each in `['uppsala', 'gamla-uppsala', 'uppland']`, set `city` to the new uppsala city ID.
   - Dry-run mode prints diffs first; `--apply` performs the writes.
8. Run dry-run, paste output into PR description, then `--apply`.
9. `npm run type-check` and `npm run lint` clean.
10. Verify in admin UI: Tours edit page shows the new "Cities" relationship picker.

## Todo List

- [x] Add `cities` field on Tours
- [ ] Inspect auto-generated Payload migration (deferred — runtime; Payload auto-push applies on next boot)
- [x] Update Cities afterChange/afterDelete revalidation tags to include `tours`, `cities`
- [x] Write `scripts/seed-sigtuna-uppsala-cities.ts` (idempotent)
- [ ] Run seeder (runtime — user executes against DB)
- [x] Write `scripts/repair-neighborhood-cities.ts` with dry-run + apply modes
- [ ] Dry-run, capture output, then apply (runtime — user executes against DB)
- [ ] Verify admin UI renders new field (runtime)
- [x] `npm run type-check` clean (no new errors); Payload `payload-types.ts` regenerated with `cities` field

## Success Criteria

- `cities` table has 3 rows: `stockholm`, `sigtuna`, `uppsala`.
- `neighborhoods` rows for `sigtuna`, `uppsala`, `gamla-uppsala`, `uppland` reference the correct city IDs.
- Tours admin UI shows the new Cities picker; saving a tour with 0 or N cities works.
- Type-check and lint pass.

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Payload auto-migration creates unwanted columns | Inspect SQL before applying; manually edit if needed |
| Re-parenting breaks existing tour↔neighborhood embeddings | tours_rels still references neighborhood by ID; only city pointer changes |
| Idempotency bugs in seeder script | Always lookup by slug first; insert only if missing |

## Security Considerations

- Scripts run via `npx tsx` locally with the same DATABASE_URL — no auth changes.
- No public-facing surface change in this phase.

## Next Steps

→ Phase 02 (taxonomy mapping) can start in parallel once schema is in place; Phase 03 needs the seeded cities.
