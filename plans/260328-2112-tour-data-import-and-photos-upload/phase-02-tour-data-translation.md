# Phase 2: Tour Data Translation SV -> EN/DE

## Context Links
- [xlsx source](../../docx/Tour-data.xlsx) -- 10 tours, 46 columns, Swedish-only
- [CSV column mapping](../../packages/cms/lib/csv/tour-csv-column-mapping.ts) -- existing column definitions, localized field patterns
- [Excel import service](../../packages/cms/lib/excel/tour-excel-import-service.ts) -- existing ExcelJS parsing logic
- [Markdown to Lexical converter](../../packages/cms/lib/csv/tour-csv-markdown-to-lexical-converter.ts) -- used in Phase 3

## Overview
- **Priority:** P1 (blocks Phase 3)
- **Status:** Pending
- **Effort:** 2.5h
- **Description:** Parse xlsx with ExcelJS, extract Swedish text, translate to EN/DE via Claude API, output structured JSON with all 10 tours in 3 locales.

## Key Insights

1. **xlsx has 46 columns, Swedish-only** -- existing import pipeline expects `_sv/_en/_de` suffixed columns. We need a new column mapping layer that reads raw Swedish columns and produces the tri-locale structure.
2. **Not all columns need translation** -- numeric, boolean, slug, coordinate, URL fields stay as-is. Only ~16 text fields need SV->EN/DE translation.
3. **Semicolon-separated arrays** -- highlights, included, notIncluded, whatToBring use `;` separator. Split before translation, translate items individually for accuracy.
4. **Swedish place names preserved** -- Gamla Stan, Stortorget, Djurgarden, Sigtuna etc. must NOT be translated. Provide glossary in system prompt.
5. **Cost estimate:** ~10 tours x ~500 words avg x 2 languages = ~$10-15 Claude API cost.
6. **Column positions (1-indexed from task context):**
   - Col 1: slug, Col 2: title, Col 3: shortDescription, Col 4: fullDescription
   - Col 5: highlights (`;` sep), Col 6-10: pricing, Col 11: durationText
   - Col 12-19: logistics, Col 20-22: inclusions (`;` sep)
   - Col 23-32: audience/accessibility, Col 33-35: relationships
   - Col 36-40: image URLs (ignored), Col 41-46: meta

## Requirements

### Functional
- Parse all 10 tours from xlsx using ExcelJS
- Map 46 columns to internal field names using positional mapping
- Translate ~16 text fields from SV to EN and DE
- Preserve Swedish place names, proper nouns, brand names
- Handle semicolon-separated arrays: split, translate each item, rejoin
- Output: `data/translated-tours.json` with all tours in `{ slug, fields: { sv, en, de } }` structure
- Output: `data/translations-review/` with one markdown file per tour for human review

### Non-Functional
- Batch translation: 1 API call per tour (all fields in one prompt) to minimize cost
- Retry on API failure with exponential backoff
- `--dry-run` flag: parse xlsx and output structure without calling API
- `--review-only` flag: generate review markdown from existing JSON without re-translating

## Architecture

### Data Flow
```
Tour-data.xlsx
    |
    v
ExcelJS.load() --> worksheet.eachRow()
    |
    v
positionalColumnMapping(row) --> { slug, title_sv, shortDescription_sv, ... }
    |
    v
For each tour: Claude API call
  System: tourism glossary, place name preservation rules
  User: JSON of Swedish fields
  Response: { en: {...}, de: {...} }
    |
    v
Merge: { slug, sv: originalFields, en: translatedEN, de: translatedDE }
    |
    v
Write data/translated-tours.json
Write data/translations-review/{slug}.md
```

### Column Mapping (positional, 0-indexed)

```typescript
const XLSX_COLUMNS = {
  slug: 0,                          // A
  title: 1,                         // B -- translate
  shortDescription: 2,              // C -- translate
  description: 3,                   // D -- translate (multi-paragraph)
  highlights: 4,                    // E -- translate (semicolon-separated)
  basePrice: 5,                     // F
  currency: 6,                      // G
  priceType: 7,                     // H
  groupDiscount: 8,                 // I
  childPrice: 9,                    // J
  durationText: 10,                 // K -- translate
  meetingPointName: 11,             // L -- translate
  meetingPointAddress: 12,          // M -- translate
  coordinates: 13,                  // N
  googleMapsLink: 14,              // O
  meetingInstructions: 15,          // P -- translate
  endingPoint: 16,                 // Q -- translate
  parkingInfo: 17,                 // R -- translate
  publicTransportInfo: 18,         // S -- translate
  included: 19,                    // T -- translate (semicolon-separated)
  notIncluded: 20,                 // U -- translate (semicolon-separated)
  whatToBring: 21,                 // V -- translate (semicolon-separated)
  targetAudience: 22,              // W
  difficultyLevel: 23,             // X
  minimumAge: 24,                  // Y
  childFriendly: 25,               // Z
  teenFriendly: 26,                // AA
  wheelchairAccessible: 27,        // AB
  mobilityNotes: 28,               // AC -- translate
  hearingAssistance: 29,           // AD
  visualAssistance: 30,            // AE
  serviceAnimalsAllowed: 31,       // AF
  guideSlug: 32,                   // AG
  categorySlugs: 33,               // AH
  neighborhoodSlugs: 34,           // AI
  imageUrl1: 35,                   // AJ (ignored)
  imageUrl2: 36,                   // AK (ignored)
  imageUrl3: 37,                   // AL (ignored)
  imageUrl4: 38,                   // AM (ignored)
  imageUrl5: 39,                   // AN (ignored)
  bokunExperienceId: 40,           // AO
  availability: 41,                // AP
  maxGroupSize: 42,                // AQ
  minGroupSize: 43,                // AR
  featured: 44,                    // AS
  status: 45,                      // AT
}
```

### Fields to Translate (16 fields)
`title`, `shortDescription`, `description`, `highlights`, `durationText`, `meetingPointName`, `meetingPointAddress`, `meetingInstructions`, `endingPoint`, `parkingInfo`, `publicTransportInfo`, `included`, `notIncluded`, `whatToBring`, `mobilityNotes`

**Note:** `meetingPointAddress` may contain street names that should be kept in Swedish (addresses don't translate).

### Claude API Prompt Structure

```
System: You are a professional tourism translator. Translate Swedish tour content to {targetLang}.

Rules:
- Keep Swedish place names as-is: Gamla Stan, Stortorget, Djurgarden, Kungstradgarden, Sigtuna, Uppsala, etc.
- Keep Swedish street names and addresses as-is
- Keep brand names as-is: Vasa Museum (not "Vasamuseet" in EN)
- Use professional tourism register
- For highlights/inclusions arrays: translate each item, return as JSON array
- For multi-paragraph descriptions: preserve paragraph structure

Input (Swedish): {JSON of all text fields}
Output: {JSON of translated fields, same keys}
```

## Related Code Files

### Files to Create
- `scripts/translate-tour-data.ts` -- main translation script

### Files to Read (context only)
- `packages/cms/lib/csv/tour-csv-column-mapping.ts` -- field name reference
- `packages/cms/lib/excel/tour-excel-import-service.ts` -- ExcelJS patterns

### Output Files
- `data/translated-tours.json` -- structured tour data in 3 locales
- `data/translations-review/{slug}.md` -- one file per tour for human review

## Implementation Steps

1. **Create script scaffold** (`scripts/translate-tour-data.ts`)
   - Import: ExcelJS, Anthropic SDK, fs, path
   - Parse CLI args: `--dry-run`, `--review-only`, `--tours=slug1,slug2` (filter)

2. **Parse xlsx**
   - Load workbook from `docx/Tour-data.xlsx`
   - Read first worksheet, skip header row
   - For each data row: extract values by column position using `XLSX_COLUMNS` mapping
   - Handle semicolon-separated fields: split into arrays
   - Handle boolean fields: normalize "Yes"/"Ja"/"true" -> true
   - Handle numeric fields: parse to number
   - Handle empty/null fields gracefully

3. **Separate translatable vs. pass-through fields**
   - Translatable: 16 text fields listed above
   - Pass-through: slug, pricing, coordinates, URLs, booleans, numbers, relationship slugs

4. **Translate via Claude API**
   - For each tour, make 2 API calls (SV->EN, SV->DE) OR 1 call with both target languages
   - **Decision:** 1 call per tour, both languages at once, to reduce API overhead
   - Send all translatable fields as JSON, request JSON response with `en` and `de` keys
   - Use `claude-sonnet-4-20250514` for cost efficiency
   - Retry up to 3 times on failure with 2s/4s/8s backoff

5. **Assemble translated tour data**
   - Merge: `{ slug, sv: parsedSwedish, en: translatedEN, de: translatedDE, passThrough: {...} }`
   - Validate: ensure all required fields present in all 3 locales

6. **Generate review files**
   - For each tour: write `data/translations-review/{slug}.md` with side-by-side SV/EN/DE comparison
   - Format: field name, then SV | EN | DE values

7. **Write output JSON**
   - Write `data/translated-tours.json` with full structure

## Todo List

- [ ] Create `scripts/translate-tour-data.ts`
- [ ] Implement xlsx parsing with positional column mapping
- [ ] Implement semicolon-separated array splitting
- [ ] Implement boolean/number normalization
- [ ] Implement Claude API translation (both languages per call)
- [ ] Implement retry logic with exponential backoff
- [ ] Implement review markdown generation
- [ ] Implement `--dry-run` mode (parse only, no API)
- [ ] Implement `--review-only` mode (from existing JSON)
- [ ] Write `data/translated-tours.json`
- [ ] Test with `--dry-run`, verify column mapping correctness
- [ ] Run translation, review output markdown
- [ ] Manual review of translation quality

## Success Criteria

- All 10 tours parsed from xlsx with correct field mapping
- All 16 translatable fields translated to both EN and DE
- Swedish place names preserved in translations
- Semicolon-separated fields correctly split/translated/structured
- `data/translated-tours.json` is valid JSON, consumable by Phase 3
- Review markdown files generated for each tour
- Total API cost under $20

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Column position mismatch | Medium | High | `--dry-run` first, verify mapping against xlsx headers |
| Translation hallucination | Low | Medium | Review markdown output, tourism glossary in prompt |
| API rate limiting | Low | Low | 10 tours = 10 calls, well under rate limits |
| Rich text formatting lost | Medium | Medium | Description is plain text in xlsx; paragraphs separated by newlines, converted to Lexical in Phase 3 |
| Place name incorrectly translated | Medium | Medium | Explicit glossary in system prompt, review step |

## Security Considerations

- `ANTHROPIC_API_KEY` loaded from env, never hardcoded or logged
- Tour content is not sensitive (public tourism data)
- No PII in tour descriptions

## Next Steps

- Manual review of `data/translations-review/` markdown files before proceeding to Phase 3
- Phase 3 reads `data/translated-tours.json` and creates tour entries
