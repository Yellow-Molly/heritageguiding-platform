---
title: "Tours Listing Page Redesign — Option B (Search & Compare)"
description: "Redesign tours catalog with 2-column sidebar layout (desktop), horizontal cards (mobile), and advanced filters"
status: complete
priority: P2
effort: 12h
branch: master
tags: [frontend, tours, redesign, filters, responsive]
created: 2026-04-04
completed: 2026-04-04
---

# Tours Listing Page Redesign

## Summary

Transform the flat tours listing into a 2-column "Search & Compare" layout: static page header + sidebar filters (desktop), search bar + category pills + horizontal cards (mobile). No API changes needed — all filter params already supported.

## Architecture Change

```
CURRENT:  Header > Sticky FilterBar (search+chips+sort) > 3-col Grid
NEW (Desktop): Header > Static PageHeader (title+sort+view) > [Sidebar(260px) | 3-col Grid]
NEW (Mobile):  Header > MobileHeader (search+filters+pills+sort) > Horizontal Cards
```

## Phases

| # | Phase | Status | Effort | Files |
|---|-------|--------|--------|-------|
| 1 | [Page Layout & Header Redesign](phase-01-page-layout-and-header-redesign.md) | Complete | 3h | page.tsx, tour-catalog-client.tsx, NEW page-header.tsx |
| 2 | [Sidebar Filters Component](phase-02-sidebar-filters-component.md) | Complete | 3h | NEW sidebar-filters.tsx, NEW price-range-slider.tsx, NEW filter-checkbox-group.tsx |
| 3 | [Tour Card Redesign](phase-03-tour-card-redesign.md) | Complete | 2h | tour-card.tsx, tour-grid-layout.tsx |
| 4 | [Mobile Header & Responsive](phase-04-mobile-header-and-responsive.md) | Complete | 2.5h | filter-bar.tsx, category-chips.tsx, filter-drawer.tsx |
| 5 | [Translations & Polish](phase-05-translations-and-polish.md) | Complete | 1.5h | en.json, sv.json, de.json, visual QA |

## Key Dependencies

- Phase 2 depends on Phase 1 (sidebar mounts inside new layout)
- Phase 3 can run parallel with Phase 2
- Phase 4 depends on Phase 1 (mobile header replaces current FilterBar mobile section)
- Phase 5 runs last (needs all components to exist for key audit)

## Rollback

Each phase modifies distinct files. Revert via `git revert` per-phase commit. No DB or API changes.

## Validation Summary

**Validated:** 2026-04-04
**Questions asked:** 6

### Confirmed Decisions
- **Sticky behavior**: Static page header (not sticky). Matches design exactly.
- **Price range bounds**: Hardcoded min/max (e.g., 0-2000 SEK). No extra API call.
- **Hearing filter**: Hide checkbox entirely until API supports it. Only show wheelchair.
- **Map button**: Hide entirely. Don't render until map view is implemented.
- **Card layout**: Update mobile cards to match design (horizontal layout with CSS responsive classes).
- **Duration filter**: Single-select (radio behavior with checkbox UI). Maps to existing `duration` param.

### Action Items (All Complete)
- [x] Phase 1: Remove map button from `TourPageHeader` spec
- [x] Phase 2: Remove hearing accessibility checkbox from sidebar spec
- [x] Phase 2: Use hardcoded price range bounds (0-2000 SEK)
- [x] Phase 3: Implement mobile horizontal card layout matching design exactly
- [x] Phase 4: Remove hearing checkbox from filter drawer spec
