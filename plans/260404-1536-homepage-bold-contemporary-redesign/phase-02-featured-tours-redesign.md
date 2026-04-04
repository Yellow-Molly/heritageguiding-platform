# Phase 2: Featured Tours Redesign

## Context Links
- [Design Specs — Featured Tours](research/researcher-01-design-specs.md) (line 49+)
- [Plan Overview](plan.md)
- Phase 1 must complete first (translation keys `featured.tag`, `featured.viewTour` required)

## Overview
- **Priority**: P1
- **Status**: Complete
- **Effort**: 2.5h
- **Description**: Complete redesign of FeaturedTours section — portrait cards to landscape, new meta row, section tag, left-aligned header, warm background, vertical stack on mobile.

## Key Insights
- Current: Portrait 3:4 cards, star ratings, price, "Read More", horizontal scroll mobile
- New: Landscape cards, description text, clock+users meta, "VIEW TOUR" CTA, vertical stack mobile
- `FeaturedTour` type already has `duration` and `maxCapacity` — no API/type changes needed
- `FeaturedTour` has `description` field — currently unused in card, needed for new design
- Section background changes from white to `#FAFAF8` (`var(--color-background)`)
- Card border radius stays `rounded-xl` (design shows rounded corners)
- Star rating and price row REMOVED from card design
- IntersectionObserver animation pattern KEPT (existing UX feature)

## Requirements

### Functional
- Section header: "EXPERIENCES" tag + title + subtitle, left-aligned
- Cards: landscape layout (image left or top depending on breakpoint)
- Card image: 320px height desktop, 220px height mobile
- Card body: title (Playfair 22px), description (Inter 14px, #6B7280, line-height 1.6), meta row (duration + group size), "VIEW TOUR" CTA
- Mobile: cards stack vertically, full-width, 220px image height
- Desktop: 3-column grid preserved
- Background: `var(--color-background)` (#FAFAF8)
- Section padding: 80px all sides desktop, 40px 16px mobile

### Non-functional
- WCAG: Use `var(--color-secondary)` for gold text on light bg, `var(--color-accent)` for coral CTA text
- Touch targets: CTA link area >= 44x44px
- Reduced motion: skip card entrance animations
- Images: proper `sizes` attribute for landscape dimensions

## Architecture

### Card Component Data Flow
```
FeaturedTour (from CMS)
  |-- title          -> <h3> Playfair 22px navy
  |-- description    -> <p> Inter 14px gray (NEW - was unused)
  |-- duration       -> Meta row: clock icon + "{duration}h" (NEW display)
  |-- maxCapacity    -> Meta row: users icon + "Up to {maxCapacity}" (NEW display)
  |-- slug           -> Link href="/tours/{slug}"
  |-- image.url      -> <Image> height 320px desktop / 220px mobile
  |-- image.alt      -> alt text
  |
  NOT USED in new design:
  |-- rating, reviewCount, price, featured
```

### Component Structure
```
FeaturedTours (section wrapper)
  |- Section tag: "EXPERIENCES"
  |- Section title (h2)
  |- Section subtitle
  |- Grid container (3-col desktop, 1-col mobile)
  |    |- TourCard (landscape)
  |    |    |- Image container (h-[320px] md / h-[220px] mobile)
  |    |    |- Body (p-4 md:p-6)
  |    |    |    |- Title (h3)
  |    |    |    |- Description (truncated to 2 lines)
  |    |    |    |- Meta row (clock + duration, users + capacity)
  |    |    |    |- CTA: "VIEW TOUR" + arrow
  |- "View All Tours" button (keep existing)
```

## Related Code Files

### Modify
- `apps/web/components/home/featured-tours.tsx` — complete redesign of TourCard + FeaturedTours

### Read Only (for reference)
- `apps/web/lib/api/get-featured-tours.ts` — FeaturedTour type definition
- `apps/web/messages/en.json` — translation keys (added in Phase 1)

## Implementation Steps

### 1. Redesign TourCard component
Replace current TourCard with landscape layout:

```tsx
function TourCard({ tour, index }: { tour: FeaturedTour; index: number }) {
  const t = useTranslations('home.featured')
  const cardRef = useRef<HTMLAnchorElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  // Keep existing IntersectionObserver animation logic

  return (
    <Link
      ref={cardRef}
      href={`/tours/${tour.slug}`}
      className={cn(
        'group block overflow-hidden rounded-xl border border-gray-100 bg-white',
        'shadow-sm hover:shadow-md transition-shadow duration-300',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      )}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Landscape image */}
      <div className="relative h-[220px] md:h-[320px] overflow-hidden">
        <Image ... />
      </div>

      {/* Card body */}
      <div className="flex flex-col gap-2 p-4 md:gap-3 md:p-6">
        <h3 className="font-serif text-lg font-semibold text-[var(--color-primary)] md:text-[22px]">
          {tour.title}
        </h3>

        <p className="line-clamp-2 text-[13px] leading-[1.5] text-[#6B7280] md:text-sm md:leading-[1.6]">
          {tour.description}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-4 text-[13px] text-[#6B7280]">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {tour.duration}h
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {t('upTo')} {tour.maxCapacity}
          </span>
        </div>

        {/* VIEW TOUR CTA */}
        <span className="inline-flex items-center gap-1 text-[13px] font-bold uppercase tracking-[1px] text-[var(--color-accent)] transition-colors group-hover:underline">
          {t('viewTour')}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  )
}
```

### 2. Redesign section header
Replace centered header with left-aligned tag + title + subtitle:

```tsx
<div className="mb-10 md:mb-12">
  <span className="text-[10px] font-bold uppercase tracking-[3px] text-[var(--color-secondary)] md:text-[11px]">
    {t('tag')}
  </span>
  <h2 className="mt-2 font-serif text-[28px] font-bold text-[var(--color-primary)] md:text-[42px]">
    {t('subtitle')}
  </h2>
  <p className="mt-2 text-sm text-[#6B7280] md:text-[15px]">
    {t('title')}
  </p>
</div>
```

### 3. Update section wrapper
- Background: `bg-[var(--color-background)]` instead of `bg-white`
- Padding: `px-4 py-10 md:px-20 md:py-20` (80px all sides desktop, 40px/16px mobile)
- Remove `container mx-auto` (section padding handles layout directly)

### 4. Update grid layout
- Remove horizontal scroll / snap behavior on mobile
- Desktop: keep `md:grid-cols-3 gap-6`
- Mobile: `grid grid-cols-1 gap-6` (vertical stack, full-width)

### 5. Update imports
- Remove `Star` from lucide imports
- Remove `formatPrice` import
- Add `Clock`, `Users` from lucide-react

### 6. Add "upTo" translation key
Add to all 3 locale files under `home.featured`:
- en: `"upTo": "Up to"`
- sv: `"upTo": "Upp till"`
- de: `"upTo": "Bis zu"`

### 7. Verify
- `npm run lint`
- `npm run test`
- Visual check: desktop 3-col landscape cards, mobile vertical stack
- Check all 3 locales

## Todo List
- [x] Replace TourCard with landscape layout
- [x] Update section header (left-aligned with tag)
- [x] Change section background to var(--color-background)
- [x] Update section padding to 80px desktop / 40px+16px mobile
- [x] Replace horizontal scroll with vertical grid on mobile
- [x] Update lucide imports (remove Star, add Clock/Users)
- [x] Remove formatPrice import
- [x] Add description text to card body
- [x] Add meta row (duration + capacity)
- [x] Replace "Read More" with "VIEW TOUR" CTA
- [x] Add "upTo" translation key to all 3 locales
- [x] Use WCAG-safe CSS vars for colors
- [x] Run lint
- [x] Run tests
- [x] Visual verification (desktop + mobile, all locales)

## Success Criteria
- Cards display landscape with image top, body below
- Description text visible (2-line clamp)
- Duration and group size shown in meta row
- "VIEW TOUR" CTA in coral (using `--color-accent`)
- Section has warm #FAFAF8 background
- Mobile: single-column stack, no horizontal scroll
- No lint errors
- No test regressions

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `description` field empty for some tours | Medium | Medium | Use `line-clamp-2` + test with empty string (graceful collapse) |
| `maxCapacity` undefined for some tours | Low | Medium | Add optional chaining + conditional render |
| Image aspect ratio distortion | Low | Medium | `object-cover` + fixed height container |
| Card too tall on desktop with long descriptions | Low | Low | `line-clamp-2` limits to 2 lines max |

## Security Considerations
- No user input changes
- Tour data already sanitized by CMS
- Image URLs validated by Next.js Image component

## Next Steps
- Phase 4 (WCAG Audit) runs after this phase completes
- Consider adding skeleton loading state for tour cards (future enhancement, not in scope)
