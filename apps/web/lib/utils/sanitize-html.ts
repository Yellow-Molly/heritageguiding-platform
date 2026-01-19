/**
 * HTML sanitization utilities for safe rendering of user content.
 * Prevents XSS attacks by removing potentially dangerous HTML.
 */

/** Allowed HTML tags for rich text content */
const ALLOWED_TAGS = new Set([
  'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'a', 'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'span'
])

/** Allowed attributes per tag */
const ALLOWED_ATTRIBUTES: Record<string, Set<string>> = {
  a: new Set(['href', 'title', 'target', 'rel']),
  span: new Set(['class']),
}

/** Dangerous URL protocols */
const DANGEROUS_PROTOCOLS = ['javascript:', 'data:', 'vbscript:']

/**
 * Sanitize HTML string to prevent XSS attacks.
 * Allows only safe tags and attributes.
 * @param html - Raw HTML string
 * @returns Sanitized HTML string
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') return ''

  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

  // Remove style tags and their content
  sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')

  // Remove on* event handlers
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
  sanitized = sanitized.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '')

  // Process tags
  sanitized = sanitized.replace(/<\/?([a-z][a-z0-9]*)\b([^>]*)>/gi, (match, tag, attrs) => {
    const tagLower = tag.toLowerCase()

    // Remove disallowed tags entirely
    if (!ALLOWED_TAGS.has(tagLower)) {
      return ''
    }

    // Closing tag
    if (match.startsWith('</')) {
      return `</${tagLower}>`
    }

    // Process attributes for allowed tags
    const allowedAttrs = ALLOWED_ATTRIBUTES[tagLower]
    if (!allowedAttrs || !attrs.trim()) {
      return `<${tagLower}>`
    }

    // Parse and filter attributes
    const safeAttrs: string[] = []
    const attrRegex = /([a-z][a-z0-9-]*)\s*=\s*["']([^"']*)["']/gi
    let attrMatch

    while ((attrMatch = attrRegex.exec(attrs)) !== null) {
      const [, attrName, attrValue] = attrMatch
      const attrNameLower = attrName.toLowerCase()

      if (allowedAttrs.has(attrNameLower)) {
        // Check for dangerous URLs in href
        if (attrNameLower === 'href') {
          const valueLower = attrValue.toLowerCase().trim()
          if (DANGEROUS_PROTOCOLS.some((p) => valueLower.startsWith(p))) {
            continue
          }
        }

        // Add rel="noopener noreferrer" for external links
        if (attrNameLower === 'target' && attrValue === '_blank') {
          safeAttrs.push(`target="_blank"`)
          safeAttrs.push(`rel="noopener noreferrer"`)
          continue
        }

        safeAttrs.push(`${attrNameLower}="${escapeAttrValue(attrValue)}"`)
      }
    }

    return safeAttrs.length > 0 ? `<${tagLower} ${safeAttrs.join(' ')}>` : `<${tagLower}>`
  })

  return sanitized.trim()
}

/**
 * Escape HTML attribute value.
 */
function escapeAttrValue(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/**
 * Strip all HTML tags from a string.
 * @param html - HTML string
 * @returns Plain text
 */
export function stripHtml(html: string): string {
  if (!html || typeof html !== 'string') return ''
  return html.replace(/<[^>]*>/g, '').trim()
}
