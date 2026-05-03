# Phase 3: Upload Converted Photos to CMS + Update Mapping

## Context Links
- Source dir: `docx/Guide-photos-web/` (Phase 1 output)
- Mapping JSON: `data/guide-photo-media-mapping.json`
- Existing photo upload: `scripts/import-guide-photos.ts`
- Payload Media collection: `packages/cms/collections/Media.ts`

## Overview
- **Priority:** P1
- **Status:** Pending
- **Effort:** 0.5h
- **Depends on:** Phase 1

Upload 10 web-optimized photos to Payload Media. Update `data/guide-photo-media-mapping.json` so Phase 4 import resolves correct media IDs.

## Key Insights
- 3 NEW uploads (Anette, Leo, Mats) → fresh media IDs.
- 3 placeholder REPLACEMENTS (Asa, Svante, Tommy) → currently all share id 86 (placeholder); they need distinct real media IDs.
- 4 REFRESHES (Jack 87, Sophie 84, Anders 78, Annika 79) → upload new file; replace mapping value with new media ID. Old media records remain in DB (no auto-cleanup).
- `_placeholder` mapping entry stays at 86 for any future onboarding gaps.
- Existing `import-guide-photos.ts` uploads everything in `docx/Guide-photos/`; for v3 we want a **scoped uploader** that takes a list and writes incremental mapping updates.

## Requirements

### Functional

**New script: `scripts/upload-v3-guide-photos.ts`**
- Read source dir `docx/Guide-photos-web/`.
- Allowlist of slug→filename pairs (10 entries).
- For each pair:
  1. Open file, post to Payload Local API `payload.create({ collection: 'media', data: { alt: '<Guide Name>' }, file: { ... } })`.
  2. Capture returned `id`.
  3. Update mapping JSON in-place (preserve existing keys, replace mapped slugs).
- Write back `data/guide-photo-media-mapping.json` (sorted keys, 2-space indent, trailing newline).
- Print per-upload `slug → mediaId (oldId)` log.
- Dry-run mode: print plan only, no DB writes.

### Non-Functional
- Idempotent: re-running with same files creates new media records each time (Payload doesn't dedupe). Re-runs intentional only after validation failure.
- Script ≤ 150 lines.

## Architecture

### Upload Mapping
```ts
const UPLOAD_TARGETS: Array<{ slug: string; file: string; alt: string }> = [
  { slug: 'anette-gustafsson', file: 'anette-gustafsson.jpg', alt: 'Anette Gustafsson' },
  { slug: 'leo-eriksson',      file: 'leo-eriksson.jpg',      alt: 'Leo Eriksson' },
  { slug: 'mats-quist',        file: 'mats-quist.jpg',        alt: 'Mats Quist' },
  { slug: 'asa-ovrelid',       file: 'asa-ovrelid.jpg',       alt: 'Åsa Övrelid' },
  { slug: 'svante-bergqvist',  file: 'svante-bergqvist.jpg',  alt: 'Svante Bergqvist' },
  { slug: 'tommy-nilsson',     file: 'tommy-nilsson.jpg',     alt: 'Tommy Nilsson' },
  { slug: 'jack-voldstad',     file: 'jack-voldstad.jpg',     alt: 'Jack Voldstad' },
  { slug: 'sophie-sahlin',     file: 'sophie-sahlin.jpg',     alt: 'Sophie Sahlin' },
  { slug: 'anders-boysen',     file: 'anders-boysen.jpg',     alt: 'Anders Boysen' },
  { slug: 'annika-bernholm',   file: 'annika-bernholm.jpg',   alt: 'Annika Bernholm' },
]
```

### Output Mapping (post-upload, expected shape)
```json
{
  "anders-boysen": <new>,
  "anette-gustafsson": <new>,
  "annika-bernholm": <new>,
  "asa-ovrelid": <new>,
  "christian-arnet": 80,
  "jack-voldstad": <new>,
  "leo-eriksson": <new>,
  "mats-quist": <new>,
  "mattias-wallin": 85,
  "niklas-lofstrom": 81,
  "olof-naslund": 82,
  "sabine-gruen": 83,
  "sophie-sahlin": <new>,
  "svante-bergqvist": <new>,
  "tommy-nilsson": <new>,
  "_placeholder": 86
}
```

## Related Code Files

### To Create
- `scripts/upload-v3-guide-photos.ts`

### To Read for Context
- `scripts/import-guide-photos.ts` (Payload Local API upload pattern)
- `scripts/payload-bootstrap.ts` (init payload runtime)
- `data/guide-photo-media-mapping.json` (current mapping)

### To Modify
- `data/guide-photo-media-mapping.json` (script writes back)

## Implementation Steps

1. Read `scripts/import-guide-photos.ts` for upload pattern.
2. Create `scripts/upload-v3-guide-photos.ts` with allowlist + dry-run flag.
3. Dry-run: `npx tsx --require ./scripts/patch-next-env.cjs scripts/upload-v3-guide-photos.ts --dry-run`. Verify 10 targets resolve.
4. Live run: drop `--dry-run`. Capture log of `slug → newId (oldId)`.
5. Diff `data/guide-photo-media-mapping.json` (git diff) — verify only intended slugs changed.
6. Optional: log orphan media IDs (old values for the 4 refreshes + 86 dereferences) into report for future cleanup.

## Todo List

- [ ] Read `import-guide-photos.ts` for Payload upload pattern
- [ ] Write `scripts/upload-v3-guide-photos.ts`
- [ ] Run `--dry-run`; verify 10 targets resolve to existing files
- [ ] Live run; capture upload log
- [ ] Verify `guide-photo-media-mapping.json` diff matches expected slugs
- [ ] Log orphan media IDs in report

## Success Criteria

- 10 new media records exist in Payload (`/admin/collections/media`).
- `guide-photo-media-mapping.json` updated; 10 slugs point to new IDs; 5 unchanged (christian, mattias, niklas, olof, sabine + `_placeholder`).
- No errors during upload.

## Risk Assessment

- **Payload local API auth**: confirm bootstrap script handles non-interactive run (v2 import already proves this).
- **Disk path issues with spaces in original filenames**: phase 1 normalizes to kebab-case, so `docx/Guide-photos-web/` filenames are space-free.
- **Orphan media accumulating**: not a blocker; cleanup is a separate maintenance ticket.

## Security Considerations

- EXIF already stripped in Phase 1.
- Alt text uses guide names only — no PII beyond what's already in CMS.

## Next Steps

- Phase 4 reads updated mapping JSON and runs guide import.
