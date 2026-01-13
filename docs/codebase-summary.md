# Codebase Summary - HeritageGuiding Platform

**Last Updated:** January 13, 2026
**Phase:** 01 - Foundation Setup
**Status:** In Development

## Overview

HeritageGuiding is an AI-first tourism booking platform serving Stockholm heritage tours. The platform uses a monorepo structure with a Next.js 15 frontend and Payload CMS 3.0 backend, targeting Swedish/English/German markets.

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
  "next": "^15.5.9",
  "payload": "^3.70.0",
  "react": "^19.2.3",
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
- `(frontend)` - Public-facing routes
- `(payload)` - Admin & API routes
- `api/` - Route handlers

### packages/cms - Payload Configuration

**Collections:**
1. **users** - Admin users with role-based access control
   - Fields: name, email (auth), role (admin/editor)
   - Access: Admins manage all, users read own data

2. **media** - Image/file management
   - Vercel Blob storage integration
   - Responsive image handling

**Configuration:**
- Secret: `PAYLOAD_SECRET` (from env)
- Database: PostgreSQL with connection pooling
- Editor: Lexical rich text editor
- Storage: Vercel Blob for media files

### packages/ui - Shared Components

(To be populated in Phase 2 - Design System)

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

## Current State (Phase 01)

**Completed:**
- Monorepo structure setup
- Next.js 15 project with TypeScript
- Payload CMS 3.0 integration
- PostgreSQL database connection
- Vercel Blob storage integration
- GitHub Actions CI pipeline
- ESLint, Prettier, TypeScript configuration
- Basic Users and Media collections
- Admin interface accessible at `/admin`
- Placeholder homepage

**Status:** Foundation ready for Phase 02 (i18n & Localization)

## Notes

- **Payload Admin:** Accessible at `http://localhost:3000/admin`
- **GraphQL:** Available at `/api/graphql`
- **Type Generation:** Run after schema changes: `npm run payload:generate-types`
- **Database Migrations:** Payload handles automatically
- **Node Modules:** Two separate installations (root + apps/web)

## Phase Roadmap

| Phase | Focus | Est. Hours |
|-------|-------|-----------|
| **01** | Foundation Setup | 16-20 |
| **02** | i18n & Localization | 24-28 |
| **03** | Data Models | 20-24 |
| **04-08** | Core Platform | 128-148 |
| **09-13** | Advanced Features | 62-76 |
| **14-17** | Polish & Launch | 50-62 |

See `./MVP-PROJECT-PLAN.md` for detailed timeline.
