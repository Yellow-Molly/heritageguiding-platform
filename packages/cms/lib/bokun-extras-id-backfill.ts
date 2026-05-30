/**
 * Pure helper: given the CMS `optionalAddOns` rows + the extras Bokun returned
 * in its PUT-components response, write the Bokun-assigned `id` back into rows
 * whose `bokunExtraId` is currently empty.
 *
 * Why a generic over the row shape:
 *   The CMS row carries many fields the mapper deliberately ignores (pricingType,
 *   adultPriceHint, isRequired, …). When we hand the updated rows back to
 *   `payload.update`, Payload expects the FULL row shape preserved. A generic
 *   ensures we round-trip unknown fields without enumerating them here.
 *
 * Correlation strategy (Phase 01 verified):
 *   Bokun preserves `externalId` round-trip → match Bokun's `extra.externalId`
 *   against CMS row `id` (as string). No position-based fallback needed.
 *
 * Returns `null` when no row needs updating, so the caller can skip the
 * `payload.update` data merge entirely.
 *
 * @see plans/260525-1417-bokun-extras-push-sync/phase-04-sync-job-extras-integration-and-id-backfill.md
 */

import type { BokunExtraComponentDto } from '../../../apps/web/lib/bokun/bokun-types'

/** Minimal shape every CMS add-on row exposes. */
interface BackfillableRow {
  id?: string | number | null
  bokunExtraId?: string | null
}

/**
 * @param cmsRows - the tour's `optionalAddOns` array (as Payload returned it)
 * @param bokunExtras - the `extras` array Bokun emitted in its PUT response
 * @returns updated rows when at least one row got a new id; null otherwise
 */
export function backfillExtraIdsFromBokunResponse<T extends BackfillableRow>(
  cmsRows: T[] | null | undefined,
  bokunExtras: BokunExtraComponentDto[] | null | undefined
): T[] | null {
  if (!cmsRows || cmsRows.length === 0) return null
  if (!bokunExtras || bokunExtras.length === 0) return null

  let mutated = false
  const updated = cmsRows.map((row) => {
    // Already has an id → nothing to do.
    if (row.bokunExtraId && row.bokunExtraId.trim()) return row

    const externalId = row.id != null ? String(row.id) : ''
    if (!externalId) return row

    const bokunMatch = bokunExtras.find((e) => e.externalId === externalId)
    if (!bokunMatch || bokunMatch.id == null) return row

    mutated = true
    return { ...row, bokunExtraId: String(bokunMatch.id) }
  })

  return mutated ? updated : null
}
