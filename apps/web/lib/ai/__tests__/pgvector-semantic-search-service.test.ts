/**
 * Tests for pgvector Semantic Search Service
 * Covers: performSemanticSearch, findSimilarTours, hasEmbedding, getEmbeddingStats
 * Mocks: openai-embeddings-service, drizzle-orm sql, payload, @payload-config
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the embeddings service - must be before imports
vi.mock('../openai-embeddings-service', () => ({
  generateEmbedding: vi.fn().mockResolvedValue([0.1, 0.2, 0.3]),
  embeddingToVectorString: vi.fn().mockReturnValue('[0.1,0.2,0.3]'),
}))

// Mock drizzle-orm sql template tag used to build raw SQL queries
vi.mock('drizzle-orm', () => ({
  sql: Object.assign(
    (strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values, type: 'sql' }),
    {
      join: (items: unknown[], sep: unknown) => ({ items, sep, type: 'sql-join' }),
    }
  ),
}))

// Shared mock for db.execute - tests override per-case via mockResolvedValueOnce
const mockExecute = vi.fn()

// Mock payload dynamic import used inside getDatabase()
vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue({
    db: {
      drizzle: { execute: mockExecute },
    },
  }),
}))

// Mock @payload-config dynamic import
vi.mock('@payload-config', () => ({ default: {} }))

import {
  performSemanticSearch,
  findSimilarTours,
  hasEmbedding,
  getEmbeddingStats,
} from '../pgvector-semantic-search-service'

// ---------------------------------------------------------------------------
// performSemanticSearch
// ---------------------------------------------------------------------------
describe('performSemanticSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: first call returns result rows, second returns count row
    mockExecute
      .mockResolvedValueOnce({
        rows: [{ tourId: 1, similarity: 0.9, id: 1, title: 'Tour 1', slug: 'tour-1' }],
      })
      .mockResolvedValueOnce({
        rows: [{ total: '1' }],
      })
  })

  it('returns results array with tourId and similarity from db rows', async () => {
    const response = await performSemanticSearch({ query: 'viking tours' })
    expect(response.results).toHaveLength(1)
    expect(response.results[0].tourId).toBe(1)
    expect(response.results[0].similarity).toBe(0.9)
  })

  it('wraps raw db row in tour property of each result', async () => {
    const response = await performSemanticSearch({ query: 'viking tours' })
    expect(response.results[0].tour).toMatchObject({ id: 1, title: 'Tour 1' })
  })

  it('returns total count parsed from count query', async () => {
    const response = await performSemanticSearch({ query: 'viking tours' })
    expect(response.total).toBe(1)
  })

  it('defaults locale to "en" when not provided', async () => {
    const response = await performSemanticSearch({ query: 'test' })
    expect(response.locale).toBe('en')
  })

  it('reflects provided locale in response', async () => {
    mockExecute.mockReset()
    mockExecute
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
    const response = await performSemanticSearch({ query: 'test', locale: 'sv' })
    expect(response.locale).toBe('sv')
  })

  it('echoes original query string in response', async () => {
    const response = await performSemanticSearch({ query: 'viking tours' })
    expect(response.query).toBe('viking tours')
  })

  it('executes exactly two db queries (main + count)', async () => {
    await performSemanticSearch({ query: 'test' })
    expect(mockExecute).toHaveBeenCalledTimes(2)
  })

  it('returns total 0 when count row is missing', async () => {
    mockExecute.mockReset()
    mockExecute
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{}] }) // row without total key
    const response = await performSemanticSearch({ query: 'empty' })
    expect(response.total).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// findSimilarTours
// ---------------------------------------------------------------------------
describe('findSimilarTours', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns mapped results with tourId and similarity', async () => {
    mockExecute.mockResolvedValueOnce({
      rows: [{ tourId: 2, similarity: 0.8, id: 2, title: 'Similar Tour', slug: 'similar-tour' }],
    })
    const results = await findSimilarTours(1)
    expect(results).toHaveLength(1)
    expect(results[0].tourId).toBe(2)
    expect(results[0].similarity).toBe(0.8)
  })

  it('returns empty array when no similar tours found', async () => {
    mockExecute.mockResolvedValueOnce({ rows: [] })
    const results = await findSimilarTours(99)
    expect(results).toEqual([])
  })

  it('executes exactly one db query', async () => {
    mockExecute.mockResolvedValueOnce({ rows: [] })
    await findSimilarTours(1)
    expect(mockExecute).toHaveBeenCalledTimes(1)
  })

  it('wraps raw db row in tour property', async () => {
    mockExecute.mockResolvedValueOnce({
      rows: [{ tourId: 3, similarity: 0.75, id: 3, title: 'Another Tour' }],
    })
    const results = await findSimilarTours(1)
    expect(results[0].tour).toMatchObject({ id: 3, title: 'Another Tour' })
  })
})

// ---------------------------------------------------------------------------
// hasEmbedding
// ---------------------------------------------------------------------------
describe('hasEmbedding', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns true when db returns at least one row', async () => {
    mockExecute.mockResolvedValueOnce({ rows: [{ 1: 1 }] })
    expect(await hasEmbedding(1)).toBe(true)
  })

  it('returns false when db returns no rows', async () => {
    mockExecute.mockResolvedValueOnce({ rows: [] })
    expect(await hasEmbedding(1)).toBe(false)
  })

  it('uses default locale "en"', async () => {
    mockExecute.mockResolvedValueOnce({ rows: [] })
    // Should not throw with no locale argument
    await expect(hasEmbedding(42)).resolves.toBe(false)
  })
})

// ---------------------------------------------------------------------------
// getEmbeddingStats
// ---------------------------------------------------------------------------
describe('getEmbeddingStats', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns totalEmbeddings as sum of all locale counts', async () => {
    mockExecute.mockResolvedValueOnce({
      rows: [
        { locale: 'en', count: '10', last_updated: new Date('2025-01-01') },
        { locale: 'sv', count: '8', last_updated: new Date('2025-01-02') },
      ],
    })
    const stats = await getEmbeddingStats()
    expect(stats.totalEmbeddings).toBe(18)
  })

  it('returns byLocale map keyed by locale with numeric counts', async () => {
    mockExecute.mockResolvedValueOnce({
      rows: [
        { locale: 'en', count: '10', last_updated: new Date('2025-01-01') },
        { locale: 'sv', count: '8', last_updated: new Date('2025-01-02') },
      ],
    })
    const stats = await getEmbeddingStats()
    expect(stats.byLocale).toEqual({ en: 10, sv: 8 })
  })

  it('returns lastUpdated as the most recent last_updated date across locales', async () => {
    mockExecute.mockResolvedValueOnce({
      rows: [
        { locale: 'en', count: '10', last_updated: new Date('2025-01-01') },
        { locale: 'sv', count: '8', last_updated: new Date('2025-01-02') },
      ],
    })
    const stats = await getEmbeddingStats()
    expect(stats.lastUpdated).toEqual(new Date('2025-01-02'))
  })

  it('returns totalEmbeddings 0 when no rows', async () => {
    mockExecute.mockResolvedValueOnce({ rows: [] })
    const stats = await getEmbeddingStats()
    expect(stats.totalEmbeddings).toBe(0)
  })

  it('returns empty byLocale map when no rows', async () => {
    mockExecute.mockResolvedValueOnce({ rows: [] })
    const stats = await getEmbeddingStats()
    expect(stats.byLocale).toEqual({})
  })

  it('returns null lastUpdated when no rows', async () => {
    mockExecute.mockResolvedValueOnce({ rows: [] })
    const stats = await getEmbeddingStats()
    expect(stats.lastUpdated).toBeNull()
  })

  it('handles single locale correctly', async () => {
    mockExecute.mockResolvedValueOnce({
      rows: [{ locale: 'de', count: '5', last_updated: new Date('2025-03-15') }],
    })
    const stats = await getEmbeddingStats()
    expect(stats.totalEmbeddings).toBe(5)
    expect(stats.byLocale).toEqual({ de: 5 })
    expect(stats.lastUpdated).toEqual(new Date('2025-03-15'))
  })
})
