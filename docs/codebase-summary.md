# Codebase Summary - HeritageGuiding Platform

**Last Updated:** February 21, 2026
**Phase:** 11 - Performance Optimization (Complete)
**Status:** Image optimization, dynamic caching, Web Vitals monitoring, Lighthouse CI, 1009 unit tests (90%+ coverage)
**Codebase Metrics:** 165+ TypeScript files, 380K+ tokens, 69K LOC frontend + 35K LOC CMS

## Overview

HeritageGuiding is an AI-first tourism booking platform consolidating Sweden's heritage tourism market. Monorepo with Next.js 16.1.6 frontend (69K LOC, 70+ React components, 10 API routes, 1009 unit tests with 90%+ coverage, performance-optimized with image caching, dynamic imports, Web Vitals monitoring, Lighthouse CI) and Payload CMS 3.75 backend (35K LOC, 10 collections, 3-locale support, Bokun integration with HMAC authentication, Excel/CSV import-export, Concierge Wizard with audience-interest matching, comprehensive SEO with sitemap/robots.txt, Schema.org structured data across all public pages).

## Repository Structure

```
heritageguiding-platform/
├── apps/web/              # Next.js 16 frontend (SSR + static, Turbopack)
│   ├── app/               # App Router pages
│   │   ├── (frontend)/    # Public routes (localized)
│   │   ├── (payload)/     # Admin + API routes
│   │   └── api/           # Route handlers
│   ├── components/        # 50+ React components
│   ├── lib/               # Utilities & services
│   ├── types/             # TypeScript definitions
│   └── messages/          # i18n translations (SV/EN/DE)
├── packages/
│   ├── cms/               # Payload CMS 3.0 config + collections
│   ├── ui/                # Shared UI components
│   └── types/             # Shared TypeScript definitions
├── docs/                  # Project documentation
├── plans/                 # Development plans & reports
└── .github/workflows/     # CI/CD automation
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16.1.6 (App Router, Turbopack), React 19.2.3, TypeScript 5.9.3, Tailwind CSS 4 |
| **CMS** | Payload CMS 3.75.0, Lexical Editor, PostgreSQL 15+ |
| **i18n** | next-intl (SV/EN/DE routing & translations) |
| **Database** | PostgreSQL 15+ with pgvector extension |
| **Styling** | Tailwind CSS v4, PostCSS, Radix UI 1.2.12 |
| **Storage** | Vercel Blob (images, WebP optimization) |
| **Code Quality** | ESLint 9 (flat config), Prettier 3, TypeScript 5.9.3, Vitest 4.0.17 |
| **Validation** | Zod 4.3.5 |
| **Import/Export** | ExcelJS 4.4.0 (CSV/Excel pipelines) |
| **Hosting** | Vercel (frontend), PostgreSQL host (database) |
| **CI/CD** | GitHub Actions (lint, type-check, build) |

## Key Dependencies

### Critical
- `next@^16.1.6` - React framework (Turbopack default bundler)
- `react@^19.2.3` - UI library
- `payload@^3.75.0` - Headless CMS
- `next-intl@^4.7.0` - Internationalization
- `tailwindcss@^4.0.0` - Styling
- `typescript@^5.9.3` - Type safety
- `zod@^4.3.5` - Schema validation

### Data & Search
- `@payloadcms/db-postgres@^3.75.0` - PostgreSQL database
- `pgvector@^0.1.x` - Vector database support
- OpenAI `text-embedding-3-small` (1536 dimensions)

### Bokun Integration
- HMAC-SHA256 authentication (native crypto)
- 60-second availability caching
- Webhook signature verification
- Rate limiting (400 req/min with exponential backoff)

### UI Components
- `@radix-ui/react-popover@^1.x` - Accessible popovers
- `react-day-picker@^9.11.1` - Date selection
- `date-fns@^3.x` - Date utilities
- `sharp@^0.34.5` - Image optimization

### Testing
- `vitest@^4.0.17` - Unit testing (1009 tests, 90%+ coverage across both workspaces)
- React Testing Library - Component testing
- ESLint 9 flat config (no --ext flag needed)

## Project Structure Details

### apps/web - Next.js Frontend (65K LOC)

#### App Structure
```
app/
├── (frontend)/           # Localized public routes
│   ├── page.tsx          # Homepage
│   ├── about-us/         # About page
│   ├── faq/              # FAQ with accordion
│   ├── find-tour/        # Concierge Wizard (3-step, audience-interest matching)
│   ├── guides/           # Guide listing & detail pages
│   │   ├── page.tsx      # Listing with GuideListSchema
│   │   └── [slug]/       # Detail with GuideDetailSchema
│   ├── privacy/          # Privacy policy
│   ├── terms/            # Terms & conditions
│   └── tours/            # Tour catalog & detail pages
│       ├── page.tsx      # Catalog with TourListSchema
│       ├── [slug]/       # Detail with TourSchema
│       └── tour-catalog-client.tsx  # Client-side filter logic
├── (payload)/            # Admin interface
│   ├── admin/            # Payload CMS UI
│   └── api/graphql/      # GraphQL endpoint
├── api/                  # Route handlers
│   ├── bokun/            # Bokun integration
│   │   ├── availability/ # GET availability endpoint
│   │   └── webhook/      # POST webhook handler
│   ├── search/semantic/  # Semantic search endpoint
│   ├── tours/recommend/  # POST wizard recommendations (Zod-validated)
│   └── [...slug]/        # Generic API routes
├── sitemap.ts            # Dynamic sitemap (9 static + CMS routes, hreflang)
├── robots.ts             # robots.txt generator
├── layout.tsx            # Root layout (skip link, ARIA announcer)
├── globals.css           # Global styles (focus, reduced motion)
└── middleware.ts         # next-intl routing middleware
```

#### Components (60+ total, organized by feature)

**Home Components (8 components):**
- `hero-section.tsx` - Landing hero with parallax
- `trust-signals.tsx` - Statistics section
- `featured-tours.tsx` - Grid of featured tours
- `testimonials.tsx` - Carousel of reviews
- `why-choose-us.tsx` - Value proposition
- `find-tour-cta.tsx` - Tour finder CTA
- `category-nav.tsx` - Category navigation
- Tests: `category-nav.test.tsx`

**Tour Components (15+ components):**
- `tour-card.tsx` - Individual tour card
- `tour-catalog-client.tsx` - Filter logic (client component)
- `tour-hero.tsx` - Tour header section
- `tour-gallery.tsx` - Full-screen image gallery
- `tour-facts.tsx` - Duration, group size, etc.
- `logistics-section.tsx` - Meeting point, map
- `guide-card.tsx` - Expert profile
- `inclusions-section.tsx` - What's included
- `reviews-section.tsx` - Customer ratings
- `related-tours.tsx` - Carousel of related tours
- `booking-section.tsx` - CTA & widget
- `tour-search.tsx` - Full-text search
- `tour-filters.tsx` - Category/price/duration filters
- `tour-sort.tsx` - Sort options
- `tour-pagination.tsx` - Page navigation
- `tour-grid.tsx` - Grid layout
- `tour-grid-skeleton.tsx` - Loading state
- `tour-empty-state.tsx` - No results message
- `filter-bar/` - GetYourGuide-style sticky filter bar
  - `category-chips.tsx` - Multi-select chips with URL state
  - `results-count.tsx` - Pluralized results display
  - Tests: `category-chips.test.tsx`, `results-count.test.tsx`
- Tests: `tour-card.test.tsx`, `tour-empty-state.test.tsx`, `tour-grid-skeleton.test.tsx`

**Page Components (5 components):**
- `faq-accordion.tsx` - Accordion for FAQs
- `team-section.tsx` - Guide profiles
- `values-section.tsx` - Company values
- Tests: `faq-accordion.test.tsx`, `team-section.test.tsx`, `values-section.test.tsx`

**SEO Components (7 components, Phase 10):**
- `faq-schema.tsx` - FAQPage schema
- `travel-agency-schema.tsx` - TravelAgency + Organization schema
- `tour-schema.tsx` - TouristAttraction + Product schema
- `about-schema.tsx` - AboutPage + Organization (Phase 10)
- `guide-detail-schema.tsx` - Person schema (Phase 10)
- `guide-list-schema.tsx` - ItemList of guides (Phase 10)
- `tour-list-schema.tsx` - ItemList of tours (Phase 10)
- Tests: 36 new tests (Phase 10)

**Shared Components (5 components):**
- `accessibility-badge.tsx` - WCAG indicators
- `breadcrumb.tsx` - Navigation breadcrumbs
- `loading-spinner.tsx` - Loading indicator
- `rating-stars.tsx` - Star rating display
- Tests: `accessibility-badge.test.tsx`, `loading-spinner.test.tsx`, `rating-stars.test.tsx`

**Accessibility Components (2 components, Phase 10):**
- `skip-to-content-link.tsx` - Skip navigation link
- `visually-hidden.tsx` - Screen reader only content
- Tests: 12 new tests (Phase 10)

**Layout Components (3 components):**
- `header.tsx` - Navigation header
- `footer.tsx` - Footer with links
- `container.tsx` - Max-width wrapper

**UI Components (8 shadcn/ui components):**
- `accordion.tsx` - Collapsible sections
- `badge.tsx` - Status badges
- `button.tsx` - Button styles
- `card.tsx` - Card container
- `dialog.tsx` - Modal dialog
- `input.tsx` - Text input
- `popover.tsx` - Radix UI popover wrapper
- `skeleton.tsx` - Loading skeleton

**Wizard Components (Phase 08.5, 5 components):**
- `concierge-wizard-container.tsx` - Main wizard controller, 3 steps, localStorage persistence
- `wizard-step-selector.tsx` - Audience/interest selection (step 1-2)
- `wizard-option-card.tsx` - Reusable option cards with aria-pressed
- `wizard-progress-indicator.tsx` - Step progress display (aria-progressbar)
- `wizard-tour-results.tsx` - Personalized recommendations (step 3)
- Tests: 60 unit tests (audience selection, interest selection, API integration, a11y, localStorage, i18n)

**Other Components:**
- `bokun-booking-widget-with-fallback.tsx` - Booking widget wrapper
- `language-switcher/` - Language selection

**Tests:** 579 unit tests using Vitest + React Testing Library (102 new Phase 10 tests, +27% coverage)

#### Libraries & Utilities

**Data Fetching (9 functions with full TypeScript typing):**
- `lib/api/get-tours.ts` - Fetch all tours with filters
- `lib/api/get-tour-by-slug.ts` - Single tour detail
- `lib/api/get-featured-tours.ts` - Featured tours list
- `lib/api/get-related-tours.ts` - Related tour recommendations
- `lib/api/get-categories.ts` - All categories
- `lib/api/get-tour-reviews.ts` - Tour reviews with ratings
- `lib/api/get-trust-stats.ts` - Trust metrics
- Tests: 8 test files covering all functions

**Bokun Integration (Phase 08.1):**
- `lib/bokun/bokun-types.ts` - Type definitions
- `lib/bokun/bokun-api-client-with-hmac-authentication.ts` - HMAC-SHA256 API client
- `lib/bokun/bokun-availability-service-with-caching.ts` - 60s TTL caching
- `lib/bokun/bokun-booking-service-and-widget-url-generator.ts` - Widget URL generation
- `app/api/bokun/availability/route.ts` - GET availability endpoint
- `app/api/bokun/webhook/route.ts` - POST webhook with signature verification

**AI/Semantic Search (Phase 08.1+):**
- `lib/ai/openai-embeddings-service.ts` - OpenAI text-embedding-3-small (1536 dims)
- `lib/ai/pgvector-semantic-search-service.ts` - Vector similarity search (cosine)
- `app/api/search/semantic/route.ts` - Semantic search endpoint

**Excel/CSV Import-Export (Phase 08.1+):**
- 9 service files for format handling (Excel, CSV)
- 6 admin components for bulk operations
- Format-agnostic pipeline: Parse → Map → Validate (Zod) → Transform → Create
- ExcelJS 4.4.0 for Excel operations

**i18n & Formatting:**
- `lib/i18n-format.ts` - Locale-specific formatting
- `lib/i18n/date-format.ts` - Date formatting utilities
- `lib/seo.ts` - SEO utilities with hreflang support
- `i18n.ts` - Locale configuration
- `i18n/routing.ts` - Route definitions
- `i18n/navigation.ts` - Navigation helpers

**Utilities:**
- `lib/utils.ts` - General utilities
- `lib/fonts.ts` - Font definitions
- `lib/validation/tour-filters.ts` - Zod validation schemas
- `lib/validation/wizard-schemas.ts` - Wizard request/response validation
- `lib/hooks/use-debounce.ts` - Debounce hook
- `lib/hooks/use-wizard-persistence.ts` - localStorage persistence for wizard state
- `lib/utils/sanitize-html.ts` - HTML sanitization

**Messages (Translations):**
- `messages/sv.json` - Swedish (default)
- `messages/en.json` - English
- `messages/de.json` - German

#### Tests (500+ unit tests in apps/web)

**New Phase 12 Tests (33 test files total):**

**Component Tests (8 files):**
- Category navigation, hero section, featured tours
- Tour cards, filter bar (category chips, results count)
- FAQ accordion, team section, value props
- Schema components (FAQ, travel agency)
- Accessibility badge, rating stars, loading spinner
- Breadcrumb, loading spinner, rating stars

**API Function Tests (8 files):**
- Tours fetching (filters, sorting, pagination)
- Tour details (full data with relationships)
- Featured tours, related tours, guides, guides by slug
- Reviews, trust stats, categories

**Utility Tests (4 files):**
- i18n date formatting (intl locale formatting)
- Language display names
- SEO utilities (hreflang generation)
- Sanitized HTML (XSS prevention and tag filtering)
- Rate limiting by IP

**Integration Tests (8 files):**
- Email services (transporter, admin notifications, customer confirmations)
- Bokun API client (HMAC authentication)
- Bokun availability service (caching)
- Bokun booking service and widget URL generator
- OpenAI embeddings service
- pgvector semantic search service
- Web Vitals reporting hook
- Robots.txt generation
- Analytics vitals route
- Tour recommendation API route
- Group inquiry API route

**Hook & Storage Tests (5 files):**
- Debounce hook
- Wizard state hook
- Web Vitals reporter hook
- Wizard preferences localStorage persistence

**Coverage:** apps/web 95.9% statement coverage (stmts/branch/funcs/lines all >80%)

### packages/cms - Payload CMS (35K LOC)

#### Collections (10 total)

1. **users** - Admin authentication
   - Email + password auth
   - Role-based access (admin, editor)
   - Active/inactive status

2. **media** - Image/file management
   - Vercel Blob integration
   - Alt text for accessibility
   - File metadata tracking

3. **tours** - Tour listings (core collection)
   - Title, description, short description
   - Pricing (base price, currency, group discounts)
   - Duration (hours, text description)
   - Logistics (meeting point, coordinates, Google Maps link)
   - Inclusions/exclusions/what to bring
   - Audience tags (10 categories for recommendations)
   - Difficulty level, age recommendation
   - Accessibility fields (wheelchair, mobility, hearing assistance)
   - Guide relationship
   - Category/neighborhood relationships
   - Media gallery (3+ images per tour)
   - bokunExperienceId for widget integration
   - SEO fields (meta title/description, featured status)
   - Status (draft/published), localized (sv/en/de)

4. **guides** - Tour experts
   - Name, bio, photo
   - Credentials array (certifications, languages)
   - Languages spoken
   - Contact info, localized

5. **categories** - Tour themes
   - Name, slug, description
   - Color/icon for UI
   - Localized (sv/en/de)

6. **cities** - Geographic data
   - Name, coordinates
   - Region/province

7. **neighborhoods** - City areas
   - Name, description
   - City relationship
   - Coordinates

8. **reviews** - Customer feedback
   - Tour relationship
   - Rating (1-5)
   - Text, verified flag
   - Customer name, date

9. **pages** - Static content
   - Title, slug, content (rich text)
   - FAQ, About, Terms, Privacy
   - Localized (sv/en/de)

10. **bookings** - Bokun webhook data (Phase 08.1)
    - Booking reference, status
    - Experience (tour) reference
    - Customer name, email, phone
    - Participant count
    - Pricing (total, currency)
    - Booking date, confirmation timestamp
    - Payment status

11. **excel_imports** - Bulk import history (Phase 08.1+, optional)
    - File name, source format (Excel/CSV)
    - Import timestamp, row count
    - Status (pending/processing/complete/failed)
    - Error log for validation failures

#### Field Modules (7 reusable)

- `slug-field.ts` - Auto-generates URL slugs
- `seo-fields.ts` - Meta title/description/OG image
- `accessibility-fields.ts` - WCAG compliance fields
- `logistics-fields.ts` - Meeting point, coordinates, maps
- `tour-pricing-fields.ts` - Price, currency, discounts
- `tour-inclusion-fields.ts` - Inclusions, exclusions, items
- `tour-audience-fields.ts` - 10 audience tags for recommendations

#### Access Control

- `access/is-admin.ts` - Admin-only operations
- `access/is-authenticated.ts` - Authenticated user access

#### Hooks

- `hooks/format-slug.ts` - URL-safe slug generation
- `hooks/generate-tour-embedding-on-save-hook.ts` - OpenAI embeddings on save

#### Configuration

- **Secret:** `PAYLOAD_SECRET` (from env)
- **Database:** PostgreSQL with connection pooling
- **Editor:** Lexical rich text editor
- **Storage:** Vercel Blob for media files
- **Localization:** SV (default), EN, DE with fallback
- **Extensions:** pgvector for semantic search

#### Tests (11 test files in packages/cms)

**New Phase 12 Tests (11 files total):**
- Access control validation
- Format slug generation and validation
- Google Maps URL validation
- CSV import service (format, column mapping, schema validation)
- CSV export service
- Excel import service
- Excel export service
- Markdown to Lexical converter (rich text processing)
- Tour embedding hook on save (AI/OpenAI integration)

**Coverage:** packages/cms 89.7% statement coverage (stmts/branch/funcs/lines all >80%)

### packages/ui - Shared Components

(Placeholder for future shared UI library, currently using shadcn/ui imported directly)

### packages/types - Shared Types

(TypeScript type definitions shared across packages)

## API Strategy

### Payload GraphQL

**Endpoint:** `/api/graphql`
**Auto-generated** from CMS collections
**Real-time:** Updates when schema changes

Example Query:
```graphql
query {
  tours {
    docs {
      id
      title
      description
      price
      duration
      category { name }
      media { url alt }
    }
  }
}
```

### REST API Routes

**Data-Fetching Functions (lib/api/):**
- `fetchTours()` - All tours with filters
- `fetchTourById()` - Single tour with full details
- `fetchFeaturedTours()` - Featured tours grid
- `fetchToursByCategoryId()` - Filter by category
- `fetchGuideById()` - Guide profile
- `fetchReviewsByTourId()` - Tour reviews
- `fetchRelatedTours()` - Recommendation engine
- `fetchTourSchema()` - JSON-LD structured data
- `fetchTrustStats()` - Statistics for hero

**Bokun API Routes (Phase 08.1):**
- `GET /api/bokun/availability` - Real-time availability
  - Response: Available dates with pricing
  - Cache: 60-second TTL
  - Auth: HMAC-SHA256 signature
  - Rate limit: 400 req/min with exponential backoff

- `POST /api/bokun/webhook` - Booking event handler
  - Signature verification: HMAC-SHA256
  - Event types: BOOKING_CREATED, BOOKING_CONFIRMED, PAYMENT_RECEIVED, etc.
  - Storage: Bookings collection
  - Acknowledgment: HTTP 200 response

**Semantic Search (Phase 08.1+):**
- `POST /api/search/semantic` - Vector similarity search
  - Input: Query string
  - Processing: OpenAI embeddings
  - Storage: pgvector database
  - Output: Ranked tour recommendations

**Concierge Wizard (Phase 08.5):**
- `POST /api/tours/recommend` - Personalized tour recommendations
  - Input: audience[], interests[] (Zod-validated)
  - Processing: Payload CMS query with audience tag matching
  - Storage: localStorage for returning visitors
  - Output: Top 6 matching tours with scores

## CI/CD Pipeline

**File:** `.github/workflows/ci.yml`

**Jobs:**
1. **Lint & Type Check**
   - Node 20, npm ci
   - ESLint 9: Check code quality
   - TypeScript: Strict mode validation
   - Prettier: Format verification

2. **Build**
   - Node 20, npm ci
   - `npm run build` - Production build
   - Requires: DATABASE_URL, PAYLOAD_SECRET, NEXT_PUBLIC_URL

**Triggers:** Push to main/staging/develop, PRs to main/staging

**Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection
- `PAYLOAD_SECRET` - Encryption key
- `NEXT_PUBLIC_URL` - Public site URL
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob (optional)
- `BOKUN_ACCESS_KEY` - Bokun API key
- `BOKUN_SECRET_KEY` - Bokun secret
- `BOKUN_ENVIRONMENT` - test|production
- `OPENAI_API_KEY` - OpenAI embeddings

## Development Commands

```bash
# Development
npm run dev              # Start dev server + Payload CMS

# Build & Production
npm run build            # Build for production
npm run start            # Run production build

# Code Quality
npm run lint             # Check code quality
npm run type-check       # TypeScript validation
npm run format           # Auto-format code

# Testing
npm test                 # Run tests
npm test -- --watch     # Watch mode
npm test -- --coverage  # Coverage report

# Payload CMS
npm run payload          # Payload CLI
npm run payload:generate-types  # Generate TS types from schema
```

## Current State (Phase 08.1 - Complete, Excel Import/Export included)

### Completed Phases
- Phase 01: Foundation ✅
- Phase 02: i18n ✅
- Phase 03: Data Models ✅
- Phase 04: Design System ✅
- Phase 05: Homepage ✅
- Phase 06: Tour Catalog ✅
- Phase 07: Tour Detail ✅
- Phase 08.1: Bokun Booking Integration ✅
- Phase 08.5: Concierge Wizard ✅
- Phase 09.5: Guide Profiles ✅
- Phase 10: Accessibility + SEO ✅

### Phase 08.1 Deliverables
- Bokun API client with HMAC-SHA256 authentication
- Availability caching (60-second TTL)
- Booking widget with fallback component
- Webhook handler with signature verification
- Bookings collection for data persistence
- Rate limit handling with exponential backoff
- Semantic search with pgvector + OpenAI embeddings
- Excel/CSV import-export with format-agnostic pipeline
- Zod validation for all import formats

### Phase 08.5 Deliverables
- 3-step Concierge Wizard on /find-tour
- Step 1: Audience selection (family, couples, corporate, seniors, solo)
- Step 2: Interest selection (history, art, food/wine, photography, adventure, architecture)
- Step 3: Personalized tour recommendations (top 6 matches from Payload CMS)
- localStorage persistence for returning visitors
- Full i18n support (SV/EN/DE)
- Zod-validated POST /api/tours/recommend endpoint
- 60 unit tests with 100% coverage on new components
- Accessible (aria-pressed, aria-label, keyboard nav, progressbar)

### Phase 09.5 Deliverables
- Guide profiles collection with listing/detail pages
- Guide fields: name, bio, credentials, languages, photo
- GuideListSchema + GuideDetailSchema (Schema.org Person)
- Integration with tour detail pages

### Phase 10 Deliverables (2026-02-15)
- **SEO Foundation:** robots.txt, sitemap.xml (9 static + CMS dynamic routes, 3-locale hreflang)
- **Metadata:** All 10 public pages upgraded to generatePageMetadata() (OG, Twitter, hreflang, canonical)
- **Schema.org:** 4 new components (AboutSchema, GuideDetailSchema, GuideListSchema, TourListSchema)
- **Accessibility:** Skip link, visually-hidden, ARIA announcer div, focus styles, reduced motion CSS
- **Testing:** 102 new unit tests (579 total, 100% pass rate)
- **Commit:** f961c3f on master branch

### Phase 11 Deliverables (2026-02-15)
- **Image Optimization:** Next.js Image config (deviceSizes, imageSizes, minimumCacheTTL: 3600, optimizePackageImports)
- **Static Caching:** Cache-Control: max-age=31536000, immutable for versioned assets
- **Dynamic Imports:** Lazy-loaded ConciergeWizardContainer, BookingSection for reduced initial bundle
- **Data Caching:** unstable_cache for tours/categories with on-demand revalidateTag invalidation
- **Preconnect Hints:** Blob CDN preconnect for faster image loading
- **Web Vitals:** useReportWebVitals hook + POST /api/analytics/vitals with rate limiting (60 req/min)
- **Lighthouse CI:** lighthouserc.js config + GitHub Actions workflow for monitoring
- **Testing:** 21 new unit tests (600 total, 100% pass rate)

### Phase 12 Deliverables (2026-02-21)
- **Test Coverage:** 1009 total unit tests (444 new tests), 90%+ coverage across both workspaces
- **apps/web Coverage:** 95.9% statement coverage (all 4 metrics >80%)
- **packages/cms Coverage:** 89.7% statement coverage (all 4 metrics >80%)
- **New Test Files:** 12 new test files with comprehensive coverage for:
  - Email services (transporter, notifications, confirmations)
  - Bokun API integration (client, availability, booking service)
  - AI/semantic search (embeddings, vector search)
  - CSV/Excel import-export (validators, mappers, converters)
  - Web Vitals monitoring and analytics
- **Coverage Config:** vitest.config.ts updated to exclude type-only (bokun-types.ts) and config-only (fonts.ts) files
- **Rebrand:** Source code references updated from HeritageGuiding to Private Tours

## Codebase Metrics

| Metric | Value |
|--------|-------|
| **Total TypeScript Files** | 165+ |
| **Frontend LOC** | ~69,000 |
| **CMS LOC** | ~35,000 |
| **Total Tokens** | 380,000+ |
| **React Components** | 70+ |
| **API Functions** | 9 (data-fetching) |
| **API Routes** | 4 (Bokun availability/webhook, semantic search, wizard recommendations) |
| **SEO Components** | 7 (Schema.org) |
| **Accessibility Components** | 2 (skip link, visually-hidden) |
| **Excel/CSV Services** | 9 |
| **Admin Components** | 6 (import/export UI) |
| **Wizard Components** | 5 (Phase 08.5) |
| **CMS Collections** | 10+ |
| **Field Modules** | 7 |
| **Unit Tests** | 1009 (444 new Phase 12) |
| **Test Files** | 44 (33 in apps/web, 11 in packages/cms) |
| **Test Coverage** | apps/web 95.9% stmts, packages/cms 89.7% stmts |
| **Coverage Metrics** | All 4 metrics (stmts/branch/funcs/lines) >80% both workspaces |
| **TypeScript Coverage** | 100% |
| **Accessibility** | WCAG 2.1 AA foundations |
| **Lighthouse Score** | 90+ (Lighthouse CI monitored) |
| **Performance Monitoring** | Web Vitals API + Lighthouse CI |

## File Size Management

**Current Status:**
- No code files exceed 200 LOC
- Documentation under 800 LOC target
- Component modularization complete
- Utility functions properly extracted

## Notes

- **Payload Admin:** Accessible at `http://localhost:3000/admin`
- **GraphQL:** Available at `/api/graphql`
- **Type Generation:** Run after schema changes: `npm run payload:generate-types`
- **Database Migrations:** Payload handles automatically
- **pgvector Extension:** Required for semantic search (auto-initialized in migrations)
- **Node Modules:** Root-level installation (monorepo pattern)

## Phase Roadmap

| Phase | Focus | Status |
|-------|-------|--------|
| **01** | Foundation | ✅ Complete |
| **02** | i18n | ✅ Complete |
| **03** | Data Models | ✅ Complete |
| **04** | Design System | ✅ Complete |
| **05** | Homepage | ✅ Complete |
| **06** | Catalog | ✅ Complete |
| **07** | Detail Page | ✅ Complete |
| **08.1** | Bokun Booking | ✅ Complete |
| **08.5** | Concierge Wizard | ✅ Complete |
| **09.5** | Guide Profiles | ✅ Complete |
| **10** | Accessibility + SEO | ✅ Complete |
| **11** | Performance Optimization | ✅ Complete |
| **09** | Groups & WhatsApp | Pending |
| **12** | Documentation + Deployment | Planned |

---

**Last Updated:** February 21, 2026
**Document Status:** Phase 12 Complete (Unit Test Coverage Improvement: 600→1009 tests, 52%→90%+ coverage)
