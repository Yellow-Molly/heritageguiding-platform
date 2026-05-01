import { describe, it, expect, vi } from 'vitest'
import { tourFiltersSchema, validateTourFilters } from '../tour-filters'

describe('tourFiltersSchema — cities', () => {
  it('accepts a single valid city slug', () => {
    const result = tourFiltersSchema.safeParse({ cities: 'stockholm' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.cities).toBe('stockholm')
  })

  it('accepts a comma-separated list of city slugs', () => {
    const result = tourFiltersSchema.safeParse({ cities: 'stockholm,sigtuna,uppsala' })
    expect(result.success).toBe(true)
  })

  it('rejects city slug with uppercase', () => {
    const result = tourFiltersSchema.safeParse({ cities: 'STOCKHOLM' })
    expect(result.success).toBe(false)
  })

  it('rejects city slug with special characters', () => {
    const result = tourFiltersSchema.safeParse({ cities: 'stockholm!' })
    expect(result.success).toBe(false)
  })

  it('omits empty optional fields', () => {
    const result = tourFiltersSchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.cities).toBeUndefined()
    }
  })
})

describe('validateTourFilters — cities', () => {
  it('passes through valid cities', () => {
    const out = validateTourFilters({ cities: 'stockholm' })
    expect(out.cities).toBe('stockholm')
  })

  it('falls back to safe defaults on invalid input (warn logged)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const out = validateTourFilters({ cities: 'STOCKHOLM!' })
    // safe-default branch returns minimal shape (sort=popular, q=undefined)
    expect(out.cities).toBeUndefined()
    expect(out.sort).toBe('popular')
    warn.mockRestore()
  })
})
