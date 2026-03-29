# Planner Report: Tour Data Import & Photos Upload

**Date:** 2026-03-28
**Status:** DONE

## Summary

Created 5-phase implementation plan for importing 10 Swedish tours from xlsx, translating to EN/DE, uploading 77 photos to Vercel Blob, and linking everything in Payload CMS.

## Plan Structure

| Phase | Description | Effort | Depends On |
|-------|-------------|--------|------------|
| 1 | Photo Upload & Media Creation | 2h | Prerequisites |
| 2 | Tour Data Translation SV->EN/DE | 2.5h | Prerequisites |
| 3 | Tour Data Import to Database | 2h | Phase 1+2 |
| 4 | SEO Metadata & Alt Text | 0.5h | Phase 3 |
| 5 | Verification & Testing | 1h | Phase 4 |

**Total effort:** 8h | **Phases 1+2 can run in parallel** (reduces wall-clock to ~5.5h)

## Key Architectural Decisions

1. **New scripts, not modifying existing pipeline** -- existing `tour-excel-import-service.ts` expects `_sv/_en/_de` suffixed columns. xlsx has Swedish-only. Creating standalone scripts is cleaner than retrofitting.
2. **Payload Local API for all operations** -- no REST API or direct DB. Ensures hooks, validation, and Blob storage plugin all fire correctly.
3. **Medium photos only** -- 0.5-1.4MB, well under Blob limits. Payload generates thumbnail/card/hero sizes automatically.
4. **Claude API for translation** -- 1 call per tour (both EN+DE), ~$10-15 total. Tourism glossary in system prompt preserves Swedish place names.
5. **SEO integrated into Phase 3** -- not a separate script. MetaTitle/metaDescription derived from tour title/shortDescription during creation.
6. **Intermediate JSON files** -- `photo-media-mapping.json` and `translated-tours.json` decouple phases, enable re-runs and debugging.

## Prerequisites (must verify before starting)

- Guides, categories, neighborhoods must exist in DB (referenced by slug)
- `BLOB_READ_WRITE_TOKEN` env var set
- `ANTHROPIC_API_KEY` env var set

## Scripts to Create

- `scripts/import-tour-photos.ts` -- Phase 1
- `scripts/translate-tour-data.ts` -- Phase 2
- `scripts/import-tour-data.ts` -- Phase 3+4

## Artifacts Created

```
plans/260328-2112-tour-data-import-and-photos-upload/
  plan.md
  phase-01-photo-upload-and-media-creation.md
  phase-02-tour-data-translation.md
  phase-03-tour-data-import-to-database.md
  phase-04-seo-metadata-and-alt-text.md
  phase-05-verification-and-testing.md
  reports/planner-260328-2119-tour-data-import-plan.md
```

## Unresolved Questions

1. **Column positions in xlsx** -- mapping is based on task context (46 columns, 1-indexed). Must verify with `--dry-run` against actual xlsx headers. If headers exist in row 1, use header names instead of positions.
2. **Which guide/category/neighborhood slugs are referenced?** -- need to verify these exist in DB before starting. If missing, they must be created first.
3. **Alt text strategy for SV/DE** -- current plan sets SV=EN=filename-derived text. Acceptable for photo subjects (proper nouns), but may want proper Swedish/German alt text for accessibility compliance.
4. **Uppsala tour Hero typo** -- filename is "Uppsala Domkyrka Hero Mediuem.jpg" (misspelled "Medium"). Script must handle fuzzy matching for "Medi*m" pattern.
