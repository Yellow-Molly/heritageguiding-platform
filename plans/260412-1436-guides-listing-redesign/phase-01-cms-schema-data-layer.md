# Phase 01: CMS Schema & Data Layer

## Context Links
- CMS collection: `packages/cms/collections/guides.ts`
- API layer: `apps/web/lib/api/get-guides.ts`
- Tours collection (has `guide` relationship): `packages/cms/collections/tours.ts`

## Overview
- **Priority:** High (blocks Phase 5)
- **Status:** Complete
- **Description:** Add `yearsExperience` field to guides CMS collection, compute tour counts per guide in API layer, update TypeScript interface.

## Key Insights
- Tours collection already has `relationTo: 'guides'` at line 112 — can count tours per guide
- `getGuides()` already maps docs to `GuideListItem` — extend that mapping
- No destructive migration: adding optional number field only

## Requirements

### Functional
- `yearsExperience` number field in CMS (optional, admin-editable)
- `tourCount` computed per guide at query time
- Both exposed in `GuideListItem` interface

### Non-Functional
- Tour count query must not create N+1 (batch query all guides' tour counts in one call)
- Cache invalidation: existing `revalidateTag('guides')` covers this

## Architecture

```
guides.ts (CMS)
  + yearsExperience: number (optional)

get-guides.ts (API)
  + query tours collection: count grouped by guide ID
  + merge tourCount into each GuideListItem
  + add yearsExperience from doc mapping
```

## Related Code Files
- **Modify:** `packages/cms/collections/guides.ts` — add field
- **Modify:** `apps/web/lib/api/get-guides.ts` — update interface + mapping + tour count query

## Implementation Steps

1. Add `yearsExperience` field to `Guides` collection config:
   ```typescript
   { name: 'yearsExperience', type: 'number', min: 0, max: 60, admin: { description: 'Years of guiding experience' } }
   ```
2. Update `GuideListItem` interface — add `tourCount: number` and `yearsExperience?: number`
3. In `getGuides()`, after fetching guides, batch-query tours collection:
   ```typescript
   const payload = await getPayload({ config })
   // Get all active tour counts grouped by guide
   const tourCounts = await payload.find({
     collection: 'tours',
     where: { status: { equals: 'published' }, guide: { in: guideIds } },
     limit: 0, // just need totalDocs per guide — use aggregate approach
   })
   ```
   - Alternative: single query fetching all published tours with guide field, then count in JS
4. Update `mapGuideToListItem()` to accept tour count map and include both new fields
5. Update `getCachedGuides` — no changes needed (passes through)

## Todo List
- [ ] Add `yearsExperience` field to guides collection
- [ ] Update `GuideListItem` interface
- [ ] Implement batch tour count query in `getGuides()`
- [ ] Update `mapGuideToListItem()` to include new fields
- [ ] Verify no type errors with `npm run typecheck`

## Success Criteria
- `GuideListItem` includes `tourCount` (number) and `yearsExperience` (number | undefined)
- Tour count computed without N+1 queries
- Existing guide listing still works (backwards compatible — new fields optional in UI)

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Tour count query slow for many guides | Low | Medium | Single query + JS grouping; cache layer already exists |
| Field migration breaks existing data | Very Low | Low | Optional field, no default required |

## Security Considerations
- No new public data exposure (yearsExperience is non-sensitive)
- Tour count is public information (already visible on tour pages)

## Next Steps
- Phase 5 consumes the new fields to render stats line on cards
