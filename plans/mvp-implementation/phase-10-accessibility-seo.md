# Phase 10: Accessibility + SEO

## Context Links

- [MVP Project Plan v1.2](../../docs/MVP-PROJECT-PLAN.md)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Schema.org Tourism Types](https://schema.org/TouristAttraction)
- [Schema.org FAQPage](https://schema.org/FAQPage)
- [Google SEO Documentation](https://developers.google.com/search/docs)
- [Research: Schema.org for Guides](./research/researcher-schema-guides.md)
- [Research: Next.js SEO & Accessibility](./research/researcher-nextjs-seo.md)

## Overview

| Priority | Status | Effort |
|----------|--------|--------|
| P1 - Critical | pending | 28-36h |

Implement WCAG 2.1 Level AA compliance, comprehensive SEO (sitemap, robots.txt, enhanced metadata), and Schema.org structured data across all 12 public pages. Effort reduced from original estimate since many SEO components already exist.

## Page Inventory (12 Public Pages)

| # | Route | generateMetadata | OG/Twitter | hreflang | Schema.org | Status |
|---|-------|-----------------|------------|----------|------------|--------|
| 1 | `/` Homepage | Yes | Yes (full) | Yes (layout) | TravelAgencySchema | Done |
| 2 | `/about-us` | Yes (basic) | No | No | None | Needs work |
| 3 | `/faq` | Yes (basic) | No | No | FAQSchema | Partial |
| 4 | `/find-tour` | Yes (basic) | No | No | None | Needs work |
| 5 | `/guides` | Yes (basic) | No | No | None | Needs work |
| 6 | `/guides/[slug]` | Yes (basic) | No | No | None | Needs work |
| 7 | `/privacy` | Yes (basic) | No | No | None | Low priority |
| 8 | `/terms` | Yes (basic) | No | No | None | Low priority |
| 9 | `/tours` | Yes (basic) | No | No | None | Needs work |
| 10 | `/tours/[slug]` | Yes | Yes (full) | No | TourSchema (Tourist+Product) | Partial |
| 11 | `/group-booking` | Yes (basic) | No | No | None | Needs work |
| 12 | `/admin/` (Payload) | Auto | N/A | N/A | N/A | Skip |

## Existing Assets (Already Built)

### SEO Components (`apps/web/components/seo/`)
- `travel-agency-schema.tsx` - TravelAgency + WebPageSchema with BreadcrumbList
- `faq-schema.tsx` - FAQPage schema (used on /faq)
- `index.ts` - Re-exports

### Tour Components (`apps/web/components/tour/`)
- `tour-schema.tsx` - TouristAttraction + Product dual schema (used on /tours/[slug])

### SEO Utilities (`apps/web/lib/seo.ts`)
- `generateHreflangAlternates()` - hreflang links (used in layout.tsx)
- `generateOgLocaleAlternates()` - OG locale alternates
- `generateStructuredData()` - JSON-LD with locale support
- `generateRobotsDirectives()` - robots meta tags
- `generatePageMetadata()` - Full metadata helper (title, desc, OG, Twitter, hreflang)

### Layout (`apps/web/app/[locale]/layout.tsx`)
- `metadataBase` set
- hreflang alternates for `/`
- OG locale + alternateLocale

## Key Insights

- `generatePageMetadata()` helper exists in `lib/seo.ts` but only homepage uses full OG/Twitter - 10 pages need upgrade
- `WebPageSchema` with BreadcrumbList exists but is NOT used on any page
- No `sitemap.ts` or `robots.ts` files exist yet
- Guide pages (`/guides`, `/guides/[slug]`) are new (Phase 09.5) - not covered in original plan
- No `/contact` page exists (was incorrectly referenced in original plan)
- Route is `/about-us` not `/about` (corrected from original plan)
- AI-first SEO: structured data crucial for ChatGPT, Perplexity discoverability

## Requirements

### Functional - Accessibility
- Skip to content link in root layout
- Keyboard navigation for all interactions
- Focus indicators (visible, consistent `ring-2 ring-primary`)
- Screen reader support (ARIA labels, live regions)
- Color contrast 4.5:1 (AA)
- Reduced motion preference support
- Form error announcements (`aria-describedby`, `role="alert"`)

### Functional - SEO
- Enhanced metadata (OG + Twitter + hreflang) on ALL pages via `generatePageMetadata()`
- Dynamic XML sitemap with all 12 routes + alternates
- robots.txt (allow public, block /admin/ and /api/)
- Canonical URLs on all pages

### Functional - Schema.org (Per Page)
| Page | Schema Type | Priority |
|------|------------|----------|
| Homepage `/` | TravelAgencySchema | Done |
| About Us `/about-us` | AboutPage + Organization | P1 |
| FAQ `/faq` | FAQSchema | Done |
| Find Tour `/find-tour` | WebPageSchema + BreadcrumbList | P2 |
| Guides `/guides` | ItemList of Person | P1 |
| Guide Detail `/guides/[slug]` | Person (guide profile) | P1 |
| Privacy `/privacy` | WebPageSchema | P3 |
| Terms `/terms` | WebPageSchema | P3 |
| Tours `/tours` | ItemList of TouristAttraction | P2 |
| Tour Detail `/tours/[slug]` | TouristAttraction + Product | Done |
| Group Booking `/group-booking` | WebPageSchema + BreadcrumbList | P2 |

### Non-Functional
- Lighthouse Accessibility score > 95
- Lighthouse SEO score > 95
- Schema.org validates without errors
- 0 WCAG 2.1 AA violations

## Architecture

### File Structure
```
apps/web/
├── app/
│   ├── sitemap.ts                    # NEW - Dynamic XML sitemap
│   ├── robots.ts                     # NEW - robots.txt
│   └── [locale]/
│       ├── layout.tsx                # MODIFY - Add skip link, ARIA announcer
│       ├── (frontend)/
│       │   ├── page.tsx              # DONE - Has TravelAgencySchema
│       │   ├── about-us/page.tsx     # MODIFY - Add AboutSchema, enhanced metadata
│       │   ├── faq/page.tsx          # DONE - Has FAQSchema
│       │   ├── find-tour/page.tsx    # MODIFY - Add WebPageSchema, enhanced metadata
│       │   ├── guides/page.tsx       # MODIFY - Add ItemList schema, enhanced metadata
│       │   ├── guides/[slug]/page.tsx # MODIFY - Add Person schema, enhanced metadata
│       │   ├── privacy/page.tsx      # MODIFY - Enhanced metadata
│       │   ├── terms/page.tsx        # MODIFY - Enhanced metadata
│       │   ├── tours/page.tsx        # MODIFY - Add ItemList schema, enhanced metadata
│       │   └── tours/[slug]/page.tsx # PARTIAL - Has TourSchema, needs enhanced metadata
│       └── group-booking/page.tsx    # MODIFY - Add WebPageSchema, enhanced metadata
├── components/
│   ├── accessibility/
│   │   ├── skip-link.tsx             # NEW
│   │   └── visually-hidden.tsx       # NEW
│   └── seo/
│       ├── travel-agency-schema.tsx  # EXISTS - TravelAgency + WebPageSchema
│       ├── faq-schema.tsx            # EXISTS - FAQPage
│       ├── about-schema.tsx          # NEW - AboutPage
│       ├── guide-schema.tsx          # NEW - Person for guide detail
│       ├── guide-list-schema.tsx     # NEW - ItemList of Person
│       ├── tour-list-schema.tsx      # NEW - ItemList of TouristAttraction
│       └── index.ts                  # MODIFY - Add new exports
├── lib/
│   ├── accessibility/
│   │   └── announce.ts              # NEW - ARIA live announcer
│   └── seo.ts                       # EXISTS - Full metadata helpers
└── styles/
    └── globals.css                   # MODIFY - Focus styles, reduced motion
```

## Related Code Files

### Create
- `apps/web/app/sitemap.ts` - Dynamic sitemap with multi-locale alternates
- `apps/web/app/robots.ts` - robots.txt generator
- `apps/web/components/accessibility/skip-link.tsx` - Skip nav component
- `apps/web/components/accessibility/visually-hidden.tsx` - SR-only content
- `apps/web/lib/accessibility/announce.ts` - ARIA live announcer
- `apps/web/components/seo/about-schema.tsx` - AboutPage schema
- `apps/web/components/seo/guide-schema.tsx` - Person schema for guide detail
- `apps/web/components/seo/guide-list-schema.tsx` - ItemList for guides listing
- `apps/web/components/seo/tour-list-schema.tsx` - ItemList for tours listing

### Modify
- `apps/web/app/[locale]/layout.tsx` - Add skip link, ARIA announcer div
- `apps/web/app/[locale]/(frontend)/about-us/page.tsx` - Add AboutSchema + `generatePageMetadata`
- `apps/web/app/[locale]/(frontend)/faq/page.tsx` - Upgrade to `generatePageMetadata`
- `apps/web/app/[locale]/(frontend)/find-tour/page.tsx` - Add WebPageSchema + `generatePageMetadata`
- `apps/web/app/[locale]/(frontend)/guides/page.tsx` - Add GuideListSchema + `generatePageMetadata`
- `apps/web/app/[locale]/(frontend)/guides/[slug]/page.tsx` - Add GuideSchema + enhanced metadata
- `apps/web/app/[locale]/(frontend)/privacy/page.tsx` - Upgrade to `generatePageMetadata`
- `apps/web/app/[locale]/(frontend)/terms/page.tsx` - Upgrade to `generatePageMetadata`
- `apps/web/app/[locale]/(frontend)/tours/page.tsx` - Add TourListSchema + `generatePageMetadata`
- `apps/web/app/[locale]/(frontend)/tours/[slug]/page.tsx` - Upgrade to `generatePageMetadata` with hreflang
- `apps/web/app/[locale]/group-booking/page.tsx` - Add WebPageSchema + `generatePageMetadata`
- `apps/web/components/seo/index.ts` - Add new exports
- `apps/web/app/globals.css` - Focus styles, reduced motion

## Implementation Steps

### Part 1: Accessibility (WCAG 2.1 AA) ~8-10h

1. **Create Skip to Content Link** (`components/accessibility/skip-link.tsx`)
   - Visually hidden, appears on focus
   - Links to `#main` anchor
   - Add to `[locale]/layout.tsx` before Header

2. **Add ARIA Live Announcer** (`lib/accessibility/announce.ts`)
   - Create `announce(message, priority)` utility
   - Add announcer div to layout: `<div id="aria-announcer" role="status" aria-live="polite" class="sr-only" />`

3. **Enhance Focus Styles** (`globals.css`)
   - `*:focus-visible { ring-2 ring-primary ring-offset-2 }`
   - Reduced motion: disable animations/transitions for `prefers-reduced-motion: reduce`

4. **Create VisuallyHidden Component** (`components/accessibility/visually-hidden.tsx`)
   - SR-only span with proper clip/overflow styling

5. **Audit & Fix Forms**
   - Ensure all inputs have `aria-describedby` for errors
   - Add `role="alert"` to error messages
   - Check group-inquiry-form, tour filters, newsletter signup

6. **Keyboard Navigation Audit**
   - Verify all interactive elements are keyboard accessible
   - Check header nav, filter bar, accordion, dialog, wizard
   - Ensure focus order is logical

### Part 2: SEO Foundation ~8-10h

7. **Create Dynamic Sitemap** (`app/sitemap.ts`)
   - Static routes: `/`, `/about-us`, `/faq`, `/find-tour`, `/guides`, `/privacy`, `/terms`, `/tours`, `/group-booking`
   - Dynamic routes: `/tours/[slug]`, `/guides/[slug]` from CMS
   - Multi-locale: SV/EN/DE with `alternates.languages`
   - Priority: homepage=1.0, tours/guides=0.9, static=0.7

8. **Create robots.txt** (`app/robots.ts`)
   - Allow all on `/`
   - Disallow `/admin/`, `/api/`
   - Link to sitemap.xml

9. **Upgrade Metadata on All Pages**
   - Replace basic `generateMetadata` with `generatePageMetadata()` from `lib/seo.ts`
   - Adds: OG tags, Twitter cards, hreflang, canonical URLs
   - Pages to upgrade: about-us, faq, find-tour, guides, guides/[slug], privacy, terms, tours, tours/[slug], group-booking

### Part 3: Schema.org Structured Data ~10-14h

10. **Create Guide Schema** (`components/seo/guide-schema.tsx`)
    - `@type: Person` with jobTitle, knowsLanguage, knowsAbout, image
    - Include `hasOccupation` for tour guide
    - Use on `/guides/[slug]` page

11. **Create Guide List Schema** (`components/seo/guide-list-schema.tsx`)
    - `@type: ItemList` with `ListItem` containing `Person` entities
    - Include position, url, name, image, jobTitle
    - Use on `/guides` page

12. **Create Tour List Schema** (`components/seo/tour-list-schema.tsx`)
    - `@type: ItemList` with `ListItem` containing `TouristAttraction`
    - Include position, url, name, image
    - Use on `/tours` page

13. **Create About Schema** (`components/seo/about-schema.tsx`)
    - `@type: AboutPage` with Organization mainEntity
    - Include founders, founding date, description
    - Use on `/about-us` page

14. **Add WebPageSchema to remaining pages**
    - `/find-tour` - WebPageSchema with breadcrumb
    - `/group-booking` - WebPageSchema with breadcrumb
    - `/privacy`, `/terms` - minimal WebPageSchema (already exists, just use it)

15. **Update SEO index exports** (`components/seo/index.ts`)
    - Export all new schema components

### Part 4: Testing & Validation ~2-4h

16. **Lighthouse Audit**
    - Accessibility score > 95
    - SEO score > 95

17. **Schema Validation**
    - Test all schemas on Google Rich Results Test
    - Validate JSON-LD on schema.org validator

18. **Accessibility Testing**
    - axe DevTools scan for violations
    - Keyboard navigation walkthrough
    - Screen reader test (NVDA)

## Todo List

### Accessibility
- [ ] Create skip-link.tsx component
- [ ] Add skip link to [locale]/layout.tsx
- [ ] Create ARIA live announcer utility
- [ ] Add announcer div to layout
- [ ] Enhance focus styles in globals.css
- [ ] Add reduced motion support in globals.css
- [ ] Create visually-hidden.tsx component
- [ ] Audit forms for ARIA attributes
- [ ] Keyboard navigation audit

### SEO Foundation
- [ ] Create app/sitemap.ts with multi-locale + dynamic routes
- [ ] Create app/robots.ts
- [ ] Upgrade about-us/page.tsx metadata → generatePageMetadata
- [ ] Upgrade faq/page.tsx metadata → generatePageMetadata
- [ ] Upgrade find-tour/page.tsx metadata → generatePageMetadata
- [ ] Upgrade guides/page.tsx metadata → generatePageMetadata
- [ ] Upgrade guides/[slug]/page.tsx metadata → enhanced metadata
- [ ] Upgrade privacy/page.tsx metadata → generatePageMetadata
- [ ] Upgrade terms/page.tsx metadata → generatePageMetadata
- [ ] Upgrade tours/page.tsx metadata → generatePageMetadata
- [ ] Upgrade tours/[slug]/page.tsx metadata → generatePageMetadata with hreflang
- [ ] Upgrade group-booking/page.tsx metadata → generatePageMetadata

### Schema.org
- [x] TravelAgencySchema on homepage (EXISTS)
- [x] FAQSchema on FAQ page (EXISTS)
- [x] TourSchema on tour detail (EXISTS)
- [x] WebPageSchema + BreadcrumbList component (EXISTS, unused)
- [ ] Create guide-schema.tsx (Person) for guide detail
- [ ] Create guide-list-schema.tsx (ItemList) for guides listing
- [ ] Create tour-list-schema.tsx (ItemList) for tours listing
- [ ] Create about-schema.tsx (AboutPage) for about-us
- [ ] Add WebPageSchema to find-tour page
- [ ] Add WebPageSchema to group-booking page
- [ ] Add WebPageSchema to privacy/terms pages
- [ ] Update seo/index.ts with new exports
- [ ] Validate all schemas

## Success Criteria

- [ ] Lighthouse Accessibility score > 95
- [ ] Lighthouse SEO score > 95
- [ ] 0 WCAG 2.1 AA violations (axe DevTools)
- [ ] All 12 pages have OG + Twitter + hreflang metadata
- [ ] sitemap.xml accessible and includes all routes + alternates
- [ ] robots.txt blocks /admin/ and /api/
- [ ] Schema.org validates without errors on all pages
- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible
- [ ] Skip link works on all pages

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Hidden a11y issues in 3rd-party components | Medium | High | axe audit + manual testing |
| Schema validation errors | Medium | Medium | Validate before deploy |
| Missing hreflang on dynamic pages | Low | Medium | Automated in generatePageMetadata |
| Guide pages missing from sitemap | Low | Medium | Include dynamic CMS queries |

## Security Considerations

- Sanitize all CMS content in Schema.org JSON-LD (prevent XSS in script tags)
- Validate URLs before including in sitemap
- robots.txt must not expose sensitive paths beyond /admin/ and /api/
- No user-generated content in structured data without sanitization

## Validation Summary

**Validated:** 2026-02-15
**Questions asked:** 5

### Confirmed Decisions
- **AI Crawlers:** Allow all AI crawlers (GPTBot, CCBot, etc.) - aligns with AI-first discoverability strategy
- **List Schemas:** Include ItemList schemas for both /tours and /guides listing pages - good for AI discoverability
- **Legal Pages:** Full treatment - add WebPageSchema + enhanced metadata to privacy/terms (upgraded from P3 skip)
- **About Data Source:** Reuse guide data from Payload CMS guides collection for AboutPage schema founders - no new data entry needed
- **Implementation Order:** SEO first → Part 2 (SEO Foundation) → Part 3 (Schema) → Part 1 (Accessibility) → Part 4 (Testing)

### Action Items
- [ ] Update robots.ts plan: do NOT block AI scrapers (keep simple allow-all except /admin/ /api/)
- [ ] Update privacy/terms from P3 to P2: include WebPageSchema + full metadata upgrade
- [ ] AboutSchema should query guides collection instead of hardcoding founders data
- [ ] Reorder implementation: start with Part 2 (SEO Foundation) instead of Part 1 (Accessibility)

## Next Steps

After completion:
1. Proceed to [Phase 11: Performance + Testing](./phase-11-performance-testing.md)
2. Core Web Vitals optimization
3. Cross-browser testing
4. Submit sitemap to Google Search Console
