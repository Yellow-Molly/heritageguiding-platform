/**
 * Tests for generateTourEmbeddingOnSaveHook
 * Verifies embedding generation, locale handling, content hash deduplication,
 * error recovery, and skip conditions (delete/draft/missing API key)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGenerateTourEmbedding = vi.fn().mockResolvedValue({
  embedding: [0.1, 0.2, 0.3],
  contentHash: 'abc123',
})
const mockEmbeddingToVectorString = vi.fn().mockReturnValue('[0.1,0.2,0.3]')

vi.mock('../../../apps/web/lib/ai/openai-embeddings-service', () => ({
  generateTourEmbedding: (...args: unknown[]) => mockGenerateTourEmbedding(...args),
  embeddingToVectorString: (...args: unknown[]) => mockEmbeddingToVectorString(...args),
}))

vi.mock('drizzle-orm', () => ({
  sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values }),
}))

import { generateTourEmbeddingOnSaveHook } from '../hooks/generate-tour-embedding-on-save-hook'

// Mock tour document with all locales populated
const mockDoc = {
  id: 1,
  status: 'published',
  title: { en: 'Test Tour', sv: 'Test Tour SV', de: 'Test Tour DE' },
  shortDescription: { en: 'Short desc', sv: 'Kort beskr', de: 'Kurze Beschr' },
  description: { en: 'Description text', sv: 'Beskrivning', de: 'Beschreibung' },
  highlights: [],
  categories: [],
  audienceTags: [],
}

const mockExecute = vi.fn()
const mockReq = {
  payload: { db: { drizzle: { execute: mockExecute } } },
}

describe('generateTourEmbeddingOnSaveHook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('OPENAI_API_KEY', 'test-key')
    // Default: no existing embedding (empty rows = content changed)
    mockExecute.mockResolvedValue({ rows: [] })
  })

  it('returns doc unchanged for delete operation without generating embeddings', async () => {
    const result = await generateTourEmbeddingOnSaveHook({
      doc: mockDoc,
      operation: 'delete',
      req: mockReq,
    } as any)
    expect(result).toBe(mockDoc)
    expect(mockGenerateTourEmbedding).not.toHaveBeenCalled()
  })

  it('returns doc unchanged for draft status without generating embeddings', async () => {
    const draftDoc = { ...mockDoc, status: 'draft' }
    const result = await generateTourEmbeddingOnSaveHook({
      doc: draftDoc,
      operation: 'update',
      req: mockReq,
    } as any)
    expect(result).toEqual(draftDoc)
    expect(mockGenerateTourEmbedding).not.toHaveBeenCalled()
  })

  it('returns doc unchanged when OPENAI_API_KEY is not set', async () => {
    vi.stubEnv('OPENAI_API_KEY', '')
    const result = await generateTourEmbeddingOnSaveHook({
      doc: mockDoc,
      operation: 'create',
      req: mockReq,
    } as any)
    expect(result).toBe(mockDoc)
    expect(mockGenerateTourEmbedding).not.toHaveBeenCalled()
  })

  it('generates embeddings for all 3 locales (en, sv, de)', async () => {
    await generateTourEmbeddingOnSaveHook({
      doc: mockDoc,
      operation: 'create',
      req: mockReq,
    } as any)
    expect(mockGenerateTourEmbedding).toHaveBeenCalledTimes(3)
  })

  it('skips storing embedding when content hash matches existing record', async () => {
    // Return matching hash for all 3 locales
    mockExecute.mockResolvedValue({ rows: [{ content_hash: 'abc123' }] })
    await generateTourEmbeddingOnSaveHook({
      doc: mockDoc,
      operation: 'update',
      req: mockReq,
    } as any)
    // 3 check queries only, no store queries (hash matches)
    expect(mockExecute).toHaveBeenCalledTimes(3)
  })

  it('stores new embedding when no existing record found', async () => {
    // No existing embedding for any locale
    mockExecute.mockResolvedValue({ rows: [] })
    await generateTourEmbeddingOnSaveHook({
      doc: mockDoc,
      operation: 'create',
      req: mockReq,
    } as any)
    // 3 check queries + 3 insert/upsert queries = 6 total
    expect(mockExecute).toHaveBeenCalledTimes(6)
  })

  it('handles embedding generation error gracefully and returns doc without throwing', async () => {
    mockGenerateTourEmbedding.mockRejectedValueOnce(new Error('OpenAI error'))
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = await generateTourEmbeddingOnSaveHook({
      doc: mockDoc,
      operation: 'create',
      req: mockReq,
    } as any)

    expect(result).toBe(mockDoc)
    consoleSpy.mockRestore()
  })

  it('skips locale when title, shortDescription are empty and description has no en fallback', async () => {
    // All three fields must be empty for a locale to be skipped.
    // description uses [locale] || .en fallback, so en must also be empty.
    const emptyLocalesDoc = {
      ...mockDoc,
      title: { en: '', sv: '', de: '' },
      shortDescription: { en: '', sv: '', de: '' },
      description: { en: '', sv: '', de: '' },
    }
    await generateTourEmbeddingOnSaveHook({
      doc: emptyLocalesDoc,
      operation: 'create',
      req: mockReq,
    } as any)
    // All 3 locales have no content → all skipped → no embeddings generated
    expect(mockGenerateTourEmbedding).not.toHaveBeenCalled()
  })

  it('processes both create and update operations', async () => {
    await generateTourEmbeddingOnSaveHook({
      doc: mockDoc,
      operation: 'update',
      req: mockReq,
    } as any)
    expect(mockGenerateTourEmbedding).toHaveBeenCalledTimes(3)
  })

  it('returns doc after successful embedding generation', async () => {
    const result = await generateTourEmbeddingOnSaveHook({
      doc: mockDoc,
      operation: 'create',
      req: mockReq,
    } as any)
    expect(result).toBe(mockDoc)
  })
})
