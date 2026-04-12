# Phase 4: Meeting Point & Guide Redesign

**Status:** Complete
**Priority:** Medium
**Effort:** Medium

## Overview

Redesign logistics/meeting point section with map image + label-value grid. Redesign guide card to horizontal layout matching design.

## Key Design Specs

### Meeting Point (Desktop)
- Container: `bg-[var(--color-background-alt)]`, `rounded-2xl`, padding 24px
- Heading: "Meeting Point & Logistics", Playfair 22px
- Map image: full-width, 180px height, `rounded-lg`, `object-cover`
- Below map: 3-column grid of label-value pairs:
  - Label: `--color-text-muted`, Inter 11px, font-weight 600, letter-spacing 1px
  - Value: `--color-text`, Inter 13px, font-weight 500
  - Items: Meeting Point, Transport, Tour Ends

### Meeting Point (Mobile)
- Heading: Playfair 20px
- Map: 140px height
- Items: icon + text rows instead of label-value grid

### Guide Card
- Container: `bg-[var(--color-surface)]`, `rounded-2xl`, border, padding 24px
- Horizontal: avatar (80px circle) + info column, `gap-20`
- Name: Playfair 22px, `--color-primary`
- Meta: Inter 13px, `--color-text-muted` (credentials joined with " · ")
- Bio: Inter 14px, `--color-text`, line-height 1.5

## Related Code Files

### Modify
- `apps/web/components/tour/logistics-section.tsx` — Redesign layout
- `apps/web/components/tour/guide-card.tsx` — Redesign to horizontal card

## Implementation Steps

1. Update `logistics-section.tsx`:
   - Replace Card component with styled div
   - Add map image placeholder (use Google Maps static image or existing map component)
   - Desktop: label-value grid layout (3 columns)
   - Mobile: icon + text row layout
   - Keep Google Maps link functionality

2. Update `guide-card.tsx`:
   - Remove Card/CardContent wrappers, use styled div
   - Avatar: 80px circle image
   - Info: name (Playfair), credentials as single " · " separated string, bio
   - Remove language badges, integrate into credentials line
   - Horizontal layout always (avatar left, info right)

## Todo

- [x] Redesign logistics section with map + label-value grid
- [x] Redesign guide card to horizontal layout
- [x] Test with missing logistics/guide data
