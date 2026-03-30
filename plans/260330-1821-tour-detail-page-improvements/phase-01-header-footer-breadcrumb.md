# Phase 1: Add Header/Footer + Remove Breadcrumb

**Status:** DONE
**Priority:** High
**Effort:** Small

## Context

The tour detail page (`[slug]/page.tsx`) is the only frontend page missing Header and Footer components. All other pages (homepage, tours listing, FAQ, about, guides) include them. The breadcrumb at the top adds visual clutter — user wants it removed.

## Files to Modify

- `apps/web/app/(site)/[locale]/(frontend)/tours/[slug]/page.tsx`

## Implementation Steps

1. Add imports for `Header` and `Footer` from `@/components/layout/`
2. Remove `Breadcrumb` import and the `breadcrumbs` array variable
3. Remove the breadcrumb `<div className="container py-4">` block
4. Add `<Header />` before `<main>` (no variant needed — default transparent works with hero)
5. Add `<Footer />` after closing `</main>`

## Code Changes

```tsx
// ADD imports
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

// REMOVE import
// import { Breadcrumb } from '@/components/shared/breadcrumb'

// REMOVE breadcrumbs variable
// const breadcrumbs = [...]

// In JSX return:
return (
  <>
    <TourSchema tour={tour} reviews={reviews} />
    <Header />
    <main className="min-h-screen">
      {/* REMOVE breadcrumb div */}
      <TourHero tour={tour} />
      {/* ...rest unchanged... */}
    </main>
    <Footer />
  </>
)
```

## Success Criteria

- [x] Header renders at top of tour detail page
- [x] Footer renders at bottom of tour detail page
- [x] No breadcrumb visible
- [x] Page compiles without errors
