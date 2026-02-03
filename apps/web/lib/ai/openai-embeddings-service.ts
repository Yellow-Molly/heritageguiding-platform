/**
 * OpenAI Embeddings Service
 * Generates vector embeddings for tour content using text-embedding-3-small model
 * Used for semantic search and similar tour recommendations
 */

import OpenAI from 'openai'
import { createHash } from 'crypto'

// Lazy initialization to avoid errors when API key not set
let openaiClient: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required for embeddings')
    }
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return openaiClient
}

// Model configuration
export const EMBEDDING_MODEL = 'text-embedding-3-small'
export const EMBEDDING_DIMENSIONS = 1536

/**
 * Input structure for generating tour embeddings
 * Contains all text fields that should be considered for semantic matching
 */
export interface TourEmbeddingInput {
  title: string
  description: string
  shortDescription: string
  highlights: string[]
  categories: string[]
  audienceTags: string[]
  locale: string
}

/**
 * Generate a content hash to detect changes requiring re-embedding
 * Avoids regenerating embeddings for unchanged content (saves API costs)
 */
export function generateContentHash(input: TourEmbeddingInput): string {
  const content = JSON.stringify({
    title: input.title,
    description: input.description,
    shortDescription: input.shortDescription,
    highlights: input.highlights.sort(),
    categories: input.categories.sort(),
    audienceTags: input.audienceTags.sort(),
  })
  return createHash('sha256').update(content).digest('hex').slice(0, 16)
}

/**
 * Prepare tour content for embedding generation
 * Combines relevant fields into optimized text for the embedding model
 */
export function prepareTourContentForEmbedding(input: TourEmbeddingInput): string {
  const parts = [
    `Tour: ${input.title}`,
    input.shortDescription,
    // Truncate long descriptions to stay within token limits
    input.description.slice(0, 1000),
    input.highlights.length > 0 ? `Highlights: ${input.highlights.join(', ')}` : '',
    input.categories.length > 0 ? `Categories: ${input.categories.join(', ')}` : '',
    input.audienceTags.length > 0 ? `Suitable for: ${input.audienceTags.join(', ')}` : '',
  ]

  return parts.filter(Boolean).join('\n\n')
}

/**
 * Generate embedding vector for text content
 * @param text - Text to generate embedding for
 * @returns 1536-dimension vector array
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const openai = getOpenAIClient()

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
    dimensions: EMBEDDING_DIMENSIONS,
  })

  return response.data[0].embedding
}

/**
 * Batch generate embeddings for multiple texts
 * More efficient than individual calls for bulk operations
 * @param texts - Array of texts to embed
 * @returns Array of embedding vectors in same order as input
 */
export async function generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []

  const openai = getOpenAIClient()

  // OpenAI supports batch embeddings in single request
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
    dimensions: EMBEDDING_DIMENSIONS,
  })

  // Sort by index to maintain order
  return response.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding)
}

/**
 * Generate embedding for a complete tour object
 * @param tour - Tour data with localized content
 * @param locale - Language code (en, sv, de)
 * @returns Object with embedding vector and content hash
 */
export async function generateTourEmbedding(
  tour: TourEmbeddingInput
): Promise<{ embedding: number[]; contentHash: string }> {
  const contentHash = generateContentHash(tour)
  const content = prepareTourContentForEmbedding(tour)
  const embedding = await generateEmbedding(content)

  return { embedding, contentHash }
}

/**
 * Convert embedding array to PostgreSQL vector string format
 */
export function embeddingToVectorString(embedding: number[]): string {
  return `[${embedding.join(',')}]`
}
