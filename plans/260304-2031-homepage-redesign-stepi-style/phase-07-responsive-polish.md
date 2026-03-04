# Phase 07 — Responsive Polish & Final Integration

**Priority:** Medium | **Status:** Complete

## Context

Final integration phase after all section redesigns are complete.

## Overview

Cross-section polish: ensure consistent spacing, responsive breakpoints, animations, accessibility, and performance across the full redesigned homepage.

## Checklist

### Layout Consistency
- [ ] All sections use consistent container max-width (max-w-7xl)
- [ ] Section vertical spacing: `py-16 md:py-24` consistently
- [ ] Section headings: all gold accent, uppercase, tracking-wide, Playfair Display
- [ ] No content hidden behind fixed header

### Responsive Breakpoints (375px, 768px, 1024px, 1440px)
- [ ] Hero: text readable at all sizes, image covers viewport
- [ ] Trust signals: 4-col → 2x2 → 1-col
- [ ] Video: maintains 16:9 aspect ratio
- [ ] Tour cards: 3-col → horizontal scroll on mobile
- [ ] Seasonal CTA: 2-col → stacked
- [ ] Guides: 4-col → 2x2 → horizontal scroll
- [ ] Testimonials: 3-col → carousel on mobile
- [ ] Blog: asymmetric → stacked
- [ ] Footer: multi-col → stacked

### Animation & Motion
- [ ] Scroll-triggered fade-in animations on all sections
- [ ] `prefers-reduced-motion` disables all animations
- [ ] Transition durations 150-300ms
- [ ] No layout shift from animations

### Accessibility
- [ ] Color contrast 4.5:1 minimum on all text
- [ ] All images have descriptive alt text
- [ ] Keyboard navigation works for all interactive elements
- [ ] Focus indicators visible on all focusable elements
- [ ] Skip-to-content link works
- [ ] Video modal: focus trap, escape to close

### Performance
- [ ] Hero image: priority loading, LCP < 2.5s
- [ ] Other images: lazy loading
- [ ] Video iframe: lazy loaded on interaction only
- [ ] No unnecessary JS bundle bloat from new sections
- [ ] CLS < 0.1 (reserve space for async content)

### Design System Consistency
- [ ] No emojis used as icons (Lucide icons only)
- [ ] cursor-pointer on all clickable elements
- [ ] Hover states with smooth transitions
- [ ] Gold accent color used consistently (#d0ad50 for CTAs, #DBC078 for borders/accents)
- [ ] Charcoal (#252525) for primary text

### Integration
- [ ] CategoryNav removed from homepage (moved to tours page if needed)
- [ ] Section order matches plan.md
- [ ] All new components exported from index.ts
- [ ] All i18n keys added for SV/EN/DE
- [ ] No broken imports or unused exports

## Files to Review

| File | Check |
|------|-------|
| `apps/web/app/(site)/[locale]/(frontend)/page.tsx` | Final section order |
| `apps/web/components/home/index.ts` | All exports present |
| `apps/web/app/globals.css` | New color variables if needed |
| `apps/web/components/layout/header.tsx` | Transparent → solid scroll behavior |
| All home components | Consistent styling |

## Implementation Steps

1. Full visual review at each breakpoint
2. Fix spacing inconsistencies
3. Verify all animations respect reduced-motion
4. Run accessibility audit (contrast, focus, ARIA)
5. Run Lighthouse for performance check
6. Fix any remaining issues
7. Update design-guidelines.md with new color palette and section order

## Success Criteria

- [x] Homepage matches Stepi aesthetic with heritage brand identity
- [x] Lighthouse scores: Performance 90+, Accessibility 90+
- [x] All breakpoints tested and polished
- [x] No accessibility violations
- [x] Design guidelines doc updated
