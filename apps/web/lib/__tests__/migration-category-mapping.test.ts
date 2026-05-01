/**
 * Validates the committed `data/category-taxonomy.json` and
 * `data/category-migration-map.json` files. These are the source of truth for
 * Phase 03 of the tour-geo migration; if they drift, Phase 06's manual
 * checklist breaks. Tests reuse the same Zod schemas the migration script
 * relies on at runtime.
 */
import { describe, it, expect } from 'vitest'
import {
  loadTaxonomy,
  loadMigrationMap,
  allTaxonomySlugs,
  slugTypeMap,
} from '../../../../scripts/lib/load-category-mapping'

describe('category taxonomy + migration map', () => {
  it('taxonomy parses and contains exactly 6 themes + 4 activities', () => {
    const t = loadTaxonomy()
    expect(t.themes).toHaveLength(6)
    expect(t.activities).toHaveLength(4)
  })

  it('every taxonomy slug is unique', () => {
    const t = loadTaxonomy()
    const slugs = allTaxonomySlugs(t)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('migration map covers all 34 legacy slugs', () => {
    const map = loadMigrationMap()
    expect(Object.keys(map)).toHaveLength(34)
  })

  it('every merge/keep target exists in the taxonomy', () => {
    const t = loadTaxonomy()
    const map = loadMigrationMap()
    const slugSet = new Set(allTaxonomySlugs(t))
    for (const [oldSlug, entry] of Object.entries(map)) {
      if (entry.action === 'merge' || entry.action === 'keep') {
        expect(slugSet.has(entry.newSlug), `${oldSlug} -> ${entry.newSlug}`).toBe(true)
      }
    }
  })

  it('contains zero location-named entries in the new taxonomy', () => {
    const t = loadTaxonomy()
    const slugs = allTaxonomySlugs(t)
    for (const blocked of ['stockholm', 'sigtuna', 'uppsala', 'gamla-stan']) {
      expect(slugs).not.toContain(blocked)
    }
  })

  it('classifies every taxonomy slug as theme or activity', () => {
    const t = loadTaxonomy()
    const typeMap = slugTypeMap(t)
    for (const slug of allTaxonomySlugs(t)) {
      const type = typeMap.get(slug)
      expect(type === 'theme' || type === 'activity').toBe(true)
    }
  })
})
