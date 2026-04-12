# UI Component Patterns for Guides Listing Redesign

**Research Date:** 2026-04-12 | **Scope:** Grid layouts, filter UX, pagination, accessibility for portrait galleries

## 1. Responsive Grid Layout

**Recommendation:** Use CSS Grid with `auto-fit` + `minmax()` for flexible portrait gallery.

- **Desktop (3-column):** `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))`
- **Tablet (2-column):** Auto-adjusts via container width
- **Mobile (1-column):** Auto-stacks to single column via grid width constraints
- **Method:** CSS Grid superior to Flexbox for 2D alignment of portrait cards with centered images and text

**Source credibility:** MDN (CSS standards reference) + industry 2025 consensus from multiple sources recommend CSS Grid over Flexbox for gallery layouts.

## 2. Portrait Image Container

**Recommendation:** Use CSS `aspect-ratio: 1` + `border-radius: 50%` with explicit alt text.

```css
.portrait {
  aspect-ratio: 1 / 1;
  border-radius: 50%;
  object-fit: cover;
  width: 140px;
  height: 140px;
}
```

**Accessibility:**
- If portrait is **informative** (clickable → guide detail): Use descriptive alt text (`alt="Sarah Chen, Heritage Historian"`)
- If portrait is **decorative** (display only): Use empty alt (`alt=""`) per WCAG 2.1
- **Min tap target:** Ensure card itself is ≥44×44px (W3C guideline) for mobile touch
- **Container Queries:** Use `@container` to scale portrait size responsively without media queries

## 3. Filter Bar Pattern

**Recommendation:** Horizontal filter bar (desktop) + Collapsible filter drawer (mobile).

**Desktop behavior:**
- Search input + Language dropdown + Specialization dropdown + Area dropdown in one row
- Applied filters show as removable tags above results
- "Clear all" link visible when filters active
- Real-time result count update (`{N} guides found`)

**Mobile behavior:**
- Search input full-width
- "Filters" button opens collapsible panel (drawer/modal style)
- Filter state persists in URL query params for bookmarkability

**Pattern credibility:** Algolia & LogRocket (2025) confirm horizontal filter bar + collapsible mobile drawer as industry standard for discovery-driven interfaces. Real-time feedback critical for UX.

## 4. Load More vs. Pagination

**Recommendation:** "Load More" button (mobile-friendly) with optional pagination links.

- **Mobile-first:** "Load More" button inherently touch-friendly; avoids tiny pagination links
- **Desktop option:** Add numbered pagination links for users who want structured navigation
- **Hybrid approach (best for this use case):**
  - Default: Show 12 guides + "Load More" button
  - Desktop: Add pagination links (Page 1, 2, 3...)
  - Mobile: "Load More" only (cleaner UX)
- **Performance:** Use windowing/virtualization if 100+ guides loaded to prevent DOM bloat

**Trade-off:** "Load More" increases engagement (Smashing Magazine finding) but pagination gives users control and bookmarkability. Hybrid covers both.

## 5. Card Component Structure

**Recommendation:** Semantic card wrapper with flex column layout.

```
<article class="guide-card">
  <figure class="guide-portrait">
    <img alt="[name, title]" src="...">
  </figure>
  <h3 class="guide-name">{name}</h3>
  <div class="specializations">{badge}, {badge}</div>
  <blockquote class="guide-bio">{excerpt}</blockquote>
  <div class="guide-languages">{icon} {lang list}</div>
  <div class="guide-locations">{icon} {area list}</div>
  <div class="guide-stats">{tours} tours · {exp} exp</div>
  <div class="guide-credentials">{badges}</div>
</article>
```

**Accessibility:**
- Use `<article>` for semantic card container
- Use `<figure>` for portrait + context
- Use `<blockquote>` for bio quote styling
- Headings use h3 (proper hierarchy if h1/h2 used for page title/hero)
- Icon + text pairs: include visible text labels, don't rely on icons alone

## 6. Typography & Visual Hierarchy

**Findings:**
- Serif fonts (headline): Guide name in serif aligns with heritage/premium positioning
- Sans-serif (body): Bio and details in sans-serif for readability
- Color accent line for stats: Use gold/accent color for `{tours} tours · {experience}` line (visual weight)
- Font sizing: Ensure ≥16px body text on mobile (WCAG AA standard)

## 7. Mobile-First Breakpoints

**Recommended breakpoints:**
- **Mobile:** 320px–767px (single-column cards, collapsible filters)
- **Tablet:** 768px–1023px (2-column grid auto-adjust)
- **Desktop:** 1024px+ (3-column grid stable)

Use mobile-first CSS with `min-width` media queries per 2025 industry standard.

## 8. Filter State Management

**Pattern:** URL-driven filter state (preserves links, enables sharing).

```
/guides?lang=en&specialization=history&area=westminster
```

- Filters sync to URL on change → shareable/bookmarkable
- Page state survives browser refresh
- Integrates with Next.js routing seamlessly
- Use `useSearchParams()` hook (Next.js 16) for client-side filter state

## Key Trade-Offs

| Aspect | Desktop | Mobile | Recommendation |
|--------|---------|--------|---|
| **Grid** | 3-column CSS Grid | 1-column auto-stack | CSS Grid handles both; no media query needed |
| **Pagination** | Numbered links | "Load More" button | Hybrid: both present on desktop, button-only mobile |
| **Filters** | Horizontal bar | Collapsible drawer | Layout varies; filter logic stays same |
| **Portrait size** | 140px diameter | 100px diameter | Use `aspect-ratio` + responsive sizing |

## Adoption Risk & Maturity

- **CSS Grid:** Production-ready, no browser gaps (all modern browsers ≥95%)
- **Container Queries:** Supported in Next.js 16 via PostCSS, but fallback to media queries if needed
- **`useSearchParams()`:** Standard Next.js 16 hook; no external deps
- **Circular images:** Zero risk; pure CSS + HTML semantics

## Unresolved Questions

1. What max number of guides per page before performance degradation? (Need backend load testing)
2. Should filter dropdown selections also update URL params for shareable filter state?
3. Any preferred badge/credential component library (Shadcn UI, Radix, MUI)?
4. Does "Load More" trigger prefetch on scroll, or only on button click?

---

**Sources:**
- [MDN: CSS Grid Layout](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Grid_layout/Common_grid_layouts)
- [Smashing Magazine: Infinite Scroll UX Guidelines](https://www.smashingmagazine.com/2022/03/designing-better-infinite-scroll/)
- [LogRocket: Filter UX/UI Design Patterns](https://blog.logrocket.com/ux-design/filtering-ux-ui-design-patterns-best-practices/)
- [W3C WAI: Accessible Images](https://www.w3.org/WAI/tutorials/images/)
- [Algolia: Search Filters Best Practices](https://www.algolia.com/blog/ux/search-filter-ux-best-practices)
- [BrowserStack: Responsive Design Breakpoints 2025](https://www.browserstack.com/guide/responsive-design-breakpoints)
