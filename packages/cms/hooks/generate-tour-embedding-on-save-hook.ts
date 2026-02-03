/**
 * Payload CMS Hook: Generate Tour Embedding on Save
 * Automatically generates OpenAI embeddings when a tour is created or updated
 * Embeddings are stored in tour_embeddings table for semantic search
 */

import type { CollectionAfterChangeHook } from 'payload'
import { sql } from 'drizzle-orm'

const LOCALES = ['en', 'sv', 'de'] as const

/**
 * Dynamically import embedding functions to avoid build-time issues
 * when OpenAI key is not configured
 */
async function getEmbeddingService() {
  const {
    generateTourEmbedding,
    embeddingToVectorString,
  } = await import('../../../apps/web/lib/ai/openai-embeddings-service')
  return { generateTourEmbedding, embeddingToVectorString }
}

/**
 * Extract plain text from Lexical rich text format
 */
function extractTextFromRichText(richText: unknown): string {
  if (!richText) return ''
  if (typeof richText === 'string') return richText

  // Handle Lexical editor JSON format
  try {
    const extractText = (node: unknown): string => {
      if (!node || typeof node !== 'object') return ''

      const n = node as Record<string, unknown>

      // Text node
      if (n.type === 'text' && typeof n.text === 'string') {
        return n.text
      }

      // Container node with children
      if (Array.isArray(n.children)) {
        return n.children.map(extractText).join(' ')
      }

      // Root node
      if (n.root && typeof n.root === 'object') {
        return extractText(n.root)
      }

      return ''
    }

    return extractText(richText).slice(0, 2000)
  } catch {
    // Fallback: stringify and remove tags
    return JSON.stringify(richText)
      .replace(/<[^>]*>/g, ' ')
      .replace(/[{}"[\]]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 2000)
  }
}

/**
 * Get localized value with fallback to default locale
 */
function getLocalizedValue(
  field: unknown,
  locale: string,
  fallbackLocale: string = 'en'
): string {
  if (!field) return ''
  if (typeof field === 'string') return field

  const localized = field as Record<string, unknown>
  const value = localized[locale] || localized[fallbackLocale] || ''

  return typeof value === 'string' ? value : ''
}

/**
 * Check if embedding exists and content hasn't changed
 */
async function checkExistingEmbedding(
  tourId: number,
  locale: string,
  contentHash: string,
  db: unknown
): Promise<boolean> {
  try {
    const drizzle = db as { execute: (query: unknown) => Promise<{ rows: Array<{ content_hash: string }> }> }
    const result = await drizzle.execute(sql`
      SELECT content_hash FROM tour_embeddings
      WHERE tour_id = ${tourId} AND locale = ${locale}
    `)
    return result.rows[0]?.content_hash === contentHash
  } catch {
    return false
  }
}

/**
 * Store embedding in database
 */
async function storeEmbedding(
  tourId: number,
  locale: string,
  embedding: number[],
  contentHash: string,
  db: unknown
): Promise<void> {
  const { embeddingToVectorString } = await getEmbeddingService()
  const embeddingString = embeddingToVectorString(embedding)

  const drizzle = db as { execute: (query: unknown) => Promise<unknown> }
  await drizzle.execute(sql`
    INSERT INTO tour_embeddings (tour_id, locale, embedding, content_hash, updated_at)
    VALUES (${tourId}, ${locale}, ${embeddingString}::vector, ${contentHash}, NOW())
    ON CONFLICT (tour_id, locale)
    DO UPDATE SET
      embedding = ${embeddingString}::vector,
      content_hash = ${contentHash},
      updated_at = NOW()
  `)
}

/**
 * AfterChange hook for Tours collection
 * Generates embeddings for each locale when tour is saved
 */
export const generateTourEmbeddingOnSaveHook: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
}) => {
  // Skip if not create/update
  if (operation !== 'create' && operation !== 'update') {
    return doc
  }

  // Skip draft tours
  if (doc.status === 'draft') {
    return doc
  }

  // Skip if OpenAI key not configured
  if (!process.env.OPENAI_API_KEY) {
    console.warn('[Embedding Hook] OPENAI_API_KEY not set, skipping embedding generation')
    return doc
  }

  const { generateTourEmbedding } = await getEmbeddingService()

  // Generate embeddings for each locale
  for (const locale of LOCALES) {
    try {
      // Build embedding input from tour data
      const input = {
        title: getLocalizedValue(doc.title, locale),
        description: extractTextFromRichText(
          typeof doc.description === 'object' && doc.description !== null
            ? (doc.description as Record<string, unknown>)[locale] || (doc.description as Record<string, unknown>).en
            : doc.description
        ),
        shortDescription: getLocalizedValue(doc.shortDescription, locale),
        highlights: Array.isArray(doc.highlights)
          ? doc.highlights.map((h: { highlight?: unknown }) =>
              getLocalizedValue(h.highlight, locale)
            ).filter(Boolean)
          : [],
        categories: Array.isArray(doc.categories)
          ? doc.categories.map((c: { name?: unknown } | string | number) =>
              typeof c === 'object' && c !== null
                ? getLocalizedValue(c.name, locale)
                : ''
            ).filter(Boolean)
          : [],
        audienceTags: Array.isArray(doc.audienceTags) ? doc.audienceTags : [],
        locale,
      }

      // Skip if no meaningful content
      if (!input.title && !input.description && !input.shortDescription) {
        continue
      }

      // Generate embedding and content hash
      const { embedding, contentHash } = await generateTourEmbedding(input)

      // Check if embedding exists and content unchanged
      const db = req.payload.db.drizzle
      const exists = await checkExistingEmbedding(doc.id, locale, contentHash, db)

      if (exists) {
        console.log(`[Embedding] Skipped tour ${doc.id} (${locale}) - content unchanged`)
        continue
      }

      // Store embedding
      await storeEmbedding(doc.id, locale, embedding, contentHash, db)
      console.log(`[Embedding] Generated for tour ${doc.id} (${locale})`)
    } catch (error) {
      // Log error but don't fail the save operation
      console.error(`[Embedding] Failed for tour ${doc.id} (${locale}):`, error)
    }
  }

  return doc
}
