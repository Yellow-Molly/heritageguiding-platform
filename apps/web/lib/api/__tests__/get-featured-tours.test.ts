import { describe, it, expect } from 'vitest'
import { getFeaturedTours, type FeaturedTour } from '../get-featured-tours'

describe('getFeaturedTours', () => {
  describe('basic functionality', () => {
    it('returns an array of tours', async () => {
      const tours = await getFeaturedTours()
      expect(Array.isArray(tours)).toBe(true)
      expect(tours.length).toBeGreaterThan(0)
    })

    it('returns tours with required properties', async () => {
      const tours = await getFeaturedTours()
      const tour = tours[0]

      expect(tour).toHaveProperty('id')
      expect(tour).toHaveProperty('title')
      expect(tour).toHaveProperty('description')
      expect(tour).toHaveProperty('slug')
      expect(tour).toHaveProperty('image')
      expect(tour).toHaveProperty('duration')
      expect(tour).toHaveProperty('maxCapacity')
      expect(tour).toHaveProperty('rating')
      expect(tour).toHaveProperty('price')
    })

    it('tour image has url and alt', async () => {
      const tours = await getFeaturedTours()
      const tour = tours[0]

      expect(tour.image).toHaveProperty('url')
      expect(tour.image).toHaveProperty('alt')
      expect(typeof tour.image.url).toBe('string')
      expect(typeof tour.image.alt).toBe('string')
    })
  })

  describe('limit parameter', () => {
    it('respects the limit parameter', async () => {
      const tours = await getFeaturedTours('en', 2)
      expect(tours.length).toBeLessThanOrEqual(2)
    })

    it('returns all tours when limit exceeds available', async () => {
      const tours = await getFeaturedTours('en', 100)
      expect(tours.length).toBeLessThanOrEqual(100)
    })

    it('defaults to 6 tours when no limit specified', async () => {
      const tours = await getFeaturedTours()
      expect(tours.length).toBeLessThanOrEqual(6)
    })
  })

  describe('tour data validation', () => {
    it('tour duration is a positive number', async () => {
      const tours = await getFeaturedTours()
      tours.forEach((tour) => {
        expect(tour.duration).toBeGreaterThan(0)
      })
    })

    it('tour rating is between 0 and 5', async () => {
      const tours = await getFeaturedTours()
      tours.forEach((tour) => {
        expect(tour.rating).toBeGreaterThanOrEqual(0)
        expect(tour.rating).toBeLessThanOrEqual(5)
      })
    })

    it('tour price is a positive number', async () => {
      const tours = await getFeaturedTours()
      tours.forEach((tour) => {
        expect(tour.price).toBeGreaterThan(0)
      })
    })

    it('tour maxCapacity is a positive number', async () => {
      const tours = await getFeaturedTours()
      tours.forEach((tour) => {
        expect(tour.maxCapacity).toBeGreaterThan(0)
      })
    })
  })

  describe('accessibility data', () => {
    it('some tours have accessibility information', async () => {
      const tours = await getFeaturedTours()
      const toursWithAccessibility = tours.filter((tour) => tour.accessibility)
      expect(toursWithAccessibility.length).toBeGreaterThan(0)
    })

    it('accessibility object has boolean properties', async () => {
      const tours = await getFeaturedTours()
      const tourWithAccessibility = tours.find((tour) => tour.accessibility)

      if (tourWithAccessibility?.accessibility) {
        const { accessibility } = tourWithAccessibility
        if (accessibility.wheelchairAccessible !== undefined) {
          expect(typeof accessibility.wheelchairAccessible).toBe('boolean')
        }
        if (accessibility.hearingAccessible !== undefined) {
          expect(typeof accessibility.hearingAccessible).toBe('boolean')
        }
      }
    })
  })
})
