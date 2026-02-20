import { describe, it, expect, vi, afterEach } from 'vitest'
import { formatDate, formatShortDate, formatRelativeTime } from '../date-format'

// Fixed "now" for relative time tests
const FIXED_NOW = new Date('2025-06-15T12:00:00.000Z')

describe('formatDate', () => {
  it('formats date in English (en)', () => {
    const date = new Date('2025-03-01T00:00:00.000Z')
    const result = formatDate(date, 'en')
    // en-US long month format: "March 1, 2025"
    expect(result).toContain('2025')
    expect(result).toMatch(/March|Mar/)
  })

  it('formats date in Swedish (sv)', () => {
    const date = new Date('2025-03-01T00:00:00.000Z')
    const result = formatDate(date, 'sv')
    // sv-SE format includes year and day
    expect(result).toContain('2025')
  })

  it('formats date in German (de)', () => {
    const date = new Date('2025-03-01T00:00:00.000Z')
    const result = formatDate(date, 'de')
    // de-DE format includes year
    expect(result).toContain('2025')
  })

  it('falls back to raw locale when not in map (e.g. fr)', () => {
    const date = new Date('2025-03-01T00:00:00.000Z')
    // 'fr' maps to itself (fr), which is valid but not in the map
    const result = formatDate(date, 'fr')
    expect(result).toContain('2025')
  })

  it('handles catch branch - returns toLocaleDateString when Intl throws', () => {
    const date = new Date('2025-03-01T00:00:00.000Z')
    const OrigIntl = global.Intl
    // Pass an invalid locale string to force Intl to throw a RangeError
    const result = formatDate(date, '!!!invalid-locale!!!')
    // Should fall back to toLocaleDateString (no crash)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
    global.Intl = OrigIntl
  })
})

describe('formatShortDate', () => {
  it('formats short date in English', () => {
    const date = new Date('2025-06-15T00:00:00.000Z')
    const result = formatShortDate(date, 'en')
    // en-US short: "Jun 15, 2025"
    expect(result).toContain('2025')
    expect(result).toMatch(/Jun|June/)
  })

  it('formats short date in Swedish', () => {
    const date = new Date('2025-06-15T00:00:00.000Z')
    const result = formatShortDate(date, 'sv')
    expect(result).toContain('2025')
  })

  it('falls back for unknown locale', () => {
    const date = new Date('2025-06-15T00:00:00.000Z')
    // An invalid locale should trigger the catch and call toLocaleDateString
    const result = formatShortDate(date, '!!!bad!!!')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('formatRelativeTime', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "today" for same day', () => {
    vi.useFakeTimers()
    vi.setSystemTime(FIXED_NOW)

    // Pass the same date as "now"
    const result = formatRelativeTime(new Date('2025-06-15T12:00:00.000Z'), 'en')
    expect(result).toMatch(/today/i)
  })

  it('returns "X days ago" for <7 days', () => {
    vi.useFakeTimers()
    vi.setSystemTime(FIXED_NOW)

    // 3 days before fixed now
    const date = new Date('2025-06-12T12:00:00.000Z')
    const result = formatRelativeTime(date, 'en')
    expect(result).toMatch(/3 days? ago/i)
  })

  it('returns "X weeks ago" for 7-29 days', () => {
    vi.useFakeTimers()
    vi.setSystemTime(FIXED_NOW)

    // 14 days before fixed now = 2 weeks ago
    const date = new Date('2025-06-01T12:00:00.000Z')
    const result = formatRelativeTime(date, 'en')
    expect(result).toMatch(/2 weeks? ago/i)
  })

  it('returns "X months ago" for 30-364 days', () => {
    vi.useFakeTimers()
    vi.setSystemTime(FIXED_NOW)

    // 60 days before fixed now = 2 months ago
    const date = new Date('2025-04-16T12:00:00.000Z')
    const result = formatRelativeTime(date, 'en')
    expect(result).toMatch(/2 months? ago/i)
  })

  it('returns "X years ago" for 365+ days', () => {
    vi.useFakeTimers()
    vi.setSystemTime(FIXED_NOW)

    // 400 days before fixed now = 1 year ago
    // Intl.RelativeTimeFormat with numeric:'auto' returns "last year" for -1 year
    const msBack = 400 * 24 * 60 * 60 * 1000
    const date = new Date(FIXED_NOW.getTime() - msBack)
    const result = formatRelativeTime(date, 'en')
    // Match either "last year" (auto) or "1 year ago" (always) depending on runtime
    expect(result).toMatch(/last year|1 year.* ago/i)
  })

  it('works with Swedish locale (sv)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(FIXED_NOW)

    const date = new Date('2025-06-12T12:00:00.000Z')
    const result = formatRelativeTime(date, 'sv')
    // Swedish: "för 3 dagar sedan"
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('handles catch branch - falls back to formatDate', () => {
    vi.useFakeTimers()
    vi.setSystemTime(FIXED_NOW)

    // Pass invalid locale to trigger Intl.RelativeTimeFormat to throw
    const date = new Date('2025-06-12T12:00:00.000Z')
    // An invalid locale causes Intl.RelativeTimeFormat to throw RangeError
    // but formatDate fallback will also try the invalid locale and catch itself
    const result = formatRelativeTime(date, '!!!bad!!!')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })
})
