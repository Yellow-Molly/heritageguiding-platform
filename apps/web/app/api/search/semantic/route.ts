/**
 * Semantic Search API Route
 * GET /api/search/semantic?q=...&locale=en&limit=10&threshold=0.5
 * Returns tour results ranked by semantic similarity to the query
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  performSemanticSearch,
  type SemanticSearchParams,
} from '../../../../lib/ai'

// Query parameter validation schema
const searchParamsSchema = z.object({
  q: z.string().min(2).max(500),
  locale: z.enum(['en', 'sv', 'de']).default('en'),
  limit: z.coerce.number().min(1).max(50).default(10),
  threshold: z.coerce.number().min(0).max(1).default(0.5),
  categories: z.string().optional(),
  priceMax: z.coerce.number().positive().optional(),
  durationMax: z.coerce.number().positive().optional(),
  offset: z.coerce.number().min(0).default(0),
})

/**
 * Sanitize search query to prevent XSS and injection
 */
function sanitizeQuery(query: string): string {
  return query
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>"'&]/g, '') // Remove special chars
    .trim()
    .slice(0, 500)
}

/**
 * GET handler for semantic search
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  // Extract and validate parameters
  const rawParams = {
    q: searchParams.get('q'),
    locale: searchParams.get('locale') || 'en',
    limit: searchParams.get('limit') || '10',
    threshold: searchParams.get('threshold') || '0.5',
    categories: searchParams.get('categories'),
    priceMax: searchParams.get('priceMax'),
    durationMax: searchParams.get('durationMax'),
    offset: searchParams.get('offset') || '0',
  }

  // Validate with Zod
  const validation = searchParamsSchema.safeParse(rawParams)

  if (!validation.success) {
    return NextResponse.json(
      {
        error: 'Invalid parameters',
        details: validation.error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      },
      { status: 400 }
    )
  }

  const params = validation.data

  // Sanitize query
  const sanitizedQuery = sanitizeQuery(params.q)
  if (sanitizedQuery.length < 2) {
    return NextResponse.json(
      { error: 'Query must be at least 2 characters after sanitization' },
      { status: 400 }
    )
  }

  // Build search params
  const searchParams_: SemanticSearchParams = {
    query: sanitizedQuery,
    locale: params.locale,
    limit: params.limit,
    threshold: params.threshold,
    offset: params.offset,
    categories: params.categories?.split(',').filter(Boolean),
    priceMax: params.priceMax,
    durationMax: params.durationMax,
  }

  try {
    const response = await performSemanticSearch(searchParams_)

    return NextResponse.json({
      success: true,
      query: sanitizedQuery,
      locale: params.locale,
      results: response.results.map((r) => ({
        id: r.tourId,
        similarity: Math.round(r.similarity * 100) / 100,
        tour: r.tour,
      })),
      total: response.total,
      limit: params.limit,
      offset: params.offset,
    })
  } catch (error) {
    console.error('[Semantic Search API]', error)

    // Check for specific error types
    if (error instanceof Error) {
      if (error.message.includes('OPENAI_API_KEY')) {
        return NextResponse.json(
          { error: 'Search service not configured' },
          { status: 503 }
        )
      }

      if (error.message.includes('pgvector') || error.message.includes('vector')) {
        return NextResponse.json(
          { error: 'Vector search not available' },
          { status: 503 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Search failed', details: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
