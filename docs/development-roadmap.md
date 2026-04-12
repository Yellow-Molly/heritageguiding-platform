# Development Roadmap

Living document tracking project phases, milestones, and progress toward MVP launch.

---

## Current Phase: Phase 15 — Tour Detail Page Redesign ✓ IN PROGRESS

**Date Started:** 2026-04-08
**Status:** Active - Booking-first layout implementation, responsive image grid, component redesign

### Phase 15 Overview

**Tour Detail Page Redesign — Booking-First Layout**

Complete redesign of the tour detail page (`/tours/[slug]`) with focus on booking conversion. New responsive image grid replaces full-bleed hero, price visibility on mobile through title section, and simplified content hierarchy. New components added for image grid, title section, highlights, and related tour cards. Seven existing components redesigned for improved layout and visual hierarchy.

### Milestones & Status

| Milestone | Status | Completion |
|-----------|--------|-----------|
| Image Grid & Layout | ✅ Complete | 2026-04-08 |
| Component Redesigns | ✅ Complete | 2026-04-08 |
| Translation Keys | ✅ Complete | 2026-04-08 |
| Responsive Polish | In Progress | TBD |

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

**Current rendering order:** Hero → TrustSignals → FeaturedTours → GuidesPreview → VideoHighlight → Footer

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

### Phase 16: Tour Detail Polish & Testing (Planned)

- Test coverage for redesigned components
- Performance optimization (image loading, lazy-loading)
- Accessibility audit for new layout
- Cross-browser responsive testing

### Phase 17: Additional Content & CMS Integration (Planned)

- Blog collection expansion
- Tour category pages
- Content moderation tools
- Featured tours rotation

### Phase 18: Booking Flow Optimization (Planned)

- Streamlined checkout
- Payment integration refinement
- Confirmation email templates
- Customer support integration

### Phase 19: Analytics & Marketing (Planned)

- Conversion tracking
- A/B testing infrastructure
- Email marketing setup
- SEO optimization

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

1. Complete Phase 15: Responsive polish and final testing
2. Begin Phase 16: Unit test coverage for redesigned components
3. Monitor performance metrics on tour detail pages
4. Gather user feedback on booking-first layout
5. Plan Phase 17 additional content integration
