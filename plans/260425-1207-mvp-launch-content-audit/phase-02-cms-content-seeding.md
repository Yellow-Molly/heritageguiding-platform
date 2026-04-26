# Phase 02 — CMS Content Seeding

## Context Links
- Research: [researcher-02-cms-i18n-content-audit.md](research/researcher-02-cms-i18n-content-audit.md) sections 2-5, 7-8
- Depends on: phase-06 (assignment briefs delivered to copywriters), phase-03 (Stockholm/neighborhood naming verified)

## Overview
- **Date:** 2026-04-25
- **Description:** Populate empty Payload collections with MVP-grade content (Tours, Guides, Categories, Cities, Neighborhoods, Reviews, Media) across SV/EN/DE.
- **Priority:** P1 (BLOCKER)
- **Status:** pending
- **Review status:** not started

## Key Insights
- 13 schemas defined, NO seeded content — admin DB is empty
- No production seed scripts exist; must use Payload admin UI or CSV import (toolbar exists for Tours)
- All localized fields require SV (source) + EN + DE — no auto-translate
- Media collection requires localized `alt` per image (a11y + SEO)
- Bokun product IDs must match production catalog (not staging) for live booking

## Requirements

### Functional
- 1 City: Stockholm (SV/EN/DE name + description)
- 3+ Neighborhoods: Gamla Stan, Norrmalm, Östermalm (or per business decision)
- 6+ Categories matching i18n filter labels (Historia & Kulturarv, Mat & Dryck, Konst & Museer, etc.)
- 5+ Tours: each with title/description/shortDescription/highlights × SV/EN/DE + pricing/duration/logistics + 3+ media items + Bokun ID + accessibility flags
- 2+ Guides: name/bio/credentials/profile sections × SV/EN/DE + photo
- 10+ verified Reviews tied to tours, locales mixed
- All Media uploads have alt text per locale

### Non-functional
- Tour images optimized < 500KB each (WebP preferred)
- All content `status: published` (not draft) before launch
- Slugs URL-safe, no SV diacritics in slug (use slugify)

## Architecture

```
Content brief (phase-06) ──► Copywriter writes per locale
                              │
                              ▼
                  Payload admin UI (Tours/Guides/etc.)
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
         Postgres       Media (Vercel     Cache invalidation
         (localized)    Blob storage)     (front-site)
                              │
                              ▼
                       Frontend reads via
                       getPayload() server client
```

- Localized fields stored as JSONB per-locale in Postgres
- Media ref'd by ID; alt text per locale
- Cache invalidation on save: existing webhook (per recent commit `ddfc0ea fix(cache): invalidate front-site cache on CMS edits`)

## Related Code Files

### Read for context
- `packages/cms/collections/Tours.ts` — field definitions, accessibility group
- `packages/cms/collections/Guides.ts` — Phase 16 fields (guideStyle, etc.)
- `packages/cms/collections/Categories.ts`, `Cities.ts`, `Neighborhoods.ts`
- `packages/cms/collections/Reviews.ts` — verified flag
- `packages/cms/collections/Media.ts` — alt text requirement
- `packages/cms/globals/SiteSettings.ts` — whatsappNumber field
- `apps/web/messages/sv.json` `tours.filters.*` — category names to mirror

### No new code files
This phase is content-only. Optional: create `packages/cms/scripts/seed-cities.ts` for repeatable Stockholm seed (post-MVP).

## Implementation Steps

1. Receive briefs from phase-06 (5 tour briefs, 2 guide briefs, categories list, etc.)
2. Admin login at `/admin` (Payload)
3. Seed Cities → Stockholm (SV/EN/DE)
4. Seed Neighborhoods → 3+ tied to Stockholm
5. Seed Categories → 6+ matching i18n labels exactly
6. Upload Media library: tour photos (3+ per tour) + guide photos + hero — all with localized alt
7. Seed Guides → 2 entries, all locale fields, attach photo
8. Seed Tours → 5 entries:
   - Set Bokun product ID per tour (verify in Bokun dashboard)
   - Link category, city, neighborhoods, guides
   - Fill all localized fields (title, description, shortDescription, highlights, accessibility)
   - Upload tour images
   - Set pricing, duration, schedule, capacity
   - Set `featured: true` for 3 tours
   - Set `status: published`
8. Seed Reviews → 10+, linked to tours, set `verified: true`
9. Set Globals → SiteSettings.whatsappNumber (from phase-03)
10. Verify on staging URL: tours list, tour detail, guides list, guide detail, all locales
11. Trigger cache invalidation (auto via webhook); confirm frontend updates
12. Sign-off: content lead + business owner

## Todo
- [ ] Briefs received from phase-06
- [ ] Cities seeded (Stockholm SV/EN/DE)
- [ ] Neighborhoods seeded (3+)
- [ ] Categories seeded (6+, i18n-aligned)
- [ ] Media uploaded with alt text (all locales)
- [ ] Guides seeded (2+, full bios SV/EN/DE)
- [ ] Tours seeded (5+, Bokun IDs verified)
- [ ] Tours set featured + published
- [ ] Reviews seeded (10+, verified flag)
- [ ] SiteSettings.whatsappNumber set
- [ ] Staging visual QA across 3 locales
- [ ] Cache invalidation confirmed
- [ ] Content lead + business owner sign-off

## Success Criteria
- `/tours` lists 5+ published tours in each locale
- `/tours/[slug]` renders all fields (description, highlights, accessibility) per locale
- `/guides` lists 2+ guides w/ photos
- `/guides/[slug]` shows full bio per locale
- Reviews appear on tour detail (when phase-01 flag enabled)
- Bokun "Book Now" CTA works for ≥1 tour (test booking)
- Categories filter on `/tours` works (catalog filter matches seeded categories)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Translation quality drift across SV/EN/DE | High | High | Native-speaker reviewer per locale before publish |
| Bokun product ID mismatch | Med | Critical | Test booking per tour in staging w/ live Bokun |
| Media file sizes balloon page weight | Med | Med | Image compression pipeline (Vercel Blob auto-optimizes) + 500KB limit per asset |
| Slug collisions w/ existing routes | Low | Med | Reserved-slug check in Payload (validate hook) |
| Category names mismatch i18n filter labels | Med | High | Exact-match QA: paste i18n value into category name field |
| Cache invalidation fails post-edit | Low | High | Verify webhook in staging before bulk edits; manual purge fallback |

## Security Considerations
- Admin user accounts: enable 2FA, use SSO if available
- Reviews `verified: true` only after author identity confirmed (no fake-positive injection)
- Media uploads: Payload validates MIME; reject SVG (XSS risk)
- Bokun product IDs are public-safe; Bokun API key stays server-side
- GDPR: review author names (initials/first-name only acceptable); no email/phone in review text

## Next Steps
- Phase-07 QA verifies all seeded content renders correctly
- Post-MVP: build seed-script for repeatable env restore
- Post-MVP: editorial calendar for ongoing tour additions
