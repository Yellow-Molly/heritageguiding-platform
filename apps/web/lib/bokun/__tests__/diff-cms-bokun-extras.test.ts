/**
 * Tests for diff-cms-bokun-extras — drives the Phase 05 baseline preview UI.
 */
import { describe, it, expect } from 'vitest'
import { diffCmsBokunExtras } from '../diff-cms-bokun-extras'
import type { BokunExtraComponentDto } from '../bokun-types'

function bokun(id: number, externalId = `ext-${id}`, title = `Extra ${id}`): BokunExtraComponentDto {
  return {
    id,
    externalId,
    title,
    type: 'OTHERS',
    maxPerBooking: 5,
    limitByPax: false,
  }
}

describe('diffCmsBokunExtras', () => {
  it('returns four empty buckets for empty inputs', () => {
    expect(diffCmsBokunExtras(null, null)).toEqual({
      inBoth: [],
      onlyInCms: [],
      stalePointers: [],
      onlyInBokun: [],
    })
    expect(diffCmsBokunExtras([], [])).toEqual({
      inBoth: [],
      onlyInCms: [],
      stalePointers: [],
      onlyInBokun: [],
    })
  })

  it('puts paired rows into inBoth (CMS bokunExtraId matches Bokun id)', () => {
    const result = diffCmsBokunExtras(
      [{ id: 'cms-1', bokunExtraId: '276080' }],
      [bokun(276080, 'cms-1', 'Museum Ticket')]
    )
    expect(result.inBoth).toHaveLength(1)
    expect(result.inBoth[0].cms.id).toBe('cms-1')
    expect(result.inBoth[0].bokun.id).toBe(276080)
    expect(result.onlyInCms).toEqual([])
    expect(result.onlyInBokun).toEqual([])
  })

  it('puts CMS rows without bokunExtraId into onlyInCms (CREATE on sync)', () => {
    const result = diffCmsBokunExtras(
      [{ id: 'cms-new', bokunExtraId: null, name: { en: 'New thing' } }],
      []
    )
    expect(result.onlyInCms).toHaveLength(1)
    expect(result.onlyInCms[0].id).toBe('cms-new')
  })

  it('puts Bokun extras with no CMS counterpart into onlyInBokun (DELETE on sync)', () => {
    const result = diffCmsBokunExtras(
      [],
      [bokun(999, 'orphan-ext', 'Orphan Extra')]
    )
    expect(result.onlyInBokun).toHaveLength(1)
    expect(result.onlyInBokun[0].id).toBe(999)
  })

  it('puts CMS rows with stale numeric bokunExtraId (no longer in Bokun) into stalePointers', () => {
    // Operator pasted an id that no longer exists in Bokun. The serializer
    // still sends `dto.id = 999999`; Bokun behavior is undocumented (could 4xx).
    // Surfacing this as stalePointers prevents the UI from promising "Will CREATE"
    // when the sync actually tries an UPDATE-by-id.
    const result = diffCmsBokunExtras(
      [{ id: 'cms-stale', bokunExtraId: '999999' }],
      [bokun(276080)]
    )
    expect(result.stalePointers).toHaveLength(1)
    expect(result.stalePointers[0].id).toBe('cms-stale')
    expect(result.onlyInCms).toHaveLength(0)
    expect(result.onlyInBokun).toHaveLength(1) // bokun 276080 unmatched
  })

  it('handles whitespace-only bokunExtraId same as missing', () => {
    const result = diffCmsBokunExtras(
      [{ id: 'cms-blank', bokunExtraId: '   ' }],
      []
    )
    expect(result.onlyInCms).toHaveLength(1)
    expect(result.inBoth).toEqual([])
  })

  it('handles non-numeric bokunExtraId as stale (operator typo, not CREATE)', () => {
    // Pasted garbage like "276080a" or "TODO" — serializer's Number.isFinite()
    // guard means dto.id is omitted, but the operator clearly intended SOMETHING.
    // Surface as stale so they can fix the row instead of silently creating.
    const result = diffCmsBokunExtras(
      [{ id: 'cms-bad', bokunExtraId: 'not-a-number' }],
      [bokun(276080)]
    )
    expect(result.stalePointers).toHaveLength(1)
    expect(result.stalePointers[0].id).toBe('cms-bad')
    expect(result.onlyInCms).toHaveLength(0)
    expect(result.onlyInBokun).toHaveLength(1)
  })

  it('mixed scenario: one inBoth + one CREATE + one DELETE', () => {
    const result = diffCmsBokunExtras(
      [
        { id: 'cms-1', bokunExtraId: '100' },
        { id: 'cms-2', bokunExtraId: null },
      ],
      [bokun(100, 'cms-1'), bokun(999, 'gone')]
    )
    expect(result.inBoth).toHaveLength(1)
    expect(result.inBoth[0].bokun.id).toBe(100)
    expect(result.onlyInCms).toHaveLength(1)
    expect(result.onlyInCms[0].id).toBe('cms-2')
    expect(result.onlyInBokun).toHaveLength(1)
    expect(result.onlyInBokun[0].id).toBe(999)
  })

  it('routes a duplicate bokunExtraId (same id on two CMS rows) to stalePointers as a conflict', () => {
    // Two CMS rows claiming the same Bokun extra would emit two DTOs with an
    // identical id on PUT — undefined Bokun behavior. First row wins (inBoth);
    // the second is surfaced as a conflict so the adopt UI blocks until the
    // operator clears the duplicate's bokunExtraId.
    const result = diffCmsBokunExtras(
      [
        { id: 'cms-1', bokunExtraId: '276080' },
        { id: 'cms-2', bokunExtraId: '276080' }, // duplicate
      ],
      [bokun(276080)]
    )
    expect(result.inBoth).toHaveLength(1) // first row claims it
    expect(result.inBoth[0].cms.id).toBe('cms-1')
    expect(result.stalePointers).toHaveLength(1) // second row → conflict
    expect(result.stalePointers[0].id).toBe('cms-2')
    expect(result.onlyInBokun).toHaveLength(0) // claimed once = not in DELETE set
  })

  it('preserves bucket order from inputs', () => {
    const result = diffCmsBokunExtras(
      [
        { id: 'a', bokunExtraId: null },
        { id: 'b', bokunExtraId: null },
        { id: 'c', bokunExtraId: null },
      ],
      []
    )
    expect(result.onlyInCms.map((r) => r.id)).toEqual(['a', 'b', 'c'])
  })
})
