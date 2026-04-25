# Project Changelog

Complete record of significant changes, features, and releases.

---

## [2026-04-25] — Documentation Update ✓ COMPLETE

**Type:** Documentation & Version Updates
**Scope:** Updated all docs to reflect Phase 16 completion, version pins, cache revalidation strategy, staging blocking
**Build Status:** PASSING

### Changes
- README.md: Phase status → Phase 16, version pins (Next 16.2.3, Payload 3.81)
- codebase-summary.md: Tech stack updates, Phase 15-16 details, component/route counts
- code-standards.md: Added Phase 15-16 layout patterns (booking-first grid, split-panel sidebar, infinite scroll, cache revalidation pattern, image blur, IS_STAGING)
- system-architecture.md: Cache invalidation strategy, email services, staging blocking details
- project-overview-pdr.md: Phase 13-16 completion, current progress updated to Apr 25
- project-changelog.md: Added Apr 12-25 entries (per-tour cancellation, guide redesign, cache hooks, revalidation endpoint, tour/guides v2, IS_STAGING, cancellation policy, tour duration fix)

---

## [2026-04-19] — Per-Tour Cancellation Policy Planning ✓ IN PROGRESS

**Type:** Feature Planning
**Scope:** Per-tour cancellation policy implementation
**Build Status:** PLANNING

### Changes
- Created plan directory: 260419-1332-per-tour-cancellation-policy/

---

## [2026-04-18] — Guide Profile Redesign (Split-Panel Layout) ✓ COMPLETE

**Type:** Major UI/UX Redesign
**Scope:** Guide listing portrait gallery, guide detail split-panel sidebar, infinite scroll pagination
**Build Status:** PASSING

### Changes Implemented
- Guides listing: Portrait gallery layout (replaced card-based)
- Guide detail: Split-panel sidebar (160-200px avatar + info column)
- Infinite scroll pagination via IntersectionObserver (replaced numbered pagination)
- Guide profile migration for years_experience field
- Cache revalidation hook integration
- Image blur data_url migration

### Related Commits
- a8001bd: Guide profile redesign commit
- 5b6ef59: Guide profile migration commit

---

## [2026-04-14] — Guides Data v2 Update ✓ COMPLETE

**Type:** Data Migration
**Scope:** Guides data v2 schema and import updates
**Build Status:** PASSING

### Changes
- Guides data v2 update processing
- Delta import support for guides
- Plan: 260414-guides-data-v2-update/

---

## [2026-04-13] — Tour Data v2 Delta Import ✓ COMPLETE

**Type:** Data Migration
**Scope:** Tour data v2 schema changes and delta import pipeline
**Build Status:** PASSING

### Changes
- Tour data v2 update processing
- Delta import pipeline for bulk updates (vs full reimport)
- Commit: 6c7d6d3

---

## [2026-04-12] — Cancellation Policy Page + Cache Revalidation ✓ COMPLETE

**Type:** Feature Addition + Infrastructure
**Scope:** New cancellation policy page with i18n, cache revalidation hooks
**Build Status:** PASSING

### Changes Implemented

**Cancellation Policy Page:**
- New page route: /cancellation (or /[locale]/cancellation)
- Full i18n support: EN, SV, DE
- Responsive design matching brand
- Commit: 00630d3

**Cache Revalidation System:**
- CMS afterChange hook: `revalidate-cache-tags-hook` (packages/cms/hooks/)
- Listens for tour/guide/category saves → calls /api/revalidate
- On-demand /api/revalidate endpoint (apps/web/app/api/revalidate/route.ts)
- Token-based authentication (X-Revalidate-Token header)
- Invalidates Next.js ISR tags for guides, tours, categories
- Commit: ddfc0ea (cache invalidation hook), 5e5e0b4 (/api/revalidate endpoint)

**Guide Profile Migration:**
- Added years_experience field to guides collection
- Payload migration: 20260212+ (approximate)

**Tour Duration Format Fix:**
- Corrected tour duration format on home page featured tours cards
- Commit: a5dfae7

---

## [2026-04-05] — Staging Crawler Blocking (IS_STAGING) ✓ COMPLETE

**Type:** SEO Infrastructure
**Scope:** Environment-based crawler blocking for staging environment
**Build Status:** PASSING

### Changes Implemented
- IS_STAGING environment variable (set on staging Vercel project only)
- robots.txt updated to disallow all crawlers when IS_STAGING=true
- Vercel headers configuration with X-Robots-Tag: noindex for staging
- Prevents search engine indexing of staging environment
- Commits: 202b562, 4f3128c

---

## [2026-04-04] — Tours Listing Redesign (Option B - Sidebar Filters) ✓ COMPLETE

**Type:** Major UI/UX Redesign
**Scope:** 2-column sidebar layout (desktop), horizontal cards (mobile), advanced filters
**Build Status:** PASSING (Next.js 16.2.3 Turbopack)

### Changes Implemented
- **Desktop Layout:** 260px fixed sidebar + flexible grid
- **Sidebar Filters:** Categories (multi-select), duration (single-select), price range (dual-thumb), accessibility
- **Page Header:** Full-width static bar with title, results, sort, view toggle
- **Mobile Design:** Filter header with search + pill, horizontal chips, updated filter drawer
- **Tour Cards:** Desktop vertical (180px image) vs mobile horizontal (130px height)
- **All filters:** URL-shareable params
- **Commit:** b552382

---

## [2026-04-02] — About Us Page Redesign ✓ COMPLETE

**Type:** Component Architecture Refactor
**Scope:** Split monolithic 187-line About page into 7 focused, reusable components
**Build Status:** PASSING (Next.js 16.2.3 Turbopack)

### Changes Implemented
- Split single about-us/page.tsx into 7 specialized section components
- Each component handles single responsibility
- page.tsx acts as thin orchestrator
- Updated: values-section.tsx redesigned for UI/UX consistency

### New Files Created
- about-hero-section.tsx, about-story-section.tsx, about-mission-vision-section.tsx
- about-responsible-tourism-section.tsx, about-certifications-section.tsx, about-cta-section.tsx

---

## [2026-04-01] — Custom 404 Error Page ✓ COMPLETE

**Type:** UI Feature Addition
**Scope:** Custom 404 page with i18n support and interactive elements
**Build Status:** PASSING (Next.js 16.2.3 Turbopack)

### Changes Implemented
- Custom 404 page component with i18n support (EN/SV/DE)
- Responsive design: Desktop 1440px, Mobile 390px
- Functional search bar redirecting to /tours?q=
- Location tags linking to /tours?city=
- Design images exported from Pencil design file
- Maintains brand consistency with Stepi-inspired aesthetic

### File Changes
- Created: apps/web/app/[locale]/not-found.tsx

---

## [2026-03-04] — Homepage Redesign (Stepi-Inspired Style) ✓ COMPLETE

**Type:** Major UI/UX Redesign
**Scope:** Homepage complete visual refresh matching Stepi aesthetic with heritage brand identity
**Build Status:** PASSING (Next.js 16.2.3 Turbopack)
**Tests:** 769/769 passed (93.76% coverage)

### Changes Implemented
- **7 Phases Completed:**
  1. Hero Section — Full-screen photo-forward design, centered white headline, single CTA
  2. Trust Signals — White-background 4-column icon grid with stats
  3. Video Highlight (NEW) — Scenic aerial photo with YouTube embed modal
  4. Featured Tours — Clean card redesign with portrait images, gold pricing, horizontal scroll mobile
  5. Seasonal CTA + Guides Preview — Gold gradient band + circular guide headshots
  6. Testimonials + Blog + Footer — Restyle testimonials, add blog grid, dark footer with gold accents
  7. Responsive Polish — Cross-section polish, performance, accessibility, integration

### Color Palette Adopted
| Role | Color | Usage |
|------|-------|-------|
| Primary Dark | #252525 | Headers, text, footer bg |
| Gold Accent | #d0ad50 | CTAs, buttons, emphasis |
| Gold Light | #DBC078 | Borders, accents |
| Gold Soft | #e6d3a0 | Badge bg, hover states |
| Coral | #E67E5A | Secondary CTAs (kept) |
| Footer BG | #0b0b0b | Dark footer |

---

## [2026-04-08] — Tour Detail Page Redesign (Booking-First) ✓ COMPLETE

**Type:** Major UI/UX Redesign
**Scope:** Booking-first layout with responsive image grid, price visibility on mobile, redesigned components
**Build Status:** PASSING (Next.js 16.2.3 Turbopack)

### Changes Implemented

**4 New Components Created:**
- `tour-image-grid.tsx` — Responsive image grid (replaces full-bleed hero)
- `tour-title-section.tsx` — Title, categories, meta row, mobile price bar (server component)
- `tour-highlights-section.tsx` — Dedicated highlights section (extracted from tour-content)
- `related-tour-card.tsx` — Compact horizontal card for related tours

**7 Components Redesigned:**
- `tour-hero.tsx` — Composes ImageGrid + Gallery (removed gradient overlay)
- `tour-content.tsx` — Experience text only + CSS-only Read More, no highlights
- `inclusions-section.tsx` — Colored cards with design token borders
- `logistics-section.tsx` — Alt bg card with map + label-value grid
- `guide-card.tsx` — Horizontal layout with avatar + credentials line
- `reviews-section.tsx` — Score badge header, cleaner italic cards
- `booking-section.tsx` — Price display, cancel badge, date/guest fields, styled CTA
- `related-tours.tsx` — Compact cards, 4-col grid, alt background

### Page Layout Changes

**New Grid Structure:**
```tsx
lg:grid-cols-[1fr_380px]  // Main content + sticky sidebar
```

**Component Order:**
1. TourHero (ImageGrid + Gallery)
2. TourTitleSection (title, categories, meta, price on mobile)
3. Border-top separator
4. Main content grid
5. TourHighlightsSection
6. TourContent (experience)
7. InclusionsSection
8. LogisticsSection
9. GuideCard
10. ReviewsSection
11. RelatedTours
12. BookingSection (sidebar, lazy-loaded)

### Key Features

- **Responsive Image Grid:** Displays tour images in a flexible grid layout instead of full-bleed hero
- **Booking Visibility:** Price bar on mobile title section for conversion optimization
- **Responsive Design:** Works across all breakpoints (375px–1440px+)
- **Translation Keys:** Added en/sv/de translations for new sections
- **Lazy Loading:** BookingSection dynamically imported for performance
- **Sticky Sidebar:** 380px right sidebar with booking widget on desktop

### Files Modified

- `page.tsx` — New grid layout, component reordering, border separator
- Translation files for new component labels

---

## [2026-04-04] — Tours Listing Page Redesign (Option B) ✓ COMPLETE

**Type:** Major UI/UX Redesign
**Scope:** 2-column sidebar layout (desktop), horizontal cards (mobile), advanced filters
**Build Status:** PASSING (Next.js 16.1.6 Turbopack)

### Changes Implemented

**5 Phases Completed:**
1. Page Layout & Header Redesign — Static page header with title, results, sort, view toggle + 2-column body (sidebar + grid)
2. Sidebar Filters Component — Desktop sidebar with categories, duration, price range slider, accessibility filters
3. Tour Card Redesign — Desktop grid cards with redesigned layout + responsive mobile horizontal cards
4. Mobile Header & Responsive — Mobile filter header with search + filter pill, category chips, filter drawer updates
5. Translations & Polish — Full i18n support (EN/SV/DE) + visual QA across breakpoints

### New Components Created
- `apps/web/components/tour/tour-page-header.tsx` — Desktop page header with results/sort/view controls
- `apps/web/components/tour/sidebar/sidebar-filters.tsx` — Main filter sidebar orchestrator
- `apps/web/components/tour/sidebar/filter-checkbox-group.tsx` — Reusable checkbox filter component
- `apps/web/components/tour/sidebar/price-range-slider.tsx` — Dual-thumb price range slider with debounce
- `apps/web/components/tour/view-mode-toggle.tsx` — Extracted grid/list toggle button

### Files Modified
- `apps/web/app/(site)/[locale]/(frontend)/tours/page.tsx` — Updated layout structure
- `apps/web/app/(site)/[locale]/(frontend)/tours/tour-catalog-client.tsx` — Restructured to 2-column layout with sidebar slot
- `apps/web/components/tour/tour-card.tsx` — Redesigned for grid variant + responsive mobile horizontal layout
- `apps/web/components/tour/tour-grid-layout.tsx` — Updated responsive grid classes
- `apps/web/components/tour/filter-bar/filter-bar.tsx` — Removed desktop section, kept mobile-only
- `apps/web/components/tour/filter-bar/category-chips.tsx` — Updated chip styling (filled/border variants)
- `apps/web/components/tour/filter-drawer.tsx` — Added duration checkboxes, price range slider, accessibility options
- `apps/web/messages/{en,sv,de}.json` — New i18n keys for sidebar labels, duration options, etc.

### Key Features
- Desktop 2-column layout: 260px fixed sidebar + flexible grid
- Desktop page header: full-width static bar with title, results count, sort dropdown, view toggle
- Desktop sidebar filters: categories (multi-select), duration (single-select), price range (dual-thumb slider), accessibility
- Mobile: filter header with search + pill button, horizontal category chips, updated filter drawer
- Mobile cards: 130px height horizontal layout with image left, compact info right
- Desktop cards: vertical layout with 180px image, featured badge, duration pill, rating+price row
- All filters shareable via URL params
- Debounced price range updates to avoid excessive navigation
- Full responsive design 375px–1440px+ with CSS-only responsive behavior (no hydration mismatches)

### Translation Updates
- New keys under `tours.filters` namespace for: pageTitle, pageSubtitle, categories, allTours, priceRange, duration options, maxCapacity, durationAndCapacity
- Full localization: English, Swedish, German

### Validation
- Design spec: 2-column sidebar layout (desktop), horizontal cards (mobile)
- Price range bounds: hardcoded 0–2000 SEK per decision
- Hearing filter: hidden (API support TBD)
- Map button: hidden (feature not yet implemented)

---

## [2026-04-02] — About Us Page Redesign ✓ COMPLETE

**Type:** Component Architecture Refactor
**Scope:** Split monolithic 187-line About page into 7 focused, reusable components
**Build Status:** PASSING (Next.js 16.1.6 Turbopack)

### Changes Implemented

**Component Modularization:**
- Split single about-us/page.tsx into 7 specialized section components
- Each component handles single responsibility (hero, story, mission/vision, values, certifications, responsible tourism, CTA)
- page.tsx now acts as thin orchestrator importing and composing sections
- values-section.tsx redesigned for improved UI/UX consistency

**New Files Created:**
- `apps/web/components/pages/about-hero-section.tsx` - Hero with image & overlay
- `apps/web/components/pages/about-story-section.tsx` - Heritage narrative
- `apps/web/components/pages/about-mission-vision-section.tsx` - Mission/vision
- `apps/web/components/pages/about-responsible-tourism-section.tsx` - Sustainability
- `apps/web/components/pages/about-certifications-section.tsx` - Credentials
- `apps/web/components/pages/about-cta-section.tsx` - Call-to-action
- Updated: `apps/web/components/pages/values-section.tsx` (redesigned)

**Translation Updates:**
- New i18n keys added to messages/en.json, messages/sv.json, messages/de.json
- All components use t() with namespaced keys for full localization

**Benefits:**
- Improved code reusability (sections can be composed into different pages)
- Easier testing and maintenance for individual components
- Reduced complexity per file (follows 200 LOC guideline)
- Better component discoverability in codebase

---

## [2026-04-01] — Custom 404 Error Page ✓ COMPLETE

**Type:** UI Feature Addition
**Scope:** Custom 404 page with i18n support and interactive elements
**Build Status:** PASSING (Next.js 16.1.6 Turbopack)

### Changes Implemented

- Custom 404 page component with i18n support (EN/SV/DE)
- Responsive design: Desktop 1440px, Mobile 390px
- Functional search bar redirecting to `/tours?q=`
- Location tags linking to `/tours?city=`
- Design images exported from Pencil design file
- Maintains brand consistency with Stepi-inspired aesthetic

### File Changes

- Created: `apps/web/app/[locale]/not-found.tsx`
- Added design assets to public directory

---

## [2026-03-04] — Homepage Redesign (Stepi-Inspired Style) ✓ COMPLETE

**Type:** Major UI/UX Redesign
**Scope:** Homepage complete visual refresh matching Stepi aesthetic with heritage brand identity
**Build Status:** PASSING (Next.js 16.1.6 Turbopack)
**Tests:** 769/769 passed (93.76% coverage)

### Changes Implemented

**7 Phases Completed:**
1. Hero Section — Full-screen photo-forward design, centered white headline, single CTA
2. Trust Signals — Redesigned to white-background 4-column icon grid with stats
3. Video Highlight (NEW) — Scenic aerial photo with YouTube embed modal
4. Featured Tours — Clean card redesign with portrait images, gold pricing, horizontal scroll mobile
5. Seasonal CTA + Guides Preview — Gold gradient band + circular guide headshots
6. Testimonials + Blog + Footer — Restyle testimonials, add blog grid, dark footer with gold accents
7. Responsive Polish — Cross-section polish, performance, accessibility, integration

### Color Palette Adopted

| Role | Color | Usage |
|------|-------|-------|
| Primary Dark | #252525 | Headers, text, footer bg |
| Gold Accent | #d0ad50 | CTAs, buttons, emphasis |
| Gold Light | #DBC078 | Borders, accents |
| Gold Soft | #e6d3a0 | Badge bg, hover states |
| Coral | #E67E5A | Secondary CTAs (kept) |
| Footer BG | #0b0b0b | Dark footer |

### Post-Review Fixes Applied

- Footer Link import fixed (next/link → i18n Link)
- Hero heading switched to i18n key
- CSP frame-src updated for YouTube embeds

### Verification

- All 7 phases marked Complete with success criteria validated
- Plan.md status updated to "Complete"
- All phase files updated with checkmarks
- No new files created outside plans/ directory

---

## Previous Entries

(Add earlier changelogs here as project progresses)
