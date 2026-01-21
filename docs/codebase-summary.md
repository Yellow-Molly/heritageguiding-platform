# Codebase Summary - HeritageGuiding Platform

**Last Updated:** January 19, 2026
**Phase:** 07 - Tour Detail (Complete)
**Status:** Ready for Phase 08 - Rezdy Integration

## Overview

HeritageGuiding is an AI-first tourism booking platform consolidating Stockholm's heritage tourism market. Monorepo with Next.js 15 frontend (61K LOC, 50+ components, 7 APIs, 50+ tests) and Payload CMS 3.0 backend (30K LOC, 9 collections, 3-locale support).

## Repository Structure

```
heritageguiding-platform/
├── apps/web/              # Next.js 15 frontend (SSR + static)
├── packages/
│   ├── cms/              # Payload CMS 3.0 config + collections
│   ├── ui/               # Shared UI components (shadcn/ui)
│   └── types/            # Shared TypeScript definitions
├── .github/workflows/    # CI/CD pipelines
├── docs/                 # Project documentation
├── plans/                # Development plans & reports
└── scripts/              # Build utilities
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS |
| **CMS** | Payload CMS 3.0, Lexical Editor, PostgreSQL |
| **i18n** | next-intl (SV/EN/DE routing & translations) |
| **Database** | PostgreSQL 15+ |
| **Styling** | Tailwind CSS v4, PostCSS |
| **Storage** | Vercel Blob (images) |
| **Code Quality** | ESLint 9, Prettier 3, TypeScript 5 |
| **Hosting** | Vercel (frontend), PostgreSQL host (database) |
| **CI/CD** | GitHub Actions |

## Key Dependencies

### Frontend (apps/web)
```json
{
  "@payloadcms/db-postgres": "^3.70.0",
  "@payloadcms/next": "^3.70.0",
  "@payloadcms/richtext-lexical": "^3.70.0",
  "@payloadcms/storage-vercel-blob": "^3.70.0",
  "@radix-ui/react-popover": "^1.x",
  "next": "^15.5.9",
  "next-intl": "^3.x",
  "date-fns": "^3.x",
  "payload": "^3.70.0",
  "react": "^19.2.3",
  "react-day-picker": "^9.11.1",
  "react-dom": "^19.2.3",
  "sharp": "^0.34.5",
  "tailwindcss": "^4",
  "typescript": "^5"
}
```

### CMS (packages/cms)
```json
{
  "@payloadcms/db-postgres": "^3.70.0",
  "@payloadcms/richtext-lexical": "^3.70.0",
  "@payloadcms/storage-vercel-blob": "^3.70.0",
  "payload": "^3.70.0"
}
```

## Project Structure Details

### apps/web - Next.js Frontend

**Key Files:**
- `app/layout.tsx` - Root layout with globals.css
- `app/(frontend)/page.tsx` - Homepage (placeholder)
- `app/(payload)/admin/` - Payload admin interface
- `app/(payload)/api/graphql/route.ts` - GraphQL endpoint
- `next.config.ts` - Next.js configuration
- `tailwind.config.ts` - Tailwind customization
- `eslint.config.mjs` - ESLint rules
- `.prettierrc` - Code formatting config

**App Structure:**
- `[locale]/(frontend)/` - Localized public-facing routes
- `(payload)/` - Admin & API routes (non-localized)
- `api/` - Route handlers
- `middleware.ts` - next-intl routing middleware
- `i18n.ts` - Locale configuration

**Tour Catalog Components (Phase 07):**
- `components/tour/filter-bar/` - GetYourGuide-style filter bar (sticky)
  - `filter-bar.tsx` - Main container with scroll shadow
  - `category-chips.tsx` - Multi-select chips with URL state
  - `dates-picker.tsx` - Date range picker (react-day-picker v9)
  - `results-count.tsx` - Pluralized results display
- `components/ui/popover.tsx` - Radix UI Popover wrapper

**i18n Structure (Phase 02):**
- `messages/sv.json` - Swedish translations
- `messages/en.json` - English translations
- `messages/de.json` - German translations
- `components/language-switcher/` - Language selection component
- `lib/i18n-format.ts` - Date/time/currency formatting utilities
- `lib/seo.ts` - SEO utilities with hreflang support

### packages/cms - Payload Configuration

**Collections (Phase 03):**
1. **users** - Admin users with role-based access control
   - Fields: name, email (auth), role (admin/editor)
   - Access: Admins manage all, users read own data

2. **media** - Image/file management
   - Vercel Blob storage integration
   - Responsive image handling
   - Localized fields: alt text, caption (SV/EN/DE)
3. **tours** - Tours with logistics, inclusions, audience tags (177 lines)
4. **guides** - Tour guides/experts with credentials & languages
5. **categories** - Tour categories/themes
6. **cities** - Geographic cities data
7. **neighborhoods** - Stockholm neighborhoods
8. **reviews** - Tour reviews with ratings
9. **pages** - Static pages (FAQ, About, Terms, Privacy)

**Field Modules:**
- `slug-field.ts` - Unique slug generation
- `seo-fields.ts` - Meta title, description, OG image
- `accessibility-fields.ts` - WCAG compliance fields
- `logistics-fields.ts` - Meeting point, coordinates, Google Maps
- `tour-pricing-fields.ts` - Price, currency, discounts
- `tour-inclusion-fields.ts` - Inclusions, exclusions, items
- `tour-audience-fields.ts` - 10 audience tags for Concierge Wizard

**Access Control:**
- `is-admin.ts` - Admin-only operations
- `is-authenticated.ts` - Authenticated user access

**Hooks:**
- `format-slug.ts` - URL-safe slug generation

**Configuration:**
- Secret: `PAYLOAD_SECRET` (from env)
- Database: PostgreSQL with connection pooling
- Editor: Lexical rich text editor
- Storage: Vercel Blob for media files
- Localization: SV (default), EN, DE with fallback support
- i18n: SV/EN/DE localization per field

### packages/ui - Shared Components

(To be populated in Phase 04 - Design System)

### packages/types - Shared Types

(To be populated as needed)

## CI/CD Pipeline

**File:** `.github/workflows/ci.yml`

**Jobs:**
1. **Lint & Type Check** (runs on push/PR)
   - Node 20, npm ci
   - Type checking: `npm run type-check`
   - Linting: `npm run lint`
   - Format check: `npm run format:check`

2. **Build** (runs after lint success)
   - Node 20, npm ci
   - Build: `npm run build`
   - Requires: DATABASE_URL, PAYLOAD_SECRET, NEXT_PUBLIC_URL

**Triggers:**
- Push to: main, staging, develop
- PR to: main, staging

## Environment Variables

**Required for Build:**
```
DATABASE_URL=postgresql://...
PAYLOAD_SECRET=<32+ char secret>
NEXT_PUBLIC_URL=https://domain.com
BLOB_READ_WRITE_TOKEN=<optional - for Vercel Blob>
```

**Node Versions:**
- Development: Node 20+ (local)
- CI: Node 20 (GitHub Actions)
- Target: npm 10+

## Development Commands

### Frontend (apps/web)
```bash
npm run dev           # Start dev server
npm run build         # Build for production
npm run start         # Run production build
npm run lint          # Check code quality
npm run type-check    # TypeScript validation
npm run format        # Auto-format code
```

### Payload CLI
```bash
npm run payload                 # Payload CLI
npm run payload:generate-types  # Generate TS types from schema
```

## Current State (Phase 07 - Complete)

**Phase 01-03 Foundation:**
- ✅ Monorepo, Next.js 15, Payload CMS 3.0, PostgreSQL setup
- ✅ i18n with next-intl (SV/EN/DE routing + persistence)
- ✅ 9 CMS collections, 7 field modules, RBAC configured
- ✅ CI/CD pipeline with linting, type-check, build

**Phase 04 - Design System (Completed):**
- ✅ Navy/Gold/Coral color palette
- ✅ Playfair/Inter typography system
- ✅ Spacing, shadow, animation tokens
- ✅ Component patterns (buttons, cards, trust indicators)
- ✅ WCAG 2.1 AA accessibility compliance
- ✅ Responsive design across all breakpoints

**Phase 05 - Homepage (Completed):**
- ✅ Hero section with parallax imagery
- ✅ Trust signals section with statistics
- ✅ Featured tours grid (3 columns)
- ✅ CTA sections with images
- ✅ Why Choose Us benefits section
- ✅ Testimonials carousel
- ✅ Footer with newsletter signup
- ✅ Full i18n support (SV/EN/DE)

**Phase 06 - Tour Catalog (Completed):**
- ✅ Grid/list view toggle with persistence
- ✅ Category, price, duration filtering
- ✅ Search functionality
- ✅ Sort by rating, price, duration
- ✅ Pagination (12 tours per page)
- ✅ Responsive design (mobile-first)
- ✅ Full i18n support

**Phase 07 - Tour Detail & Filter Bar (Completed):**
- ✅ Full-screen image gallery with zoom
- ✅ Tour facts table (duration, group size, etc.)
- ✅ Logistics section (meeting point, map)
- ✅ Inclusions/exclusions lists
- ✅ Guide profile card
- ✅ Booking CTA button
- ✅ Customer reviews with ratings
- ✅ Related tours carousel
- ✅ Breadcrumb navigation
- ✅ JSON-LD schema markup
- ✅ GetYourGuide-style sticky FilterBar
  - Category chips with multi-select + URL state
  - Date range picker (react-day-picker v9)
  - Results count with pluralization
- ✅ Full i18n support (SV/EN/DE)
- ✅ 18 FilterBar component tests

**Status:** 61K LOC frontend, 30K LOC CMS, ready for Phase 08 (Rezdy Integration)

## Notes

- **Payload Admin:** Accessible at `http://localhost:3000/admin`
- **GraphQL:** Available at `/api/graphql`
- **Type Generation:** Run after schema changes: `npm run payload:generate-types`
- **Database Migrations:** Payload handles automatically
- **Node Modules:** Two separate installations (root + apps/web)

## Codebase Metrics (Phase 07)

| Metric | Value |
|--------|-------|
| **Frontend LOC** | ~61,000 (apps/web) |
| **CMS LOC** | ~30,000 (packages/cms) |
| **React Components** | 50+ |
| **API Functions** | 7 (with full typing) |
| **Unit Tests** | 50+ |
| **TypeScript Coverage** | 100% |
| **Accessibility** | WCAG 2.1 AA |
| **Lighthouse Score** | 90+ (all categories) |

## Phase Roadmap

| Phase | Focus | Hours | Status |
|-------|-------|-------|--------|
| **01** | Foundation | 16-20 | ✅ Complete |
| **02** | i18n | 24-28 | ✅ Complete |
| **03** | Data Models | 28-32 | ✅ Complete |
| **04** | Design System | 32-36 | ✅ Complete |
| **05** | Homepage | 28-32 | ✅ Complete |
| **06** | Catalog | 24-28 | ✅ Complete |
| **07** | Detail Page | 28-32 | ✅ Complete |
| **08** | Rezdy Booking | 34-44 | In Progress |
| **09-13** | Advanced (Groups, Concierge, SEO) | 72-86 | Planned |
| **14-17** | Polish & Launch | 50-62 | Planned |
