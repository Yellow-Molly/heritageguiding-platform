# Phase 01: Source Code Rebrand

## Context Links
- [Plan Overview](./plan.md)
- [Research: Codebase Audit](../reports/) (194 occurrences across 50+ files)

## Overview
- **Date:** 2026-02-17
- **Description:** Update all brand references in source code (components, lib, API, SEO, schemas)
- **Priority:** P1
- **Status:** Pending
- **Review Status:** Not started

## Key Insights
- 32 source files contain brand references
- Most are display strings (brand name, emails, URLs) -- no logic changes
- Schema.org components have structured data with brand URLs -- must be accurate for SEO
- Email templates use brand name in From field and signatures
- Meeting point text in API data references brand contextually

## Requirements

### Functional
- All user-visible "HeritageGuiding" text displays "PrivateTours" (or "Private Tours" where space-separated is natural)
- All `heritageguiding.com` URLs resolve to `privatetours.se`
- Email addresses use `@privatetours.se` domain
- Schema.org structured data references new domain/brand

### Non-Functional
- No broken imports or references
- Build passes without errors
- All existing functionality preserved

## Architecture
No architectural changes. Pure string replacement across presentation and data layers.

## Related Code Files

### Email Templates (3 files)
1. `apps/web/lib/email/templates/booking-confirmation-template.ts`
2. `apps/web/lib/email/templates/group-inquiry-admin-template.ts`
3. `apps/web/lib/email/templates/group-inquiry-confirmation-template.ts`

### SEO & Metadata (1 file)
4. `apps/web/lib/seo.ts`

### Schema.org Components (6 files)
5. `apps/web/components/seo/travel-agency-schema.tsx`
6. `apps/web/components/seo/tour-schema.tsx`
7. `apps/web/components/seo/tour-list-schema.tsx`
8. `apps/web/components/seo/guide-list-schema.tsx`
9. `apps/web/components/seo/guide-detail-schema.tsx`
10. `apps/web/components/seo/about-schema.tsx`

### UI Components (4 files)
11. `apps/web/components/tours/booking-section.tsx`
12. `apps/web/components/layout/header.tsx`
13. `apps/web/components/layout/footer.tsx`
14. `apps/web/components/home/values-section.tsx`

### App Routes (8 files)
15. `apps/web/app/[locale]/layout.tsx`
16. `apps/web/app/robots.ts`
17. `apps/web/app/sitemap.ts`
18. `apps/web/app/[locale]/privacy/page.tsx`
19. `apps/web/app/[locale]/terms/page.tsx`
20. `apps/web/app/[locale]/find-tour/page.tsx`
21. `apps/web/app/[locale]/group-booking/page.tsx`
22. `apps/web/app/globals.css`

### Payload Admin (1 file)
23. `apps/web/app/(payload)/layout.tsx`

### API / Data (varies)
24. Any API route handlers referencing brand name or domain

## Implementation Steps

### Step 1: Email Templates
For each of the 3 email template files:
- Find: `HeritageGuiding` -> Replace: `PrivateTours`
- Find: `HeritageGuiding Team` -> Replace: `PrivateTours Team`
- Find: `info@heritageguiding.com` -> Replace: `info@privatetours.se`
- Find: `bookings@heritageguiding.com` -> Replace: `bookings@privatetours.se`
- Find: `heritageguiding.com` -> Replace: `privatetours.se`

### Step 2: SEO Library
In `apps/web/lib/seo.ts`:
- Find: `https://heritageguiding.com` -> Replace: `https://privatetours.se`
- Find: `HeritageGuiding` -> Replace: `PrivateTours`
- Find: `heritageguiding.com` -> Replace: `privatetours.se`

### Step 3: Schema.org Components
For each of the 6 schema files:
- Find: `HeritageGuiding` -> Replace: `PrivateTours`
- Find: `https://heritageguiding.com` -> Replace: `https://privatetours.se`
- Find: `heritageguiding.com` -> Replace: `privatetours.se`
- Find email addresses: `info@heritageguiding.com` -> `info@privatetours.se`

### Step 4: UI Components
In `header.tsx`, `footer.tsx`, `values-section.tsx`, `booking-section.tsx`:
- Find: `HeritageGuiding` -> Replace: `PrivateTours`
- Find: `heritageguiding.com` -> Replace: `privatetours.se`
- Find social media URLs containing `heritageguiding` -> Replace with `privatetours`
- Find: email addresses -> Replace with `@privatetours.se` domain

### Step 5: App Routes
In `layout.tsx`:
- Find: `HeritageGuiding` -> Replace: `PrivateTours`
- Find: `heritageguiding.com` -> Replace: `privatetours.se`

In `robots.ts`:
- Find: `heritageguiding.com` -> Replace: `privatetours.se`

In `sitemap.ts`:
- Find: `heritageguiding.com` -> Replace: `privatetours.se`

In `privacy/page.tsx`, `terms/page.tsx`:
- Find: `HeritageGuiding` -> Replace: `PrivateTours`
- Find: `privacy@heritageguiding.com` -> Replace: `privacy@privatetours.se`
- Find: `admin@heritageguiding.com` -> Replace: `admin@privatetours.se`
- Find: `heritageguiding.com` -> Replace: `privatetours.se`

In `find-tour/page.tsx`, `group-booking/page.tsx`:
- Find: `HeritageGuiding` -> Replace: `PrivateTours`

In `globals.css`:
- Find any brand-related comments or custom property names

### Step 6: Payload Admin Layout
In `apps/web/app/(payload)/layout.tsx`:
- Find: `HeritageGuiding` -> Replace: `PrivateTours`

### Step 7: Verify Build
```bash
npm run lint
npm run type-check
npm run build
```

## Todo List
- [ ] Update 3 email templates
- [ ] Update lib/seo.ts
- [ ] Update 6 Schema.org components
- [ ] Update 4 UI components (header, footer, values, booking)
- [ ] Update layout.tsx (app route)
- [ ] Update robots.ts
- [ ] Update sitemap.ts
- [ ] Update privacy page
- [ ] Update terms page
- [ ] Update find-tour page
- [ ] Update group-booking page
- [ ] Update globals.css (if applicable)
- [ ] Update Payload admin layout
- [ ] Run lint + type-check + build

## Success Criteria
- `grep -r "heritageguiding" apps/web/` returns zero source code matches (excluding node_modules)
- Build completes without errors
- All pages render correctly with new brand name
- Schema.org structured data validates with new URLs

## Risk Assessment
- **Low risk:** String replacements only, no logic changes
- **Mitigation:** Run build + tests after each batch of changes
- **Watch for:** Partial replacements in URLs (e.g., replacing only domain but not protocol)

## Security Considerations
- Ensure no old email addresses remain (could receive sensitive data at wrong domain)
- Verify Schema.org URLs point to HTTPS on new domain

## Next Steps
- After completion, proceed to Phase 02 (Config & Packages)
- Coordinate with Phase 03 (i18n) for translation string updates
