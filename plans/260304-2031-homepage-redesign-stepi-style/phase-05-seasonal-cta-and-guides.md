# Phase 05 — Seasonal CTA Band + Guides Preview

**Priority:** Medium | **Status:** Complete

## Context

- Current: `find-tour-cta.tsx` (AI-focused CTA) + `why-choose-us.tsx` (benefits grid)
- Reference: Stepi orange seasonal strip + "Meet Our Guides" section with headshots

## Overview

Two transformations:
1. **FindTourCta → SeasonalCta**: Full-width gold accent band promoting seasonal tours (like Stepi's orange strip)
2. **WhyChooseUs → GuidesPreview**: Replace benefits grid with guide headshots and names

---

## Part A: Seasonal CTA Band

### Layout (Desktop)
```
┌─────────────────────────── GOLD BG ──────────────────────────┐
│                                                               │
│  LET'S TRAVEL ALL        ┌──────────┐    ┌──────────┐       │
│   YEAR ROUND             │ Winter   │    │ Summer   │       │
│                          │ [photo]  │    │ [photo]  │       │
│  Discover seasonal       │ Book Now │    │ Book Now │       │
│  Swedish experiences     └──────────┘    └──────────┘       │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Layout (Mobile)
```
┌──────────────────────┐
│  ██ GOLD BG ████████ │
│  LET'S TRAVEL ALL    │
│   YEAR ROUND         │
│                      │
│  ┌────────────────┐  │
│  │ Winter [photo] │  │
│  │ [ Book Now ]   │  │
│  └────────────────┘  │
│  ┌────────────────┐  │
│  │ Summer [photo] │  │
│  │ [ Book Now ]   │  │
│  └────────────────┘  │
└──────────────────────┘
```

### Visual Specs — Seasonal CTA

| Element | Spec |
|---------|------|
| **Background** | Gradient: `from-[#d0ad50] to-[#DBC078]` |
| **Headline** | White, Playfair Display, large |
| **Subtitle** | White/80 opacity, Inter |
| **Season cards** | Rounded, photo + label + "Book Now" button |
| **Button** | White bg, gold text: `bg-white text-[#d0ad50] hover:bg-white/90` |

---

## Part B: Guides Preview (Replaces WhyChooseUs)

### Layout (Desktop)
```
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│                    MEET OUR GUIDES                            │
│                                                               │
│     ┌─────┐      ┌─────┐      ┌─────┐      ┌─────┐         │
│     │photo│      │photo│      │photo│      │photo│         │
│     │ ○○○ │      │ ○○○ │      │ ○○○ │      │ ○○○ │         │
│     └─────┘      └─────┘      └─────┘      └─────┘         │
│     Anna S.      Erik L.      Maria K.     Johan B.         │
│     Stockholm    Gothenburg   Uppsala      Malmö            │
│                                                               │
│                   [ Meet All Guides → ]                       │
│                                                               │
└──────────────────────────────────────────────────────────────┘
  White background, circular headshots
```

### Visual Specs — Guides

| Element | Spec |
|---------|------|
| **Background** | White (#FFFFFF) |
| **Section title** | Gold accent uppercase |
| **Photos** | Circular (rounded-full), 120x120px, border-2 border-[#DBC078] |
| **Name** | Playfair Display, #252525 |
| **Specialty** | Inter, #3e3e3e, small |
| **CTA** | "Meet All Guides →" gold outline button |

## Data Source

- Guides from Payload CMS `guides` collection
- Fetch top 4 guides server-side or use static data initially

## Files to Modify

| File | Action |
|------|--------|
| `apps/web/components/home/find-tour-cta.tsx` | Rename/restyle → seasonal-cta.tsx |
| `apps/web/components/home/why-choose-us.tsx` | Replace → guides-preview.tsx |
| `apps/web/components/home/index.ts` | Update exports |
| `apps/web/app/(site)/[locale]/(frontend)/page.tsx` | Update imports |
| i18n message files | Add new keys |

## Implementation Steps

### Seasonal CTA
1. Rename find-tour-cta.tsx → seasonal-cta.tsx
2. Replace AI-focused content with seasonal travel messaging
3. Apply gold gradient background
4. Add 2 season cards with photos and CTA buttons
5. White text on gold background

### Guides Preview
1. Rename why-choose-us.tsx → guides-preview.tsx
2. Implement 4-guide circular headshot grid
3. Fetch guide data from CMS or use placeholder data
4. Add "Meet All Guides" link to /guides page
5. Circular photos with gold border

### Integration
6. Update index.ts exports
7. Update page.tsx imports and section order
8. Add i18n keys
9. Test responsive

## Success Criteria

- [x] Gold accent seasonal CTA band
- [x] 4 guide circular headshots with names
- [x] Links to /guides page
- [x] Responsive layout
- [x] i18n support
