---
title: "Guide Fields Standardization + Listing/Detail Pages"
description: "Add 5 new fields to Guide CMS collection and create public guide listing and detail pages"
status: complete
priority: P2
effort: 6h
branch: master
tags: [guides, cms, frontend, pages, i18n]
created: 2026-02-12
completed: 2026-02-12
---

# Guide Fields + Listing/Detail Pages

## Goal

Enrich the Guides CMS collection with 5 new fields (specializations, operatingAreas, status, additionalLanguages, phone) and build public-facing guide listing + detail pages following existing tour page patterns.

## Phases

| # | Phase | Est. | Status |
|---|-------|------|--------|
| 01 | [CMS Collection Update + Migration](./phase-01-cms-collection-update.md) | 1h | ✅ Complete |
| 02 | [API Functions + Types](./phase-02-api-functions-types.md) | 1.5h | ✅ Complete |
| 03 | [Guide Components](./phase-03-guide-components.md) | 2h | ✅ Complete |
| 04 | [Guide Pages + i18n](./phase-04-guide-pages-i18n.md) | 1.5h | ✅ Complete |

## Key Dependencies

- Existing collections: `categories` (for specializations relationship), `cities` (for operatingAreas relationship)
- Existing patterns: `tours/page.tsx`, `tours/[slug]/page.tsx`, `get-tours.ts`, `tour-card.tsx`
- i18n messages: `en.json`, `sv.json`, `de.json`
- UI components: `Badge`, `Card`, `CardContent` from `packages/ui`

## Architecture

```
packages/cms/collections/guides.ts         <- UPDATE (add 5 fields)
apps/web/lib/api/get-guides.ts             <- NEW
apps/web/lib/api/get-guide-by-slug.ts      <- NEW
apps/web/components/guide/                  <- NEW (5 components + barrel)
apps/web/app/[locale]/(frontend)/guides/
  page.tsx                                  <- NEW (listing)
  [slug]/page.tsx                           <- NEW (detail)
apps/web/messages/{en,sv,de}.json           <- UPDATE (add guides namespace)
apps/web/components/layout/header.tsx       <- UPDATE (add nav link)
```

## Security Notes

- Email and phone fields are admin-only, NEVER exposed in public API types
- Slug validation on detail page (same pattern as tour detail)
- Only active guides returned by public API functions

## Validation Summary

**Validated:** 2026-02-12
**Questions asked:** 4

### Confirmed Decisions
- **Data source**: Real CMS queries via Payload local API (NOT mock data)
- **Specializations scope**: All categories (themes + activities)
- **Tour detail guide-card**: Leave as-is, no changes
- **Navigation i18n**: Refactor entire header nav to use i18n translations

### Action Items (plan revisions needed)
- [x] **Phase 02**: Rewrite from mock data → real Payload CMS queries (getPayload, collection queries, depth params, where clauses) ✅
- [x] **Phase 04**: Add nav i18n refactor — move hardcoded labels to translations in all 3 locales, update header.tsx to use `getTranslations` ✅

## Implementation Summary

**Completed:** 2026-02-12
**Commit:** adc7577
**Review:** [code-reviewer-260212-2140-guide-fields-listing-detail.md](../reports/code-reviewer-260212-2140-guide-fields-listing-detail.md)

### Delivered
- ✅ 5 new CMS fields (status, phone, specializations, operatingAreas, additionalLanguages)
- ✅ 2 API functions using real Payload CMS queries (get-guides.ts, get-guide-by-slug.ts)
- ✅ 6 guide components (listing card, grid, detail header, detail content, tours section, barrel)
- ✅ 2 pages (listing + detail with SSG)
- ✅ i18n translations for 3 locales (en/sv/de)
- ✅ Header nav refactored to use i18n
- ✅ Shared language-display-names utility
- ✅ 55 unit tests across 4 test files (all passing)

### Code Quality Metrics
- **TypeScript:** 0 errors
- **ESLint:** 0 new errors (13 pre-existing warnings unrelated)
- **Tests:** 532 total passing (55 new guide tests)
- **Security:** ✅ No email/phone exposure, slug validation present
- **Component Size:** ✅ All components <200 lines

### Known Issues (tracked for follow-up)
1. **Medium:** Post-filter pagination edge case (specialization/area filters break total count) — documented in code
2. **Medium:** Rich text bio uses `any` type escape — needs Lexical type import
3. **Low:** Language display names English-only (not i18n-aware) — consider Intl.DisplayNames

### Next Steps
- Fix post-filter pagination (fetch all when filtering, or push to Payload where clause)
- Add Lexical types for bio field
- Consider adding guide search/filter UI component

## Out of Scope

- Guide search/filter client component (can add in future phase)
- Guide schema.org markup (Phase 13)
- Updating existing guide-card.tsx on tour detail pages
