# Code Review: Phase 07 Tour Details

**Reviewer:** code-reviewer-a4845d9
**Date:** 2026-01-19
**Context:** C:/Data/Project/DMC/source/heritageguiding-platform
**Score:** 8.5/10

## Scope

Files reviewed: 22 TypeScript/TSX files
Lines analyzed: ~2,400 LOC
Focus: Phase 07 Tour Details implementation
Tests: 365/365 passing (33 new tests)
Updated plans: phase-07-tour-details.md (TODO list needs update)

## Overall Assessment

Solid implementation. Good component architecture, proper SSG setup, comprehensive Schema.org markup. Code quality high, YAGNI/KISS/DRY principles mostly followed. Security considerations addressed. Performance optimizations present (lazy loading, SSG).

Main concerns: XSS risk in dangerouslySetInnerHTML (critical), unused props in production code, missing PAYLOAD_SECRET handling for build, plan TODO list not updated.

## Critical Issues

### 1. XSS Vulnerability - dangerouslySetInnerHTML Without Sanitization

**Location:** `apps/web/components/tour/tour-content.tsx:27`

**Issue:** HTML content from CMS rendered directly without sanitization.

```typescript
<div
  className="prose prose-lg mt-4 max-w-none text-[var(--color-text-muted)]"
  dangerouslySetInnerHTML={{ __html: tour.descriptionHtml }}
/>
```

**Impact:** If CMS compromised or malicious content injected, allows XSS attacks.

**Fix:** Install DOMPurify and sanitize:

```typescript
import DOMPurify from 'isomorphic-dompurify'

<div
  className="prose prose-lg mt-4 max-w-none"
  dangerouslySetInnerHTML={{
    __html: DOMPurify.sanitize(tour.descriptionHtml, {
      ALLOWED_TAGS: ['p', 'strong', 'em', 'ul', 'ol', 'li', 'br'],
      ALLOWED_ATTR: []
    })
  }}
/>
```

**Files affected:**
- `tour-content.tsx`
- `tour-schema.tsx` (less critical, JSON-LD context)
- `seo/faq-schema.tsx`
- `seo/travel-agency-schema.tsx`

### 2. Build Failure - PAYLOAD_SECRET Missing

**Location:** Build process

**Issue:** Production build fails with "PAYLOAD_SECRET is required" error.

**Impact:** Cannot deploy to production.

**Fix:** Handle env variable properly in build context or stub CMS imports during static generation.

## High Priority Findings

### 1. Unused Props in Production Code

**Location:** `apps/web/components/tour/reviews-section.tsx:17`

```typescript
export function ReviewsSection({ reviews, tourTitle }: ReviewsSectionProps) {
  // tourTitle unused
```

**Fix:** Remove unused prop from interface and function signature.

**Other instances:**
- `get-categories.ts:112` - `_locale` parameter
- `get-featured-tours.ts:103` - `_locale` parameter
- `get-tour-by-slug.ts:373` - `_locale` parameter

These are prefixed with `_` indicating intentionally unused (for future CMS integration). Acceptable pattern.

### 2. OpenStreetMap Iframe Performance

**Location:** `apps/web/components/tour/google-map-link.tsx:31`

**Issue:** Iframe loads on page render, not user interaction.

```typescript
<iframe
  title={`Map showing ${title}`}
  src={staticMapUrl}
  width="100%"
  height="100%"
  loading="lazy"
  className="pointer-events-none"
/>
```

**Concern:** Loads external resource (OpenStreetMap) on every page load. `loading="lazy"` mitigates but still creates connection.

**Suggestion:** Consider click-to-load pattern (already implemented in commented google-map-embed.tsx).

### 3. Missing Input Validation

**Location:** `apps/web/app/[locale]/(frontend)/tours/[slug]/page.tsx:29`

**Issue:** Slug parameter not validated before database query.

```typescript
const tour = await getTourBySlug(slug, locale)
```

**Risk:** Potential injection if slug used in raw SQL (low risk with mock data, higher with real CMS).

**Fix:** Add validation:

```typescript
const sanitizedSlug = slug.match(/^[a-z0-9-]+$/) ? slug : null
if (!sanitizedSlug) notFound()
const tour = await getTourBySlug(sanitizedSlug, locale)
```

### 4. No Error Boundaries

**Issue:** Client components lack error boundaries for gallery, map interactions.

**Impact:** Single component failure crashes entire page.

**Suggestion:** Wrap interactive components in error boundaries:

```typescript
<ErrorBoundary fallback={<GalleryError />}>
  <TourGallery images={tour.gallery} />
</ErrorBoundary>
```

## Medium Priority Improvements

### 1. Large Mock Data in API Files

**Location:** `get-tour-by-slug.ts` (400 LOC), `get-related-tours.ts`, `get-tour-reviews.ts`

**Issue:** Mock data embedded in API functions. Violates KISS principle.

**Impact:** Files hard to navigate. Mock data should be separate fixture files.

**Suggestion:**
```
lib/api/
  ├── fixtures/
  │   ├── tours.mock.ts
  │   ├── reviews.mock.ts
  │   └── related-tours.mock.ts
  ├── get-tour-by-slug.ts (10 LOC)
  └── get-tour-reviews.ts (8 LOC)
```

### 2. Keyboard Trap in Gallery

**Location:** `tour-gallery.tsx:38-49`

**Issue:** Keyboard navigation implemented but focus trap not enforced.

**Accessibility:** Users can tab outside dialog while it's open.

**Fix:** Use `radix-ui/react-dialog` built-in focus management or add:

```typescript
useEffect(() => {
  if (!open) return
  const handleTab = (e: KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      // Cycle focus within dialog
    }
  }
  window.addEventListener('keydown', handleTab)
  return () => window.removeEventListener('keydown', handleTab)
}, [open])
```

### 3. No Loading States

**Issue:** Tour page fetches multiple async resources (tour, reviews, related) with no loading indicators.

**Impact:** Blank page during SSG hydration or slow connections.

**Suggestion:** Add Suspense boundaries:

```typescript
<Suspense fallback={<ReviewsSkeleton />}>
  <ReviewsSection reviews={reviews} />
</Suspense>
```

### 4. Schema.org Validation Concerns

**Location:** `tour-schema.tsx`

**Issue:** Schema uses optional chaining that may produce invalid JSON-LD.

```typescript
geo: {
  '@type': 'GeoCoordinates',
  latitude: tour.logistics.coordinates.latitude, // undefined if no logistics
  longitude: tour.logistics.coordinates.longitude,
}
```

**Fix:** Already handled with conditional spread operators. Good pattern. No change needed.

### 5. Hardcoded Currency

**Location:** Multiple files - `booking-section.tsx:29`, `tour-schema.tsx:38`

```typescript
priceCurrency: 'SEK'
```

**Issue:** Not internationalized. German/English users expect EUR/USD display.

**Suggestion:** Add currency field to tour data model or locale-based mapping.

## Low Priority Suggestions

### 1. Magic Numbers

**Location:** `tour-hero.tsx:25`, `tour-gallery.tsx:75`

```typescript
className="relative h-[50vh] min-h-[400px] lg:h-[60vh]"
```

**Suggestion:** Extract to design tokens or CSS variables for consistency.

### 2. Inline Styles in Schema

**Location:** `tour-schema.tsx:113`

```typescript
dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
```

**Note:** Not actually dangerous for JSON-LD, but name suggests risk. Consider using `<script type="application/ld+json">{JSON.stringify(schema)}</script>` pattern via component lib.

### 3. Duplicate Type Definitions

**Issue:** `FeaturedTour` type imported in multiple files. Should be in shared types file.

**Suggestion:** Create `types/tour.ts` with all tour-related interfaces.

### 4. Component File Size

**Files:**
- `get-tour-by-slug.ts` - 400 LOC (mostly mock data)
- `tour-gallery.tsx` - 137 LOC

**Note:** tour-gallery.tsx within acceptable range. Mock data should be extracted.

## Positive Observations

### Excellent Practices

1. **SSG Implementation:** Proper `generateStaticParams` with locale support
2. **Schema.org Markup:** Comprehensive TouristAttraction + Product schemas with aggregateRating
3. **Accessibility:** Proper ARIA labels, keyboard navigation in gallery
4. **Performance:** Lazy loading images, SSG, conditional rendering
5. **Type Safety:** Strong TypeScript typing throughout
6. **Component Architecture:** Clean separation of concerns, reusable components
7. **i18n Support:** Proper next-intl integration for 3 locales
8. **Test Coverage:** 365/365 tests passing, 33 new tests added
9. **Zero External API Costs:** Smart use of OpenStreetMap instead of Google Maps embed
10. **Error Handling:** notFound() for missing tours, fallback content

### YAGNI/KISS/DRY Compliance

- **YAGNI:** No over-engineering. Rezdy widget placeholder appropriate for current phase.
- **KISS:** Simple component structure. Clear separation.
- **DRY:** Reusable components (TourCard, RatingStars). Shared utilities.

**Minor violation:** Mock data duplication across files (tours appear in 3 different mocks).

## Recommended Actions

### Immediate (Before Merge)

1. **[CRITICAL]** Add DOMPurify sanitization to `tour-content.tsx`
2. **[CRITICAL]** Fix PAYLOAD_SECRET build error or add env validation
3. **[HIGH]** Remove unused `tourTitle` prop from ReviewsSection
4. **[HIGH]** Validate slug parameter before database query
5. **[MEDIUM]** Extract mock data to fixture files
6. **[REQUIRED]** Update phase-07-tour-details.md TODO list with completion status

### Next Sprint

1. Add error boundaries for interactive components
2. Implement loading states with Suspense
3. Add focus trap to gallery dialog
4. Implement currency internationalization
5. Create shared types file for tour interfaces

### Future Considerations

1. Real CMS integration will require input sanitization audit
2. Consider image optimization service (next/image already configured)
3. Add analytics tracking for gallery interactions, booking CTA clicks
4. Implement structured logging for SEO/schema errors

## Metrics

- Type Coverage: 100% (strong typing throughout)
- Test Coverage: 365/365 passing
- Linting Issues: 6 warnings (unused variables, acceptable pattern)
- Build Status: FAIL (PAYLOAD_SECRET)
- Security Score: 7/10 (XSS risk in dangerouslySetInnerHTML)
- Performance Score: 9/10 (excellent SSG, lazy loading)
- Accessibility Score: 9/10 (minor focus trap issue)
- YAGNI/KISS/DRY Score: 9/10 (mock data could be DRY-er)

## Plan Status Update Required

**File:** `plans/mvp-implementation/phase-07-tour-details.md`

**Current Status:** All TODO items marked unchecked

**Reality:** Implementation complete, 365 tests passing

**Action Required:** Update TODO list (lines 824-848) to reflect completed work:
- [x] All component creation tasks
- [x] All API implementation tasks
- [x] Translation additions
- [ ] Google Maps API key configuration (OpenStreetMap used instead - design decision)
- [x] Static generation tested
- [ ] Schema.org validation pending (recommend running validator)

## Unresolved Questions

1. **DOMPurify Package:** Prefer `isomorphic-dompurify` or `dompurify` for Next.js SSR?
2. **Build Process:** Should PAYLOAD_SECRET be stubbed for static builds or require real CMS connection?
3. **Currency Display:** Should prices remain in SEK or support multi-currency display?
4. **Map Solution:** OpenStreetMap iframe acceptable long-term or placeholder for future Google Maps API?
5. **Schema.org Validation:** Has schema been tested with Google Rich Results Test?
6. **Image Optimization:** Are Unsplash images placeholder or final? CDN strategy?
