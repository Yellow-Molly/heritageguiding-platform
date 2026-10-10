import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('robots.ts', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('production', () => {
    beforeEach(() => {
      // Indexability is gated on COMING_SOON + IS_STAGING, NOT on VERCEL_ENV
      // (which is not 'production' during the Vercel build). Without the
      // explicit COMING_SOON='false' these cases silently took the dark branch
      // and asserted nothing about live behaviour.
      process.env.VERCEL_ENV = 'production'
      process.env.COMING_SOON = 'false'
      delete process.env.IS_STAGING
      process.env.NEXT_PUBLIC_SITE_URL = 'https://www.privatetours.se'
    })

    it('allows crawling on /', async () => {
      const { default: robots } = await import('../robots')
      const result = robots()
      const rules = result.rules as { userAgent: string; allow: string }
      expect(rules.userAgent).toBe('*')
      expect(rules.allow).toBe('/')
    })

    it('disallows /admin/ and /api/', async () => {
      const { default: robots } = await import('../robots')
      const result = robots()
      const rules = result.rules as { disallow: string[] }
      expect(rules.disallow).toContain('/admin/')
      expect(rules.disallow).toContain('/api/')
    })

    it('includes sitemap URL', async () => {
      const { default: robots } = await import('../robots')
      const result = robots()
      expect(result.sitemap).toBe('https://www.privatetours.se/sitemap.xml')
    })
  })

  describe('non-production (staging/preview)', () => {
    beforeEach(() => {
      process.env.VERCEL_ENV = 'preview'
    })

    it('disallows all crawling', async () => {
      const { default: robots } = await import('../robots')
      const result = robots()
      const rules = result.rules as { userAgent: string; disallow: string }
      expect(rules.userAgent).toBe('*')
      expect(rules.disallow).toBe('/')
    })

    it('does not include sitemap', async () => {
      const { default: robots } = await import('../robots')
      const result = robots()
      expect(result.sitemap).toBeUndefined()
    })

    it('does not include allow directive', async () => {
      const { default: robots } = await import('../robots')
      const result = robots()
      const rules = result.rules as { allow?: string }
      expect(rules.allow).toBeUndefined()
    })
  })

  describe('staging (gate open but IS_STAGING=true)', () => {
    beforeEach(() => {
      // COMING_SOON='false' so this proves IS_STAGING alone blocks indexing,
      // rather than passing because the holding gate happened to be closed.
      process.env.VERCEL_ENV = 'production'
      process.env.COMING_SOON = 'false'
      process.env.IS_STAGING = 'true'
    })

    it('disallows all crawling', async () => {
      const { default: robots } = await import('../robots')
      const result = robots()
      const rules = result.rules as { disallow: string }
      expect(rules.disallow).toBe('/')
    })

    it('does not include sitemap', async () => {
      const { default: robots } = await import('../robots')
      const result = robots()
      expect(result.sitemap).toBeUndefined()
    })
  })

  describe('local development (no VERCEL_ENV)', () => {
    beforeEach(() => {
      delete process.env.VERCEL_ENV
    })

    it('disallows all crawling', async () => {
      const { default: robots } = await import('../robots')
      const result = robots()
      const rules = result.rules as { disallow: string }
      expect(rules.disallow).toBe('/')
    })
  })
})
