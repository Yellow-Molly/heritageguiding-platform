import { describe, it, expect } from 'vitest'
import {
  formatDate,
  formatDateTime,
  formatTime,
  formatCurrency,
  formatNumber,
  formatRelativeTime,
  formatDuration,
} from '../i18n-format'

// Use a fixed date for consistent testing
const testDate = new Date('2026-01-15T14:30:00')

describe('formatDate', () => {
  it('formats date in Swedish locale', () => {
    const result = formatDate(testDate, 'sv')
    expect(result).toMatch(/januari|jan/i)
    expect(result).toMatch(/2026/)
  })

  it('formats date in English locale', () => {
    const result = formatDate(testDate, 'en')
    expect(result).toMatch(/january|jan/i)
    expect(result).toMatch(/2026/)
  })

  it('formats date in German locale', () => {
    const result = formatDate(testDate, 'de')
    expect(result).toMatch(/januar|jan/i)
    expect(result).toMatch(/2026/)
  })

  it('accepts string date input', () => {
    const result = formatDate('2026-01-15', 'sv')
    expect(result).toMatch(/januari|jan/i)
  })

  it('accepts timestamp input', () => {
    const result = formatDate(testDate.getTime(), 'sv')
    expect(result).toMatch(/januari|jan/i)
  })

  it('accepts custom format string', () => {
    const result = formatDate(testDate, 'sv', 'yyyy-MM-dd')
    expect(result).toBe('2026-01-15')
  })
})

describe('formatDateTime', () => {
  it('formats date and time in Swedish locale', () => {
    const result = formatDateTime(testDate, 'sv')
    expect(result).toMatch(/januari|jan/i)
    expect(result).toMatch(/14:30|2:30/)
  })

  it('formats date and time in English locale', () => {
    const result = formatDateTime(testDate, 'en')
    expect(result).toMatch(/january|jan/i)
  })

  it('accepts string date input', () => {
    const result = formatDateTime('2026-01-15T14:30:00', 'sv')
    expect(result).toMatch(/januari|jan/i)
  })
})

describe('formatTime', () => {
  it('formats time in Swedish locale', () => {
    const result = formatTime(testDate, 'sv')
    expect(result).toMatch(/14:30|2:30/)
  })

  it('formats time in English locale', () => {
    const result = formatTime(testDate, 'en')
    expect(result).toMatch(/14:30|2:30|PM/)
  })

  it('accepts string date input', () => {
    const result = formatTime('2026-01-15T14:30:00', 'sv')
    expect(result).toMatch(/14:30|2:30/)
  })
})

describe('formatCurrency', () => {
  it('formats currency in Swedish locale (SEK)', () => {
    const result = formatCurrency(1500, 'sv')
    expect(result).toMatch(/1[\s\u00a0]?500/)
    expect(result).toMatch(/kr|SEK/)
  })

  it('formats currency in English locale (SEK)', () => {
    const result = formatCurrency(1500, 'en')
    expect(result).toMatch(/1,?500/)
    expect(result).toMatch(/kr|SEK/)
  })

  it('formats currency in German locale (SEK)', () => {
    const result = formatCurrency(1500, 'de')
    expect(result).toMatch(/1[\s\u00a0.]?500/)
  })

  it('formats with different currency (EUR)', () => {
    const result = formatCurrency(100, 'en', 'EUR')
    expect(result).toMatch(/€|EUR/)
  })

  it('formats zero amount', () => {
    const result = formatCurrency(0, 'sv')
    expect(result).toMatch(/0/)
  })

  it('formats decimal amounts', () => {
    const result = formatCurrency(99.99, 'sv')
    expect(result).toMatch(/99/)
  })
})

describe('formatNumber', () => {
  it('formats number in Swedish locale', () => {
    const result = formatNumber(1500.5, 'sv')
    expect(result).toMatch(/1[\s\u00a0]?500/)
  })

  it('formats number in English locale', () => {
    const result = formatNumber(1500.5, 'en')
    expect(result).toMatch(/1,?500/)
  })

  it('formats number in German locale', () => {
    const result = formatNumber(1500.5, 'de')
    expect(result).toMatch(/1[\s\u00a0.]?500/)
  })

  it('accepts Intl.NumberFormat options', () => {
    const result = formatNumber(0.75, 'en', { style: 'percent' })
    expect(result).toMatch(/75/)
    expect(result).toMatch(/%/)
  })
})

describe('formatRelativeTime', () => {
  const now = new Date('2026-01-15T14:30:00')

  it('formats past hours', () => {
    const pastDate = new Date('2026-01-15T12:30:00')
    const result = formatRelativeTime(pastDate, 'en', now)
    expect(result).toMatch(/2 hour|ago/)
  })

  it('formats past days', () => {
    const pastDate = new Date('2026-01-13T14:30:00')
    const result = formatRelativeTime(pastDate, 'en', now)
    expect(result).toMatch(/2 day|ago/)
  })

  it('formats in Swedish locale', () => {
    const pastDate = new Date('2026-01-14T14:30:00')
    const result = formatRelativeTime(pastDate, 'sv', now)
    expect(result).toMatch(/dag|i går|igår|sedan/)
  })

  it('formats in German locale', () => {
    const pastDate = new Date('2026-01-14T14:30:00')
    const result = formatRelativeTime(pastDate, 'de', now)
    expect(result).toMatch(/Tag|gestern|vor/)
  })

  it('handles string date input', () => {
    const result = formatRelativeTime('2026-01-14T14:30:00', 'en', now)
    expect(result).toMatch(/day|yesterday|ago/)
  })

  it('handles very recent time (seconds)', () => {
    const recentDate = new Date('2026-01-15T14:29:30')
    const result = formatRelativeTime(recentDate, 'en', now)
    expect(result).toMatch(/second|now/)
  })
})

describe('formatDuration', () => {
  it('formats hours and minutes in English', () => {
    expect(formatDuration(90, 'en')).toBe('1 hour 30 minutes')
  })

  it('formats single hour in English', () => {
    expect(formatDuration(60, 'en')).toBe('1 hour')
  })

  it('formats multiple hours in English', () => {
    expect(formatDuration(120, 'en')).toBe('2 hours')
  })

  it('formats single minute in English', () => {
    expect(formatDuration(1, 'en')).toBe('1 minute')
  })

  it('formats multiple minutes in English', () => {
    expect(formatDuration(30, 'en')).toBe('30 minutes')
  })

  it('formats in Swedish locale', () => {
    expect(formatDuration(90, 'sv')).toBe('1 timme 30 minuter')
  })

  it('formats single hour in Swedish', () => {
    expect(formatDuration(60, 'sv')).toBe('1 timme')
  })

  it('formats single minute in Swedish', () => {
    expect(formatDuration(1, 'sv')).toBe('1 minut')
  })

  it('formats in German locale', () => {
    expect(formatDuration(90, 'de')).toBe('1 Stunde 30 Minuten')
  })

  it('formats single hour in German', () => {
    expect(formatDuration(60, 'de')).toBe('1 Stunde')
  })

  it('formats single minute in German', () => {
    expect(formatDuration(1, 'de')).toBe('1 Minute')
  })

  it('handles zero duration', () => {
    expect(formatDuration(0, 'en')).toBe('')
  })
})
