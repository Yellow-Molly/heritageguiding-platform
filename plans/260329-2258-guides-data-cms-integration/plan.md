---
title: "Guide Data Import: Excel to CMS with Translations"
description: "Replace placeholder guides with real data from Guides.xlsx, including photos, translations (SV/EN/DE), and tour reassignment"
status: implemented
priority: P1
effort: 5h
branch: master
tags: [data-import, guides, translations, cms]
created: 2026-03-29
---

# Guide Data Import Plan

## Context
9 placeholder guides exist in CMS (generic slugs, no bios/photos). Real data for 7 guides lives in `docx/Guides.xlsx` + `docx/Guide-photos/`. Tours reference placeholder guide slugs that must be remapped to real guides.

## Data Flow
```
Guides.xlsx --> translate-guide-data.ts --> data/translated-guides.json
Guide-photos/ --> import-guide-photos.ts --> data/guide-photo-media-mapping.json
Both JSONs --> import-guide-data.ts --> Payload CMS (7 guides, 3 locales each)
CMS state --> verify-guide-import.ts --> console report
```

## Phases

| # | Phase | File | Status | Est |
|---|-------|------|--------|-----|
| 1 | [Translate guide data](phase-01-translate-guide-data.md) | `scripts/translate-guide-data.ts` | Done | 2h |
| 2 | [Import guide photos](phase-02-import-guide-photos.md) | `scripts/import-guide-photos.ts` | Done | 1h |
| 3 | [Import guide data to CMS](phase-03-import-guide-data.md) | `scripts/import-guide-data.ts` | Done | 1.5h |
| 4 | [Verify and test](phase-04-verify-and-test.md) | `scripts/verify-guide-import.ts` | Done | 0.5h |

## Dependencies
- Phase 1 + 2 can run in parallel (no shared state)
- Phase 3 depends on both Phase 1 and Phase 2 outputs
- Phase 4 depends on Phase 3

## Key Decisions
- **Guide-to-tour mapping**: Manual config in import script (specialization-based)
- **Placeholder cleanup**: Delete old placeholders after creating real guides, then update tour references
- **Slug format**: `{firstname}-{lastname}` lowercase (e.g., `sabine-gruen`)

## Rollback
- Re-run `create-placeholder-guides.ts` to restore placeholders
- Re-run `import-tour-data.ts --update` to reassign tours to placeholder guides

## Validation Summary

**Validated:** 2026-03-29
**Questions asked:** 4

### Confirmed Decisions
- **Guide-to-tour mapping**: Infer from specializations (auto-match guide specialization keywords to tour content)
- **Specializations field**: Map to CMS categories (create manual mapping from specialization text → existing category slugs, enables filtering)
- **Operating areas**: Map to existing CMS cities collection entries
- **Slug format**: Simplified diacritics (ö→o, ü→u, ä→a, å→a) — e.g., `/guides/sabine-grun`, `/guides/niklas-lofstrom`

### Action Items
- [ ] Phase 1: Add specialization-to-category mapping logic (match guide specialization text to CMS category slugs)
- [ ] Phase 1: Add auto-inference for guide-to-tour mapping based on specialization keywords vs tour titles
- [ ] Phase 1: Update slug derivation to use simplified diacritics (not German-style expansion)
- [ ] Phase 2: Match slug derivation to Phase 1 (simplified diacritics)
- [ ] Phase 3: Resolve operating area strings to CMS city IDs (map detailed locations to parent city entries)
- [ ] Phase 3: Import specializations as category relationships (not just credentials)
