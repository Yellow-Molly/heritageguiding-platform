# Phase 3: Photos — Extend Map + Placeholder for New Guides

## Context Links
- Existing script: `scripts/import-guide-photos.ts` (v1 uploader + mapping)
- Existing photos: `docx/Guide-photos/` — 8 files (7 v1 guides + `Mattias Wallin 2.jpeg`)
- Existing output: `data/guide-photo-media-mapping.json`
- Placeholder destination: `docx/Guide-photos/_placeholder-silhouette.jpg` (to be generated/supplied)

## Overview
- **Priority:** P1
- **Status:** Pending
- **Effort:** 0.5h
- **Depends on:** — (can run parallel to Phase 1/2)

## Key Insights
- `scripts/import-guide-photos.ts` already handles 7 guides via `PHOTO_TO_GUIDE_SLUG` map with careful Windows NTFS codepoint handling for `ö/ä/ü` mojibake.
- `Mattias Wallin 2.jpeg` already exists in `docx/Guide-photos/` but is not mapped (space in filename stem, "2" suffix).
- Åsa Övrelid, Svante Bergqvist, Tommy Nilsson have no photo files. User approved a **single shared placeholder silhouette**.
- Placeholder upload should produce one media ID; that ID gets written into the mapping for all 3 slugs.

## Requirements

### Functional
- Extend `PHOTO_TO_GUIDE_SLUG` to include:
  - `"Mattias Wallin 2"` → `"mattias-wallin"` (stem has a space)
- Detect and upload `docx/Guide-photos/_placeholder-silhouette.jpg` if present.
  - If absent, fail with a clear message telling the operator how to generate one (e.g., via `ai-artist` skill with a neutral grayscale prompt).
- After upload, write `placeholder.mediaId` into `data/guide-photo-media-mapping.json` under a reserved key `_placeholder`, and ALSO map `asa-ovrelid`, `svante-bergqvist`, `tommy-nilsson` → placeholder media ID.
- Preserve existing behaviour: re-running with `--dry-run` should print the plan without uploading.

### Non-Functional
- In-place edit to the existing script (per CLAUDE.md: "update existing files directly, do not create enhanced copies").
- Stem glob must tolerate spaces (`Mattias Wallin 2`) — adjust the file iteration regex if needed.

## Architecture

### Updated Mapping
```typescript
const PHOTO_TO_GUIDE_SLUG: Record<string, string> = {
  'Anders_Boysen': 'anders-boysen',
  'Annika_Bernholm': 'annika-bernholm',
  'Christian_Arnet': 'christian-arnet',
  'Niklas_Lo\u2560\u00EAfstrom': 'niklas-lofstrom',
  'Olof_Na\u2560\u00EAslund': 'olof-naslund',
  'Sabine_Gru\u2560\u00EAn': 'sabine-gruen',
  'Sophie_Sahlin': 'sophie-sahlin',
  'Mattias Wallin 2': 'mattias-wallin',           // NEW
  '_placeholder-silhouette': '_placeholder',      // NEW (reserved key)
}

const PLACEHOLDER_GUIDES = ['asa-ovrelid', 'svante-bergqvist', 'tommy-nilsson']
```

### Output JSON Shape (extended)
```json
{
  "anders-boysen": 42,
  "annika-bernholm": 43,
  "christian-arnet": 44,
  "mattias-wallin": 49,
  "niklas-lofstrom": 45,
  "olof-naslund": 46,
  "sabine-gruen": 47,
  "sophie-sahlin": 48,
  "asa-ovrelid": 50,
  "svante-bergqvist": 50,
  "tommy-nilsson": 50,
  "_placeholder": 50
}
```

## Related Code Files

### Files to Edit (in place)
- `scripts/import-guide-photos.ts` — extend map, handle placeholder, add `PLACEHOLDER_GUIDES` fan-out.

### Files to Create (via user or one-off)
- `docx/Guide-photos/_placeholder-silhouette.jpg` — **sourced from Unsplash** (validated 2026-04-14). Neutral professional portrait (grayscale or soft-focus silhouette), ≥ 512×512. Search terms: "silhouette portrait", "professional silhouette grayscale". Licence: Unsplash free.

## Implementation Steps
1. Open `scripts/import-guide-photos.ts`.
2. Add `'Mattias Wallin 2'` and `'_placeholder-silhouette'` entries to `PHOTO_TO_GUIDE_SLUG`.
3. Add constant `PLACEHOLDER_GUIDES = ['asa-ovrelid', 'svante-bergqvist', 'tommy-nilsson']`.
4. In `scanPhotos()`, ensure the file-matching regex/glob accepts spaces in stems (current filter is `/\.(jpg|jpeg|png)$/i` on extensions only — should already pass).
5. After the upload loop populates `mapping`, if `mapping._placeholder` exists, copy its media ID to each slug in `PLACEHOLDER_GUIDES`.
6. Update alt text: use `'Guide portrait (placeholder)'` when stem is `_placeholder-silhouette`.
7. If `_placeholder-silhouette.jpg` file missing, emit a warning block and continue with the available 8 uploads (new guides then get `photo: null` in Phase 4).
8. Dry-run, then live run.

## Todo List
- [ ] Generate/supply `docx/Guide-photos/_placeholder-silhouette.jpg`
- [ ] Edit `scripts/import-guide-photos.ts` (map, constant, fan-out logic, alt text)
- [ ] Dry-run: `npx tsx --require ./scripts/patch-next-env.cjs scripts/import-guide-photos.ts --dry-run`
- [ ] Live run: same command without `--dry-run`
- [ ] Verify `data/guide-photo-media-mapping.json` has 11 guide-slug keys + `_placeholder`

## Success Criteria
- Mapping JSON contains entries for all 11 guide slugs
- `mattias-wallin` maps to the real photo media ID (not placeholder)
- `asa-ovrelid`, `svante-bergqvist`, `tommy-nilsson` all map to the same `_placeholder` media ID
- Script completes with 0 errors on live run
- Alt text for placeholder uploads is human-readable

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Placeholder image missing at runtime | High | Medium | Script prints clear instructions + continues with `photo: null` fallback; Phase 5 verify flags it |
| Existing v1 media IDs change on re-upload | Medium | Low | Script already skips re-upload if filename already exists in CMS media (per v1 behaviour — verify) |
| Space in `Mattias Wallin 2.jpeg` stem breaks NTFS-safe lookup | Low | Low | Literal string key in map, no normalisation needed |

## Next Steps
- Phase 4 reads the extended mapping JSON
