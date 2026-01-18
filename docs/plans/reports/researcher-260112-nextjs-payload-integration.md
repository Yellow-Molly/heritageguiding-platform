# Next.js 15 + Payload CMS 3.0 Integration Research Report

**Date:** 2026-01-12
**Researcher:** Claude Code
**Status:** Complete
**Word Count:** 147 lines

---

## Executive Summary

Next.js 15 + Payload CMS 3.0 integration is production-ready for HeritageGuiding MVP. Payload 3.0 introduces embedded mode, eliminating need for separate CMS infrastructure. Combined with React 19 Server Components, PostgreSQL persistence, and next-intl i18n routing, this stack delivers optimal performance, type safety, and developer experience.

---

## 1. Next.js 15 + React 19 Architecture

### Key Features
- **Server Components by Default**: All components are server-rendered unless marked `'use client'`
- **React 19 Support**: Improved performance, built-in Compiler for auto-memoization
- **Streaming & Suspense**: Progressive page loading with fallbacks
- **Server Actions**: Direct database mutations without API routes

### Best Practices for MVP
```typescript
// app/tours/page.tsx - Server Component (default)
import { getTours } from '@/lib/tours'

export default async function ToursPage() {
  const tours = await getTours() // Direct database fetch
  return <TourList tours={tours} />
}

// app/tour-details/client-component.tsx - Explicit Client
'use client'
import { useState } from 'react'

export function InteractiveBooking() {
  const [selectedDate, setSelectedDate] = useState<Date>()
  // Client-side state only
}
```

### Performance Strategy
- Fetch data on server by default (avoids client-side waterfall)
- Use React Compiler for automatic memoization (v19+)
- Leverage streaming for skeleton loading states
- Combine Server Components + Server Actions for mutations

---

## 2. Payload CMS 3.0 + Next.js 15

### Embedded Mode (Recommended)
Payload 3.0 installs directly into Next.js `/app` folder. No separate backend needed.

```typescript
// packages/cms/payload.config.ts
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { slateEditor } from '@payloadcms/richtext-slate'

export default buildConfig({
  admin: { user: 'users' },
  collections: [
    { slug: 'tours', fields: [...] },
    { slug: 'guides', fields: [...] },
    { slug: 'reviews', fields: [...] },
    { slug: 'media', fields: [...] },
  ],
  db: postgresAdapter({
    url: process.env.DATABASE_URL,
    pool: { max: 20 }
  }),
  editor: slateEditor(),
})
```

### File Structure
```
app/
├── (payload)/
│   └── admin/
│       └── [[...segments]]/
│           └── page.tsx  # Admin UI at /admin
└── api/
    └── [...slug]/
        └── route.ts      # Payload REST API routes
```

### Database Setup
- PostgreSQL 15+ (Supabase recommended for MVP)
- PgBouncer connection pooling enabled
- Schema auto-generated from collections
- Type safety: Payload generates TypeScript types

---

## 3. Next-intl i18n (SV/EN/DE)

### Routing Configuration
```typescript
// i18n.ts
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['sv', 'en', 'de'],
  defaultLocale: 'sv',
  pathnames: {
    '/tours': { sv: '/turer', en: '/tours', de: '/touren' },
    '/booking': { sv: '/bokning', en: '/booking', de: '/buchung' }
  }
})
```

### Directory Structure
```
app/
├── [locale]/
│   ├── layout.tsx        # Root layout with locale provider
│   ├── page.tsx          # Home page
│   ├── tours/
│   │   └── page.tsx      # /sv/turer, /en/tours, /de/touren
│   └── booking/
│       └── page.tsx
└── middleware.ts         # Locale detection + rewrites
```

### Middleware Setup
```typescript
// middleware.ts
import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n'

export default createMiddleware(routing)

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
}
```

### Usage in Components
```typescript
'use client'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'

export function TourCard({ tour }) {
  const t = useTranslations()
  const locale = useLocale()

  return <h2>{t('tours.title')} - {tour.title[locale]}</h2>
}
```

---

## 4. PostgreSQL Adapter Configuration

### Payload CMS Integration
```typescript
import { postgresAdapter } from '@payloadcms/db-postgres'

db: postgresAdapter({
  url: process.env.DATABASE_URL,
  pool: {
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000
  }
})
```

### Supabase Connection String
```
postgresql://postgres:PASSWORD@db.REGION.supabase.co:5432/postgres?pgbouncer=true
```

### Schema Initialization
Payload auto-generates PostgreSQL schema from collections. No manual SQL needed.

---

## 5. Tailwind CSS + shadcn/ui Setup

### Configuration
```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.tsx', './components/**/*.tsx'],
  theme: {
    extend: {
      colors: {
        destructive: '#dc2626',
        success: '#16a34a'
      }
    }
  }
} satisfies Config
```

### shadcn/ui Components
Install via CLI: `npx shadcn-ui@latest init`

Recommended for MVP: Button, Card, Dialog, Input, Select, Dropdown, Tabs

---

## Critical Integration Points

| Component | Purpose | Config Location |
|-----------|---------|-----------------|
| Payload Config | CMS schema + API | `packages/cms/payload.config.ts` |
| i18n Router | Locale-based routing | `i18n.ts` + `middleware.ts` |
| Tailwind | Styling pipeline | `tailwind.config.ts` |
| PostgreSQL | Data persistence | `.env.local` (DATABASE_URL) |
| Next.js Config | App configuration | `next.config.ts` |

---

## Implementation Order

1. Initialize Next.js 15 project with TypeScript
2. Install Payload CMS 3.0 + PostgreSQL adapter
3. Configure Payload collections (tours, guides, etc.)
4. Set up next-intl routing (SV/EN/DE)
5. Install Tailwind + shadcn/ui
6. Create shared UI components
7. Build server components for data fetching
8. Implement Rezdy booking integration

---

## Key Recommendations

✅ **DO:**
- Use Server Components for SEO-critical pages
- Leverage Payload's built-in RBAC for CMS access
- Cache API responses server-side (Payload handles this)
- Use next-intl for all UI strings

❌ **AVOID:**
- Client-side data fetching (use Server Components)
- Creating separate API routes (Payload provides REST API)
- Manual database schema management (Payload auto-generates)

---

## Sources

- [Next.js 15 Official Blog](https://nextjs.org/blog/next-15)
- [Next.js Server and Client Components Guide](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Payload 3.0: Next.js Integration](https://payloadcms.com/posts/blog/payload-30-the-first-cms-that-installs-directly-into-any-nextjs-app)
- [Payload CMS Documentation](https://payloadcms.com/docs/getting-started/installation)
- [next-intl App Router Documentation](https://next-intl.dev/docs/getting-started/app-router)
- [next-intl Routing Configuration](https://next-intl.dev/docs/routing/setup)

---

**Research Complete** | Ready for implementation planning phase
