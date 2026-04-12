# Phase 02: Hero Section & i18n

## Context Links
- Existing messages: `apps/web/messages/en.json`, `sv.json`, `de.json`
- Pattern reference: homepage hero uses similar centered layout

## Overview
- **Priority:** Medium (blocks Phase 5)
- **Status:** Complete
- **Description:** Create hero server component and add all new i18n keys.

## Key Insights
- Hero is purely presentational, server-rendered — no interactivity needed
- Uses `getTranslations('guides')` namespace already established
- Gold tag + Playfair Display heading + Inter subtitle = standard pattern

## Requirements

### Functional
- Centered hero section with gold "MEET OUR TEAM" tag
- "Our Expert Guides" serif heading
- Subtitle paragraph
- All text i18n-ready in 3 locales

### Non-Functional
- Server component (no 'use client')
- Under 50 lines of code

## Architecture

```
guide-listing-hero.tsx (server component)
  ├── Gold tag (uppercase, small text, tracking-wide)
  ├── h1 heading (Playfair Display / font-serif)
  └── p subtitle (text-muted, max-w-2xl centered)
```

## Related Code Files
- **Create:** `apps/web/components/guide/guide-listing-hero.tsx`
- **Modify:** `apps/web/messages/en.json` — add guides.hero.* keys
- **Modify:** `apps/web/messages/sv.json` — add guides.hero.* keys
- **Modify:** `apps/web/messages/de.json` — add guides.hero.* keys

## Implementation Steps

1. Create `guide-listing-hero.tsx`:
   - Import `getTranslations` from `next-intl/server`
   - Render centered section with py-12 lg:py-16
   - Gold tag: `text-xs font-semibold uppercase tracking-widest text-[var(--color-secondary)]`
   - Heading: `font-serif text-3xl lg:text-5xl font-bold text-[var(--color-primary)]`
   - Subtitle: `mt-4 max-w-2xl mx-auto text-lg text-[var(--color-text-muted)]`

2. Add i18n keys to all 3 locale files under existing `guides` namespace:
   ```json
   "hero": {
     "tag": "MEET OUR TEAM",
     "title": "Our Expert Guides",
     "subtitle": "Meet the passionate experts who bring Stockholm's heritage to life. Each guide brings unique expertise and local knowledge."
   },
   "filters": {
     "search": "Search guides...",
     "language": "Language",
     "specialization": "Specialization",
     "area": "Area",
     "showFilters": "Filters",
     "count": "{count} guides"
   },
   "stats": {
     "tours": "{count} tours",
     "experience": "{years}+ years experience"
   },
   "loadMore": "Load more guides"
   ```

3. Translate sv.json and de.json equivalents

## Todo List
- [ ] Create `guide-listing-hero.tsx` component
- [ ] Add i18n keys to `en.json`
- [ ] Add i18n keys to `sv.json`
- [ ] Add i18n keys to `de.json`
- [ ] Export from `components/guide/index.ts`

## Success Criteria
- Hero renders correctly with translated text
- Component is <50 lines, server-rendered
- All 3 locales have complete key coverage

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Translation quality for sv/de | Medium | Low | Can be refined later; initial machine translation acceptable |

## Security Considerations
- None (static presentational content)

## Next Steps
- Phase 5 imports and places this component in page.tsx
