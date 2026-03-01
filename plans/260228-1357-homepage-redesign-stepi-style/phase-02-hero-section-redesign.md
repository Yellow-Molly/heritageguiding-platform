# Phase 02: Hero Section Redesign

## Context Links
- [Plan Overview](./plan.md)
- [Current hero-section.tsx](../../apps/web/components/home/hero-section.tsx) (189 lines)
- [Stepi Reference](https://stepi-128.webflow.io/home-2) - Hero pattern

## Overview
- **Priority:** P1
- **Status:** complete
- **Description:** Simplify hero to match Stepi: full-bleed background image, centered headline, single "Book Now" CTA. Remove parallax, floating images, decorative SVGs, and trust badge complexity.

## Key Insights
- Current hero is 189 lines with parallax scroll handler, decorative SVGs, floating image elements
- Stepi hero is clean: one full-bleed image, centered text stack, single CTA
- Keep `'use client'` since it uses `useTranslations` from next-intl
- Remove `useAiChat` hook dependency -- use simple Link CTA to /tours instead
- Keep `priority` on hero Image for LCP optimization

## Requirements

### Functional
- Full-viewport-height hero with single background image
- Centered content: tagline (small uppercase text), headline (serif), subtitle, single CTA button
- Gradient overlay for text readability (dark, matching new palette)
- Scroll-down indicator (chevron) at bottom
- Mobile: smaller text sizes, vertical stacking (already mobile-first)

### Non-Functional
- < 100 lines (from 189)
- No client-side scroll handlers (remove parallax)
- LCP image must have `priority` and correct `sizes`
- Text must be readable on all viewports

## Architecture
Replace existing `hero-section.tsx` in-place. Same export name `HeroSection`, same location.

## Related Code Files
- **Modify:** `apps/web/components/home/hero-section.tsx`
- **Reference:** `apps/web/components/ui/button.tsx` (getButtonClassName)

## Implementation Steps

1. Remove parallax `useEffect` and `useRef`
2. Remove decorative SVG elements (circles, triangles)
3. Remove floating image elements (bottom-left, top-right)
4. Remove trust badge pill at top
5. Remove trust indicators row at bottom (Shield, Award, Star)
6. Remove `useAiChat` import and `openChat` usage
7. Simplify to single background Image with gradient overlay:
   ```
   gradient: from-[#0b0b0b]/80 via-[#252525]/60 to-[#0b0b0b]/80
   ```
8. Centered content structure (mobile-first):
   ```tsx
   <section className="relative flex min-h-screen items-center justify-center">
     {/* Background Image + Overlay */}
     <div className="absolute inset-0">
       <Image ... priority fill sizes="100vw" />
       <div className="absolute inset-0 bg-gradient-to-b ..." />
     </div>
     {/* Content */}
     <div className="relative z-10 text-center px-4">
       <span>{t('home.hero.tagline')}</span>  {/* small uppercase */}
       <h1>{t('home.hero.title')}</h1>
       <p>{t('home.hero.subtitle')}</p>
       <Link href="/tours" className={getButtonClassName('secondary', 'xl')}>
         {t('home.hero.cta')}
       </Link>
     </div>
     {/* Scroll indicator */}
   </section>
   ```
9. Keep scroll-down chevron button
10. Use i18n keys: `home.hero.tagline` (new), rest existing

## Todo List
- [x] Remove parallax effect code
- [x] Remove decorative SVGs
- [x] Remove floating images
- [x] Remove trust badge + indicators
- [x] Simplify to single CTA (Link to /tours)
- [x] Update gradient overlay to new palette
- [x] Add `home.hero.tagline` i18n key usage
- [x] Verify mobile layout (text sizing, spacing)
- [x] Keep LCP optimizations (priority, sizes)
- [x] File under 100 lines

## Success Criteria
- Clean, centered hero with single CTA
- No parallax or scroll-dependent JS
- Readable text on all viewports
- File < 100 lines
- Mobile-first responsive sizing

## Risk Assessment
- **Low:** Self-contained component, no external deps affected
- **Note:** `useAiChat` removal means Ask AI button only available in header (acceptable)

## Security Considerations
None.

## Next Steps
Phase 09 integrates updated hero into page.tsx.
