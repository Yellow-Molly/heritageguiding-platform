import { sql } from '@payloadcms/db-postgres'

// Adds the only listing-query index that doesn't already exist in the base schema:
// - guides.status — every getGuides call filters status='active', no prior index.
//
// Note: tours_rels.categories_id is ALREADY indexed by the base migration
// (20260202_221539.ts:489 — full btree, not partial). The `index: true` flag added
// to `tours.categories` in this PR is documentation/parity with reality, not new DDL.
//
// Plain CREATE INDEX (not CONCURRENTLY): Payload runs each migration inside a
// transaction (`@payloadcms/drizzle/dist/migrate.js` — initTransaction/commitTransaction),
// which forbids CONCURRENTLY. Brief ACCESS EXCLUSIVE lock during build is acceptable
// on a small `guides` table.
//
// Plan: plans/260502-1308-listing-query-perf/phase-03-guides-depth-select-indexes.md

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up({ db }: { db: any }): Promise<void> {
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "guides_status_idx" ON "guides" USING btree ("status");
  `)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down({ db }: { db: any }): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "guides_status_idx";
  `)
}
