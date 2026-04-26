# Phase 4: Merge-Import v2 Guides into Payload CMS

## Context Links
- Script to edit: `scripts/import-guide-data.ts`
- Input: `data/translated-guides-v2.json` (Phase 2)
- Photo map: `data/guide-photo-media-mapping.json` (Phase 3)
- CMS collection: `packages/cms/collections/guides.ts`
- Lexical converter: `packages/cms/lib/csv/tour-csv-markdown-to-lexical-converter.ts` (`markdownToLexical()`)
- Delta precedent: `scripts/import-tour-data.ts --update` + `plans/260413-1710-tour-data-v2-update/`

## Overview
- **Priority:** P1
- **Status:** Pending
- **Effort:** 1h
- **Depends on:** Phases 2 + 3

Extend the existing import script to accept a v2 input JSON with the new narrative fields, assemble a structured markdown bio, and run in **merge mode** that preserves v1-only metadata on existing guides.

## Key Insights
- Current script assumes v1 shape: `{ slug, name, email, phone, sv, en, de, passThrough: { languages, additionalLanguages, operatingAreas, tourSlugs } }` where `sv/en/de` have only `{ bio, certifications, specializations }`.
- v2 shape drops `email`, `phone`, `certifications` (explicit), `operatingAreas`, `tourSlugs`, `additionalLanguages`; adds `guideStyle`, `whatGuestsAppreciate`, `uniqueAspectsQuote`, `uniqueAspectsBody`.
- Strategy: detect v2 via `--input=` flag path or by probe (`sv.guideStyle` present). Run a dedicated code path that:
  1. Reads v2 JSON.
  2. For each guide, builds a composed markdown bio (bio + H3 sections + blockquote).
  3. For existing guides (slug match), fetches current record and **preserves** email/phone/operatingAreas/additionalLanguages/yearsExperience.
  4. For new guides, applies defaults: `email=''`, `phone=''`, `operatingAreas=['stockholm']` (resolve to city ID), `credentials=[{credential:'Auktoriserad Stockholmsguide (FSAG)'}]`, languages from v2 `passThroughLanguages`.
  5. Writes all 3 locales: SV (full data + bio), then EN + DE (bio + credentials only — same as v1 path).
- The composed markdown bio uses this template:

```markdown
{bio paragraphs}

### Specialisering | Specializations | Spezialisierungen  ← heading text localized
- {spec 1}
- {spec 2}
- …

### Guidestil | Guide Style | Führungsstil
{guideStyle paragraph}

### Vad gästerna uppskattar | What Guests Appreciate | Was Gäste schätzen
{whatGuestsAppreciate paragraph}

### Det som gör turer unika | What Makes Tours Unique | Was die Touren einzigartig macht
> {uniqueAspectsQuote}

{uniqueAspectsBody paragraph}
```

The H3 heading text is authored per-locale in the translated JSON (add into Phase 2 output as fixed strings, OR hardcode the heading texts in the import script keyed by locale — simpler; do the latter).

## Requirements

### Functional
- Accept `--input=<path>` CLI flag; default unchanged (v1 path).
- Detect v2 shape by key probe: if first entry has `sv.guideStyle`, switch to v2 path.
- New constants: `DEFAULT_NEW_GUIDE_CREDENTIALS_SV = 'Auktoriserad Stockholmsguide (FSAG)'` + EN/DE equivalents.
- New helper `buildV2BioMarkdown(locale, guideData)` that composes the full markdown bio.
- For existing guides, fetch current record and pick `email`, `phone`, `yearsExperience`, existing `operatingAreas` (IDs), existing `additionalLanguages` (enum array).
- For new guides, resolve `stockholm` city slug → ID for `operatingAreas`; set `languages` from `passThroughLanguages` in input.
- Respect existing `--dry-run`, `--update`, `--status=` flags.
- `--only-bio-credentials-specs` new flag: when true, update only bio + credentials + specializations on existing guides. **Default ON for v2 path** unless `--full-update` explicitly passed.

### Non-Functional
- Edit existing script in place; do not duplicate file.
- Keep v1 code path working for idempotency.
- Total added lines ≤ 120; if tipping over 200-line file threshold, extract helpers to `scripts/lib/guide-v2-helpers.ts`.

## Architecture

### V2 Input Type
```typescript
interface TranslatedGuideV2 {
  slug: string
  name: string
  sv: { bio: string; specializations: string[]; guideStyle: string; whatGuestsAppreciate: string; uniqueAspectsQuote: string; uniqueAspectsBody: string }
  en: { /* same */ }
  de: { /* same */ }
  passThroughLanguages: string[]
  passThroughAdditionalLanguages: string[]
}
```

### Locale Heading Map
```typescript
const V2_HEADINGS = {
  sv: { spec: 'Specialisering', style: 'Guidestil', appreciate: 'Vad gästerna uppskattar', unique: 'Det som gör turer unika' },
  en: { spec: 'Specializations', style: 'Guide Style', appreciate: 'What Guests Appreciate', unique: 'What Makes Tours Unique' },
  de: { spec: 'Spezialisierungen', style: 'Führungsstil', appreciate: 'Was Gäste schätzen', unique: 'Was die Touren einzigartig macht' },
}
```

### Composed Bio Builder
```typescript
function buildV2BioMarkdown(
  locale: 'sv' | 'en' | 'de',
  data: TranslatedGuideV2[typeof locale],
): string {
  const h = V2_HEADINGS[locale]
  return [
    data.bio.trim(),
    '',
    `### ${h.spec}`,
    ...data.specializations.map((s) => `- ${s}`),
    '',
    `### ${h.style}`,
    data.guideStyle.trim(),
    '',
    `### ${h.appreciate}`,
    data.whatGuestsAppreciate.trim(),
    '',
    `### ${h.unique}`,
    `> ${data.uniqueAspectsQuote.trim()}`,
    '',
    data.uniqueAspectsBody.trim(),
  ].join('\n')
}
```

### Merge Logic for Existing Guides
```typescript
if (wasExisting) {
  const existing = existingGuides.find(g => g.slug === guide.slug)!
  const preserved = {
    email: existing.email ?? '',
    phone: existing.phone ?? '',
    yearsExperience: existing.yearsExperience,
    operatingAreas: (existing.operatingAreas as Array<{ id: string } | string | number>).map(extractId),
    additionalLanguages: existing.additionalLanguages ?? [],
    languages: existing.languages ?? guide.passThroughLanguages,
  }
  // Only overwrite: bio (all locales), credentials (if v2 supplies), specializations (re-resolved)
}
```

### New Guide Defaults
```typescript
// Applied only when !wasExisting
const defaults = {
  email: '',
  phone: '',
  languages: guide.passThroughLanguages,
  additionalLanguages: guide.passThroughAdditionalLanguages,
  operatingAreas: [cityMap.get('stockholm')].filter(Boolean),
  credentialsByLocale: {
    sv: [{ credential: 'Auktoriserad Stockholmsguide (FSAG)' }],
    en: [{ credential: 'Authorized Stockholm Guide (FSAG)' }],
    de: [{ credential: 'Autorisierter Stockholm-Guide (FSAG)' }],
  },
}
```

## Related Code Files

### Files to Edit
- `scripts/import-guide-data.ts` — add v2 path, flags, helpers

### Files to Read (patterns)
- `scripts/import-tour-data.ts` — `--input=` flag parsing, update-mode merge style
- `scripts/import-guide-data.ts` (existing) — locale update pattern with credential array ID preservation (lines 252–275)

## Implementation Steps
1. Add CLI flag parsing: `INPUT_PATH`, `ONLY_BIO_FLAG` (default true when v2), `FULL_UPDATE_FLAG`.
2. Load JSON from `INPUT_PATH`; probe for v2 shape.
3. Define `V2_HEADINGS` and `buildV2BioMarkdown()` helpers near top of file.
4. Define `NEW_GUIDE_DEFAULTS` map.
5. Branch `main()` after pre-fetch:
   - If v2 shape: run `importV2(guides, …)` function.
   - Else: run existing v1 flow unchanged.
6. Implement `importV2()`:
   - For each guide, resolve specializations (reuse `resolveSpecializations()`).
   - Compute `wasExisting = existingSlugs.has(slug)`.
   - Build SV data:
     - If existing + only-bio mode: `{ bio: markdownToLexical(buildV2BioMarkdown('sv', g.sv)), specializations: svIds }` (no credentials overwrite unless full-update).
     - If existing + full-update: merge preserved + new.
     - If new: full create with defaults + bio + specializations + status.
   - `payload.create` or `payload.update({ locale: 'sv' })`.
   - For `en` and `de`: update bio (always) + credentials for new guides.
7. Skip tour reassignment block when running v2 path (leave v1 `GUIDE_TO_TOURS` intact for the 7 existing; 4 new have no tour mappings).
8. Extend dry-run output to print per-guide: `new|update-existing`, bio char count, specializations count, photo status.
9. Print final summary: created / updated / skipped / errors / placeholder-photo count.

## Todo List
- [ ] Add `--input=` parsing + v2 detection
- [ ] Add `V2_HEADINGS` + `buildV2BioMarkdown()` + `NEW_GUIDE_DEFAULTS`
- [ ] Branch `main()` into v1/v2 paths
- [ ] Implement `importV2()` with merge + new-guide defaults
- [ ] Dry-run verification (expected: 4 new, 7 updated, 0 errors)
- [ ] Live run with `--update --status=active`
- [ ] Spot-check one existing (Sabine) + one new (Tommy) in CMS admin

## Success Criteria
- Dry run reports 11 guides (4 new, 7 updated)
- Live run creates 4 new guides + updates 7 existing
- Existing guides retain v1 email/phone/operatingAreas/yearsExperience
- All 11 guides have bio richText containing 4 H3 sections + blockquote
- All 3 locales populated for every guide
- 0 errors, 0 orphan tour references

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Overwriting PO-edited v1 bios in CMS | High | High | `--only-bio-credentials-specs` default true; user confirms before live run |
| Stockholm city slug resolution fails | Low | Medium | Pre-fetch city map; fail fast if missing; print clear error |
| Credentials array ID preservation breaks on new guides | Low | Medium | New guides create credentials fresh (no existing IDs); existing guides' credentials untouched in only-bio mode |
| Markdown → Lexical converter chokes on blockquote syntax | Medium | Medium | Test one guide in dry-run + Lexical inspector; if broken, fall back to paragraph with emphasis |
| Specialization IDs empty when v2 text doesn't match `SPECIALIZATION_KEYWORDS` | Medium | Low | Log warning per guide; existing relations preserved on update path if `specializations: undefined` |

## Security Considerations
- Email/phone stay admin-only (collection field config unchanged).
- No new auth surface; script uses Payload Local API.

## Next Steps
- Phase 5 verification runs after this completes
