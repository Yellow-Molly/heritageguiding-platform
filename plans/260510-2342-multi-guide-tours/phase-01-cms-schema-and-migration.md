# Phase 01 — CMS Schema Update + DB Migration + Data Backfill

## Overview
- **Priority**: P0 — blocks all other phases
- **Status**: pending
- **Effort**: M (2-3h)
- **Description**: Change `tours.guide` (single relationship, required, FK on `tours.guide_id`) → `tours.guides` (hasMany, required min 1, junction rows in `tours_rels` with `path='guides'`). Backfill existing data and drop legacy column.

## Key Insights
- Payload Postgres adapter stores hasMany relationships in the `{collection}_rels` table. `tours_rels` already holds `categories_id`, `neighborhoods_id`, `cities_id`. We add `guides_id`.
- Each row in `tours_rels` represents one relationship edge: `(parent_id=tour.id, path='guides', guides_id=guide.id, order=N)`.
- Single relationship is stored on the parent table (`tours.guide_id`). After conversion, this column is removed.
- Existing initial migration: `apps/web/migrations/20260202_221539.ts:156, 413` (column + FK on `tours.guide_id`).
- Pattern reference: `apps/web/migrations/20260501_083209_add_tours_cities_relation.ts` (adding `cities_id` to `tours_rels` for a similar conversion).
- Migration must be **atomic** — wrap up() in a single transaction so a partial backfill cannot leave tours with zero guides.

## Requirements

### Functional
- Tour authors can add ≥1 guide and reorder them in admin UI
- Existing tour-guide assignments survive migration with identical (tour, guide) pairs
- `required: true` validation rejects saves with empty `guides` array

### Non-Functional
- Migration completes in <30s on production-size data (~hundreds of tours)
- `down()` migration restores `guide_id` column from first row in junction (data lossy on multi-guide tours; document this in migration comment)
- Index on `tours_rels (path, guides_id)` matches existing pattern (e.g., `tours_rels_categories_id_idx`)

## Architecture

### Before
```
tours
├── id
├── guide_id  (FK → guides.id, NOT NULL)
└── ...

tours_rels
├── parent_id  (tour)
├── path       ('categories' | 'neighborhoods' | 'cities')
├── categories_id
├── neighborhoods_id
└── cities_id
```

### After
```
tours
├── id
└── ...                  (no guide_id column)

tours_rels
├── parent_id
├── path                 ('categories' | 'neighborhoods' | 'cities' | 'guides')
├── order                (drives admin display order for guides)
├── categories_id
├── neighborhoods_id
├── cities_id
└── guides_id            (NEW)
```

## Related Code Files

### Modify
- `packages/cms/collections/tours.ts` — replace single `guide` field with hasMany `guides` (lines 118-125)

### Create
- `apps/web/migrations/{TIMESTAMP}_convert_tour_guide_to_hasmany.ts` — schema + backfill + drop column

### Read for Context
- `packages/cms/collections/tours.ts` (entire file, especially comment at line 25-29 about cascade delete)
- `apps/web/migrations/20260501_083209_add_tours_cities_relation.ts`
- `apps/web/migrations/20260202_221539.ts:156, 187-194, 413, 489-490`

## Implementation Steps

### Step 1 — Update Payload schema (`packages/cms/collections/tours.ts`)

Replace lines 118-125:

```ts
// BEFORE
{
  name: 'guide',
  type: 'relationship',
  relationTo: 'guides',
  required: true,
  index: true,
  admin: { description: 'Tour guide/expert' },
},

// AFTER
{
  name: 'guides',
  type: 'relationship',
  relationTo: 'guides',
  hasMany: true,
  required: true,
  index: true,
  minRows: 1,
  admin: {
    description: 'Tour guides/experts (1+). Drag to reorder.',
  },
},
```

Update `defaultColumns` at line 34: replace `'guide'` with `'guides'`.

### Step 2 — Generate migration via Payload CLI

```bash
cd apps/web
npx payload migrate:create convert-tour-guide-to-hasmany
```

Payload generates SQL diff. **Review carefully** — it will likely:
- Add `guides_id` column to `tours_rels`
- Add FK + index for `tours_rels.guides_id`
- Drop `tours.guide_id` (FK + column)

It will **NOT** auto-generate data backfill. We must add it manually between the schema additions and the column drop.

### Step 3 — Augment generated migration with atomic backfill

Final structure of the generated `.ts` migration:

```ts
import { sql } from '@payloadcms/db-postgres'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up({ db }: { db: any }): Promise<void> {
  await db.execute(sql`
    BEGIN;

    -- 1. Add new column + FK + index in tours_rels
    ALTER TABLE "tours_rels" ADD COLUMN "guides_id" integer;
    ALTER TABLE "tours_rels"
      ADD CONSTRAINT "tours_rels_guides_fk"
      FOREIGN KEY ("guides_id") REFERENCES "public"."guides"("id")
      ON DELETE cascade ON UPDATE no action;
    CREATE INDEX "tours_rels_guides_id_idx" ON "tours_rels" USING btree ("guides_id");

    -- 2. Backfill: copy each tour's existing guide_id into tours_rels with path='guides', order=0
    INSERT INTO "tours_rels" ("parent_id", "path", "order", "guides_id")
    SELECT id, 'guides', 0, guide_id
    FROM "tours"
    WHERE guide_id IS NOT NULL;

    -- 3. Sanity check: every tour now has at least one row in tours_rels with path='guides'
    DO $$
    DECLARE
      missing_count integer;
    BEGIN
      SELECT COUNT(*) INTO missing_count
      FROM "tours" t
      WHERE NOT EXISTS (
        SELECT 1 FROM "tours_rels" r
        WHERE r.parent_id = t.id AND r.path = 'guides'
      );
      IF missing_count > 0 THEN
        RAISE EXCEPTION 'Backfill incomplete: % tours still have no guides', missing_count;
      END IF;
    END $$;

    -- 4. Drop legacy single-relationship FK + column
    ALTER TABLE "tours" DROP CONSTRAINT IF EXISTS "tours_guide_id_guides_id_fk";
    DROP INDEX IF EXISTS "tours_guide_id_idx";
    ALTER TABLE "tours" DROP COLUMN IF EXISTS "guide_id";

    COMMIT;
  `)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down({ db }: { db: any }): Promise<void> {
  await db.execute(sql`
    BEGIN;

    -- 1. Re-add guide_id column (nullable initially for backfill)
    ALTER TABLE "tours" ADD COLUMN "guide_id" integer;

    -- 2. Backfill from FIRST guide of each tour (lowest order). NOTE: multi-guide
    --    tours will lose their additional guides — this is documented data loss
    --    on rollback.
    UPDATE "tours" t
    SET guide_id = (
      SELECT r.guides_id FROM "tours_rels" r
      WHERE r.parent_id = t.id AND r.path = 'guides' AND r.guides_id IS NOT NULL
      ORDER BY r."order" ASC, r.id ASC
      LIMIT 1
    );

    -- 3. Restore NOT NULL + FK + index
    ALTER TABLE "tours" ALTER COLUMN "guide_id" SET NOT NULL;
    ALTER TABLE "tours"
      ADD CONSTRAINT "tours_guide_id_guides_id_fk"
      FOREIGN KEY ("guide_id") REFERENCES "public"."guides"("id")
      ON DELETE set null ON UPDATE no action;
    CREATE INDEX "tours_guide_id_idx" ON "tours" USING btree ("guide_id");

    -- 4. Drop new junction column + FK + index
    ALTER TABLE "tours_rels" DROP CONSTRAINT IF EXISTS "tours_rels_guides_fk";
    DROP INDEX IF EXISTS "tours_rels_guides_id_idx";
    DELETE FROM "tours_rels" WHERE path = 'guides';
    ALTER TABLE "tours_rels" DROP COLUMN IF EXISTS "guides_id";

    COMMIT;
  `)
}
```

### Step 4 — Run migration locally + verify

```bash
cd apps/web
npx payload migrate              # apply up()
psql $DATABASE_URL -c "SELECT t.id, t.slug, COUNT(r.guides_id) AS guide_count FROM tours t LEFT JOIN tours_rels r ON r.parent_id=t.id AND r.path='guides' GROUP BY t.id, t.slug ORDER BY t.id LIMIT 20;"
# Every row should show guide_count >= 1

# Test rollback
npx payload migrate:down
psql $DATABASE_URL -c "SELECT id, slug, guide_id FROM tours LIMIT 5;"
# guide_id should be populated again

# Re-apply
npx payload migrate
```

### Step 5 — Type-check + admin smoke test

```bash
npm run type-check
npm run dev
# Visit /admin → Tours → open a tour → confirm "Guides" field shows existing guide
# Add a second guide → save → reload → confirm both persist in correct order
```

## Todo List
- [ ] Update `packages/cms/collections/tours.ts` field def (`guide` → `guides`, `hasMany: true`, `minRows: 1`)
- [ ] Update `defaultColumns` array in tours collection admin config
- [ ] Generate Payload migration with `payload migrate:create`
- [ ] Augment migration with atomic backfill + sanity-check + column drop in `up()`
- [ ] Add corresponding `down()` with documented data-loss caveat
- [ ] Run migration locally; verify every tour has ≥1 row in `tours_rels` (path='guides')
- [ ] Test `down()` rollback restores `guide_id` populated; re-apply `up()` cleanly
- [ ] Verify admin UI: edit existing tour → see existing guide, add a second, reorder, save, reload
- [ ] Run `npm run type-check` (will fail until Phase 02 is also done — that's expected; document in PR)

## Success Criteria
- Migration `up()` runs successfully on a copy of production DB (staging) with no errors
- Every existing tour has ≥1 entry in `tours_rels` where `path='guides'`
- Sanity-check `RAISE EXCEPTION` block triggers correctly if a tour somehow ends with zero guides (test by running on a manually emptied row)
- `tours.guide_id` column no longer exists after migration
- `down()` migration restores DB to previous shape (with documented multi-guide data loss)
- Admin UI shows "Guides" field as a sortable hasMany list
- `minRows: 1` validation prevents saving a tour with zero guides

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Backfill skips a row → tour ends with zero guides | Low | High (broken tour detail page) | `RAISE EXCEPTION` sanity check inside transaction aborts migration |
| Production has tours with NULL `guide_id` (despite NOT NULL constraint) | Very Low | Medium | `WHERE guide_id IS NOT NULL` in backfill; sanity check would catch it |
| FK cascade on guide delete now works differently (multiple tours can lose a single guide silently instead of being blocked) | Medium | Medium | Document in collection comment; consider a beforeDelete hook on guides that blocks if guide is the *only* guide on any tour (out-of-scope for this phase but flag to product) |
| Long-running transaction locks `tours_rels` during deploy | Low | Low | Migration is single-pass; expected <1s on production data volume |

## Security Considerations
- No new auth surface — admin-only writes via Payload's existing `isAdmin` access control
- No new public API; tour read access (`access.read = () => true`) unchanged
- Migration runs as DB owner via Payload migrate; no SQL injection vector

## Next Steps
- Phase 02 (frontend) is blocked by this phase landing on local dev
- Phase 03 (backend pipelines) needs the new junction structure to rewrite `get-guides.ts` raw SQL
- Phase 04 (tests/docs) runs after Phases 02 + 03 are done
