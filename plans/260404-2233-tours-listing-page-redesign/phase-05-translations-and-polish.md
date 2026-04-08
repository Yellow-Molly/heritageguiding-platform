# Phase 5: Translations & Polish

## Context Links
- Translation files: `apps/web/messages/{en,sv,de}.json`
- All components from Phases 1-4

## Overview
- **Priority:** Low
- **Status:** Complete
- **Effort:** 1.5h
- **Depends on:** Phases 1-4 (all components must exist)

Add i18n keys for all new/changed user-facing strings. Visual QA pass to verify pixel alignment with design. Fix any spacing, color, or typography inconsistencies.

## Key Insights
- Many strings already exist in `tours.filters` namespace. New keys needed for: sidebar headings, price range labels, page header subtitle, map button, duration checkbox labels, hearing accessibility label.
- Design uses specific typography: Playfair Display (font-serif) for titles, Inter (font-sans) for body. Verify Tailwind font-serif maps to Playfair Display.
- Colors should use CSS vars, not hardcoded hex. Verify no hardcoded values crept in during Phases 1-4.

## Requirements

### Functional
- All user-facing strings use `useTranslations()` / `getTranslations()`
- All 3 locales (en, sv, de) have translations

### Non-Functional
- No hardcoded hex colors (use `var(--color-*)`)
- Typography matches design spec
- Spacing matches design spec (24px section gaps, 12px item gaps, 80px horizontal padding desktop, 16px mobile)

## New Translation Keys Needed

### `tours.filters` namespace (additions)
```json
{
  "pageTitle": "Stockholm Tours",
  "pageSubtitle": "Explore our handpicked collection of premium private tours",
  "categories": "Categories",
  "allTours": "All Tours",
  "priceRange": "Price Range",
  "hearingAssistance": "Hearing Assistance",
  "under2hours": "Under 2 hours",
  "twoToThreeHours": "2-3 hours",
  "threeHoursPlus": "3+ hours",
  "mapView": "Map",
  "loadingMore": "Loading more tours...",
  "maxCapacity": "Max {count}",
  "durationAndCapacity": "{duration} · Max {count} people"
}
```

Note: Some keys may overlap with existing ones. Audit before adding to avoid duplicates.

### Existing keys to verify
- `allCategories` → may rename to `allTours` for sidebar context
- `wheelchairAccessible` → already exists
- `sortBy`, `sortPopular`, etc. → already exist
- `resultsCount` → already exists with ICU plural

## Related Code Files

### Files to Modify
- `apps/web/messages/en.json` — Add new keys under `tours.filters`
- `apps/web/messages/sv.json` — Swedish translations
- `apps/web/messages/de.json` — German translations

### Files to Audit (no changes expected, just verify)
- All components from Phases 1-4: check for hardcoded strings or colors
- `apps/web/app/globals.css` — Verify CSS vars cover all design colors

## Implementation Steps

### Step 1: Audit hardcoded strings
Grep all Phase 1-4 component files for:
- Hardcoded English text (strings not wrapped in `t()`)
- Hardcoded hex colors (#xxx patterns)
- Hardcoded pixel values that should be CSS vars

### Step 2: Add translation keys to en.json
- Add new keys under `tours.filters` namespace
- Use ICU MessageFormat for plurals/variables where needed
- Keep key names consistent with existing pattern (camelCase)

### Step 3: Add Swedish translations (sv.json)
```json
{
  "pageTitle": "Stockholms turer",
  "pageSubtitle": "Utforska vart handplockade utbud av privata premiumturer",
  "categories": "Kategorier",
  "allTours": "Alla turer",
  "priceRange": "Prisintervall",
  "hearingAssistance": "Horselassistans",
  "under2hours": "Under 2 timmar",
  "twoToThreeHours": "2-3 timmar",
  "threeHoursPlus": "3+ timmar",
  "mapView": "Karta",
  "loadingMore": "Laddar fler turer...",
  "maxCapacity": "Max {count}",
  "durationAndCapacity": "{duration} · Max {count} personer"
}
```

### Step 4: Add German translations (de.json)
```json
{
  "pageTitle": "Stockholm Touren",
  "pageSubtitle": "Entdecken Sie unsere handverlesene Sammlung erstklassiger Privattouren",
  "categories": "Kategorien",
  "allTours": "Alle Touren",
  "priceRange": "Preisbereich",
  "hearingAssistance": "Horhilfe",
  "under2hours": "Unter 2 Stunden",
  "twoToThreeHours": "2-3 Stunden",
  "threeHoursPlus": "3+ Stunden",
  "mapView": "Karte",
  "loadingMore": "Weitere Touren werden geladen...",
  "maxCapacity": "Max {count}",
  "durationAndCapacity": "{duration} · Max {count} Personen"
}
```

### Step 5: Visual QA checklist
- [ ] Page header: title 28px Playfair Display, subtitle 14px Inter, bg #FAFAF8
- [ ] Sidebar: 260px width, section borders, 24px/12px gaps
- [ ] Grid cards: 12px radius, subtle shadow, correct image height (180px)
- [ ] Featured badge gold (#C4A052 = var(--color-secondary-light))
- [ ] Duration pill: black translucent on image
- [ ] Mobile header: 16px padding, 12px gaps, navy filter pill
- [ ] Mobile cards: 130px height, horizontal layout
- [ ] Price range slider: track colored, thumbs styled
- [ ] All text uses CSS var colors, no raw hex

### Step 6: Cross-browser check
- Chrome, Firefox, Safari (desktop)
- Chrome, Safari (mobile)
- Focus on: range slider thumbs, checkbox custom styling, card shadows

## Todo List
- [x] Audit all new components for hardcoded strings
- [x] Audit all new components for hardcoded colors
- [x] Add en.json translation keys
- [x] Add sv.json translation keys
- [x] Add de.json translation keys
- [x] Visual QA: desktop layout matches design
- [x] Visual QA: mobile layout matches design
- [x] Cross-browser: range slider styling
- [x] Cross-browser: card layout consistency

## Success Criteria
- Zero hardcoded user-facing strings in new/modified components
- All 3 locales have complete translations for new keys
- Visual output matches design spec within 2px tolerance
- No hardcoded hex colors (all use CSS vars)
- Existing tests still pass

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Swedish/German translations inaccurate | Med | Low | Flag for native speaker review; use clear simple language |
| Missing translation key causes runtime error | Low | High | next-intl shows key path as fallback; grep for all t() calls to verify coverage |
| Visual discrepancies on Safari | Med | Med | Test early; Safari flexbox quirks documented in team knowledge |

## Security Considerations
- Translation strings are static, no user input interpolated except ICU variables (count, duration) which are numbers.

## Next Steps
- Final review: run full test suite, verify no regressions
- Merge to feature branch, create PR
