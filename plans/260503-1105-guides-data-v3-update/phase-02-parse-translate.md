# Phase 2: Parse 3 New Docx + Author SV→EN/DE Translations In-Session

## Context Links
- v2 parser: `scripts/parse-guides-v2-docx.py`
- v2 helpers: `scripts/lib/guide-v2-helpers.ts` (TranslatedGuideV2 type)
- v2 SV output: `data/guides-v2-sv.json`
- v2 translated output: `data/translated-guides-v2.json`
- v2 review markdowns: `data/translations-review-v2/`
- New docx: `docx/Guides data v3/{Anette_Gustafsson,Leo_Eriksson,Mats_Quist}_Guideprofil.docx`

## Overview
- **Priority:** P1
- **Status:** Pending
- **Effort:** 1h
- **Depends on:** —

Extract Swedish content from the 3 new v3 docx files into `data/guides-v3-sv.json`, then Claude authors EN+DE translations directly into `data/translated-guides-v3.json` (no Anthropic API call — same approach as v2).

## Key Insights
- v3 docx structure matches v2 exactly (verified via paragraph dump): `Om`, `Specialisering`, `Guidestil`, `Vad gästerna uppskattar`, `Det som gör… unika`.
- Same parser logic applies — point it at `Guides data v3/` and filter to the 3 new slugs.
- Slug rule (matches v1/v2 transliteration): `anette-gustafsson`, `leo-eriksson`, `mats-quist`.
- Languages from header line:
  - Anette: `Stockholm & Göteborg · Svenska, Engelska` → `["sv","en"]`, additional: `[]`
  - Leo: `Stockholm, Uppsala & Sigtuna · Svenska, Engelska, Meänkieli` → `["sv","en"]`, additional: `["meankieli"]` (or fold into a custom string — confirm enum)
  - Mats: `Stockholm · Svenska, Engelska` → `["sv","en"]`, additional: `[]`
- **Meänkieli** is not in current `LANGUAGE_MAP` or `ADDITIONAL_LANGUAGE_MAP` in v2 parser. Decision: add `"meänkieli": "fi-meankieli"` (or a project-specific slug) to `ADDITIONAL_LANGUAGE_MAP`; if Payload `additionalLanguages` enum doesn't include it, surface as a free-text certification line instead. **Confirm Payload enum in Phase 4 dry-run.**

## Requirements

### Functional

**Parser (`scripts/parse-guides-v3-docx.py`):**
- Read only the 3 new docx files (allowlist).
- Reuse `SECTION_PREFIXES` and quote-stripping logic from v2 parser.
- Output `data/guides-v3-sv.json` array, sorted by slug.
- Each entry has shape:
  ```json
  {
    "slug": "anette-gustafsson",
    "name": "Anette Gustafsson",
    "passThroughLanguages": ["sv","en"],
    "passThroughAdditionalLanguages": [],
    "operatingAreasRaw": ["Stockholm","Göteborg"],
    "sv": { "bio": "...", "specializations": [...], "guideStyle": "...", "whatGuestsAppreciate": "...", "uniqueAspectsQuote": "...", "uniqueAspectsBody": "..." }
  }
  ```

**Translation authoring (Claude in-session):**
- Read `data/guides-v3-sv.json`.
- For each guide, write `data/translations-review/guide-v3-{slug}.md` with side-by-side SV / EN / DE for human review.
- Aggregate into `data/translated-guides-v3.json` — same shape as `translated-guides-v2.json`:
  ```json
  {
    "slug": "anette-gustafsson",
    "name": "Anette Gustafsson",
    "passThroughLanguages": ["sv","en"],
    "passThroughAdditionalLanguages": [],
    "sv": {...full block...},
    "en": {...},
    "de": {...}
  }
  ```
- Translation tone: warm, professional, second-person/third-person consistent with v2 outputs.

### Non-Functional
- Translations match v2 voice (read 2 v2 review files for tone calibration before authoring).
- No machine translation hallucinations — if unsure of an idiom, keep close to literal.

## Architecture

### Parser Differences vs v2
- Allowlist of 3 filenames in `parse-guides-v3-docx.py` constant.
- Output path differs: `data/guides-v3-sv.json`.
- Header parsing: handle `Stockholm, Uppsala & Sigtuna` (comma-separated cities + ampersand).
- Meänkieli handling: emit as `additional` if enum allows, else stash in `passThroughAdditionalLanguagesRaw` for Phase 4 to convert to credential line.

### Translation Workflow
1. Author SV→EN for guide 1 in chat → write to review markdown → confirm voice → write JSON entry.
2. Repeat for SV→DE.
3. Repeat for guides 2, 3.
4. Validate: each guide JSON has identical key set across `sv/en/de`.

## Related Code Files

### To Create
- `scripts/parse-guides-v3-docx.py`
- `data/guides-v3-sv.json` (script output)
- `data/translations-review/guide-v3-anette-gustafsson.md`
- `data/translations-review/guide-v3-leo-eriksson.md`
- `data/translations-review/guide-v3-mats-quist.md`
- `data/translated-guides-v3.json`

### To Read for Context
- `scripts/parse-guides-v2-docx.py`
- `scripts/lib/guide-v2-helpers.ts` (type contract)
- `data/translated-guides-v2.json` (shape reference)
- `data/translations-review-v2/guide-v2-mattias-wallin.md` (voice calibration)
- `data/translations-review-v2/guide-v2-svante-bergqvist.md` (voice calibration)

### To Modify
- None for this phase.

## Implementation Steps

1. Copy `parse-guides-v2-docx.py` → `parse-guides-v3-docx.py`; update `DOCX_DIR`, `OUT_PATH`, add filename allowlist, handle Meänkieli.
2. Run parser; verify JSON has 3 entries with all required keys.
3. Read 2 v2 review markdowns for voice calibration.
4. Author EN translation for Anette → review markdown → JSON.
5. Author DE translation for Anette → review markdown → JSON.
6. Repeat for Leo, Mats.
7. Build final `data/translated-guides-v3.json` (consolidate all 3 entries).
8. Self-review: each guide has 6 narrative fields × 3 locales = 18 strings.

## Todo List

- [ ] Create `scripts/parse-guides-v3-docx.py` (allowlist 3 files)
- [ ] Run parser; produce `data/guides-v3-sv.json` (3 entries)
- [ ] Skim 2 v2 review markdowns for tone
- [ ] Author Anette EN + review markdown
- [ ] Author Anette DE + review markdown
- [ ] Author Leo EN + review markdown
- [ ] Author Leo DE + review markdown
- [ ] Author Mats EN + review markdown
- [ ] Author Mats DE + review markdown
- [ ] Consolidate into `data/translated-guides-v3.json`
- [ ] Validate JSON shape (all 3 locales present, all 6 narrative fields per locale)

## Success Criteria

- `data/guides-v3-sv.json` has exactly 3 entries with required SV fields populated.
- `data/translated-guides-v3.json` mirrors `translated-guides-v2.json` shape.
- Each guide has 3 review markdowns with side-by-side comparison.
- No empty strings in any locale block.

## Risk Assessment

- **Meänkieli enum mismatch**: confirm Payload `additionalLanguages` enum in Phase 4 dry-run; if missing, surface as credential string `"Auktoriserad guide på meänkieli"`.
- **Tone drift between guides**: re-read 1 prior translation before each new authoring pass.
- **Pull-quote translation losing voice**: keep punchy; preserve first-person if Swedish source uses it.

## Security Considerations

- None — translation is content-only.

## Next Steps

- Phase 4 consumes `data/translated-guides-v3.json`.
