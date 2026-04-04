# Sidebar Filter Patterns Research

## Key Findings

**Checkbox & Range Patterns**
Checkboxes are the primary pattern for multi-select filters (categories, accessibility). Range sliders work best for price/duration with text input fallbacks for precise control. Show 5–6 options + "Show more" button to avoid clutter.

**Active Filter Visibility**
80% of users forget applied filters. Display active filters in 2 places: in filter panel + centralized header overview. Critical for UX clarity.

**Mobile Responsiveness**
Desktop: Persistent sidebar. Mobile ≤768px: Drawer (left slide) or bottom sheet (persistent filters on map-heavy apps). Use Dialog above breakpoint, not forcing mobile patterns on desktop.

**URL State Management (Next.js 16)**
Use `useSearchParams()` hook + URL as single source of truth. Libraries like `nuqs` provide type-safe, useState-like API for query params with debouncing support. Validate & parse params server-side using schema (Zod/Valibot).

**Performance: Server vs Client**
- **SSR+streaming**: Fetch initial filtered results server-side, send partial HTML. Users see results fast.
- **Client-side filters**: Only viable if dataset <1000 tours; tour inventory likely exceeds this.
- **Hybrid**: SSR page shell + URL-driven server re-fetch per filter change. Use Next.js `unstable_cache` for filtering results.

## Recommended Approach

1. **Sidebar UX**: Collapsible sections (Categories, Duration, Price, Accessibility). Show 6 options per section + expand. Display active filter count on panel header.

2. **Mobile Pattern**: Drawer (left-sliding) for tablets/phones; keep sidebar persistent on desktop. Use Tailwind breakpoints (md: 768px).

3. **URL State**: Adopt `nuqs` for type-safe param management. Schema: `?categories=heritage,architecture&duration=2-3&priceMin=50&priceMax=200&accessibility=wheelchair`. Serialize to comma-separated values.

4. **Server Filtering**: On filter change, update URL params (client), which triggers server re-fetch via RSC re-render. Fetch filtered tours server-side with `unstable_cache` for repeated queries.

5. **Accessibility**: Use semantic `<fieldset>` + `<legend>` for checkboxes, `<input type="range">` with ARIA labels, visible focus states.

## Implementation Notes

- **State Sync**: No useState for filter state; drive from URL params only. Avoids sync bugs.
- **Debounce**: Slider changes debounce 500ms before URL update (prevents 10 server requests).
- **Clear Filters**: Single button clears URL, resets to defaults.
- **Responsive Drawer**: Use shadcn/ui Drawer (mobile) + Sidebar component (desktop). Media query in parent layout.
- **Cache**: Set `cacheLife: 300` on filtered query to avoid redundant DB calls.

**Adoption Risk**: nuqs adds ~3kb; well-maintained (Vercel adjacent). Drawer pattern native Tailwind—no external deps needed beyond shadcn/ui.

---
**Sources:**
- [19+ Filter UI Examples for SaaS: Design Patterns & Best Practices](https://www.eleken.co/blog-posts/filter-ux-and-ui-for-saas)
- [15 Filter UI Patterns That Actually Work in 2025](https://bricxlabs.com/blogs/universal-search-and-filters-ui)
- [Mastering State in Next.js App Router with URL Query Parameters](https://medium.com/@roman_j/mastering-state-in-next-js-app-router-with-url-query-parameters-a-practical-guide-03939921d09c)
- [Why You Should Use nuqs: Smarter URL State Management](https://medium.com/@ruverd/why-you-should-use-nuqs-for-react-next-js)
- [Bottom Sheets: Definition and UX Guidelines](https://www.nngroup.com/articles/bottom-sheet/)
- [Filtering and Search, Client-Side vs. Server-Side](https://medium.com/@eminasian/filtering-and-search-client-side-vs-server-side-a9084bbcbf74)
