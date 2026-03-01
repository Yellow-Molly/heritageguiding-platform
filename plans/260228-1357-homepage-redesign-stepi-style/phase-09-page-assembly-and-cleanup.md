# Phase 09: Page Assembly + Cleanup

## Context Links
- [Plan Overview](./plan.md)
- [Current page.tsx](../../apps/web/app/(site)/[locale]/(frontend)/page.tsx) (72 lines)
- [Current index.ts](../../apps/web/components/home/index.ts) (7 exports)

## Overview
- **Priority:** P1
- **Status:** complete
- **Description:** Update homepage page.tsx with new section order, add new component imports, remove deprecated components. Clean up barrel export file. Delete or deprecate removed component files.

## Key Insights
- page.tsx is a server component (no `'use client'`) -- keeps it that way
- Current imports: HeroSection, TrustSignals, FeaturedTours, FindTourCta, WhyChooseUs, Testimonials, CategoryNav
- New imports: VideoSection, SeasonalTabs, MeetOurGuides
- Remove imports: FindTourCta, WhyChooseUs, CategoryNav
- Keep TravelAgencySchema for SEO
- Keep Header/Footer imports from layout

## Requirements

### Functional
- New section order in page.tsx:
  1. TravelAgencySchema (SEO, invisible)
  2. Header
  3. HeroSection
  4. TrustSignals
  5. VideoSection (NEW)
  6. FeaturedTours
  7. Testimonials
  8. SeasonalTabs (NEW)
  9. MeetOurGuides (NEW)
  10. Footer
- Update `index.ts` barrel exports
- Remove or keep deprecated files (don't delete -- mark as deprecated for safe rollback)

### Non-Functional
- page.tsx stays < 80 lines
- Clean imports, no unused imports
- Maintain generateMetadata for SEO

## Architecture
Modify `page.tsx` (server component) and `index.ts` (barrel exports). No new files created in this phase.

## Related Code Files
- **Modify:** `apps/web/app/(site)/[locale]/(frontend)/page.tsx`
- **Modify:** `apps/web/components/home/index.ts`
- **Deprecate (keep but unused):**
  - `apps/web/components/home/find-tour-cta.tsx`
  - `apps/web/components/home/why-choose-us.tsx`
  - `apps/web/components/home/category-nav.tsx`

## Implementation Steps

1. Update `apps/web/components/home/index.ts`:
   ```tsx
   export { HeroSection } from './hero-section'
   export { TrustSignals } from './trust-signals'
   export { VideoSection } from './video-section'
   export { FeaturedTours } from './featured-tours'
   export { Testimonials } from './testimonials'
   export { SeasonalTabs } from './seasonal-tabs'
   export { MeetOurGuides } from './meet-our-guides'
   // Deprecated: FindTourCta, WhyChooseUs, CategoryNav
   ```

2. Update `apps/web/app/(site)/[locale]/(frontend)/page.tsx`:
   ```tsx
   import type { Metadata } from 'next'
   import { getTranslations } from 'next-intl/server'
   import { Header } from '@/components/layout/header'
   import { Footer } from '@/components/layout/footer'
   import { HeroSection } from '@/components/home/hero-section'
   import { TrustSignals } from '@/components/home/trust-signals'
   import { VideoSection } from '@/components/home/video-section'
   import { FeaturedTours } from '@/components/home/featured-tours'
   import { Testimonials } from '@/components/home/testimonials'
   import { SeasonalTabs } from '@/components/home/seasonal-tabs'
   import { MeetOurGuides } from '@/components/home/meet-our-guides'
   import { TravelAgencySchema } from '@/components/seo'

   // ... generateMetadata unchanged ...

   export default async function HomePage() {
     return (
       <>
         <TravelAgencySchema />
         <Header />
         <main>
           <HeroSection />
           <TrustSignals />
           <VideoSection />
           <FeaturedTours />
           <Testimonials />
           <SeasonalTabs />
           <MeetOurGuides />
         </main>
         <Footer />
       </>
     )
   }
   ```

3. Remove unused imports (FindTourCta, WhyChooseUs, CategoryNav)
4. Add deprecation comment to top of removed component files:
   ```tsx
   // @deprecated - Removed in homepage redesign (Phase 09). Kept for reference.
   ```
5. Run `npm run build` to verify no import errors
6. Run `npm run lint` to verify no unused imports

## Todo List
- [x] Update index.ts barrel exports (add 3 new, remove 3 old)
- [x] Update page.tsx imports
- [x] Update page.tsx section order
- [x] Add deprecation comments to removed component files
- [x] Verify build passes
- [x] Verify lint passes (no unused imports)
- [x] Visual QA: all sections render in correct order

## Success Criteria
- page.tsx renders all 7 sections in correct order
- No import errors or unused imports
- Build and lint pass
- Deprecated files have clear comments
- Page loads correctly on dev server

## Risk Assessment
- **Low:** Straightforward import/export changes
- **Note:** Existing test `category-nav.test.tsx` may fail -- update test or mark as skipped
- **Mitigation:** Test file references removed component; update in Phase 11

## Security Considerations
None.

## Next Steps
Phase 10 (Header/Footer colors) and Phase 11 (i18n/testing) complete the redesign.
