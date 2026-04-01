# Phase 3: Search Performance Fix

**Status:** TODO
**Priority:** Medium

## Problem

Search is slow and sometimes returns incorrect results:
- Each keystroke (after 300ms debounce) triggers `router.push()` → full server navigation → Payload CMS query
- `like` operator on `title` field does case-sensitive substring match — unintuitive for users
- No search on `shortDescription` or other fields

## Root Cause

The `like` operator in Payload is basic substring matching. Combined with full page navigation on every search term change, UX feels sluggish even with only 10 tours.

## Solution

1. **Use `contains` instead of `like`** — Payload's `contains` is case-insensitive
2. **Search multiple fields** — title AND shortDescription using `or` clause
3. **Increase debounce to 500ms** — reduces navigation frequency
4. **Use `router.replace` instead of `router.push`** — avoids polluting browser history with each keystroke

## Files to Modify

| File | Action |
|------|--------|
| `apps/web/lib/api/get-tours.ts` | Change `like` → `contains`, search title + shortDescription |
| `apps/web/components/tour/tour-search.tsx` | Increase debounce, use `router.replace` |

## Implementation Steps

### 1. `get-tours.ts` — `buildWhereClause`
```ts
// Before
if (filters.q) {
  where['title'] = { like: filters.q.trim() }
}

// After (Validated: search title + shortDescription + description)
if (filters.q) {
  const q = filters.q.trim()
  where.or = [
    { title: { contains: q } },
    { shortDescription: { contains: q } },
    { description: { contains: q } },  // richText — test compatibility
  ]
}
// Note: richText `contains` may need testing. If Payload doesn't support
// it on richText fields, fall back to title + shortDescription only.
```

### 2. `tour-search.tsx`
- Change debounce from `300` to `500`
- Change `router.push` to `router.replace` to avoid history spam

## Success Criteria

- Search returns results matching title OR short description
- Case-insensitive matching
- No browser history pollution from typing
- Perceptibly faster response
