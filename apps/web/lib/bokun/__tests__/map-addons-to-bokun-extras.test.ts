/**
 * Tests for map-addons-to-bokun-extras.ts (CMS optionalAddOns → BokunExtraInput[]).
 * Covers Phase 03 scope per plans/260525-1417-bokun-extras-push-sync/phase-03-*.md.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  mapAddOnsToBokunExtras,
  type AddOnSource,
} from '../map-addons-to-bokun-extras'

afterEach(() => {
  vi.restoreAllMocks()
})

function row(overrides: Partial<AddOnSource> = {}): AddOnSource {
  return {
    id: 'row-default',
    name: { en: 'Museum Ticket' },
    displayOrder: 0,
    ...overrides,
  }
}

describe('mapAddOnsToBokunExtras', () => {
  it('returns empty array for null/undefined/empty input', () => {
    expect(mapAddOnsToBokunExtras(null)).toEqual([])
    expect(mapAddOnsToBokunExtras(undefined)).toEqual([])
    expect(mapAddOnsToBokunExtras([])).toEqual([])
  })

  it('maps a single row (CREATE path — no existing bokunExtraId)', () => {
    const out = mapAddOnsToBokunExtras([row({ id: 'cms-1', bokunExtraId: undefined })])
    expect(out).toEqual([
      {
        externalId: 'cms-1',
        title: [{ locale: 'en', value: 'Museum Ticket' }],
      },
    ])
    expect(out[0]).not.toHaveProperty('existingBokunExtraId')
  })

  it('maps a single row (UPDATE path — bokunExtraId present)', () => {
    const out = mapAddOnsToBokunExtras([row({ id: 'cms-1', bokunExtraId: '276080' })])
    expect(out[0].existingBokunExtraId).toBe('276080')
  })

  it('trims whitespace bokunExtraId → treats as CREATE', () => {
    const out = mapAddOnsToBokunExtras([row({ bokunExtraId: '   ' })])
    expect(out[0]).not.toHaveProperty('existingBokunExtraId')
  })

  it('emits localized title in stable sv → en → de order', () => {
    const out = mapAddOnsToBokunExtras([
      row({ name: { de: 'Museumsticket', en: 'Museum Ticket', sv: 'Museumsbiljett' } }),
    ])
    expect(out[0].title).toEqual([
      { locale: 'sv', value: 'Museumsbiljett' },
      { locale: 'en', value: 'Museum Ticket' },
      { locale: 'de', value: 'Museumsticket' },
    ])
  })

  it('trims leading/trailing whitespace from title + description values', () => {
    const out = mapAddOnsToBokunExtras([
      row({ name: { en: '  Museum Ticket  ' }, description: { en: '\tEntry\n' } }),
    ])
    expect(out[0].title).toEqual([{ locale: 'en', value: 'Museum Ticket' }])
    expect(out[0].description).toEqual([{ locale: 'en', value: 'Entry' }])
  })

  it('emits description when present in any locale', () => {
    const out = mapAddOnsToBokunExtras([
      row({ description: { en: 'Entry to the Vasa museum' } }),
    ])
    expect(out[0].description).toEqual([{ locale: 'en', value: 'Entry to the Vasa museum' }])
  })

  it('omits description when all locales are empty/whitespace', () => {
    const out = mapAddOnsToBokunExtras([
      row({ description: { en: '', sv: '   ', de: null } }),
    ])
    expect(out[0]).not.toHaveProperty('description')
  })

  it('drops rows whose name is empty across all locales (with warning)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const out = mapAddOnsToBokunExtras([
      row({ id: 'keep', name: { en: 'Real' } }),
      row({ id: 'drop1', name: {} }),
      row({ id: 'drop2', name: { en: '   ', sv: '' } }),
    ])
    expect(out).toHaveLength(1)
    expect(out[0].externalId).toBe('keep')
    expect(warn).toHaveBeenCalledTimes(2)
  })

  it('drops rows missing id (legacy Payload data) with warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const out = mapAddOnsToBokunExtras([row({ id: null }), row({ id: '' })])
    expect(out).toEqual([])
    expect(warn).toHaveBeenCalledTimes(2)
  })

  it('sorts by displayOrder ascending, ties keep CMS order', () => {
    const out = mapAddOnsToBokunExtras([
      row({ id: 'a', displayOrder: 2, name: { en: 'A' } }),
      row({ id: 'b', displayOrder: 1, name: { en: 'B' } }),
      row({ id: 'c', displayOrder: 1, name: { en: 'C' } }),
      row({ id: 'd', displayOrder: 0, name: { en: 'D' } }),
    ])
    expect(out.map((e) => e.externalId)).toEqual(['d', 'b', 'c', 'a'])
  })

  it('defaults displayOrder to 0 when missing', () => {
    const out = mapAddOnsToBokunExtras([
      row({ id: 'no-order', name: { en: 'A' } }),
      row({ id: 'order-1', displayOrder: 1, name: { en: 'B' } }),
    ])
    expect(out.map((e) => e.externalId)).toEqual(['no-order', 'order-1'])
  })

  it('numeric ids are coerced to string for externalId', () => {
    const out = mapAddOnsToBokunExtras([row({ id: 42 })])
    expect(out[0].externalId).toBe('42')
  })

  it('Phase 01 contract: mapper output never references price/currency/isRequired', () => {
    // CMS fields exist but mapper must ignore them (Bokun ExtraDto rejects).
    const out = mapAddOnsToBokunExtras([
      row({
        id: 'cms-1',
        // these fields are NOT on AddOnSource but a real CMS row carries them;
        // cast to any so test mirrors reality.
        ...({
          pricingType: 'perBooking',
          adultPriceHint: 150,
          currency: 'SEK',
          isRequired: true,
        } as Record<string, unknown>),
      } as AddOnSource),
    ])
    const dto = out[0] as unknown as Record<string, unknown>
    expect(dto).not.toHaveProperty('price')
    expect(dto).not.toHaveProperty('amount')
    expect(dto).not.toHaveProperty('currency')
    expect(dto).not.toHaveProperty('required')
    expect(dto).not.toHaveProperty('isRequired')
    expect(dto).not.toHaveProperty('pricingType')
  })
})
