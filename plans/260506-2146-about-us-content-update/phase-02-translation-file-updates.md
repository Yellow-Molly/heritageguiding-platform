# Phase 2 — Translation File Updates (EN/SV/DE)

## Context Links

- [plan.md](./plan.md)
- [Phase 1 mapping table](./phase-01-content-prep-and-en-verification.md)
- Files: `apps/web/messages/{en,sv,de}.json`

## Overview

- **Priority:** P2
- **Status:** Pending
- **Description:** Apply the Phase 1 EN copy mapping to `en.json`. Apply Swedish docx Part 1 verbatim to `sv.json` (with light typo fixes flagged in Phase 1). AI-translate the polished EN to German and write to `de.json`. Fix existing mojibake (`�`) characters in SV/DE while we're in there.

## Key Insights

- **Existing SV/DE files contain mojibake.** Sample showed `�` characters where Swedish/German diacritics should be (`ä`, `ö`, `å`, `ü`, `ß`). The encoding pipeline is broken somewhere — likely a past read/write through cp1252. **Action:** rewrite SV and DE locale `about.*` blocks from clean source (docx for SV; AI-generated UTF-8 for DE).
- **Whole-file write risk.** `en.json`, `sv.json`, `de.json` contain many other namespaces (homepage, tours, contact, etc.). DO NOT rewrite the whole file. Use targeted JSON edits limited to the `about.*` block.
- **JSON safety.** Use straight ASCII apostrophes `'` (not `'`/`'`) and en-dash `–` (Unicode `U+2013`) — both render fine in JSON UTF-8. Verify no unescaped backslashes or quotes.
- **DE translation glossary.** Maintain consistency with current German UI:
  - "Private Tours" → "Private Tours" (do NOT translate brand)
  - "guide" (touring) → "Guide" (German loanword) or "Führer" — current de.json uses "Guide"; preserve
  - "curated" → "kuratiert"
  - "verified" → "verifiziert"
  - "authorized" → "autorisiert"
  - "expertise" → "Expertise"
  - "Sweden" → "Schweden"
  - Use formal "Sie" register (matches current de.json)

## Requirements

**Functional:**
- Update `en.json` `about.*` block per Phase 1 mapping
- Update `sv.json` `about.*` block from docx Part 1 (Swedish), fix mojibake
- Update `de.json` `about.*` block via AI translation of new EN content, fix mojibake
- Add Dutch language consistently across all 3 locales' `multilingual.description`
- Remove `about.story.paragraph6` key (component will be updated in Phase 3 to render 5 paragraphs)

**Non-Functional:**
- Preserve all other namespaces in each JSON file untouched
- Maintain JSON validity (`npm run lint` passes JSON parse)

## Architecture

**Approach:** Use targeted `Edit` operations on the `about.*` JSON block. The block is well-bounded (clear opening/closing braces), so a single `old_string` → `new_string` replacement covers each locale.

**Translation method for DE:**
- Use Claude/AI to translate the polished EN content directly
- Cross-reference with existing de.json terms for consistency
- Validate that no `�` characters exist post-write
- Validate JSON parses cleanly via `node -e "JSON.parse(require('fs').readFileSync('apps/web/messages/de.json'))"`

## Related Code Files

**Modify:**
- `apps/web/messages/en.json`
- `apps/web/messages/sv.json`
- `apps/web/messages/de.json`

**No new files. No deletions.**

## Implementation Steps

1. **EN update:**
   - Read current `en.json`
   - Locate `"about": { ... }` block (top-level)
   - Construct new `about.*` JSON object from Phase 1 mapping
   - Apply via `Edit` (one targeted replacement)
   - Verify with `node -e "JSON.parse(require('fs').readFileSync('apps/web/messages/en.json','utf8'))"`

2. **SV update:**
   - Read current `sv.json`
   - Construct new `about.*` block from `docx/About_Us_Svenska.docx` Part 1
     - Apply same key structure as EN
     - Use clean UTF-8 (å, ä, ö, é, etc.)
     - Decision on flagged typos: preserve docx wording (`trivel`, `urvattnas`) UNLESS user instructed otherwise; surface in commit body
   - For Multilingual: "Upplevelser erbjuds på svenska, engelska, tyska, **nederländska**, franska, portugisiska och spanska – alltid av certifierade proffs." (add Dutch — SV docx didn't include it but per validation we add it for consistency)
   - For Responsible Tourism: pull from Swedish Manifest's "Ett ansvar för platser och människor" paragraphs
   - For story.titleLine1/titleLine2: keep current "Skapad för Resenärer" / "Som Värdesätter Djup" (clean diacritics)
   - For certifications.localSub: change to "Över hela Sverige" (was Stockholm-specific)
   - For cta.description: "Upptäck Sverige genom de människor som känner det bäst" (broadened)
   - Apply via `Edit`
   - Verify JSON parses

3. **DE update:**
   - AI-translate the new EN content (Phase 1 mapping) to German, formal "Sie" register
   - Cross-check core terms against existing de.json (preserve "Private Tours" brand, use "Guide" for touring guide, "Schweden" for Sweden, "kuratiert" for curated, etc.)
   - Multilingual: "Erlebnisse werden auf Schwedisch, Englisch, Deutsch, **Niederländisch**, Französisch, Portugiesisch und Spanisch angeboten – immer von zertifizierten Fachleuten."
   - Responsible Tourism: translate from EN (which itself sourced from Manifest), title becomes "Eine Verantwortung für Orte und Menschen"
   - story.titleLine1/titleLine2: keep current "Geschaffen für Reisende" / "Die Tiefe Schätzen" (clean diacritics)
   - certifications.localSub: "In ganz Schweden" (was Stockholm)
   - cta.description: "Entdecken Sie Schweden mit den Menschen, die es am besten kennen" (broadened)
   - Apply via `Edit`
   - Verify JSON parses
   - Grep file for `�` to confirm no mojibake

4. **Cross-locale consistency check:**
   - All 3 locales list 7 languages including Dutch
   - All 3 locales' `responsibleTourism.title` match thematically
   - All 3 locales removed `story.paragraph6`

## Todo

- [ ] Apply Phase 1 mapping to `en.json` (about block only)
- [ ] Verify `en.json` parses
- [ ] Compose Swedish `about.*` block from SV docx Part 1
- [ ] Apply to `sv.json`, verify parses, no mojibake
- [ ] AI-translate polished EN to DE with glossary consistency
- [ ] Apply to `de.json`, verify parses, no mojibake
- [ ] Confirm Dutch added to all 3 locales' multilingual description
- [ ] Confirm `about.story.paragraph6` removed in all 3 locales

## Success Criteria

- [ ] All 3 JSON files parse without errors
- [ ] No `�` characters in updated about block (`grep -c "\\ufffd" apps/web/messages/{en,sv,de}.json` returns 0 for the about block)
- [ ] All 7 languages listed in each locale's multilingual description
- [ ] `npm run type-check` still passes (no broken next-intl key references — components reading missing keys would fail at runtime, not compile time, but lint-translation-keys script if any will catch)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Targeted Edit accidentally replaces wrong block | Low | High | Use sufficient unique context in `old_string` (include the key right before about and the key right after) |
| AI German translation has wrong register or terminology | Med | Med | Cross-check 5–10 spot terms vs existing de.json; ensure formal "Sie" used |
| Removing `story.paragraph6` before component update breaks page render | Med | Med | Phase 3 must run before deployment. Coordinate; phase order in plan ensures Phase 3 component update happens. Alternative: keep paragraph6 key with empty string until Phase 3 lands |
| Existing tests reference removed/changed keys | Low | Low | Phase 4 verification will surface these |

## Security Considerations

- N/A (content-only)

## Next Steps

→ Phase 3: Component update (story paragraph count) + image swap + SEO meta broadening.
