/**
 * Regression tests for the tour-category rewrite decision.
 * Critical case: a SECOND --apply run must not wipe categories — every slug
 * is now canonical, none is in the migration map.
 */
import { describe, it, expect } from 'vitest'
import { computeTourCategoryRewrite } from '../../../../scripts/lib/compute-tour-category-rewrite'
import type { MigrationMap } from '../../../../scripts/lib/load-category-mapping'

const MAP: MigrationMap = {
  'history': { action: 'merge', newSlug: 'history-heritage' },
  'walking-tours': { action: 'merge', newSlug: 'walking-tour' },
  'family-friendly': { action: 'keep', newSlug: 'family-friendly' },
  'stockholm': { action: 'delete', reason: 'location-as-category' },
}

const TAXONOMY = new Set([
  'history-heritage',
  'walking-tour',
  'family-friendly',
  'nature-water',
])

const SLUG_TO_NEW_ID = new Map<string, number>([
  ['history-heritage', 100],
  ['walking-tour', 101],
  ['family-friendly', 102],
  ['nature-water', 103],
])

describe('computeTourCategoryRewrite — first run', () => {
  it('merges legacy slugs to new IDs', () => {
    const out = computeTourCategoryRewrite(
      [{ id: 1, slug: 'history' }, { id: 2, slug: 'walking-tours' }],
      MAP,
      SLUG_TO_NEW_ID,
      TAXONOMY,
    )
    expect(out.changed).toBe(true)
    expect(out.newIds.sort()).toEqual([100, 101])
  })

  it('drops slugs marked for delete', () => {
    const out = computeTourCategoryRewrite(
      [{ id: 1, slug: 'stockholm' }, { id: 2, slug: 'history' }],
      MAP,
      SLUG_TO_NEW_ID,
      TAXONOMY,
    )
    expect(out.newIds).toEqual([100])
  })

  it('dedupes when multiple legacy slugs merge to same target', () => {
    // e.g., cultural-tours + culture-history both → culture-local-life
    const map: MigrationMap = {
      'cultural-tours': { action: 'merge', newSlug: 'culture-local-life' },
      'culture-history': { action: 'merge', newSlug: 'culture-local-life' },
    }
    const slugToId = new Map([['culture-local-life', 200]])
    const tax = new Set(['culture-local-life'])
    const out = computeTourCategoryRewrite(
      [{ id: 1, slug: 'cultural-tours' }, { id: 2, slug: 'culture-history' }],
      map,
      slugToId,
      tax,
    )
    expect(out.newIds).toEqual([200])
  })
})

describe('computeTourCategoryRewrite — second run idempotency (CRITICAL)', () => {
  it('PRESERVES categories that are already canonical taxonomy slugs', () => {
    // Tour was already migrated. Its categories now hold canonical slugs.
    // The migration map has no entry for 'history-heritage' — without the
    // taxonomy guard, this would return [] and wipe the data on --apply.
    const out = computeTourCategoryRewrite(
      [
        { id: 100, slug: 'history-heritage' },
        { id: 101, slug: 'walking-tour' },
      ],
      MAP,
      SLUG_TO_NEW_ID,
      TAXONOMY,
    )
    expect(out.changed).toBe(false)
    expect(out.newIds.sort()).toEqual([100, 101])
  })

  it('keeps a single canonical slug as-is', () => {
    const out = computeTourCategoryRewrite(
      [{ id: 102, slug: 'family-friendly' }],
      MAP,
      SLUG_TO_NEW_ID,
      TAXONOMY,
    )
    expect(out.changed).toBe(false)
    expect(out.newIds).toEqual([102])
  })

  it('drops slugs not in map and not in taxonomy (truly unknown)', () => {
    const out = computeTourCategoryRewrite(
      [
        { id: 999, slug: 'mystery-slug' },
        { id: 100, slug: 'history-heritage' },
      ],
      MAP,
      SLUG_TO_NEW_ID,
      TAXONOMY,
    )
    // mystery-slug is dropped; history-heritage preserved.
    expect(out.changed).toBe(true)
    expect(out.newIds).toEqual([100])
  })
})

describe('computeTourCategoryRewrite — edge cases', () => {
  it('returns empty + changed=false for empty input', () => {
    const out = computeTourCategoryRewrite([], MAP, SLUG_TO_NEW_ID, TAXONOMY)
    expect(out.newIds).toEqual([])
    expect(out.changed).toBe(false)
  })

  it('marks changed when delete action drops the only category', () => {
    const out = computeTourCategoryRewrite(
      [{ id: 1, slug: 'stockholm' }],
      MAP,
      SLUG_TO_NEW_ID,
      TAXONOMY,
    )
    expect(out.changed).toBe(true)
    expect(out.newIds).toEqual([])
  })
})
