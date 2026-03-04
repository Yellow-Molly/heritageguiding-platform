# Phase 02 — Trust Signals Redesign

**Priority:** High | **Status:** Complete

## Context

- Current: `apps/web/components/home/trust-signals.tsx`
- Reference: Stepi "Why Travel with Stepi" — horizontal row of circular icons with stats and descriptions on white background

## Overview

Restyle trust signals from current navy-background counter strip to a white-background section with circular icon containers, stat numbers, and short descriptions — matching Stepi's "Why Travel" layout.

## Key Design Changes

### Layout (Desktop)
```
┌──────────────────────────────────────────────────────────────┐
│                                                               │
│                  WHY TRAVEL WITH US                           │
│                                                               │
│   ┌──────┐     ┌──────┐     ┌──────┐     ┌──────┐           │
│   │ (🗺)  │     │ (✓)  │     │ (📅) │     │ (⭐) │           │
│   │ icon  │     │ icon │     │ icon │     │ icon │           │
│   └──────┘     └──────┘     └──────┘     └──────┘           │
│    360+          100%         15+           98%               │
│   Worldwide    Trusted      Years of      Travelers          │
│    Guide       Agency      Experience     Are Happy          │
│                                                               │
└──────────────────────────────────────────────────────────────┘
  White background, 4-column grid, centered
```

### Layout (Mobile) — 2x2 grid
```
┌──────────────────────┐
│  WHY TRAVEL WITH US  │
│                      │
│  ┌────┐    ┌────┐    │
│  │icon│    │icon│    │
│  │360+│    │100%│    │
│  │text│    │text│    │
│  └────┘    └────┘    │
│  ┌────┐    ┌────┐    │
│  │icon│    │icon│    │
│  │15+ │    │98% │    │
│  │text│    │text│    │
│  └────┘    └────┘    │
└──────────────────────┘
```

### Visual Specs

| Element | Current | New |
|---------|---------|-----|
| **Background** | Navy (#1E3A5F) | White (#FFFFFF) |
| **Section title** | None / minimal | "WHY TRAVEL WITH US" in gold accent uppercase |
| **Icons** | Inline with text | Circular container, light gold background (#e6d3a0/20) |
| **Numbers** | Animated counter | Keep counter animation, larger font (Playfair Display) |
| **Descriptions** | Short | 2-line description under each stat |
| **Text color** | White on navy | Charcoal (#252525) on white |

### Color Application
- Section title: `#d0ad50` (gold accent) uppercase tracking-wide
- Icon circles: `bg-[#e6d3a0]/20 border border-[#DBC078]/30`
- Stat numbers: `#252525` Playfair Display bold
- Description text: `#3e3e3e` Inter regular

## Stats to Display

| Icon | Stat | Label |
|------|------|-------|
| Globe/Map | 25+ | Expert Local Guides |
| Shield/Check | 100% | Trusted Tour Agency |
| Calendar | 15+ | Years of Experience |
| Star | 98% | Travelers Are Happy |

## Files to Modify

| File | Action |
|------|--------|
| `apps/web/components/home/trust-signals.tsx` | Major restyle |

## Implementation Steps

1. Read current trust-signals.tsx
2. Change background from navy to white
3. Add section heading "WHY TRAVEL WITH US"
4. Replace stat layout with circular icon + number + description column
5. Use Lucide icons (Globe, ShieldCheck, Calendar, Star)
6. Keep counter-up animation on scroll
7. Implement 4-col desktop → 2x2 mobile grid
8. Update i18n keys for new descriptions

## Success Criteria

- [x] White background with circular icon containers
- [x] 4-column desktop, 2x2 mobile layout
- [x] Counter animation preserved
- [x] Gold accent section title
- [x] i18n translations updated
