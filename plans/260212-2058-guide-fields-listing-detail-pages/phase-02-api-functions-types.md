# Phase 02: API Functions + Types

## Context Links

- Tour API pattern: `apps/web/lib/api/get-tours.ts` (363 lines with mock data)
- Tour detail API: `apps/web/lib/api/get-tour-by-slug.ts` (400 lines with mock data)
- Categories API: `apps/web/lib/api/get-categories.ts`
- Validation pattern: `apps/web/lib/validation/tour-filters.ts`

## Overview

- **Priority:** P1 (blocks Phase 03 + 04)
- **Status:** Pending
- **Estimate:** 1.5h
- **Description:** Create two API data-fetching functions for guides (listing + detail) with TypeScript interfaces, mock data, and filter logic. Follow exact patterns from get-tours.ts.

## Key Insights

- get-tours.ts uses mock data array + filter/sort/pagination functions, returning `ToursResponse`
- get-tour-by-slug.ts uses mock data record keyed by slug, returns `TourDetail | null`
- Both have TODO comments for future CMS integration
- Guide public types must NEVER include email or phone
- Only active guides should be returned by public functions

## Requirements

### Functional
- `getGuides(filters)` -- returns paginated list of active guides with filtering
- `getGuideBySlug(slug, locale)` -- returns single guide detail or null
- `getAllGuideSlugs()` -- returns all slugs for static generation
- Filter support: language, specialization (category slug), operatingArea (city slug), search (name)
- Pagination support matching tours pattern

### Non-Functional
- Each file under 200 lines (split mock data if needed)
- Full TypeScript typing with interfaces
- No exposure of email/phone in any public type

## Architecture

```
apps/web/lib/api/
  get-guides.ts           <- NEW (GuideListItem, GuideFilters, getGuides)
  get-guide-by-slug.ts    <- NEW (GuideDetail, getGuideBySlug, getAllGuideSlugs)
```

## Related Code Files

### Files to Create
- `apps/web/lib/api/get-guides.ts`
- `apps/web/lib/api/get-guide-by-slug.ts`

### Reference Files (read-only)
- `apps/web/lib/api/get-tours.ts` -- listing pattern
- `apps/web/lib/api/get-tour-by-slug.ts` -- detail pattern
- `apps/web/lib/api/get-categories.ts` -- simple fetch pattern

## Implementation Steps

### Step 1: Create `get-guides.ts`

1. Define `GuideListItem` interface:
   ```typescript
   export interface GuideListItem {
     id: string
     name: string
     slug: string
     photo?: { url: string; alt: string }
     languages: string[]
     additionalLanguages?: string[]
     specializations: Array<{ id: string; name: string; slug: string }>
     operatingAreas: Array<{ id: string; name: string; slug: string }>
     credentials?: Array<{ credential: string }>
     /** Short bio excerpt for card display */
     bioExcerpt?: string
   }
   ```
   Note: NO email, NO phone, NO status (only active guides returned)

2. Define `GuideFilters` interface:
   ```typescript
   export interface GuideFilters {
     language?: string        // filter by language code (sv, en, de, etc.)
     specialization?: string  // category slug
     area?: string            // city slug
     q?: string               // search by name
     page?: string
     limit?: string
   }
   ```

3. Define `GuidesResponse`:
   ```typescript
   export interface GuidesResponse {
     guides: GuideListItem[]
     total: number
     page: number
     totalPages: number
   }
   ```

4. Create mock data array (4-5 guides) matching the mock guides already used in tour details (Erik Lindqvist, Anna Bergstrom, Magnus Eriksson) plus 1-2 new ones. Include specializations and operatingAreas.

5. Implement `applyGuideFilters()` function:
   - language filter: check if `languages` or `additionalLanguages` includes value
   - specialization: check if any `specializations[].slug` matches
   - area: check if any `operatingAreas[].slug` matches
   - q (search): case-insensitive match on `name`

6. Implement `getGuides(filters)` async function:
   - Apply filters
   - Paginate (default limit 12)
   - Return GuidesResponse
   - Add TODO comment for CMS integration

### Step 2: Create `get-guide-by-slug.ts`

1. Define `GuideDetail` extending `GuideListItem`:
   ```typescript
   export interface GuideDetail extends GuideListItem {
     /** Rich text bio (HTML string for now, richText later) */
     bio: string
     /** Tours led by this guide */
     tours: Array<{
       id: string
       title: string
       slug: string
       image: { url: string; alt: string }
       duration: number
       price: number
       rating: number
       reviewCount: number
     }>
   }
   ```

2. Create mock data record keyed by slug (3 guides with full details + their tours)

3. Implement `getGuideBySlug(slug, locale)`:
   - Return `GuideDetail | null`
   - TODO comment for CMS query

4. Implement `getAllGuideSlugs()`:
   - Return `Array<{ slug: string }>` from mock data keys

## Todo List

- [ ] Create `get-guides.ts` with GuideListItem, GuideFilters, GuidesResponse interfaces
- [ ] Add mock guide data (4-5 guides)
- [ ] Implement applyGuideFilters function
- [ ] Implement getGuides with pagination
- [ ] Create `get-guide-by-slug.ts` with GuideDetail interface
- [ ] Add mock guide detail data (3 guides with tours)
- [ ] Implement getGuideBySlug
- [ ] Implement getAllGuideSlugs
- [ ] Verify no email/phone in any public interface
- [ ] Keep each file under 200 lines

## Success Criteria

- Both files compile without TypeScript errors
- `getGuides({})` returns all active mock guides
- `getGuides({ language: 'sv' })` filters correctly
- `getGuides({ specialization: 'history' })` filters correctly
- `getGuideBySlug('erik-lindqvist')` returns full detail with tours
- `getGuideBySlug('nonexistent')` returns null
- `getAllGuideSlugs()` returns array of slugs
- No email/phone fields in any exported interface

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Mock data file too large (>200 lines) | Low | Split into separate mock-data file if needed |
| Type mismatch with CMS when integrating later | Low | Types designed to mirror Payload schema |

## Security Considerations

- CRITICAL: `email` and `phone` excluded from all public-facing types
- Only "active" status guides returned (hardcoded filter in mock, TODO for CMS where clause)
- Input sanitization on search query (lowercase, trim)

## Next Steps

- Phase 03 imports these types for component props
- Phase 04 imports these functions for page data fetching
