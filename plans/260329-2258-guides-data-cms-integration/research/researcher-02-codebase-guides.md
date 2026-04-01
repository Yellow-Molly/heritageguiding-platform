# Research Report: Guides Implementation in Heritage Guiding Platform

**Date:** 2026-03-29 | **Status:** Complete | **Scope:** CMS schema, frontend pages, API endpoints, i18n

---

## 1. Guides CMS Collection Schema

**File:** `packages/cms/collections/guides.ts` (170 lines)

### Core Fields
- **name** (required): max 100 chars, used as admin title
- **slug** (required, unique): auto-formatted via hook, indexed
- **status** (required): enum [active, inactive, on-leave]; default=active
- **bio** (richText): localized Lexical JSON format
- **photo** (upload): relationTo media
- **email, phone**: Not publicly exposed (admin only)
- **languages** (required, multi-select): sv, en, de, fr, es, it
- **additionalLanguages** (multi-select): ja, zh, no, da, fi, nl, pt, ru, ar, ko, pl, th, hi
- **credentials** (array): localized credential strings, max 20
- **specializations** (relationship): relationTo categories (many-to-many)
- **operatingAreas** (relationship): relationTo cities (many-to-many)

### Localization
- **bio** is localized (lexical richText)
- **credentials.credential** is localized
- **All other fields** are shared across locales
- Payload locale: 'sv', 'en', 'de'

### Access Control
- Read: public
- Create/Update/Delete: admin only

---

## 2. Frontend Pages Structure

### Guides Listing Page
**File:** `apps/web/app/(site)/[locale]/(frontend)/guides/page.tsx`

- Route: `/[locale]/guides`
- Fetches via `getGuides(filters, locale)` with pagination defaults: page=1, limit=12
- Passes filters: language, specialization, area, q (search), page, limit
- Max limit enforced: 50
- Renders: `GuideGrid` component with pagination
- SEO: `GuideListSchema` for structured data
- i18n namespace: 'guides'

### Guide Detail Page
**File:** `apps/web/app/(site)/[locale]/(frontend)/guides/[slug]/page.tsx`

- Route: `/[locale]/guides/[slug]`
- Slug validation: regex `^[a-z0-9-]+$`, max 100 chars
- Returns 404 if not found OR not active/on-leave
- Fetches via `getGuideBySlug(slug, locale)`
- Related tours fetched: latest published tours by this guide (limit 20, sorted -createdAt)
- Breadcrumbs: Home > Guides > Guide Name
- Renders: `GuideDetailHeader`, `GuideDetailContent`, `GuideToursSection`
- SEO: `GuideDetailSchema` with name, slug, photo, languages, specializations, credentials

---

## 3. Data Fetching APIs

### getGuides() → GuidesResponse
**File:** `apps/web/lib/api/get-guides.ts`

**Filtering logic:**
- Status: always 'active' only
- Language: OR logic on (languages contains | additionalLanguages contains)
- Search: LIKE on name field
- Specialization/Area: post-query filter (Payload doesn't support deep where on populated rels)

**Query strategy:**
- If filtering by relationship fields: fetch 200 docs (page=1), post-filter, then paginate in-memory
- Otherwise: standard pagination at Payload level

**Response structure:**
```ts
{
  guides: GuideListItem[],
  total: number,
  page: number,
  totalPages: number
}
```

**Field extraction (GuideListItem):**
- id, name, slug, languages, additionalLanguages
- photo: {url, alt}
- specializations, operatingAreas: {id, name, slug} (depth=2)
- credentials: {credential}[]
- bioExcerpt: max 150 chars, extracted from lexical richText (first 150 chars + "…")

**Sensitive fields excluded:** email, phone NEVER exposed

### getGuideBySlug(slug, locale) → GuideDetail | null
**File:** `apps/web/lib/api/get-guide-by-slug.ts`

**Query filter:** slug=exact + status in [active, on-leave]
**Additional data:** Tours led by this guide (relationTo tours, where guide.id matches)

**Tour fields projected:**
- id, title, slug, image {url, alt}, duration, price, rating, reviewCount

**Full detail response (GuideDetail):**
- Same fields as list + status, bio (full lexical JSON), tours[]

**getAllGuideSlugs():** Returns {slug} for all active/on-leave guides (used in generateStaticParams)

---

## 4. i18n Messages for Guides

**File:** `apps/web/messages/en.json`

### Key Sections
```json
"guides": {
  "title": "Our Expert Guides",
  "description": "Meet the passionate experts...",
  "subtitle": "Meet the people behind the experiences",
  "specializations": "Specializations",
  "languages": "Languages",
  "operatingAreas": "Operating Areas",
  "credentials": "Credentials & Certifications",
  "about": "About {name}",           // Template key
  "toursBy": "Tours by {name}",     // Template key
  "noTours": "No tours currently available",
  "onLeave": "On Leave",
  "emptyState": "No guides found matching your criteria",
  "breadcrumb": {
    "home": "Home",
    "guides": "Guides"
  }
}
```

### FAQ Guide-Related Section
```json
"faq.questions.guides": {
  "q1": "Who are your guides?",
  "q2": "Are your guides licensed?",
  "q3": "Will the same guide stay with us throughout the tour?"
}
```

---

## 5. Current Implementation Status

### What Exists ✓
- Full CMS collection schema (170 lines, comprehensive)
- API functions for listing and detail (read-only, Payload queries)
- Frontend pages with SSG support (generateStaticParams)
- Pagination, filtering, search logic (language, specialization, area, search query)
- Localization: bio + credentials localized, pages support sv/en/de
- Guide-to-tour relationship (tours fetched by guide.id)
- Private field handling (email/phone never exposed in API)
- i18n messages for guides section
- SEO: structured data schemas, metadata generation
- Test coverage: getGuides filtering logic, mapping, pagination

### No Placeholder/Mock Data Found
- No hardcoded guide fixtures in codebase
- No "PLACEHOLDER" or "DUMMY" strings in guide-related files
- Test mocks exist but only in test files (not in production code)

---

## 6. Data Gap Analysis

### Ready for Production Data ✓
- CMS accepts guide records with all fields (name, slug, bio, credentials, photo, languages, specializations, operatingAreas, additionalLanguages, status)
- API enforces public/private field separation correctly
- Frontend pages validate slug, handle not-found cases, support multi-locale

### Required for Launch
1. **Guide Records in CMS:** Need to create guide documents in Payload (name, bio in sv/en/de, photo uploads, credentials localized, status='active')
2. **Categories & Cities:** Must exist before assigning specializations/operatingAreas to guides
3. **Tour-Guide Assignments:** Tours must have guide relationTo field populated (already in Tours schema)
4. **Image Assets:** Professional guide photos must be uploaded to media collection
5. **Localized Content:** Bios and credentials must be translated for supported locales (sv, en, de)

### No Known Issues
- Data validation is correct (required fields enforced)
- Relationship constraints implemented (guides can be deleted if not referenced by tours)
- Pagination respects 12-default, 50-max limits
- Status filtering ensures only active/on-leave shown (inactive guides hidden)

---

## Summary

**Current State:** Infrastructure complete, no production data yet.

**Data Model Maturity:** Schema is production-ready with localization, access control, and relationship management. API correctly excludes sensitive fields.

**Integration Points:**
- Tours → Guides (one-to-many via guide relationTo)
- Guides → Categories (many-to-many via specializations relationTo)
- Guides → Cities (many-to-many via operatingAreas relationTo)
- Guides → Media (one-to-one via photo upload)

**Next Phase:** Data entry (guides, localizations, photo uploads) + tour-guide assignments in CMS.

---

## Unresolved Questions

1. **Tour Assignments:** Should guides with status='on-leave' still show in their tours? (Currently: yes, with badge)
2. **Photo Requirements:** Max file size, format, minimum resolution for guide photos?
3. **Bio Localization:** Will all guides provide bio content in sv/en/de, or only primary language?
4. **Relationship Constraints:** Can a guide be assigned to multiple categories/cities? (Yes, schema allows) Any validation limits?
5. **Search Behavior:** Should search query also match specializations/areas, or name-only? (Currently: name only)
