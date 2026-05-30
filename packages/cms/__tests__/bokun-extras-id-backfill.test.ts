/**
 * Tests for bokun-extras-id-backfill helper.
 * Verifies the externalId-keyed correlation between CMS rows and Bokun's PUT
 * response, and that unknown CMS row fields round-trip unchanged.
 */
import { describe, it, expect } from 'vitest'
import { backfillExtraIdsFromBokunResponse } from '../lib/bokun-extras-id-backfill'
import type { BokunExtraComponentDto } from '../../../apps/web/lib/bokun/bokun-types'

function bokunExtra(externalId: string, id: number): BokunExtraComponentDto {
  return {
    id,
    externalId,
    title: 'whatever',
    type: 'OTHERS',
    maxPerBooking: 5,
    limitByPax: false,
  }
}

describe('backfillExtraIdsFromBokunResponse', () => {
  it('returns null when there are no CMS rows', () => {
    expect(backfillExtraIdsFromBokunResponse(null, [bokunExtra('a', 1)])).toBeNull()
    expect(backfillExtraIdsFromBokunResponse([], [bokunExtra('a', 1)])).toBeNull()
  })

  it('returns null when Bokun returns no extras (text-only sync)', () => {
    const rows = [{ id: 'cms-1', bokunExtraId: null }]
    expect(backfillExtraIdsFromBokunResponse(rows, undefined)).toBeNull()
    expect(backfillExtraIdsFromBokunResponse(rows, [])).toBeNull()
  })

  it('returns null when every CMS row already has a bokunExtraId', () => {
    const rows = [
      { id: 'cms-1', bokunExtraId: '276080' },
      { id: 'cms-2', bokunExtraId: '276081' },
    ]
    expect(
      backfillExtraIdsFromBokunResponse(rows, [
        bokunExtra('cms-1', 999),
        bokunExtra('cms-2', 1000),
      ])
    ).toBeNull()
  })

  it('writes Bokun id back into the matching CMS row (externalId match)', () => {
    const rows = [{ id: 'cms-1', bokunExtraId: null, customField: 'preserved' }]
    const result = backfillExtraIdsFromBokunResponse(rows, [bokunExtra('cms-1', 5378)])
    expect(result).not.toBeNull()
    expect(result?.[0].bokunExtraId).toBe('5378')
    // Generic preserves unrelated CMS fields (pricingType, adultPriceHint, …).
    expect(result?.[0].customField).toBe('preserved')
  })

  it('only updates rows that were missing bokunExtraId (mixed CREATE+UPDATE)', () => {
    const rows = [
      { id: 'a', bokunExtraId: null },
      { id: 'b', bokunExtraId: '276080' }, // existing — leave alone
      { id: 'c', bokunExtraId: '   ' }, // whitespace counts as empty
    ]
    const result = backfillExtraIdsFromBokunResponse(rows, [
      bokunExtra('a', 5378),
      bokunExtra('b', 276080),
      bokunExtra('c', 5379),
    ])
    expect(result?.[0].bokunExtraId).toBe('5378')
    expect(result?.[1].bokunExtraId).toBe('276080') // untouched
    expect(result?.[2].bokunExtraId).toBe('5379')
  })

  it('leaves a row alone when no Bokun extra matches its externalId', () => {
    const rows = [{ id: 'cms-orphan', bokunExtraId: null }]
    const result = backfillExtraIdsFromBokunResponse(rows, [bokunExtra('different', 999)])
    expect(result).toBeNull() // nothing mutated → null
  })

  it('coerces numeric CMS row id to string for externalId comparison', () => {
    const rows = [{ id: 42, bokunExtraId: null }]
    const result = backfillExtraIdsFromBokunResponse(rows, [bokunExtra('42', 5378)])
    expect(result?.[0].bokunExtraId).toBe('5378')
  })

  it('skips rows with no id (no correlation possible)', () => {
    const rows = [
      { id: null, bokunExtraId: null },
      { id: 'cms-1', bokunExtraId: null },
    ]
    const result = backfillExtraIdsFromBokunResponse(rows, [bokunExtra('cms-1', 999)])
    expect(result?.[0].bokunExtraId).toBeNull() // unchanged
    expect(result?.[1].bokunExtraId).toBe('999')
  })

  it('handles Bokun extra without an assigned id (defensive — should not happen)', () => {
    const rows = [{ id: 'cms-1', bokunExtraId: null }]
    const oddExtra: BokunExtraComponentDto = {
      externalId: 'cms-1',
      title: 't',
      type: 'OTHERS',
      maxPerBooking: 5,
      limitByPax: false,
    } // no id
    expect(backfillExtraIdsFromBokunResponse(rows, [oddExtra])).toBeNull()
  })
})
