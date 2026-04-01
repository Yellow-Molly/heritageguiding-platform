# Phase 1: Translate Guide Data (SV -> EN/DE)

## Context Links
- Source data: `docx/Guides.xlsx`
- Pattern reference: `scripts/translate-tour-data.ts`
- CMS collection: `packages/cms/collections/guides.ts`
- Lexical converter: `packages/cms/lib/csv/tour-csv-markdown-to-lexical-converter.ts`

## Overview
- **Priority:** P1 (blocks Phase 3)
- **Status:** Pending
- **Effort:** 2h

Read `Guides.xlsx` with ExcelJS, extract Swedish bios/certifications/specializations, translate to EN/DE via Claude API, output structured JSON + review markdown files.

## Key Insights
- Excel has 7 guides with: Email, Name, Bio (SV), Certifications, Telephone, Languages, Specializations, Operating Areas, Additional Languages
- Bio field is substantial text needing quality tourism-register translation
- Certifications and specializations are semicolon-separated lists
- Languages field maps to `languages` select (sv/en/de/fr/es/it) + `additionalLanguages` select
- Guide-to-tour mapping is NOT in the Excel; must be configured manually in script

## Requirements

### Functional
- Parse all 7 guide rows from xlsx
- Translate bio, certifications, specializations to EN and DE
- Generate slug from name: `firstname-lastname` (handle special chars: Gruen not Gruen, Lofstrom not Lofstrom — use ASCII transliteration)
- Map languages from free text to schema enum values
- Include manual guide-slug-to-tour-slug mapping as config constant
- Output `data/translated-guides.json`
- Output `data/translations-review/guide-{slug}.md` per guide

### Non-Functional
- Reuse `withRetry` pattern from translate-tour-data.ts
- Support `--dry-run` and `--guides=slug1,slug2` flags
- Script under 200 lines; extract helpers if needed

## Architecture

### Data Flow
```
Guides.xlsx (ExcelJS)
  |
  v
Parse rows -> { slug, name, email, phone, sv: { bio, certifications, specializations }, languages, operatingAreas }
  |
  v
Claude API (translate sv.bio, sv.certifications, sv.specializations -> en + de)
  |
  v
Merge: { slug, name, email, phone, sv, en, de, passThrough: { languages, operatingAreas, additionalLanguages } }
  |
  v
Write data/translated-guides.json + data/translations-review/guide-{slug}.md
```

### Guide-to-Tour Mapping Config
```typescript
// Manual mapping based on guide specializations vs tour content
const GUIDE_TO_TOURS: Record<string, string[]> = {
  'sabine-gruen': ['private-medieval-stockholm-walking-tour'],
  'sophie-sahlin': ['gamla-stan-vasa-museum-tour'],
  'anders-boysen': ['private-rib-tour'],
  'niklas-lofstrom': ['stockholm-islands-overview-bus-tour'],
  'christian-arnet': ['private-sigtuna-heritage-tour', 'private-uppsala-day-tour'],
  'olof-naslund': ['gamla-stan-city-hall-tour', 'stockholm-everyday-life-tour'],
  'annika-bernholm': ['slow-travel-malaren', 'slow-travel-archipelago'],
}
```
> **NOTE:** This mapping is a starting suggestion. Must be reviewed by product owner before import. The implementer should cross-reference guide specializations from Excel with tour content to propose the best mapping.

### Language Mapping
```typescript
const LANGUAGE_MAP: Record<string, string> = {
  'svenska': 'sv', 'swedish': 'sv',
  'engelska': 'en', 'english': 'en',
  'tyska': 'de', 'german': 'de',
  'franska': 'fr', 'french': 'fr',
  'spanska': 'es', 'spanish': 'es',
  'italienska': 'it', 'italian': 'it',
}
// Languages not in main `languages` select go to `additionalLanguages`
const ADDITIONAL_LANGUAGE_MAP: Record<string, string> = {
  'japanska': 'ja', 'japanese': 'ja',
  'norska': 'no', 'norwegian': 'no',
  'danska': 'da', 'danish': 'da',
  'finska': 'fi', 'finnish': 'fi',
  'holländska': 'nl', 'dutch': 'nl',
  'polska': 'pl', 'polish': 'pl',
  'ryska': 'ru', 'russian': 'ru',
}
```

## Related Code Files

### Files to Create
- `scripts/translate-guide-data.ts` — main translation script

### Files to Read (patterns)
- `scripts/translate-tour-data.ts` — ExcelJS parsing, Claude API call, retry, review markdown generation
- `scripts/payload-bootstrap.ts` — reuse for Payload init (not needed in this phase, but same project setup)

## Implementation Steps

1. Create `scripts/translate-guide-data.ts` with file header, imports (ExcelJS, Anthropic, fs, path)
2. Define CLI flags: `--dry-run`, `--guides=slug1,slug2`
3. Define column positions (COL object) matching Guides.xlsx headers — **verify exact column positions by reading xlsx header row first**
4. Define `GUIDE_TO_TOURS` mapping constant
5. Define `LANGUAGE_MAP` and `ADDITIONAL_LANGUAGE_MAP` constants
6. Implement `parseGuideRow(row)`:
   - Extract name, email, phone, bio, certifications, languages, specializations, operating areas
   - Generate slug via ASCII transliteration of name
   - Parse semicolon-separated lists for certifications, specializations, languages
   - Map language strings to enum values, split into `languages` vs `additionalLanguages`
7. Implement `translateGuide(client, svFields)`:
   - System prompt: tourism professional translator, keep Swedish proper nouns
   - Translate: bio, certifications array, specializations array
   - Return `{ en, de }` with same field structure
8. Implement `generateReviewMarkdown()` following tour pattern
9. `main()` function:
   - Read xlsx, parse rows, filter if `--guides` flag
   - Dry run: print parsed data and exit
   - Validate `ANTHROPIC_API_KEY`
   - Loop: translate each guide with `withRetry`
   - Write `data/translated-guides.json`
   - Write review files to `data/translations-review/guide-{slug}.md`

## Todo List
- [ ] Verify exact column positions in Guides.xlsx header row
- [ ] Create translate-guide-data.ts
- [ ] Test with --dry-run to verify xlsx parsing
- [ ] Run full translation
- [ ] Review generated markdown files for translation quality
- [ ] Confirm guide-to-tour mapping with product owner

## Success Criteria
- `data/translated-guides.json` contains 7 guides with sv/en/de fields
- Review markdown files exist for all 7 guides
- Bio translations read naturally in tourism register
- All certifications and specializations translated
- Language enums correctly mapped
- Script completes without errors

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Incorrect column positions in xlsx | Medium | High | Dry-run validates parsing; log first row headers |
| Poor bio translation quality | Low | Medium | Review markdown files; re-run individual guides with `--guides` flag |
| Claude API rate limits | Low | Low | `withRetry` with exponential backoff (existing pattern) |
| Special chars in names break slugs | Medium | Medium | ASCII transliteration (umlaut handling: ue, oe, ae, o for ö, etc.) |

## Security Considerations
- `ANTHROPIC_API_KEY` from env var, never hardcoded
- Email/phone data passes through to JSON but is not exposed publicly by frontend

## Next Steps
- Output feeds into Phase 3 (`import-guide-data.ts`)
- Review files should be checked before running Phase 3
