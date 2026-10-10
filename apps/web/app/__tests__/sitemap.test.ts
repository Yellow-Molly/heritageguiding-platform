import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// The sitemap boots Payload to list tours and guides. Reject that here so the
// static-route path is exercised without a database — sitemap.ts catches the
// failure and returns static routes only, which is exactly what we assert on.
vi.mock('payload', () => ({
  getPayload: vi.fn(async () => {
    throw new Error('no database in unit tests')
  }),
}))
vi.mock('@payload-config', () => ({ default: {} }))

const LOCALES = ['sv', 'en', 'de'] as const

/**
 * Every public static route that must appear in the sitemap.
 *
 * `/contact` and `/cancellation` were live but absent from the sitemap for
 * months — nothing failed when a route was added to the app and not here, so
 * the omission was invisible. Add a route to the app, add it to this list.
 * Deliberately excluded: `/coming-soon` (the holding page).
 */
const EXPECTED_STATIC_PATHS = [
  '',
  '/about-us',
  '/faq',
  '/find-tour',
  '/guides',
  '/tours',
  '/group-booking',
  '/contact',
  '/privacy',
  '/terms',
  '/imprint',
  '/cancellation',
]

describe('sitemap.ts', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
    // Indexability is gated on COMING_SOON + IS_STAGING, not VERCEL_ENV.
    process.env.COMING_SOON = 'false'
    delete process.env.IS_STAGING
    process.env.NEXT_PUBLIC_SITE_URL = 'https://www.privatetours.se'
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  describe('when publicly indexable', () => {
    it('includes every public static route', async () => {
      const { default: sitemap } = await import('../sitemap')
      const urls = (await sitemap()).map((entry) => entry.url)

      for (const path of EXPECTED_STATIC_PATHS) {
        expect(urls).toContain(`https://www.privatetours.se/sv${path}`)
      }
    })

    it('excludes the coming-soon holding page', async () => {
      const { default: sitemap } = await import('../sitemap')
      const urls = (await sitemap()).map((entry) => entry.url)
      expect(urls.some((url) => url.includes('/coming-soon'))).toBe(false)
    })

    it('emits hreflang alternates for all locales plus x-default', async () => {
      const { default: sitemap } = await import('../sitemap')
      const entries = await sitemap()
      const contact = entries.find(
        (entry) => entry.url === 'https://www.privatetours.se/sv/contact'
      )

      expect(contact).toBeDefined()
      const languages = contact?.alternates?.languages as Record<string, string>
      for (const locale of LOCALES) {
        expect(languages[locale]).toBe(`https://www.privatetours.se/${locale}/contact`)
      }
      expect(languages['x-default']).toBe('https://www.privatetours.se/sv/contact')
    })

    it('uses the www serving host for every URL it emits', async () => {
      const { default: sitemap } = await import('../sitemap')
      const entries = await sitemap()

      expect(entries.length).toBeGreaterThan(0)
      for (const entry of entries) {
        expect(entry.url.startsWith('https://www.privatetours.se/')).toBe(true)
      }
    })
  })

  describe('when not publicly indexable', () => {
    it('emits nothing while the holding gate is closed', async () => {
      process.env.COMING_SOON = ''
      const { default: sitemap } = await import('../sitemap')
      expect(await sitemap()).toEqual([])
    })

    it('emits nothing on staging', async () => {
      process.env.IS_STAGING = 'true'
      const { default: sitemap } = await import('../sitemap')
      expect(await sitemap()).toEqual([])
    })
  })
})
