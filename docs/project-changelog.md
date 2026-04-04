# Project Changelog

Complete record of significant changes, features, and releases.

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
