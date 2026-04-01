# Phase 2: Import Guide Photos

## Context Links
- Photos source: `docx/Guide-photos/`
- Pattern reference: `scripts/import-tour-photos.ts`
- CMS media collection: `packages/cms/collections/media.ts`

## Overview
- **Priority:** P1 (blocks Phase 3)
- **Status:** Pending
- **Effort:** 1h

Upload 7 guide photos to Payload media collection, output mapping JSON for Phase 3.

## Key Insights
- Photos are flat in `docx/Guide-photos/` (not subdirectories like tour photos)
- Filenames have special characters: `Sabine_Grün.jpeg`, `Niklas_Löfström.jpeg`, `Olof_Näslund.jpeg`
- Mixed extensions: `.jpeg` and `.jpg`
- Filename pattern: `Firstname_Lastname.{jpg,jpeg}`
- Need to derive guide slug from photo filename to build mapping

## Requirements

### Functional
- Upload all 7 photos to Payload media collection
- Generate alt text from filename (e.g., "Sabine Gruen" from "Sabine_Grün.jpeg")
- Map photo filename to guide slug for output mapping
- Output: `data/guide-photo-media-mapping.json` — `Record<guideSlug, mediaId>`
- Idempotent: skip if alt text already exists (reuse existing media ID)

### Non-Functional
- Support `--dry-run` flag
- Reuse `payload-bootstrap.ts` for CMS access
- Script under 200 lines

## Architecture

### Data Flow
```
docx/Guide-photos/*.{jpg,jpeg}
  |
  v
Scan files -> [{ filename, filePath, guideSlug, altText }]
  |
  v
For each: payload.create({ collection: 'media', data: { alt }, file: { data, mimetype, name, size } })
  |
  v
Write data/guide-photo-media-mapping.json: { "sabine-gruen": 123, "anders-boysen": 456, ... }
```

### Filename-to-Slug Derivation
```typescript
// "Sabine_Grün.jpeg" -> "sabine-gruen"
// "Niklas_Löfström.jpeg" -> "niklas-lofstrom"
// "Olof_Näslund.jpeg" -> "olof-naslund"
function photoFilenameToGuideSlug(filename: string): string {
  return filename
    .replace(/\.(jpg|jpeg|png)$/i, '')  // strip extension
    .replace(/_/g, '-')                  // underscores to hyphens
    .toLowerCase()
    // ASCII transliteration for Swedish/German chars
    .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u')
    .replace(/å/g, 'a').replace(/é/g, 'e').replace(/è/g, 'e')
}
```

> **IMPORTANT:** The slug derivation here MUST match the slug derivation in Phase 1's `translate-guide-data.ts`. Extract to a shared utility if needed, or ensure both use identical logic.

## Related Code Files

### Files to Create
- `scripts/import-guide-photos.ts` — photo upload script

### Files to Read (patterns)
- `scripts/import-tour-photos.ts` — Payload media upload pattern, idempotency by alt text, mapping output
- `scripts/payload-bootstrap.ts` — Payload init

## Implementation Steps

1. Create `scripts/import-guide-photos.ts` with imports (fs, path, payload-bootstrap)
2. Define constants: `PHOTOS_DIR`, `OUTPUT_PATH`, `BATCH_DELAY_MS`
3. Implement `photoFilenameToGuideSlug(filename)` — ASCII transliteration matching Phase 1
4. Implement `scanPhotos()`:
   - Read `docx/Guide-photos/` directory
   - Filter for `.jpg`/`.jpeg` files
   - For each: derive `guideSlug`, `altText` (readable name), `filePath`
   - Return array of photo entries
5. Implement `main()`:
   - Scan photos, log count
   - Dry run: print what would be uploaded, exit
   - Init Payload
   - Pre-fetch existing media by alt text for idempotency
   - Upload each photo via `payload.create({ collection: 'media', ... })`
   - Build mapping: `Record<guideSlug, number>` (mediaId)
   - Write `data/guide-photo-media-mapping.json`
   - Print summary

## Todo List
- [ ] Create import-guide-photos.ts
- [ ] Test with --dry-run to verify file scanning and slug derivation
- [ ] Run photo upload
- [ ] Verify photos appear in CMS admin media library
- [ ] Confirm mapping JSON has all 7 guides

## Success Criteria
- All 7 photos uploaded to Payload media
- `data/guide-photo-media-mapping.json` maps 7 guide slugs to media IDs
- Photos accessible in CMS admin panel
- No duplicate uploads on re-run (idempotent)
- Special characters in filenames handled correctly

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Filename encoding issues (UTF-8 on Windows) | Medium | High | Test with `fs.readdirSync`, log actual filenames; Windows Node.js handles UTF-8 filenames |
| Slug mismatch between Phase 1 and Phase 2 | Medium | High | Extract shared slug function or verify both produce identical output for all 7 names |
| Large photo file sizes | Low | Low | Photos are standard portrait shots; Payload handles resize if configured |

## Security Considerations
- No sensitive data in photos
- Media uploaded to Vercel Blob via Payload (same as tour photos)

## Next Steps
- Output mapping feeds into Phase 3 (`import-guide-data.ts`)
- Slugs must align with Phase 1 output
