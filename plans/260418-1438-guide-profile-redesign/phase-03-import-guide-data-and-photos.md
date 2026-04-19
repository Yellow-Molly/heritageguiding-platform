# Phase 3: Import Guide Data & Photos

## Context Links
- Import script: `scripts/import-guide-data.ts` (546 lines)
- v2 helpers: `scripts/lib/guide-v2-helpers.ts`
- Photo mapping: `data/guide-photo-media-mapping.json`
- Photo import script: `scripts/import-guide-photos.ts`
- Guide photos dir: `docx/Guide-photos/`
- Phase 1 output: `data/translated-guides-v2.json` (12 entries)
- Phase 2 output: new CMS fields (guideStyle, whatGuestsAppreciate, etc.)

## Overview
- **Priority:** P1 (blocks Phase 4)
- **Status:** Pending
- **Effort:** 2h
- **Blocked by:** Phase 1 + Phase 2

Update the v2 import path in `import-guide-data.ts` to populate new CMS fields separately (instead of merging into bio). Import Jack Voldstad's photo. Rewrite `bio` to contain ONLY the main biographical paragraphs.

## Key Insights
- Current `runV2Import()` calls `buildV2BioMarkdown()` which merges ALL sections into one richText bio. After this phase, bio = main bio only; structured sections go to dedicated fields.
- `buildV2BioMarkdown()` in `scripts/lib/guide-v2-helpers.ts` will no longer be needed for import. Keep it for backward compat but add a new function that returns fields separately.
- Jack Voldstad has a photo: `docx/Guide-photos/Jack_Voldstad.jpg`. Must be imported to media collection and added to `data/guide-photo-media-mapping.json`.
- Svante Bergqvist and Tommy Nilsson still use placeholder (ID 86). No new photos for them.
- `import-guide-data.ts` is 546 lines — already over 200 LOC. The v2 import path (`runV2Import`) is ~160 lines. Consider extracting to `scripts/lib/guide-v2-import.ts`.

## Requirements

### Functional
1. Import Jack Voldstad photo to CMS media, update `guide-photo-media-mapping.json`
2. Modify `runV2Import()` to populate new CMS fields per locale:
   - `guideStyle` — plain text from v2 data
   - `whatGuestsAppreciate` — plain text
   - `uniqueAspectsQuote` — plain text
   - `uniqueAspectsBody` — plain text
   - `specialtyDescriptions` — array of `{ description: text }` from v2 `specializations[]`
3. Rewrite `bio` field to contain ONLY `data.bio` (not merged markdown)
4. Handle Jack Voldstad as new guide (CREATE path, not UPDATE)
5. Run import with `--update` for existing 11 guides, auto-create for new guide

### Non-Functional
- Idempotent: running import twice produces same result
- Existing guide metadata (email, phone, operatingAreas, yearsExperience) preserved for existing guides
- 3-locale update: SV first, then EN/DE with correct field mapping

## Architecture

### Data Flow
```
data/translated-guides-v2.json (12 entries)
    ↓
scripts/import-guide-data.ts (runV2Import)
    ↓  For each guide:
    ├── bio = markdownToLexical(guide[locale].bio)           ← ONLY main bio
    ├── guideStyle = guide[locale].guideStyle                ← plain text
    ├── whatGuestsAppreciate = guide[locale].whatGuestsAppreciate
    ├── uniqueAspectsQuote = guide[locale].uniqueAspectsQuote
    ├── uniqueAspectsBody = guide[locale].uniqueAspectsBody
    └── specialtyDescriptions = guide[locale].specializations.map(s => ({description: s}))
    ↓
Payload CMS (guides collection, 3 locales per guide)
```

### Import Behavior Matrix

| Guide | Exists? | Photo | Action |
|-------|---------|-------|--------|
| 11 existing guides | Yes | Mapped | UPDATE: rewrite bio + populate new fields |
| Jack Voldstad | No | `Jack_Voldstad.jpg` | CREATE: full record + new photo |

## Related Code Files
- **Modify:** `scripts/import-guide-data.ts` — update `runV2Import()` to populate new fields
- **Modify:** `scripts/lib/guide-v2-helpers.ts` — add `buildV2FieldData()` helper (returns separate fields)
- **Modify:** `data/guide-photo-media-mapping.json` — add `jack-voldstad` entry after photo import
- **Run:** `scripts/import-guide-photos.ts` — import Jack Voldstad photo
- **Run:** `scripts/verify-guide-import.ts` — post-import verification

## Implementation Steps

### Step 1: Import Jack Voldstad Photo
1. Check `scripts/import-guide-photos.ts` for how photos are imported
2. Add Jack Voldstad to the photo import list or run targeted import
3. Note the returned media ID
4. Update `data/guide-photo-media-mapping.json`: add `"jack-voldstad": <mediaId>`

### Step 2: Update v2 Helpers
1. In `scripts/lib/guide-v2-helpers.ts`, add:
   ```ts
   /** Extract structured fields for CMS storage (no merging into bio). */
   export function buildV2FieldData(locale: V2Locale, data: V2LocaleBlock) {
     return {
       guideStyle: data.guideStyle.trim(),
       whatGuestsAppreciate: data.whatGuestsAppreciate.trim(),
       uniqueAspectsQuote: data.uniqueAspectsQuote.trim(),
       uniqueAspectsBody: data.uniqueAspectsBody.trim(),
       specialtyDescriptions: data.specializations.map(s => ({ description: s })),
     }
   }
   ```

### Step 3: Update runV2Import()
1. In `scripts/import-guide-data.ts`, modify the SV data construction in `runV2Import()`:
   - Change: `bio: markdownToLexical(buildV2BioMarkdown('sv', guide.sv))`
   - To: `bio: markdownToLexical(guide.sv.bio.trim())`  ← plain bio only
   - Add: spread `buildV2FieldData('sv', guide.sv)` into svData
2. Same for EN/DE locale updates:
   - Change bio line similarly
   - Add structured fields to locale update data
3. For `specialtyDescriptions` array (non-localized container, localized inner `description`):
   - SV create/update: pass full array
   - EN/DE update: fetch saved array IDs, map descriptions onto existing item IDs (same pattern as credentials)

### Step 4: Run Import
```bash
npx tsx --require ./scripts/patch-next-env.cjs scripts/import-guide-data.ts \
  --input=data/translated-guides-v2.json --update --status=active
```

### Step 5: Verify
```bash
npx tsx --require ./scripts/patch-next-env.cjs scripts/verify-guide-import.ts
```
Also manually check CMS admin for 1-2 guides to confirm:
- bio shows only biographical paragraphs (no section headers)
- guideStyle, whatGuestsAppreciate populated in SV/EN/DE
- uniqueAspectsQuote and uniqueAspectsBody populated
- specialtyDescriptions array has correct items per locale

## Todo

- [ ] Import Jack Voldstad photo to CMS media
- [ ] Update `data/guide-photo-media-mapping.json` with jack-voldstad media ID
- [ ] Add `buildV2FieldData()` to `scripts/lib/guide-v2-helpers.ts`
- [ ] Update `runV2Import()` — bio = plain bio only
- [ ] Update `runV2Import()` — add new field population for SV
- [ ] Update `runV2Import()` — add new field population for EN/DE with array ID preservation
- [ ] Run import with `--update --status=active`
- [ ] Run verify script
- [ ] Spot-check 2-3 guides in CMS admin (bio, guideStyle, quote)
- [ ] Verify Jack Voldstad created with photo + all fields

## Success Criteria
- 12 guides in CMS (11 updated + 1 new)
- All guides have `bio` containing ONLY main biographical text (no section headers like "### Guidestil")
- All guides have `guideStyle`, `whatGuestsAppreciate`, `uniqueAspectsQuote`, `uniqueAspectsBody` populated in SV/EN/DE
- All guides have `specialtyDescriptions` array populated in SV/EN/DE
- Jack Voldstad has assigned photo (not placeholder)
- Verify script passes with 0 errors
- Existing guide metadata (email, phone, operatingAreas, yearsExperience) unchanged

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| specialtyDescriptions array ID sync breaks on EN/DE update | Medium | High | Follow same pattern as credentials: fetch saved IDs after SV create, map onto EN/DE |
| Bio field still contains merged markdown after import | Low | High | Verify by reading 2-3 guides from CMS API; check no `###` headers in bio |
| Jack Voldstad slug mismatch between parser and import | Low | High | Verify `data/translated-guides-v2.json` slug matches photo mapping key |
| import-guide-data.ts exceeds 200 LOC further | High | Low | Extract `runV2Import` to `scripts/lib/guide-v2-import.ts`; keep main file as entry point |

## Security Considerations
- Import runs with admin Payload access (local script, not exposed)
- No PII changes (email/phone preserved from v1)

## Rollback
- Re-run v2 import with original `buildV2BioMarkdown()` to restore merged bio
- Delete Jack Voldstad guide from CMS admin
- Revert photo mapping JSON

## Next Steps
- Phase 4 reads new fields from API to render split layout
