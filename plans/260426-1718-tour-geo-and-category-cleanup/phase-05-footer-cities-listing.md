# Phase 05 — Footer Cities Listing

## Context Links

- `apps/web/components/layout/footer.tsx`
- `apps/web/lib/api/get-featured-tours.ts` — pattern for the new helper
- `messages/{sv,en,de}.json` (footer namespace)
- Phase 01 schema (Tour.cities) and Phase 03 backfill (each tour has ≥1 city)

## Overview

- **Priority:** P2 (depends on Phase 01; can ship after Phase 03)
- **Status:** pending
- **Effort:** 1h
- **Description:** Replace the footer "Tours" column featured-tour list with a list of Cities that have ≥1 published tour. Each link goes to `/tours?cities={slug}`. "View all tours" link preserved at the bottom.

## Key Insights

- Existing footer fetches `getFeaturedTours(locale, 3)` server-side. Same approach for `getCitiesWithTours(locale)`.
- A "city has tours" check requires a JOIN — implement via Payload query with `where: { 'cities.slug': { exists: true } }` on tours, then dedupe city slugs. Or: query cities, then for each, run a `count` on tours filtered by that city. Prefer the dedupe approach for efficiency (1 query).
- Result list is small (3 cities expected at MVP launch) — no need for a complex caching tier; use `unstable_cache` with `tags: ['cities', 'tours']` and revalidate when either changes.
- Order cities by published-tour count descending — shows the most active city first.
- Empty fallback: if helper fails, render "View all tours" link only (no broken UI).

## Requirements

### Functional
- Helper `getCitiesWithTours(locale, limit?)` returns `{ id, name, slug, tourCount }[]`.
- Footer "Tours" column heading uses existing `t('tourLinks.heading')` key (no copy change required).
- List items: city name as link to `/tours?cities={slug}`. The footer's `<Link>` from `@/i18n/navigation` localizes the path.
- Append "View all tours" → `/tours` (existing).
- Only cities with `tourCount >= 1` shown.

### Non-Functional
- Server-rendered (already true for footer).
- Localized city names (use `getCities(locale)` from Phase 04, then enrich with count).
- Cache tags: `cities`, `tours` — invalidated by both collections' revalidate hooks.
- Failure-safe: try/catch identical to existing featured-tours fallback.

## Architecture

```
Footer (RSC)
  └── getCitiesWithTours(locale, 5)
        ├── payload.find({ collection: 'tours', where: { status: 'published' }, depth: 1, limit: 0, select: ['cities'] })
        ├── flatten + dedupe city IDs
        ├── for each unique city → resolve { id, name, slug }
        └── sort by count desc, slice
```

## Related Code Files

**Modify**
- `apps/web/components/layout/footer.tsx` — swap data source for "Tours" column

**Create**
- `apps/web/lib/api/get-cities-with-tours.ts` — new helper

**Read for context**
- `apps/web/lib/api/get-featured-tours.ts`
- `apps/web/lib/api/get-cities.ts` (Phase 04)

## Implementation Steps

1. Create `apps/web/lib/api/get-cities-with-tours.ts`:
   ```ts
   export interface CityWithTourCount { id: string; name: string; slug: string; tourCount: number; }

   async function fetchCitiesWithTours(locale: 'sv' | 'en' | 'de'): Promise<CityWithTourCount[]> {
     const payload = await getPayload({ config });
     const tours = await payload.find({
       collection: 'tours',
       where: { status: { equals: 'published' } },
       locale,
       depth: 1,
       limit: 1000,
     });
     const counts = new Map<string, { id: string; name: string; slug: string; tourCount: number }>();
     for (const t of tours.docs) {
       for (const c of (t.cities ?? [])) {
         const key = String(c.id);
         const existing = counts.get(key);
         if (existing) existing.tourCount++;
         else counts.set(key, { id: key, name: String(c.name), slug: String(c.slug), tourCount: 1 });
       }
     }
     return [...counts.values()].sort((a, b) => b.tourCount - a.tourCount);
   }

   export const getCitiesWithTours = unstable_cache(
     fetchCitiesWithTours,
     ['cities-with-tours'],
     { tags: ['cities', 'tours'] },
   );
   ```
2. Edit `footer.tsx`:
   - Remove `getFeaturedTours` import + invocation.
   - Add `getCitiesWithTours(locale, 5)`. Wrap in try/catch with `[]` fallback.
   - In the "Tours" column, render city links with `href={'/tours?cities=' + slug}`.
   - Keep the bottom "View all tours" entry.
3. No new translation keys needed (heading reuses existing `tourLinks.heading`).
4. Visually verify in 3 locales — hover state, focus state, 404-safe links.
5. Confirm cache invalidation: edit a city in admin → footer updates within 1 revalidation cycle.

## Todo List

- [x] Create `get-cities-with-tours.ts` (`unstable_cache`d, tags: `cities`, `tours`)
- [x] Wire into `footer.tsx`
- [x] Confirmed `getFeaturedTours` still has other callers (homepage etc.) — helper kept, only footer import dropped
- [ ] Visual check on /sv, /en, /de (runtime — user)
- [ ] Confirm cache revalidation (runtime — user)
- [x] `npm run type-check` clean

## Success Criteria

- Footer "Tours" column shows 1-5 cities (Stockholm, Sigtuna, Uppsala based on current data).
- Each link goes to `/{locale}/tours?cities={slug}`.
- Cities ordered by tour count desc.
- "View all tours" link still present at bottom.
- Footer renders even if Payload is unreachable (fallback empty list, "View all tours" still works).

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Removing `getFeaturedTours` breaks other callers | Grep before delete; if other callers exist, keep helper |
| Long list of cities once we expand | Pass `limit` param to helper |
| Cache key collision with other helpers | Use unique key `'cities-with-tours'` |
| `t.cities` shape mismatch | Type guard with `Array.isArray` |

## Security Considerations

- No new public surface. Same permissions as existing footer fetch.

## Next Steps

→ Phase 06 verifies footer renders correctly in tests + integration.
