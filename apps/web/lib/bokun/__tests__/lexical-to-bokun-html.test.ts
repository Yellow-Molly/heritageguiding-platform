/**
 * Tests for lexical-to-bokun-html — verifies user content is preserved through
 * the HTML escape pipeline (CRITICAL — prior implementation silently mangled text
 * containing "&", "<", ">").
 */
import { describe, it, expect } from 'vitest'
import { lexicalToBokunHtml } from '../lexical-to-bokun-html'

function paragraph(text: string) {
  return {
    root: {
      children: [
        { type: 'paragraph', children: [{ type: 'text', text }] },
      ],
    },
  }
}

describe('lexicalToBokunHtml', () => {
  it('wraps paragraph text in <p>', () => {
    expect(lexicalToBokunHtml(paragraph('Hello'))).toBe('<p>Hello</p>')
  })

  it('escapes ampersands in text nodes (preserves "AT&T")', () => {
    expect(lexicalToBokunHtml(paragraph('AT&T Tours'))).toBe('<p>AT&amp;T Tours</p>')
  })

  it('escapes angle brackets so user-typed "<Best>" is preserved as text', () => {
    expect(lexicalToBokunHtml(paragraph('Tours <Best> in Town'))).toBe(
      '<p>Tours &lt;Best&gt; in Town</p>'
    )
  })

  it('escapes adversarial </p><script> sequence so it cannot break out', () => {
    const out = lexicalToBokunHtml(paragraph('</p><script>alert(1)</script><p>'))
    expect(out).not.toContain('<script')
    expect(out).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
  })

  it('renders heading nodes with allowed h1-h6 tags', () => {
    const doc = {
      root: {
        children: [
          { type: 'heading', tag: 'h2', children: [{ type: 'text', text: 'Title' }] },
        ],
      },
    }
    expect(lexicalToBokunHtml(doc)).toBe('<h2>Title</h2>')
  })

  it('falls back to <p> for headings with disallowed tags', () => {
    const doc = {
      root: {
        children: [
          { type: 'heading', tag: 'h99', children: [{ type: 'text', text: 'Bad' }] },
        ],
      },
    }
    expect(lexicalToBokunHtml(doc)).toBe('<p>Bad</p>')
  })

  it('handles nested children recursively', () => {
    const doc = {
      root: {
        children: [
          {
            type: 'paragraph',
            children: [
              { type: 'text', text: 'Hello ' },
              {
                type: 'span',
                children: [{ type: 'text', text: 'world' }],
              },
            ],
          },
        ],
      },
    }
    expect(lexicalToBokunHtml(doc)).toBe('<p>Hello world</p>')
  })

  it('returns empty string for null/undefined/non-object input', () => {
    expect(lexicalToBokunHtml(null)).toBe('')
    expect(lexicalToBokunHtml(undefined)).toBe('')
    expect(lexicalToBokunHtml('string')).toBe('')
  })

  it('returns empty string for malformed root', () => {
    expect(lexicalToBokunHtml({})).toBe('')
    expect(lexicalToBokunHtml({ root: {} })).toBe('')
  })
})
