# Development Roadmap

Living document tracking project phases, milestones, and progress toward MVP launch.

---

## Current Phase: Phase 17 — Per-Tour Cancellation Policy 🚧 IN PROGRESS

**Date Started:** 2026-04-19
**Status:** Planning stage - Plan directory: 260419-1332-per-tour-cancellation-policy/
**Expected Completion:** TBD

---

## Parked / Post-MVP: Custom Booking Panel (Bokun handoff) ⏸️ INFEASIBLE-AS-PLANNED

**Date:** 2026-05-31
**Status:** Spike-gated → blocked. Plan: 260530-1624-custom-tour-booking-panel-bokun-handoff/
**Outcome:** Custom selection panel → Bokun-hosted payment proven **infeasible** — deep-link pre-fill, HMAC reserve→redirect, and widget-session-resume all disproved **directly against Bokun sandbox + prod hosts**. Bokun-hosted payment lives only inside the embedded widget (server-signed session). Phases 2–5 cancelled; only widget restyle (Phase 6) viable, deferred post-MVP. Revisit via Bokun support inquiry. Evidence: `…/research/handoff-spike-findings.md`. Side-finding: `getBokunAvailability` REST endpoint 404s on both hosts (dead code, no user impact).

---

## Completed Phase: Phase 08.2 — Bokun Outbound Sync v1 🚀 COMPLETE

**Date Started:** 2026-05-14
**Date Completed:** 2026-05-14
**Status:** Code-complete (Phases 01–06 done; canary validation pending)
**Plan:** 260514-1437-bokun-integration/

### Summary
Automatic push: Tour create/update in Payload enqueues `syncTourToBokun` Payload Job via afterChange hook. Job runs pure mapper → calls createExperience (no ID) or updateExperience (ID present) on existing HMAC client. Retries with exponential backoff (30s/2m/10m/1h, 4 attempts), transient classification (408/425/429/500/502/503/504), 410 clears ID for re-create. Admin UI surfaces sync status + manual "Sync now" button. Reuses existing bokun-api-client-with-hmac-authentication.ts — added 2 methods, no fork.

### Key Deliverables
- **Client Extensions:** createExperience (POST) + updateExperience (PUT) methods on existing HMAC client
- **Mapper:** tour-to-bokun-experience-mapper.ts (all 3 priceTypes, all locales sv/en/de)
- **Job:** syncTourToBokun with retry policy (exponential backoff, transient whitelist, 410 recovery, recursive guard)
- **Hook:** afterChange enqueues job; hook respects skipBokunSync context flag
- **Admin UI:** bokunSyncStatus, bokunLastSyncedAt, bokunLastError sidebar fields + custom panel with manual sync button
- **Endpoint:** POST /api/admin/bokun/sync-tour (admin role, origin-CSRF verified)
- **Migration:** 20260514-add-bokun-sync-fields.ts (additive)
- **HTML Conversion:** lexical-to-bokun-html.ts (RTE → Bokun HTML format)
- **Tests:** 40+ covering mapper all branches, client methods, job logic, hook behavior

### Outstanding
- Phase 07 canary validation (requires prod Bokun credentials + test tour)

---

## Completed Phase: Phase 19 — Instant Listing Filter Feedback 🚀 COMPLETE (measurement pending)

**Date Started:** 2026-05-02
**Date Completed:** 2026-05-02 (implementation complete; staging measurement pending Phase 01)
**Status:** All code-complete (Phases 01–05 done; Phase 06 cleanup blocked on Phase 01 measurement)
**Plan:** 260502-0048-instant-filter-feedback/

### Summary
Eliminated "slow reaction" on filter clicks (`/tours`, `/guides`) via React 19 optimistic URL state (`useOptimistic` + `useTransition`), instant chip/dropdown flip, grid pending overlay. Server authoritative; auto-revert on conflict.

### Key Deliverables
- **New Components:** `FilterStateProvider` (optimistic URL state manager), `GridPendingOverlay` (spinner overlay with fade), `GuideCatalogClient` (wrapper for `/guides` provider mounting)
- **Consolidation:** Migrated 12 filter consumer components (tour/guide chips, sort, search, drawers, grid layout) to call `useFilterState()` instead of duplicating `useSearchParams + useRouter + usePathname + useTransition` blocks (−404 / +360 LOC net)
- **Shared Utils:** `sanitizeSlug(slug)` extracted to `lib/utils.ts`
- **Temp Instrumentation:** `console.time` wrappers in `/tours`, `/guides` page.tsx; Phase 01 baseline measurement pending (decision rule: p95 < 300ms ship, 300–800ms ship + perf issue, > 800ms block; Phase 06 removes instrumentation per outcome)

### Outstanding (gates Phase 06 cleanup & ship)
- Phase 01 staging baseline capture **pending** — determine p95 getTours latency, apply decision rule

---

## Completed Phase: Phase 18 — Staging Perceived Performance 🚀 COMPLETE

**Date Started:** 2026-05-01
**Date Completed:** 2026-05-01
**Status:** All 3 phases complete (quick wins, measurement, targeted fixes)
**Plan:** 260501-1559-staging-perceived-performance/

### Summary
Eliminated 1–3s "click-freeze" perception on mobile through navigation feedback, deferred third-party loading, and image priority optimization.

### Key Deliverables
- **Quick Wins:** 6 `loading.tsx` route fallbacks, `NavigationPending` component with `useLinkStatus` hook
- **RSC Conversions:** 9 components converted from client to server (about-sections, values, guides-preview, seasonal-cta)
- **Performance Fixes:** Image `priority` prop on first 3 cards (tour/guide grids), deferred Bubblav widget mount (15s + interaction gating)
- **Infrastructure:** Bundle analyzer (`npm run analyze`), Lighthouse CI scoped to Production environment
- **Measurement:** Web Vitals baseline captured, Lighthouse mobile scores tracked

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
