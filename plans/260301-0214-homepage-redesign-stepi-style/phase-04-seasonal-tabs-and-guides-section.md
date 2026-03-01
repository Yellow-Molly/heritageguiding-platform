# Phase 04 - Seasonal Content Tabs + Meet Our Guides

## Context Links
- [Research Report](research/researcher-01-reference-site-design.md)
- [Guides API](../../apps/web/lib/api/get-guides.ts)
- [Design Guidelines](../../docs/design-guidelines.md)
- [Current CategoryNav (being replaced)](../../apps/web/components/home/category-nav.tsx)
- [Current WhyChooseUs (being replaced)](../../apps/web/components/home/why-choose-us.tsx)

## Overview
- **Priority:** P1
- **Status:** complete
- **Effort:** 1.5h
- **Description:** Two NEW sections replacing CategoryNav and WhyChooseUs. Seasonal tabs show Stockholm experiences by season. Guides section showcases team with circular photos.

## Key Insights
- Stepi seasonal tabs: 4 tabs (Winter/Spring/Summer/Autumn), each reveals image + description. Efficient UX: 4 content blocks in 1 section height
- Stepi guide cards: circular photo, name, title, social media icons row
- Existing `getGuides()` API already returns `name`, `slug`, `photo`, `bioExcerpt` - perfect fit
- CategoryNav and WhyChooseUs are removed entirely; their value props folded into trust signals + guides

## Requirements

### Seasonal Content Tabs
- Section heading: "Explore Stockholm All Year Round" (i18n)
- 4 horizontal tabs: Winter, Spring, Summer, Autumn
- Active tab highlighted with accent color underline
- Content area: image (left) + text (right) on desktop, stacked on mobile
- Each season: hero image, title, 2-3 sentence description, optional CTA
- Tab switching: instant (no page reload), CSS transition on content swap
- Mobile: tabs scroll horizontally if needed, content stacks

### Meet Our Guides
- Section heading: "Meet Our Expert Guides" (i18n)
- Grid of guide cards: 3 cols desktop, 2 cols tablet, 1 col mobile
- Card: circular photo (120px), name, title/role, optional social icons
- Limit to 6 guides max on homepage
- Data source: hardcoded initially (like other sections), with TODO for CMS integration via `getGuides()`
- Link to `/guides` page at bottom

## Architecture

### Seasonal Tabs Structure
```
<section> (bg-[var(--color-background-alt)], py-20)
  <div> (container)
    <div> (section header: label + H2)
    <div> (tab bar: flex, gap-2, border-b)
      <button> x4 (tab buttons, active state with accent underline)
    <div> (tab content, mt-8)
      <div> (grid lg:grid-cols-2, gap-8)
        <div> (image, aspect-[4/3], rounded-2xl)
        <div> (text: h3 + paragraph + optional CTA)
```

Tab state: `useState<'winter' | 'spring' | 'summer' | 'autumn'>('summer')`
Default to current season based on month (nice touch, not required).

### Guide Card Structure
```
<div> (text-center)
  <div> (w-28 h-28 mx-auto, rounded-full, overflow-hidden)
    <Image> (fill, object-cover)
  <h3> (font-serif, mt-4, primary)
  <p> (text-sm, muted - role)
  <div> (flex, justify-center, gap-3, mt-2 - social icons)
    <a> (Facebook) <a> (Instagram)
```

### Guides Section Structure
```
<section> (bg-white, py-20)
  <div> (container)
    <div> (section header: label + H2 + subtitle)
    <div> (grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3, gap-8)
      {guides.map(guide => <GuideCard />)}
    <div> (View All CTA, centered)
```

## Related Code Files

### CREATE
- `apps/web/components/home/seasonal-tabs.tsx` - tab section (~130 LOC)
- `apps/web/components/home/guide-card.tsx` - individual guide card (~50 LOC)
- `apps/web/components/home/guides-section.tsx` - guides grid section (~80 LOC)

### MODIFY
- `apps/web/components/home/index.ts` - add SeasonalTabs, GuidesSection exports; remove CategoryNav, WhyChooseUs
- `apps/web/messages/en.json` - add `home.seasons.*`, `home.guides.*`
- `apps/web/messages/sv.json` - same
- `apps/web/messages/de.json` - same

### REMOVE (deferred to Phase 6 page.tsx update)
- `apps/web/components/home/category-nav.tsx` - replaced by seasonal tabs
- `apps/web/components/home/why-choose-us.tsx` - replaced by guides section

## Implementation Steps

1. **Add i18n keys** to all 3 message files:
   ```json
   "seasons": {
     "label": "Year-Round Experiences",
     "title": "Explore Stockholm All Year Round",
     "winter": {
       "tab": "Winter",
       "title": "Magical Winter Stockholm",
       "description": "Experience the enchanting winter atmosphere with snow-covered Old Town, cozy fika stops, and the Nobel Museum. Winter tours include indoor warming breaks and shorter walking distances.",
       "imageAlt": "Snow-covered Gamla Stan in winter"
     },
     "spring": {
       "tab": "Spring",
       "title": "Stockholm in Bloom",
       "description": "Watch the city come alive with cherry blossoms in Kungstradgarden, outdoor cafes reopening, and longer daylight hours perfect for extended walking tours.",
       "imageAlt": "Cherry blossoms in Kungstradgarden park"
     },
     "summer": {
       "tab": "Summer",
       "title": "Endless Summer Days",
       "description": "Enjoy nearly 24 hours of daylight, archipelago views, and outdoor heritage sites at their best. Summer is peak season with the widest tour selection available.",
       "imageAlt": "Stockholm waterfront in summer sunshine"
     },
     "autumn": {
       "tab": "Autumn",
       "title": "Golden Autumn Colors",
       "description": "Discover Stockholm's parks ablaze with autumn colors. Fewer crowds mean more intimate tours through Djurgarden's forests and Sodermalm's viewpoints.",
       "imageAlt": "Autumn foliage in Djurgarden"
     }
   },
   "guides": {
     "label": "Our Team",
     "title": "Meet Our Expert Guides",
     "subtitle": "Passionate storytellers who bring Stockholm's history to life",
     "viewAll": "Meet All Our Guides",
     "role": "Licensed Guide"
   }
   ```

2. **Create `guide-card.tsx`** (~50 LOC):
   - Props: `name: string`, `photo: string`, `role: string`, `socialLinks?: { facebook?: string; instagram?: string }`
   - Circular photo with `Image` component, `rounded-full overflow-hidden`
   - Name in `font-serif`, role in muted text
   - Social icons: conditional render, `lucide-react` Facebook/Instagram icons
   - Accessible: `aria-label` on social links

3. **Create `guides-section.tsx`** (~80 LOC):
   - Hardcoded guide data array (6 guides with placeholder photos from Unsplash)
   - Section header with label + H2 + subtitle
   - 3-col grid desktop, 2-col tablet, 1-col mobile
   - "Meet All Our Guides" CTA linking to `/guides`
   - IntersectionObserver for fade-in animation
   - TODO comment for CMS integration via `getGuides()`

4. **Create `seasonal-tabs.tsx`** (~130 LOC):
   - Season data object with image URLs (Unsplash Stockholm seasonal photos)
   - Tab bar: 4 buttons with active state (accent underline, bold text)
   - Content area: `grid lg:grid-cols-2 gap-8`
   - Image side: `aspect-[4/3] rounded-2xl overflow-hidden`
   - Text side: H3 + description paragraph
   - Content transition: `transition-opacity duration-300`
   - Mobile: tabs in a flex row with `overflow-x-auto` if needed
   - Use `useTranslations('home.seasons')` for all text

5. **Update barrel export** `index.ts`:
   - Add: `export { SeasonalTabs } from './seasonal-tabs'`
   - Add: `export { GuidesSection } from './guides-section'`
   - Add: `export { GuideCard } from './guide-card'`
   - Keep CategoryNav/WhyChooseUs exports for now (removed in Phase 6)

6. **Verify build** compiles

## Todo List
- [x] Add seasons + guides i18n keys to en/sv/de
- [x] Create guide-card.tsx
- [x] Create guides-section.tsx with hardcoded guide data
- [x] Create seasonal-tabs.tsx with tab switching
- [x] Update barrel export in index.ts
- [x] Verify all files under 200 LOC
- [x] Verify build compiles

## Success Criteria
- Seasonal tabs switch content without page reload
- Active tab has visible accent-color indicator
- Mobile: tabs scroll horizontally, content stacks vertically
- Desktop: image + text side-by-side per season
- Guide cards show circular photos with name and role
- 3/2/1 column responsive grid for guides
- All 3 locales render correctly

## Risk Assessment
- **Low:** Tab switching is pure client state, no API calls
- **Low:** Guide data hardcoded; CMS integration deferred
- **Medium:** Seasonal images need good Stockholm photography; Unsplash has plenty
- **Low:** guide-card.tsx social links optional; graceful fallback if empty

## Security Considerations
- Social media links open in new tab with `rel="noopener noreferrer"`
- No user inputs in either component
- External images via Unsplash (already configured in `next.config.ts`)

## Next Steps
- Phase 05: Blog, Newsletter, Footer updates
