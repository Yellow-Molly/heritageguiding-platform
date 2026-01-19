import { describe, it, expect } from 'vitest'
import { getRelatedTours } from '../get-related-tours'

describe('getRelatedTours', () => {
  describe('basic functionality', () => {
    it('returns related tours array', async () => {
      const tours = await getRelatedTours('gamla-stan-walking', [{ id: 'history', slug: 'history' }])
      expect(tours).toBeInstanceOf(Array)
    })

    it('excludes current tour from results', async () => {
      const tours = await getRelatedTours('gamla-stan-walking', [{ id: 'history', slug: 'history' }])
      const ids = tours.map((t) => t.id)
      expect(ids).not.toContain('gamla-stan-walking')
    })

    it('respects limit parameter', async () => {
      const tours = await getRelatedTours('gamla-stan-walking', [{ id: 'history', slug: 'history' }], 2)
      expect(tours.length).toBeLessThanOrEqual(2)
    })
  })

  describe('category matching', () => {
    it('returns tours from same category', async () => {
      const tours = await getRelatedTours('gamla-stan-walking', [{ id: 'history', slug: 'history' }])
      // Should return other history tours
      const ids = tours.map((t) => t.id)
      expect(ids.some((id) => ['royal-palace', 'viking-history', 'nobel-prize-tour'].includes(id))).toBe(true)
    })

    it('returns museum tours for museum category', async () => {
      const tours = await getRelatedTours('vasa-museum', [{ id: 'museum', slug: 'museum' }])
      // Should return other museum tours
      expect(tours.length).toBeGreaterThan(0)
    })

    it('returns tours when no categories provided', async () => {
      const tours = await getRelatedTours('gamla-stan-walking', undefined)
      expect(tours).toBeInstanceOf(Array)
      expect(tours.length).toBeGreaterThan(0)
    })

    it('returns tours with empty categories array', async () => {
      const tours = await getRelatedTours('gamla-stan-walking', [])
      expect(tours).toBeInstanceOf(Array)
      expect(tours.length).toBeGreaterThan(0)
    })
  })

  describe('tour structure', () => {
    it('returns valid tour objects', async () => {
      const tours = await getRelatedTours('gamla-stan-walking', [{ id: 'history', slug: 'history' }])
      if (tours.length > 0) {
        const tour = tours[0]
        expect(tour).toHaveProperty('id')
        expect(tour).toHaveProperty('title')
        expect(tour).toHaveProperty('slug')
        expect(tour).toHaveProperty('price')
        expect(tour).toHaveProperty('duration')
        expect(tour).toHaveProperty('image')
      }
    })
  })
})
