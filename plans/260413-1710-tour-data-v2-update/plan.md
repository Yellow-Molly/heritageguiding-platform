---
title: "Tour Data V2 Update — Delta Import with Translations"
description: "Compare Tour-data-v2.xlsx with v1, extract changed fields only, translate changes to EN/DE, update existing tours in Payload CMS"
status: complete
priority: P1
effort: 4h
branch: master
tags: [tour-data, update, translation, delta-import]
created: 2026-04-13
---

# Tour Data V2 Update — Delta Import with Translations

## Overview

V2 of the tour xlsx has **127 cell-level changes across all 10 tours** (same slugs, same columns). Changes fall into:

1. **Content rewrites** (118 cells): titles shorter (removed "Privat"), descriptions significantly condensed, highlights reformatted to bullets, new "Not Included" items (museum tickets), expanded included lists, richer target audience descriptions
2. **Format-only** (9 cells): semicolons → commas/bullets, quote cleanup — these need re-parsing but no translation
3. **Featured flag flips**: 6 tours changed featured status

**Approach:** Build a diff-based update script that:
- Compares v1 vs v2 xlsx cell-by-cell
- Extracts only changed translatable fields
- Translates ONLY the changed SV text to EN/DE (saves ~60% API cost vs full re-translate)
- Updates existing tours in Payload CMS via Local API with `--update` flag

## Data Flow

```
Tour-data.xlsx (v1) ──┐
                       ├──> diff-tour-data-v2.ts (compare, extract delta)
Tour-data-v2.xlsx (v2)┘
         |
         v
data/tour-v2-diff.json (per-tour changed fields: sv text)
         |
         v
translate-tour-data-v2.ts (translate ONLY changed fields SV→EN/DE)
         |
         v
data/translated-tours-v2.json (same shape as v1 but only changed fields)
         |
         v
import-tour-data.ts --update (update existing tours, merge changed fields)
```

## Change Summary (from diff analysis)

| Column | # Tours | Type | Needs Translation |
|--------|---------|------|-------------------|
| Title | 10 | Content rewrite | Yes |
| Short Description | 10 | Content rewrite | Yes |
| Full Description | 10 | Significantly condensed | Yes |
| Highlights | 10 | Reformatted + rewritten | Yes |
| Meeting Instructions | 7 | Minor edits | Yes |
| Parking Info | 5 | Minor edits | Yes |
| Public Transport Info | 4 | Minor edits | Yes |
| Included | 8 | Added items + reformat | Yes |
| Not Included | 10 | Added museum tickets + reformat | Yes |
| What to Bring | 10 | Minor edits + reformat | Yes |
| Target Audience | 10 | Richer descriptions | No (pass-through) |
| Mobility Notes | 8 | Minor edits | Yes |
| Featured | 9 | Boolean flip | No (pass-through) |
| Categories slugs | 2 | Separator change only | No (reparse) |
| Neighborhoods slugs | 1 | Trailing semicolon | No (reparse) |
| Base Price | 2 | Whitespace in number | No (reparse) |
| Meeting Point Name | 1 | Content edit | Yes |
| Meeting Point Address | 1 | Content edit | No (addresses stay SV) |

## Phases

| # | Phase | File | Status | Effort | Depends On |
|---|-------|------|--------|--------|------------|
| 1 | Diff & Extract Changes | [phase-01](phase-01-diff-and-extract-changes.md) | ✅ Complete | 1.5h | — |
| 2 | Translate Changed Fields | [phase-02](phase-02-translate-changed-fields.md) | ✅ Complete | 1h | Phase 1 |
| 3 | Update Tours in Database | [phase-03](phase-03-update-tours-in-database.md) | ✅ Complete | 1h | Phase 2 |
| 4 | Verification | [phase-04](phase-04-verification.md) | ✅ Complete | 0.5h | Phase 3 |

## Key Decisions

- **Delta-only translation**: Only translate fields that actually changed content (not format-only). Saves API cost and avoids overwriting manually-reviewed v1 translations where content is unchanged.
- **Reuse existing scripts**: The `import-tour-data.ts` already supports `--update` mode. We adapt the translate script for delta input.
- **V2 bullet format**: v2 uses `• item\n• item` instead of `item; item`. The parseSemicolonList parser needs to handle both formats.
- **Featured flag**: Direct boolean update, no translation needed.

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Translation quality regression on partial context | Medium | Include surrounding context in translation prompt |
| Overwriting good v1 translations for format-only changes | Low | Skip fields where normalized content is identical |
| Missing fields in delta causing null overwrites | Medium | Merge strategy: only update fields present in delta |

## Rollback

- Tour entries have version history in Payload CMS
- `data/translated-tours.json` (v1) preserved as backup reference
- Can re-run v1 import with `--update` to restore

## Validation Summary

**Validated:** 2026-04-13
**Questions asked:** 4

### Confirmed Decisions
- **Approach:** Delta approach (as planned) — keep diff + merge despite most fields changing. User wants surgical updates.
- **V1 translations:** Still raw AI translations — safe to overwrite, but delta approach preserved per user preference.
- **Tour status:** Set to `published` via `--status=published` flag.
- **Target audience:** Keep existing `mapTargetAudience()` enum mapper — it extracts correct values from richer v2 text.

### Action Items
- [x] No plan changes needed — all decisions align with current plan
