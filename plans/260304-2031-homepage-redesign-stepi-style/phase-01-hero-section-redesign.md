# Phase 01 — Hero Section Redesign

**Priority:** High | **Status:** Complete

## Context

- Current: `apps/web/components/home/hero-section.tsx`
- Reference: Stepi hero — full-screen mountain photo, large white serif headline, minimal gradient, single CTA button, scroll indicator

## Overview

Transform hero from current gradient-heavy overlay to a clean, photo-forward design matching Stepi's approach. Large immersive background image with minimal overlay, bold white serif headline centered, and a single prominent CTA.

## Key Design Changes

### Layout (Desktop)
```
┌──────────────────────────────────────────────────┐
│  [Logo]          Nav Links          [Lang] [CTA] │ ← Transparent header
│                                                   │
│                                                   │
│              Adventures in                        │
│               Stockholm                           │
│                                                   │
│             [ Explore Tours ]                     │
│                                                   │
│                   ↓ scroll                        │
└──────────────────────────────────────────────────┘
  Full-screen background photo (100vh)
  Subtle dark gradient at bottom only (for text readability)
```

### Layout (Mobile)
```
┌─────────────────────┐
│ [Logo]        [☰]   │
│                      │
│   Adventures in      │
│    Stockholm         │
│                      │
│  [ Explore Tours ]   │
│                      │
│        ↓             │
└─────────────────────┘
```

### Visual Specs

| Element | Current | New |
|---------|---------|-----|
| **Background** | Photo + heavy gradient overlay | Photo + subtle bottom gradient only |
| **Overlay** | `from-primary-dark/70 via-primary/50` | `from-black/40 via-transparent to-black/50` (bottom) |
| **Headline** | Medium size, multiple lines | Large Playfair Display, 2 lines max, white |
| **Subtitle** | Exists | Remove or very subtle |
| **CTA** | "Ask AI" + "Browse Tours" (2 buttons) | Single "Explore Tours" button, outline-white style |
| **Floating cards** | Present | Remove — clean look |
| **Scroll indicator** | Animated arrow | Simple down chevron with pulse animation |
| **Height** | 100vh | 100vh (keep) |

### Color Application
- Text: `#FFFFFF` (pure white on photo)
- CTA button: white outline (`border-white text-white hover:bg-white hover:text-[#252525]`)
- Gradient: `bg-gradient-to-t from-black/50 via-transparent to-black/20`

## Requirements

### Functional
- Full-viewport height background image
- Centered headline + CTA
- Transparent header overlay (no background until scroll)
- Smooth scroll indicator
- Next.js Image with priority loading

### Non-Functional
- LCP < 2.5s (hero image is LCP candidate)
- Use `sizes="100vw"` and `priority` on hero image
- `prefers-reduced-motion` disables scroll indicator animation

## Files to Modify

| File | Action |
|------|--------|
| `apps/web/components/home/hero-section.tsx` | Major restyle |
| `apps/web/app/globals.css` | Update hero animation keyframes if needed |

## Implementation Steps

1. Read current `hero-section.tsx` fully
2. Remove floating image cards
3. Simplify gradient overlay to subtle bottom-only
4. Center headline with Playfair Display, large white text
5. Replace dual CTAs with single outline-white button
6. Simplify scroll indicator to minimal chevron
7. Ensure header remains transparent over hero
8. Test responsive at 375px, 768px, 1024px, 1440px
9. Verify LCP performance with hero image

## Success Criteria

- [x] Full-screen photo-forward hero matching Stepi aesthetic
- [x] Single centered headline in Playfair Display
- [x] Single outline CTA button
- [x] Transparent header overlays hero
- [x] Mobile responsive
- [x] LCP < 2.5s
