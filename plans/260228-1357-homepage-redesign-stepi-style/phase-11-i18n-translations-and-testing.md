# Phase 11: i18n Translations and Testing

## Context Links
- [Plan Overview](./plan.md)
- [en.json](../../apps/web/messages/en.json)
- [sv.json](../../apps/web/messages/sv.json)
- [de.json](../../apps/web/messages/de.json)
- [Existing test](../../apps/web/components/home/__tests__/category-nav.test.tsx)

## Overview
- **Priority:** P1
- **Status:** complete
- **Description:** Add all new i18n translation keys for new/modified sections across EN/SV/DE locales. Write unit tests for new components. Update or remove tests for deprecated components.

## Key Insights
- 3 locale files: en.json, sv.json, de.json
- Existing `home.*` namespace has keys for hero, featured, trust, categories, whyChooseUs
- New keys needed: `home.video.*`, `home.seasonal.*`, `home.guides.*`
- Modified keys: `home.hero.tagline` (new), updates to hero subtitle
- Deprecated keys: `home.categories.*`, `home.whyChooseUs.*` can stay (harmless)
- Footer keys needed: `footer.*` (new namespace)
- Existing test `category-nav.test.tsx` needs to be removed or updated
- New tests needed for: VideoSection, SeasonalTabs, MeetOurGuides
- Follow existing test patterns: Vitest + React Testing Library

## Requirements

### Functional

#### i18n Keys to Add (EN)
```json
{
  "home": {
    "hero": {
      "tagline": "Premium Heritage Tours",
      "title": "Discover Stockholm's Hidden Heritage",
      "subtitle": "Expert-led tours revealing centuries of Swedish history",
      "cta": "Explore Our Tours"
    },
    "video": {
      "tagline": "See It In Action",
      "title": "Watch Our Video",
      "description": "Experience the magic of Stockholm through the eyes of our expert guides. From medieval streets to royal palaces, every tour tells a unique story.",
      "cta": "Browse Tours",
      "playButton": "Play video",
      "iframeTitle": "Private Tours Stockholm introduction video",
      "thumbnailAlt": "Stockholm heritage tour preview"
    },
    "seasonal": {
      "tagline": "Four Seasons, Endless Stories",
      "title": "Travel All Year Round",
      "cta": "Book This Season",
      "winter": {
        "title": "Winter Wonderland Tours",
        "description": "Experience Stockholm's enchanting winter landscape. Cozy walking tours through snow-covered streets, candlelit historic sites, and warm fika breaks.",
        "imageAlt": "Snowy Stockholm Old Town in winter"
      },
      "spring": {
        "title": "Spring Awakening Tours",
        "description": "Watch Stockholm come alive with cherry blossoms and longer days. Perfect weather for exploring parks, waterfront promenades, and outdoor attractions.",
        "imageAlt": "Stockholm cherry blossoms in spring"
      },
      "summer": {
        "title": "Summer Heritage Tours",
        "description": "Enjoy the midnight sun and vibrant city life. Island hopping, rooftop views, and the full splendor of Stockholm's archipelago and historic sites.",
        "imageAlt": "Stockholm waterfront in summer sunshine"
      },
      "autumn": {
        "title": "Autumn Colors Tours",
        "description": "Golden leaves frame Stockholm's most beautiful landmarks. Quieter crowds, crisp air, and the city's most photogenic season.",
        "imageAlt": "Stockholm autumn colors along the waterfront"
      }
    },
    "guides": {
      "tagline": "Your Local Experts",
      "title": "Meet Our Expert Guides",
      "ariaLabel": "Meet our guides",
      "viewAll": "Meet All Guides"
    }
  },
  "footer": {
    "newsletter": {
      "title": "Stay Updated",
      "subtitle": "Subscribe to receive exclusive offers and heritage insights.",
      "placeholder": "Enter your email",
      "button": "Subscribe"
    },
    "brand": {
      "description": "Discover Stockholm's rich history with expert-led heritage tours. Licensed guides, authentic experiences, unforgettable memories."
    },
    "columns": {
      "tours": { "title": "Tours" },
      "support": { "title": "Support" },
      "company": { "title": "Company" },
      "legal": { "title": "Legal" }
    },
    "contact": {
      "address": "Gamla Stan, Stockholm, Sweden",
      "hours": "Daily 9:00 - 18:00 CET"
    },
    "copyright": "© {year} Private Tours. All rights reserved.",
    "language": "Language"
  }
}
```

#### SV/DE Translations
- Swedish (sv.json): professional Swedish translations
- German (de.json): professional German translations
- All keys must exist in all 3 locales

#### Tests to Write
1. `video-section.test.tsx` -- renders thumbnail, click shows iframe, text content
2. `seasonal-tabs.test.tsx` -- renders 4 tabs, click switches content, correct initial state
3. `meet-our-guides.test.tsx` -- renders guide cards, avatars, social links

#### Tests to Update/Remove
4. `category-nav.test.tsx` -- delete (component deprecated)

### Non-Functional
- Tests follow existing patterns (Vitest + RTL)
- Each test file < 100 lines
- Min 3 test cases per component
- All tests pass: `npm test`
- Lint passes: `npm run lint`

## Architecture

### i18n File Changes
Add keys to all 3 locale JSON files in same structure. Maintain alphabetical ordering within namespaces.

### Test File Structure
```
apps/web/components/home/__tests__/
├── category-nav.test.tsx    (DELETE)
├── video-section.test.tsx   (NEW)
├── seasonal-tabs.test.tsx   (NEW)
└── meet-our-guides.test.tsx (NEW)
```

## Related Code Files
- **Modify:** `apps/web/messages/en.json`
- **Modify:** `apps/web/messages/sv.json`
- **Modify:** `apps/web/messages/de.json`
- **Delete:** `apps/web/components/home/__tests__/category-nav.test.tsx`
- **Create:** `apps/web/components/home/__tests__/video-section.test.tsx`
- **Create:** `apps/web/components/home/__tests__/seasonal-tabs.test.tsx`
- **Create:** `apps/web/components/home/__tests__/meet-our-guides.test.tsx`

## Implementation Steps

### i18n (Steps 1-4)
1. Add `home.hero.tagline` key to en.json (hero section updated text)
2. Add `home.video.*` keys to en.json (all video section text)
3. Add `home.seasonal.*` keys to en.json (all seasonal tabs text)
4. Add `home.guides.*` keys to en.json (all guides section text)
5. Add `footer.*` keys to en.json (all footer text)
6. Translate and add all keys to sv.json
7. Translate and add all keys to de.json
8. Verify no duplicate keys or JSON syntax errors

### Tests (Steps 5-8)
9. Delete `category-nav.test.tsx`
10. Create `video-section.test.tsx`:
    ```tsx
    describe('VideoSection', () => {
      it('should render video thumbnail with play button', () => {})
      it('should show iframe when play button is clicked', () => {})
      it('should render section heading and description', () => {})
      it('should render CTA link to tours page', () => {})
    })
    ```
11. Create `seasonal-tabs.test.tsx`:
    ```tsx
    describe('SeasonalTabs', () => {
      it('should render 4 season tab buttons', () => {})
      it('should show winter content by default', () => {})
      it('should switch content when tab is clicked', () => {})
      it('should highlight active tab with aria-pressed', () => {})
    })
    ```
12. Create `meet-our-guides.test.tsx`:
    ```tsx
    describe('MeetOurGuides', () => {
      it('should render guide cards with avatars', () => {})
      it('should display guide names and roles', () => {})
      it('should render social media links', () => {})
      it('should render "Meet All Guides" CTA', () => {})
    })
    ```
13. Run `npm test` -- all tests must pass
14. Run `npm run lint` -- no errors
15. Run `npm run build` -- final build verification

## Todo List

### i18n
- [x] Add hero.tagline key (EN)
- [x] Add home.video.* keys (EN)
- [x] Add home.seasonal.* keys (EN)
- [x] Add home.guides.* keys (EN)
- [x] Add footer.* keys (EN)
- [x] Translate all new keys to SV
- [x] Translate all new keys to DE
- [x] Validate JSON syntax (all 3 files)

### Tests
- [x] Delete category-nav.test.tsx
- [x] Create video-section.test.tsx (4 tests)
- [x] Create seasonal-tabs.test.tsx (4 tests)
- [x] Create meet-our-guides.test.tsx (4 tests)
- [x] All tests pass
- [x] Lint passes
- [x] Build passes

## Success Criteria
- All new i18n keys present in EN, SV, DE
- No hardcoded English strings in new components
- 12 new unit tests across 3 test files
- All existing + new tests pass
- Build compiles successfully
- Lint clean

## Risk Assessment
- **Medium:** SV/DE translations may need native speaker review
- **Mitigation:** Use professional-quality translations; flag for review before launch
- **Low:** Test mocking for next-intl may require setup
- **Mitigation:** Follow existing test patterns (category-nav.test.tsx uses same setup)

## Security Considerations
- i18n keys must not contain user-generated content
- Test files must not contain secrets or credentials

## Next Steps
After this phase, the homepage redesign is complete. Final steps:
1. Full visual QA across 3 locales on mobile/tablet/desktop
2. Lighthouse audit for performance regression
3. Native speaker review of SV/DE translations
4. Update docs/design-guidelines.md with new section structure
