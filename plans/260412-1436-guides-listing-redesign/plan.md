---
title: "Guides Listing Page Redesign — Portrait Gallery"
description: "Redesign guides listing page with portrait gallery layout, search/filter bar, and mobile-optimized experience"
status: completed
priority: P2
effort: 6h
branch: master
tags: [guides, redesign, ui, filters]
created: 2026-04-12
---

# Guides Listing Page Redesign

## Summary

Transform the guides listing from horizontal card layout to a portrait gallery style with circular photos, centered content, search/filter bar, and mobile "load more" pattern.

## Data Flow

```
CMS (guides + tours collections)
  → getGuides() [adds tourCount, yearsExperience]
    → page.tsx (server: fetches data, renders hero + passes to client)
      → GuideFilterBar (client: URL search params ↔ filters)
      → GuideGrid (server: renders cards)
        → GuideListingCard (client: portrait gallery card)
      → GuideLoadMoreButton (client: mobile only, appends next page)
```

## Phases

| # | Phase | Status | Effort | File Ownership |
|---|-------|--------|--------|----------------|
| 1 | [CMS Schema & Data Layer](./phase-01-cms-schema-data-layer.md) | Complete | 1h | `packages/cms/collections/guides.ts`, `apps/web/lib/api/get-guides.ts` |
| 2 | [Hero Section & i18n](./phase-02-hero-section-i18n.md) | Complete | 30min | `components/guide/guide-listing-hero.tsx`, `messages/*.json` |
| 3 | [Guide Card Redesign](./phase-03-guide-card-redesign.md) | Complete | 1.5h | `components/guide/guide-listing-card.tsx` |
| 4 | [Filter Bar & Search](./phase-04-filter-bar-search.md) | Complete | 1.5h | `components/guide/guide-filter-bar.tsx`, `guide-filter-drawer-mobile.tsx` |
| 5 | [Grid, Load More & Page Assembly](./phase-05-grid-load-more-page.md) | Complete | 1h | `components/guide/guide-grid-client.tsx`, `guide-load-more-button.tsx`, `guides/page.tsx` |
| 6 | [Tests & Cleanup](./phase-06-tests-cleanup.md) | Complete | 30min | `__tests__/guide-*.test.tsx`, `components/guide/index.ts` |

## Dependencies

- Phase 2, 3, 4 can run in parallel (no file overlap)
- Phase 5 depends on Phase 1 (data), 2 (hero), 3 (card), 4 (filters)
- Phase 6 depends on all prior phases

## Rollback

Each phase is independently revertable via git. No DB migration is destructive (only adds optional field).

## Key Decisions

- Reuse existing `use-debounce` hook for search input
- URL search params for filter state (same pattern as tour catalog)
- `yearsExperience` as simple number field in CMS (not computed)
- Tour count computed at query time via Payload `count()` on tours collection
- **Both desktop and mobile use infinite scroll / "Load more"** (not traditional pagination)
- Desktop: 3 rows × 3 = 9 guides per page; Mobile: single column, 3 visible + load more

## Validation Summary

**Validated:** 2026-04-12
**Questions asked:** 4

### Design Corrections (from Pencil file)
- Photo size: **160px desktop** / **120px mobile** (plan had 140px)
- Photo border: **3px gold** (`$--color-secondary-light`) desktop / **2px** mobile
- Card cornerRadius: **20px desktop** / **16px mobile**
- Stats color: **`$--color-secondary` (gold)** not `$--color-accent` (coral)
- Mobile filter button: **inside search bar** (right-aligned), not separate

### Confirmed Decisions
1. **Stats line logic:** Credential-first — show first credential if available, fall back to `{years}+ years`, hide second part if neither exists
2. **Mobile filter:** Filters button embedded inside search bar (matches design)
3. **Hero background:** White (`$--color-surface`) for visual separation
4. **Pagination:** Infinite scroll / Load More on both desktop AND mobile (desktop shows 9 guides = 3×3, mobile shows 3 + load more)

### Action Items
- [x] Update Phase 3: fix photo size 160px/120px, add gold border, fix stats color to gold, add credential-first logic
- [x] Update Phase 4: filter button beside search bar on mobile (not inside — rightIcon caused overlap)
- [x] Update Phase 5: replace desktop pagination with infinite scroll, set desktop page size to 9

### Post-Implementation Fixes
- **Filter bar layout**: Moved mobile filter button from Input `rightIcon` to separate `<div>` beside search — absolute positioning caused desktop overlap
- **Language filter enum**: Separated `languages` and `additionalLanguages` queries — Postgres has disjoint enum types, `OR` clause caused invalid enum error
- **Tour count removed from card**: Per user request, stats line now only shows credential/years experience
