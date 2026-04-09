# Phase 5: Reviews Redesign

**Status:** Complete
**Priority:** Medium
**Effort:** Small

## Overview

Restyle reviews section to match Option B design with header score row and cleaner review cards.

## Key Design Specs

- Header: "Guest Reviews" (Playfair 24px) left + score badge right (`star icon + "4.9 / 5 (47)"`)
- Review cards: `rounded-xl`, border `--color-border`, padding 20px
- Card header: author name + " — rating" (Inter 14px bold) left, date right (Inter 12px `--color-text-light`)
- Card body: review text, italic, Inter 14px, line-height 1.5
- Gap between cards: 12px

## Related Code Files

### Modify
- `apps/web/components/tour/reviews-section.tsx` — Restyle layout

## Implementation Steps

1. Update header row: justify-between with title left, score badge right
2. Update review cards: simpler layout, author name with rating inline, italic body
3. Remove Quote icon, use cleaner presentation
4. Keep existing data handling and empty state

## Todo

- [x] Restyle header with score badge
- [x] Restyle review cards
- [x] Remove Quote icon
