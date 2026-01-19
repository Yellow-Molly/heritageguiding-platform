import { describe, it, expect } from 'vitest'
import { getTours, getTourCategories } from '../get-tours'

describe('getTours', () => {
  describe('basic functionality', () => {
    it('returns tours array', async () => {
      const result = await getTours()
      expect(result.tours).toBeInstanceOf(Array)
      expect(result.tours.length).toBeGreaterThan(0)
    })

    it('returns pagination info', async () => {
      const result = await getTours()
      expect(result).toHaveProperty('total')
      expect(result).toHaveProperty('page')
      expect(result).toHaveProperty('totalPages')
    })

    it('defaults to page 1', async () => {
      const result = await getTours()
      expect(result.page).toBe(1)
    })

    it('returns valid tour objects', async () => {
      const result = await getTours()
      const tour = result.tours[0]

      expect(tour).toHaveProperty('id')
      expect(tour).toHaveProperty('title')
      expect(tour).toHaveProperty('description')
      expect(tour).toHaveProperty('price')
      expect(tour).toHaveProperty('duration')
    })
  })

  describe('category filtering', () => {
    it('filters by history category', async () => {
      const result = await getTours({ category: 'history' })
      expect(result.tours.length).toBeGreaterThan(0)
      // All returned tours should be in history category
      result.tours.forEach((tour) => {
        expect(['gamla-stan-walking', 'royal-palace', 'viking-history', 'nobel-prize-tour']).toContain(
          tour.id
        )
      })
    })

    it('filters by food category', async () => {
      const result = await getTours({ category: 'food' })
      expect(result.tours.length).toBe(1)
      expect(result.tours[0].id).toBe('stockholm-food-tour')
    })

    it('returns all tours for invalid category (validation rejects invalid values)', async () => {
      // Invalid categories are rejected by Zod validation, falling back to defaults
      const result = await getTours({ category: 'nonexistent' })
      // Should return all tours since invalid filter is ignored
      expect(result.tours.length).toBeGreaterThan(0)
    })
  })

  describe('price filtering', () => {
    it('filters by minimum price', async () => {
      const result = await getTours({ priceMin: '600' })
      result.tours.forEach((tour) => {
        expect(tour.price).toBeGreaterThanOrEqual(600)
      })
    })

    it('filters by maximum price', async () => {
      const result = await getTours({ priceMax: '500' })
      result.tours.forEach((tour) => {
        expect(tour.price).toBeLessThanOrEqual(500)
      })
    })

    it('filters by price range', async () => {
      const result = await getTours({ priceMin: '400', priceMax: '600' })
      result.tours.forEach((tour) => {
        expect(tour.price).toBeGreaterThanOrEqual(400)
        expect(tour.price).toBeLessThanOrEqual(600)
      })
    })
  })

  describe('duration filtering', () => {
    it('filters by max duration', async () => {
      const result = await getTours({ duration: '120' })
      result.tours.forEach((tour) => {
        expect(tour.duration).toBeLessThanOrEqual(120)
      })
    })

    it('filters short tours only', async () => {
      const result = await getTours({ duration: '90' })
      result.tours.forEach((tour) => {
        expect(tour.duration).toBeLessThanOrEqual(90)
      })
    })
  })

  describe('accessibility filtering', () => {
    it('filters wheelchair accessible tours', async () => {
      const result = await getTours({ accessible: 'true' })
      result.tours.forEach((tour) => {
        expect(tour.accessibility?.wheelchairAccessible).toBe(true)
      })
    })

    it('ignores accessibility when not set', async () => {
      const allTours = await getTours()
      const accessibleTours = await getTours({ accessible: 'true' })
      expect(allTours.total).toBeGreaterThan(accessibleTours.total)
    })
  })

  describe('search functionality', () => {
    it('searches by title', async () => {
      const result = await getTours({ q: 'Royal' })
      expect(result.tours.length).toBeGreaterThan(0)
      // Check that at least one tour matches the search
      const hasMatch = result.tours.some((tour) => tour.title.includes('Royal'))
      expect(hasMatch).toBe(true)
    })

    it('searches by description', async () => {
      const result = await getTours({ q: 'Viking' })
      expect(result.tours.length).toBeGreaterThan(0)
    })

    it('search is case-insensitive', async () => {
      const result1 = await getTours({ q: 'vasa' })
      const result2 = await getTours({ q: 'VASA' })
      expect(result1.total).toBe(result2.total)
    })

    it('returns empty for no matches', async () => {
      const result = await getTours({ q: 'xyznonexistent' })
      expect(result.tours).toHaveLength(0)
    })
  })

  describe('sorting', () => {
    it('sorts by price ascending', async () => {
      const result = await getTours({ sort: 'price-asc' })
      for (let i = 1; i < result.tours.length; i++) {
        expect(result.tours[i].price).toBeGreaterThanOrEqual(result.tours[i - 1].price)
      }
    })

    it('sorts by price descending', async () => {
      const result = await getTours({ sort: 'price-desc' })
      for (let i = 1; i < result.tours.length; i++) {
        expect(result.tours[i].price).toBeLessThanOrEqual(result.tours[i - 1].price)
      }
    })

    it('sorts by duration ascending', async () => {
      const result = await getTours({ sort: 'duration-asc' })
      for (let i = 1; i < result.tours.length; i++) {
        expect(result.tours[i].duration).toBeGreaterThanOrEqual(result.tours[i - 1].duration)
      }
    })

    it('sorts by rating descending', async () => {
      const result = await getTours({ sort: 'rating' })
      for (let i = 1; i < result.tours.length; i++) {
        expect(result.tours[i].rating).toBeLessThanOrEqual(result.tours[i - 1].rating)
      }
    })

    it('defaults to popular (reviewCount)', async () => {
      const result = await getTours({ sort: 'popular' })
      for (let i = 1; i < result.tours.length; i++) {
        expect(result.tours[i].reviewCount).toBeLessThanOrEqual(result.tours[i - 1].reviewCount)
      }
    })
  })

  describe('pagination', () => {
    it('respects page parameter', async () => {
      const page1 = await getTours({ page: '1', limit: '3' })
      const page2 = await getTours({ page: '2', limit: '3' })

      expect(page1.page).toBe(1)
      expect(page2.page).toBe(2)
      expect(page1.tours[0].id).not.toBe(page2.tours[0]?.id)
    })

    it('respects limit parameter', async () => {
      const result = await getTours({ limit: '3' })
      expect(result.tours.length).toBeLessThanOrEqual(3)
    })

    it('calculates totalPages correctly', async () => {
      const result = await getTours({ limit: '3' })
      expect(result.totalPages).toBe(Math.ceil(result.total / 3))
    })
  })

  describe('combined filters', () => {
    it('combines category and price filters', async () => {
      const result = await getTours({ category: 'history', priceMax: '600' })
      result.tours.forEach((tour) => {
        expect(['gamla-stan-walking', 'royal-palace', 'viking-history', 'nobel-prize-tour']).toContain(
          tour.id
        )
        expect(tour.price).toBeLessThanOrEqual(600)
      })
    })

    it('combines search and accessibility', async () => {
      const result = await getTours({ q: 'museum', accessible: 'true' })
      result.tours.forEach((tour) => {
        expect(tour.accessibility?.wheelchairAccessible).toBe(true)
      })
    })
  })
})

describe('getTourCategories', () => {
  it('returns array of categories', () => {
    const categories = getTourCategories()
    expect(categories).toBeInstanceOf(Array)
    expect(categories.length).toBeGreaterThan(0)
  })

  it('each category has id and name', () => {
    const categories = getTourCategories()
    categories.forEach((cat) => {
      expect(cat).toHaveProperty('id')
      expect(cat).toHaveProperty('name')
      expect(typeof cat.id).toBe('string')
      expect(typeof cat.name).toBe('string')
    })
  })

  it('includes expected categories', () => {
    const categories = getTourCategories()
    const ids = categories.map((c) => c.id)

    expect(ids).toContain('history')
    expect(ids).toContain('architecture')
    expect(ids).toContain('food')
  })
})
