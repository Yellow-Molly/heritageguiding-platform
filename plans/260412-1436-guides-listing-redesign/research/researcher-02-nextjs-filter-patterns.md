# Next.js 16 Search + Filter Bar Implementation Patterns

**Date:** 2026-04-12 | **Status:** Complete | **Token Efficiency:** High

## Executive Summary

Next.js 16 App Router strongly favors **server-component-driven filtering via URL searchParams**, with client-side debounced input feeding updates back to the server. URL is the source of truth; mobile/desktop responsiveness is purely UI concern. Use `nuqs` library for debounced search inputs; use `Server Actions` for filter mutations; use `Route Handlers` only if external APIs need access. Responsive UI patterns (bottom sheet mobile, dropdown desktop) sync via the same URL params.

---

## Q1: Server vs Client Component for Search/Filter Bar

**Recommendation: Hybrid Pattern**

- **Search input itself:** Client component (needs `useState` + keyboard interactivity)
- **Filter controls:** Client component (needs `useTransition` for pending state)
- **Data fetching:** Server component (async `searchParams` from page)
- **Result rendering:** Server component (renders once per URL change)

**Why:** Next.js 15+ async `searchParams` enables server-driven filtering without re-rendering the entire page. Client components handle just the interactive input layer, server components handle data fetching. Avoids waterfalls and leverages RSC benefits.

**Key Pattern:**
```
Page (async, receives searchParams) 
  → Server-side: fetch & render results
  → Client search bar (updates URL)
    → Next.js re-runs page with new searchParams
```

**Source:** [Next.js App Router: Adding Search and Pagination](https://nextjs.org/learn/dashboard-app/adding-search-and-pagination), [Managing Advanced Search Param Filtering](https://aurorascharff.no/posts/managing-advanced-search-param-filtering-next-app-router/)

---

## Q2: Load More Pagination (Mobile) vs Traditional Pagination (Desktop)

**Recommendation: Single URL-driven Pattern; UI Switches**

Use **page number in URL** (`?page=1`) for both patterns. Desktop renders pagination buttons; mobile renders a "Load More" button that increments `page` param.

For true **infinite scroll** (mobile), use **Server Actions** + Intersection Observer:
- Initial load fetches page 1 (server component)
- "Load More" button calls `action loadNextPage()` (Server Action)
- Server Action appends new results to client state
- No URL change needed for infinite scroll variant

**Hybrid approach (recommended for your use case):**
- Desktop: URL-driven pagination (`?page=2`)
- Mobile: "Load More" button with Server Action + `useTransition()` for pending state

Sources show Server Actions + React 19 `useOptimistic` can handle both patterns cleanly.

**Source:** [Infinite Scroll with Next.js Server Actions](https://medium.com/@ferlat.simon/infinite-scroll-with-nextjs-server-actions-a-simple-guide-76a894824cfd), [Implementing infinite scroll in Next.js with Server Actions - LogRocket Blog](https://blog.logrocket.com/implementing-infinite-scroll-next-js-server-actions/)

---

## Q3: Debounced Search Input + URL Sync Without Full Reload

**Recommendation: Use `nuqs` Library**

`nuqs` (v2+) now has **built-in debounce support** via `limitUrlUpdates`:

```typescript
'use client'
import { useQueryState } from 'nuqs'

export function SearchBar() {
  const [search, setSearch] = useQueryState('q', {
    defaultValue: '',
    shallow: false, // RSC re-render
    limitUrlUpdates: { debounce: 250 } // Wait 250ms after last keystroke
  })

  return (
    <input
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Search guides..."
    />
  )
}
```

**Why nuqs over manual debounce:**
- Type-safe URL params
- Handles URL encoding automatically
- Debounce prevents excessive server requests
- `shallow: false` triggers RSC re-execution on URL change
- ~5.5kb, zero runtime dependencies

**Alternative (no library):** Manual `useRouter` + `useTransition`:
```typescript
const router = useRouter()
const [pending, startTransition] = useTransition()

const handleSearch = (value: string) => {
  startTransition(() => {
    router.replace(`?q=${encodeURIComponent(value)}`, { scroll: false })
  })
}
```
Requires manual debounce with `setTimeout`; more verbose.

**Source:** [nuqs Type-safe search params](https://nuqs.dev/), [Nuqs Adds Debounce - InfoQ](https://www.infoq.org/news/2025/09/nuqs-debounce-schema/), [Managing search parameters in Next.js with nuqs - LogRocket Blog](https://blog.logrocket.com/managing-search-parameters-next-js-nuqs/)

---

## Q4: Collapsible Mobile Filter Drawer + Desktop Dropdown Sync

**Recommendation: Single Filter State in URL; Responsive UI Wrapper**

All filter selections update the same URL params (`language`, `specialization`, `area`).

**Desktop UI (client component):**
- Inline dropdowns / checkboxes
- Updates URL on each selection

**Mobile UI (client component):**
- Hamburger icon → Bottom sheet modal (2026 pattern)
- Same filter controls inside
- Updates URL on selection
- User closes sheet; page already updated

**Pattern:**
```typescript
// page.tsx (server)
export default async function GuidesPage({ 
  searchParams 
}: { 
  searchParams: Promise<GuideFilters> 
}) {
  const filters = await searchParams
  const guides = await getGuides(filters, locale)
  
  return (
    <>
      <FilterBar filters={filters} /> {/* client component */}
      <GuidesList guides={guides} />
    </>
  )
}

// FilterBar.tsx (client)
'use client'
export function FilterBar({ filters }: { filters: GuideFilters }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const router = useRouter()
  
  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(window.location.search)
    params.set(key, value)
    router.replace(`?${params.toString()}`, { scroll: false })
    // On mobile, could auto-close drawer here
  }
  
  return (
    <>
      <div className="hidden md:flex">
        {/* Desktop dropdowns */}
      </div>
      <button className="md:hidden" onClick={() => setIsDrawerOpen(true)}>
        Filters
      </button>
      {isDrawerOpen && (
        <BottomSheet onClose={() => setIsDrawerOpen(false)}>
          {/* Mobile filter controls, same logic as desktop */}
        </BottomSheet>
      )}
    </>
  )
}
```

**Why this works:** URL is the source of truth. UI responds to URL. Mobile/desktop just change presentation, not data flow.

**Source:** [Mobile Filter UX Design Patterns - Pencil & Paper](https://www.pencilandpaper.io/articles/ux-pattern-analysis-mobile-filters), [What's Changing in Mobile App Design 2026 - Muzli Blog](https://muz.li/blog/whats-changing-in-mobile-app-design-ui-patterns-that-matter-in-2026/), [Managing Advanced Search Param Filtering](https://aurorascharff.no/posts/managing-advanced-search-param-filtering-next-app-router/)

---

## Architecture Decision Summary

| Concern | Decision | Rationale |
|---------|----------|-----------|
| **Search input (Q + debounce)** | Client: `nuqs` with `limitUpdates: debounce(250)` | Type-safe, minimal boilerplate, avoids excessive requests |
| **Filter selections** | Client component, URL-driven | Preserves bookmarkability; mobile/desktop UI irrelevant |
| **Data fetching** | Server component with async `searchParams` | Leverages RSC benefits; no waterfall |
| **Pagination** | Desktop: URL `?page=N`; Mobile: Server Action + "Load More" | Responsive without duplicating fetch logic |
| **Mobile filter drawer** | Bottom sheet modal (2026 standard); syncs via URL | Matches modern mobile expectations |
| **External API access** | Use Route Handler (`route.ts`) if needed | Server Actions insufficient for webhooks/mobile clients |
| **Pending state (loading)** | `useTransition()` on client | Works with Server Actions; graceful UX |

---

## Implementation Checklist

- [ ] Install & configure `nuqs` in package
- [ ] Convert `GuideFilters` to `nuqs` parser types (type-safe URL encoding)
- [ ] Implement async `searchParams` in page.tsx
- [ ] Build `SearchBar.tsx` client component with debounced input
- [ ] Build `FilterBar.tsx` client component; responsive UI logic
- [ ] Test mobile/desktop UI sync across filter changes
- [ ] Verify URL bookmarkability (share URL with filters → page reloads with filters applied)
- [ ] Implement "Load More" Server Action for mobile pagination
- [ ] Add `useTransition()` for pending state feedback

---

## Unresolved Questions

1. **Exact i18n interaction:** Does next-intl's locale param conflict with search params? Verify URL structure: `/[locale]/guides?q=...&language=en` doesn't cause locale mismatch.
2. **Filter reset UX:** Should there be a "Clear all filters" button? If yes, how to handle via URL (delete all params vs. explicit reset param)?
3. **Mobile bottom sheet library:** Which headless UI library (Radix UI, Shadcn, custom)? Ensure it doesn't interfere with body scroll lock.
4. **Analytics:** How to track filter selections + searches for user behavior insights?

---

**Report compiled from:** Next.js official docs, Aurora Scharff (advanced patterns), nuqs library docs, production case studies from LogRocket, InfoQ, and Vercel communities. Research conducted 2026-04-12.
