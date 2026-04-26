# Development Roadmap

Living document tracking project phases, milestones, and progress toward MVP launch.

---

## Current Phase: Phase 17 — Per-Tour Cancellation Policy 🚧 IN PROGRESS

**Date Started:** 2026-04-19
**Status:** Planning stage - Plan directory: 260419-1332-per-tour-cancellation-policy/
**Expected Completion:** TBD

---

## Previous Phase: Phase 16 — Guide Profile Redesign ✓ COMPLETE

**Date Started:** 2026-04-12
**Date Completed:** 2026-04-18
**Duration:** 6 days

### Phase 16 Overview

**Guide Profile Redesign & Cache Revalidation Strategy**

Redesign of guide profile pages with split-panel sidebar layout, infinite scroll pagination, and implementation of cache revalidation infrastructure (CMS hook + /api/revalidate endpoint). Added support for guide data v2, tour data v2 delta imports, IS_STAGING environment blocking, image blur placeholders, cancellation policy page, and guide profile migration.

### Milestones & Status

| Milestone | Status | Completion |
|-----------|--------|-----------|
| Guide Listing Portrait Gallery | ✅ Complete | 2026-04-18 |
| Guide Detail Split-Panel | ✅ Complete | 2026-04-18 |
| Infinite Scroll Pagination | ✅ Complete | 2026-04-18 |
| Cache Revalidation Hook | ✅ Complete | 2026-04-12 |
| /api/revalidate Endpoint | ✅ Complete | 2026-04-12 |
| IS_STAGING Blocking | ✅ Complete | 2026-04-05 |
| Image Blur Placeholders | ✅ Complete | 2026-04-12 |
| Tour Data v2 Delta Import | ✅ Complete | 2026-04-13 |
| Guides Data v2 Update | ✅ Complete | 2026-04-14 |
| Cancellation Policy Page | ✅ Complete | 2026-04-12 |
| Tour Duration Format Fix | ✅ Complete | 2026-04-05 |

### Key Deliverables

- **Guide Listing Updates:**
  - Portrait gallery layout (replaced card-based)
  - Responsive grid with image-first design

- **Guide Detail Updates:**
  - Split-panel sidebar (160-200px avatar column)
  - Infinite scroll via IntersectionObserver
  - Migration for years_experience field

- **Infrastructure:**
  - `revalidate-cache-tags-hook` (packages/cms/hooks/)
  - `/api/revalidate` endpoint with token auth
  - IS_STAGING env var for staging crawler blocking (robots.txt + headers)

- **Data & Features:**
  - Tour data v2 delta import pipeline
  - Guides data v2 update
  - Cancellation policy page with i18n
  - Image blur_data_url via plaiceholder

---

## Previous Phase: Phase 15 — Tour Detail Page Redesign ✓ COMPLETE

**Date Started:** 2026-04-08
**Date Completed:** 2026-04-08
**Duration:** 1 day (PR #12)

### Phase 15 Overview

**Tour Detail Page Redesign — Booking-First Layout**

Complete redesign of the tour detail page (`/tours/[slug]`) with focus on booking conversion. New responsive image grid replaces full-bleed hero, price visibility on mobile through title section, and simplified content hierarchy. New components added for image grid, title section, highlights, and related tour cards. Eight existing components redesigned for improved layout and visual hierarchy.

### Milestones & Status

| Milestone | Status | Completion |
|-----------|--------|-----------|
| Image Grid & Layout | ✅ Complete | 2026-04-08 |
| Component Redesigns | ✅ Complete | 2026-04-08 |
| Translation Keys | ✅ Complete | 2026-04-08 |
| Responsive Polish | ✅ Complete | 2026-04-08 |

### Key Deliverables

- **New Components (4):**
  - `tour-image-grid.tsx` — Responsive image grid
  - `tour-title-section.tsx` — Title, categories, meta, price bar (mobile)
  - `tour-highlights-section.tsx` — Extracted highlights
  - `related-tour-card.tsx` — Compact related tour cards

- **Redesigned Components (8):**
  - `tour-hero.tsx`, `tour-content.tsx`, `inclusions-section.tsx`, `logistics-section.tsx`
  - `guide-card.tsx`, `reviews-section.tsx`, `booking-section.tsx`, `related-tours.tsx`

- **Page Layout:**
  - Grid: `lg:grid-cols-[1fr_380px]` (main + sidebar)
  - Border-top separator between title and content
  - Lazy-loaded booking sidebar with dynamic imports

---

## Previous Phase: Phase 14 — Tours Listing Page Redesign & Architecture ✓ COMPLETE

**Date Completed:** 2026-04-04
**Duration:** 3 days

### Phase 14 Overview

**Component Architecture Optimization & Tours Listing Redesign**

Modularization of large components, tours catalog redesign with 2-column sidebar layout (desktop) and advanced filters, refactoring page layouts into focused reusable sections, and improving overall code organization to maintain 200 LOC guideline across codebase.

### Milestones & Status

| Milestone | Status | Completion |
|-----------|--------|-----------|
| About Us Page Refactor | ✅ Complete | 2026-04-02 |
| Tours Listing Page Redesign (Option B) | ✅ Complete | 2026-04-04 |

---

## Previous Phase: Phase 13 — UI/UX Polish & Homepage Redesign ✓ COMPLETE

**Date Started:** 2026-02-28
**Date Completed:** 2026-03-04
**Duration:** 4 days

### Phase 13 Overview

**Homepage Redesign — Stepi-Inspired Style**

Complete visual refresh of the Heritage Guiding Platform homepage to match the clean, photo-forward, travel agency aesthetic of Stepi while preserving Swedish heritage brand identity and gold color palette.

### Milestones & Status

| Milestone | Status | Completion |
|-----------|--------|-----------|
| Phase 01: Hero Section | ✅ Complete | 2026-03-04 |
| Phase 02: Trust Signals | ✅ Complete | 2026-03-04 |
| Phase 03: Video Highlight (NEW) | ✅ Complete | 2026-03-04 |
| Phase 04: Featured Tours | ✅ Complete | 2026-03-04 |
| Phase 05: Seasonal CTA + Guides | ✅ Complete | 2026-03-04 |
| Phase 06: Testimonials + Blog + Footer | ✅ Complete | 2026-03-04 |
| Phase 07: Responsive Polish | ✅ Complete | 2026-03-04 |
| Post-Review Fixes | ✅ Complete | 2026-03-04 |

### Key Achievements

✅ All 7 phases implemented and tested
✅ Build passing: Next.js 16.1.6 Turbopack
✅ Test suite: 769/769 passed (93.76% coverage)
✅ Responsive design across all breakpoints (375px to 1440px+)
✅ Full i18n support (SV/EN/DE)
✅ Accessibility: WCAG 2.1 AA compliance
✅ Performance: Lighthouse scores 90+
✅ Post-review fixes applied (Footer Link, Hero i18n, CSP)

### New Sections Added

- VideoHighlight — Scenic photo with YouTube embed modal
- GuidesPreview — Circular headshots replacing WhyChooseUs
- LatestPosts — Blog grid with featured + small cards

### Design System Updates

- Color palette: Charcoal primary, gold accents, soft gold highlights
- Typography: Playfair Display (headings), Inter (body) — unchanged
- Spacing: Consistent py-16 md:py-24 across sections
- Animations: Scroll-triggered fade-ins with reduced-motion compliance

### Homepage Section Reordering (2026-04-04)

**Current rendering order:** Hero → TrustSignals → FeaturedTours → GuidesPreview → Footer

> **MVP note (2026-04-26):** `VideoHighlight` temporarily hidden in `apps/web/app/(site)/[locale]/(frontend)/page.tsx` for MVP release. Component file retained — re-enable post-MVP by uncommenting import and JSX.

**Updates in latest redesign:**
- Reordered sections for better content flow (moved GuidesPreview before VideoHighlight)
- Featured tours redesigned: portrait→landscape cards with description+meta row (duration/capacity)
- "VIEW TOUR" CTA buttons on tour cards
- GuidesPreview: mobile photos 100px with 2px border, abbreviated languages on mobile
- Gold separator line (3px desktop / 1px mobile) before footer using `--color-secondary-light`
- WCAG contrast fix: white/60→white/70 for text compliance
- New i18n keys: featured.tag, featured.viewTour, featured.upTo, guides.tag, video.tag, video.subtitle
- **Note:** SeasonalCta component exists but is no longer rendered in homepage; LatestPosts also not rendered

---

## Post-Phase 13: Minor UI Enhancements (Ongoing)

### Custom 404 Error Page ✅ Complete (2026-04-01)

- Custom 404 page with full i18n support (SV/EN/DE)
- Responsive design matching brand aesthetic
- Interactive elements: search redirect, location filtering
- Design integration from Pencil files

---

## Upcoming Phases

### Phase 17: Per-Tour Cancellation Policy (In Progress)

**Date Started:** 2026-04-19
**Plan Directory:** 260419-1332-per-tour-cancellation-policy/

- Per-tour cancellation policy configuration
- Admin UI for policy management
- Policy display on tour detail pages
- i18n support (SV/EN/DE)

### Phase 09: Group Bookings & WhatsApp (Pending)

- Group inquiry form with validation
- Email notifications (admin + customer)
- WhatsApp floating button integration
- Standalone /group-booking page
- 39 unit tests with honeypot protection

### Phase 18: Advanced Features (Planned)

- Blog/content marketing CMS
- Neighborhood-specific landing pages
- Advanced analytics dashboard
- Customer user accounts

### Phase 19: Mobile Apps & Integrations (Planned)

- iOS/Android native apps
- TripAdvisor API integration
- Partner portal for agencies
- French language support

---

## Previous Major Milestones

### Phase 12: Unit Test Coverage Improvement ✅ COMPLETE
**Completion Date:** 2026-02-26
- Test coverage: 52% → 90%+
- 1,009 unit tests (444 new tests)
- Service & integration test coverage
- Rebranded to "Private Tours"

### Phase 11: Payload CMS Integration ✅ COMPLETE
**Completion Date:** 2026-02-15
- Collection setup: Tours, Guides, Media
- Lexical editor integration
- Vercel Blob media storage
- API endpoints

### Phase 10: Authentication & User Management ✅ COMPLETE
**Completion Date:** 2026-02-10
- User roles & permissions
- Admin dashboard
- Session management

---

## Success Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Homepage Build | Passing | ✅ |
| Test Coverage | 90%+ | ✅ 93.76% |
| Lighthouse Performance | 90+ | ✅ |
| Lighthouse Accessibility | 90+ | ✅ |
| Mobile Responsive | All breakpoints | ✅ |
| i18n Support | SV/EN/DE | ✅ |
| CSP Compliance | Frame-src YouTube | ✅ |

---

## Next Steps

1. Complete Phase 17: Per-tour cancellation policy implementation
2. Begin Phase 09: Group bookings & WhatsApp integration
3. Phase 10-12: Advanced features (already completed per legacy tracking)
4. Monitor Phase 16 performance metrics (cache revalidation, guide infinite scroll)
5. Plan Phase 18+ marketing and analytics features
