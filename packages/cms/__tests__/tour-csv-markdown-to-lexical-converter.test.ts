import { describe, it, expect } from 'vitest'
import { markdownToLexical } from '../lib/csv/tour-csv-markdown-to-lexical-converter'

describe('markdownToLexical', () => {
  describe('empty input handling', () => {
    it('returns empty lexical for null input', () => {
      const result = markdownToLexical(null)
      expect(result.root.type).toBe('root')
      expect(result.root.children).toEqual([])
    })

    it('returns empty lexical for undefined input', () => {
      const result = markdownToLexical(undefined)
      expect(result.root.type).toBe('root')
      expect(result.root.children).toEqual([])
    })

    it('returns empty lexical for empty string', () => {
      const result = markdownToLexical('')
      expect(result.root.type).toBe('root')
      expect(result.root.children).toEqual([])
    })

    it('returns empty lexical for whitespace-only string', () => {
      const result = markdownToLexical('   \n\n   ')
      expect(result.root.type).toBe('root')
      expect(result.root.children).toEqual([])
    })
  })

  describe('root structure', () => {
    it('returns proper root structure', () => {
      const result = markdownToLexical('Hello')
      expect(result.root.type).toBe('root')
      expect(result.root.format).toBe('')
      expect(result.root.indent).toBe(0)
      expect(result.root.version).toBe(1)
      expect(result.root.direction).toBe('ltr')
    })
  })

  describe('paragraph conversion', () => {
    it('converts simple text to paragraph', () => {
      const result = markdownToLexical('Hello world')
      expect(result.root.children.length).toBe(1)
      expect(result.root.children[0].type).toBe('paragraph')
    })

    it('paragraph has correct structure', () => {
      const result = markdownToLexical('Hello world')
      const paragraph = result.root.children[0]
      expect(paragraph.format).toBe('')
      expect(paragraph.indent).toBe(0)
      expect(paragraph.version).toBe(1)
      expect(paragraph.direction).toBe('ltr')
    })

    it('paragraph contains text node with content', () => {
      const result = markdownToLexical('Hello world')
      const paragraph = result.root.children[0]
      expect(paragraph.children.length).toBe(1)
      expect(paragraph.children[0].type).toBe('text')
      expect(paragraph.children[0].text).toBe('Hello world')
    })

    it('text node has correct structure', () => {
      const result = markdownToLexical('Hello')
      const textNode = result.root.children[0].children[0]
      expect(textNode.format).toBe(0)
      expect(textNode.version).toBe(1)
    })
  })

  describe('multiple paragraphs', () => {
    it('splits on double newlines', () => {
      const result = markdownToLexical('First paragraph\n\nSecond paragraph')
      expect(result.root.children.length).toBe(2)
      expect(result.root.children[0].children[0].text).toBe('First paragraph')
      expect(result.root.children[1].children[0].text).toBe('Second paragraph')
    })

    it('handles multiple double newlines', () => {
      const result = markdownToLexical('One\n\nTwo\n\nThree')
      expect(result.root.children.length).toBe(3)
    })

    it('handles triple+ newlines as paragraph separator', () => {
      const result = markdownToLexical('First\n\n\n\nSecond')
      expect(result.root.children.length).toBe(2)
    })

    it('replaces single newlines with spaces within paragraph', () => {
      const result = markdownToLexical('Line one\nLine two')
      expect(result.root.children.length).toBe(1)
      expect(result.root.children[0].children[0].text).toBe('Line one Line two')
    })
  })

  describe('heading conversion', () => {
    it('converts # to h1', () => {
      const result = markdownToLexical('# Heading One')
      expect(result.root.children.length).toBe(1)
      expect(result.root.children[0].type).toBe('heading')
      expect(result.root.children[0].tag).toBe('h1')
      expect(result.root.children[0].children[0].text).toBe('Heading One')
    })

    it('converts ## to h2', () => {
      const result = markdownToLexical('## Heading Two')
      expect(result.root.children[0].type).toBe('heading')
      expect(result.root.children[0].tag).toBe('h2')
      expect(result.root.children[0].children[0].text).toBe('Heading Two')
    })

    it('converts ### to h3', () => {
      const result = markdownToLexical('### Heading Three')
      expect(result.root.children[0].type).toBe('heading')
      expect(result.root.children[0].tag).toBe('h3')
      expect(result.root.children[0].children[0].text).toBe('Heading Three')
    })

    it('heading has correct structure', () => {
      const result = markdownToLexical('# Test')
      const heading = result.root.children[0]
      expect(heading.format).toBe('')
      expect(heading.indent).toBe(0)
      expect(heading.version).toBe(1)
      expect(heading.direction).toBe('ltr')
    })

    it('does not convert #### as heading (paragraph instead)', () => {
      const result = markdownToLexical('#### Not a heading')
      expect(result.root.children[0].type).toBe('paragraph')
    })

    it('requires space after #', () => {
      const result = markdownToLexical('#NoSpace')
      expect(result.root.children[0].type).toBe('paragraph')
    })
  })

  describe('mixed content', () => {
    it('handles heading followed by paragraph', () => {
      const result = markdownToLexical('# Title\n\nSome content here.')
      expect(result.root.children.length).toBe(2)
      expect(result.root.children[0].type).toBe('heading')
      expect(result.root.children[1].type).toBe('paragraph')
    })

    it('handles multiple headings and paragraphs', () => {
      const markdown = `# Main Title

Introduction paragraph.

## Section One

Content for section one.

## Section Two

Content for section two.`

      const result = markdownToLexical(markdown)
      expect(result.root.children.length).toBe(6)
      expect(result.root.children[0].type).toBe('heading')
      expect(result.root.children[0].tag).toBe('h1')
      expect(result.root.children[1].type).toBe('paragraph')
      expect(result.root.children[2].type).toBe('heading')
      expect(result.root.children[2].tag).toBe('h2')
      expect(result.root.children[3].type).toBe('paragraph')
      expect(result.root.children[4].type).toBe('heading')
      expect(result.root.children[4].tag).toBe('h2')
      expect(result.root.children[5].type).toBe('paragraph')
    })
  })

  describe('Swedish/German character handling', () => {
    it('preserves Swedish characters', () => {
      const result = markdownToLexical('Välkommen till Stockholm')
      expect(result.root.children[0].children[0].text).toBe('Välkommen till Stockholm')
    })

    it('preserves German characters', () => {
      const result = markdownToLexical('Willkommen in München')
      expect(result.root.children[0].children[0].text).toBe('Willkommen in München')
    })

    it('preserves special characters in headings', () => {
      const result = markdownToLexical('# Über uns')
      expect(result.root.children[0].children[0].text).toBe('Über uns')
    })
  })

  describe('whitespace trimming', () => {
    it('trims leading whitespace', () => {
      const result = markdownToLexical('   Hello')
      expect(result.root.children[0].children[0].text).toBe('Hello')
    })

    it('trims trailing whitespace', () => {
      const result = markdownToLexical('Hello   ')
      expect(result.root.children[0].children[0].text).toBe('Hello')
    })

    it('trims whitespace from each block', () => {
      const result = markdownToLexical('  First  \n\n  Second  ')
      expect(result.root.children[0].children[0].text).toBe('First')
      expect(result.root.children[1].children[0].text).toBe('Second')
    })
  })
})
