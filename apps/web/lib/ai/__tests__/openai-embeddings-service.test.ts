/**
 * Tests for OpenAI Embeddings Service
 * Covers: constants, generateContentHash, prepareTourContentForEmbedding,
 *         embeddingToVectorString, generateEmbedding, generateBatchEmbeddings,
 *         generateTourEmbedding
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock OpenAI module before importing the service.
// Must use a proper constructor function (not arrow function) because the
// source does `new OpenAI(...)` which requires a constructable target.
const mockEmbeddingsCreate = vi.fn().mockResolvedValue({
  data: [{ embedding: [0.1, 0.2, 0.3], index: 0 }],
})

vi.mock('openai', () => {
  function MockOpenAI() {
    return { embeddings: { create: mockEmbeddingsCreate } }
  }
  return { default: MockOpenAI }
})

// Stub API key so lazy singleton initialises on first import
vi.stubEnv('OPENAI_API_KEY', 'test-key')

import {
  EMBEDDING_MODEL,
  EMBEDDING_DIMENSIONS,
  generateContentHash,
  prepareTourContentForEmbedding,
  generateEmbedding,
  generateBatchEmbeddings,
  generateTourEmbedding,
  embeddingToVectorString,
  type TourEmbeddingInput,
} from '../openai-embeddings-service'

// ---------------------------------------------------------------------------
// Shared fixture
// ---------------------------------------------------------------------------
const baseTourInput: TourEmbeddingInput = {
  title: 'Viking History Walk',
  description: 'A walk through Viking heritage sites in Stockholm.',
  shortDescription: 'Explore Viking heritage',
  highlights: ['Runestones', 'Viking Museum'],
  categories: ['History', 'Walking'],
  audienceTags: ['Adults', 'Families'],
  locale: 'en',
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
describe('constants', () => {
  it('EMBEDDING_MODEL equals text-embedding-3-small', () => {
    expect(EMBEDDING_MODEL).toBe('text-embedding-3-small')
  })

  it('EMBEDDING_DIMENSIONS equals 1536', () => {
    expect(EMBEDDING_DIMENSIONS).toBe(1536)
  })
})

// ---------------------------------------------------------------------------
// generateContentHash
// ---------------------------------------------------------------------------
describe('generateContentHash', () => {
  it('returns hex string of length 16', () => {
    const hash = generateContentHash(baseTourInput)
    expect(hash).toMatch(/^[a-f0-9]{16}$/)
  })

  it('returns same hash for same input (deterministic)', () => {
    expect(generateContentHash(baseTourInput)).toBe(generateContentHash(baseTourInput))
  })

  it('returns different hash when title changes', () => {
    const modified = { ...baseTourInput, title: 'Different Tour' }
    expect(generateContentHash(baseTourInput)).not.toBe(generateContentHash(modified))
  })

  it('returns different hash when description changes', () => {
    const modified = { ...baseTourInput, description: 'Completely different description.' }
    expect(generateContentHash(baseTourInput)).not.toBe(generateContentHash(modified))
  })

  it('is order-independent for highlights array (sorts before hashing)', () => {
    const input1 = { ...baseTourInput, highlights: ['A', 'B'] }
    const input2 = { ...baseTourInput, highlights: ['B', 'A'] }
    expect(generateContentHash(input1)).toBe(generateContentHash(input2))
  })

  it('is order-independent for categories array', () => {
    const input1 = { ...baseTourInput, categories: ['History', 'Walking'] }
    const input2 = { ...baseTourInput, categories: ['Walking', 'History'] }
    expect(generateContentHash(input1)).toBe(generateContentHash(input2))
  })

  it('is order-independent for audienceTags array', () => {
    const input1 = { ...baseTourInput, audienceTags: ['Adults', 'Families'] }
    const input2 = { ...baseTourInput, audienceTags: ['Families', 'Adults'] }
    expect(generateContentHash(input1)).toBe(generateContentHash(input2))
  })

  it('locale field does not affect hash (excluded from hash content)', () => {
    const enInput = { ...baseTourInput, locale: 'en' }
    const svInput = { ...baseTourInput, locale: 'sv' }
    // locale is intentionally excluded from the hash to allow sharing across locales
    expect(generateContentHash(enInput)).toBe(generateContentHash(svInput))
  })
})

// ---------------------------------------------------------------------------
// prepareTourContentForEmbedding
// ---------------------------------------------------------------------------
describe('prepareTourContentForEmbedding', () => {
  it('includes title prefixed with "Tour:"', () => {
    const result = prepareTourContentForEmbedding(baseTourInput)
    expect(result).toContain('Tour: Viking History Walk')
  })

  it('includes shortDescription', () => {
    const result = prepareTourContentForEmbedding(baseTourInput)
    expect(result).toContain('Explore Viking heritage')
  })

  it('includes beginning of description', () => {
    const result = prepareTourContentForEmbedding(baseTourInput)
    expect(result).toContain('A walk through Viking heritage')
  })

  it('truncates description to 1000 characters', () => {
    const longDesc = 'a'.repeat(2000)
    const input = { ...baseTourInput, description: longDesc }
    const result = prepareTourContentForEmbedding(input)
    // Overall content must be shorter than full 2000-char description padded with sections
    expect(result.length).toBeLessThan(1200)
  })

  it('includes highlights when non-empty', () => {
    const result = prepareTourContentForEmbedding(baseTourInput)
    expect(result).toContain('Highlights: Runestones, Viking Museum')
  })

  it('includes categories when non-empty', () => {
    const result = prepareTourContentForEmbedding(baseTourInput)
    expect(result).toContain('Categories: History, Walking')
  })

  it('includes audienceTags when non-empty', () => {
    const result = prepareTourContentForEmbedding(baseTourInput)
    expect(result).toContain('Suitable for: Adults, Families')
  })

  it('omits Highlights section when array is empty', () => {
    const input = { ...baseTourInput, highlights: [] }
    const result = prepareTourContentForEmbedding(input)
    expect(result).not.toContain('Highlights:')
  })

  it('omits Categories section when array is empty', () => {
    const input = { ...baseTourInput, categories: [] }
    const result = prepareTourContentForEmbedding(input)
    expect(result).not.toContain('Categories:')
  })

  it('omits Suitable for section when audienceTags is empty', () => {
    const input = { ...baseTourInput, audienceTags: [] }
    const result = prepareTourContentForEmbedding(input)
    expect(result).not.toContain('Suitable for:')
  })

  it('joins sections with double newline', () => {
    const result = prepareTourContentForEmbedding(baseTourInput)
    expect(result).toContain('\n\n')
  })
})

// ---------------------------------------------------------------------------
// embeddingToVectorString
// ---------------------------------------------------------------------------
describe('embeddingToVectorString', () => {
  it('formats array as [x,y,z] string', () => {
    expect(embeddingToVectorString([0.1, 0.2, 0.3])).toBe('[0.1,0.2,0.3]')
  })

  it('handles single-element array', () => {
    expect(embeddingToVectorString([0.5])).toBe('[0.5]')
  })

  it('handles empty array', () => {
    expect(embeddingToVectorString([])).toBe('[]')
  })
})

// ---------------------------------------------------------------------------
// generateEmbedding
// ---------------------------------------------------------------------------
describe('generateEmbedding', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls OpenAI embeddings.create with correct model, input and dimensions', async () => {
    await generateEmbedding('test text')
    expect(mockEmbeddingsCreate).toHaveBeenCalledWith({
      model: 'text-embedding-3-small',
      input: 'test text',
      dimensions: 1536,
    })
  })

  it('returns the embedding array from response', async () => {
    const result = await generateEmbedding('test')
    expect(result).toEqual([0.1, 0.2, 0.3])
  })

  it('calls OpenAI exactly once per invocation', async () => {
    await generateEmbedding('hello')
    expect(mockEmbeddingsCreate).toHaveBeenCalledTimes(1)
  })
})

// ---------------------------------------------------------------------------
// generateBatchEmbeddings
// ---------------------------------------------------------------------------
describe('generateBatchEmbeddings', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns empty array without calling OpenAI when input is empty', async () => {
    const result = await generateBatchEmbeddings([])
    expect(result).toEqual([])
    expect(mockEmbeddingsCreate).not.toHaveBeenCalled()
  })

  it('calls OpenAI with array of texts', async () => {
    await generateBatchEmbeddings(['a', 'b'])
    expect(mockEmbeddingsCreate).toHaveBeenCalledWith({
      model: 'text-embedding-3-small',
      input: ['a', 'b'],
      dimensions: 1536,
    })
  })

  it('returns embeddings sorted by index (not response order)', async () => {
    mockEmbeddingsCreate.mockResolvedValueOnce({
      data: [
        { embedding: [0.3], index: 1 },
        { embedding: [0.1], index: 0 },
      ],
    })
    const result = await generateBatchEmbeddings(['a', 'b'])
    expect(result).toEqual([[0.1], [0.3]])
  })

  it('handles single text input', async () => {
    const result = await generateBatchEmbeddings(['only one'])
    expect(result).toEqual([[0.1, 0.2, 0.3]])
  })
})

// ---------------------------------------------------------------------------
// generateTourEmbedding
// ---------------------------------------------------------------------------
describe('generateTourEmbedding', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns object with embedding and contentHash properties', async () => {
    const result = await generateTourEmbedding(baseTourInput)
    expect(result).toHaveProperty('embedding')
    expect(result).toHaveProperty('contentHash')
  })

  it('embedding matches mocked OpenAI response', async () => {
    const result = await generateTourEmbedding(baseTourInput)
    expect(result.embedding).toEqual([0.1, 0.2, 0.3])
  })

  it('contentHash is 16-character hex string', async () => {
    const result = await generateTourEmbedding(baseTourInput)
    expect(result.contentHash).toMatch(/^[a-f0-9]{16}$/)
  })

  it('contentHash matches generateContentHash output for same input', async () => {
    const result = await generateTourEmbedding(baseTourInput)
    expect(result.contentHash).toBe(generateContentHash(baseTourInput))
  })
})
