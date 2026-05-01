/**
 * Helpers that turn neighborhood references on a tour into a deduped
 * city-id list. Pure functions — no Payload dependency — so they can be
 * unit-tested without a DB.
 */

export interface NeighborhoodLike {
  id: number | string
  city: number | string | { id: number | string } | null | undefined
}

/** Extract `id` from either a populated relationship or a raw foreign key. */
export function extractCityId(
  neighborhood: NeighborhoodLike,
): number | string | null {
  const c = neighborhood.city
  if (c == null) return null
  if (typeof c === 'object') return c.id ?? null
  return c
}

/** Deduped list of city IDs reachable from a tour's neighborhoods. */
export function deriveCityIdsFromNeighborhoods(
  neighborhoods: NeighborhoodLike[] | null | undefined,
): Array<number | string> {
  if (!Array.isArray(neighborhoods)) return []
  const seen = new Set<string>()
  const result: Array<number | string> = []
  for (const hood of neighborhoods) {
    const id = extractCityId(hood)
    if (id == null) continue
    const key = String(id)
    if (seen.has(key)) continue
    seen.add(key)
    result.push(id)
  }
  return result
}
