/**
 * pgvector Semantic Search Service
 * Performs vector similarity search on tour embeddings using PostgreSQL pgvector
 * Supports filtering, pagination, and similar tour recommendations
 */

import { sql } from 'drizzle-orm'
import {
  generateEmbedding,
  embeddingToVectorString,
} from './openai-embeddings-service'

// Type for drizzle database instance
type DrizzleDB = {
  execute: (query: unknown) => Promise<{ rows: Record<string, unknown>[] }>
}

/**
 * Get Payload CMS instance and drizzle database
 * Dynamic import to avoid build-time issues
 */
async function getDatabase(): Promise<DrizzleDB> {
  const { getPayload } = await import('payload')
  const { default: config } = await import('@payload-config')
  const payload = await getPayload({ config })
  // Access drizzle through the db adapter
  return (payload.db as unknown as { drizzle: DrizzleDB }).drizzle
}

/**
 * Parameters for semantic search queries
 */
export interface SemanticSearchParams {
  query: string
  locale?: string
  limit?: number
  threshold?: number // Minimum similarity score (0-1), default 0.5
  categories?: string[]
  priceMax?: number
  durationMax?: number
  offset?: number
}

/**
 * Individual search result with similarity score
 */
export interface SemanticSearchResult {
  tourId: number
  similarity: number
  tour: Record<string, unknown>
}

/**
 * Paginated search response
 */
export interface SemanticSearchResponse {
  results: SemanticSearchResult[]
  total: number
  query: string
  locale: string
}

/**
 * Perform semantic search using pgvector cosine similarity
 * Combines vector similarity with optional traditional filters
 */
export async function performSemanticSearch(
  params: SemanticSearchParams
): Promise<SemanticSearchResponse> {
  const {
    query,
    locale = 'en',
    limit = 10,
    threshold = 0.5,
    categories,
    priceMax,
    durationMax,
    offset = 0,
  } = params

  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query)
  const embeddingString = embeddingToVectorString(queryEmbedding)

  const db = await getDatabase()

  // Build dynamic SQL query with pgvector similarity
  // Using cosine distance operator <=> and converting to similarity (1 - distance)
  const baseQuery = sql`
    SELECT
      te.tour_id as "tourId",
      1 - (te.embedding <=> ${embeddingString}::vector) as similarity,
      t.id,
      t.title,
      t.slug,
      t.short_description as "shortDescription",
      t.status,
      t.featured,
      t.pricing_base_price as "pricingBasePrice",
      t.duration_hours as "durationHours"
    FROM tour_embeddings te
    JOIN tours t ON te.tour_id = t.id
    WHERE te.locale = ${locale}
      AND 1 - (te.embedding <=> ${embeddingString}::vector) > ${threshold}
      AND t.status = 'published'
  `

  // Add optional filters
  let filterQuery = baseQuery

  if (categories && categories.length > 0) {
    // Filter by category relationships
    filterQuery = sql`${filterQuery}
      AND EXISTS (
        SELECT 1 FROM tours_rels tr
        WHERE tr.parent_id = t.id
          AND tr.path = 'categories'
          AND tr.categories_id IN (${sql.join(categories.map(c => sql`${c}`), sql`, `)})
      )`
  }

  if (priceMax !== undefined) {
    filterQuery = sql`${filterQuery}
      AND t.pricing_base_price <= ${priceMax}`
  }

  if (durationMax !== undefined) {
    filterQuery = sql`${filterQuery}
      AND t.duration_hours <= ${durationMax}`
  }

  // Add ordering and pagination
  const finalQuery = sql`${filterQuery}
    ORDER BY similarity DESC
    LIMIT ${limit}
    OFFSET ${offset}`

  // Execute query
  const results = await db.execute(finalQuery)

  // Get total count for pagination
  const countQuery = sql`
    SELECT COUNT(DISTINCT te.tour_id) as total
    FROM tour_embeddings te
    JOIN tours t ON te.tour_id = t.id
    WHERE te.locale = ${locale}
      AND 1 - (te.embedding <=> ${embeddingString}::vector) > ${threshold}
      AND t.status = 'published'
  `
  const countResult = await db.execute(countQuery)
  const total = Number(countResult.rows[0]?.total || 0)

  return {
    results: results.rows.map((row: Record<string, unknown>) => ({
      tourId: row.tourId as number,
      similarity: row.similarity as number,
      tour: row,
    })),
    total,
    query,
    locale,
  }
}

/**
 * Find tours similar to a given tour based on embedding similarity
 * Useful for "You might also like" recommendations
 */
export async function findSimilarTours(
  tourId: number,
  locale: string = 'en',
  limit: number = 5,
  threshold: number = 0.6
): Promise<SemanticSearchResult[]> {
  const db = await getDatabase()

  // Find tours with similar embeddings, excluding the source tour
  const results = await db.execute(sql`
    SELECT
      te2.tour_id as "tourId",
      1 - (te1.embedding <=> te2.embedding) as similarity,
      t.id,
      t.title,
      t.slug,
      t.short_description as "shortDescription",
      t.pricing_base_price as "pricingBasePrice",
      t.duration_hours as "durationHours"
    FROM tour_embeddings te1
    JOIN tour_embeddings te2 ON te1.tour_id != te2.tour_id
    JOIN tours t ON te2.tour_id = t.id
    WHERE te1.tour_id = ${tourId}
      AND te1.locale = ${locale}
      AND te2.locale = ${locale}
      AND t.status = 'published'
      AND 1 - (te1.embedding <=> te2.embedding) > ${threshold}
    ORDER BY similarity DESC
    LIMIT ${limit}
  `)

  return results.rows.map((row: Record<string, unknown>) => ({
    tourId: row.tourId as number,
    similarity: row.similarity as number,
    tour: row,
  }))
}

/**
 * Check if a tour has an embedding for the given locale
 */
export async function hasEmbedding(
  tourId: number,
  locale: string = 'en'
): Promise<boolean> {
  const db = await getDatabase()

  const result = await db.execute(sql`
    SELECT 1 FROM tour_embeddings
    WHERE tour_id = ${tourId} AND locale = ${locale}
    LIMIT 1
  `)

  return result.rows.length > 0
}

/**
 * Get embedding statistics for monitoring
 */
export async function getEmbeddingStats(): Promise<{
  totalEmbeddings: number
  byLocale: Record<string, number>
  lastUpdated: Date | null
}> {
  const db = await getDatabase()

  const stats = await db.execute(sql`
    SELECT
      locale,
      COUNT(*) as count,
      MAX(updated_at) as last_updated
    FROM tour_embeddings
    GROUP BY locale
  `)

  const byLocale: Record<string, number> = {}
  let totalEmbeddings = 0
  let lastUpdated: Date | null = null

  for (const row of stats.rows as Array<{ locale: string; count: string; last_updated: Date }>) {
    byLocale[row.locale] = Number(row.count)
    totalEmbeddings += Number(row.count)
    if (!lastUpdated || row.last_updated > lastUpdated) {
      lastUpdated = row.last_updated
    }
  }

  return { totalEmbeddings, byLocale, lastUpdated }
}
