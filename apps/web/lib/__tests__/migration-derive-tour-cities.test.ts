/**
 * Unit tests for the pure helper that turns a tour's neighborhood references
 * into a deduped list of city IDs. Imports the migration-script helper
 * directly (relative path) so the runner has no Payload dependency.
 */
import { describe, it, expect } from 'vitest'
import {
  deriveCityIdsFromNeighborhoods,
  extractCityId,
} from '../../../../scripts/lib/derive-tour-cities'

describe('extractCityId', () => {
  it('returns null for null/undefined city', () => {
    expect(extractCityId({ id: 1, city: null })).toBeNull()
    expect(extractCityId({ id: 1, city: undefined })).toBeNull()
  })

  it('returns the raw foreign key when city is a number', () => {
    expect(extractCityId({ id: 1, city: 42 })).toBe(42)
  })

  it('returns the raw foreign key when city is a string id', () => {
    expect(extractCityId({ id: 1, city: 'abc' })).toBe('abc')
  })

  it('returns the populated object id', () => {
    expect(extractCityId({ id: 1, city: { id: 7 } })).toBe(7)
  })
})

describe('deriveCityIdsFromNeighborhoods', () => {
  it('returns [] for null or empty input', () => {
    expect(deriveCityIdsFromNeighborhoods(null)).toEqual([])
    expect(deriveCityIdsFromNeighborhoods(undefined)).toEqual([])
    expect(deriveCityIdsFromNeighborhoods([])).toEqual([])
  })

  it('dedupes city IDs across neighborhoods', () => {
    const out = deriveCityIdsFromNeighborhoods([
      { id: 1, city: 1 },
      { id: 2, city: 1 },
      { id: 3, city: 2 },
    ])
    expect(out).toEqual([1, 2])
  })

  it('preserves first-seen order', () => {
    const out = deriveCityIdsFromNeighborhoods([
      { id: 10, city: 3 },
      { id: 11, city: 1 },
      { id: 12, city: 2 },
    ])
    expect(out).toEqual([3, 1, 2])
  })

  it('skips neighborhoods with null city', () => {
    const out = deriveCityIdsFromNeighborhoods([
      { id: 1, city: null },
      { id: 2, city: 5 },
    ])
    expect(out).toEqual([5])
  })

  it('handles populated city objects', () => {
    const out = deriveCityIdsFromNeighborhoods([
      { id: 1, city: { id: 1 } },
      { id: 2, city: { id: 2 } },
      { id: 3, city: { id: 1 } },
    ])
    expect(out).toEqual([1, 2])
  })
})
