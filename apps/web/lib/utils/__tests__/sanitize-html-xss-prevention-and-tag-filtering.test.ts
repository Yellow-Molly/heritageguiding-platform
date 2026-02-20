import { describe, it, expect } from 'vitest'
import { sanitizeHtml, stripHtml } from '../sanitize-html'

describe('sanitizeHtml', () => {
  it('returns empty string for null/undefined/empty input', () => {
    expect(sanitizeHtml('')).toBe('')
    expect(sanitizeHtml(null as unknown as string)).toBe('')
    expect(sanitizeHtml(undefined as unknown as string)).toBe('')
  })

  it('removes script tags and their content', () => {
    const input = '<p>Safe</p><script>alert("xss")</script>'
    const result = sanitizeHtml(input)
    expect(result).not.toContain('<script')
    expect(result).not.toContain('alert')
    expect(result).toContain('<p>Safe</p>')
  })

  it('removes style tags and their content', () => {
    const input = '<p>Text</p><style>body { display: none; }</style>'
    const result = sanitizeHtml(input)
    expect(result).not.toContain('<style')
    expect(result).not.toContain('display: none')
    expect(result).toContain('<p>Text</p>')
  })

  it('removes on* event handlers from tags', () => {
    const input = '<p onclick="evil()">Click me</p>'
    const result = sanitizeHtml(input)
    expect(result).not.toContain('onclick')
    expect(result).not.toContain('evil()')
    expect(result).toContain('<p>')
    expect(result).toContain('Click me')
  })

  it('removes onerror event handler from tags', () => {
    const input = '<img src="x" onerror="alert(1)">'
    const result = sanitizeHtml(input)
    expect(result).not.toContain('onerror')
    expect(result).not.toContain('alert(1)')
    // img is not in ALLOWED_TAGS so the tag itself is stripped too
    expect(result).not.toContain('<img')
  })

  it('allows safe tags: p, b, i, a, ul, ol, li, h1, span, blockquote', () => {
    const input = '<p><b>Bold</b> and <i>italic</i></p><ul><li>item</li></ul><h1>Title</h1><blockquote>Quote</blockquote><span>text</span>'
    const result = sanitizeHtml(input)
    expect(result).toContain('<p>')
    expect(result).toContain('<b>')
    expect(result).toContain('<i>')
    expect(result).toContain('<ul>')
    expect(result).toContain('<li>')
    expect(result).toContain('<h1>')
    expect(result).toContain('<blockquote>')
    expect(result).toContain('<span>')
  })

  it('removes disallowed tags: div, img, iframe, form', () => {
    const input = '<div>wrapper</div><img src="photo.jpg"><iframe src="evil.com"></iframe><form action="/post"></form>'
    const result = sanitizeHtml(input)
    expect(result).not.toContain('<div')
    expect(result).not.toContain('<img')
    expect(result).not.toContain('<iframe')
    expect(result).not.toContain('<form')
    // Text content inside div should remain
    expect(result).toContain('wrapper')
  })

  it('preserves href attribute on anchor tags', () => {
    const input = '<a href="https://example.com">Link</a>'
    const result = sanitizeHtml(input)
    expect(result).toContain('href="https://example.com"')
    expect(result).toContain('Link')
  })

  it('blocks javascript: protocol in href', () => {
    const input = '<a href="javascript:alert(1)">Click</a>'
    const result = sanitizeHtml(input)
    expect(result).not.toContain('javascript:')
    // Tag itself renders but without the dangerous href
    expect(result).toContain('<a>')
  })

  it('blocks data: protocol in href', () => {
    const input = '<a href="data:text/html,<script>alert(1)</script>">Click</a>'
    const result = sanitizeHtml(input)
    expect(result).not.toContain('data:text/html')
    expect(result).toContain('<a>')
  })

  it('adds rel="noopener noreferrer" when target="_blank" is present', () => {
    const input = '<a href="https://example.com" target="_blank">External</a>'
    const result = sanitizeHtml(input)
    expect(result).toContain('target="_blank"')
    expect(result).toContain('rel="noopener noreferrer"')
  })

  it('preserves class attribute on span tags', () => {
    const input = '<span class="highlight">Text</span>'
    const result = sanitizeHtml(input)
    expect(result).toContain('class="highlight"')
  })
})

describe('stripHtml', () => {
  it('returns empty string for null/undefined/empty input', () => {
    expect(stripHtml('')).toBe('')
    expect(stripHtml(null as unknown as string)).toBe('')
    expect(stripHtml(undefined as unknown as string)).toBe('')
  })

  it('strips all HTML tags leaving only text', () => {
    const input = '<p>Hello <b>world</b></p>'
    expect(stripHtml(input)).toBe('Hello world')
  })

  it('handles nested tags and preserves text content', () => {
    const input = '<div><ul><li>First</li><li>Second</li></ul></div>'
    expect(stripHtml(input)).toBe('FirstSecond')
  })
})
