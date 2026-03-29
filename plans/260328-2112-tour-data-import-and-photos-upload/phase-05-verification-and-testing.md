# Phase 5: Verification & Testing

## Context Links
- [Tour detail page](../../apps/web/app/[locale]/tours/[slug]/page.tsx)
- [Tour catalog](../../apps/web/app/[locale]/tours/page.tsx)
- [Tour gallery component](../../apps/web/components/) -- tour-gallery.tsx, tour-hero.tsx, tour-card.tsx
- [Data fetching](../../apps/web/lib/api/) -- get-tours.ts, get-tour-by-slug.ts, get-featured-tours.ts

## Overview
- **Priority:** P2
- **Status:** Pending
- **Effort:** 1h
- **Depends on:** Phase 4
- **Description:** Verify all imported data is correct and renders properly across all locales, devices, and pages.

## Key Insights

1. **Frontend components already exist** -- tour-gallery, tour-hero, tour-card all consume Payload tour data via existing API functions. No frontend code changes needed; just verify populated data renders correctly.
2. **3 locales to verify** -- sv (default), en, de. Each tour page must show correct translations.
3. **Image rendering chain** -- media -> Vercel Blob URL -> Next.js Image component -> responsive sizes. Verify thumbnail/card/hero sizes generated correctly.

## Requirements

### Functional Verification
- [ ] All 10 tours visible in Payload CMS admin
- [ ] All 10 tours have correct data in sv/en/de locales (spot-check 3 tours)
- [ ] All 77 photos visible in media collection
- [ ] Tour detail pages render correctly for each locale
- [ ] Tour catalog page lists all 10 tours
- [ ] Featured tours appear on homepage
- [ ] Image gallery shows all photos per tour
- [ ] Hero images display correctly on tour detail pages
- [ ] SEO meta tags present in page source (title, description, OG image)
- [ ] JSON-LD TourSchema valid in page source

### Data Integrity Checks
- [ ] Each tour has correct guide relationship (not null, points to valid guide)
- [ ] Each tour has categories and neighborhoods linked
- [ ] Each tour has images array with at least 1 image
- [ ] 8 tours have isPrimary image, 2 use first image as fallback
- [ ] Pricing data is numeric and reasonable
- [ ] Coordinates render on map (if map component exists)

### Cross-Locale Checks
- [ ] Swedish tour page (`/sv/tours/{slug}`) shows Swedish content
- [ ] English tour page (`/en/tours/{slug}`) shows English content
- [ ] German tour page (`/de/tours/{slug}`) shows German content
- [ ] Hreflang links correct in HTML head
- [ ] Sitemap includes all 10 tours x 3 locales = 30 URLs

## Architecture

### Verification Script (optional automation)

```typescript
// scripts/verify-tour-import.ts
// Query Payload for all 10 tours, validate:
// - required fields present
// - localized fields have sv/en/de values
// - images array populated
// - relationships resolved
// - SEO fields set
```

Can be a simple script that queries Payload Local API and logs a report. Not a test suite -- a one-time validation tool.

## Implementation Steps

1. **Run dry-run of all scripts first**
   - `npx tsx scripts/import-tour-photos.ts --dry-run`
   - `npx tsx scripts/translate-tour-data.ts --dry-run`
   - `npx tsx scripts/import-tour-data.ts --dry-run`
   - Verify no errors in dry-run output

2. **Execute Phase 1: upload photos**
   - Run `npx tsx scripts/import-tour-photos.ts`
   - Check Payload admin: 77 media entries exist
   - Check Vercel Blob dashboard: files uploaded
   - Verify `data/photo-media-mapping.json` generated

3. **Execute Phase 2: translate**
   - Run `npx tsx scripts/translate-tour-data.ts`
   - Review `data/translations-review/*.md` files
   - Flag any translation issues, re-run individual tours if needed
   - Verify `data/translated-tours.json` generated

4. **Execute Phase 3+4: import tours with SEO**
   - Run `npx tsx scripts/import-tour-data.ts`
   - Check Payload admin: 10 tours exist with all fields populated

5. **Manual verification**
   - Open 3 tour detail pages in browser (one from each category type)
   - Switch locale: verify sv/en/de content
   - Check image gallery loads, hero displays
   - View page source: check meta tags, JSON-LD
   - Check sitemap XML

6. **Optional: create verification script**
   - Query all tours, validate field completeness
   - Report any missing/empty fields
   - Verify media URLs are accessible (HTTP HEAD request)

## Todo List

- [ ] Run all scripts in `--dry-run` mode
- [ ] Execute Phase 1 (photos)
- [ ] Verify media entries in admin
- [ ] Execute Phase 2 (translation)
- [ ] Review translation quality
- [ ] Execute Phase 3+4 (import + SEO)
- [ ] Verify tours in admin
- [ ] Manual browser testing (3 tours x 3 locales)
- [ ] Check SEO meta tags
- [ ] Check JSON-LD schema
- [ ] Check sitemap
- [ ] Optional: create verification script

## Success Criteria

- All 10 tours render correctly on frontend in all 3 locales
- All 77 images load without 404s
- Hero images display on tour detail pages
- Tour catalog shows all tours with card images
- Featured tours appear on homepage
- SEO: valid meta tags + JSON-LD on every tour page
- Sitemap includes 30 tour URLs (10 tours x 3 locales)
- No console errors on tour pages

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Frontend component doesn't handle new data shape | Low | Medium | Components already consume Payload tour data; schema unchanged |
| Image sizes not generated by Blob plugin | Low | Medium | Check Payload admin media detail for size variants |
| Translation quality issues caught late | Medium | Low | Review step in Phase 2; can re-translate individual tours |

## Rollback Plan

If critical issues found after full import:
1. Delete tours: `payload.delete({ collection: 'tours', where: { slug: { in: [...slugs] } } })`
2. Delete media: `payload.delete({ collection: 'media', where: { id: { in: [...mediaIds] } } })`
3. Vercel Blob files remain but are orphaned (cleaned up separately via `del()`)
4. Re-run scripts after fixing issues

## Security Considerations
- No additional concerns; verification is read-only
- Rollback uses same Payload Local API access as import scripts
