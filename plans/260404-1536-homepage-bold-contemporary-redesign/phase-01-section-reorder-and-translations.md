# Phase 1: Section Reorder & Translations

## Context Links
- [Design Specs](research/researcher-01-design-specs.md)
- [Plan Overview](plan.md)

## Overview
- **Priority**: P1 (blocking for all other phases)
- **Status**: Complete
- **Effort**: 1h
- **Description**: Reorder homepage sections to match new design, remove SeasonalCta from rendering, add missing translation keys across all 3 locales.

## Key Insights
- Current order: Hero > Trust > Video > Tours > SeasonalCta > Guides
- New order: Hero > Trust > Tours > Guides > Video > GoldLine > Footer
- SeasonalCta component file stays (not deleted), just removed from page imports/render
- `seasonImages` extraction can be removed since SeasonalCta no longer renders
- `home.hero.tag` key already exists in en.json; hero already uses `t('home.hero.tag')`
- Video section currently has `sectionTitle` but missing `tag` and `subtitle` keys
- Guides section missing `tag` key

## Requirements

### Functional
- Homepage sections render in new order
- SeasonalCta no longer appears on homepage
- All new translation keys present in en.json, sv.json, de.json
- No broken i18n lookups (all `t()` calls resolve)

### Non-functional
- No bundle size increase (removing a section import)
- Page load unchanged or faster (one fewer section)

## Architecture

### Data Flow Change
```
page.tsx server component
  |-- getFeaturedTours(locale, 3)   # KEEP
  |-- getCachedGuides({limit:'4'})  # KEEP
  |-- seasonImages extraction       # REMOVE (was only for SeasonalCta)
  |
  Render order change:
    <HeroSection />
    <TrustSignals guideCount={...} />
    <FeaturedTours tours={...} />        # moved up
    <GuidesPreview guides={...} />       # moved up
    <VideoHighlight />                   # moved down
    {/* Gold separator added in Phase 3 */}
    <Footer />
```

## Related Code Files

### Modify
- `apps/web/app/(site)/[locale]/(frontend)/page.tsx` — reorder sections, remove SeasonalCta
- `apps/web/messages/en.json` — add missing translation keys
- `apps/web/messages/sv.json` — add missing translation keys
- `apps/web/messages/de.json` — add missing translation keys

### Do NOT Modify
- `apps/web/components/home/seasonal-cta.tsx` — keep file, just stop importing

## Implementation Steps

### 1. Update page.tsx (section reorder)
1. Remove `SeasonalCta` import
2. Remove `seasonImages` extraction logic (lines 69-72)
3. Reorder JSX: Hero > TrustSignals > FeaturedTours > GuidesPreview > VideoHighlight
4. Update the file comment to reflect new section order

### 2. Add translation keys to en.json
Add under `home`:
```json
"hero": {
  ...existing,
  "tag": "PREMIUM GUIDED EXPERIENCES"  // already exists, verify
},
"video": {
  "tag": "FEATURED VIDEO",
  "sectionTitle": "Watch Our Video",  // already exists
  "subtitle": "Experience the magic of Stockholm through our eyes"
},
"featured": {
  ...existing,
  "tag": "EXPERIENCES",
  "viewTour": "VIEW TOUR"
},
"guides": {
  ...existing,
  "tag": "OUR TEAM"
}
```

### 3. Add translation keys to sv.json
```json
"video.tag": "UTVALD VIDEO",
"video.subtitle": "Upplev Stockholms magi genom vara ogon",
"featured.tag": "UPPLEVELSER",
"featured.viewTour": "VISA TUR",
"guides.tag": "VART TEAM"
```

### 4. Add translation keys to de.json
```json
"video.tag": "EMPFOHLENES VIDEO",
"video.subtitle": "Erleben Sie den Zauber Stockholms durch unsere Augen",
"featured.tag": "ERLEBNISSE",
"featured.viewTour": "TOUR ANSEHEN",
"guides.tag": "UNSER TEAM"
```

### 5. Verify
- `npm run lint`
- `npm run test`
- Check `localhost:3000/en` renders sections in new order

## Todo List
- [x] Remove SeasonalCta import and render from page.tsx
- [x] Remove seasonImages extraction from page.tsx
- [x] Reorder sections in page.tsx JSX
- [x] Update page.tsx comment
- [x] Add translation keys to en.json (tag, subtitle, viewTour)
- [x] Add translation keys to sv.json
- [x] Add translation keys to de.json
- [x] Run lint
- [x] Run tests
- [x] Visual verification

## Success Criteria
- Homepage renders Hero > Trust > Tours > Guides > Video > Footer
- SeasonalCta not visible on page
- No console warnings about missing translation keys
- All 3 locales load without errors
- Lint passes

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Missing translation key causes runtime error | Low | High | next-intl shows key name as fallback; lint catches unused imports |
| SeasonalCta removal breaks page layout | Low | Low | Simple JSX removal, no layout coupling |
| Swedish/German translations inaccurate | Medium | Low | Placeholder translations; native speaker review later |

## Security Considerations
- No user input changes
- No API changes
- No auth changes

## Next Steps
- Phase 2 (Featured Tours Redesign) and Phase 3 (Spacing Refinements) can proceed in parallel after this phase
