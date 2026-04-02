# Phase 1: Translation Updates

## Context
- [en.json](../../apps/web/messages/en.json) lines 276-346
- [sv.json](../../apps/web/messages/sv.json) lines 276-345
- [de.json](../../apps/web/messages/de.json) lines 276-345

## Overview
- **Priority**: P1 (blocks Phase 2)
- **Status**: Complete
- **Effort**: 30min

## Key Insight
Most content already exists. We only ADD new keys — never rename or remove existing ones. This ensures zero regression risk.

## New Translation Keys Required

All keys go under the `about` namespace. Existing keys remain untouched.

### 1. Hero label
```
about.hero.label → "OUR STORY" / "VÅR BERÄTTELSE" / "UNSERE GESCHICHTE"
```

### 2. Story section label
```
about.story.label → "WHO WE ARE" / "VILKA VI ÄR" / "WER WIR SIND"
```

### 3. Mission section label
```
about.mission.label → "OUR PURPOSE" / "VÅRT SYFTE" / "UNSER ZWECK"
```

### 4. Values section label
```
about.values.label → "WHY CHOOSE US" / "VARFÖR VÄLJA OSS" / "WARUM UNS WÄHLEN"
```

### 5. Responsible Tourism
```
about.responsibleTourism.label → "OUR COMMITMENT" / "VÅRT ÅTAGANDE" / "UNSER ENGAGEMENT"
about.responsibleTourism.items.item1 → "Collaborate with local professionals and businesses"
about.responsibleTourism.items.item2 → "Low-impact private-only touring model"
about.responsibleTourism.items.item3 → "Inclusive and accessible route design"
about.responsibleTourism.items.item4 → "Cultural heritage preservation and education"
```
(SV/DE translations needed for items)

### 6. Team section
```
about.team.label → "THE PEOPLE" / "MÄNNISKORNA" / "DIE MENSCHEN"
about.team.descriptionLong → (longer description paragraph for new layout)
about.team.members.member1.name → "Anna Lindqvist"
about.team.members.member1.role → "Founder & Lead Guide" / SV / DE
about.team.members.member2.name → "Erik Johansson"
about.team.members.member2.role → "Cultural Historian" / SV / DE
about.team.members.member3.name → "Sofia Bergman"
about.team.members.member3.role → "Art & Architecture Expert" / SV / DE
about.team.members.member4.name → "Magnus Ek"
about.team.members.member4.role → "Culinary Culture Guide" / SV / DE
```

### 7. Certifications subtitles
```
about.certifications.licensedSub → "Authorized professionals" / SV / DE
about.certifications.insuredSub → "Complete coverage" / SV / DE
about.certifications.localSub → "Born and raised in Stockholm" / SV / DE
```

### 8. CTA icon labels (reuse existing keys — no new keys needed)

## Implementation Steps

1. Open `en.json`, find `"about": {` block (line 276)
2. Add new keys at the appropriate nesting level within the about object
3. Repeat for `sv.json` and `de.json` with translated values
4. Verify JSON validity (no trailing commas, proper nesting)

## Todo

- [x] Add hero.label to all 3 locales
- [x] Add story.label to all 3 locales
- [x] Add mission.label to all 3 locales
- [x] Add values.label to all 3 locales
- [x] Add responsibleTourism.label + items to all 3 locales
- [x] Skip team translation keys (team section skipped per validation)
- [x] Add certifications subtitles to all 3 locales
- [x] Validate JSON syntax in all 3 files

## Success Criteria
- All 3 JSON files parse without error
- No existing keys modified or removed
- All new keys accessible via `useTranslations('about')`
