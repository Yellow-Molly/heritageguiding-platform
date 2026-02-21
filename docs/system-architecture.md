# System Architecture - Private Tours Platform

**Last Updated:** February 21, 2026
**Phase:** 12 - Unit Test Coverage Improvement (Complete)
**Status:** 1009 unit tests (90%+ coverage), comprehensive service/integration testing, email services, Bokun API tests, AI embeddings tests, CSV/Excel tests
**Recent Update:** Test coverage expanded from ~52% to 90%+, 444 new unit tests across 12 test files, rebrand from HeritageGuiding to Private Tours

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Browser                                              │   │
│  │  - React 19 Components                                │   │
│  │  - Next.js App Router                                │   │
│  │  - Tailwind CSS Styling                              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↑↓
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                       │
│                  (Next.js 16 Server, Turbopack)             │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Frontend Routes (Public)                             │   │
│  │  - Homepage: / (app/(frontend)/page.tsx)             │   │
│  │  - Tour Catalog: /tours (Phase 6+)                   │   │
│  │  - Tour Details: /tours/:id (Phase 7+)               │   │
│  │  - Concierge Wizard: /find-tour (Phase 8.5+)        │   │
│  │  - Import/Export: /admin/import (Phase 8.1+)         │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Admin Routes & API                                   │   │
│  │  - Admin Panel: /admin (Payload UI)                  │   │
│  │  - GraphQL: /api/graphql (Payload)                   │   │
│  │  - REST API: /api/[...slug] (Route handlers)         │   │
│  │  - Bokun: /api/bokun/* (availability, webhooks)      │   │
│  │  - Search: /api/search/semantic (vector search)      │   │
│  │  - Wizard: /api/tours/recommend (Concierge recs)     │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↑↓
┌─────────────────────────────────────────────────────────────┐
│                   Payload CMS Layer                          │
│                (Content & User Management)                   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Collections (Database Models - Phase 03 Complete)   │   │
│  │  - Users (admin users with role-based access)        │   │
│  │  - Media (images + file storage, Vercel Blob)        │   │
│  │  - Tours (logistics, inclusions, audience tags)      │   │
│  │  - Guides/Experts (credentials, languages, photo)    │   │
│  │  - Categories (themes & categorization)              │   │
│  │  - Cities & Neighborhoods (geographic data)          │   │
│  │  - Reviews (ratings, verified reviews)               │   │
│  │  - Pages (FAQ, About, Terms, Privacy - localized)    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Features                                             │   │
│  │  - Rich text editor (Lexical)                        │   │
│  │  - Image management with Vercel Blob                 │   │
│  │  - Role-based access control (RBAC)                  │   │
│  │  - TypeScript type generation                        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↑↓
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer (Storage)                      │
│                                                               │
│  ┌─────────────────────┐  ┌──────────────────────────────┐   │
│  │  PostgreSQL 15+     │  │  Vercel Blob (CDN)           │   │
│  │                     │  │                              │   │
│  │  - Users table      │  │  - Tour images               │   │
│  │  - Media metadata   │  │  - Guide photos              │   │
│  │  - Tour data        │  │  - Media files               │   │
│  │  - Content          │  │                              │   │
│  │  - Bookings (P3+)   │  │  - Responsive images         │   │
│  │  - Reviews (P3+)    │  │  - WebP optimization         │   │
│  └─────────────────────┘  └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Component Interactions

### Request Flow - Concierge Wizard (Phase 08.5)

```
1. User visits /find-tour
   ↓
2. Next.js App Router renders wizard page (server component)
   ↓
3. Client Component (ConciergeWizardContainer) hydrates:
   - Checks localStorage for previous selections
   - Restores state if returning visitor
   ↓
4. Step 1: User selects audience (family, couples, corporate, seniors, solo)
   - WizardStepSelector renders option cards
   - Multi-select with keyboard navigation
   - aria-pressed states for accessibility
   ↓
5. Step 2: User selects interests (history, art, food/wine, etc.)
   - Same component reused with different options
   - Progress indicator updates to 67%
   ↓
6. Step 3: System fetches recommendations
   - POST /api/tours/recommend with Zod validation
   - Payload CMS query matches audience tags
   - Returns top 6 tours with scores
   ↓
7. WizardTourResults renders:
   - Display tour cards with images
   - "View Tour" links to /tours/{slug}
   - "Start Over" button resets wizard
   ↓
8. localStorage persists selections for next visit
```

### Request Flow - Public Page View (Tour Catalog - Phase 07)

```
1. User visits /tours (public route)
   ↓
2. Next.js App Router matches (frontend) layout
   ↓
3. Server Component (tours/page.tsx):
   - Fetches all categories via API
   - Passes categories to TourCatalogClient
   ↓
4. Client Component (TourCatalogClient):
   - Manages filter state (categories[], date range)
   - Updates URL query params (?categories=history,architecture&start=...&end=...)
   - Supports multi-select categories
   - Mobile drawer sync with desktop chips
   ↓
5. FilterBar renders (sticky at top):
   - CategoryChips: multi-select chips with URL state sync
   - Mobile Drawer: accessible drawer for small screens (syncs with desktop)
   - DatesPicker: select date range
   - ResultsCount: pluralized display of filtered tour count
   ↓
6. Tours Grid renders below FilterBar:
   - Maps through filtered tours array
   - Each tour card links to /tours/{slug}
   ↓
7. Browser receives HTML + interactive components
   ↓
8. React hydrates filter interactions + lazy loads images
   ↓
9. Images load from Vercel Blob CDN with WebP format
```

### Request Flow - Admin Page View

```
1. User visits /admin
   ↓
2. Payload CMS UI loads (Next.js route)
   ↓
3. User authentication check
   - Session lookup
   - Role validation
   ↓
4. Admin modifies collection (e.g., creates tour)
   ↓
5. Payload API writes to PostgreSQL
   ↓
6. Media files upload to Vercel Blob
   ↓
7. Confirmation + UI update
```


## Technology Layers

### Frontend (apps/web)

**Purpose:** User-facing application and admin interface
**Framework:** Next.js 16 with App Router (Turbopack default bundler)
**Language:** TypeScript
**Styling:** Tailwind CSS v4

**Key Directories:**
```
apps/web/
├── app/
│   ├── (frontend)/        # Public routes
│   │   ├── page.tsx       # Homepage
│   │   └── tours/         # Tour catalog pages (Phase 6-7)
│   ├── (payload)/         # Admin routes
│   │   ├── admin/         # Admin UI
│   │   ├── layout.tsx     # Payload layout wrapper
│   │   └── api/
│   │       └── graphql/   # GraphQL endpoint
│   ├── api/               # Route handlers
│   │   └── [...slug]/     # Generic API routes
│   ├── layout.tsx         # Root layout
│   ├── globals.css        # Global styles + utilities
│   └── middleware.ts      # next-intl routing
├── components/
│   ├── tour/              # Tour-specific components
│   │   ├── filter-bar/    # GetYourGuide-style filters (Phase 7)
│   │   │   ├── filter-bar.tsx
│   │   │   ├── category-chips.tsx
│   │   │   ├── dates-picker.tsx
│   │   │   ├── results-count.tsx
│   │   │   └── index.ts
│   │   ├── tour-card.tsx  # Individual tour card
│   │   ├── tour-catalog-client.tsx  # Client-side filter logic
│   │   └── index.ts
│   ├── wizard/            # Concierge Wizard (Phase 8.5)
│   │   ├── concierge-wizard-container.tsx
│   │   ├── wizard-step-selector.tsx
│   │   ├── wizard-option-card.tsx
│   │   ├── wizard-progress-indicator.tsx
│   │   └── wizard-tour-results.tsx
│   ├── ui/                # Shared UI components
│   │   ├── popover.tsx    # Radix UI Popover wrapper
│   │   └── ...other components
│   └── home/              # Homepage components
├── lib/                   # Utilities & helpers
│   ├── api/               # Data-fetching functions
│   ├── i18n-format.ts     # i18n utilities
│   └── ...other utilities
├── types/                 # TypeScript definitions
├── messages/              # i18n translations (SV/EN/DE)
│   ├── sv.json
│   ├── en.json
│   └── de.json
└── public/                # Static assets
```

**Server vs Client:**
- All routes are **Server Components** by default
- Use `'use client'` only for interactive features (Phase 2+)
- Payload admin already handles its own client code

### CMS Layer (packages/cms)

**Purpose:** Content management, data models, access control
**Framework:** Payload CMS 3.75
**Language:** TypeScript
**Database:** PostgreSQL

**Architecture:**
```
packages/cms/
├── payload.config.ts      # Main Payload configuration
├── collections/
│   ├── index.ts           # Export all collections
│   ├── users.ts           # Admin user management
│   └── media.ts           # File/image management
├── access/                # Access control (Phase 2+)
└── hooks/                 # Field hooks (Phase 2+)
```

**Collections - Current:**

| Collection | Status | Purpose |
|-----------|--------|---------|
| **Users** | Phase 01 ✅ | Admin authentication & authorization |
| **Media** | Phase 01 ✅ | Image/file upload & management |
| **Tours** | Phase 03 ✅ | Tour listings with bokunExperienceId for widget integration |
| **Guides** | Phase 03 ✅ | Expert profiles with credentials |
| **Categories** | Phase 03 ✅ | Tour themes/activity classification |
| **Reviews** | Phase 03 ✅ | Customer feedback with ratings |
| **Cities** | Phase 03 ✅ | Geographic location data |
| **Neighborhoods** | Phase 03 ✅ | City-based area classification |
| **Pages** | Phase 03 ✅ | Static pages (FAQ, About, Terms, Privacy) |
| **Bookings** | Phase 08.1 ✅ | Bokun webhook events, status, customer info, payment tracking |

### Data Layer (PostgreSQL + Vercel Blob)

**PostgreSQL:**
- User accounts and roles
- Tour metadata
- Booking data
- Reviews and ratings
- Media file metadata (path, alt text, etc.)

**Vercel Blob:**
- Actual image/media files
- Responsive image variants
- CDN distribution

## API Strategy

### Payload GraphQL

**Endpoint:** `/api/graphql`
**Automatic:** Generated from collections

**Example Query:**
```graphql
query {
  tours {
    docs {
      id
      title
      description
      price
      duration
      category {
        name
      }
      media {
        url
        alt
      }
    }
  }
}
```

**Common Queries (Phase 07-08.5):**
- `getAllCategories()` - Fetch all tour categories (for FilterBar)
- `getToursByFilter()` - Filter tours by category, date, price
- `getToursByAudienceAndInterests()` - Match tours by audience tags (Concierge Wizard)

### REST API Routes (Data-Fetching Functions)

**Implemented (Phase 07):**
- `fetchTours()` - Get all tours with filters
- `fetchTourById()` - Get single tour with full details
- `fetchToursByCategoryId()` - Get tours by category
- `fetchGuideById()` - Get guide profile
- `fetchReviewsByTourId()` - Get tour reviews
- `fetchRelatedTours()` - Get related tour recommendations
- `fetchTourSchema()` - Generate JSON-LD schema

**Bokun Integration (Phase 08.1 - In Progress):**
- `GET /api/bokun/availability` - Real-time availability with 60s caching (lib/bokun/bokun-availability-service-with-caching.ts)
- `POST /api/bokun/webhook` - Webhook handler with HMAC-SHA256 signature verification (app/api/bokun/webhook/route.ts)

**Features:**
- HMAC-SHA256 authentication for API requests
- Availability cache with 60-second TTL
- Webhook signature verification using HMAC
- Rate limit handling with exponential backoff (400 req/min)
- Webhook event types: BOOKING_CREATED, BOOKING_CONFIRMED, PAYMENT_RECEIVED, etc.

**Excel/CSV Import-Export (Phase 08.1):**
- `POST /api/admin/import` - Upload Excel/CSV file
- `GET /api/admin/export` - Download tours as Excel/CSV
- Format-agnostic pipeline: Parse → Map → Validate (Zod) → Transform → Create
- ExcelJS 4.4.0 for Excel handling

**Concierge Wizard (Phase 08.5 - Complete):**
- `POST /api/tours/recommend` - Personalized recommendations
  - Input: audience[], interests[] (Zod-validated)
  - Processing: Query Payload CMS with audience tag matching
  - Output: Top 6 matching tours with scores
  - Features: localStorage persistence, i18n, accessibility

**Planned (Phase 09+):**
- POST `/api/bookings` - Create Bokun booking
- POST `/api/inquiries` - Group booking inquiry
- POST `/api/webhooks/reminder` - Booking reminders

## Data Models (Planned)

### Collections & Fields

**Tours (Phase 3)**
```typescript
{
  slug: 'tours',
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'description', type: 'richText' },
    { name: 'price', type: 'number' },
    { name: 'duration', type: 'number' },
    { name: 'guide', type: 'relationship', relationTo: 'guides' },
    { name: 'category', type: 'relationship', relationTo: 'categories' },
    { name: 'media', type: 'array', fields: [...] },
    { name: 'accessibility', type: 'checkbox' },
    { name: 'published', type: 'checkbox', defaultValue: false },
  ]
}
```

**Guides (Phase 3)**
```typescript
{
  slug: 'guides',
  fields: [
    { name: 'name', type: 'text', required: true },
    { name: 'bio', type: 'richText' },
    { name: 'credentials', type: 'array', fields: [...] },
    { name: 'photo', type: 'upload', relationTo: 'media' },
  ]
}
```

## Deployment Architecture

### Frontend Hosting (Vercel)

```
Push to main/develop
  ↓
GitHub Actions Workflow
  ↓
Lint + Type Check
  ↓
Build Next.js
  ↓
Deploy to Vercel Preview/Production
  ↓
Domain: https://heritageguiding.com
```

### Database & CMS (PostgreSQL Host)

```
Provider: Supabase, Railway, or AWS RDS
Environment: Production, Staging, Development
Connection: Via DATABASE_URL secret
Backups: Daily automated backups
```

### CI/CD Pipeline

**File:** `.github/workflows/ci.yml`

**Stages:**
1. **Lint & Type Check** (all PRs)
2. **Build** (after lint passes)
3. **Deploy** (main branch only - not yet implemented)

**Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection
- `PAYLOAD_SECRET` - Payload encryption key
- `NEXT_PUBLIC_URL` - Public site URL
- `BLOB_READ_WRITE_TOKEN` - Vercel Blob token

## Security Architecture

### Authentication

**Admin Users (Phase 01):**
- Email + password
- Stored securely in PostgreSQL
- Session-based auth via Payload

**Future (Phase 5+):**
- Customer accounts
- OAuth providers (Google, GitHub)
- Two-factor authentication

### Authorization

**Role-Based Access Control (RBAC):**
- Admin - Full access to all collections
- Editor - Create/update content (not user management)
- Viewer - Read-only access (future)

**Collection-Level Access:**
```typescript
// Example from packages/cms/collections/users.ts
access: {
  read: ({ req }) => req.user?.role === 'admin',
  create: ({ req }) => req.user?.role === 'admin',
  update: ({ req }) => req.user?.role === 'admin',
  delete: ({ req }) => req.user?.role === 'admin',
}
```

### Environment Security

- No secrets in code
- All sensitive data via environment variables
- GitHub Secrets for CI/CD
- Production secrets stored securely

## Performance Architecture (Phase 11)

### Frontend Optimization

- **SSR:** Server-side rendering for fast initial load
- **Image Config:** Next.js Image component with optimized deviceSizes, imageSizes, minimumCacheTTL (3600s)
- **Dynamic Imports:** Lazy loading for ConciergeWizardContainer, BookingSection reduces initial bundle
- **Code Splitting:** Route-based code splitting via Next.js App Router
- **Static Assets:** Cache-Control headers (max-age=31536000, immutable) for versioned files
- **Preconnect:** CDN domain preconnect hints for faster resource loading

### Data Caching Strategy

- **unstable_cache:** Server-side caching for fetchTours(), fetchCategories() with revalidateTag
- **On-Demand Revalidation:** revalidateTag('tours', 'categories') triggered on CMS updates
- **60-second Availability Cache:** Bokun API responses cached with TTL
- **localStorage:** Concierge Wizard persistence for returning visitors

### Database Optimization

- Indexes on frequently queried fields (tour slug, category id)
- Connection pooling via PostgreSQL
- Avoid N+1 queries via GraphQL field selection
- pgvector indexes for semantic search

### Content Delivery

- **Vercel Blob CDN:** Images with WebP, responsive variants, lazy loading
- **Global Edge Caching:** Vercel edge network for instant static asset delivery
- **Automatic Optimization:** Sharp for image processing, responsive sizing

### Web Vitals Monitoring

- **useReportWebVitals Hook:** Captures LCP, FID, CLS, INP, TTFB metrics
- **Analytics Endpoint:** POST /api/analytics/vitals (rate limited: 60 req/min)
- **Lighthouse CI:** Automated performance monitoring via GitHub Actions (lighthouserc.js)
- **Metrics Dashboards:** Track 90+ Lighthouse scores across builds

## Monitoring & Observability

**Planned (Phase 14+):**
- Error tracking (Sentry)
- Analytics (Vercel Analytics)
- Performance monitoring (Web Vitals)
- Log aggregation

## Completed Architecture Phases

### Phase 02 (i18n) ✅
- next-intl middleware integrated
- SV/EN/DE language routing
- Localized content throughout Payload + frontend

### Phase 03-04 (Data & Design) ✅
- 9 CMS collections with relationships
- Field modules for reusability
- Design system with tokens

### Phase 05-07 (Pages & Components) ✅
- 50+ React components (homepage, catalog, detail)
- GetYourGuide-style FilterBar with sticky positioning
  - CategoryChips: multi-select with URL state persistence
  - DatesPicker: react-day-picker v9 with date validation
  - ResultsCount: dynamic count display with pluralization
- 7 data-fetching API functions
- Server-side rendering with SSR
- Full i18n on all pages (SV/EN/DE)
- 18 FilterBar component tests (100% passing)

## Completed Architecture Changes

### Phase 08.1 (Bokun Integration + Excel Import/Export) - COMPLETE ✅
- ✅ Bokun API with HMAC-SHA256 authentication
- ✅ Booking widget integration with fallback (bokun-booking-widget-with-fallback.tsx)
- ✅ Webhook handlers for booking events with signature verification
- ✅ Availability caching with 60-second TTL
- ✅ Rate limit handling (400 req/min) with exponential backoff
- ✅ Bookings collection for webhook data persistence
- ✅ Environment variables: BOKUN_ACCESS_KEY, BOKUN_SECRET_KEY, BOKUN_ENVIRONMENT
- ✅ Semantic search with pgvector + OpenAI embeddings (text-embedding-3-small, 1536 dims)
- ✅ Excel/CSV import-export (format-agnostic pipeline, Zod validation, ExcelJS 4.4.0)
- ✅ API endpoints for availability, webhooks, semantic search, import/export
- ✅ Turbopack/webpack coexistence: webpack config present but ignored by Turbopack

### Phase 08.5 (Concierge Wizard) - COMPLETE ✅
- ✅ 3-step wizard on /find-tour (replaces BubblaV AI chat)
- ✅ Step 1: Audience selection (family, couples, corporate, seniors, solo)
- ✅ Step 2: Interest selection (history, art, food/wine, photography, adventure, architecture)
- ✅ Step 3: Personalized tour recommendations from Payload CMS API
- ✅ localStorage persistence for returning visitors
- ✅ Full i18n support (EN/SV/DE)
- ✅ Zod-validated POST /api/tours/recommend endpoint
- ✅ 60 unit tests, 100% coverage on new code
- ✅ Accessible (aria-pressed, aria-label, keyboard navigation, progressbar)

### Phase 11 (Performance) - COMPLETE ✅
- ✅ Next.js Image optimization with config tuning
- ✅ Static asset caching with immutable headers
- ✅ Dynamic imports for lazy loading (ConciergeWizardContainer, BookingSection)
- ✅ Server-side caching with unstable_cache + on-demand revalidateTag
- ✅ Preconnect hints for Blob CDN
- ✅ Web Vitals monitoring hook + analytics API
- ✅ Lighthouse CI integration with GitHub Actions
- ✅ 21 new performance tests (600 total)

### Phase 09+ (Advanced) - Planned
- WhatsApp Business API integration
- Group inquiry management system
- Email notification pipeline
- Advanced analytics dashboard

## Deprecations & Compatibility Notes

### Next.js 16 Changes (from 15)
- **middleware.ts → proxy.ts:** Rename is deprecation warning only, not breaking. `middleware.ts` still works.
- **unstable_cache:** NOT renamed. `cacheLife` and `cacheTag` lost `unstable_` prefix, but `unstable_cache` remains.

### Turbopack & Webpack Coexistence
- Turbopack is the default bundler in Next.js 16
- Custom webpack config (if present) gets ignored by Turbopack
- No errors even with webpack config present—Turbopack simply skips it

### Node.js 24 Environment Variables
Set in CI/CD (GitHub Actions) and Vercel:
- `NODE_VERSION=24` or similar
- Required for ESM resolution in Vercel builds

## Questions & References

- **Code Standards:** See `./code-standards.md`
- **Project Plan:** See `./MVP-PROJECT-PLAN.md`
- **Setup Details:** See `./infrastructure-setup.md`
