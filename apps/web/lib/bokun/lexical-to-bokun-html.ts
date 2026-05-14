/**
 * Bokun-specific Lexical → HTML converter.
 *
 * Why a Bokun-specific helper? The existing `lexicalToHtml` in tour-payload-mapper.ts
 * interpolates raw text into HTML tags and relies on downstream sanitization to remove
 * unknown markup. That works for in-app rendering (the sanitizer's allowlist matches
 * the project's design tokens), but it CORRUPTS user content when the text itself
 * contains `<`, `>`, `&` — the sanitizer drops `<Best>` as an unknown tag, leaving
 * "AT&T Tours <Best> in Town" → "AT&T Tours  in Town" before Bokun ever sees it.
 *
 * This helper escapes text nodes BEFORE serialization, preserving every character
 * the editor typed and producing safe HTML for the Bokun extranet display.
 *
 * @see plans/260514-1437-bokun-integration/phase-03-tour-to-experience-mapper.md
 */

interface LexicalTextNode {
  type: 'text'
  text?: string
  format?: number
}
interface LexicalBlock {
  type: string
  tag?: string
  children?: Array<LexicalTextNode | LexicalBlock>
}
interface LexicalRoot {
  root?: { children?: LexicalBlock[] }
}

const ALLOWED_HEADING_TAGS = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'])

/** Escape the four HTML-significant characters in text nodes. */
function escapeHtmlText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Recursively serialize a Lexical block/text node to escaped HTML. */
function renderInline(node: LexicalTextNode | LexicalBlock): string {
  if ('text' in node && typeof node.text === 'string') {
    return escapeHtmlText(node.text)
  }
  if ('children' in node && Array.isArray(node.children)) {
    return node.children.map(renderInline).join('')
  }
  return ''
}

/**
 * Convert Lexical JSON to safe HTML for Bokun.
 * Returns '' on any malformed input — never throws.
 */
export function lexicalToBokunHtml(lexical: unknown): string {
  if (!lexical || typeof lexical !== 'object') return ''
  try {
    const root = (lexical as LexicalRoot).root
    if (!root?.children) return ''

    const parts: string[] = []
    for (const block of root.children) {
      const inner = renderInline(block)
      if (!inner) continue

      if (block.type === 'heading' && block.tag && ALLOWED_HEADING_TAGS.has(block.tag)) {
        parts.push(`<${block.tag}>${inner}</${block.tag}>`)
      } else {
        parts.push(`<p>${inner}</p>`)
      }
    }
    return parts.join('\n')
  } catch {
    return ''
  }
}
