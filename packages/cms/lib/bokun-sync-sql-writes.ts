/**
 * Direct-SQL writers used by the Bokun sync job.
 *
 * Why direct SQL instead of `payload.update`:
 *   Payload v3's update operation runs beforeChange/validation across the
 *   ENTIRE merged document — not just the fields we're patching. The tour's
 *   existing `optionalAddOns` rows are re-validated; if the localized `name`
 *   field fails its required check against the validation locale (which
 *   differs from the locale the operator filled), the whole update 400s
 *   with "Add-ons > Name: required" — even though we never asked to touch
 *   optionalAddOns. Targeted SQL on the non-localized status columns skips
 *   validation entirely.
 *
 * Schema sources:
 *   tours.bokun_experience_id   → migration 20260202_221539.ts
 *   tours.bokun_sync_status     → migration 20260514_174200_add_bokun_sync_fields.ts
 *   tours.bokun_last_synced_at  →   "
 *   tours.bokun_last_error      →   "
 *   tours_optional_add_ons.*    → migration 20260524_211041_add_optional_add_ons.ts
 *
 * @see packages/cms/lib/bokun-sync-job.ts
 */

import { sql } from 'drizzle-orm'
import type { BokunExtraComponentDto } from '../../../apps/web/lib/bokun/bokun-types'

export type BokunSyncStatus = 'pending' | 'synced' | 'failed' | 'disabled'

export type PayloadWithDb = {
  db: { drizzle: { execute: (q: ReturnType<typeof sql>) => Promise<unknown> } }
}

export interface BokunSuccessStatus {
  bokunExperienceId: string | null
  bokunSyncStatus: BokunSyncStatus
  bokunLastSyncedAt: string | null
  bokunLastError: string | null
}

/**
 * Write all four bokun status columns. Used on the success path.
 */
export async function writeBokunStatusViaSql(
  payload: PayloadWithDb,
  tourId: number | string,
  status: BokunSuccessStatus
): Promise<void> {
  await payload.db.drizzle.execute(sql`
    UPDATE "tours"
    SET "bokun_experience_id" = ${status.bokunExperienceId},
        "bokun_sync_status"   = ${status.bokunSyncStatus},
        "bokun_last_synced_at" = ${status.bokunLastSyncedAt},
        "bokun_last_error"    = ${status.bokunLastError}
    WHERE "id" = ${tourId}
  `)
}

export interface BokunErrorStatus {
  bokunExperienceId: string | null
  bokunSyncStatus: BokunSyncStatus
  bokunLastError: string | null
}

/**
 * Catch-path variant — does NOT touch `bokun_last_synced_at`, so a failed
 * sync preserves the prior successful timestamp.
 */
export async function writeBokunErrorStatusViaSql(
  payload: PayloadWithDb,
  tourId: number | string,
  status: BokunErrorStatus
): Promise<void> {
  await payload.db.drizzle.execute(sql`
    UPDATE "tours"
    SET "bokun_experience_id" = ${status.bokunExperienceId},
        "bokun_sync_status"   = ${status.bokunSyncStatus},
        "bokun_last_error"    = ${status.bokunLastError}
    WHERE "id" = ${tourId}
  `)
}

/**
 * Set the per-tour `bokun_extras_baseline_at` flag (the Phase-05 gate that
 * lets the operator opt this tour into the extras push sync).
 *
 * Same reason for direct SQL as the other writers: payload.update would run
 * full-document validation, which trips required-field checks on existing
 * localized optionalAddOns rows even when we're only patching this one
 * non-localized timestamp column.
 *
 * @param baselineAtIso  ISO 8601 string for the timestamp (or null to clear)
 * @returns count of `tours` rows updated (0 when tourId matches nothing — the
 *   caller treats that as "tour not found")
 */
export async function writeBokunExtrasBaselineViaSql(
  payload: PayloadWithDb,
  tourId: number | string,
  baselineAtIso: string | null
): Promise<number> {
  const result = (await payload.db.drizzle.execute(sql`
    UPDATE "tours"
    SET "bokun_extras_baseline_at" = ${baselineAtIso}
    WHERE "id" = ${tourId}
  `)) as { rowCount?: number }
  return typeof result?.rowCount === 'number' ? result.rowCount : 0
}

/**
 * Backfill bokun_extra_id on tours_optional_add_ons rows. Match by Bokun's
 * `externalId` (= CMS array row id) + parent tour id. Only overwrites empty
 * bokun_extra_id values (no clobber on re-syncs).
 *
 * Returns the count of rows actually updated.
 */
export async function backfillBokunExtraIdsViaSql(
  payload: PayloadWithDb,
  tourId: number | string,
  bokunExtras: BokunExtraComponentDto[]
): Promise<number> {
  let updated = 0
  for (const extra of bokunExtras) {
    if (!extra.externalId || extra.id == null) continue
    const externalId = String(extra.externalId)
    const newId = String(extra.id)
    const result = (await payload.db.drizzle.execute(sql`
      UPDATE "tours_optional_add_ons"
      SET "bokun_extra_id" = ${newId}
      WHERE "id" = ${externalId}
        AND "_parent_id" = ${tourId}
        AND ("bokun_extra_id" IS NULL OR trim("bokun_extra_id") = '')
    `)) as { rowCount?: number }
    if (typeof result?.rowCount === 'number' && result.rowCount > 0) updated++
  }
  return updated
}
