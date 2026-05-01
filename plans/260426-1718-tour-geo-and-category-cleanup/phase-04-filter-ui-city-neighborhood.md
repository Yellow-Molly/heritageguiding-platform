# Phase 04 — City + Neighborhood Filter UI

## Context Links

- `apps/web/components/tour/sidebar/sidebar-filters.tsx`
- `apps/web/components/tour/sidebar/filter-checkbox-group.tsx`
- `apps/web/components/tour/filter-drawer.tsx` + `filter-drawer-sections.tsx` (mobile)
- `apps/web/lib/api/get-tours.ts`
- `apps/web/lib/api/get-categories.ts`
- `apps/web/lib/validation/tour-filters.ts`
- `apps/web/app/(site)/[locale]/(frontend)/tours/page.tsx`
- `apps/web/app/(site)/[locale]/(frontend)/tours/tour-catalog-client.tsx`
- `messages/{sv,en,de}.json` (i18n keys)

## Overview

- **Priority:** P1 (depends on Phase 01 schema; can start before Phase 03 with mock data)
- **Status:** pending
- **Effort:** 2.5h
- **Description:** Add City and Neighborhood filter sections to the desktop sidebar and mobile drawer. Backend supports `?cities=` and `?neighborhoods=` URL params. Neighborhood options scoped to selected cities.

## Key Insights

- Existing filter pattern (`SidebarFilters`) reads/writes URL search params via `useSearchParams + router.push`. Reuse this exact pattern — no new state library.
- `FilterCheckboxGroup` already supports multi-select. Reuse with `multiSelect` semantics for both new filters.
- Neighborhoods scoped: when no city selected → show all neighborhoods grouped by city header; when city selected → show only that city's neighborhoods. Keeps the panel manageable as the catalog grows.
- Server fetch in `tours/page.tsx` is already a `Promise.all` — extend it to include `getCities()` and `getNeighborhoods()`.
- URL state: order params alphabetically when serializing to keep shareable links stable.
- `page` param reset on any filter change (already handled by `updateParams`).

## Requirements

### Functional
- Sidebar order (desktop top-to-bottom): **City** → **Neighborhood** → Categories → Duration → Accessibility.
- Both new filters multi-select; "All cities" / "All neighborhoods" pseudo-option clears that filter.
- Mobile drawer mirrors the same order.
- URL params:
  - `cities=stockholm,sigtuna`
  - `neighborhoods=gamla-stan,djurgarden`
- Backend: `getTours({ cities, neighborhoods, ... })` adds:
  ```ts
  if (filters.cities) where['cities.slug'] = { in: slugs };
  if (filters.neighborhoods) where['neighborhoods.slug'] = { in: slugs };
  ```
- Search box (existing `q` param) unchanged but should also filter results within selected geo scope.
- Empty state: if filter combination returns 0 tours, show existing `<TourEmptyState />` with a "Clear filters" CTA.

### Non-Functional
- No layout shift on first render — server pre-renders with filters applied.
- WCAG 2.1 AA: filter group headings, ARIA labels on checkboxes (already present in `FilterCheckboxGroup`).
- i18n keys added to all 3 locales (`tours.filters.city`, `tours.filters.neighborhood`, `tours.filters.allCities`, `tours.filters.allNeighborhoods`).

## Architecture

```
tours/page.tsx (RSC)
  └── Promise.all([
        getCategories('theme', locale),
        getCities(locale),                      // NEW
        getNeighborhoods(locale),               // NEW (with city ref)
        getTours(filters, locale),
      ])
      └── <TourCatalogClient categories={...} cities={...} neighborhoods={...}>
          └── <SidebarFilters>                  // extended
              ├── <CityFilterSection>           // NEW
              ├── <NeighborhoodFilterSection>   // NEW (scoped by selected cities)
              ├── <CategoryFilterSection>       // existing
              ├── <DurationFilterSection>       // existing
              └── <AccessibilityFilterSection>  // existing
```

## Related Code Files

**Modify**
- `apps/web/lib/api/get-tours.ts` — extend `TourFilters`, `buildWhereClause`, validation params
- `apps/web/lib/validation/tour-filters.ts` — add `cities`, `neighborhoods` to schema
- `apps/web/components/tour/sidebar/sidebar-filters.tsx` — add 2 new sections, take cities/neighborhoods props
- `apps/web/components/tour/filter-drawer.tsx` + `filter-drawer-sections.tsx` — mirror mobile UX
- `apps/web/app/(site)/[locale]/(frontend)/tours/page.tsx` — fetch cities + neighborhoods
- `apps/web/app/(site)/[locale]/(frontend)/tours/tour-catalog-client.tsx` — pass new props down
- `messages/sv.json`, `messages/en.json`, `messages/de.json` — new keys
- `apps/web/lib/api/get-categories.ts` — deprecate `getCategories('neighborhood', ...)` if unused now (or repurpose)

**Create**
- `apps/web/lib/api/get-cities.ts` — `unstable_cache`d list of all cities, localized
- `apps/web/lib/api/get-neighborhoods.ts` — `unstable_cache`d list of neighborhoods, includes parent city slug for scoping
- `apps/web/components/tour/sidebar/city-filter-section.tsx` (optional split)
- `apps/web/components/tour/sidebar/neighborhood-filter-section.tsx` (optional split)

## Implementation Steps

1. Create `getCities(locale)`:
   ```ts
   export const getCities = unstable_cache(fetchCities, ['cities'], { tags: ['cities'] });
   ```
   Returns `{ id, name, slug }[]` sorted by `name`.
2. Create `getNeighborhoods(locale)`:
   ```ts
   { id, name, slug, citySlug }[]
   ```
3. Add `'cities'` cache tag to `Cities.hooks.afterChange/afterDelete` (already in Phase 01) and `'neighborhoods'`/related on `Neighborhoods.hooks` if not present.
4. Extend `tour-filters.ts` Zod schema:
   ```ts
   cities: z.string().optional().refine(slugListValid),
   neighborhoods: z.string().optional().refine(slugListValid),
   ```
   Reuse the same `/^[a-z0-9-]+$/` slug validator already used for `categories`.
5. Extend `buildWhereClause` in `get-tours.ts`:
   ```ts
   if (filters.cities) {
     const slugs = filters.cities.split(',').filter(Boolean);
     if (slugs.length) where['cities.slug'] = { in: slugs };
   }
   if (filters.neighborhoods) {
     const slugs = filters.neighborhoods.split(',').filter(Boolean);
     if (slugs.length) where['neighborhoods.slug'] = { in: slugs };
   }
   ```
6. Update `tours/page.tsx` to fetch cities + neighborhoods alongside categories. Pass to client.
7. Update `tour-catalog-client.tsx` props interface and pass through.
8. Extend `SidebarFilters`:
   - Add `cities`, `neighborhoods` props.
   - Parse `selectedCities` and `selectedNeighborhoods` from `searchParams`.
   - Add toggle handlers reusing the existing `updateParams` pattern.
   - Filter neighborhood options: if cities selected, show only those whose `citySlug ∈ selectedCities`.
9. Mirror in mobile drawer (`filter-drawer.tsx` / `filter-drawer-sections.tsx`).
10. Add i18n keys to all 3 locale files. SV, EN, DE strings:
    - `city`, `neighborhood`, `allCities`, `allNeighborhoods`
11. Update `<TourEmptyState />` to accept a `clearFiltersHref` and render a CTA — only if not already supported.
12. Manual smoke test on /sv/tours, /en/tours, /de/tours with combinations:
    - Single city
    - Multi-city
    - City + neighborhood
    - Neighborhood without city
    - All filters off (page=1)
    - Filters + search query

## Todo List

- [x] `getCities(locale)` API helper (`apps/web/lib/api/get-cities.ts`)
- [x] `getNeighborhoods(locale)` API helper (`apps/web/lib/api/get-neighborhoods.ts`)
- [x] Extend Zod schema with `cities`, `neighborhoods` (shared `slugListValid` refiner)
- [x] Extend `buildWhereClause` for `cities.slug` + `neighborhoods.slug`
- [x] Update `tours/page.tsx` Promise.all to fetch cities + neighborhoods
- [x] Update `tour-catalog-client.tsx` props
- [x] Extend `SidebarFilters` with 2 new sections (City + Neighborhood, scoped)
- [x] Mirror in mobile drawer (extracted reusable `DrawerSlugListSection`)
- [x] Add i18n keys (SV/EN/DE: `city`, `neighborhood`, `allCities`, `allNeighborhoods`, `clearCities`, `clearNeighborhoods`)
- [ ] Smoke test all filter combos in 3 locales (runtime — user)
- [x] `npm run type-check` clean (no new errors); `npm run lint` clean for Phase 04 files

## Success Criteria

- Selecting "Stockholm" returns all Stockholm tours; "Sigtuna" returns the Sigtuna heritage tour.
- Selecting "Stockholm" + "Gamla Stan" returns only tours that visit Gamla Stan in Stockholm.
- URL is bookmarkable / shareable with active filters.
- Mobile drawer renders identical filter sections.
- All 3 locales render correct labels.
- No layout regression on existing filters.

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Neighborhood list grows long → poor UX | Group by city; collapsed by default after 8 items (use existing `FilterCheckboxGroup` extension or a `Show all` toggle) |
| Payload `where['cities.slug']` doesn't traverse hasMany | Confirmed by reading existing `categories.slug` clause which already does this |
| Stale cache on city add/edit | Cities revalidate `tours` tag (Phase 01); also add `cities` tag to keep filter list fresh |
| Locale leakage (showing slugs untranslated) | Always fetch with `locale` param; render `name`, never `slug` |

## Security Considerations

- Slug validation regex already in place; same applied to new params.
- No SSRF or injection risk — all queries via Payload's typed `where` builder.

## Next Steps

→ Phase 06 covers tests for the new filter logic and integration assertions.
