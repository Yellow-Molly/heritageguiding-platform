# Phase 02 — Category Taxonomy Redesign + Mapping

## Context Links

- `packages/cms/collections/categories.ts`
- DB snapshot of current 34 categories (see plan.md context)
- `apps/web/lib/api/get-categories.ts` — returns categories filtered by `type`

## Overview

- **Priority:** P1 (blocks Phase 03)
- **Status:** pending
- **Effort:** 1.5h
- **Description:** Define the canonical post-cleanup category list. Produce an old→new slug mapping. Identify rows to delete (location-named or fully redundant).

## Key Insights

- Categories collection has two `type` values: `theme` and `activity`. Filter UI currently shows themes only (`getCategories('theme', locale)` in `tours/page.tsx`). Activity surfaces are TBD — keep type='activity' for future use.
- Tours have multi-tagging — same tour can have 4+ categories today. Post-cleanup: target average 2-3 categories per tour (1-2 themes + 1 activity).
- After this phase, `getCategories('neighborhood', ...)` becomes obsolete — neighborhoods are queried directly. Can simplify the API in Phase 04.
- The `i18n` translations for category names live in Payload (localized fields). Must preserve translations when merging duplicates — pick the "best" translation as the survivor.

## Requirements

### Functional
- Produce a canonical category list under `data/category-taxonomy.json` with shape:
  ```json
  {
    "themes": [
      { "slug": "history-heritage", "name": { "sv": "...", "en": "...", "de": "..." }, "icon": "..." }
    ],
    "activities": [
      { "slug": "walking-tour", "name": { ... }, "icon": "..." }
    ]
  }
  ```
- Produce `data/category-migration-map.json` with shape:
  ```json
  {
    "old-slug": { "action": "merge", "newSlug": "..." },
    "stockholm":  { "action": "delete", "reason": "location-as-category, replaced by Tour.cities" },
    ...
  }
  ```
- Every existing category slug must be in the map. Actions: `merge`, `delete`, `keep`.

### Non-Functional
- Maps stored in `data/` (committed) — review-friendly for editorial team.
- Migration script (Phase 03) consumes both files.

## Architecture

### Proposed Final Taxonomy

**Themes (6)**
| Slug | Why | Replaces |
|------|-----|----------|
| `history-heritage` | Cleanest umbrella | history, history-and-architecture, history-and-heritage, cultural-heritage, academic-heritage |
| `viking-medieval` | Distinct sub-period popular with tourists | viking-history, pre-christian-scandinavia |
| `architecture` | Design-focused tours | architectural-landmarks |
| `culture-local-life` | Soft-culture, food, neighborhoods feel | cultural-experience, cultural-tours, culture-history, local-life, urban-geography |
| `family-friendly` | Audience-as-theme keeps existing translations | family-friendly |
| `nature-water` | Archipelago, lake tours, parks | (new — currently NULL) |

**Activities (4)**
| Slug | Why | Replaces |
|------|-----|----------|
| `walking-tour` | Standard tour format | walking-tours, private-walking-tour, city-walk |
| `boat-tour` | All boat formats; RIB info goes in tour meta | boat-tours, rib-boat-tours |
| `chauffeured-tour` | Car/van/private driver | chauffeured-experience |
| `day-trip` | Multi-hour out-of-city excursion | private-day-tour, private-day-trips, slow-travel |

**Deleted entirely (location-as-category)**
- `stockholm`, `sigtuna`, `uppsala` → covered by Tour.cities
- `gamla-stan`, `stockholm-archipelago`, `vasa-museum`, `city-hall` → covered by Tour.neighborhoods
- `day-trips-from-stockholm`, `stockholm-from-the-water` → covered by Tour.cities + Tour.neighborhoods

**Deleted as redundant umbrella**
- `private-tours`, `private-city-tour` — every tour is private; tagging adds no signal

### Mapping Sketch (full version in JSON)

| Old Slug | Action | New Slug |
|----------|--------|----------|
| academic-heritage | merge | history-heritage |
| architectural-landmarks | merge | architecture |
| boat-tours | merge | boat-tour |
| chauffeured-experience | merge | chauffeured-tour |
| city-hall | delete | — |
| city-walk | merge | walking-tour |
| cultural-experience | merge | culture-local-life |
| cultural-heritage | merge | history-heritage |
| cultural-tours | merge | culture-local-life |
| culture-history | merge | culture-local-life |
| day-trips-from-stockholm | delete | — |
| family-friendly | keep | family-friendly |
| gamla-stan | delete | — |
| history | merge | history-heritage |
| history-and-architecture | merge | architecture |
| history-and-heritage | merge | history-heritage |
| local-life | merge | culture-local-life |
| pre-christian-scandinavia | merge | viking-medieval |
| private-city-tour | delete | — |
| private-day-tour | merge | day-trip |
| private-day-trips | merge | day-trip |
| private-tours | delete | — |
| private-walking-tour | merge | walking-tour |
| rib-boat-tours | merge | boat-tour |
| sigtuna | delete | — |
| slow-travel | merge | day-trip |
| stockholm | delete | — |
| stockholm-archipelago | delete | — |
| stockholm-from-the-water | delete | — |
| stockholm | delete | — |
| uppsala | delete | — |
| urban-geography | merge | culture-local-life |
| vasa-museum | delete | — |
| viking-history | merge | viking-medieval |
| walking-tours | merge | walking-tour |

### Post-Migration Tour Mapping (sample)

| Tour Slug | Final Categories |
|-----------|------------------|
| private-rib-tour-stockholm-3h | boat-tour, nature-water |
| private-medieval-stockholm-walking-tour | history-heritage, viking-medieval, walking-tour, family-friendly |
| private-sigtuna-heritage-tour-from-stockholm | history-heritage, viking-medieval, day-trip |
| private-uppsala-day-tour-from-stockholm | history-heritage, day-trip |
| gamla-stan-and-vasa-museum-private-walking-tour | culture-local-life, walking-tour |
| gamla-stan-and-stockholm-city-hall-private-walking-tour | architecture, history-heritage, walking-tour |
| slow-travel-malaren-classic-boat-stockholm | nature-water, boat-tour, day-trip |
| slow-travel-stockholm-archipelago-classic-boat | nature-water, boat-tour, day-trip |
| stockholm-everyday-life-private-tour | culture-local-life, walking-tour |
| stockholm-islands-and-districts-private-overview-by-car-3-hour | architecture, chauffeured-tour |

## Related Code Files

**Create**
- `data/category-taxonomy.json`
- `data/category-migration-map.json`

**Read for context**
- `packages/cms/collections/categories.ts`
- `apps/web/lib/api/get-categories.ts`

## Implementation Steps

1. Pull the full current category list from DB (already captured in plan.md context).
2. Author `data/category-taxonomy.json` with the 6+4 final list. Include SV/EN/DE names per category — reuse existing localized values from the surviving slug where possible (e.g., `family-friendly` keeps current names).
3. Author `data/category-migration-map.json` covering all 34 current slugs.
4. Cross-check: every old slug present? Every `merge.newSlug` exists in the taxonomy file? Run a quick TS validator script (`scripts/validate-category-mapping.ts`).
5. Manually map each tour's expected post-migration categories — paste table into this phase doc as Appendix A for review.
6. Have user/editor review JSON files before Phase 03 runs.

## Todo List

- [x] Write `data/category-taxonomy.json`
- [x] Write `data/category-migration-map.json`
- [x] Write `scripts/validate-category-mapping.ts` validator
- [x] Run validator → 34/34 old slugs covered, 0 dangling refs, 1 expected warning (`nature-water` is brand new — tagged in Phase 03)
- [ ] Author Appendix A (per-tour expected categories) — covered by table in this doc § "Post-Migration Tour Mapping (sample)"
- [ ] Get editorial sign-off on JSON files (deferred — runtime, before `--apply` in Phase 03)

## Success Criteria

- Validator script reports: 34/34 old slugs covered, 0 dangling `newSlug` refs, 10/10 themes+activities defined.
- Editorial approval recorded in this phase doc (date + initials).
- Final taxonomy has zero location-named slugs.

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Lose nuanced category meaning in merge | Preserve old slug in tour meta `legacyTags[]` if needed (out of scope unless requested) |
| Editor rejects taxonomy | Built-in: this phase is gated by editorial sign-off before Phase 03 |
| Translation regression on merged categories | Validator prints surviving translation source per merge; reviewer confirms |

## Security Considerations

- None — pure data design.

## Next Steps

→ Phase 03 consumes both JSON files for the actual DB migration.
