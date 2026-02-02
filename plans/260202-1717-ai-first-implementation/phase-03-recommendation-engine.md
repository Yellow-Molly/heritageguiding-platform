# Phase 03: Recommendation Engine

## Context Links

- [Phase 01 - Semantic Search](./phase-01-semantic-search-foundation.md) - Embeddings infrastructure
- [Tours Collection](../../packages/cms/collections/tours.ts)
- [Reviews Collection](../../packages/cms/collections/reviews.ts)
- [PostHog Analytics](https://posthog.com/docs)
- [Collaborative Filtering](https://en.wikipedia.org/wiki/Collaborative_filtering)

## Overview

| Priority | Status | Effort |
|----------|--------|--------|
| P2 - High | pending | 16-20h |

Build intelligent tour recommendation system combining content-based filtering (embeddings similarity) with collaborative filtering (user behavior). Increase tour discovery and booking conversion through personalized suggestions.

## Key Insights

1. **Hybrid approach**: Combine content similarity + user behavior for best results
2. **Cold start**: Use content-based for new users, collaborative for returning
3. **Implicit signals**: Page views, time on page, booking starts > explicit ratings
4. **Real-time vs batch**: Real-time for "similar tours", batch for "recommended for you"
5. **Diversity**: Balance relevance with discovery (don't just show same category)

## Requirements

### Functional

- Similar tours on tour detail page (content-based)
- "Recommended for you" on homepage (collaborative + content)
- "Customers also booked" section (association rules)
- Category-aware recommendations (don't over-recommend same category)
- Seasonal/availability-aware filtering
- Multi-language recommendations

### Non-Functional

- Recommendation generation <200ms
- Handle cold start (new users, new tours)
- Minimum 3 tours per recommendation slot
- Update user preferences hourly (batch)
- Privacy-compliant tracking (GDPR)
- Fallback to popular tours if insufficient data

## Architecture

### Recommendation Types

```
┌─────────────────────────────────────────────────────────────────┐
│                    Recommendation Types                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. SIMILAR TOURS (Content-Based)                               │
│     Input: Current tour ID                                       │
│     Method: pgvector embedding similarity                        │
│     Use: Tour detail page sidebar                                │
│                                                                  │
│  2. RECOMMENDED FOR YOU (Hybrid)                                │
│     Input: User ID + browsing history                           │
│     Method: User embedding + collaborative signals               │
│     Use: Homepage, email campaigns                               │
│                                                                  │
│  3. CUSTOMERS ALSO BOOKED (Association)                         │
│     Input: Tour ID                                               │
│     Method: Co-purchase frequency analysis                       │
│     Use: Booking confirmation, cart page                         │
│                                                                  │
│  4. TRENDING NOW (Popularity)                                   │
│     Input: Time window (7 days)                                  │
│     Method: View count + booking rate                            │
│     Use: Homepage, fallback for cold start                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Interactions              Recommendation Engine           Output
─────────────────              ──────────────────────          ──────
Page view event ──────┐
                      │        ┌──────────────────────┐
Booking event ────────┼──────► │  Event Collector     │
                      │        │  (PostHog/Custom)    │
Search query ─────────┤        └──────────┬───────────┘
                      │                   │
Time on page ─────────┘                   ▼
                               ┌──────────────────────┐
                               │  User Profile        │
                               │  Builder (Batch)     │
                               │  - Category prefs    │
                               │  - Price range       │
                               │  - Duration prefs    │
                               │  - User embedding    │
                               └──────────┬───────────┘
                                          │
Tour embeddings ─────────────────────────►│
(from Phase 01)                           │
                                          ▼
                               ┌──────────────────────┐
                               │  Recommendation      │───► Similar Tours
                               │  Engine              │───► For You
                               │  - Content-based     │───► Also Booked
                               │  - Collaborative     │───► Trending
                               │  - Hybrid scorer     │
                               └──────────────────────┘
```

### Database Schema

```sql
-- User interaction events (for collaborative filtering)
CREATE TABLE user_tour_interactions (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,  -- Anonymous or authenticated
  tour_id INTEGER REFERENCES tours(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,  -- 'view', 'bookmark', 'book_start', 'book_complete'
  event_weight FLOAT DEFAULT 1.0,
  session_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_user_interactions (user_id, created_at)
);

-- User preference profiles (computed)
CREATE TABLE user_profiles (
  user_id TEXT PRIMARY KEY,
  category_preferences JSONB,  -- {"history": 0.8, "architecture": 0.6}
  price_range_min FLOAT,
  price_range_max FLOAT,
  avg_duration_preference FLOAT,
  embedding vector(1536),  -- User taste embedding
  last_active_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tour popularity scores (computed daily)
CREATE TABLE tour_popularity (
  tour_id INTEGER PRIMARY KEY REFERENCES tours(id),
  view_count_7d INTEGER DEFAULT 0,
  booking_count_7d INTEGER DEFAULT 0,
  popularity_score FLOAT DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Co-purchase associations
CREATE TABLE tour_associations (
  tour_id_a INTEGER REFERENCES tours(id),
  tour_id_b INTEGER REFERENCES tours(id),
  co_purchase_count INTEGER DEFAULT 0,
  confidence FLOAT DEFAULT 0,  -- P(B|A)
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (tour_id_a, tour_id_b)
);
```

## Related Code Files

### Create

| File | Purpose |
|------|---------|
| `apps/web/lib/recommendations/recommendation-engine.ts` | Core engine |
| `apps/web/lib/recommendations/similar-tours-service.ts` | Content-based |
| `apps/web/lib/recommendations/personalized-recommendations-service.ts` | Hybrid recs |
| `apps/web/lib/recommendations/trending-tours-service.ts` | Popularity-based |
| `apps/web/lib/recommendations/user-profile-builder.ts` | Profile computation |
| `apps/web/lib/analytics/event-tracker.ts` | Track user events |
| `apps/web/app/api/recommendations/similar/route.ts` | Similar tours API |
| `apps/web/app/api/recommendations/for-you/route.ts` | Personalized API |
| `apps/web/components/recommendations/similar-tours-section.tsx` | UI component |
| `apps/web/components/recommendations/recommended-for-you-section.tsx` | UI component |
| `packages/cms/migrations/add-recommendation-tables.ts` | DB migration |

### Modify

| File | Change |
|------|--------|
| `apps/web/app/[locale]/(frontend)/tours/[slug]/page.tsx` | Add similar tours |
| `apps/web/app/[locale]/(frontend)/page.tsx` | Add recommendations |
| `apps/web/components/tour/tour-card.tsx` | Add tracking events |

## Implementation Steps

### Step 1: Create Event Tracker

```typescript
// apps/web/lib/analytics/event-tracker.ts
'use client'

import posthog from 'posthog-js'

export type EventType = 'tour_view' | 'tour_bookmark' | 'booking_start' | 'booking_complete' | 'search'

export interface TrackingEvent {
  type: EventType
  tourId?: number
  tourSlug?: string
  searchQuery?: string
  metadata?: Record<string, unknown>
}

// Event weights for collaborative filtering
const EVENT_WEIGHTS: Record<EventType, number> = {
  tour_view: 1.0,
  tour_bookmark: 3.0,
  booking_start: 5.0,
  booking_complete: 10.0,
  search: 0.5,
}

/**
 * Track user interaction for recommendations
 */
export function trackEvent(event: TrackingEvent): void {
  // Track in PostHog
  posthog.capture(event.type, {
    tour_id: event.tourId,
    tour_slug: event.tourSlug,
    search_query: event.searchQuery,
    ...event.metadata,
  })

  // Also send to our backend for recommendation processing
  if (event.tourId) {
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType: event.type,
        tourId: event.tourId,
        weight: EVENT_WEIGHTS[event.type],
        timestamp: Date.now(),
      }),
      keepalive: true,  // Send even if page is closing
    }).catch(console.error)
  }
}

/**
 * Track tour page view with time spent
 */
export function trackTourView(tourId: number, tourSlug: string): () => void {
  const startTime = Date.now()

  trackEvent({ type: 'tour_view', tourId, tourSlug })

  // Return cleanup function to track time spent
  return () => {
    const timeSpent = Math.round((Date.now() - startTime) / 1000)
    if (timeSpent > 5) {  // Only track if >5 seconds
      posthog.capture('tour_time_spent', {
        tour_id: tourId,
        seconds: timeSpent,
      })
    }
  }
}
```

### Step 2: Create Similar Tours Service

```typescript
// apps/web/lib/recommendations/similar-tours-service.ts
import { sql } from 'drizzle-orm'
import { getPayload } from 'payload'
import config from '@payload-config'

export interface SimilarTourResult {
  tourId: number
  similarity: number
  tour: unknown
}

/**
 * Find similar tours using embedding similarity
 * Uses pgvector cosine distance for fast nearest neighbor search
 */
export async function getSimilarTours(
  tourId: number,
  options: {
    limit?: number
    locale?: string
    excludeCategories?: number[]  // For diversity
    minSimilarity?: number
  } = {}
): Promise<SimilarTourResult[]> {
  const {
    limit = 4,
    locale = 'en',
    excludeCategories = [],
    minSimilarity = 0.6,
  } = options

  const payload = await getPayload({ config })
  const db = payload.db.drizzle

  // Get similar tours excluding same categories for diversity
  let query = sql`
    SELECT
      te2.tour_id,
      1 - (te1.embedding <=> te2.embedding) as similarity,
      t.id, t.title, t.slug, t.short_description,
      t.pricing_base_price as price,
      t.duration_hours as duration
    FROM tour_embeddings te1
    JOIN tour_embeddings te2 ON te1.tour_id != te2.tour_id
    JOIN tours t ON te2.tour_id = t.id
    WHERE te1.tour_id = ${tourId}
      AND te1.locale = ${locale}
      AND te2.locale = ${locale}
      AND t.status = 'published'
      AND 1 - (te1.embedding <=> te2.embedding) > ${minSimilarity}
  `

  // Exclude specific categories for diversity (optional)
  if (excludeCategories.length > 0) {
    query = sql`${query} AND NOT EXISTS (
      SELECT 1 FROM tours_categories tc
      WHERE tc.tour_id = t.id
      AND tc.category_id = ANY(${excludeCategories})
    )`
  }

  query = sql`${query}
    ORDER BY similarity DESC
    LIMIT ${limit}
  `

  const results = await db.execute(query)

  return results.rows.map((row: any) => ({
    tourId: row.tour_id,
    similarity: parseFloat(row.similarity),
    tour: {
      id: row.id,
      title: row.title,
      slug: row.slug,
      shortDescription: row.short_description,
      price: row.price,
      duration: row.duration,
    },
  }))
}

/**
 * Get similar tours with category diversity
 * Returns mix of same-category and different-category tours
 */
export async function getSimilarToursWithDiversity(
  tourId: number,
  tourCategories: number[],
  limit: number = 4,
  locale: string = 'en'
): Promise<SimilarTourResult[]> {
  // Get 2 from same categories, 2 from different
  const sameCategory = await getSimilarTours(tourId, {
    limit: Math.ceil(limit / 2),
    locale,
    minSimilarity: 0.7,
  })

  const differentCategory = await getSimilarTours(tourId, {
    limit: Math.floor(limit / 2),
    locale,
    excludeCategories: tourCategories,
    minSimilarity: 0.5,
  })

  // Merge and deduplicate
  const seen = new Set<number>()
  const results: SimilarTourResult[] = []

  for (const tour of [...sameCategory, ...differentCategory]) {
    if (!seen.has(tour.tourId) && results.length < limit) {
      seen.add(tour.tourId)
      results.push(tour)
    }
  }

  return results
}
```

### Step 3: Create Personalized Recommendations Service

```typescript
// apps/web/lib/recommendations/personalized-recommendations-service.ts
import { sql } from 'drizzle-orm'
import { getPayload } from 'payload'
import config from '@payload-config'
import { generateEmbedding } from '../ai/embeddings-service'

export interface PersonalizedRecommendation {
  tourId: number
  score: number
  reason: 'similar_to_viewed' | 'category_match' | 'trending' | 'collaborative'
  tour: unknown
}

/**
 * Get personalized recommendations for a user
 * Combines content-based and collaborative filtering
 */
export async function getPersonalizedRecommendations(
  userId: string,
  options: {
    limit?: number
    locale?: string
  } = {}
): Promise<PersonalizedRecommendation[]> {
  const { limit = 6, locale = 'en' } = options
  const payload = await getPayload({ config })
  const db = payload.db.drizzle

  // Get user profile
  const profileResult = await db.execute(sql`
    SELECT * FROM user_profiles WHERE user_id = ${userId}
  `)
  const profile = profileResult.rows[0]

  // Cold start: no profile yet
  if (!profile) {
    return getTrendingAsRecommendations(limit, locale)
  }

  // Hybrid scoring: combine embedding similarity with collaborative signals
  const results = await db.execute(sql`
    WITH user_embedding AS (
      SELECT embedding FROM user_profiles WHERE user_id = ${userId}
    ),
    viewed_tours AS (
      SELECT DISTINCT tour_id
      FROM user_tour_interactions
      WHERE user_id = ${userId}
    ),
    scored_tours AS (
      SELECT
        t.id as tour_id,
        -- Content score: similarity to user taste embedding
        COALESCE(1 - (te.embedding <=> ue.embedding), 0) * 0.4 as content_score,
        -- Category score: match with user preferences
        COALESCE(
          (SELECT SUM(value::float)
           FROM jsonb_each_text(${profile.category_preferences || '{}'}::jsonb) prefs
           JOIN tours_categories tc ON tc.category_id::text = prefs.key
           WHERE tc.tour_id = t.id
          ), 0
        ) * 0.3 as category_score,
        -- Popularity score
        COALESCE(tp.popularity_score, 0) * 0.2 as popularity_score,
        -- Collaborative score: co-viewed by similar users
        COALESCE(
          (SELECT COUNT(*) FROM user_tour_interactions uti
           WHERE uti.tour_id = t.id
           AND uti.user_id IN (
             SELECT user_id FROM user_profiles
             WHERE 1 - (embedding <=> ue.embedding) > 0.8
             AND user_id != ${userId}
           )
          )::float / 100, 0
        ) * 0.1 as collaborative_score
      FROM tours t
      JOIN tour_embeddings te ON te.tour_id = t.id AND te.locale = ${locale}
      CROSS JOIN user_embedding ue
      LEFT JOIN tour_popularity tp ON tp.tour_id = t.id
      WHERE t.status = 'published'
        AND t.id NOT IN (SELECT tour_id FROM viewed_tours)
    )
    SELECT
      tour_id,
      content_score + category_score + popularity_score + collaborative_score as total_score,
      CASE
        WHEN content_score > 0.3 THEN 'similar_to_viewed'
        WHEN category_score > 0.2 THEN 'category_match'
        WHEN popularity_score > 0.1 THEN 'trending'
        ELSE 'collaborative'
      END as reason,
      t.*
    FROM scored_tours st
    JOIN tours t ON t.id = st.tour_id
    ORDER BY total_score DESC
    LIMIT ${limit}
  `)

  return results.rows.map((row: any) => ({
    tourId: row.tour_id,
    score: parseFloat(row.total_score),
    reason: row.reason,
    tour: row,
  }))
}

/**
 * Fallback: Get trending tours as recommendations
 */
async function getTrendingAsRecommendations(
  limit: number,
  locale: string
): Promise<PersonalizedRecommendation[]> {
  const payload = await getPayload({ config })
  const db = payload.db.drizzle

  const results = await db.execute(sql`
    SELECT t.*, tp.popularity_score
    FROM tours t
    LEFT JOIN tour_popularity tp ON tp.tour_id = t.id
    WHERE t.status = 'published'
    ORDER BY COALESCE(tp.popularity_score, 0) DESC, t.created_at DESC
    LIMIT ${limit}
  `)

  return results.rows.map((row: any) => ({
    tourId: row.id,
    score: row.popularity_score || 0,
    reason: 'trending' as const,
    tour: row,
  }))
}
```

### Step 4: Create User Profile Builder

```typescript
// apps/web/lib/recommendations/user-profile-builder.ts
import { sql } from 'drizzle-orm'
import { getPayload } from 'payload'
import config from '@payload-config'
import { generateEmbedding } from '../ai/embeddings-service'

/**
 * Build/update user profile from interaction history
 * Called hourly via cron job
 */
export async function buildUserProfile(userId: string): Promise<void> {
  const payload = await getPayload({ config })
  const db = payload.db.drizzle

  // Get user's interaction history with weights
  const interactions = await db.execute(sql`
    SELECT
      uti.tour_id,
      uti.event_weight,
      t.pricing_base_price as price,
      t.duration_hours as duration,
      array_agg(DISTINCT tc.category_id) as categories
    FROM user_tour_interactions uti
    JOIN tours t ON t.id = uti.tour_id
    LEFT JOIN tours_categories tc ON tc.tour_id = t.id
    WHERE uti.user_id = ${userId}
      AND uti.created_at > NOW() - INTERVAL '30 days'
    GROUP BY uti.tour_id, uti.event_weight, t.pricing_base_price, t.duration_hours
  `)

  if (interactions.rows.length === 0) return

  // Calculate category preferences
  const categoryScores: Record<string, number> = {}
  let totalWeight = 0
  let priceSum = 0
  let durationSum = 0

  for (const row of interactions.rows as any[]) {
    const weight = row.event_weight
    totalWeight += weight

    priceSum += (row.price || 0) * weight
    durationSum += (row.duration || 0) * weight

    for (const catId of row.categories || []) {
      categoryScores[catId] = (categoryScores[catId] || 0) + weight
    }
  }

  // Normalize category scores
  const maxCatScore = Math.max(...Object.values(categoryScores), 1)
  for (const key in categoryScores) {
    categoryScores[key] = categoryScores[key] / maxCatScore
  }

  // Calculate user taste embedding (average of viewed tour embeddings, weighted)
  const embeddingResult = await db.execute(sql`
    SELECT
      AVG(te.embedding) as avg_embedding
    FROM user_tour_interactions uti
    JOIN tour_embeddings te ON te.tour_id = uti.tour_id AND te.locale = 'en'
    WHERE uti.user_id = ${userId}
      AND uti.created_at > NOW() - INTERVAL '30 days'
  `)

  const userEmbedding = embeddingResult.rows[0]?.avg_embedding

  // Upsert user profile
  await db.execute(sql`
    INSERT INTO user_profiles (
      user_id,
      category_preferences,
      price_range_min,
      price_range_max,
      avg_duration_preference,
      embedding,
      last_active_at,
      updated_at
    ) VALUES (
      ${userId},
      ${JSON.stringify(categoryScores)}::jsonb,
      ${priceSum / totalWeight * 0.5},
      ${priceSum / totalWeight * 1.5},
      ${durationSum / totalWeight},
      ${userEmbedding},
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      category_preferences = EXCLUDED.category_preferences,
      price_range_min = EXCLUDED.price_range_min,
      price_range_max = EXCLUDED.price_range_max,
      avg_duration_preference = EXCLUDED.avg_duration_preference,
      embedding = EXCLUDED.embedding,
      last_active_at = EXCLUDED.last_active_at,
      updated_at = NOW()
  `)
}

/**
 * Batch update all active user profiles
 * Run hourly via cron
 */
export async function batchUpdateUserProfiles(): Promise<number> {
  const payload = await getPayload({ config })
  const db = payload.db.drizzle

  // Get users with recent activity
  const activeUsers = await db.execute(sql`
    SELECT DISTINCT user_id
    FROM user_tour_interactions
    WHERE created_at > NOW() - INTERVAL '24 hours'
  `)

  let updated = 0
  for (const row of activeUsers.rows as any[]) {
    try {
      await buildUserProfile(row.user_id)
      updated++
    } catch (error) {
      console.error(`Failed to update profile for ${row.user_id}:`, error)
    }
  }

  return updated
}
```

### Step 5: Create API Endpoints

```typescript
// apps/web/app/api/recommendations/similar/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSimilarToursWithDiversity } from '@/lib/recommendations/similar-tours-service'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const tourId = parseInt(searchParams.get('tourId') || '')
  const locale = searchParams.get('locale') || 'en'
  const limit = Math.min(parseInt(searchParams.get('limit') || '4'), 10)
  const categories = searchParams.get('categories')?.split(',').map(Number) || []

  if (!tourId || isNaN(tourId)) {
    return NextResponse.json({ error: 'tourId required' }, { status: 400 })
  }

  try {
    const results = await getSimilarToursWithDiversity(tourId, categories, limit, locale)

    return NextResponse.json({
      tourId,
      recommendations: results,
    })
  } catch (error) {
    console.error('[Similar Tours]', error)
    return NextResponse.json({ error: 'Failed to get recommendations' }, { status: 500 })
  }
}
```

```typescript
// apps/web/app/api/recommendations/for-you/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPersonalizedRecommendations } from '@/lib/recommendations/personalized-recommendations-service'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const locale = searchParams.get('locale') || 'en'
  const limit = Math.min(parseInt(searchParams.get('limit') || '6'), 12)

  // Get user ID from cookie or session
  const cookieStore = await cookies()
  const userId = cookieStore.get('user_id')?.value || cookieStore.get('anonymous_id')?.value

  if (!userId) {
    // No user tracking - return trending
    return NextResponse.json({
      recommendations: [],
      type: 'trending',
    })
  }

  try {
    const results = await getPersonalizedRecommendations(userId, { limit, locale })

    return NextResponse.json({
      recommendations: results,
      type: 'personalized',
    })
  } catch (error) {
    console.error('[For You]', error)
    return NextResponse.json({ error: 'Failed to get recommendations' }, { status: 500 })
  }
}
```

### Step 6: Create UI Components

```typescript
// apps/web/components/recommendations/similar-tours-section.tsx
'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { TourCard } from '@/components/tour/tour-card'

interface SimilarToursSectionProps {
  tourId: number
  categories: number[]
}

export function SimilarToursSection({ tourId, categories }: SimilarToursSectionProps) {
  const t = useTranslations('recommendations')
  const locale = useLocale()
  const [tours, setTours] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSimilar() {
      try {
        const params = new URLSearchParams({
          tourId: tourId.toString(),
          locale,
          categories: categories.join(','),
          limit: '4',
        })

        const response = await fetch(`/api/recommendations/similar?${params}`)
        if (response.ok) {
          const data = await response.json()
          setTours(data.recommendations.map((r: any) => r.tour))
        }
      } catch (error) {
        console.error('Failed to fetch similar tours:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSimilar()
  }, [tourId, locale, categories])

  if (loading || tours.length === 0) return null

  return (
    <section className="py-12">
      <h2 className="mb-6 font-serif text-2xl font-bold">{t('similarTours')}</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {tours.map((tour) => (
          <TourCard key={tour.id} tour={tour} />
        ))}
      </div>
    </section>
  )
}
```

## Todo List

- [ ] Create database migration for recommendation tables
- [ ] Implement event-tracker.ts
- [ ] Implement similar-tours-service.ts
- [ ] Implement personalized-recommendations-service.ts
- [ ] Implement user-profile-builder.ts
- [ ] Implement trending-tours-service.ts
- [ ] Create /api/recommendations/similar endpoint
- [ ] Create /api/recommendations/for-you endpoint
- [ ] Create /api/analytics/track endpoint
- [ ] Create SimilarToursSection component
- [ ] Create RecommendedForYouSection component
- [ ] Add event tracking to TourCard
- [ ] Add event tracking to tour detail page
- [ ] Set up hourly cron for profile updates
- [ ] Add PostHog integration
- [ ] Test cold start scenario
- [ ] Test diversity in recommendations

## Success Criteria

- [ ] Similar tours appear on detail page
- [ ] Recommendations personalize after 3+ views
- [ ] Cold start shows trending tours
- [ ] Response time <200ms
- [ ] Category diversity in results
- [ ] 20% increase in tours viewed per session

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Cold start problem | High | Medium | Fallback to trending/popular |
| Filter bubble | Medium | Medium | Enforce category diversity |
| Stale recommendations | Medium | Low | Hourly profile updates |
| Privacy concerns | Low | High | Anonymous tracking, GDPR compliance |
| Insufficient data | High initially | Medium | Start with content-based only |

## Security Considerations

1. **Privacy**: Use anonymous IDs, allow opt-out
2. **GDPR**: Data retention policy (30 days default)
3. **No PII in tracking**: Only tour IDs, no personal data
4. **Rate limiting**: Prevent tracking spam
5. **Secure cookies**: HttpOnly, SameSite for user ID

## Next Steps

After Phase 03 completion:
1. **Phase 04**: Deep personalization with analytics
2. **A/B Testing**: Test recommendation algorithms
3. **Email Integration**: Personalized tour suggestions
4. **Real-time updates**: WebSocket for live recommendations

---

**Unresolved Questions:**

1. Anonymous vs authenticated user tracking strategy?
2. Optimal profile update frequency (hourly vs daily)?
3. How to handle seasonal tours in recommendations?
4. Should we weight recent interactions more heavily?
