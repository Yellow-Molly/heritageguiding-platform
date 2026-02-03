/**
 * AI Services barrel export
 * Provides semantic search and embedding generation for tours
 */

// Embedding generation
export {
  generateEmbedding,
  generateBatchEmbeddings,
  generateTourEmbedding,
  generateContentHash,
  prepareTourContentForEmbedding,
  embeddingToVectorString,
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS,
  type TourEmbeddingInput,
} from './openai-embeddings-service'

// Semantic search
export {
  performSemanticSearch,
  findSimilarTours,
  hasEmbedding,
  getEmbeddingStats,
  type SemanticSearchParams,
  type SemanticSearchResult,
  type SemanticSearchResponse,
} from './pgvector-semantic-search-service'
