# Phase 1: Parse & Translate Guide Data

## Context Links
- Existing parser: `scripts/parse-guides-v2-docx.py` (260 lines)
- Existing v2 translated data: `data/translated-guides-v2.json` (11 guides)
- Existing SV-only parsed data: `data/guides-v2-sv.json`
- Translation approach ref: `plans/260414-2310-guides-data-v2-update/phase-02-translate-in-session.md`
- DOCX source: `docx/Guides data v2/` (12 files)
- Review script: `scripts/build-translation-reviews-v2.py`

## Overview
- **Priority:** P1 (blocks Phase 3)
- **Status:** Pending
- **Effort:** 2h

Parse 12 DOCX guide profiles (including new Jack Voldstad) into structured SV JSON, then translate to EN/DE. Output updated `data/translated-guides-v2.json` with 12 entries.

## Key Insights
- Parser (`parse-guides-v2-docx.py`) currently expects 11 files (line 238: `if len(files) != 11`). Must update to 12.
- Jack Voldstad DOCX filename: `Jack_Voldstad_Guideprofil.docx` — matches naming convention.
- Translation was done in-session by Claude (not API script) in previous plan. Same approach applies.
- Delta approach: compare new SV parse against existing `translated-guides-v2.json`. Only translate changed/new entries.
- Existing 11 guides may have updated DOCX content — diff SV fields to detect changes.

## Requirements

### Functional
1. Parse all 12 DOCX files into `data/guides-v2-sv.json`
2. Delta-compare SV fields against existing `data/translated-guides-v2.json`
3. Translate changed/new SV content to EN/DE (in-session, no API script)
4. Output `data/translated-guides-v2.json` with 12 entries
5. Generate review markdowns in `data/translations-review/guide-v2-{slug}.md`

### Non-Functional
- Preserve existing EN/DE translations for unchanged SV fields
- Swedish proper nouns (Gamla Stan, Djurgården, etc.) must not be translated
- Pull quotes stay in direct speech with locale-appropriate punctuation

## Architecture

### Data Flow
```
12 DOCX files
    ↓  parse-guides-v2-docx.py
data/guides-v2-sv.json (12 entries, SV only)
    ↓  Claude in-session delta translation
data/translated-guides-v2.json (12 entries, SV+EN+DE)
    ↓  build-translation-reviews-v2.py
data/translations-review/guide-v2-*.md (12 review files)
```

### Output Shape (per guide)
```json
{
  "slug": "jack-voldstad",
  "name": "Jack Voldstad",
  "sv": { "bio", "specializations[]", "guideStyle", "whatGuestsAppreciate", "uniqueAspectsQuote", "uniqueAspectsBody" },
  "en": { /* same keys */ },
  "de": { /* same keys */ },
  "passThroughLanguages": ["sv", "en"],
  "passThroughAdditionalLanguages": []
}
```

## Related Code Files
- **Modify:** `scripts/parse-guides-v2-docx.py` line 238 — change `!= 11` to `!= 12`
- **Read:** `data/translated-guides-v2.json` — existing translations to preserve
- **Write:** `data/guides-v2-sv.json` — fresh SV parse output
- **Write:** `data/translated-guides-v2.json` — merged translated output
- **Run:** `scripts/build-translation-reviews-v2.py` — review markdown generation

## Implementation Steps

1. Update `scripts/parse-guides-v2-docx.py` line 238: change expected count from 11 to 12
2. Run parser: `.claude/skills/.venv/Scripts/python.exe scripts/parse-guides-v2-docx.py`
3. Verify output: `data/guides-v2-sv.json` has 12 entries, Jack Voldstad present
4. Delta-compare each guide's SV block against existing `data/translated-guides-v2.json`:
   - If SV unchanged → keep existing EN/DE translations
   - If SV changed → re-translate those fields
   - If new guide (jack-voldstad) → translate all fields
5. Write merged `data/translated-guides-v2.json` (12 entries, sorted by slug)
6. Run review generator: `.claude/skills/.venv/Scripts/python.exe scripts/build-translation-reviews-v2.py`
7. Spot-check Jack Voldstad review markdown for translation quality

## Todo

- [ ] Update parser expected file count (11 → 12)
- [ ] Run DOCX parser for 12 files
- [ ] Verify Jack Voldstad parsed correctly (all 6 sections non-empty)
- [ ] Delta-compare SV fields with existing translations
- [ ] Translate new/changed content to EN/DE
- [ ] Write updated translated-guides-v2.json (12 entries)
- [ ] Generate review markdowns
- [ ] Spot-check Jack Voldstad translations

## Success Criteria
- `data/guides-v2-sv.json` has exactly 12 entries
- `data/translated-guides-v2.json` has exactly 12 entries with SV/EN/DE blocks
- Jack Voldstad entry has non-empty bio, specializations, guideStyle, whatGuestsAppreciate, uniqueAspectsQuote, uniqueAspectsBody in all 3 locales
- Unchanged guides retain their existing EN/DE translations verbatim
- Review markdowns generated for all 12 guides

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Jack Voldstad DOCX has unexpected section format | Medium | High | Run parser on single file first; inspect errors |
| Parser slug generation mismatches CMS expectation | Low | High | Verify slug output matches `to_slug()` logic |
| Existing guides have changed SV content requiring re-translation | Medium | Low | Delta approach handles this; review markdown shows diffs |

## Security Considerations
- No API keys involved (in-session translation)
- No PII exposed (guide bios are public content)

## Next Steps
- Output feeds into Phase 3 (import) alongside Phase 2 (CMS schema)
