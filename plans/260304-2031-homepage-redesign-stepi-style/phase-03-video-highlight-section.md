# Phase 03 — Video Highlight Section (NEW)

**Priority:** Medium | **Status:** Complete

## Context

- No current equivalent in homepage
- Reference: Stepi "Watch Our Video" — large scenic aerial photo with embedded YouTube player overlay

## Overview

New section between TrustSignals and FeaturedTours. Features a large scenic background image of Swedish landscape with an overlay video play button. Clicking opens a YouTube/Vimeo embed in a lightbox or inline player.

## Key Design Changes

### Layout (Desktop)
```
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│                     WATCH OUR VIDEO                           │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐   │
│  │                                                        │   │
│  │           [Scenic aerial photo]                        │   │
│  │                                                        │   │
│  │                  ▶ Play                                 │   │
│  │                                                        │   │
│  │                                                        │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                               │
└──────────────────────────────────────────────────────────────┘
  White/light background, rounded image container
```

### Layout (Mobile)
```
┌──────────────────────┐
│   WATCH OUR VIDEO    │
│                      │
│ ┌──────────────────┐ │
│ │                  │ │
│ │   [Photo]  ▶     │ │
│ │                  │ │
│ └──────────────────┘ │
└──────────────────────┘
```

### Visual Specs

| Element | Spec |
|---------|------|
| **Section title** | "WATCH OUR VIDEO" — gold accent, uppercase, tracking-wide |
| **Image container** | Rounded-2xl, aspect-video (16:9), overflow-hidden |
| **Play button** | Centered circle, white bg with gold border, play icon |
| **Overlay** | Subtle dark overlay on image hover |
| **Lightbox** | Modal with embedded YouTube iframe on play click |
| **Background** | White section or subtle alt-bg (#F7F7F5) |

### Color Application
- Play button: `bg-white border-2 border-[#DBC078] text-[#252525]`
- Play button hover: `bg-[#DBC078] text-white`
- Image overlay: `bg-black/20` on hover
- Section title: `#d0ad50`

## Architecture

```
VideoHighlight (client component)
├── Section title
├── Video thumbnail container
│   ├── Next/Image (scenic photo)
│   ├── Play button overlay
│   └── Dark hover overlay
└── VideoModal (dialog/portal)
    └── YouTube iframe (lazy loaded on click)
```

## Files to Create

| File | Purpose |
|------|---------|
| `apps/web/components/home/video-highlight.tsx` | New section component |

## Files to Modify

| File | Action |
|------|--------|
| `apps/web/components/home/index.ts` | Add export |
| `apps/web/app/(site)/[locale]/(frontend)/page.tsx` | Add to section order |
| i18n message files | Add `home.video.*` keys |

## Implementation Steps

1. Create `video-highlight.tsx` client component
2. Implement scenic photo thumbnail with play button overlay
3. Build lightweight video modal (portal, escape-to-close, click-outside)
4. Lazy-load YouTube iframe only when modal opens (performance)
5. Add to homepage between TrustSignals and FeaturedTours
6. Export from index.ts
7. Add i18n keys for section title
8. Test responsive at all breakpoints
9. Ensure reduced-motion compliance

## Dependencies

- Need YouTube/Vimeo video URL for the tour highlight video
- Need scenic aerial photo of Swedish landscape (placeholder: Unsplash)

## Success Criteria

- [x] New VideoHighlight section renders between TrustSignals and FeaturedTours
- [x] Play button opens video in lightbox/modal
- [x] YouTube iframe lazy-loaded on click only
- [x] Responsive across all breakpoints
- [x] Keyboard accessible (Enter to play, Escape to close)
- [x] i18n support (SV/EN/DE)
