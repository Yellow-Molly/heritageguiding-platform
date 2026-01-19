import { describe, it, expect } from 'vitest'
import { getTourBySlug, getAllTourSlugs } from '../get-tour-by-slug'

describe('getTourBySlug', () => {
  describe('basic functionality', () => {
    it('returns tour details for valid slug', async () => {
      const tour = await getTourBySlug('gamla-stan-walking', 'en')
      expect(tour).not.toBeNull()
      expect(tour?.id).toBe('gamla-stan-walking')
      expect(tour?.title).toBe('Gamla Stan Walking Tour')
    })

    it('returns null for invalid slug', async () => {
      const tour = await getTourBySlug('nonexistent-tour', 'en')
      expect(tour).toBeNull()
    })

    it('returns extended tour details', async () => {
      const tour = await getTourBySlug('gamla-stan-walking', 'en')
      expect(tour).toHaveProperty('descriptionHtml')
      expect(tour).toHaveProperty('highlights')
      expect(tour).toHaveProperty('gallery')
      expect(tour).toHaveProperty('logistics')
      expect(tour).toHaveProperty('guide')
    })
  })

  describe('tour properties', () => {
    it('returns gallery with images', async () => {
      const tour = await getTourBySlug('gamla-stan-walking', 'en')
      expect(tour?.gallery).toBeInstanceOf(Array)
      expect(tour?.gallery?.length).toBeGreaterThan(0)
      expect(tour?.gallery?.[0]).toHaveProperty('image')
      expect(tour?.gallery?.[0].image).toHaveProperty('url')
      expect(tour?.gallery?.[0].image).toHaveProperty('alt')
    })

    it('returns highlights', async () => {
      const tour = await getTourBySlug('gamla-stan-walking', 'en')
      expect(tour?.highlights).toBeInstanceOf(Array)
      expect(tour?.highlights?.length).toBeGreaterThan(0)
      expect(tour?.highlights?.[0]).toHaveProperty('highlight')
    })

    it('returns logistics with coordinates', async () => {
      const tour = await getTourBySlug('gamla-stan-walking', 'en')
      expect(tour?.logistics).toBeDefined()
      expect(tour?.logistics?.meetingPointName).toBeDefined()
      expect(tour?.logistics?.coordinates).toBeDefined()
      expect(tour?.logistics?.coordinates?.latitude).toBeTypeOf('number')
      expect(tour?.logistics?.coordinates?.longitude).toBeTypeOf('number')
    })

    it('returns inclusions/exclusions', async () => {
      const tour = await getTourBySlug('gamla-stan-walking', 'en')
      expect(tour?.included).toBeInstanceOf(Array)
      expect(tour?.notIncluded).toBeInstanceOf(Array)
      expect(tour?.whatToBring).toBeInstanceOf(Array)
    })

    it('returns guide information', async () => {
      const tour = await getTourBySlug('gamla-stan-walking', 'en')
      expect(tour?.guide).toBeDefined()
      expect(tour?.guide?.name).toBeDefined()
      expect(tour?.guide?.bio).toBeDefined()
      expect(tour?.guide?.credentials).toBeInstanceOf(Array)
    })

    it('returns categories', async () => {
      const tour = await getTourBySlug('gamla-stan-walking', 'en')
      expect(tour?.categories).toBeInstanceOf(Array)
      expect(tour?.categories?.length).toBeGreaterThan(0)
      expect(tour?.categories?.[0]).toHaveProperty('id')
      expect(tour?.categories?.[0]).toHaveProperty('name')
    })
  })

  describe('different tours', () => {
    it('returns royal-palace tour', async () => {
      const tour = await getTourBySlug('royal-palace', 'en')
      expect(tour).not.toBeNull()
      expect(tour?.id).toBe('royal-palace')
    })

    it('returns vasa-museum tour', async () => {
      const tour = await getTourBySlug('vasa-museum', 'en')
      expect(tour).not.toBeNull()
      expect(tour?.id).toBe('vasa-museum')
      expect(tour?.accessibility?.visualAccessible).toBe(true)
    })
  })
})

describe('getAllTourSlugs', () => {
  it('returns array of slugs', async () => {
    const slugs = await getAllTourSlugs()
    expect(slugs).toBeInstanceOf(Array)
    expect(slugs.length).toBeGreaterThan(0)
  })

  it('each item has slug property', async () => {
    const slugs = await getAllTourSlugs()
    slugs.forEach((item) => {
      expect(item).toHaveProperty('slug')
      expect(typeof item.slug).toBe('string')
    })
  })

  it('includes known tour slugs', async () => {
    const slugs = await getAllTourSlugs()
    const slugValues = slugs.map((s) => s.slug)
    expect(slugValues).toContain('gamla-stan-walking')
    expect(slugValues).toContain('royal-palace')
    expect(slugValues).toContain('vasa-museum')
  })
})
