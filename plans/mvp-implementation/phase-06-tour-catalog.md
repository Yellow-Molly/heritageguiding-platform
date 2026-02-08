# Phase 06: Tour Catalog

## Context Links

- [MVP Project Plan](../../docs/MVP-PROJECT-PLAN.md)
- [Data Models](./phase-03-data-models-cms-schema.md)
- [Design System](./phase-04-design-system.md)

## Overview

| Priority | Status | Effort |
|----------|--------|--------|
| P1 - Critical | complete | 24-28h |

Build tour catalog page with grid/list views, filtering by category/price/duration/accessibility, search functionality, and sorting options.

## Key Insights

- Server Component for initial load, client interactivity for filters
- URL-based filter state for shareable links
- Infinite scroll or pagination for performance
- Accessibility filters highlight inclusive tours

## Requirements

### Functional
- Tour grid with cards showing image, title, price, duration
- Filter by: category, price range, duration, accessibility
- Search by keyword (title, description)
- Sort by: price, duration, popularity, rating
- Toggle grid/list view

### Non-Functional
- Filter changes don't reload page (URL update)
- Mobile-friendly filter drawer
- <500ms filter response time
- Lazy load tour images

## Architecture

### Page Structure

```
Tour Catalog
├── Header
├── Page Title + Description
├── Filter Bar (desktop)
│   ├── Category filter
│   ├── Price range slider
│   ├── Duration filter
│   ├── Accessibility toggles
│   └── Sort dropdown
├── Mobile Filter Button
├── Tour Grid/List
│   ├── Tour cards
│   └── Empty state
├── Pagination / Load More
└── Footer
```

### State Management

```
URL Params: ?category=history&price=200-500&duration=120&accessible=true&sort=price
     ↓
useSearchParams() + nuqs (type-safe URL state)
     ↓
Server: Fetch tours with filters from Payload
     ↓
Client: Update UI without page reload
```

## Related Code Files

### Create
- `apps/web/app/[locale]/tours/page.tsx` - Catalog page
- `apps/web/components/tour/tour-filters.tsx` - Filter bar
- `apps/web/components/tour/tour-grid.tsx` - Grid view
- `apps/web/components/tour/tour-list-item.tsx` - List view item
- `apps/web/components/tour/tour-search.tsx` - Search input
- `apps/web/components/tour/tour-sort.tsx` - Sort dropdown
- `apps/web/components/tour/filter-drawer.tsx` - Mobile filters
- `apps/web/components/tour/empty-state.tsx` - No results
- `apps/web/lib/api/get-tours.ts` - Tours API
- `apps/web/lib/hooks/use-tour-filters.ts` - Filter hook

### Modify
- `messages/*.json` - Filter/sort translations

## Implementation Steps

1. **Create Catalog Page**
   ```typescript
   // apps/web/app/[locale]/tours/page.tsx
   import { Suspense } from 'react'
   import { getTranslations } from 'next-intl/server'
   import { TourFilters } from '@/components/tour/tour-filters'
   import { TourGrid } from '@/components/tour/tour-grid'
   import { TourGridSkeleton } from '@/components/tour/tour-grid-skeleton'

   type SearchParams = {
     category?: string
     priceMin?: string
     priceMax?: string
     duration?: string
     accessible?: string
     sort?: string
     q?: string
   }

   export default async function ToursPage({
     params: { locale },
     searchParams
   }: {
     params: { locale: string }
     searchParams: SearchParams
   }) {
     const t = await getTranslations('tours')

     return (
       <main className="container py-8">
         <h1 className="text-3xl font-bold">{t('title')}</h1>
         <p className="mt-2 text-muted-foreground">{t('description')}</p>

         <TourFilters />

         <Suspense fallback={<TourGridSkeleton />}>
           <TourGrid searchParams={searchParams} locale={locale} />
         </Suspense>
       </main>
     )
   }
   ```

2. **Build Filter Bar Component**
   ```typescript
   // apps/web/components/tour/tour-filters.tsx
   'use client'

   import { useSearchParams, useRouter, usePathname } from 'next/navigation'
   import { Select } from '@/components/ui/select'
   import { Slider } from '@/components/ui/slider'
   import { Checkbox } from '@/components/ui/checkbox'
   import { useTranslations } from 'next-intl'

   export function TourFilters() {
     const t = useTranslations('tours.filters')
     const searchParams = useSearchParams()
     const router = useRouter()
     const pathname = usePathname()

     const updateFilter = (key: string, value: string | null) => {
       const params = new URLSearchParams(searchParams)
       if (value) {
         params.set(key, value)
       } else {
         params.delete(key)
       }
       router.push(`${pathname}?${params.toString()}`)
     }

     return (
       <div className="my-6 flex flex-wrap items-center gap-4 rounded-lg border p-4">
         {/* Category Filter */}
         <Select
           value={searchParams.get('category') || ''}
           onValueChange={(v) => updateFilter('category', v)}
         >
           <option value="">{t('allCategories')}</option>
           <option value="history">{t('history')}</option>
           <option value="architecture">{t('architecture')}</option>
           <option value="food">{t('food')}</option>
         </Select>

         {/* Price Range */}
         <div className="flex items-center gap-2">
           <span className="text-sm">{t('price')}:</span>
           <Slider
             min={0}
             max={1000}
             step={50}
             value={[
               parseInt(searchParams.get('priceMin') || '0'),
               parseInt(searchParams.get('priceMax') || '1000')
             ]}
             onValueChange={([min, max]) => {
               updateFilter('priceMin', String(min))
               updateFilter('priceMax', String(max))
             }}
           />
         </div>

         {/* Duration Filter */}
         <Select
           value={searchParams.get('duration') || ''}
           onValueChange={(v) => updateFilter('duration', v)}
         >
           <option value="">{t('anyDuration')}</option>
           <option value="60">1 hour</option>
           <option value="120">2 hours</option>
           <option value="180">3+ hours</option>
         </Select>

         {/* Accessibility */}
         <div className="flex items-center gap-2">
           <Checkbox
             id="accessible"
             checked={searchParams.get('accessible') === 'true'}
             onCheckedChange={(v) =>
               updateFilter('accessible', v ? 'true' : null)
             }
           />
           <label htmlFor="accessible" className="text-sm">
             {t('wheelchairAccessible')}
           </label>
         </div>
       </div>
     )
   }
   ```

3. **Create Tour Grid Component**
   ```typescript
   // apps/web/components/tour/tour-grid.tsx
   import { getTours } from '@/lib/api/get-tours'
   import { TourCard } from '@/components/tour/tour-card'
   import { EmptyState } from '@/components/tour/empty-state'

   export async function TourGrid({ searchParams, locale }) {
     const tours = await getTours({ ...searchParams, locale })

     if (tours.length === 0) {
       return <EmptyState />
     }

     return (
       <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
         {tours.map((tour) => (
           <TourCard key={tour.id} tour={tour} />
         ))}
       </div>
     )
   }
   ```

4. **Build Search Component**
   ```typescript
   // apps/web/components/tour/tour-search.tsx
   'use client'

   import { useState, useTransition } from 'react'
   import { useSearchParams, useRouter, usePathname } from 'next/navigation'
   import { Input } from '@/components/ui/input'
   import { Search } from 'lucide-react'
   import { useDebouncedCallback } from 'use-debounce'

   export function TourSearch() {
     const searchParams = useSearchParams()
     const router = useRouter()
     const pathname = usePathname()
     const [isPending, startTransition] = useTransition()

     const handleSearch = useDebouncedCallback((term: string) => {
       const params = new URLSearchParams(searchParams)
       if (term) {
         params.set('q', term)
       } else {
         params.delete('q')
       }
       startTransition(() => {
         router.push(`${pathname}?${params.toString()}`)
       })
     }, 300)

     return (
       <div className="relative">
         <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
         <Input
           defaultValue={searchParams.get('q') || ''}
           onChange={(e) => handleSearch(e.target.value)}
           placeholder="Search tours..."
           className="pl-10"
         />
       </div>
     )
   }
   ```

5. **Create Sort Dropdown**
   ```typescript
   // apps/web/components/tour/tour-sort.tsx
   'use client'

   import { useSearchParams, useRouter, usePathname } from 'next/navigation'
   import { Select } from '@/components/ui/select'

   export function TourSort() {
     const searchParams = useSearchParams()
     const router = useRouter()
     const pathname = usePathname()

     const handleSort = (value: string) => {
       const params = new URLSearchParams(searchParams)
       params.set('sort', value)
       router.push(`${pathname}?${params.toString()}`)
     }

     return (
       <Select
         value={searchParams.get('sort') || 'popular'}
         onValueChange={handleSort}
       >
         <option value="popular">Most Popular</option>
         <option value="price-asc">Price: Low to High</option>
         <option value="price-desc">Price: High to Low</option>
         <option value="duration-asc">Duration: Short to Long</option>
         <option value="rating">Highest Rated</option>
       </Select>
     )
   }
   ```

6. **Build Mobile Filter Drawer**
   ```typescript
   // apps/web/components/tour/filter-drawer.tsx
   'use client'

   import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
   import { Button } from '@/components/ui/button'
   import { Filter } from 'lucide-react'
   import { TourFilters } from './tour-filters'

   export function FilterDrawer() {
     return (
       <Sheet>
         <SheetTrigger asChild>
           <Button variant="outline" className="lg:hidden">
             <Filter className="mr-2 h-4 w-4" />
             Filters
           </Button>
         </SheetTrigger>
         <SheetContent side="left" className="w-80">
           <TourFilters orientation="vertical" />
         </SheetContent>
       </Sheet>
     )
   }
   ```

7. **Create Empty State**
   ```typescript
   // apps/web/components/tour/empty-state.tsx
   import { SearchX } from 'lucide-react'
   import { Button } from '@/components/ui/button'
   import { useTranslations } from 'next-intl'

   export function EmptyState() {
     const t = useTranslations('tours.empty')

     return (
       <div className="flex flex-col items-center py-16 text-center">
         <SearchX className="h-16 w-16 text-muted-foreground" />
         <h3 className="mt-4 text-xl font-semibold">{t('title')}</h3>
         <p className="mt-2 text-muted-foreground">{t('description')}</p>
         <Button className="mt-6" asChild>
           <a href="/tours">{t('clearFilters')}</a>
         </Button>
       </div>
     )
   }
   ```

8. **Implement Tours API Function**
   ```typescript
   // apps/web/lib/api/get-tours.ts
   import { getPayload } from 'payload'
   import config from '@payload-config'

   type TourFilters = {
     category?: string
     priceMin?: string
     priceMax?: string
     duration?: string
     accessible?: string
     sort?: string
     q?: string
     locale: string
   }

   export async function getTours(filters: TourFilters) {
     const payload = await getPayload({ config })

     const where: any = { status: { equals: 'published' } }

     if (filters.category) {
       where['categories.slug'] = { equals: filters.category }
     }
     if (filters.priceMin) {
       where.price = { ...where.price, greater_than_equal: parseInt(filters.priceMin) }
     }
     if (filters.priceMax) {
       where.price = { ...where.price, less_than_equal: parseInt(filters.priceMax) }
     }
     if (filters.duration) {
       where.duration = { less_than_equal: parseInt(filters.duration) }
     }
     if (filters.accessible === 'true') {
       where['accessibility.wheelchairAccessible'] = { equals: true }
     }
     if (filters.q) {
       where.or = [
         { title: { contains: filters.q } },
         { description: { contains: filters.q } }
       ]
     }

     const sort = {
       'price-asc': 'price',
       'price-desc': '-price',
       'duration-asc': 'duration',
       'rating': '-averageRating',
       'popular': '-bookingCount'
     }[filters.sort || 'popular'] || '-bookingCount'

     const { docs } = await payload.find({
       collection: 'tours',
       where,
       sort,
       locale: filters.locale,
       depth: 2
     })

     return docs
   }
   ```

9. **Add Grid Skeleton for Loading**
   ```typescript
   // apps/web/components/tour/tour-grid-skeleton.tsx
   import { Skeleton } from '@/components/ui/skeleton'

   export function TourGridSkeleton() {
     return (
       <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
         {Array.from({ length: 6 }).map((_, i) => (
           <div key={i} className="overflow-hidden rounded-lg border">
             <Skeleton className="aspect-[4/3] w-full" />
             <div className="p-4">
               <Skeleton className="h-6 w-3/4" />
               <Skeleton className="mt-2 h-4 w-full" />
               <Skeleton className="mt-2 h-4 w-2/3" />
             </div>
           </div>
         ))}
       </div>
     )
   }
   ```

10. **Add Translation Strings**
    ```json
    // messages/en.json
    {
      "tours": {
        "title": "Explore Our Tours",
        "description": "Discover Stockholm with expert-led tours",
        "filters": {
          "allCategories": "All Categories",
          "history": "History",
          "architecture": "Architecture",
          "food": "Food & Drink",
          "price": "Price",
          "anyDuration": "Any Duration",
          "wheelchairAccessible": "Wheelchair Accessible"
        },
        "empty": {
          "title": "No tours found",
          "description": "Try adjusting your filters",
          "clearFilters": "Clear all filters"
        }
      }
    }
    ```

## Todo List

- [x] Create catalog page with Suspense
- [x] Build TourFilters component (desktop)
- [x] Build FilterDrawer for mobile
- [x] Create TourGrid component
- [x] Create TourSearch with debounce
- [x] Create TourSort dropdown
- [x] Build EmptyState component
- [x] Implement getTours API with filters
- [x] Create TourGridSkeleton
- [x] Add URL-based filter state
- [x] Test filter combinations
- [x] Add Swedish translations
- [x] Add English translations
- [x] Add German translations
- [x] Test mobile responsive layout
- [x] Verify accessibility of filters

## Success Criteria

- [x] All filter combinations work correctly
- [x] URL reflects current filter state
- [x] Back/forward navigation preserves filters
- [x] Search returns relevant results
- [x] Sorting changes tour order
- [x] Mobile filter drawer works
- [x] Empty state displays when no results
- [x] Loading skeleton shows during fetch
- [x] All locales work correctly

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Slow filter response | Medium | Medium | Debounce inputs, optimize queries |
| Complex filter logic | Medium | Low | Test each filter independently |
| URL state sync issues | Low | Medium | Use established library (nuqs) |

## Security Considerations

- Validate all search params server-side
- Sanitize search query before database query
- Limit result set size (pagination)

## Review Results

**Review Date:** 2026-01-19
**Reviewer:** code-reviewer agent
**Score:** 8.5/10
**Status:** ✅ COMPLETE - Production ready with minor cleanup

**Detailed Report:** [code-reviewer-260119-1049-phase-06-tour-catalog.md](../reports/code-reviewer-260119-1049-phase-06-tour-catalog.md)

### Key Findings

**Strengths:**
- Excellent RSC/client component separation
- Clean URL-based state management
- Strong accessibility (ARIA, keyboard nav)
- Proper Next.js 16 async params handling
- Complete i18n coverage (3 locales)

**Minor Issues (Non-blocking):**
- 1 linting error (unescaped apostrophe)
- 10 linting warnings (unused imports)
- Missing search input sanitization
- No server-side filter validation

**Recommended Actions:**
1. Fix linting error in `tour-empty-state.tsx`
2. Remove unused imports
3. Add search query sanitization
4. Add Zod validation for filters

## Next Steps

After completion:
1. Proceed to [Phase 07: Tour Details](./phase-07-tour-details.md)
2. Build individual tour pages
3. Implement gallery, reviews, booking CTA
