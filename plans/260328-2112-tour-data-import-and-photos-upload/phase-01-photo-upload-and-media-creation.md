# Phase 1: Photo Upload to Vercel Blob & Media Creation

## Context Links
- [Media collection](../../packages/cms/collections/media.ts) -- upload config, imageSizes, localized alt/caption
- [Tours collection](../../packages/cms/collections/tours.ts) -- images array with `image` (upload->media), `caption`, `isPrimary`
- [Payload config](../../packages/cms/payload.config.ts) -- vercelBlobStorage plugin, `BLOB_READ_WRITE_TOKEN`
- Photos source: `docx/Photos/{tour-slug}/` -- 10 folders, 77 Medium JPEGs

## Overview
- **Priority:** P1 (blocks Phase 3)
- **Status:** Pending
- **Effort:** 2h
- **Description:** Upload 77 Medium JPEGs to Vercel Blob via Payload media collection Local API, generate localized alt text from filenames, output `tourSlug -> mediaId[]` mapping for Phase 3.

## Key Insights

1. **Payload handles Blob upload automatically** -- `@payloadcms/storage-vercel-blob` intercepts media collection uploads. We create media entries via Local API with file buffers; the plugin uploads to Blob and sets the URL.
2. **Medium photos only** (0.5-1.4MB) -- well within Vercel Blob 4.5MB limit. Large photos (5-23MB) skipped; Payload `imageSizes` config generates thumbnail (400x300), card (768x512), hero (1920x1080) from uploaded originals.
3. **8 of 10 tours have Hero photos** -- identified by "Hero" in filename. Missing Hero tours: `private-uppsala-day-tour-from-stockholm`, `gamla-stan-and-stockholm-city-hall-private-walking-tour`.
4. **Alt text from filenames** -- filenames are descriptive English (e.g., "Blue Hall at City Hall of Stockholm Medium.jpg"). Strip " Medium.jpg" suffix, use as EN alt text, translate to SV/DE.

## Requirements

### Functional
- Upload all 77 Medium JPEGs to Vercel Blob via Payload media Local API
- Create media entries with localized alt text (en from filename, sv/de translated)
- Track which photos belong to which tour slug
- Identify Hero photos by filename pattern
- Output JSON mapping: `{ [tourSlug]: { mediaIds: number[], heroMediaId: number | null } }`

### Non-Functional
- Batch processing (10 at a time) with 200ms delays to avoid rate limits
- Idempotent: skip if media with same filename alt already exists
- `--dry-run` flag for testing without actual uploads
- Progress logging per tour folder

## Architecture

### Data Flow
```
docx/Photos/{slug}/*Medium.jpg
    |
    v
fs.readFile() --> Buffer
    |
    v
payload.create({ collection: 'media', data: { alt, caption }, file: { data, mimetype, name, size } })
    |  (storage-vercel-blob plugin intercepts, uploads to Blob)
    v
Media entry created (id, url, sizes)
    |
    v
Accumulate: mapping[tourSlug].mediaIds.push(id)
    |  if filename contains "Hero": mapping[tourSlug].heroMediaId = id
    v
Write data/photo-media-mapping.json
```

### Payload Media Local API Shape
```typescript
await payload.create({
  collection: 'media',
  data: {
    alt: { sv: 'Blå hallen...', en: 'Blue Hall at City Hall of Stockholm', de: 'Blaue Halle...' },
    caption: { sv: '...', en: '...', de: '...' },
  },
  file: {
    data: buffer,        // fs.readFileSync result
    mimetype: 'image/jpeg',
    name: 'blue-hall-city-hall-stockholm.jpg',  // slugified
    size: buffer.length,
  },
})
```

## Related Code Files

### Files to Create
- `scripts/import-tour-photos.ts` -- main photo upload script

### Files to Read (context only)
- `packages/cms/collections/media.ts` -- media schema
- `packages/cms/payload.config.ts` -- blob storage config
- `packages/cms/collections/tours.ts` -- images array structure

### Output Files
- `data/photo-media-mapping.json` -- mapping for Phase 3

## Implementation Steps

1. **Create script scaffold** (`scripts/import-tour-photos.ts`)
   - Import: `fs`, `path`, `getPayload`, Payload config
   - Parse CLI args: `--dry-run`, `--batch-size=10`

2. **Scan photo directories**
   - Read `docx/Photos/` subdirectories
   - For each subdirectory (tour slug), find `*Medium*` files
   - Build list: `{ tourSlug, filePath, filename, isHero }`

3. **Generate alt text from filenames**
   - Strip " Medium.jpg" / " Medium.jpeg" suffix
   - Use result as EN alt text
   - For SV/DE: hardcode simple translations for common terms OR use a small lookup table (prefer KISS -- full translation happens in Phase 2 if needed)
   - Alternatively: set EN alt from filename, leave SV/DE as fallback (Payload fallback: true means EN shows if SV/DE empty -- but SV is default locale so we need at minimum SV)
   - **Decision:** Set SV = EN = filename-derived text, DE = EN (acceptable for alt text on photos; photo subjects are in English already -- "Vasa Museum", "Gamla Stan" are proper nouns)

4. **Upload photos in batches**
   - Initialize Payload via `getPayload({ config })`
   - For each batch of 10 photos:
     - Check if media with same alt text already exists (idempotency)
     - If not exists: `payload.create({ collection: 'media', data, file })`
     - Record created media ID
     - 200ms delay between batches

5. **Build and save mapping**
   - Accumulate: `{ [tourSlug]: { mediaIds: number[], heroMediaId: number | null } }`
   - Write to `data/photo-media-mapping.json`
   - Log summary: X photos uploaded, Y skipped (existing), Z errors

6. **Error handling**
   - Wrap each upload in try/catch
   - Log failed uploads with filename + error
   - Continue processing remaining photos on individual failure
   - Exit with non-zero code if any failures

## Todo List

- [ ] Create `scripts/import-tour-photos.ts`
- [ ] Implement directory scanning for Medium JPEGs
- [ ] Implement alt text generation from filenames
- [ ] Implement Payload media creation via Local API
- [ ] Implement batch processing with delays
- [ ] Implement idempotency check (skip existing)
- [ ] Implement `--dry-run` mode
- [ ] Implement Hero photo detection
- [ ] Write `data/photo-media-mapping.json` output
- [ ] Test with `--dry-run` first
- [ ] Run actual upload, verify in Payload admin

## Success Criteria

- 77 media entries created in Payload CMS
- All media entries have localized alt text (at minimum EN + SV fallback)
- Vercel Blob contains 77 original images + generated sizes (thumbnail, card, hero)
- `data/photo-media-mapping.json` contains all 10 tour slugs with correct media IDs
- 8 tours have `heroMediaId` set, 2 have `null`
- Script is idempotent (re-run skips existing)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Blob upload timeout | Low | Low | Retry with exponential backoff (max 3 retries) |
| Payload imageSizes processing slow | Medium | Low | Medium photos are 0.5-1.4MB; processing should complete in seconds |
| Filename encoding issues (Swedish chars: o, a) | Medium | Medium | Use `path.basename()`, handle UTF-8 properly |
| `BLOB_READ_WRITE_TOKEN` missing | Low | High | Validate env var at script start, fail fast |
| Duplicate media on re-run | Low | Medium | Check existing by alt text before creating |

## Security Considerations

- `BLOB_READ_WRITE_TOKEN` loaded from env, never hardcoded or logged
- No user input -- script reads from local filesystem only
- Media entries have read: () => true access (public images, by design)

## Next Steps

- Phase 3 consumes `data/photo-media-mapping.json` to link media IDs to tour entries
- Phase 4 may refine alt text with tour context for SEO
