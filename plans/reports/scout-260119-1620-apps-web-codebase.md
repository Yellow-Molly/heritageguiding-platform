# Scout Report: HeritageGuiding Web App (apps/web)

**Date:** January 19, 2026 | **Phase:** 07 - Tour Detail Complete | **Status:** Ready for Phase 08+

## Executive Summary

The HeritageGuiding web app is a fully-functional Next.js 15 frontend with mature architecture. Phase 07 (Tour Detail Page) recently completed adds comprehensive tour browsing experience. The codebase features multi-language support (SV/EN/DE), 50+ reusable React components, robust API layer with 7 data fetching functions, comprehensive testing (50+ tests), and strong security/accessibility foundations.

---

## Directory Structure Overview

```
apps/web/
├── app/                    # Next.js 15 App Router
│   ├── [locale]/           # Dynamic locale prefixing (sv|en|de)
│   │   ├── (frontend)/     # Public routes
│   │   │   ├── page.tsx    # Homepage
│   │   │   ├── tours/      # Tour catalog & detail
│   │   │   ├── about-us/   # Static pages
│   │   │   ├── faq/
│   │   │   ├── terms/
│   │   │   └── privacy/
│   │   └── (payload)/      # Admin & API routes
│   ├── layout.tsx
│   ├── middleware.ts       # next-intl routing
│   └── i18n.ts            # Locale config
├── components/             # 50+ React components
│   ├── home/              # Homepage sections
│   ├── tour/              # Tour detail & catalog (15+ components)
│   ├── pages/             # Static page sections
│   ├── layout/            # Global layout
│   ├── shared/            # Reusable utilities
│   ├── seo/               # Schema markup
│   └── ui/                # Design system (8+ components)
├── lib/                   # Business logic
│   ├── api/               # Data fetching (7 functions)
│   ├── validation/        # Zod schemas
│   ├── hooks/             # Custom hooks
│   └── utils.ts           # Core utilities
├── messages/              # i18n translations (SV/EN/DE)
└── config files
```

