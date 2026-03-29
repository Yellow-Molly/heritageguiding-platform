---
title: "Tour Data Import & Photos Upload"
description: "Import 10 Swedish tours from xlsx, translate to EN/DE, upload 77 photos to Vercel Blob, link in Payload CMS"
status: complete
priority: P1
effort: 9.5h
branch: master
tags: [tour-data, import, photos, translation, seo]
created: 2026-03-28
---

# Tour Data Import & Photos Upload

## Overview

End-to-end data pipeline: xlsx (10 tours, Swedish-only) + 77 Medium JPEGs --> translated, image-linked tour entries in Payload CMS across 3 locales (sv/en/de).

## Data Flow

```
xlsx (46 cols, SV) --> Phase 2: Translate SV->EN/DE --> JSON (3 locales)
Photos (77 Medium) --> Phase 1: Upload Blob + Create Media --> mediaId mapping
                                                                    |
Phase 3: Merge translated JSON + media mapping --> Payload tours (Local API)
Phase 4: SEO metadata generation + alt text optimization
Phase 5: Verification across all locales + visual QA
```

## Prerequisites

- [ ] Guides exist in DB (user provides data separately — placeholder created if missing)
- [x] Categories created in Phase 0 (auto-created from xlsx slugs)
- [x] Neighborhoods created in Phase 0 (auto-created from xlsx slugs)
- [ ] `BLOB_READ_WRITE_TOKEN` env var set
- [ ] `ANTHROPIC_API_KEY` env var set (for translation)

## Phases

| # | Phase | File | Status | Effort | Depends On |
|---|-------|------|--------|--------|------------|
| 0 | Prerequisites: Categories, Neighborhoods, Guides | [phase-00](phase-00-prerequisites-categories-neighborhoods.md) | **Complete** | 1h | — |
| 1 | Photo Upload & Media Creation | [phase-01](phase-01-photo-upload-and-media-creation.md) | **Complete** | 2.5h | Phase 0 |
| 2 | Tour Data Translation SV->EN/DE | [phase-02](phase-02-tour-data-translation.md) | **Complete** | 2.5h | Phase 0 |
| 3 | Tour Data Import to Database | [phase-03](phase-03-tour-data-import-to-database.md) | **Complete** | 2h | Phase 1, 2 |
| 4 | SEO Metadata & Alt Text | [phase-04](phase-04-seo-metadata-and-alt-text.md) | **Complete** (merged into Phase 3) | 0.5h | Phase 3 |
| 5 | Verification & Testing | [phase-05](phase-05-verification-and-testing.md) | **Complete** | 1h | Phase 4 |

**Phases 1 and 2 can run in parallel (both depend only on Phase 0).**

## Key Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Translation quality | Medium | Medium | Tourism glossary in prompt, manual review step |
| Blob upload failures | Low | Low | Retry logic, batch processing, idempotent uploads |
| Relationship slugs missing | Medium | High | Pre-check script validates all referenced slugs exist |
| Duplicate tours on re-run | Low | Medium | Slug-based upsert (check-then-create/update) |

## Rollback

- Delete created tour entries by slug via Payload Local API
- Delete media entries + Vercel Blob files via `del()` SDK
- All scripts support `--dry-run` flag for safe testing

## Output Artifacts

- `scripts/create-tour-prerequisites.ts` -- categories + neighborhoods creation
- `scripts/import-tour-photos.ts` -- photo upload (Large JPEGs) + media creation
- `scripts/translate-tour-data.ts` -- xlsx parse + AI translation
- `scripts/import-tour-data.ts` -- tour creation with media linking
- `data/photo-media-mapping.json` -- tourSlug->mediaId[] mapping
- `data/translated-tours.json` -- all 10 tours in sv/en/de

## Validation Summary

**Validated:** 2026-03-28
**Questions asked:** 7

### Confirmed Decisions
- **Prerequisites:** Categories and neighborhoods auto-created from xlsx slugs. Guide data provided separately by user.
- **Photo size:** Upload Large JPEGs (5-23MB) for best quality. Payload generates all responsive sizes.
- **Tour status:** Import as `draft`. Review in Payload CMS admin before publishing.
- **Translation review:** AI translate + auto-import. Review translations in Payload CMS admin.
- **Alt text:** Translate alt text to SV/DE via Claude API for WCAG compliance.
- **Categories/neighborhoods:** Auto-create from xlsx slugs with names derived from slug. Localize via translation.
- **Guides:** User provides guide data separately. Script creates minimal placeholder if guide slug missing.

### Action Items
- [ ] Add Phase 0: create categories + neighborhoods from xlsx slugs
- [ ] Update Phase 1: use Large photos instead of Medium
- [ ] Update Phase 1: translate alt text to SV/DE (batch with Phase 2 translation)
- [ ] Update Phase 3: default status to `draft` instead of `published`
- [ ] Update effort: add 1h for Phase 0 (total ~9h, ~6.5h wall-clock)
