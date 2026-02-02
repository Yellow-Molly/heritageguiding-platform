# Phase 01: Semantic Search Foundation

## Context Links

- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Current Tours Collection](../../packages/cms/collections/tours.ts)
- [System Architecture](../../docs/system-architecture.md)

## Overview

| Priority | Status | Effort |
|----------|--------|--------|
| P1 - Critical | pending | 16-20h |

Enable semantic/natural language search for tours using pgvector and OpenAI embeddings. Users can search with queries like "romantic sunset tour" or "kid-friendly history walk" instead of exact keyword matches.

## Key Insights

1. **pgvector compatibility**: PostgreSQL 15+ supports pgvector - no new database needed
2. **Embedding model**: text-embedding-3-small offers best cost/performance ($0.02/1M tokens)
3. **Vector dimensions**: 1536 dimensions standard, can reduce to 512 for faster search
4. **Indexing strategy**: HNSW index for fast approximate nearest neighbor search
5. **Hybrid approach**: Combine vector similarity with keyword/filter for best results

## Requirements

### Functional

- Natural language tour search ("family-friendly outdoor activities")
- Similar tour recommendations based on embeddings
- Multi-language query support (SV/EN/DE)
- Search with filters (category, price, duration) + semantic relevance
- Auto-generate embeddings on tour create/update

### Non-Functional

- Search response time <500ms for 1000 tours
- Embedding generation <2s per tour
- Graceful fallback to keyword search if embedding fails
- Cache embeddings in database (no re-computation)
- Rate limit OpenAI API calls (batch processing)

## Architecture

### Embedding Pipeline

```
Tour Created/Updated (Payload CMS)
        |
        v
afterChange Hook triggers
        |
        v
generateTourEmbedding()
        |
        v
OpenAI text-embedding-3-small API
        |
        v
Store embedding in tour_embeddings table
        |
        v
pgvector indexes for fast retrieval
```

### Search Flow

```
User enters search query
        |
        v
/api/search/semantic?q=...
        |
        v
generateQueryEmbedding(query)
        |
        v
pgvector similarity search (cosine distance)
        |
        v
Combine with filters (category, price, etc.)
        |
        v
Return ranked results with similarity scores
```

### Database Schema

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Tour embeddings table
CREATE TABLE tour_embeddings (
  id SERIAL PRIMARY KEY,
  tour_id INTEGER REFERENCES tours(id) ON DELETE CASCADE,
  embedding vector(1536),
  embedding_model TEXT DEFAULT 'text-embedding-3-small',
  content_hash TEXT,  -- Hash of embedded content for change detection
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tour_id)
);

-- HNSW index for fast similarity search
CREATE INDEX tour_embeddings_hnsw_idx
ON tour_embeddings
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

## Related Code Files

### Create

| File | Purpose |
|------|---------|
| `apps/web/lib/ai/embeddings-service.ts` | OpenAI embedding generation |
| `apps/web/lib/ai/semantic-search-service.ts` | pgvector similarity search |
| `apps/web/app/api/search/semantic/route.ts` | Semantic search API endpoint |
| `packages/cms/hooks/generate-tour-embedding-hook.ts` | Payload afterChange hook |
| `packages/cms/migrations/add-pgvector-extension.ts` | Database migration |

### Modify

| File | Change |
|------|--------|
| `packages/cms/collections/tours.ts` | Add afterChange hook for embeddings |
| `packages/cms/payload.config.ts` | Register embedding hook |
| `.env.example` | Add OPENAI_API_KEY |
| `apps/web/components/tour/filter-bar/` | Add semantic search input |

## Implementation Steps

### Step 1: Enable pgvector Extension

```typescript
// packages/cms/migrations/20260202-add-pgvector-extension.ts
import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
    CREATE EXTENSION IF NOT EXISTS vector;

    CREATE TABLE IF NOT EXISTS tour_embeddings (
      id SERIAL PRIMARY KEY,
      tour_id INTEGER NOT NULL,
      embedding vector(1536),
      embedding_model TEXT DEFAULT 'text-embedding-3-small',
      content_hash TEXT,
      locale TEXT DEFAULT 'en',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(tour_id, locale)
    );

    CREATE INDEX IF NOT EXISTS tour_embeddings_hnsw_idx
    ON tour_embeddings
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);
  `)
}

export async function down({ payload }: MigrateDownArgs): Promise<void> {
  await payload.db.drizzle.execute(sql`
    DROP TABLE IF EXISTS tour_embeddings;
    DROP EXTENSION IF EXISTS vector;
  `)
}
```

### Step 2: Create Embeddings Service

```typescript
// apps/web/lib/ai/embeddings-service.ts
import OpenAI from 'openai'
import { createHash } from 'crypto'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const EMBEDDING_MODEL = 'text-embedding-3-small'
const EMBEDDING_DIMENSIONS = 1536

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
 * Generate content hash to detect changes requiring re-embedding
 */
export function generateContentHash(input: TourEmbeddingInput): string {
  const content = JSON.stringify(input)
  return createHash('sha256').update(content).digest('hex').slice(0, 16)
}

/**
 * Prepare tour content for embedding generation
 */
export function prepareTourContent(input: TourEmbeddingInput): string {
  const parts = [
    `Tour: ${input.title}`,
    input.shortDescription,
    input.description.slice(0, 1000), // Truncate long descriptions
    `Highlights: ${input.highlights.join(', ')}`,
    `Categories: ${input.categories.join(', ')}`,
    `Audience: ${input.audienceTags.join(', ')}`,
  ]
  return parts.filter(Boolean).join('\n\n')
}

/**
 * Generate embedding vector for tour content
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
    dimensions: EMBEDDING_DIMENSIONS,
  })
  return response.data[0].embedding
}

/**
 * Batch generate embeddings for multiple tours
 */
export async function generateBatchEmbeddings(
  texts: string[]
): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
    dimensions: EMBEDDING_DIMENSIONS,
  })
  return response.data.map((d) => d.embedding)
}
```

### Step 3: Create Semantic Search Service

```typescript
// apps/web/lib/ai/semantic-search-service.ts
import { sql } from 'drizzle-orm'
import { getPayload } from 'payload'
import config from '@payload-config'
import { generateEmbedding } from './embeddings-service'

export interface SemanticSearchParams {
  query: string
  locale?: string
  limit?: number
  threshold?: number  // Minimum similarity score (0-1)
  categories?: string[]
  priceMax?: number
  durationMax?: number
}

export interface SemanticSearchResult {
  tourId: number
  similarity: number
  tour: unknown  // Tour document
}

/**
 * Perform semantic search using pgvector cosine similarity
 */
export async function semanticSearch(
  params: SemanticSearchParams
): Promise<SemanticSearchResult[]> {
  const {
    query,
    locale = 'en',
    limit = 10,
    threshold = 0.5,
    categories,
    priceMax,
    durationMax,
  } = params

  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query)
  const embeddingString = `[${queryEmbedding.join(',')}]`

  const payload = await getPayload({ config })
  const db = payload.db.drizzle

  // Build SQL query with pgvector similarity
  let sqlQuery = sql`
    SELECT
      te.tour_id,
      1 - (te.embedding <=> ${embeddingString}::vector) as similarity,
      t.*
    FROM tour_embeddings te
    JOIN tours t ON te.tour_id = t.id
    WHERE te.locale = ${locale}
      AND 1 - (te.embedding <=> ${embeddingString}::vector) > ${threshold}
      AND t.status = 'published'
  `

  // Add optional filters
  if (categories?.length) {
    // Join with category relationships
    sqlQuery = sql`${sqlQuery} AND EXISTS (
      SELECT 1 FROM tours_categories tc
      WHERE tc.tour_id = t.id AND tc.category_id IN (${sql.join(categories, sql`, `)})
    )`
  }

  if (priceMax) {
    sqlQuery = sql`${sqlQuery} AND t.pricing_base_price <= ${priceMax}`
  }

  if (durationMax) {
    sqlQuery = sql`${sqlQuery} AND t.duration_hours <= ${durationMax}`
  }

  sqlQuery = sql`${sqlQuery} ORDER BY similarity DESC LIMIT ${limit}`

  const results = await db.execute(sqlQuery)

  return results.rows.map((row: any) => ({
    tourId: row.tour_id,
    similarity: row.similarity,
    tour: row,
  }))
}

/**
 * Find similar tours based on embedding similarity
 */
export async function findSimilarTours(
  tourId: number,
  locale: string = 'en',
  limit: number = 5
): Promise<SemanticSearchResult[]> {
  const payload = await getPayload({ config })
  const db = payload.db.drizzle

  const results = await db.execute(sql`
    SELECT
      te2.tour_id,
      1 - (te1.embedding <=> te2.embedding) as similarity,
      t.*
    FROM tour_embeddings te1
    JOIN tour_embeddings te2 ON te1.tour_id != te2.tour_id
    JOIN tours t ON te2.tour_id = t.id
    WHERE te1.tour_id = ${tourId}
      AND te1.locale = ${locale}
      AND te2.locale = ${locale}
      AND t.status = 'published'
    ORDER BY similarity DESC
    LIMIT ${limit}
  `)

  return results.rows.map((row: any) => ({
    tourId: row.tour_id,
    similarity: row.similarity,
    tour: row,
  }))
}
```

### Step 4: Create Search API Endpoint

```typescript
// apps/web/app/api/search/semantic/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { semanticSearch, SemanticSearchParams } from '@/lib/ai/semantic-search-service'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const query = searchParams.get('q')
  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: 'Query must be at least 2 characters' },
      { status: 400 }
    )
  }

  const params: SemanticSearchParams = {
    query,
    locale: searchParams.get('locale') || 'en',
    limit: Math.min(parseInt(searchParams.get('limit') || '10'), 50),
    threshold: parseFloat(searchParams.get('threshold') || '0.5'),
    categories: searchParams.get('categories')?.split(',').filter(Boolean),
    priceMax: searchParams.get('priceMax')
      ? parseInt(searchParams.get('priceMax')!)
      : undefined,
    durationMax: searchParams.get('durationMax')
      ? parseInt(searchParams.get('durationMax')!)
      : undefined,
  }

  try {
    const results = await semanticSearch(params)

    return NextResponse.json({
      query,
      results: results.map((r) => ({
        id: r.tourId,
        similarity: Math.round(r.similarity * 100) / 100,
        tour: r.tour,
      })),
      total: results.length,
    })
  } catch (error) {
    console.error('[Semantic Search]', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}
```

### Step 5: Create Payload Hook for Auto-Embedding

```typescript
// packages/cms/hooks/generate-tour-embedding-hook.ts
import type { CollectionAfterChangeHook } from 'payload'
import {
  generateEmbedding,
  prepareTourContent,
  generateContentHash,
  TourEmbeddingInput,
} from '../../../apps/web/lib/ai/embeddings-service'

const LOCALES = ['en', 'sv', 'de']

export const generateTourEmbeddingHook: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
}) => {
  // Skip if not create/update
  if (operation !== 'create' && operation !== 'update') return doc

  // Skip if draft
  if (doc.status === 'draft') return doc

  // Generate embeddings for each locale
  for (const locale of LOCALES) {
    try {
      const input: TourEmbeddingInput = {
        title: doc.title?.[locale] || doc.title?.en || '',
        description: extractTextFromRichText(doc.description?.[locale] || doc.description?.en),
        shortDescription: doc.shortDescription?.[locale] || doc.shortDescription?.en || '',
        highlights: (doc.highlights || []).map((h: any) => h.highlight?.[locale] || h.highlight?.en || ''),
        categories: (doc.categories || []).map((c: any) => c.name?.[locale] || c.name?.en || ''),
        audienceTags: doc.audienceTags || [],
        locale,
      }

      const contentHash = generateContentHash(input)

      // Check if embedding exists and content hasn't changed
      const existing = await checkExistingEmbedding(doc.id, locale, contentHash, req.payload)
      if (existing) continue

      // Generate and store embedding
      const content = prepareTourContent(input)
      const embedding = await generateEmbedding(content)

      await storeEmbedding(doc.id, locale, embedding, contentHash, req.payload)

      console.log(`[Embedding] Generated for tour ${doc.id} (${locale})`)
    } catch (error) {
      console.error(`[Embedding] Failed for tour ${doc.id} (${locale}):`, error)
      // Don't fail the save operation
    }
  }

  return doc
}

function extractTextFromRichText(richText: any): string {
  if (!richText) return ''
  if (typeof richText === 'string') return richText
  // Extract text from Lexical rich text format
  // Simplified - expand for full Lexical support
  return JSON.stringify(richText).replace(/<[^>]*>/g, ' ').slice(0, 2000)
}

async function checkExistingEmbedding(
  tourId: number,
  locale: string,
  contentHash: string,
  payload: any
): Promise<boolean> {
  const result = await payload.db.drizzle.execute(sql`
    SELECT content_hash FROM tour_embeddings
    WHERE tour_id = ${tourId} AND locale = ${locale}
  `)
  return result.rows[0]?.content_hash === contentHash
}

async function storeEmbedding(
  tourId: number,
  locale: string,
  embedding: number[],
  contentHash: string,
  payload: any
): Promise<void> {
  const embeddingString = `[${embedding.join(',')}]`

  await payload.db.drizzle.execute(sql`
    INSERT INTO tour_embeddings (tour_id, locale, embedding, content_hash, updated_at)
    VALUES (${tourId}, ${locale}, ${embeddingString}::vector, ${contentHash}, NOW())
    ON CONFLICT (tour_id, locale)
    DO UPDATE SET
      embedding = ${embeddingString}::vector,
      content_hash = ${contentHash},
      updated_at = NOW()
  `)
}
```

### Step 6: Update Environment Variables

```bash
# .env.example additions
# OpenAI API (for embeddings)
OPENAI_API_KEY=sk-...

# Embedding configuration (optional)
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=1536
```

## Todo List

- [ ] Enable pgvector extension on PostgreSQL
- [ ] Create tour_embeddings table with HNSW index
- [ ] Implement embeddings-service.ts
- [ ] Implement semantic-search-service.ts
- [ ] Create /api/search/semantic endpoint
- [ ] Create Payload afterChange hook
- [ ] Register hook in Tours collection
- [ ] Add OPENAI_API_KEY to environment
- [ ] Generate embeddings for existing tours (batch script)
- [ ] Update FilterBar with semantic search input
- [ ] Add search analytics tracking
- [ ] Test multi-language query support
- [ ] Benchmark search performance (<500ms)
- [ ] Add fallback to keyword search on API failure

## Success Criteria

- [ ] pgvector extension enabled and indexed
- [ ] Embeddings auto-generated on tour save
- [ ] Semantic search returns relevant results
- [ ] Search response time <500ms
- [ ] Multi-locale embeddings (EN/SV/DE)
- [ ] Graceful fallback on API errors
- [ ] 85%+ search relevance satisfaction

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| pgvector not available on host | Low | High | Use Supabase/Neon (built-in support) |
| OpenAI API rate limits | Medium | Medium | Batch processing, queue embeddings |
| Embedding drift over time | Low | Low | Re-embed on content changes (hash check) |
| High OpenAI costs | Low | Medium | text-embedding-3-small is very cheap |
| Search latency | Medium | Medium | HNSW index, result caching |

## Security Considerations

1. **API Key Protection**: OPENAI_API_KEY in server-only environment
2. **Query Sanitization**: Validate/sanitize search queries
3. **Rate Limiting**: Limit search requests per user/IP
4. **Data Exposure**: Only return published tours in search results
5. **Embedding Storage**: Embeddings stored in same DB with same access controls

## Next Steps

After Phase 01 completion:
1. **Phase 02**: Use embeddings for AI content generation
2. **Phase 03**: Build recommendation engine on similarity
3. **Optimization**: Reduce dimensions to 512 if performance needed
4. **Analytics**: Track search queries for improvement

---

**Unresolved Questions:**

1. Supabase pgvector support - need to verify extension availability
2. Optimal HNSW parameters (m, ef_construction) for tour volume
3. Best threshold value for similarity (0.5 default, may need tuning)
4. Should we embed reviews/guide bios for richer context?
