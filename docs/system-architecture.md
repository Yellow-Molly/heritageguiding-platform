# System Architecture - HeritageGuiding Platform

**Last Updated:** January 19, 2026
**Phase:** 07 - Tour Detail
**Status:** Ready for Phase 08 - Rezdy Integration

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
│                    (Next.js 15 Server)                       │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Frontend Routes (Public)                             │   │
│  │  - Homepage: / (app/(frontend)/page.tsx)             │   │
│  │  - Tour Catalog: /tours (Phase 2+)                   │   │
│  │  - Tour Details: /tours/:id (Phase 2+)               │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Admin Routes & API                                   │   │
│  │  - Admin Panel: /admin (Payload UI)                  │   │
│  │  - GraphQL: /api/graphql (Payload)                   │   │
│  │  - REST API: /api/[...slug] (Route handlers)         │   │
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

### Request Flow - Public Page View

```
1. User visits /tours (public route)
   ↓
2. Next.js App Router matches (frontend) layout
   ↓
3. React Server Component fetches tour data
   - Query Payload GraphQL API
   - Or fetch from PostgreSQL directly
   ↓
4. Component renders with data
   ↓
5. Browser receives HTML (SSR)
   ↓
6. React hydrates interactive elements
   ↓
7. Images load from Vercel Blob CDN
```

### Request Flow - Admin Action

```
1. Admin navigates to /admin
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
**Framework:** Next.js 15 with App Router
**Language:** TypeScript
**Styling:** Tailwind CSS v4

**Key Directories:**
```
apps/web/
├── app/
│   ├── (frontend)/        # Public routes
│   │   └── page.tsx       # Homepage
│   ├── (payload)/         # Admin routes
│   │   ├── admin/         # Admin UI
│   │   ├── layout.tsx     # Payload layout wrapper
│   │   └── api/
│   │       └── graphql/   # GraphQL endpoint
│   ├── api/               # Route handlers
│   │   └── [...slug]/     # Generic API routes
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # React components (Phase 2+)
├── lib/                   # Utilities & helpers (Phase 2+)
├── types/                 # TypeScript definitions (Phase 2+)
└── public/                # Static assets
```

**Server vs Client:**
- All routes are **Server Components** by default
- Use `'use client'` only for interactive features (Phase 2+)
- Payload admin already handles its own client code

### CMS Layer (packages/cms)

**Purpose:** Content management, data models, access control
**Framework:** Payload CMS 3.0
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
| **Tours** | Phase 03 ✅ | Tour listings with full details |
| **Guides** | Phase 03 ✅ | Expert profiles with credentials |
| **Categories** | Phase 03 ✅ | Tour themes/activity classification |
| **Reviews** | Phase 03 ✅ | Customer feedback with ratings |
| **Cities** | Phase 03 ✅ | Geographic location data |
| **Neighborhoods** | Phase 03 ✅ | City-based area classification |
| **Pages** | Phase 03 ✅ | Static pages (FAQ, About, Terms, Privacy) |

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
      media {
        url
        alt
      }
    }
  }
}
```

### REST API Routes (Data-Fetching Functions)

**Implemented (Phase 07):**
- `fetchTours()` - Get all tours with filters
- `fetchTourById()` - Get single tour with full details
- `fetchToursByCategoryId()` - Get tours by category
- `fetchGuideById()` - Get guide profile
- `fetchReviewsByTourId()` - Get tour reviews
- `fetchRelatedTours()` - Get related tour recommendations
- `fetchTourSchema()` - Generate JSON-LD schema

**Planned (Phase 08+):**
- POST `/api/bookings` - Create Rezdy booking
- POST `/api/inquiries` - Group booking inquiry
- GET `/api/availability/:tourId` - Real-time availability
- POST `/api/webhooks/rezdy` - Rezdy confirmation webhooks

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

## Performance Considerations

### Frontend Optimization

- **SSR:** Server-side rendering for fast initial load
- **Code Splitting:** Dynamic imports for large features
- **Images:** Vercel Blob CDN with WebP format
- **Caching:** Next.js automatic caching + CDN

### Database Optimization

- Indexes on frequently queried fields
- Connection pooling via PostgreSQL
- Avoid N+1 queries in API endpoints

### Content Delivery

- Vercel Blob CDN for images
- Global edge caching (Vercel)
- Automatic image optimization

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
- 7 data-fetching API functions
- Server-side rendering with SSR
- Full i18n on all pages

## Planned Architecture Changes

### Phase 08 (Rezdy Integration)
- Rezdy OAuth2 authentication
- Booking widget iframe integration
- Webhook handlers for confirmations
- Real-time availability sync

### Phase 09+ (Advanced)
- Vector database for semantic search
- WhatsApp Business API integration
- Group inquiry management system
- Email notification pipeline

## Questions & References

- **Code Standards:** See `./code-standards.md`
- **Project Plan:** See `./MVP-PROJECT-PLAN.md`
- **Setup Details:** See `./INFRASTRUCTURE-SETUP-COMPLETE.md`
