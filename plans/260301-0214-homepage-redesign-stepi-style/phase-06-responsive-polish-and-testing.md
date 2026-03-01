# Phase 06 - Responsive Polish, Page Assembly, and Testing

## Context Links
- [Homepage page.tsx](../../apps/web/app/(site)/[locale]/(frontend)/page.tsx)
- [Barrel export](../../apps/web/components/home/index.ts)
- [Existing test](../../apps/web/components/home/__tests__/category-nav.test.tsx)
- [Design Guidelines](../../docs/design-guidelines.md)
- Phases 01-05 of this plan

## Overview
- **Priority:** P1
- **Status:** complete
- **Effort:** 1h
- **Description:** Final integration phase. Update page.tsx section order, remove deprecated components, verify responsive behavior at all breakpoints, add/update tests, verify i18n across all locales.

## Key Insights
- page.tsx is the single assembly point; all component swaps happen here
- Old components (CategoryNav, WhyChooseUs, FindTourCta) are removed from page but files kept until tests confirm no other imports
- Existing test for CategoryNav must be deleted or replaced
- Mobile-first verification: 375px, 768px, 1024px, 1440px breakpoints

## Requirements

### Page Assembly
- Update `page.tsx` imports and section order to match new design
- Remove: FeaturedTours, FindTourCta, CategoryNav, WhyChooseUs imports
- Add: VideoSection, ToursCarousel, SeasonalTabs, GuidesSection, BlogSection, NewsletterSignup

### Cleanup
- Delete deprecated component files after verifying no other imports
- Update barrel `index.ts` to final export list
- Remove unused i18n keys from message files

### Responsive Verification
- Test all sections at 375px (mobile), 768px (tablet), 1024px+1440px (desktop)
- Verify no horizontal overflow on any breakpoint
- Verify touch scroll on carousel sections
- Verify tab interactions work on touch devices

### Testing
- Update/delete CategoryNav test
- Add basic render tests for new components
- Verify existing test suite passes

## Architecture

### New page.tsx Structure
```tsx
import { TravelAgencySchema } from '@/components/seo'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import {
  HeroSection,
  TrustSignals,
  VideoSection,
  ToursCarousel,
  Testimonials,
  SeasonalTabs,
  GuidesSection,
  BlogSection,
  NewsletterSignup,
} from '@/components/home'

export default async function HomePage() {
  return (
    <>
      <TravelAgencySchema />
      <Header />
      <main>
        <HeroSection />
        <TrustSignals />
        <VideoSection />
        <ToursCarousel />
        <Testimonials />
        <SeasonalTabs />
        <GuidesSection />
        <BlogSection />
        <NewsletterSignup />
      </main>
      <Footer />
    </>
  )
}
```

### Final Barrel Export (index.ts)
```ts
export { HeroSection } from './hero-section'
export { TrustSignals } from './trust-signals'
export { VideoSection } from './video-section'
export { ToursCarousel } from './tours-carousel'
export { TourCard } from './tour-card'
export { Testimonials } from './testimonials'
export { SeasonalTabs } from './seasonal-tabs'
export { GuidesSection } from './guides-section'
export { GuideCard } from './guide-card'
export { BlogSection } from './blog-section'
export { BlogCard } from './blog-card'
export { NewsletterSignup } from './newsletter-signup'
```

## Related Code Files

### MODIFY
- `apps/web/app/(site)/[locale]/(frontend)/page.tsx` - new section order + imports
- `apps/web/components/home/index.ts` - final export list

### DELETE
- `apps/web/components/home/featured-tours.tsx` - replaced by tours-carousel + tour-card
- `apps/web/components/home/find-tour-cta.tsx` - removed (hero CTA + video section replace it)
- `apps/web/components/home/category-nav.tsx` - replaced by seasonal-tabs
- `apps/web/components/home/why-choose-us.tsx` - replaced by guides-section
- `apps/web/components/home/__tests__/category-nav.test.tsx` - component deleted

### CREATE
- `apps/web/components/home/__tests__/hero-section.test.tsx`
- `apps/web/components/home/__tests__/tours-carousel.test.tsx`
- `apps/web/components/home/__tests__/seasonal-tabs.test.tsx`
- `apps/web/components/home/__tests__/newsletter-signup.test.tsx`

## Implementation Steps

1. **Verify no other imports** of deprecated components:
   ```bash
   grep -r "FindTourCta\|CategoryNav\|WhyChooseUs\|FeaturedTours" apps/web/ --include="*.tsx" --include="*.ts" -l
   ```
   Should only return: `page.tsx`, `index.ts`, old test file, and the component files themselves.

2. **Update `page.tsx`** with new imports and section order (see Architecture above).
   - Keep `generateMetadata` unchanged
   - Keep `TravelAgencySchema`, `Header`, `Footer` unchanged

3. **Finalize `index.ts`** barrel export (see Architecture above).
   - Remove: `FeaturedTours`, `FindTourCta`, `CategoryNav`, `WhyChooseUs`
   - Add all new components

4. **Delete deprecated files**:
   - `apps/web/components/home/featured-tours.tsx`
   - `apps/web/components/home/find-tour-cta.tsx`
   - `apps/web/components/home/category-nav.tsx`
   - `apps/web/components/home/why-choose-us.tsx`
   - `apps/web/components/home/__tests__/category-nav.test.tsx`

5. **Create test files** (basic render tests):

   **`hero-section.test.tsx`** (~40 LOC):
   - Mock `next-intl`, `next/image`, `@/i18n/navigation`
   - Verify section renders with aria-label
   - Verify H1 renders
   - Verify CTA link renders with `/tours` href

   **`tours-carousel.test.tsx`** (~40 LOC):
   - Mock IntersectionObserver
   - Verify section renders
   - Verify tour cards render (3 cards)
   - Verify "View All Tours" link

   **`seasonal-tabs.test.tsx`** (~50 LOC):
   - Verify section renders
   - Verify 4 tab buttons render
   - Verify clicking a tab changes content (fireEvent.click)
   - Verify default tab is active

   **`newsletter-signup.test.tsx`** (~50 LOC):
   - Verify form renders with email input
   - Verify submit button renders
   - Verify form submission shows success message (fireEvent.submit)
   - Verify email input has `type="email"` and `required`

6. **Run full test suite**:
   ```bash
   cd apps/web && npx vitest run
   ```
   - Fix any broken tests from component changes
   - Ensure all new tests pass

7. **Responsive spot-check** (manual or with dev tools):
   - 375px: all sections single-column, carousel scrolls, tabs fit
   - 768px: 2-col grids where specified, carousel shows 2 cards
   - 1024px: full desktop layout, 3-col grids
   - 1440px: max-width container centered, no stretch

8. **Verify build** compiles:
   ```bash
   cd apps/web && npx next build
   ```

9. **Clean up unused i18n keys** from message files:
   - Remove keys for: `home.categories.*` (CategoryNav)
   - Remove keys for: `home.whyChooseUs.*` (WhyChooseUs)
   - Keep `home.hero.*` (updated in Phase 1)
   - Keep `home.trust.*` (updated in Phase 2)

## Todo List
- [x] Verify no external imports of deprecated components
- [x] Update page.tsx section order and imports
- [x] Finalize index.ts barrel export
- [x] Delete deprecated component files (4 components + 1 test)
- [x] Remove unused i18n keys from en/sv/de
- [x] Create hero-section.test.tsx
- [x] Create tours-carousel.test.tsx
- [x] Create seasonal-tabs.test.tsx
- [x] Create newsletter-signup.test.tsx
- [x] Run vitest - all tests pass (769/769)
- [x] Run next build - compiles without errors
- [x] Manual responsive check at 375/768/1024/1440px

## Success Criteria
- `page.tsx` renders all 9 new/updated sections in correct order
- No imports of deleted components anywhere in codebase
- All new tests pass
- Full test suite passes (no regressions)
- Build compiles without errors
- No horizontal overflow at any breakpoint
- All 3 locales render correctly

## Risk Assessment
- **Medium:** Deleting 4 components is destructive; verify no other consumers first
- **Low:** Test mocking patterns already established in category-nav.test.tsx
- **Low:** i18n key removal is safe; unused keys cause no runtime errors

## Security Considerations
- No new security surface in this phase
- Ensure deleted components don't leave orphaned API routes or data fetchers

## Next Steps
- Plan complete. After all phases: update `docs/design-guidelines.md` Homepage Sections
- Future: integrate blog CMS collection, newsletter API route, CMS-driven guide data
