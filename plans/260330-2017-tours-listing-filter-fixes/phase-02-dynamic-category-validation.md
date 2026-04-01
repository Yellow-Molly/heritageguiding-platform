# Phase 2: Dynamic Category Validation

**Status:** TODO
**Priority:** Critical

## Problem

Category filtering silently fails. When a user clicks a category chip (e.g., "City Hall"), the URL updates to `?categories=city-hall`, but **no tours are filtered** because:

1. **`tour-filters.ts` line 18**: `VALID_CATEGORIES = ['history', 'architecture', 'nature', 'maritime', 'royal']` — hardcoded. Any CMS slug not in this list is **rejected by validation**, and the filter returns safe defaults (no category filter applied).
2. **`get-categories.ts` line 47**: `tourCount: 0` hardcoded — all chips show `0` count.

## Root Cause

The Zod validation schema rejects any category slug not in the hardcoded `VALID_CATEGORIES` list. When validation fails, `validateTourFilters()` returns `{ sort: 'popular', q: undefined }` — dropping ALL filters.

## Solution

### A. Remove hardcoded category validation
The `categories` field should accept any valid slug format (alphanumeric + hyphens) without checking against a hardcoded list. The CMS is the source of truth. Server-side, the Payload `where` clause will simply return no results for non-existent slugs — safe by design.

### B. Remove tourCount display (Validated: skip counts for now)
Remove the count badge from CategoryChips entirely. The `tourCount: 0` hardcoded value is misleading. Cleaner to show no count than a wrong count.

## Files to Modify

| File | Action |
|------|--------|
| `apps/web/lib/validation/tour-filters.ts` | Remove `VALID_CATEGORIES` check, validate slug format only |
| `apps/web/lib/api/get-categories.ts` | Add tourCount computation per category |
| `apps/web/components/tour/filter-bar/category-chips.tsx` | Remove client-side `isValidSlug` check against `validSlugs` |

## Implementation Steps

### 1. `tour-filters.ts`
Replace hardcoded category check:
```ts
// Before
const VALID_CATEGORIES = ['history', 'architecture', 'nature', 'maritime', 'royal']
categories: z.string().optional().refine(val => {
  const cats = val.split(',').filter(Boolean)
  return cats.every(cat => VALID_CATEGORIES.includes(cat))
})

// After
categories: z.string().optional().refine(val => {
  if (!val) return true
  const cats = val.split(',').filter(Boolean)
  return cats.every(cat => /^[a-z0-9-]+$/.test(cat))
}, { message: 'Invalid category slug format' })
```

### 2. `category-chips.tsx`
Remove count badge rendering from `CategoryChip`. Remove `count` prop. Keep the chip simple: label + selected state only.

### 3. `category-chips.tsx`
Remove the `isValidSlug` function and `validSlugs` memoization. The URL-based category selection should accept any slug from the CMS categories prop — the server validates format, and the Payload query handles unknown slugs safely.

## Success Criteria

- Clicking a category chip filters tours correctly
- Category chips show accurate tour counts
- Unknown slugs in URL don't crash — just return 0 results
- No hardcoded category lists remain
