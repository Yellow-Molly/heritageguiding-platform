# Phase 2: Translate Changed Fields

## Context Links
- [translate-tour-data.ts](../../scripts/translate-tour-data.ts) — v1 translation script (reuse translation logic)
- [tour-v2-diff.json](../../data/tour-v2-diff.json) — Phase 1 output (delta)
- [translated-tours.json](../../data/translated-tours.json) — v1 translations (merge base)

## Overview
- **Priority:** P1
- **Status:** Pending
- **Effort:** 1h
- **Depends on:** Phase 1
- **Description:** Translate only changed Swedish fields to EN/DE, merge with existing v1 translations to produce complete updated translated-tours-v2.json.

## Key Insights

1. **Delta translation**: Only ~12-14 fields per tour actually changed content. Full re-translate would process ~15 fields × 10 tours = 150 translations. Delta approach: ~120 field-translations (still substantial but some tours have fewer changes).
2. **Merge with v1**: For unchanged fields, keep existing v1 EN/DE translations. Only overwrite where SV content actually changed.
3. **All translatable fields changed for most tours**: titles, descriptions, highlights, included/notIncluded/whatToBring changed across all 10. So savings are modest but the merge approach still protects manually-reviewed translations.
4. **Context for translation**: Include tour title + slug for context even when only translating a subset of fields.

## Requirements

### Functional
- Read `data/tour-v2-diff.json` (Phase 1 output)
- Read `data/translated-tours.json` (v1 baseline)
- For each tour's `changedTranslatable` fields: send to Claude API for SV→EN/DE translation
- Merge: start from v1 translated data, overwrite only changed fields with new translations
- Update pass-through fields from `changedPassThrough`
- Output `data/translated-tours-v2.json` with same structure as v1

### Non-Functional
- `--dry-run`: show what would be translated without API calls
- `--tours=slug1,slug2`: filter to specific tours
- Reuse translation prompt and retry logic from `translate-tour-data.ts`
- Generate review markdown files in `data/translations-review-v2/`

## Architecture

### Merge Strategy

```
v1 translated-tours.json (baseline)
  + tour-v2-diff.json (changed SV fields)
  + Claude API (changed fields → EN/DE)
  = translated-tours-v2.json (complete, updated)
```

For each tour:
1. Start with v1 entry (sv, en, de, passThrough)
2. For each field in `changedTranslatable`:
   - Update `sv[field]` with new v2 value
   - Get new `en[field]` and `de[field]` from translation
3. For each field in `changedPassThrough`:
   - Update `passThrough[field]` with new v2 value

### Translation Prompt Adaptation

Reuse v1 system prompt but add context note:

```
You are updating translations for an existing tour. The following Swedish fields 
have been revised. Translate each to English and German, maintaining consistency 
with the tour's theme and existing translations.

Tour: {slug} - {title}
```

## Related Code Files

### Files to Create
- `scripts/translate-tour-data-v2.ts` — delta translation script

### Files to Read (context)
- `scripts/translate-tour-data.ts` — translation logic to reuse

### Input Files
- `data/tour-v2-diff.json` (Phase 1)
- `data/translated-tours.json` (v1 baseline)

### Output Files
- `data/translated-tours-v2.json` — complete updated translations
- `data/translations-review-v2/*.md` — review files for changed fields

## Implementation Steps

1. Create `scripts/translate-tour-data-v2.ts`
   - Import translation utils from v1 script (or duplicate relevant functions)
   - Parse CLI args: `--dry-run`, `--tours=`

2. Load input data
   - Read v1 `translated-tours.json` as baseline
   - Read Phase 1 `tour-v2-diff.json` as delta
   - Build lookup: v1 by slug

3. For each tour in diff:
   - Get v1 entry from baseline
   - Extract `changedTranslatable` fields
   - If no translatable changes: skip translation API call
   - Call Claude API to translate changed fields SV→EN/DE
   - Merge: update sv/en/de with new values
   - Update pass-through fields from `changedPassThrough`

4. Write outputs
   - `data/translated-tours-v2.json` — complete merged result
   - `data/translations-review-v2/{slug}.md` — side-by-side review (only changed fields)

## Todo List

- [ ] Create `scripts/translate-tour-data-v2.ts`
- [ ] Implement v1 baseline loading and merge logic
- [ ] Implement delta translation (changed fields only)
- [ ] Implement review markdown generation (changed fields only)
- [ ] Test with `--dry-run`
- [ ] Run translations and verify `data/translated-tours-v2.json`
- [ ] Review generated translation files for quality

## Success Criteria

- All 10 tours have complete sv/en/de translations in output
- Changed fields have new translations; unchanged fields preserve v1 translations
- Pass-through fields updated (featured, basePrice, etc.)
- Review markdown shows only changed fields for efficient manual review
- Output JSON structure identical to v1 (compatible with import-tour-data.ts)
