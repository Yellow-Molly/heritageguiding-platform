# Phase 1: Diff & Extract Changes

## Context Links
- [translate-tour-data.ts](../../scripts/translate-tour-data.ts) — v1 xlsx parser (reuse COL mapping, parsers)
- [Tour-data.xlsx](../../docx/Tour-data.xlsx) — v1 source
- [Tour-data-v2.xlsx](../../docx/Tour-data-v2.xlsx) — v2 source
- [translated-tours.json](../../data/translated-tours.json) — v1 translated output (reference)

## Overview
- **Priority:** P1
- **Status:** Pending
- **Effort:** 1.5h
- **Description:** Create script that reads both xlsx files, compares cell-by-cell, extracts only changed fields per tour, and outputs a delta JSON.

## Key Insights

1. **127 total cell changes, 118 content changes, 9 format-only** across 10 tours
2. **V2 uses bullet format** (`• item\n• item`) instead of semicolons — parser must handle both
3. **All 10 tours have same slugs** — no new tours, no removed tours
4. **Normalize before comparing** to detect format-only vs content changes: strip bullets/quotes/semicolons, collapse whitespace, lowercase
5. **Fields that need translation** when changed: title, shortDescription, description, highlights, durationText, meetingPointName, meetingInstructions, endingPoint, parkingInfo, publicTransportInfo, included, notIncluded, whatToBring, mobilityNotes
6. **Pass-through fields** when changed: basePrice, targetAudience, featured, categorySlugs, neighborhoodSlugs, meetingPointAddress

## Requirements

### Functional
- Read both `docx/Tour-data.xlsx` (v1) and `docx/Tour-data-v2.xlsx` (v2)
- Compare each cell using the COL mapping from `translate-tour-data.ts`
- Normalize text before comparing (strip bullets, quotes, semicolons, whitespace) to detect format-only changes
- For content changes: extract v2 value as the new Swedish text
- For format-only changes on translatable fields: still extract v2 (new format) — needs re-translation since bullet format differs from semicolon format
- For pass-through field changes: extract v2 value directly
- Output `data/tour-v2-diff.json` with structure:

```json
[
  {
    "slug": "private-rib-tour-stockholm-3h",
    "changedTranslatable": {
      "title": "RIB-tur i Stockholm – Skärgård och stad från vattnet",
      "shortDescription": "En privat RIB-tur...",
      "highlights": ["Gamla Stan och Kungliga Slottet...", "..."]
    },
    "changedPassThrough": {
      "featured": true
    },
    "changeCount": 13,
    "formatOnlyCount": 0
  }
]
```

### Non-Functional
- `--dry-run` flag: show diff summary without writing output
- Reuse COL mapping and parsers from `translate-tour-data.ts`
- Log per-tour: which fields changed, content vs format-only

## Architecture

### Parser Updates
The v2 xlsx uses `• item\n• item` format for list fields. Update `parseSemicolonList` (or create new parser) to handle:
- Semicolon-separated: `item1; item2; item3`
- Bullet-separated: `• item1\n• item2\n• item3`
- Comma-separated: `item1, item2, item3`

```typescript
function parseList(raw: string): string[] {
  // Handle bullet format (• item\n• item)
  if (raw.includes('•')) {
    return raw.split('•').map(s => s.trim()).filter(Boolean)
  }
  // Original semicolon/newline format
  return raw.split(/[;\n]+/).map(s => s.replace(/["\r]/g, '').trim()).filter(Boolean)
}
```

### Normalization for Comparison
```typescript
function normalize(s: string): string {
  return s
    .replace(/[•""]/g, '')
    .replace(/;/g, ',')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}
```

## Related Code Files

### Files to Create
- `scripts/diff-tour-data-v2.ts` — diff script

### Files to Read (context)
- `scripts/translate-tour-data.ts` — COL mapping, parsers

### Output Files
- `data/tour-v2-diff.json` — delta output

## Implementation Steps

1. Create `scripts/diff-tour-data-v2.ts` scaffold
   - Import ExcelJS, fs, path
   - Reuse COL mapping from translate-tour-data.ts (import or copy)
   - Parse CLI args: `--dry-run`

2. Implement dual xlsx reading
   - Load both workbooks
   - Validate same row count, same slugs

3. Implement comparison logic
   - For each row (tour), for each column:
     - Get v1 and v2 cell values
     - If identical: skip
     - Normalize both and compare:
       - If normalized values match: mark as format-only change
       - If different: mark as content change
   - Classify changed column as translatable or pass-through

4. Build delta output
   - Group changes by tour slug
   - Separate translatable vs pass-through changes
   - Parse list fields with updated parser (handle bullets)
   - Write `data/tour-v2-diff.json`

5. Implement dry-run logging
   - Per-tour: field name, change type, v1 preview, v2 preview

## Decision: Format-Only Changes

Even format-only changes (semicolons → bullets) need re-translation because:
- The v1 translations used semicolon-joined text as input
- V2's bullet format produces cleaner individual items
- Re-translating ensures EN/DE match the new SV format

**Exception:** Categories/neighborhoods slug separators are just parsing differences — no translation needed.

## Todo List

- [ ] Create `scripts/diff-tour-data-v2.ts`
- [ ] Implement updated list parser (bullets + semicolons + commas)
- [ ] Implement normalize function for comparison
- [ ] Implement cell-by-cell diff logic
- [ ] Implement delta JSON output
- [ ] Implement `--dry-run` mode
- [ ] Test with `--dry-run` and verify 127 changes detected
- [ ] Run and generate `data/tour-v2-diff.json`

## Success Criteria

- Script detects all 127 cell changes
- Correctly classifies ~118 content + ~9 format-only
- Delta JSON contains only changed fields per tour
- Translatable and pass-through fields correctly separated
- List fields parsed correctly from bullet format
