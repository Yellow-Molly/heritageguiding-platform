/**
 * Migration: Add the `bokun_extras_baseline_at` column to the `tours` table.
 *
 * Backs the `tours.bokunExtrasBaselineAt` field — a nullable timestamp that
 * gates the optional-add-ons → Bokun extras push. Until an operator adopts the
 * baseline (sets this date via the sidebar action), optionalAddOns is excluded
 * from the outbound sync so the first push can't silently delete extras that
 * were configured directly in the Bokun dashboard.
 *
 * The field was added to the Tours collection but its column was never
 * generated, so deployed Drizzle queries SELECT a column the DB lacks
 * (Postgres 42703) and every fresh tour-page render fails.
 *
 * Additive + nullable, no default — safe on a populated table, no backfill.
 * Mirrors 20260514_174200_add_bokun_sync_fields (same table, same date type
 * as bokun_last_synced_at).
 */

import { sql } from 'drizzle-orm'
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE tours
      ADD COLUMN IF NOT EXISTS bokun_extras_baseline_at TIMESTAMPTZ
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE tours
      DROP COLUMN IF EXISTS bokun_extras_baseline_at
  `)
}
