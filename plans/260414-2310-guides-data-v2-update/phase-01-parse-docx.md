# Phase 1: Parse v2 DOCX → Structured SV JSON

## Context Links
- Source: `docx/Guides data v2/*.docx` (11 files)
- Python venv: `~/.claude/skills/.venv/Scripts/python.exe` (python-docx installed, verified working)
- v1 schema reference: `data/translated-guides.json`
- Slug derivation reference: `scripts/translate-guide-data.ts:63-74` (`toSlug()`)

## Overview
- **Priority:** P1 (blocks Phase 2)
- **Status:** Pending
- **Effort:** 1h

Extract Swedish text from 11 guide docx files into a single structured JSON. No translation yet. Python does the parse; output is a plain data file consumed by Phase 2.

## Key Insights
- All 11 files share the same section structure (verified on 3 samples):
  1. Header line: `GUIDE PROFILE – PRIVATE TOURS`
  2. Name line (may include `[alternativ stavning Gruen]` for Sabine)
  3. Location & languages line: `Stockholm  •  Svenska, Engelska, …`
  4. `Om {Name}` → bio paragraphs
  5. `Specialisering` → list (each bullet = one paragraph)
  6. `Guidestil` → single paragraph
  7. `Vad gästerna uppskattar` → single paragraph
  8. `Det som gör {Name}s turer unika` → quote + body paragraph(s)
  9. Footer: `Private Tours • Auktoriserad guide • Utkast för godkännande`
- python-docx preserves paragraph order; use heading text matching to split sections.
- The "quote" in section 8 is wrapped in Swedish guillemets `„ "` or `« »` — strip them.

## Requirements

### Functional
- Iterate all `.docx` in `docx/Guides data v2/`
- For each file, extract: `name`, `languagesRaw`, `bio` (string, paragraphs joined by `\n\n`), `specializations` (string[]), `guideStyle` (string), `whatGuestsAppreciate` (string), `uniqueAspectsQuote` (string), `uniqueAspectsBody` (string)
- Derive `slug` via same rule as v1: lowercase first + last token, diacritic transliteration (`å,ä→a`, `ö,ø→o`, `ü→u`, `é,è→e`, non-alnum → `-`)
- Strip `[alternativ stavning …]` bracket content from Sabine's name before slug derivation; keep as `nameAltSpelling` field
- Parse languages line into `passThroughLanguages` (main enum `sv/en/de/fr/es/it`) and `passThroughAdditionalLanguages` (everything else)
- Output single JSON: `data/guides-v2-sv.json` (array of 11 entries, sorted by slug)

### Non-Functional
- Single-file Python script under 200 lines
- Kebab-case filename: `scripts/parse-guides-v2-docx.py`
- Assertion failures print the offending filename + line — no silent skips

## Architecture

### Output Shape (per guide)
```json
{
  "slug": "sabine-gruen",
  "name": "Sabine Grün",
  "nameAltSpelling": "Gruen",
  "languagesRaw": "Tyska, Engelska, Svenska",
  "passThroughLanguages": ["de", "en", "sv"],
  "passThroughAdditionalLanguages": [],
  "sv": {
    "bio": "Sabine Grün är en auktoriserad guide…\n\nHennes övergripande mål…",
    "specializations": ["I tyskarnas fotspår – …", "Starka kvinnor …", …],
    "guideStyle": "Personlig, modern och anpassningsbar …",
    "whatGuestsAppreciate": "Gästerna lyfter fram Sabines förmåga …",
    "uniqueAspectsQuote": "Med en öppen blick och en stockholmares hjärta …",
    "uniqueAspectsBody": "Som tysk med hjärtat i Stockholm erbjuder hon …"
  }
}
```

### Language Map (identical to v1)
```python
LANGUAGE_MAP = {
    "svenska": "sv", "swedish": "sv",
    "engelska": "en", "english": "en",
    "tyska": "de", "german": "de",
    "franska": "fr", "french": "fr",
    "spanska": "es", "spanish": "es",
    "italienska": "it", "italian": "it",
}
ADDITIONAL_LANGUAGE_MAP = {
    "japanska": "ja", "norska": "no", "danska": "da", "finska": "fi",
    "holländska": "nl", "polska": "pl", "ryska": "ru",
}
```

## Related Code Files

### Files to Create
- `scripts/parse-guides-v2-docx.py` — main parser

### Files to Read (patterns)
- `scripts/translate-guide-data.ts` — slug derivation rule, language map (port to Python)
- `data/translated-guides.json` — target shape reference

## Implementation Steps

1. Create `scripts/parse-guides-v2-docx.py` with imports (`docx`, `json`, `os`, `re`, `pathlib`).
2. Constants: `DOCX_DIR`, `OUT_PATH`, section headers (`SECTION_HEADERS` set), language maps.
3. `def to_slug(name: str) -> str` — port from TS.
4. `def extract_alt_spelling(raw_name: str) -> tuple[str, str | None]` — regex strip `[alternativ stavning X]`.
5. `def parse_languages(raw: str) -> tuple[list[str], list[str]]` — split on `,`, lowercase, map; anything unmapped logged as warning.
6. `def parse_guide_file(path: Path) -> dict` —
   - Read doc, filter non-empty paragraph texts.
   - Validate first paragraph starts with `GUIDE PROFILE`.
   - Identify section boundaries by scanning for known header labels (`Om `, `Specialisering`, `Guidestil`, `Vad gästerna uppskattar`, `Det som gör`).
   - Collect paragraphs between headers; join with `\n\n`.
   - For the "Unique aspects" section: first paragraph after header that contains guillemets is the quote (strip quotes); remainder is body.
7. `def main()` —
   - Glob `*.docx` in `DOCX_DIR`, sort by filename.
   - Parse each, collect into list; assert exactly 11 entries.
   - Sort by slug, dump to `data/guides-v2-sv.json` with `ensure_ascii=False, indent=2`.
   - Print summary: count, slugs, warnings.

## Todo List
- [ ] Create `scripts/parse-guides-v2-docx.py`
- [ ] Run script; inspect output JSON shape
- [ ] Spot-check 3 guides (Sabine, Tommy, Åsa) for section accuracy
- [ ] Commit JSON output to `data/`

## Success Criteria
- `data/guides-v2-sv.json` contains exactly 11 entries
- Every entry has non-empty: slug, name, sv.bio, sv.specializations (≥3), sv.guideStyle, sv.whatGuestsAppreciate, sv.uniqueAspectsQuote, sv.uniqueAspectsBody
- Slugs: `anders-boysen`, `annika-bernholm`, `asa-ovrelid`, `christian-arnet`, `mattias-wallin`, `niklas-lofstrom`, `olof-naslund`, `sabine-gruen`, `sophie-sahlin`, `svante-bergqvist`, `tommy-nilsson`
- Zero unmapped languages

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Section header spelling drift (e.g., `Guidningsstil` vs `Guidestil`) | Medium | High | Use `startswith()` match with tolerant list; log all unmatched paragraphs for review |
| Quote delimiter variants (`„…"`, `«…»`, `"…"`) | Medium | Low | Strip a broad set of quote chars; if body empty, fall back to the whole unique-aspects content as body |
| Sabine alt-spelling causes slug divergence from v1 (`sabine-gruen`) | Low | Medium | Explicit alt-spelling extraction; slug derives from cleaned name |

## Next Steps
- Output feeds Phase 2 (Claude writes en/de blocks)
- Parallel with Phase 3 (photos)
