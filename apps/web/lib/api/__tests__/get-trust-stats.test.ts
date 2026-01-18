import { describe, it, expect } from 'vitest'
import { getTrustStats, formatTrustStats, type TrustStats } from '../get-trust-stats'

describe('getTrustStats', () => {
  describe('basic functionality', () => {
    it('returns a stats object', async () => {
      const stats = await getTrustStats()
      expect(typeof stats).toBe('object')
      expect(stats).not.toBeNull()
    })

    it('returns all required properties', async () => {
      const stats = await getTrustStats()

      expect(stats).toHaveProperty('happyTravelers')
      expect(stats).toHaveProperty('uniqueTours')
      expect(stats).toHaveProperty('averageRating')
      expect(stats).toHaveProperty('yearsExperience')
      expect(stats).toHaveProperty('totalReviews')
      expect(stats).toHaveProperty('licensedGuides')
    })
  })

  describe('stats validation', () => {
    it('happyTravelers is a positive number', async () => {
      const stats = await getTrustStats()
      expect(stats.happyTravelers).toBeGreaterThan(0)
    })

    it('uniqueTours is a positive number', async () => {
      const stats = await getTrustStats()
      expect(stats.uniqueTours).toBeGreaterThan(0)
    })

    it('averageRating is between 0 and 5', async () => {
      const stats = await getTrustStats()
      expect(stats.averageRating).toBeGreaterThanOrEqual(0)
      expect(stats.averageRating).toBeLessThanOrEqual(5)
    })

    it('yearsExperience is a positive number', async () => {
      const stats = await getTrustStats()
      expect(stats.yearsExperience).toBeGreaterThan(0)
    })

    it('totalReviews is a non-negative number', async () => {
      const stats = await getTrustStats()
      expect(stats.totalReviews).toBeGreaterThanOrEqual(0)
    })

    it('licensedGuides is a positive number', async () => {
      const stats = await getTrustStats()
      expect(stats.licensedGuides).toBeGreaterThan(0)
    })
  })
})

describe('formatTrustStats', () => {
  const mockStats: TrustStats = {
    happyTravelers: 5000,
    uniqueTours: 25,
    averageRating: 4.9,
    yearsExperience: 15,
    totalReviews: 735,
    licensedGuides: 8,
  }

  it('returns an array of formatted stats', () => {
    const formatted = formatTrustStats(mockStats)
    expect(Array.isArray(formatted)).toBe(true)
    expect(formatted.length).toBe(4)
  })

  it('each formatted stat has required properties', () => {
    const formatted = formatTrustStats(mockStats)
    formatted.forEach((stat) => {
      expect(stat).toHaveProperty('label')
      expect(stat).toHaveProperty('value')
      expect(stat).toHaveProperty('suffix')
      expect(stat).toHaveProperty('icon')
    })
  })

  it('includes happy travelers stat', () => {
    const formatted = formatTrustStats(mockStats)
    const happyTravelers = formatted.find((s) => s.label === 'Happy Travelers')
    expect(happyTravelers).toBeDefined()
    expect(happyTravelers?.value).toBe(5000)
    expect(happyTravelers?.suffix).toBe('+')
  })

  it('includes unique tours stat', () => {
    const formatted = formatTrustStats(mockStats)
    const uniqueTours = formatted.find((s) => s.label === 'Unique Tours')
    expect(uniqueTours).toBeDefined()
    expect(uniqueTours?.value).toBe(25)
    expect(uniqueTours?.suffix).toBe('+')
  })

  it('includes average rating stat', () => {
    const formatted = formatTrustStats(mockStats)
    const avgRating = formatted.find((s) => s.label === 'Average Rating')
    expect(avgRating).toBeDefined()
    expect(avgRating?.value).toBe(4.9)
    expect(avgRating?.suffix).toBe('')
  })

  it('includes years experience stat', () => {
    const formatted = formatTrustStats(mockStats)
    const yearsExp = formatted.find((s) => s.label === 'Years Experience')
    expect(yearsExp).toBeDefined()
    expect(yearsExp?.value).toBe(15)
    expect(yearsExp?.suffix).toBe('+')
  })

  it('all icons are valid strings', () => {
    const formatted = formatTrustStats(mockStats)
    formatted.forEach((stat) => {
      expect(typeof stat.icon).toBe('string')
      expect(stat.icon.length).toBeGreaterThan(0)
    })
  })
})
