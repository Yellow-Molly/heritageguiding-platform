/**
 * Extract plain text from Payload CMS richText (Lexical) content.
 * Used by llms-full.txt routes to render guide bios as plain text.
 */
export function extractPlainText(richText: unknown, maxLength = 500): string | undefined {
  if (!richText || typeof richText !== 'object') return undefined
  try {
    const root = richText as { root?: { children?: Array<{ children?: Array<{ text?: string }> }> } }
    const texts: string[] = []
    for (const block of root.root?.children ?? []) {
      for (const child of block.children ?? []) {
        if (child.text) texts.push(child.text)
      }
    }
    const full = texts.join(' ').trim()
    if (!full) return undefined
    return full.length > maxLength ? `${full.substring(0, maxLength)}…` : full
  } catch {
    return undefined
  }
}
