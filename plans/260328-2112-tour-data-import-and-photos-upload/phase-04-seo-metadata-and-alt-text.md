# Phase 4: SEO Metadata & Alt Text Optimization

## Context Links
- [SEO fields](../../packages/cms/fields/seo-fields.ts) -- meta title, description, OG image fields
- [Tours collection](../../packages/cms/collections/tours.ts) -- `seo` group field
- Tour pages: `apps/web/app/[locale]/tours/[slug]/page.tsx`

## Overview
- **Priority:** P2
- **Status:** Pending
- **Effort:** 0.5h
- **Depends on:** Phase 3 (tours must exist in DB)
- **Description:** Populate SEO meta fields on each tour and refine media alt text with tour context for better search visibility.

## Key Insights

1. **SEO fields already on tour schema** -- `seo` group contains `metaTitle`, `metaDescription`, `ogImage` (localized). Just needs population.
2. **Existing TourSchema/TourListSchema** -- JSON-LD already wired in frontend, will auto-populate from tour data once present.
3. **Alt text refinement** -- Phase 1 set generic alt text from filenames. Adding tour context improves SEO: "Blue Hall at City Hall of Stockholm" -> "Blue Hall at Stockholm City Hall - Private Walking Tour".
4. **OG image** -- set to the primary/hero media entry for each tour. 2 tours without hero use first gallery image.

## Requirements

### Functional
- For each of 10 tours, set SEO fields:
  - `seo.metaTitle` (sv/en/de): tour title (max 60 chars)
  - `seo.metaDescription` (sv/en/de): shortDescription (max 160 chars)
  - `seo.ogImage`: primary media entry ID (hero photo or first gallery photo)
- Update media alt text to include tour context where helpful
- Verify JSON-LD schema renders correctly with populated data

### Non-Functional
- Can be merged into Phase 3 script as a post-creation step, or run as separate update pass
- `--dry-run` support

## Architecture

### Data Flow
```
Payload tours (from Phase 3) --> query each tour
    |
    v
Generate SEO fields from existing tour data:
  metaTitle = truncate(title, 60)
  metaDescription = truncate(shortDescription, 160)
  ogImage = primaryImageId (from images array where isPrimary=true)
    |
    v
payload.update({ collection: 'tours', id, data: { seo: {...} } })
    |
    v
Optionally: update media alt text with tour slug context
payload.update({ collection: 'media', id, data: { alt: refined } })
```

## Related Code Files

### Files to Create or Modify
- Either extend `scripts/import-tour-data.ts` OR create `scripts/update-tour-seo.ts`
- **Decision:** Extend Phase 3 script. SEO fields are derived from tour data already being written. Add SEO generation as post-create step. Keeps it DRY.

### Files to Read
- `packages/cms/fields/seo-fields.ts` -- field structure
- `apps/web/app/[locale]/tours/[slug]/page.tsx` -- how SEO fields are consumed

## Implementation Steps

1. **Add SEO field generation to Phase 3 tour document builder**
   - `seo.metaTitle`: `{ sv: truncate(title.sv, 60), en: truncate(title.en, 60), de: truncate(title.de, 60) }`
   - `seo.metaDescription`: `{ sv: truncate(shortDescription.sv, 160), ... }`
   - `seo.ogImage`: primary media ID from images array

2. **Alt text refinement (optional pass)**
   - Query all media entries linked to tours
   - Append tour name context to alt text if not already present
   - Example: "Rib Boat Speed" -> "Rib Boat Speed - Private RIB Tour Stockholm"
   - Only do this if alt text is generic (< 40 chars)

3. **Verify JSON-LD output**
   - After import: check a tour page's HTML source for TourSchema
   - Verify `name`, `description`, `image` fields populated

## Todo List

- [ ] Add SEO field generation to tour document builder in Phase 3
- [ ] Implement metaTitle truncation (60 chars)
- [ ] Implement metaDescription from shortDescription (160 chars)
- [ ] Set ogImage to primary media ID
- [ ] Optional: alt text refinement with tour context
- [ ] Verify JSON-LD renders correctly on tour pages

## Success Criteria

- All 10 tours have `seo.metaTitle` in 3 locales
- All 10 tours have `seo.metaDescription` in 3 locales
- All 10 tours have `seo.ogImage` set to a media entry
- No metaTitle exceeds 60 chars, no metaDescription exceeds 160 chars

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Title > 60 chars after truncation loses meaning | Low | Low | Truncate at word boundary, add ellipsis |
| OG image missing for 2 tours without hero | Low | Low | Fall back to first gallery image |

## Security Considerations
- No additional security concerns; operates on existing public tour data

## Next Steps
- Phase 5: full verification and testing
