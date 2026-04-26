# Phase 2: Claude-Authored Translations (SV → EN/DE)

## Context Links
- Input: `data/guides-v2-sv.json` (Phase 1 output)
- Output: `data/translated-guides-v2.json`
- Review output: `data/translations-review/guide-v2-{slug}.md`
- Target shape: see `data/translated-guides.json` (v1) for field parity
- Tone reference: `data/translations-review/*.md` (v1 review markdowns)

## Overview
- **Priority:** P1 (blocks Phase 4)
- **Status:** Pending
- **Effort:** 1h
- **Executor:** **Claude (in-session)** — NOT an API script

**This phase is executed by the assistant directly.** Claude reads the SV JSON, authors English and German translations into a new JSON file via the Write tool, and produces per-guide review markdown. No Anthropic SDK call, no `translate-*-v2.ts` script.

## Key Insights
- 11 guides × 6 translatable SV fields × 2 target locales = 132 translation spans. Roughly 30 KB of text total — fits comfortably in a single in-context pass.
- Tone: tourism professional, warm, specific. Keep Swedish proper nouns (Gamla stan, Södermalm, Djurgården, SoFo, Mälaren). Do not "over-translate" place names.
- The pull-quote keeps its voice — translate as direct speech, keep quote punctuation in target locale convention (`"…"` in EN, `„…"` in DE).
- Specializations are short phrases / titles — translate phrase-by-phrase, preserve em-dashes and separators.

## Requirements

### Functional (what Claude produces)
For each of the 11 guides, write into `data/translated-guides-v2.json`:

```json
{
  "slug": "sabine-gruen",
  "name": "Sabine Grün",
  "sv": { /* verbatim from Phase 1 */ },
  "en": {
    "bio": "…",
    "specializations": ["…", …],
    "guideStyle": "…",
    "whatGuestsAppreciate": "…",
    "uniqueAspectsQuote": "…",
    "uniqueAspectsBody": "…"
  },
  "de": { /* same keys as en */ },
  "passThroughLanguages": [ /* from Phase 1 */ ],
  "passThroughAdditionalLanguages": [ /* from Phase 1 */ ]
}
```

For each guide, also write `data/translations-review/guide-v2-{slug}.md` with three columns (SV | EN | DE) for every field, so the PO can spot-check.

### Non-Functional
- Zero API calls. All translation produced by Claude generating tokens and writing to disk.
- Order of guides in output matches Phase 1 (sorted by slug) for diff-friendliness.
- Review markdown has H2 per field, fenced triple-column table or stacked quote blocks.

## Translation Guidelines

**English**
- Register: professional travel marketing, personal voice retained.
- Keep Swedish proper nouns untranslated; italicize on first use if natural (`*Gamla stan*`).
- Convert Swedish-specific concepts with a brief gloss only when opaque (e.g., `fika` can stay as-is; `allemansrätten` → "`allemansrätten` (right of public access)").
- Use em-dashes consistently, Title Case only for proper nouns.

**German**
- Register: warm, professional, Sie-form for guest address (`Sie`, not `du`).
- Preserve Swedish proper nouns; do not Germanize (`Gamla Stan`, not `Alt-Stadt`).
- Convert currency/measurement as needed (none expected in guide bios).
- Quotes: German `„…"` convention.
- Compound nouns OK; avoid excessive Anglicisms.

## Implementation Steps (Claude in-session)

1. Read `data/guides-v2-sv.json` into working memory.
2. For each guide (sorted by slug), author `en` and `de` blocks mirroring the `sv` shape.
3. Assemble the full translated JSON array; write to `data/translated-guides-v2.json` in a single `Write` call.
4. For each guide, write `data/translations-review/guide-v2-{slug}.md` containing:
   - H1 = Guide name
   - H2 = `Bio` / `Specializations` / `Guide Style` / `What Guests Appreciate` / `Unique Aspects (Quote)` / `Unique Aspects (Body)` — each followed by SV / EN / DE stacked blockquotes
5. Print a brief summary listing the 11 slugs and total character counts per locale.

## Todo List
- [ ] Confirm `data/guides-v2-sv.json` exists and has 11 entries
- [ ] Author EN + DE for all 11 guides (Claude in-session)
- [ ] Write `data/translated-guides-v2.json`
- [ ] Write 11 review markdowns
- [ ] User spot-check 2–3 guides (Sabine, Tommy, Åsa)

## Success Criteria
- `data/translated-guides-v2.json` parses as valid JSON array of 11 entries
- Every entry has complete `sv`, `en`, `de` blocks with identical keys
- Specializations arrays same length across locales per guide
- Review markdowns exist for all 11 guides
- No Anthropic API call made (no `anthropic` import, no network call)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Translation drift from v1 voice | Medium | Medium | Skim existing `translations-review/guide-{slug}.md` for tone before authoring |
| Inconsistent specialization count across locales | Low | High | Author as arrays of equal length; validate in Phase 4 before import |
| Over-translating proper nouns | Medium | Low | Explicit guideline above; review pass corrects |
| JSON validity (quotes, special chars) | Low | High | Single Write call with full JSON; sanity-parse after write (`node -e "JSON.parse(fs.readFileSync(...))"` or Python `json.load`) |

## Next Steps
- Phase 4 consumes `data/translated-guides-v2.json`
- Review markdowns are PO-reviewable artifacts, optional pre-import gate
