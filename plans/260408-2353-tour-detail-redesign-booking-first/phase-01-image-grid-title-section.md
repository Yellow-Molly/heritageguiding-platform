# Phase 1: Image Grid & Title Section

**Status:** Complete
**Priority:** High
**Effort:** Medium

## Overview

Replace the full-bleed hero image with a padded image grid layout, and move the title/meta info below the grid into its own section.

## Key Design Specs

### Image Grid (Desktop)
- Container: `px-80` (80px side padding), 420px height, 4px gap
- Left: 1 large image, `fill_container` width, `border-radius: 16px 0 0 16px`
- Right column: 420px width
  - Top: 1 image, `border-radius: 0 16px 0 0`
  - Bottom: 2 images side-by-side, right one has `border-radius: 0 0 16px 0`
- All images use `object-fit: cover`
- Click any image → open existing fullscreen gallery

### Image Grid (Mobile)
- Single hero image, full-width, 240px height, no border-radius

### Title Section
- Container: `px-80` desktop, `px-20` mobile, `pt-32` desktop, `pt-20` mobile
- Category tags: pills (first tag = primary bg + white text, rest = alt bg + border + text color)
- Title: Playfair Display, 36px desktop / 24px mobile, font-weight 700, color `--color-primary`
- Subtitle: Inter 16px, color `--color-text-muted`, line-height 1.5
- Meta row: rating (star icon + "4.9 (47 reviews)"), duration (timer icon), group size (users icon), accessibility (accessibility icon). Gap 20px.

## Related Code Files

### Modify
- `apps/web/components/tour/tour-hero.tsx` — Complete rewrite to image grid + title section

### Create
- `apps/web/components/tour/tour-image-grid.tsx` — Image grid component (desktop layout)
- `apps/web/components/tour/tour-title-section.tsx` — Title with tags, subtitle, meta

### Read for Context
- `apps/web/app/(site)/[locale]/(frontend)/tours/[slug]/page.tsx`
- `apps/web/components/tour/tour-facts.tsx` — Meta row logic to reuse
- `apps/web/components/tour/tour-gallery.tsx` — Fullscreen gallery (keep as-is)

## Implementation Steps

1. Create `tour-image-grid.tsx`:
   - Accept `gallery` and `title` props from tour data
   - Desktop: CSS Grid with 2 columns (auto + 420px right), 420px height, 4px gap
   - Left cell: single large image
   - Right cell: vertical flex, top image + bottom 2 images (flex row with gap 4)
   - Mobile: single image, 240px height, full-width
   - Each image clickable → opens gallery at correct index
   - Handle cases: 1 image, 2 images, 3 images, 4+ images gracefully
   - Use `next/image` with fill + object-cover

2. Create `tour-title-section.tsx`:
   - Accept `tour` prop
   - Render: category pills → h1 title → subtitle (description) → meta row
   - Category pills: first uses `bg-[var(--color-primary)] text-white`, rest use `bg-[var(--color-background-alt)] border border-[var(--color-border)]`
   - Meta row: reuse rating/duration/group/accessibility data from tour
   - Responsive: adjust font sizes and spacing per design

3. Update `tour-hero.tsx`:
   - Replace entire component with composition of `TourImageGrid` + `TourTitleSection`
   - Keep gallery state management (open/close, start index)
   - Remove gradient overlay, text-on-image, thumbnail strip
   - Keep `'use client'` for gallery interactivity

## Todo

- [x] Create `tour-image-grid.tsx` with responsive grid layout
- [x] Create `tour-title-section.tsx` with tags, title, meta
- [x] Rewrite `tour-hero.tsx` to compose new components
- [x] Verify gallery still opens at correct image index
- [x] Test with 1, 2, 3, 4+ gallery images
