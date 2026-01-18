import { describe, it, expect } from 'vitest'
import { cn, formatPrice, formatDuration, truncateText, generateId } from '../utils'

describe('cn (class name utility)', () => {
  it('merges simple classes', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('handles conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
  })

  it('merges conflicting Tailwind classes', () => {
    expect(cn('p-4', 'p-2')).toBe('p-2')
  })

  it('handles arrays of classes', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar')
  })

  it('handles empty inputs', () => {
    expect(cn()).toBe('')
  })

  it('handles null and undefined', () => {
    expect(cn('foo', null, undefined, 'bar')).toBe('foo bar')
  })
})

describe('formatPrice', () => {
  it('formats price in SEK by default', () => {
    const result = formatPrice(1500)
    expect(result).toMatch(/1[\s\u00a0]?500/)
    expect(result).toMatch(/kr|SEK/)
  })

  it('formats price with specified currency', () => {
    const result = formatPrice(100, 'EUR')
    expect(result).toMatch(/100/)
    expect(result).toMatch(/€|EUR/)
  })

  it('formats zero price', () => {
    const result = formatPrice(0)
    expect(result).toMatch(/0/)
  })

  it('formats large prices', () => {
    const result = formatPrice(10000)
    expect(result).toMatch(/10[\s\u00a0]?000/)
  })
})

describe('formatDuration', () => {
  it('formats minutes under 60', () => {
    expect(formatDuration(30)).toBe('30 min')
  })

  it('formats exactly one hour', () => {
    expect(formatDuration(60)).toBe('1h')
  })

  it('formats hours with remaining minutes', () => {
    expect(formatDuration(90)).toBe('1h 30min')
  })

  it('formats multiple hours', () => {
    expect(formatDuration(180)).toBe('3h')
  })

  it('formats multiple hours with minutes', () => {
    expect(formatDuration(150)).toBe('2h 30min')
  })

  it('formats 1 minute', () => {
    expect(formatDuration(1)).toBe('1 min')
  })
})

describe('truncateText', () => {
  it('returns original text if shorter than max length', () => {
    expect(truncateText('Hello', 10)).toBe('Hello')
  })

  it('truncates text with ellipsis', () => {
    expect(truncateText('Hello World', 5)).toBe('Hello...')
  })

  it('handles exact max length', () => {
    expect(truncateText('Hello', 5)).toBe('Hello')
  })

  it('trims whitespace before ellipsis', () => {
    expect(truncateText('Hello World', 6)).toBe('Hello...')
  })

  it('handles empty string', () => {
    expect(truncateText('', 10)).toBe('')
  })
})

describe('generateId', () => {
  it('generates ID with default prefix', () => {
    const id = generateId()
    expect(id).toMatch(/^id-[a-z0-9]+$/)
  })

  it('generates ID with custom prefix', () => {
    const id = generateId('test')
    expect(id).toMatch(/^test-[a-z0-9]+$/)
  })

  it('generates unique IDs', () => {
    const id1 = generateId()
    const id2 = generateId()
    expect(id1).not.toBe(id2)
  })

  it('generates IDs with expected length', () => {
    const id = generateId('x')
    // prefix + dash + 7 random chars = 9 total
    expect(id.length).toBeGreaterThanOrEqual(9)
  })
})
