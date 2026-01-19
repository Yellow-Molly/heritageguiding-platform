import { describe, it, expect } from 'vitest'
import { getTourReviews, calculateAverageRating } from '../get-tour-reviews'

describe('getTourReviews', () => {
  describe('basic functionality', () => {
    it('returns reviews for valid tour', async () => {
      const reviews = await getTourReviews('gamla-stan-walking')
      expect(reviews).toBeInstanceOf(Array)
      expect(reviews.length).toBeGreaterThan(0)
    })

    it('returns empty array for tour with no reviews', async () => {
      const reviews = await getTourReviews('nonexistent-tour')
      expect(reviews).toBeInstanceOf(Array)
      expect(reviews.length).toBe(0)
    })

    it('respects limit parameter', async () => {
      const reviews = await getTourReviews('gamla-stan-walking', 2)
      expect(reviews.length).toBeLessThanOrEqual(2)
    })
  })

  describe('review structure', () => {
    it('returns valid review objects', async () => {
      const reviews = await getTourReviews('gamla-stan-walking')
      const review = reviews[0]

      expect(review).toHaveProperty('id')
      expect(review).toHaveProperty('tourId')
      expect(review).toHaveProperty('authorName')
      expect(review).toHaveProperty('rating')
      expect(review).toHaveProperty('text')
      expect(review).toHaveProperty('date')
      expect(review).toHaveProperty('verified')
    })

    it('ratings are in valid range', async () => {
      const reviews = await getTourReviews('gamla-stan-walking')
      reviews.forEach((review) => {
        expect(review.rating).toBeGreaterThanOrEqual(1)
        expect(review.rating).toBeLessThanOrEqual(5)
      })
    })

    it('returns verified reviews only', async () => {
      const reviews = await getTourReviews('gamla-stan-walking')
      reviews.forEach((review) => {
        expect(review.verified).toBe(true)
      })
    })
  })

  describe('different tours', () => {
    it('returns reviews for royal-palace', async () => {
      const reviews = await getTourReviews('royal-palace')
      expect(reviews.length).toBeGreaterThan(0)
    })

    it('returns reviews for vasa-museum', async () => {
      const reviews = await getTourReviews('vasa-museum')
      expect(reviews.length).toBeGreaterThan(0)
    })
  })
})

describe('calculateAverageRating', () => {
  it('calculates average correctly', () => {
    const reviews = [
      { id: '1', tourId: 't', authorName: 'A', rating: 5, text: '', date: '', verified: true },
      { id: '2', tourId: 't', authorName: 'B', rating: 4, text: '', date: '', verified: true },
      { id: '3', tourId: 't', authorName: 'C', rating: 3, text: '', date: '', verified: true },
    ]
    expect(calculateAverageRating(reviews)).toBe(4)
  })

  it('returns 0 for empty array', () => {
    expect(calculateAverageRating([])).toBe(0)
  })

  it('handles single review', () => {
    const reviews = [
      { id: '1', tourId: 't', authorName: 'A', rating: 4, text: '', date: '', verified: true },
    ]
    expect(calculateAverageRating(reviews)).toBe(4)
  })
})
