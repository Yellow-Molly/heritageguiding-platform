import { describe, it, expect } from 'vitest'
import { getCategories, getAllCategories, type Category, type CategoryType } from '../get-categories'

describe('getCategories', () => {
  describe('theme categories', () => {
    it('returns an array of theme categories', async () => {
      const categories = await getCategories('theme')
      expect(Array.isArray(categories)).toBe(true)
      expect(categories.length).toBeGreaterThan(0)
    })

    it('all categories have type "theme"', async () => {
      const categories = await getCategories('theme')
      categories.forEach((cat) => {
        expect(cat.type).toBe('theme')
      })
    })

    it('theme categories have required properties', async () => {
      const categories = await getCategories('theme')
      categories.forEach((cat) => {
        expect(cat).toHaveProperty('id')
        expect(cat).toHaveProperty('name')
        expect(cat).toHaveProperty('slug')
        expect(cat).toHaveProperty('type')
        expect(cat).toHaveProperty('tourCount')
      })
    })
  })

  describe('neighborhood categories', () => {
    it('returns an array of neighborhood categories', async () => {
      const categories = await getCategories('neighborhood')
      expect(Array.isArray(categories)).toBe(true)
      expect(categories.length).toBeGreaterThan(0)
    })

    it('all categories have type "neighborhood"', async () => {
      const categories = await getCategories('neighborhood')
      categories.forEach((cat) => {
        expect(cat.type).toBe('neighborhood')
      })
    })

    it('neighborhood categories have required properties', async () => {
      const categories = await getCategories('neighborhood')
      categories.forEach((cat) => {
        expect(cat).toHaveProperty('id')
        expect(cat).toHaveProperty('name')
        expect(cat).toHaveProperty('slug')
        expect(cat).toHaveProperty('type')
        expect(cat).toHaveProperty('tourCount')
      })
    })
  })

  describe('category data validation', () => {
    it('tourCount is a non-negative number', async () => {
      const themes = await getCategories('theme')
      const neighborhoods = await getCategories('neighborhood')
      const allCategories = [...themes, ...neighborhoods]

      allCategories.forEach((cat) => {
        expect(cat.tourCount).toBeGreaterThanOrEqual(0)
      })
    })

    it('slug is a non-empty string', async () => {
      const categories = await getCategories('theme')
      categories.forEach((cat) => {
        expect(typeof cat.slug).toBe('string')
        expect(cat.slug.length).toBeGreaterThan(0)
      })
    })

    it('name is a non-empty string', async () => {
      const categories = await getCategories('neighborhood')
      categories.forEach((cat) => {
        expect(typeof cat.name).toBe('string')
        expect(cat.name.length).toBeGreaterThan(0)
      })
    })
  })
})

describe('getAllCategories', () => {
  it('returns both themes and neighborhoods', async () => {
    const result = await getAllCategories()
    expect(result).toHaveProperty('themes')
    expect(result).toHaveProperty('neighborhoods')
  })

  it('themes array is not empty', async () => {
    const { themes } = await getAllCategories()
    expect(Array.isArray(themes)).toBe(true)
    expect(themes.length).toBeGreaterThan(0)
  })

  it('neighborhoods array is not empty', async () => {
    const { neighborhoods } = await getAllCategories()
    expect(Array.isArray(neighborhoods)).toBe(true)
    expect(neighborhoods.length).toBeGreaterThan(0)
  })

  it('themes have correct type', async () => {
    const { themes } = await getAllCategories()
    themes.forEach((cat) => {
      expect(cat.type).toBe('theme')
    })
  })

  it('neighborhoods have correct type', async () => {
    const { neighborhoods } = await getAllCategories()
    neighborhoods.forEach((cat) => {
      expect(cat.type).toBe('neighborhood')
    })
  })
})
