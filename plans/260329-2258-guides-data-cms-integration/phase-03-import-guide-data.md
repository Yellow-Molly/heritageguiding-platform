# Phase 3: Import Guide Data to CMS

## Context Links
- Input: `data/translated-guides.json` (Phase 1 output)
- Input: `data/guide-photo-media-mapping.json` (Phase 2 output)
- Pattern reference: `scripts/import-tour-data.ts`
- CMS collection: `packages/cms/collections/guides.ts`
- Lexical converter: `packages/cms/lib/csv/tour-csv-markdown-to-lexical-converter.ts`

## Overview
- **Priority:** P1
- **Status:** Pending
- **Effort:** 1.5h
- **Depends on:** Phase 1 + Phase 2

Read translated guide JSON + photo mapping, delete placeholder guides, create real guide entries with 3 locales, update tour references.

## Key Insights
- 9 placeholder guides exist with generic slugs like `stockholm-authorized-guide-walking-tour`
- Tours reference these placeholder guides by ID (relationship field)
- Must: (1) create real guides, (2) update each tour's `guide` field to point to the correct new guide, (3) delete placeholders
- Order matters: create new guides first, update tours, then delete old placeholders
- Bio is richText (Lexical) — must convert plain text/markdown to Lexical JSON using `markdownToLexical()`
- Credentials are localized arrays — each credential item has a `credential` text field

## Requirements

### Functional
- Read `data/translated-guides.json` and `data/guide-photo-media-mapping.json`
- Resolve relationships: specializations -> category IDs, operatingAreas -> city IDs
- Create 7 guide entries in Payload CMS with all 3 locales (sv, en, de)
- Attach uploaded photo via media ID from mapping
- Update tour records: remap `guide` field from old placeholder ID to new real guide ID
- Delete old placeholder guide entries
- Support `--dry-run` (log what would happen), `--update` (overwrite existing), `--status=active`

### Non-Functional
- Follow import-tour-data.ts pattern exactly
- Script under 200 lines; extract helpers if needed
- Idempotent on re-run with `--update`

## Architecture

### Data Flow
```
data/translated-guides.json + data/guide-photo-media-mapping.json
  |
  v
For each guide:
  1. Resolve specialization slugs -> category IDs
  2. Resolve operating area slugs -> city IDs
  3. Get photo media ID from mapping
  4. Convert bio text to Lexical JSON
  5. Build localized data (sv first, then en/de updates)
  |
  v
payload.create({ collection: 'guides', locale: 'sv', data: {...} })
payload.update({ collection: 'guides', id, locale: 'en', data: {...} })
payload.update({ collection: 'guides', id, locale: 'de', data: {...} })
  |
  v
Tour reassignment:
  For each GUIDE_TO_TOURS entry:
    Find tour by slug -> update tour.guide to new guide ID
  |
  v
Delete old placeholder guides (slugs starting with 'stockholm-authorized-guide')
```

### Guide Creation Data Structure
```typescript
// SV locale (initial create)
{
  name: 'Sabine Gruen',
  slug: 'sabine-gruen',
  status: 'active',
  bio: markdownToLexical(svBioText),          // richText localized
  credentials: [{ credential: 'Auktoriserad guide' }],  // array, localized inner text
  photo: mediaId,                              // upload relation
  email: 'sabine@example.com',
  phone: '+46...',
  languages: ['sv', 'en', 'de'],              // select hasMany
  specializations: [categoryId1, categoryId2], // relationship to categories
  operatingAreas: [cityId1],                   // relationship to cities
  additionalLanguages: ['no', 'da'],           // select hasMany
}

// EN/DE locale updates (only localized fields)
{
  bio: markdownToLexical(enBioText),
  credentials: [{ credential: 'Authorized guide' }],
}
```

### Tour Reassignment Logic
```typescript
const GUIDE_TO_TOURS = { /* from Phase 1 config */ }

// Build old-slug -> new-guide-id map
for (const [newGuideSlug, tourSlugs] of Object.entries(GUIDE_TO_TOURS)) {
  const newGuide = newGuideMap.get(newGuideSlug)
  for (const tourSlug of tourSlugs) {
    const tour = tourMap.get(tourSlug)
    if (tour && newGuide) {
      await payload.update({ collection: 'tours', id: tour.id, data: { guide: newGuide.id } })
    }
  }
}
```

## Related Code Files

### Files to Create
- `scripts/import-guide-data.ts` — main import script

### Files to Read (patterns)
- `scripts/import-tour-data.ts` — Payload create/update with locales, relationship resolution, dry-run
- `scripts/create-placeholder-guides.ts` — placeholder slug list (for deletion)
- `packages/cms/lib/csv/tour-csv-markdown-to-lexical-converter.ts` — `markdownToLexical()` for bio richText

### Files Modified (by script execution)
- CMS `guides` collection: 9 placeholders deleted, 7 real guides created
- CMS `tours` collection: `guide` field updated on all tours

## Implementation Steps

1. Create `scripts/import-guide-data.ts` with imports
2. Define CLI flags: `--dry-run`, `--update`, `--status=active|inactive`
3. Define `GUIDE_TO_TOURS` mapping (same as Phase 1 config)
4. Define `PLACEHOLDER_SLUGS` array (from `create-placeholder-guides.ts`)
5. Implement `buildGuideLocaleData(guide, locale, photoMediaId, relationships)`:
   - For sv: all fields including slug, name, email, phone, languages, status
   - For en/de: only localized fields (bio, credentials)
   - Bio: convert text to Lexical via `markdownToLexical()`
   - Credentials: map to `[{ credential: text }]` array format
6. Implement `main()`:
   - Load JSON files, validate existence
   - Dry run: print guide summaries and exit
   - Init Payload
   - Pre-fetch: existing guides (for idempotency), categories (for specializations), cities (for operatingAreas), tours (for reassignment)
   - **Create phase**: For each guide in translated JSON:
     - Resolve specialization slugs to category IDs (warn on missing)
     - Resolve operating area slugs to city IDs (warn on missing)
     - Get photo media ID from mapping
     - Check if slug exists: skip (or update if `--update`)
     - Create with sv locale, then update en and de locales
   - **Tour reassignment phase**: For each mapping in GUIDE_TO_TOURS:
     - Find tour by slug, find new guide by slug
     - `payload.update({ collection: 'tours', id: tour.id, data: { guide: newGuideId } })`
   - **Cleanup phase**: Delete placeholder guides not matching any real guide slug
   - Print summary: created/updated/skipped/errors, tours reassigned, placeholders deleted

## Todo List
- [ ] Create import-guide-data.ts
- [ ] Test with --dry-run
- [ ] Run Phase 1 and Phase 2 first
- [ ] Execute import
- [ ] Verify guides in CMS admin
- [ ] Verify tour->guide relationships in CMS admin
- [ ] Confirm placeholder guides deleted

## Success Criteria
- 7 real guides in CMS with name, slug, bio (3 locales), credentials (3 locales), photo, email, phone, languages, specializations, operatingAreas
- All tours point to correct real guide (no orphaned references)
- 9 placeholder guides deleted
- Script outputs clean summary with 0 errors
- Re-run with `--update` succeeds without duplicates

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Tour reassignment breaks tour display | Medium | High | Verify tour.guide is valid ID after update; run verify script (Phase 4) |
| Placeholder deletion removes guides still referenced by tours | Medium | Critical | Order: create new -> reassign tours -> verify no tours reference old guides -> delete old |
| Specialization/operatingArea slugs don't match CMS categories/cities | Medium | Medium | Warn on missing, don't fail; log for manual fix |
| Slug mismatch between Phase 1/2/3 | Medium | High | Use identical slug derivation; validate slug exists in both JSON files before import |

## Security Considerations
- Email and phone stored in CMS but not exposed on frontend (admin-only sidebar fields)
- No API keys in script (Payload Local API, no auth needed)

## Next Steps
- Run Phase 4 verification after this phase
- Manual review in CMS admin panel
- Manual browser test of guide pages
