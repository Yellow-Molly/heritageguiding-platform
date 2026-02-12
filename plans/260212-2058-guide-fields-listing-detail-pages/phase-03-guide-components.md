# Phase 03: Guide Components

## Context Links

- Tour card pattern: `apps/web/components/tour/tour-card.tsx` (135 lines, client component)
- Guide card on tour detail: `apps/web/components/tour/guide-card.tsx` (71 lines, server component)
- Tour grid pattern: `apps/web/components/tour/tour-grid.tsx` (45 lines, server component)
- Tour barrel export: `apps/web/components/tour/index.ts`
- UI components: `apps/web/components/ui/badge.tsx`, `card.tsx`
- API types from Phase 02: `apps/web/lib/api/get-guides.ts`, `get-guide-by-slug.ts`

## Overview

- **Priority:** P1 (blocks Phase 04)
- **Status:** Pending
- **Estimate:** 2h
- **Description:** Create 5 guide-specific components + barrel export for listing and detail pages. Follow existing tour component patterns. Each under 200 lines.

## Key Insights

- `tour-card.tsx` is a client component (uses Image, Link, lucide icons, Badge, Card)
- `guide-card.tsx` is a server component (async, uses getTranslations)
- `tour-grid.tsx` is a server component that fetches data and renders cards
- Design system: uses CSS vars (`--color-primary`, `--color-text-muted`, etc.), Tailwind, Playfair serif headings
- Existing guide-card.tsx on tour detail shows: circular photo, name, credentials badges, languages, bio text
- New listing card will be similar but add: specialization badges, operating area chips, link to detail page

## Requirements

### Functional
- Guide listing card: photo, name, specializations, languages, operating areas, link
- Guide grid: maps guides to cards, empty state, pagination
- Guide detail header: large photo, name, status badge (only on-leave), languages, areas
- Guide detail content: bio (rich text), credentials, specialization badges
- Guide tours section: grid of tour cards for tours led by this guide

### Non-Functional
- Each component under 200 lines
- Server components by default; client only when needed (listing card needs Link/Image)
- Accessible: alt text, semantic HTML, ARIA labels
- Responsive: mobile-first with md/lg breakpoints

## Architecture

```
apps/web/components/guide/
  guide-listing-card.tsx         <- NEW (client, ~100 lines)
  guide-grid.tsx                 <- NEW (server, ~50 lines)
  guide-detail-header.tsx        <- NEW (server, ~80 lines)
  guide-detail-content.tsx       <- NEW (server, ~70 lines)
  guide-tours-section.tsx        <- NEW (server, ~60 lines)
  index.ts                       <- NEW (barrel export)
```

## Related Code Files

### Files to Create
- `apps/web/components/guide/guide-listing-card.tsx`
- `apps/web/components/guide/guide-grid.tsx`
- `apps/web/components/guide/guide-detail-header.tsx`
- `apps/web/components/guide/guide-detail-content.tsx`
- `apps/web/components/guide/guide-tours-section.tsx`
- `apps/web/components/guide/index.ts`

### Reference Files (read-only)
- `apps/web/components/tour/tour-card.tsx`
- `apps/web/components/tour/guide-card.tsx`
- `apps/web/components/tour/tour-grid.tsx`
- `apps/web/components/tour/tour-empty-state.tsx`
- `apps/web/components/tour/tour-pagination.tsx`

## Implementation Steps

### Step 1: Create `guide-listing-card.tsx`

Client component ('use client') for interactivity with Link/Image.

```typescript
// Props: { guide: GuideListItem }
// Layout:
// - Card wrapper with hover shadow transition (same as tour-card)
// - Circular photo (96px, centered on mobile, left on md+)
// - Name (serif h3, primary color, links to /guides/{slug})
// - Specialization badges (Badge variant="outline", max 3 shown)
// - Language tags (inline text with Languages icon)
// - Operating area chips (MapPin icon + area names)
```

Key details:
- Import `GuideListItem` from `@/lib/api/get-guides`
- Use `next/image` with `fill` + `rounded-full` for circular photo
- Use `next/link` pointing to `/guides/${guide.slug}`
- Use lucide icons: `Languages`, `MapPin`
- Use `Badge` from ui components for specializations
- Keep layout responsive: stack on mobile, row on sm+

### Step 2: Create `guide-grid.tsx`

Server component that receives guides array and renders grid.

```typescript
// Props: { guides: GuideListItem[], page: number, totalPages: number }
// Layout:
// - If empty: render empty state message
// - Grid: gap-6 sm:grid-cols-2 lg:grid-cols-3 (same as tour grid)
// - Pagination: reuse TourPagination component (generic enough)
```

Note: Unlike TourGrid which fetches data internally, GuideGrid receives data as props (simpler pattern, data fetched in page.tsx).

### Step 3: Create `guide-detail-header.tsx`

Server component for top section of guide detail page.

```typescript
// Props: { guide: GuideDetail }
// Layout:
// - Full-width section with subtle background
// - Large circular photo (160px on md+, 120px on mobile)
// - Name (serif h1, primary color)
// - Status badge: ONLY show if status is "on-leave" (yellow badge)
//   Do NOT show "active" badge -- it's the default state
// - Languages row: Languages icon + all languages joined
// - Operating areas row: MapPin icon + area names joined
```

### Step 4: Create `guide-detail-content.tsx`

Server component for bio + credentials section.

```typescript
// Props: { guide: GuideDetail }
// Layout:
// - Section heading "About {name}" (serif h2)
// - Bio text (rendered as HTML for rich text, use dangerouslySetInnerHTML)
//   NOTE: Bio is sanitized at CMS level; for mock data use plain text in <p> tags
// - Credentials section heading
// - Credentials as Badge list (variant="outline")
// - Specializations section heading
// - Specialization badges (variant="secondary")
```

### Step 5: Create `guide-tours-section.tsx`

Server component showing tours led by this guide.

```typescript
// Props: { tours: GuideDetail['tours'] }
// Layout:
// - Section heading "Tours by {guide name}" (serif h2)
// - If no tours: show "No tours currently available" message
// - Grid of simplified tour cards (3 columns on lg)
// - Each card: image, title (link to /tours/{slug}), duration, price, rating
```

Note: Use a simplified inline card rather than importing TourCard (which expects FeaturedTour type with more fields). Keep it self-contained.

### Step 6: Create `index.ts` barrel export

```typescript
export { GuideListingCard } from './guide-listing-card'
export { GuideGrid } from './guide-grid'
export { GuideDetailHeader } from './guide-detail-header'
export { GuideDetailContent } from './guide-detail-content'
export { GuideToursSection } from './guide-tours-section'
```

## Todo List

- [ ] Create guide-listing-card.tsx (client component, circular photo, badges, link)
- [ ] Create guide-grid.tsx (server component, grid layout, empty state, pagination)
- [ ] Create guide-detail-header.tsx (server, large photo, name, status, languages, areas)
- [ ] Create guide-detail-content.tsx (server, bio, credentials, specializations)
- [ ] Create guide-tours-section.tsx (server, tour cards grid)
- [ ] Create index.ts barrel export
- [ ] Verify all components under 200 lines
- [ ] Verify responsive layout (mobile + desktop)
- [ ] Verify accessible markup (alt text, semantic headings)

## Success Criteria

- All 6 files created, compile without errors
- Each component under 200 lines
- GuideListingCard renders photo, name, badges, languages, areas, link
- GuideGrid shows grid of cards or empty state
- GuideDetailHeader shows large photo, name, on-leave badge (only when applicable)
- GuideDetailContent shows bio, credentials, specializations
- GuideToursSection shows tour cards in grid
- All components use CSS vars and Tailwind consistent with existing design

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| TourPagination not generic enough for guides | Low | Can copy/adapt or create GuidePagination |
| Rich text bio rendering with dangerouslySetInnerHTML | Low | Mock data uses plain text; CMS sanitizes |

## Security Considerations

- No email/phone rendered anywhere in guide components
- Bio HTML sanitized at CMS layer; mock data uses safe strings
- Image URLs validated (Unsplash mock URLs are safe)

## Next Steps

- Phase 04 wires these components into page routes
