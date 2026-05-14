import { sql } from '@payloadcms/db-postgres'

/**
 * Convert tours.guide (single relationship, FK column tours.guide_id) →
 * tours.guides (hasMany relationship, junction rows in tours_rels with path='guides').
 *
 * Order matters: add new column → backfill from legacy → verify completeness → drop legacy.
 * Wrapped in a single transaction so a partial backfill cannot strand tours with 0 guides.
 *
 * NOTE on rollback: down() restores guide_id from the FIRST guide (lowest order) of each
 * tour. Tours with multiple guides will lose all but the primary on rollback — documented
 * data loss.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up({ db }: { db: any }): Promise<void> {
  await db.execute(sql`
    -- 1. Add hasMany junction column + FK + index in tours_rels.
    -- IF [NOT] EXISTS clauses make this migration idempotent against staging /
    -- production databases that may have had partial schema pushes via
    -- Payload dev mode before formal migrations were introduced.
    ALTER TABLE "tours_rels" ADD COLUMN IF NOT EXISTS "guides_id" integer;
    DO $$ BEGIN
      ALTER TABLE "tours_rels"
        ADD CONSTRAINT "tours_rels_guides_fk"
        FOREIGN KEY ("guides_id") REFERENCES "public"."guides"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;
    CREATE INDEX IF NOT EXISTS "tours_rels_guides_id_idx" ON "tours_rels" USING btree ("guides_id");

    -- 2. Backfill: copy each tour's existing guide_id into tours_rels with path='guides', order=0.
    -- Skip when guide_id column has already been dropped (migration partially applied).
    -- Skip rows already backfilled to avoid duplicate junction entries.
    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tours' AND column_name = 'guide_id'
      ) THEN
        INSERT INTO "tours_rels" ("parent_id", "path", "order", "guides_id")
        SELECT t.id, 'guides', 0, t.guide_id
        FROM "tours" t
        WHERE t.guide_id IS NOT NULL
          AND NOT EXISTS (
            SELECT 1 FROM "tours_rels" r
            WHERE r.parent_id = t.id AND r.path = 'guides'
          );
      END IF;
    END $$;

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

    -- 4. Drop legacy single-relationship FK + index + column (idempotent).
    ALTER TABLE "tours" DROP CONSTRAINT IF EXISTS "tours_guide_id_guides_id_fk";
    DROP INDEX IF EXISTS "tours_guide_idx";
    ALTER TABLE "tours" DROP COLUMN IF EXISTS "guide_id";

    -- 5. Incidental: index on guides.status added by Payload reconciliation
    CREATE INDEX IF NOT EXISTS "guides_status_idx" ON "guides" USING btree ("status");
  `)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down({ db }: { db: any }): Promise<void> {
  await db.execute(sql`
    -- 1. Drop incidental index
    DROP INDEX IF EXISTS "guides_status_idx";

    -- 2. Re-add guide_id column (nullable initially for backfill)
    ALTER TABLE "tours" ADD COLUMN "guide_id" integer;

    -- 3. Backfill from FIRST guide of each tour (lowest order).
    --    NOTE: multi-guide tours will lose their additional guides — documented data loss.
    UPDATE "tours" t
    SET guide_id = (
      SELECT r.guides_id FROM "tours_rels" r
      WHERE r.parent_id = t.id AND r.path = 'guides' AND r.guides_id IS NOT NULL
      ORDER BY r."order" ASC, r.id ASC
      LIMIT 1
    );

    -- 4. Restore NOT NULL + FK + index
    ALTER TABLE "tours" ALTER COLUMN "guide_id" SET NOT NULL;
    ALTER TABLE "tours"
      ADD CONSTRAINT "tours_guide_id_guides_id_fk"
      FOREIGN KEY ("guide_id") REFERENCES "public"."guides"("id")
      ON DELETE set null ON UPDATE no action;
    CREATE INDEX "tours_guide_idx" ON "tours" USING btree ("guide_id");

    -- 5. Drop hasMany junction column + FK + index + rows
    ALTER TABLE "tours_rels" DROP CONSTRAINT "tours_rels_guides_fk";
    DROP INDEX "tours_rels_guides_id_idx";
    DELETE FROM "tours_rels" WHERE path = 'guides';
    ALTER TABLE "tours_rels" DROP COLUMN "guides_id";
  `)
}
