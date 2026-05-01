/**
 * Pure-function decision logic for rewriting a tour's category relations.
 * Extracted so the second-run idempotency case (every category slug is
 * already canonical) can be unit-tested without a DB.
 *
 * Rules:
 *   1. Map says "merge"/"keep" → use the target's new ID.
 *   2. Map says "delete" → drop the relation.
 *   3. Slug not in map AND in taxonomy → preserve (already canonical).
 *   4. Slug not in map AND not in taxonomy → drop (unknown / orphaned).
 */
import type { MigrationMap } from './load-category-mapping'

export interface CategoryLike {
  id: number | string
  slug: string
}

export function computeTourCategoryRewrite(
  oldCategories: CategoryLike[],
  map: MigrationMap,
  slugToNewId: Map<string, number | string>,
  taxonomySlugs: Set<string>,
): { newIds: Array<number | string>; changed: boolean } {
  // Map preserves the ORIGINAL id type while the string key handles dedup.
  const out = new Map<string, number | string>()

  for (const cat of oldCategories) {
    const action = map[cat.slug]
    if (!action) {
      if (taxonomySlugs.has(cat.slug)) {
        out.set(String(cat.id), cat.id)
      }
      continue
    }
    if (action.action === 'delete') continue
    const targetId = slugToNewId.get(action.newSlug)
    if (targetId == null) continue
    out.set(String(targetId), targetId)
  }

  const beforeKey = oldCategories.map((c) => String(c.id)).sort().join(',')
  const afterKey = [...out.keys()].sort().join(',')

  return { newIds: [...out.values()], changed: beforeKey !== afterKey }
}
