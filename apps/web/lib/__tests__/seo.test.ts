import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  generateHreflangAlternates,
  generateOgLocaleAlternates,
  generateStructuredData,
  generateRobotsDirectives,
  generatePageMetadata,
} from '../seo'

describe('generateHreflangAlternates', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://example.com')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('generates canonical URL for current locale', () => {
    const result = generateHreflangAlternates('/tours', 'sv')
    expect(result?.canonical).toBe('https://example.com/sv/tours')
  })

  it('generates hreflang alternates for all locales', () => {
    const result = generateHreflangAlternates('/tours', 'sv')
    expect(result?.languages?.['sv-SE']).toBe('https://example.com/sv/tours')
    expect(result?.languages?.['en-US']).toBe('https://example.com/en/tours')
    expect(result?.languages?.['de-DE']).toBe('https://example.com/de/tours')
  })

  it('generates x-default pointing to Swedish', () => {
    const result = generateHreflangAlternates('/tours', 'en')
    expect(result?.languages?.['x-default']).toBe('https://example.com/sv/tours')
  })

  it('normalizes pathname without leading slash', () => {
    const result = generateHreflangAlternates('tours', 'sv')
    expect(result?.canonical).toBe('https://example.com/sv/tours')
  })

  it('handles root pathname', () => {
    const result = generateHreflangAlternates('/', 'sv')
    expect(result?.canonical).toBe('https://example.com/sv/')
  })

  it('uses default URL when env not set', () => {
    vi.unstubAllEnvs()
    const result = generateHreflangAlternates('/tours', 'sv')
    expect(result?.canonical).toBe('https://privatetours.se/sv/tours')
  })
})

describe('generateOgLocaleAlternates', () => {
  it('returns alternate locales for Swedish', () => {
    const result = generateOgLocaleAlternates('sv')
    expect(result).toContain('en_US')
    expect(result).toContain('de_DE')
    expect(result).not.toContain('sv_SE')
  })

  it('returns alternate locales for English', () => {
    const result = generateOgLocaleAlternates('en')
    expect(result).toContain('sv_SE')
    expect(result).toContain('de_DE')
    expect(result).not.toContain('en_US')
  })

  it('returns alternate locales for German', () => {
    const result = generateOgLocaleAlternates('de')
    expect(result).toContain('sv_SE')
    expect(result).toContain('en_US')
    expect(result).not.toContain('de_DE')
  })

  it('returns exactly 2 alternate locales', () => {
    const result = generateOgLocaleAlternates('sv')
    expect(result).toHaveLength(2)
  })
})

describe('generateStructuredData', () => {
  it('adds schema.org context', () => {
    const result = JSON.parse(generateStructuredData({ '@type': 'Tour' }, 'sv'))
    expect(result['@context']).toBe('https://schema.org')
  })

  it('adds inLanguage based on locale', () => {
    const result = JSON.parse(generateStructuredData({ '@type': 'Tour' }, 'sv'))
    expect(result.inLanguage).toBe('sv-SE')
  })

  it('preserves existing data', () => {
    const data = { '@type': 'Tour', name: 'Stockholm Walking Tour' }
    const result = JSON.parse(generateStructuredData(data, 'en'))
    expect(result['@type']).toBe('Tour')
    expect(result.name).toBe('Stockholm Walking Tour')
  })

  it('handles English locale', () => {
    const result = JSON.parse(generateStructuredData({ '@type': 'Tour' }, 'en'))
    expect(result.inLanguage).toBe('en-US')
  })

  it('handles German locale', () => {
    const result = JSON.parse(generateStructuredData({ '@type': 'Tour' }, 'de'))
    expect(result.inLanguage).toBe('de-DE')
  })

  it('returns valid JSON string', () => {
    const result = generateStructuredData({ '@type': 'Tour' }, 'sv')
    expect(() => JSON.parse(result)).not.toThrow()
  })
})

describe('generateRobotsDirectives', () => {
  it('returns default values when no options', () => {
    const result = generateRobotsDirectives('sv')
    expect(result).toEqual({
      index: true,
      follow: true,
      noarchive: false,
      nositelinkssearchbox: false,
      notranslate: false,
    })
  })

  it('respects index option', () => {
    const result = generateRobotsDirectives('sv', { index: false }) as Record<string, unknown>
    expect(result?.index).toBe(false)
  })

  it('respects follow option', () => {
    const result = generateRobotsDirectives('sv', { follow: false }) as Record<string, unknown>
    expect(result?.follow).toBe(false)
  })

  it('respects noarchive option', () => {
    const result = generateRobotsDirectives('sv', { noarchive: true }) as Record<string, unknown>
    expect(result?.noarchive).toBe(true)
  })

  it('respects nositelinkssearchbox option', () => {
    const result = generateRobotsDirectives('sv', { nositelinkssearchbox: true }) as Record<string, unknown>
    expect(result?.nositelinkssearchbox).toBe(true)
  })

  it('respects notranslate option', () => {
    const result = generateRobotsDirectives('sv', { notranslate: true }) as Record<string, unknown>
    expect(result?.notranslate).toBe(true)
  })

  it('handles multiple options', () => {
    const result = generateRobotsDirectives('sv', { index: false, follow: false }) as Record<string, unknown>
    expect(result?.index).toBe(false)
    expect(result?.follow).toBe(false)
  })
})

describe('generatePageMetadata', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://example.com')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('generates basic metadata', () => {
    const result = generatePageMetadata({
      title: 'Test Page',
      description: 'Test description',
      locale: 'sv',
      pathname: '/test',
    })
    expect(result.title).toBe('Test Page')
    expect(result.description).toBe('Test description')
  })

  it('generates alternates', () => {
    const result = generatePageMetadata({
      title: 'Test',
      description: 'Test',
      locale: 'sv',
      pathname: '/test',
    })
    expect(result.alternates?.canonical).toBe('https://example.com/sv/test')
  })

  it('generates OpenGraph metadata', () => {
    const result = generatePageMetadata({
      title: 'Test',
      description: 'Test description',
      locale: 'sv',
      pathname: '/test',
    })
    expect(result.openGraph?.title).toBe('Test')
    expect(result.openGraph?.description).toBe('Test description')
    expect(result.openGraph?.url).toBe('https://example.com/sv/test')
    expect(result.openGraph?.siteName).toBe('Private Tours')
    expect(result.openGraph?.locale).toBe('sv_SE')
    expect((result.openGraph as Record<string, unknown>)?.type).toBe('website')
  })

  it('generates Twitter metadata', () => {
    const result = generatePageMetadata({
      title: 'Test',
      description: 'Test description',
      locale: 'sv',
      pathname: '/test',
    })
    expect((result.twitter as Record<string, unknown>)?.card).toBe('summary_large_image')
    expect(result.twitter?.title).toBe('Test')
    expect(result.twitter?.description).toBe('Test description')
  })

  it('includes keywords when provided', () => {
    const result = generatePageMetadata({
      title: 'Test',
      description: 'Test',
      locale: 'sv',
      pathname: '/test',
      keywords: ['tour', 'stockholm'],
    })
    expect(result.keywords).toBe('tour, stockholm')
  })

  it('includes OG image when provided', () => {
    const result = generatePageMetadata({
      title: 'Test',
      description: 'Test',
      locale: 'sv',
      pathname: '/test',
      ogImage: 'https://example.com/image.jpg',
    })
    expect(result.openGraph?.images).toBeDefined()
    expect(result.twitter?.images).toBeDefined()
  })

  it('sets noIndex when requested', () => {
    const result = generatePageMetadata({
      title: 'Test',
      description: 'Test',
      locale: 'sv',
      pathname: '/test',
      noIndex: true,
    })
    expect((result.robots as Record<string, unknown>)?.index).toBe(false)
  })

  it('handles English locale', () => {
    const result = generatePageMetadata({
      title: 'Test',
      description: 'Test',
      locale: 'en',
      pathname: '/test',
    })
    expect(result.openGraph?.locale).toBe('en_US')
  })

  it('handles German locale', () => {
    const result = generatePageMetadata({
      title: 'Test',
      description: 'Test',
      locale: 'de',
      pathname: '/test',
    })
    expect(result.openGraph?.locale).toBe('de_DE')
  })
})
