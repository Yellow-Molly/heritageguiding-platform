# Phase 3: Tour Data Import to Database

## Context Links
- [translated-tours.json](../../data/translated-tours.json) -- Phase 2 output (3 locales)
- [photo-media-mapping.json](../../data/photo-media-mapping.json) -- Phase 1 output (mediaIds per tour)
- [csvRowToTourData()](../../packages/cms/lib/csv/tour-csv-column-mapping.ts#L411) -- existing mapping pattern to follow
- [markdownToLexical()](../../packages/cms/lib/csv/tour-csv-markdown-to-lexical-converter.ts) -- richtext converter
- [Tours collection](../../packages/cms/collections/tours.ts) -- target schema

## Overview
- **Priority:** P1
- **Status:** Pending
- **Effort:** 2h
- **Depends on:** Phase 1 (media mapping), Phase 2 (translated data)
- **Description:** Merge translated tour JSON + media mapping, resolve relationships by slug, create 10 tour entries via Payload Local API with full localization and image galleries.

## Key Insights

1. **Reuse `csvRowToTourData` pattern** -- the existing function shows the exact Payload document shape. Our script produces the same structure but from pre-translated JSON instead of CSV rows.
2. **Lexical richText for descriptions** -- `markdownToLexical()` already exists in `tour-csv-markdown-to-lexical-converter.ts`. Apply to `description` field for all 3 locales.
3. **Images array structure** -- tours.images is `[{ image: mediaId, caption: localizedString, isPrimary: boolean }]`. Map from Phase 1 output.
4. **Relationship resolution** -- guide, categories, neighborhoods referenced by slug in xlsx. Must query Payload to get IDs. Existing import service does this already -- reuse pattern.
5. **Locale handling** -- Payload Local API with `locale` param sets one locale at a time. For multi-locale creation, pass the localized object structure directly (e.g., `title: { sv: '...', en: '...', de: '...' }`).

## Requirements

### Functional
- Read `data/translated-tours.json` (Phase 2 output)
- Read `data/photo-media-mapping.json` (Phase 1 output)
- Resolve guide slug -> guide ID via `payload.find({ collection: 'guides', where: { slug: { equals: guideSlug } } })`
- Resolve category slugs -> category IDs (same pattern)
- Resolve neighborhood slugs -> neighborhood IDs (same pattern)
- For each tour: create Payload CMS tour entry with:
  - All localized fields in sv/en/de
  - `description` converted to Lexical richText per locale
  - `images` array linked to media entries from Phase 1
  - Hero image marked `isPrimary: true`
  - `status: 'published'` (or configurable)
  - `featured` flag from xlsx data
- Handle duplicate slugs: check existing, skip or update (configurable)

### Non-Functional
- `--dry-run` flag: validate data + resolve relationships without creating tours
- `--update` flag: update existing tours instead of skipping
- Sequential processing (not parallel) to avoid DB contention
- Detailed logging: created/updated/skipped/failed per tour

## Architecture

### Data Flow
```
data/translated-tours.json ──┐
                              ├──> merge per tour
data/photo-media-mapping.json┘
         |
         v
Resolve relationships (guide, categories, neighborhoods by slug)
         |
         v
Build Payload document shape (reuse csvRowToTourData pattern)
  - localized text fields: { sv, en, de }
  - description: markdownToLexical() per locale
  - highlights: [{ highlight: text }] per locale
  - images: [{ image: mediaId, caption: { sv, en, de }, isPrimary }]
  - pricing, duration, logistics, inclusions, audience, accessibility groups
         |
         v
payload.create({ collection: 'tours', data: tourDocument })
```

### Tour Document Shape (what we create)

```typescript
{
  slug: 'private-rib-tour-stockholm-3h',
  title: { sv: '...', en: '...', de: '...' },
  shortDescription: { sv: '...', en: '...', de: '...' },
  description: { sv: lexicalJson, en: lexicalJson, de: lexicalJson },
  highlights: {
    sv: [{ highlight: '...' }, ...],
    en: [{ highlight: '...' }, ...],
    de: [{ highlight: '...' }, ...],
  },
  pricing: { basePrice: 4500, currency: 'SEK', priceType: 'per_group', ... },
  duration: { hours: 3, durationText: { sv: '...', en: '...', de: '...' } },
  logistics: {
    meetingPointName: { sv: '...', en: '...', de: '...' },
    meetingPointAddress: { sv: '...', en: '...', de: '...' },
    coordinates: [lng, lat],  // GeoJSON point [lng, lat]
    googleMapsLink: '...',
    meetingPointInstructions: { sv: '...', en: '...', de: '...' },
    endingPoint: { sv: '...', en: '...', de: '...' },
    parkingInfo: { sv: '...', en: '...', de: '...' },
    publicTransportInfo: { sv: '...', en: '...', de: '...' },
  },
  included: { sv: [{ item: '...' }], en: [...], de: [...] },
  notIncluded: { sv: [...], en: [...], de: [...] },
  whatToBring: { sv: [...], en: [...], de: [...] },
  targetAudience: ['families', 'couples'],
  difficultyLevel: 'easy',
  ageRecommendation: { minimumAge: null, childFriendly: true, teenFriendly: true },
  accessibility: {
    wheelchairAccessible: false,
    mobilityNotes: { sv: '...', en: '...', de: '...' },
    hearingAssistance: false,
    visualAssistance: false,
    serviceAnimalsAllowed: true,
  },
  guide: guideId,            // resolved from slug
  categories: [catId1, ...], // resolved from slugs
  neighborhoods: [nbId1, ...],
  images: [
    { image: mediaId1, caption: { sv: '...', en: '...', de: '...' }, isPrimary: true },
    { image: mediaId2, caption: { sv: '...', en: '...', de: '...' }, isPrimary: false },
    ...
  ],
  bokunExperienceId: null,
  availability: 'available',
  maxGroupSize: 12,
  minGroupSize: 1,
  featured: true,
  status: 'published',
}
```

## Related Code Files

### Files to Create
- `scripts/import-tour-data.ts` -- main tour import script

### Files to Read (context only)
- `packages/cms/lib/csv/tour-csv-column-mapping.ts` -- `csvRowToTourData()` pattern
- `packages/cms/lib/csv/tour-csv-markdown-to-lexical-converter.ts` -- `markdownToLexical()`
- `packages/cms/lib/csv/tour-csv-import-service.ts` -- relationship resolution pattern
- `packages/cms/collections/tours.ts` -- tour schema reference

### Input Files
- `data/translated-tours.json` (from Phase 2)
- `data/photo-media-mapping.json` (from Phase 1)

## Implementation Steps

1. **Create script scaffold** (`scripts/import-tour-data.ts`)
   - Import: `getPayload`, config, `markdownToLexical`, fs, path
   - Parse CLI args: `--dry-run`, `--update`, `--status=published|draft`

2. **Load input data**
   - Read and parse `data/translated-tours.json`
   - Read and parse `data/photo-media-mapping.json`
   - Validate both files exist and are valid JSON

3. **Pre-validate relationships**
   - Extract unique guide slugs, category slugs, neighborhood slugs from all tours
   - Query Payload for each: `payload.find({ collection, where: { slug: { equals } } })`
   - Build lookup maps: `{ [slug]: id }`
   - Fail fast if any referenced slug not found in DB (log which ones are missing)

4. **Process each tour**
   - For each tour in translated-tours.json:
     a. Check if tour slug already exists in DB
     b. If exists and `--update` not set: skip, log warning
     c. If exists and `--update` set: use `payload.update()` instead of `create()`
     d. Build tour document shape (see Architecture section)
     e. Convert description to Lexical richText for each locale
     f. Map images from photo-media-mapping: build images array with captions and isPrimary
     g. Resolve guide/categories/neighborhoods from lookup maps
     h. Create or update tour via Payload Local API

5. **Image array construction**
   - For each tour slug, look up `photoMediaMapping[slug]`
   - Map `mediaIds` to images array entries
   - Set `isPrimary: true` for `heroMediaId`
   - Caption: derive from media alt text or leave empty (already set on media entry)

6. **Coordinate handling**
   - xlsx coordinates format: "lat,lng" string
   - Payload `point` field expects: `[lng, lat]` (GeoJSON)
   - Parse and swap: `"59.3293,18.0686"` -> `[18.0686, 59.3293]`

7. **Output summary**
   - Log: X created, Y updated, Z skipped, W failed
   - List any missing relationships or validation errors

## Todo List

- [ ] Create `scripts/import-tour-data.ts`
- [ ] Implement input file loading and validation
- [ ] Implement relationship pre-validation (guide, categories, neighborhoods)
- [ ] Implement tour document builder (reuse csvRowToTourData pattern)
- [ ] Implement Lexical richText conversion for descriptions
- [ ] Implement images array construction from media mapping
- [ ] Implement coordinate parsing (lat,lng string -> [lng,lat] array)
- [ ] Implement duplicate slug handling (skip/update)
- [ ] Implement `--dry-run` mode
- [ ] Implement `--update` mode
- [ ] Test with `--dry-run` first
- [ ] Run actual import, verify in Payload admin
- [ ] Verify all 10 tours visible in admin with correct localized content

## Success Criteria

- 10 tour entries created in Payload CMS
- Each tour has title, description, shortDescription in sv/en/de
- Each tour linked to correct guide, categories, neighborhoods
- Each tour has images array with correct media entries
- 8 tours have a primary/hero image set
- Descriptions are valid Lexical richText (render correctly in admin + frontend)
- Featured tours marked correctly
- All tours have status='published'
- Script is idempotent with `--update` flag

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Missing guide/category/neighborhood slugs | Medium | High | Pre-validation step fails fast with clear error listing missing slugs |
| Lexical conversion produces invalid JSON | Low | Medium | Existing converter is battle-tested; validate output structure |
| Coordinate parsing error | Low | Low | Validate coordinate format, skip if invalid |
| Description too long for shortDescription | Low | Low | shortDescription is separate column (col 3), already max 160 chars |
| Images array exceeds maxRows: 20 | Low | Low | Max photos per tour is ~10 (77 / 10 tours), well under limit |

## Security Considerations

- Database credentials in `DATABASE_URL` env var, not hardcoded
- Script runs locally, no external API calls (except Payload -> PostgreSQL)
- No user input -- reads from pre-validated JSON files

## Next Steps

- Phase 4: generate SEO metadata for created tours
- Phase 5: verify everything renders correctly on frontend
