# Phase 03: i18n Translations Rebrand

## Context Links
- [Plan Overview](./plan.md)
- [Phase 01: Source Code](./phase-01-source-code-rebrand.md)

## Overview
- **Date:** 2026-02-17
- **Description:** Update all 3 translation files (en.json, sv.json, de.json) with new brand name and domain
- **Priority:** P1
- **Status:** Complete
- **Review Status:** Validated

## Key Insights
- 3 locale files: `apps/web/messages/en.json`, `sv.json`, `de.json`
- Brand appears in: meta titles, footer text, terms/privacy content, group tours info, GDPR text
- Some values are legal text (privacy policy, terms) -- must update company name references
- Translation keys remain unchanged; only values change

## Requirements

### Functional
- All 3 locales display "PrivateTours" (or localized equivalent) instead of "HeritageGuiding"
- Email addresses in translated content use `@privatetours.se`
- Domain references point to `privatetours.se`
- Legal text (privacy, terms) references correct entity name

### Non-Functional
- JSON files remain valid after edits
- No orphaned translation keys

## Architecture
Translation files are flat JSON consumed by `next-intl`. Keys are dot-notation paths. Only values change.

## Related Code Files

1. `apps/web/messages/en.json`
2. `apps/web/messages/sv.json`
3. `apps/web/messages/de.json`

## Implementation Steps

### Step 1: English Translations (en.json)
Open `apps/web/messages/en.json` and apply these replacements:
- Find: `HeritageGuiding` -> Replace: `PrivateTours` (all occurrences in values)
- Find: `heritageguiding.com` -> Replace: `privatetours.se`
- Find: `info@heritageguiding.com` -> Replace: `info@privatetours.se`
- Find: `privacy@heritageguiding.com` -> Replace: `privacy@privatetours.se`
- Find: `bookings@heritageguiding.com` -> Replace: `bookings@privatetours.se`

Specific keys to check:
- `meta.title`, `meta.description` -- site-wide meta
- `footer.*` -- footer brand references
- `terms.*` -- terms of service content
- `privacy.*` -- privacy policy content
- `groupTours.*` -- group booking references
- `gdpr.*` -- GDPR compliance text

### Step 2: Swedish Translations (sv.json)
Same replacements as Step 1. Brand name "PrivateTours" stays in English (it's a proper noun/brand).
- Find: `HeritageGuiding` -> Replace: `PrivateTours`
- Find: `heritageguiding.com` -> Replace: `privatetours.se`
- Find all `@heritageguiding.com` email variants -> Replace with `@privatetours.se`

### Step 3: German Translations (de.json)
Same replacements as Step 1. Brand name stays "PrivateTours" in German too.
- Find: `HeritageGuiding` -> Replace: `PrivateTours`
- Find: `heritageguiding.com` -> Replace: `privatetours.se`
- Find all `@heritageguiding.com` email variants -> Replace with `@privatetours.se`

### Step 4: Validate JSON
```bash
# Ensure all 3 files are valid JSON
node -e "JSON.parse(require('fs').readFileSync('apps/web/messages/en.json','utf8'))"
node -e "JSON.parse(require('fs').readFileSync('apps/web/messages/sv.json','utf8'))"
node -e "JSON.parse(require('fs').readFileSync('apps/web/messages/de.json','utf8'))"
```

### Step 5: Verify Build
```bash
npm run lint
npm run type-check
```

## Todo List
- [x] Update en.json (all HeritageGuiding -> Private Tours, all domain/email refs)
- [x] Update sv.json (same replacements, handled Swedish possessive)
- [x] Update de.json (same replacements)
- [x] Validate all 3 JSON files parse correctly
- [x] Run lint + type-check (no new issues from translation changes)

## Success Criteria
- `grep -r "heritageguiding" apps/web/messages/` returns nothing
- All 3 JSON files parse without errors
- Pages render correctly in all 3 locales with new brand
- Legal pages (privacy, terms) show correct company name

## Risk Assessment
- **Low risk:** Pure value replacements in JSON
- **Watch for:** Accidentally breaking JSON syntax (missing quotes, trailing commas)
- **Mitigation:** JSON validation step before committing

## Security Considerations
- Privacy policy and terms must reference correct legal entity
- GDPR contact email must be reachable at new domain

## Next Steps
- Coordinate with Phase 01 to ensure component code matches translation values
- Legal team should review updated privacy/terms text (out of scope for dev)
