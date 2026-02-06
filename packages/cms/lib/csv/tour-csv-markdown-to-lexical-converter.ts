/**
 * Markdown to Lexical JSON Converter
 * Converts plain text/markdown from CSV import to Payload CMS Lexical rich text format
 * Handles: paragraphs, headings (h1-h3), basic text
 */

export interface LexicalTextNode {
  type: 'text'
  text: string
  format: number
  version: number
}

export interface LexicalParagraphNode {
  type: 'paragraph'
  format: string
  indent: number
  version: number
  children: LexicalTextNode[]
  direction: 'ltr' | 'rtl'
}

export interface LexicalHeadingNode {
  type: 'heading'
  tag: 'h1' | 'h2' | 'h3'
  format: string
  indent: number
  version: number
  children: LexicalTextNode[]
  direction: 'ltr' | 'rtl'
}

export interface LexicalRootNode {
  type: 'root'
  format: string
  indent: number
  version: number
  children: (LexicalParagraphNode | LexicalHeadingNode)[]
  direction: 'ltr' | 'rtl'
}

export interface LexicalDocument {
  root: LexicalRootNode
}

/**
 * Create an empty Lexical document structure
 */
function createEmptyLexical(): LexicalDocument {
  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children: [],
      direction: 'ltr',
    },
  }
}

/**
 * Create a text node
 */
function createTextNode(text: string): LexicalTextNode {
  return {
    type: 'text',
    text,
    format: 0,
    version: 1,
  }
}

/**
 * Create a paragraph node with text content
 */
function createParagraph(text: string): LexicalParagraphNode {
  return {
    type: 'paragraph',
    format: '',
    indent: 0,
    version: 1,
    children: text ? [createTextNode(text)] : [],
    direction: 'ltr',
  }
}

/**
 * Create a heading node
 */
function createHeading(text: string, level: 1 | 2 | 3): LexicalHeadingNode {
  return {
    type: 'heading',
    tag: `h${level}`,
    format: '',
    indent: 0,
    version: 1,
    children: text ? [createTextNode(text)] : [],
    direction: 'ltr',
  }
}

/**
 * Convert markdown/plain text to Lexical JSON document
 * Supports:
 * - Paragraphs (double newline separated)
 * - Headings: # h1, ## h2, ### h3
 *
 * @param markdown Plain text or simple markdown string
 * @returns Lexical JSON document structure
 */
export function markdownToLexical(markdown: string | undefined | null): LexicalDocument {
  if (!markdown || typeof markdown !== 'string') {
    return createEmptyLexical()
  }

  const trimmed = markdown.trim()
  if (!trimmed) {
    return createEmptyLexical()
  }

  // Split by double newlines to get paragraphs/blocks
  const blocks = trimmed.split(/\n\n+/).filter(Boolean)

  const children: (LexicalParagraphNode | LexicalHeadingNode)[] = blocks.map((block) => {
    const trimmedBlock = block.trim()

    // Check for headings
    if (trimmedBlock.startsWith('### ')) {
      return createHeading(trimmedBlock.slice(4).trim(), 3)
    }
    if (trimmedBlock.startsWith('## ')) {
      return createHeading(trimmedBlock.slice(3).trim(), 2)
    }
    if (trimmedBlock.startsWith('# ')) {
      return createHeading(trimmedBlock.slice(2).trim(), 1)
    }

    // Default to paragraph - replace single newlines with spaces for flow
    const text = trimmedBlock.replace(/\n/g, ' ')
    return createParagraph(text)
  })

  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children,
      direction: 'ltr',
    },
  }
}
