import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock payload boundary BEFORE importing the module under test.
const findMock = vi.fn()
vi.mock('payload', () => ({
  getPayload: vi.fn(async () => ({ find: findMock })),
}))
vi.mock('@payload-config', () => ({ default: {} }))

// `unstable_cache` wraps the function — for unit tests we want it to be a
// pass-through. Replace it with the identity (return the function as-is).
vi.mock('next/cache', () => ({
  unstable_cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
}))

const { getCitiesWithTours } = await import('../get-cities-with-tours')

beforeEach(() => {
  findMock.mockReset()
})

interface PopulatedCity {
  id: number
  name: string
  slug: string
}

function tour(cities: PopulatedCity[]) {
  return { id: Math.random(), cities }
}

describe('getCitiesWithTours', () => {
  it('returns empty list when no tours match', async () => {
    findMock.mockResolvedValue({ docs: [] })
    const out = await getCitiesWithTours('en')
    expect(out).toEqual([])
  })

  it('counts each city once per tour', async () => {
    const stockholm: PopulatedCity = { id: 1, name: 'Stockholm', slug: 'stockholm' }
    const sigtuna: PopulatedCity = { id: 2, name: 'Sigtuna', slug: 'sigtuna' }
    findMock.mockResolvedValue({
      docs: [
        tour([stockholm]),
        tour([stockholm]),
        tour([stockholm, sigtuna]),
      ],
    })
    const out = await getCitiesWithTours('en')
    const stk = out.find((c) => c.slug === 'stockholm')
    const sig = out.find((c) => c.slug === 'sigtuna')
    expect(stk?.tourCount).toBe(3)
    expect(sig?.tourCount).toBe(1)
  })

  it('sorts by tourCount descending', async () => {
    const a: PopulatedCity = { id: 1, name: 'A', slug: 'a' }
    const b: PopulatedCity = { id: 2, name: 'B', slug: 'b' }
    const c: PopulatedCity = { id: 3, name: 'C', slug: 'c' }
    findMock.mockResolvedValue({
      docs: [tour([a]), tour([a]), tour([a]), tour([b]), tour([b]), tour([c])],
    })
    const out = await getCitiesWithTours('en')
    expect(out.map((x) => x.slug)).toEqual(['a', 'b', 'c'])
    expect(out.map((x) => x.tourCount)).toEqual([3, 2, 1])
  })

  it('respects limit', async () => {
    const a: PopulatedCity = { id: 1, name: 'A', slug: 'a' }
    const b: PopulatedCity = { id: 2, name: 'B', slug: 'b' }
    const c: PopulatedCity = { id: 3, name: 'C', slug: 'c' }
    findMock.mockResolvedValue({
      docs: [tour([a]), tour([a]), tour([b]), tour([c])],
    })
    const out = await getCitiesWithTours('en', 2)
    expect(out).toHaveLength(2)
  })

  it('skips raw foreign-key entries (depth:0 case)', async () => {
    findMock.mockResolvedValue({
      docs: [
        // city is just the id, not populated — should be ignored
        { id: 1, cities: [42, 43] },
        tour([{ id: 1, name: 'Stockholm', slug: 'stockholm' }]),
      ],
    })
    const out = await getCitiesWithTours('en')
    expect(out).toHaveLength(1)
    expect(out[0].slug).toBe('stockholm')
  })

  it('handles tours with no cities array', async () => {
    findMock.mockResolvedValue({
      docs: [{ id: 1, cities: null }, { id: 2 }],
    })
    const out = await getCitiesWithTours('en')
    expect(out).toEqual([])
  })

  it('skips populated city refs missing name or slug (would otherwise render "undefined")', async () => {
    findMock.mockResolvedValue({
      docs: [
        { id: 1, cities: [{ id: 99 }] }, // missing name + slug
        { id: 2, cities: [{ id: 100, name: 'X' }] }, // missing slug
        { id: 3, cities: [{ id: 1, name: 'Stockholm', slug: 'stockholm' }] },
      ],
    })
    const out = await getCitiesWithTours('en')
    expect(out).toHaveLength(1)
    expect(out[0].slug).toBe('stockholm')
  })
})
