# Phase 4: Mobile FilterDrawer Dynamic Categories

**Status:** TODO
**Priority:** High

## Problem

`FilterDrawer` (mobile filter panel) uses a hardcoded `CATEGORIES` array:
```ts
const CATEGORIES = [
  { id: 'history', translationKey: 'history' },
  { id: 'architecture', translationKey: 'architecture' },
  { id: 'nature', translationKey: 'nature' },
  { id: 'maritime', translationKey: 'maritime' },
  { id: 'royal', translationKey: 'royal' },
]
```

These don't match actual CMS categories. Mobile users see wrong filter options.

## Root Cause

`FilterDrawer` was built before CMS integration. It hardcodes categories with translation keys instead of using CMS data.

## Solution

Pass `categories: Category[]` prop from `FilterBar` (which already receives CMS categories) into `FilterDrawer`. Use `category.name` (already localized from CMS) instead of translation keys.

## Files to Modify

| File | Action |
|------|--------|
| `apps/web/components/tour/filter-drawer.tsx` | Accept `categories` prop, remove hardcoded list |
| `apps/web/components/tour/filter-bar/filter-bar.tsx` | Pass `categories` to `FilterDrawer` |

## Implementation Steps

### 1. `filter-drawer.tsx`
- Add `categories: Category[]` to props
- Remove hardcoded `CATEGORIES` constant
- Use `category.slug` as ID and `category.name` as display label
- Update `selectedCategories` validation to check against prop slugs

### 2. `filter-bar.tsx`
- Pass `categories={categories}` to `<FilterDrawer />` in mobile layout

## Success Criteria

- Mobile filter drawer shows real CMS categories
- Category selection syncs correctly with URL params and desktop category chips
- No hardcoded category lists remain in the codebase
