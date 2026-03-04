# Phase 06 — Testimonials Restyle + Blog Section + Footer

**Priority:** Medium | **Status:** Complete

## Context

- Current: `testimonials.tsx` (carousel), Footer (multi-column)
- Reference: Stepi testimonials + "Latest Posts" blog grid + dark footer
- CategoryNav section removed from homepage (phase 05 integration)

## Overview

Three changes:
1. Restyle testimonials to match Stepi's clean card-based layout
2. Add new "Latest Posts" blog section
3. Restyle footer to dark theme with gold accents

---

## Part A: Testimonials Restyle

### Layout (Desktop)
```
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│                   WHAT TRAVELERS SAY                          │
│                                                               │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│   │ "Amazing      │  │ "Best tour   │  │ "Incredible  │      │
│   │  experience   │  │  we've ever  │  │  guide and   │      │
│   │  in Sweden"   │  │  taken!"     │  │  history"    │      │
│   │               │  │              │  │              │      │
│   │  ○ Anna, DE   │  │  ○ John, US  │  │  ○ Yuki, JP  │      │
│   │  ⭐⭐⭐⭐⭐      │  │  ⭐⭐⭐⭐⭐     │  │  ⭐⭐⭐⭐⭐     │      │
│   └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│                      ← ● ● ○ →                               │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Visual Specs

| Element | Spec |
|---------|------|
| **Background** | Alt background (#F7F7F5) |
| **Cards** | White, rounded-xl, shadow-sm, padding-8 |
| **Quote text** | Inter, italic, #252525 |
| **Author** | Circular photo + name + country |
| **Stars** | Gold (#DBC078) filled stars |
| **Navigation** | Dot indicators + prev/next arrows |

---

## Part B: Latest Posts (NEW)

### Layout (Desktop)
```
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│                    LATEST FROM OUR BLOG                       │
│                                                               │
│  ┌─────────────────┐   ┌────────────┐   ┌────────────┐      │
│  │  [Large Image]  │   │ [Image]    │   │ [Image]    │      │
│  │                 │   │ Title      │   │ Title      │      │
│  │  Title          │   │ Date       │   │ Date       │      │
│  │  Excerpt...     │   │ Read More→ │   │ Read More→ │      │
│  │  Date           │   └────────────┘   └────────────┘      │
│  │  Read More →    │                                         │
│  └─────────────────┘                                         │
│                                                               │
└──────────────────────────────────────────────────────────────┘
  1 featured large + 2 smaller cards (Stepi-like asymmetric grid)
```

### Visual Specs

| Element | Spec |
|---------|------|
| **Background** | White |
| **Featured card** | Large, spans 2 rows, image top |
| **Small cards** | Stacked, image left or top |
| **Title** | Playfair Display, #252525 |
| **Date** | Inter, #3e3e3e, small |
| **Read More** | Gold text link: `text-[#d0ad50]` |

### Data Source
- Payload CMS `posts` collection (if exists)
- Fallback: static placeholder content initially

---

## Part C: Footer Restyle

### Layout
```
┌──────────────────────── #0b0b0b BG ─────────────────────────┐
│                                                               │
│  [Logo]              TOURS    SUPPORT    COMPANY              │
│  Premium heritage    Link     Link       Link                │
│  tours in Sweden     Link     Link       Link                │
│                      Link     Link       Link                │
│  📧 Newsletter                                               │
│  [email input] [Subscribe]                                   │
│                                                               │
│  ─────────────────────────────────────────────               │
│  © 2026 Private Tours    [Social Icons]                      │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Visual Specs

| Element | Current | New |
|---------|---------|-----|
| **Background** | Dark | Near-black `#0b0b0b` |
| **Text** | White | `#e6d3a0` (light gold) for links, white for headings |
| **Logo** | Standard | White/gold variant |
| **Newsletter input** | Current | `bg-white/10 border-[#DBC078]/30` |
| **Subscribe button** | Current | `bg-[#DBC078] text-[#0b0b0b] hover:bg-[#d0ad50]` |
| **Social icons** | Current | Gold on hover |
| **Divider** | None | `border-[#3e3e3e]` |

## Files to Modify

| File | Action |
|------|--------|
| `apps/web/components/home/testimonials.tsx` | Restyle |
| `apps/web/components/layout/footer.tsx` | Restyle to dark + gold |
| i18n message files | Add blog section keys |

## Files to Create

| File | Purpose |
|------|---------|
| `apps/web/components/home/latest-posts.tsx` | New blog section |

## Implementation Steps

1. Restyle testimonials to white cards on alt-bg
2. Create latest-posts.tsx with asymmetric grid
3. Fetch posts from CMS or use placeholders
4. Restyle footer: dark bg, gold accents, updated link colors
5. Update page.tsx section order
6. Add i18n keys
7. Test responsive

## Success Criteria

- [x] Clean testimonial cards with gold stars
- [x] Blog section with 1 featured + 2 small cards
- [x] Dark footer with gold accents
- [x] All sections responsive
- [x] i18n support
