# Phase 4: Related Tours — Replace Mock Data with Payload CMS

**Status:** DONE
**Priority:** High
**Effort:** Small

## Context

`get-related-tours.ts` currently returns hardcoded mock tours. The TODO comment in the file says "Replace with Payload CMS query when CMS is configured." CMS is now configured and has real tour data (imported via the guide data pipeline). The query pattern already exists in `get-tours.ts`.

## Files to Modify

- `apps/web/lib/api/get-related-tours.ts`

## Implementation Steps

1. Remove all mock data (`allTours` array and `categoryTourMap`)
2. Import `getPayload` and `config` from payload
3. Import `mapPayloadTourToFeaturedTour` from `tour-payload-mapper`
4. Query Payload CMS for published tours matching categories, excluding current tour
5. If not enough category matches, backfill with other published tours
6. Cache with `unstable_cache` + `tours` tag (consistent with other tour queries)

## Code Changes

```typescript
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { FeaturedTour } from './get-featured-tours'
import { mapPayloadTourToFeaturedTour } from './tour-payload-mapper'

/**
 * Cached function accepts only serializable args (strings + string[]).
 * Category objects are converted to slug strings by the public wrapper.
 */
async function fetchRelatedTours(
  currentTourId: string,
  categorySlugs: string[],
  limit: number = 3
): Promise<FeaturedTour[]> {
  const payload = await getPayload({ config })

  // Try category-based matching first
  if (categorySlugs && categorySlugs.length > 0) {
    const { docs } = await payload.find({
      collection: 'tours',
      where: {
        id: { not_equals: currentTourId },
        status: { equals: 'published' },
        'categories.slug': { in: categorySlugs.join(',') },
      },
      limit,
      depth: 2,
    })

    const tours = docs.map(doc =>
      mapPayloadTourToFeaturedTour(doc as unknown as Record<string, unknown>)
    )

    // Backfill if not enough category matches
    if (tours.length < limit) {
      const existingIds = [currentTourId, ...tours.map(t => t.id)]
      const { docs: moreDocs } = await payload.find({
        collection: 'tours',
        where: {
          id: { not_in: existingIds.join(',') },
          status: { equals: 'published' },
        },
        limit: limit - tours.length,
        depth: 2,
      })
      tours.push(...moreDocs.map(doc =>
        mapPayloadTourToFeaturedTour(doc as unknown as Record<string, unknown>)
      ))
    }

    return tours
  }

  // No categories — return any published tours except current
  const { docs } = await payload.find({
    collection: 'tours',
    where: {
      id: { not_equals: currentTourId },
      status: { equals: 'published' },
    },
    limit,
    depth: 2,
  })

  return docs.map(doc =>
    mapPayloadTourToFeaturedTour(doc as unknown as Record<string, unknown>)
  )
}

const getCachedRelatedTours = unstable_cache(
  fetchRelatedTours,
  ['related-tours'],
  { tags: ['tours'] }
)

/**
 * Public API — accepts category objects, extracts slugs for cache-safe call.
 */
export async function getRelatedTours(
  currentTourId: string,
  categories?: Array<{ id?: string; slug?: string }>,
  limit: number = 3
): Promise<FeaturedTour[]> {
  const slugs = (categories?.map(c => c.slug).filter(Boolean) as string[]) ?? []
  return getCachedRelatedTours(currentTourId, slugs, limit)
}
```

## Success Criteria

- [x] Related tours section shows real tours from CMS
- [x] Current tour excluded from results
- [x] Category-based matching works (same categories first)
- [x] Backfill with other tours if < 3 category matches
- [x] Cached with `tours` tag for on-demand revalidation
- [x] No mock data remains in the file
