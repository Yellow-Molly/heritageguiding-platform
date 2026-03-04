# Phase 04 — Featured Tours Card Redesign

**Priority:** High | **Status:** Complete

## Context

- Current: `apps/web/components/home/featured-tours.tsx`
- Reference: Stepi "Most Popular Tours" — clean card grid with destination image, title, price, rating, horizontal scroll on mobile

## Overview

Restyle tour cards to match Stepi's cleaner card aesthetic: rounded images, minimal info overlay, clear pricing, and a horizontal scrollable row on mobile.

## Key Design Changes

### Layout (Desktop) — 3 or 4 column grid
```
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│                    MOST POPULAR TOURS                         │
│          Discover our most loved Swedish experiences          │
│                                                               │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐                  │
│  │ [Image]  │   │ [Image]  │   │ [Image]  │                  │
│  │          │   │          │   │          │                  │
│  ├──────────┤   ├──────────┤   ├──────────┤                  │
│  │ Title    │   │ Title    │   │ Title    │                  │
│  │ ⭐ 4.9   │   │ ⭐ 4.8   │   │ ⭐ 4.9   │                  │
│  │ From $XX │   │ From $XX │   │ From $XX │                  │
│  │ [Book →] │   │ [Book →] │   │ [Book →] │                  │
│  └──────────┘   └──────────┘   └──────────┘                  │
│                                                               │
│                    [ View All Tours → ]                       │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Layout (Mobile) — horizontal scroll
```
┌──────────────────────┐
│  MOST POPULAR TOURS  │
│                      │
│ ┌────────┐┌────────┐ │
│ │[Image] ││[Image] │→│ (scroll)
│ │Title   ││Title   │ │
│ │⭐ $XX  ││⭐ $XX  │ │
│ └────────┘└────────┘ │
│                      │
│  [ View All Tours ]  │
└──────────────────────┘
```

### Card Visual Specs

| Element | Current | New |
|---------|---------|-----|
| **Image** | Aspect 4:3 | Aspect 3:4 portrait (taller, like Stepi) |
| **Border radius** | rounded-2xl | rounded-xl |
| **Shadow** | shadow-card | shadow-sm → shadow-md on hover |
| **Price** | Badge overlay | Clean text below image: "From $XX" |
| **Rating** | Star overlay | Small star + number inline with price |
| **CTA** | None on card | "Read More →" text link in gold |
| **Card bg** | White | White with subtle border |
| **Hover** | Scale 1.02 | Shadow lift only (no scale, prevents layout shift) |

### Color Application
- Card border: `border border-gray-100`
- Title: `#252525` Playfair Display
- Price: `#d0ad50` (gold accent) bold
- Rating star: `#DBC078` fill
- "Read More" link: `#d0ad50 hover:underline`
- "View All Tours" button: gold outline (`border-[#d0ad50] text-[#d0ad50] hover:bg-[#d0ad50] hover:text-white`)

## Files to Modify

| File | Action |
|------|--------|
| `apps/web/components/home/featured-tours.tsx` | Major restyle |

## Implementation Steps

1. Read current featured-tours.tsx
2. Update section heading style (gold accent, uppercase)
3. Redesign card: portrait image, clean info below
4. Remove badge overlays, use inline text
5. Add "Read More →" gold text link per card
6. Add "View All Tours" button at section bottom
7. Implement horizontal scroll on mobile (snap scroll)
8. Keep intersection observer for scroll animation
9. Test with various tour data (long titles, missing images)

## Success Criteria

- [x] Cleaner card design matching Stepi style
- [x] 3-col grid desktop, horizontal scroll mobile
- [x] Gold accent pricing and links
- [x] No layout shift on hover
- [x] "View All Tours" CTA at bottom
