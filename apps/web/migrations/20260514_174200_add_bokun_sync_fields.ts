/**
 * Migration: Add Bokun outbound-sync metadata columns to the `tours` table.
 *  - bokun_sync_status:    enum-as-text (pending|synced|failed|disabled), default 'pending'
 *  - bokun_last_synced_at: timestamp with timezone, nullable
 *  - bokun_last_error:     text, nullable
 *
 * Additive only — safe to apply on a populated table. Existing rows default to 'pending'
 * but the afterChange hook only enqueues on save, so this does NOT trigger a backfill storm.
 *
 * @see plans/260514-1437-bokun-integration/phase-04-tour-schema-sync-fields.md
 */

import { sql } from 'drizzle-orm'
import type { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE tours
      ADD COLUMN IF NOT EXISTS bokun_sync_status TEXT DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS bokun_last_synced_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS bokun_last_error TEXT
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS tours_bokun_sync_status_idx
    ON tours (bokun_sync_status)
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP INDEX IF EXISTS tours_bokun_sync_status_idx`)
  await db.execute(sql`
    ALTER TABLE tours
      DROP COLUMN IF EXISTS bokun_last_error,
      DROP COLUMN IF EXISTS bokun_last_synced_at,
      DROP COLUMN IF EXISTS bokun_sync_status
  `)
}
