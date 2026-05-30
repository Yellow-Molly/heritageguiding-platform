/**
 * Pure helper: compute the diff between CMS optionalAddOns + the live Bokun
 * extras list (from GET /experience/{id}/components?componentType=EXTRAS).
 *
 * Used by the Phase 05 "Adopt baseline" admin flow so the operator can preview
 * what the next sync would create/update/delete before flipping the per-tour
 * push gate.
 *
 * Matching strategy:
 *   1. CMS row has `bokunExtraId` set + numeric + matches Bokun id
 *      → inBoth (UPDATE on sync).
 *   2. CMS row has NO bokunExtraId (or whitespace) → onlyInCms (CREATE on sync).
 *   3. CMS row has numeric bokunExtraId but Bokun has no such extra
 *      → stalePointers (sync emits stale id; Bokun behavior on UPDATE-with-
 *      unknown-id is undocumented). Operator must clear the field before sync.
 *   4. CMS row has non-numeric bokunExtraId → stalePointers (same — serializer
 *      tries Number() and silently drops; safer to surface as a warning).
 *   4b. Two CMS rows carry the SAME numeric bokunExtraId → first → inBoth,
 *      second → stalePointers (conflict; emitting two DTOs with one id on PUT
 *      is undefined Bokun behavior, so block adopt until the operator clears it).
 *   5. Bokun extra not claimed by any CMS row → onlyInBokun (DELETE on sync).
 *
 * The stalePointers bucket exists so the admin UI does NOT promise the operator
 * "Will CREATE" while the serializer silently sends `{id: <stale>}` to Bokun.
 *
 * @see plans/260525-1417-bokun-extras-push-sync/phase-05-adopt-baseline-admin-ui.md
 */

import type { BokunExtraComponentDto } from './bokun-types'

export interface DiffCmsRow {
  id?: string | number | null
  bokunExtraId?: string | null
  /**
   * Display name. Type intentionally permissive: callers may pass the localized
   * record (locale='all' depth>=2) or a single-locale resolved string (locale='en'
   * default fetch). The diff helper doesn't read this field — it's preserved for
   * the UI to render alongside the diff buckets.
   */
  name?: string | Partial<Record<'sv' | 'en' | 'de', string | null | undefined>>
}

export interface DiffResult {
  /** CMS rows that already correspond to a Bokun extra by id — UPDATE on sync. */
  inBoth: Array<{ cms: DiffCmsRow; bokun: BokunExtraComponentDto }>
  /** CMS rows with no Bokun counterpart — CREATE on sync. */
  onlyInCms: DiffCmsRow[]
  /**
   * CMS rows whose bokunExtraId cannot be uniquely resolved: points nowhere
   * (deleted in Bokun, typo, non-numeric) OR duplicates another row's id. Sync
   * would still emit the id field; Bokun's response is undocumented. UI should
   * warn operator to clear the field before adopting.
   */
  stalePointers: DiffCmsRow[]
  /** Bokun extras with no CMS row — DELETE on sync (the destructive case). */
  onlyInBokun: BokunExtraComponentDto[]
}

/**
 * Compute the diff. Pure: no I/O, no Date/Math.random. Stable order: bucket
 * arrays preserve input order from the inputs (CMS array order, Bokun array order).
 */
export function diffCmsBokunExtras(
  cmsRows: DiffCmsRow[] | null | undefined,
  bokunExtras: BokunExtraComponentDto[] | null | undefined
): DiffResult {
  const cms = cmsRows ?? []
  const bokun = bokunExtras ?? []
  const inBoth: DiffResult['inBoth'] = []
  const onlyInCms: DiffCmsRow[] = []
  const stalePointers: DiffCmsRow[] = []
  // Track which Bokun extras have been claimed so the leftover set is the diff.
  const claimed = new Set<number>()

  for (const row of cms) {
    const rawId = row.bokunExtraId?.trim()
    if (!rawId) {
      // No id at all → genuinely CREATE on sync (serializer omits dto.id).
      onlyInCms.push(row)
      continue
    }
    const numericId = Number(rawId)
    if (!Number.isFinite(numericId)) {
      // Non-numeric garbage. Serializer's `Number.isFinite` guard drops it →
      // dto.id is omitted → Bokun ends up creating, BUT the operator pasted
      // something and probably expects an update. Surface as stale so they fix it.
      stalePointers.push(row)
      continue
    }
    const match = bokun.find((b) => b.id === numericId)
    if (match) {
      if (claimed.has(numericId)) {
        // Another CMS row already claims this Bokun extra. Two rows with the
        // same id would emit two DTOs with an identical `id` on PUT — undefined
        // Bokun behavior. Surface the later row as a conflict (operator clears
        // its bokunExtraId) instead of silently double-updating the same extra.
        stalePointers.push(row)
      } else {
        inBoth.push({ cms: row, bokun: match })
        claimed.add(numericId)
      }
    } else {
      // Operator pasted a numeric id Bokun no longer recognizes. The serializer
      // STILL sends `dto.id = <stale>` to Bokun; behavior on unknown-id PUT is
      // undocumented (could 4xx, could silently create via externalId).
      // Bucket separately so the UI tells operator to fix CMS before sync.
      stalePointers.push(row)
    }
  }

  const onlyInBokun = bokun.filter((b) => b.id != null && !claimed.has(b.id))
  return { inBoth, onlyInCms, stalePointers, onlyInBokun }
}
