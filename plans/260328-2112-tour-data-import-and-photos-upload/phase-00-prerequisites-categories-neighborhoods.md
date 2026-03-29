# Phase 0: Prerequisites — Categories, Neighborhoods & Guide Validation

## Context Links
- [Categories collection](../../packages/cms/collections/categories.ts) -- name, slug, description, color/icon, localized
- [Neighborhoods collection](../../packages/cms/collections/neighborhoods.ts) -- name, description, city relationship
- [Guides collection](../../packages/cms/collections/guides.ts) -- name, bio, photo, credentials, languages
- [xlsx source](../../docx/Tour-data.xlsx) -- col 33: guide slugs, col 34: category slugs, col 35: neighborhood slugs

## Overview
- **Priority:** P1 (blocks Phase 1, 2, 3)
- **Status:** Pending
- **Effort:** 1h
- **Description:** Extract unique category and neighborhood slugs from xlsx, auto-create entries with names derived from slugs, translate names to EN/DE. Validate guide slugs exist (user provides data separately).

## Key Insights

1. **Categories from xlsx col 34:** semicolon-separated slugs like `private-tours; boat-tours; rib-boat-tours; stockholm-archipelago`. Auto-create with name = slug-to-title-case.
2. **Neighborhoods from xlsx col 35:** slugs like `gamla-stan; stockholm-city; djurgarden; stockholm-archipelago`. Auto-create with name from slug.
3. **Guides from xlsx col 33:** 2 unique slugs: `stockholm-authorized-guide-rib-skipper`, `stockholm-authorized-guide-walking-tour`. User provides full guide data separately — script creates minimal placeholder only if slug missing.
4. **Name localization:** Category/neighborhood names need SV/EN/DE. Derive EN from slug, translate to SV/DE.

## Requirements

### Functional
- Parse xlsx, extract unique category slugs and neighborhood slugs
- For each category: create Payload entry with slug, name (localized sv/en/de), description (optional)
- For each neighborhood: create Payload entry with slug, name (localized sv/en/de)
- Validate guide slugs exist in DB; warn if missing (don't fail — user provides separately)
- Skip existing entries (idempotent)

### Non-Functional
- `--dry-run` flag
- Log: created/skipped/missing per collection

## Architecture

### Data Flow
```
xlsx col 34 → split(';') → unique category slugs → slug-to-name → translate → payload.create('categories')
xlsx col 35 → split(';') → unique neighborhood slugs → slug-to-name → translate → payload.create('neighborhoods')
xlsx col 33 → unique guide slugs → payload.find('guides') → warn if missing
```

### Slug-to-Name Mapping
```
"private-tours"         → "Private Tours"
"boat-tours"            → "Boat Tours"
"gamla-stan"            → "Gamla Stan"
"stockholm-archipelago" → "Stockholm Archipelago"
"djurgarden"            → "Djurgården"  // known Swedish name
```

## Related Code Files

### Files to Create
- `scripts/create-tour-prerequisites.ts`

### Files to Read
- `packages/cms/collections/categories.ts`
- `packages/cms/collections/neighborhoods.ts`
- `packages/cms/collections/guides.ts`

## Implementation Steps

1. **Parse xlsx** — extract unique values from col 33, 34, 35
2. **Derive names** — kebab-slug to title case, handle known Swedish names (Gamla Stan, Djurgården)
3. **Translate names** — Claude API batch: EN names → SV/DE translations (small batch, ~20 terms)
4. **Create categories** — `payload.create({ collection: 'categories', data: { slug, name: {sv,en,de} } })`
5. **Create neighborhoods** — same pattern, include city relationship if cities exist
6. **Validate guides** — `payload.find({ collection: 'guides', where: { slug } })`, log missing

## Todo List

- [ ] Create `scripts/create-tour-prerequisites.ts`
- [ ] Parse xlsx for unique category/neighborhood/guide slugs
- [ ] Implement slug-to-name conversion
- [ ] Translate category/neighborhood names to SV/DE
- [ ] Create category entries via Payload Local API
- [ ] Create neighborhood entries via Payload Local API
- [ ] Validate guide slugs exist, warn if missing
- [ ] Test with `--dry-run`

## Success Criteria

- All unique category slugs from xlsx exist in DB with localized names
- All unique neighborhood slugs from xlsx exist in DB with localized names
- Guide slug validation reports status (exists/missing)
- Script is idempotent (re-run skips existing)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Slug-to-name produces bad names | Low | Low | Manual review in Payload admin, easy to edit |
| Swedish name not derived from slug | Medium | Low | Known names lookup table (Gamla Stan, Djurgården, etc.) |
| Guide slugs don't exist | Expected | Medium | Script warns; user provides guide data before Phase 3 |

## Security Considerations
- No additional concerns; creates public reference data

## Next Steps
- After this phase: Phases 1 and 2 can run in parallel
- User must create guide entries before Phase 3 runs
