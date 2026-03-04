# Code Review: Homepage Redesign (StePI Style)

**Reviewer:** code-reviewer
**Date:** 2026-03-04
**Scope:** Homepage components redesign - dark/gold premium aesthetic

---

## Scope

- **Files reviewed:** 10 (8 in `components/home/`, 1 in `components/layout/`, 1 page.tsx)
- **LOC:** ~1,060 across all files
- **Focus:** Full review of all modified/created homepage components
- **Scout findings:** CSP violation, i18n gaps, design token bypass, hydration risk, accessibility gaps

## Overall Assessment

Solid visual redesign with clean component structure, good use of semantic HTML sections, proper `aria-label` attributes, and correct next/image usage. However, several **critical issues** exist: a CSP header that blocks the YouTube iframe, missing i18n for most hardcoded English strings, and systematic bypassing of the design token system. The parallax effect in hero lacks reduced-motion handling and the testimonials carousel is missing essential ARIA live-region attributes.

---

## Critical Issues

### 1. CSP `frame-src` blocks YouTube embed (BROKEN FEATURE)

**File:** `C:\Data\Project\DMC\source\heritageguiding-platform\apps\web\next.config.ts` line 100
**File:** `C:\Data\Project\DMC\source\heritageguiding-platform\apps\web\components\home\video-highlight.tsx` line 90

The video-highlight component embeds `https://www.youtube.com/embed/...` but the Content-Security-Policy only allows:
```
frame-src 'self' https://www.bubblav.com
```

YouTube iframes will be **silently blocked** by the browser. This is the highest-priority fix.

**Fix:** Update CSP in `next.config.ts`:
```typescript
"frame-src 'self' https://www.bubblav.com https://www.youtube.com",
```

Also add `https://www.youtube.com` to `img-src` (for poster images) and consider `connect-src` if using YouTube API.

### 2. Footer uses `next/link` instead of i18n Link (LOCALE BYPASS)

**File:** `C:\Data\Project\DMC\source\heritageguiding-platform\apps\web\components\layout\footer.tsx` lines 3, 92, 149

```typescript
import Link from 'next/link'  // WRONG
```

All internal links in the footer (brand logo, tours, support, company, legal columns) will produce URLs **without locale prefix**, breaking i18n routing. Every `<Link>` in this file navigates to e.g. `/tours/gamla-stan-walking` instead of `/en/tours/gamla-stan-walking`.

**Fix:** Replace with:
```typescript
import { Link } from '@/i18n/navigation'
```

### 3. Hero heading hardcoded, not in i18n

**File:** `C:\Data\Project\DMC\source\heritageguiding-platform\apps\web\components\home\hero-section.tsx` lines 63-66

```tsx
<h1>Adventures in<br />Stockholm</h1>
```

The hero heading is hardcoded English. The i18n key `home.hero.title` exists in all 3 locales ("Discover Stockholm's Rich Heritage" / "Upptack Stockholms Rika Kulturarv" / "Entdecken Sie Stockholms Reiches Erbe") but is **not used**. Swedish and German visitors see English text.

**Fix:**
```tsx
<h1>{t('home.hero.title')}</h1>
```

---

## High Priority

### 4. Pervasive hardcoded strings -- no i18n in 7 of 8 components

Only `hero-section.tsx` imports `useTranslations`. The following components have English-only hardcoded text:

| Component | Hardcoded strings |
|-----------|------------------|
| `trust-signals.tsx` | "Why Travel With Us", all stat labels/descriptions |
| `featured-tours.tsx` | "Most Popular Tours", "Discover our most loved...", "Read More", "View All Tours", "From" |
| `video-highlight.tsx` | "Watch Our Video" |
| `seasonal-cta.tsx` | "Let's Travel All Year Round", "Discover seasonal...", "Winter Tours", "Summer Tours", "Book Now" |
| `guides-preview.tsx` | "Meet Our Guides", "Meet All Guides", guide names/specialties |
| `testimonials.tsx` | "Testimonials", "What Travelers Say", all testimonial text |
| `latest-posts.tsx` | "Latest From Our Blog", "Read More", blog titles/excerpts |
| `footer.tsx` | "Stay Updated", "Subscribe", all section titles, all link names, "Private Tours" |

Many of these have **existing i18n keys** (e.g., `home.featured.title`, `home.testimonials.title`, `home.trust.*`) that are simply not being used.

**Impact:** Swedish and German site visitors see fully English homepage.

### 5. Parallax effect ignores `prefers-reduced-motion`

**File:** `C:\Data\Project\DMC\source\heritageguiding-platform\apps\web\components\home\hero-section.tsx` lines 13-27

The JS-driven parallax scroll handler runs unconditionally. The scroll-indicator button correctly uses `motion-reduce:animate-none` (line 85) but the parallax transform does not check `prefers-reduced-motion`.

**Fix:**
```typescript
useEffect(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (prefersReducedMotion) return

  const handleScroll = () => { /* ... */ }
  // ...
}, [])
```

### 6. Count-up animation in trust-signals ignores reduced motion

**File:** `C:\Data\Project\DMC\source\heritageguiding-platform\apps\web\components\home\trust-signals.tsx` lines 45-75

The `useCountUp` hook uses `requestAnimationFrame` with no reduced-motion check. Users who prefer reduced motion still see 2-second number animations.

**Fix:** Check `prefers-reduced-motion` and if true, immediately set final value:
```typescript
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  setCount(target)
  return
}
```

### 7. Testimonials carousel missing ARIA live region

**File:** `C:\Data\Project\DMC\source\heritageguiding-platform\apps\web\components\home\testimonials.tsx`

The auto-playing carousel has:
- No `aria-live="polite"` on the slide container
- No `role="group"` with `aria-roledescription="slide"` per slide
- No `role="region"` with `aria-roledescription="carousel"` on the wrapper
- Auto-play does not pause for screen reader focus (only mouse hover pauses it)

Screen readers cannot announce slide transitions or provide navigation context.

**Fix:** Add at minimum:
```tsx
<div role="region" aria-roledescription="carousel" aria-label="Customer testimonials">
  <div aria-live="polite">
    {/* current testimonial */}
  </div>
</div>
```

Also pause auto-play on `onFocus` and resume on `onBlur`.

### 8. `Testimonials` component exceeds 200-line guideline (216 lines)

**File:** `C:\Data\Project\DMC\source\heritageguiding-platform\apps\web\components\home\testimonials.tsx`

Per project code standards, code files should be under 200 lines. At 216 lines, this is a minor overshoot but the testimonial data array (lines 18-55, 37 lines) should be extracted to a separate data file or fetched from CMS.

### 9. Hydration risk: `new Date().getFullYear()` in footer

**File:** `C:\Data\Project\DMC\source\heritageguiding-platform\apps\web\components\layout\footer.tsx` line 55

```typescript
const currentYear = new Date().getFullYear()
```

In a `'use client'` component, if the server renders at 23:59:59 Dec 31 and the client hydrates at 00:00:01 Jan 1, the year will differ causing a hydration mismatch. Low probability but known Next.js gotcha.

**Fix:** Use `suppressHydrationWarning` on the element or compute server-side.

### 10. `formatDate` hardcoded to `en-US` locale

**File:** `C:\Data\Project\DMC\source\heritageguiding-platform\apps\web\components\home\latest-posts.tsx` lines 41-47

```typescript
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { ... })
}
```

Swedish visitors see "February 28, 2026" instead of "28 februari 2026". Should use the current locale from next-intl.

---

## Medium Priority

### 11. 64+ hardcoded hex colors bypass design token system

All components use raw hex values (`#252525`, `#d0ad50`, `#DBC078`, `#e6d3a0`, `#3e3e3e`, `#0b0b0b`, `#F7F7F5`) instead of CSS custom properties from `globals.css`. The design system defines `--color-primary`, `--color-secondary`, `--color-text`, etc., but none are referenced.

**Impact:** Theme changes require touching every file. Inconsistent color palette between homepage and rest of site (design system uses `#1E3A5F` navy blue, `#C4A052` gold; components use `#d0ad50` gold, `#252525` charcoal).

**Recommendation:** Create Tailwind theme tokens in the `@theme` block for the new gold palette or map them to existing CSS variables. At minimum, extract to constants.

### 12. IntersectionObserver duplicated across 3 components

Pattern duplicated in:
- `trust-signals.tsx` (lines 100-116)
- `featured-tours.tsx` / TourCard (lines 50-66)
- `testimonials.tsx` (lines 77-87)

Each has identical observer setup with minor threshold differences.

**Recommendation:** Extract a `useInView(ref, options)` custom hook.

### 13. Featured tours / blog data hardcoded -- no CMS integration path

Components `featured-tours.tsx`, `guides-preview.tsx`, `latest-posts.tsx`, and `testimonials.tsx` all contain hardcoded placeholder data arrays. Comments note "CMS integration deferred" but there is no TODO tracking, no interface aligning with CMS schema, and tour IDs (`gamla-stan-walking`, `royal-palace`) may not match actual CMS slugs.

### 14. Newsletter form is non-functional

**File:** `C:\Data\Project\DMC\source\heritageguiding-platform\apps\web\components\layout\footer.tsx` line 69

```typescript
<form onSubmit={(e) => e.preventDefault()}>
```

The newsletter form prevents submission and does nothing. No loading state, no error handling, no success feedback. Should either be connected to a backend endpoint or removed to avoid misleading users.

### 15. Language selector in footer is non-functional

**File:** `C:\Data\Project\DMC\source\heritageguiding-platform\apps\web\components\layout\footer.tsx` lines 170-178

The `<select>` has no `onChange` handler and no connection to next-intl's locale switching. It renders but does nothing.

### 16. Video is a placeholder (Rick Roll)

**File:** `C:\Data\Project\DMC\source\heritageguiding-platform\apps\web\components\home\video-highlight.tsx` line 90

```
src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0"
```

This is a Rick Roll video. Obviously a placeholder but should be documented with a TODO or replaced.

### 17. `dialog` element Escape handler is redundant

**File:** `C:\Data\Project\DMC\source\heritageguiding-platform\apps\web\components\home\video-highlight.tsx` lines 26-32

The native `<dialog>` element already handles Escape key to close. The manual `keydown` listener is redundant and may cause a double-close if the dialog's native `cancel` event is also handled. Remove the custom handler or add `e.preventDefault()` on the dialog's `cancel` event.

### 18. Social links point to generic platform URLs

**File:** `C:\Data\Project\DMC\source\heritageguiding-platform\apps\web\components\layout\footer.tsx` lines 47-52

```typescript
{ name: 'Facebook', icon: Facebook, href: 'https://facebook.com' },
```

These link to `facebook.com`, `instagram.com`, etc. -- not the company's actual profiles. Should be environment variables or CMS-driven.

---

## Low Priority

### 19. Unsplash images used in production components

Multiple components reference `images.unsplash.com`. While `remotePatterns` allows this, Unsplash hotlinking may have rate limits or require attribution. Consider downloading and self-hosting final production images.

### 20. `key={index}` used in trust-signals stats map

**File:** `C:\Data\Project\DMC\source\heritageguiding-platform\apps\web\components\home\trust-signals.tsx` line 133

```tsx
<StatCard key={index} stat={stat} isVisible={isVisible} />
```

Static array so this is functionally fine, but `stat.label` would be more descriptive.

### 21. Missing `loading="lazy"` awareness for below-fold images

Featured tours, guides, testimonials, and blog post images all use `next/image` without explicit `loading="lazy"` (it defaults to lazy in Next.js) but also without `priority` flag. The hero image correctly uses `priority`. This is technically fine but worth verifying no LCP regression.

### 22. Seasonal CTA missing Spring/Autumn

Only Winter and Summer seasons are offered. If intentional, fine; if placeholder, it limits CTA effectiveness.

---

## Positive Observations

1. **Correct i18n Link usage** in hero, featured-tours, seasonal-cta, guides-preview, and latest-posts (import from `@/i18n/navigation`)
2. **Good semantic HTML** - every section has `aria-label`, headings follow hierarchy
3. **Proper `next/image`** usage with `fill`, `sizes`, and `priority` where appropriate
4. **Carousel** correctly pauses on mouse hover and has prev/next/dot navigation with ARIA labels
5. **Video lightbox** uses native `<dialog>` element with lazy-loaded iframe (good perf)
6. **Mobile horizontal scroll** in featured-tours with `snap-x snap-mandatory` is well implemented
7. **`scrollbar-hide`** utility already defined in globals.css and used correctly
8. **`formatPrice`** from `@/lib/utils` used correctly in featured-tours
9. **Clean barrel export** in `index.ts` with all 8 components
10. **Page component** is a proper server component with good SEO metadata generation

---

## Recommended Actions (Prioritized)

1. **[CRITICAL]** Add `https://www.youtube.com` to CSP `frame-src` in next.config.ts
2. **[CRITICAL]** Replace `import Link from 'next/link'` with `import { Link } from '@/i18n/navigation'` in footer.tsx
3. **[CRITICAL]** Replace hardcoded hero heading with `t('home.hero.title')`
4. **[HIGH]** Add `useTranslations` to all 7 remaining components; use existing i18n keys where available, add new keys where needed
5. **[HIGH]** Add `prefers-reduced-motion` check to parallax effect and count-up animation
6. **[HIGH]** Add ARIA live region and carousel roles to testimonials; pause auto-play on keyboard focus
7. **[MEDIUM]** Map hardcoded hex colors to CSS custom properties or Tailwind theme tokens
8. **[MEDIUM]** Extract shared IntersectionObserver pattern to `useInView` hook
9. **[MEDIUM]** Extract hardcoded data arrays to separate data files as prep for CMS integration
10. **[MEDIUM]** Fix `formatDate` in latest-posts to use current locale
11. **[LOW]** Remove redundant Escape key handler in video-highlight
12. **[LOW]** Replace placeholder video URL, social links, and non-functional newsletter/language selector

---

## Metrics

| Metric | Value |
|--------|-------|
| Files reviewed | 10 |
| Lines of code | ~1,060 |
| Critical issues | 3 |
| High priority | 7 |
| Medium priority | 8 |
| Low priority | 4 |
| Design token usage | 0% (all hardcoded hex) |
| i18n coverage | ~5% (1 of 8 components uses translations, partially) |
| Accessibility gaps | 3 (reduced-motion x2, carousel ARIA) |

---

## Unresolved Questions

1. Is the new gold color palette (`#d0ad50` / `#DBC078`) intentionally different from the design system's `--color-secondary: #C4A052`? If so, should the CSS custom properties be updated to match?
2. Are the placeholder data arrays (tours, guides, testimonials, blog posts) intended to remain hardcoded or should CMS integration be planned?
3. Should the footer be redesigned as a shared layout component (currently in `components/layout/` but imported directly in page.tsx instead of a layout)?
4. The deleted components (`find-tour-cta.tsx`, `category-nav.tsx`, `why-choose-us.tsx`) -- are there any remaining test files that import them?
