# Phase 4: Redesign Guide Detail Page (Frontend)

## Context Links
- Design spec: Option B "Split Profile" (see task summary)
- Current page: `apps/web/app/(site)/[locale]/(frontend)/guides/[slug]/page.tsx` (102 lines)
- Current components: `apps/web/components/guide/` (10 files + barrel index)
- API layer: `apps/web/lib/api/get-guide-by-slug.ts` (updated in Phase 2)
- i18n keys: `apps/web/messages/{sv,en,de}.json` → `guides` namespace
- UI components: `apps/web/components/ui/` (badge, button, etc.)
- CSS vars: `apps/web/app/globals.css` `:root` block

## Overview
- **Priority:** P1
- **Status:** Pending
- **Effort:** 5h
- **Blocked by:** Phase 3 (needs populated CMS fields)

Implement Option B "Split Profile" desktop/mobile layout. Update existing components, create new section components for structured guide data.

## Key Insights
- Existing `GuideDetailSidebar` (159 lines) already has the right structure — needs refinement, not rewrite. Add tagline, adjust photo size, split tour languages vs "Also Speaks", move specializations out.
- `GuideDetailBio` (29 lines) becomes simpler — just heading + paragraphs (already close).
- New components needed: expertise bullets, quote card, approach section, guest feedback, sticky mobile CTA.
- `GuideToursSection` needs grid change: current is 3-col desktop → design wants 2-col with 24px gap.
- All new section components should be **server components** (use `getTranslations`) since they just render text. No interactivity needed.
- Sticky mobile CTA is the only `'use client'` candidate (needs scroll detection or just CSS `sticky`).

## Requirements

### Functional — Desktop (1440px, split layout)
1. Left sidebar 450px, surface bg, right border:
   - Circular photo 160px (no border stroke)
   - Name: Playfair 28px bold, primary color
   - Tagline: "Heritage Guide — Stockholm" (Inter 14px, muted)
   - Gold divider: 2px, 60px width
   - Tour Languages: icon + label + pill tags (rounded-full, alt bg)
   - Areas: icon + label + pill tags
   - Divider (1px, border-light)
   - Credentials: list with colored icons + text
   - Divider
   - Also Speaks: outlined pill tags (separate from tour languages)

2. Right column (fill, padding 40px/64px):
   - Breadcrumb (Home / Guides / Name)
   - About {Name}: Playfair 32px + 2 bio paragraphs (Inter 15px, 1.7 line-height)
   - Divider
   - Areas of Expertise: sparkles icon + Playfair 22px heading + bullet list (gold dots, pl-18px)
   - Quote card: rounded-2xl, surface bg, secondary 1.5px border, large quote marks (Playfair 64px), quote text (Playfair 20px italic), gold divider, body text, attribution
   - Guiding Approach: compass icon + heading + paragraph
   - What Guests Say: heart icon + heading + paragraph (alt bg card, rounded-2xl, p-28px)
   - Tours by {Name}: Playfair 28px bold + 2-col grid (24px gap)

### Functional — Mobile (375px, stacked)
3. Header card: surface bg, photo 120px, name 24px, tagline, divider, languages/areas/credentials
4. Content sections stacked with section padding
5. Sticky CTA bar at bottom: "Book a Tour with {Name}" button

### Non-Functional
- Null-safe: sections with empty data render nothing (no empty cards)
- Server components by default
- All text via i18n (`useTranslations` / `getTranslations`)
- CSS vars for all colors (no hardcoded hex)
- Each component file under 200 LOC

## Architecture

### Component Tree
```
page.tsx (server)
├── GuideDetailSchema (existing SEO)
├── Header (existing)
├── main
│   ├── Breadcrumb (mobile, existing)
│   ├── flex container (lg:flex-row)
│   │   ├── GuideDetailSidebar (server, UPDATED)
│   │   │   ├── photo, name, tagline, divider
│   │   │   ├── SidebarSection: Tour Languages
│   │   │   ├── SidebarSection: Areas
│   │   │   ├── hr + Credentials list
│   │   │   ├── hr + Also Speaks
│   │   │   └── (no specializations — moved to right column)
│   │   │
│   │   └── right column
│   │       ├── Breadcrumb (desktop, existing)
│   │       ├── GuideDetailBio (server, UPDATED — plain bio only)
│   │       ├── hr
│   │       ├── GuideExpertiseSection (server, NEW)
│   │       ├── GuideQuoteSection (server, NEW)
│   │       ├── GuideApproachSection (server, NEW)
│   │       ├── GuideGuestFeedbackSection (server, NEW)
│   │       └── GuideToursSection (server, UPDATED — 2-col grid)
│   │
│   └── GuideStickyCta (client, NEW — mobile only)
├── Footer (existing)
```

### File Ownership (no overlapping edits between phases)
- Phase 4 owns ALL files in `apps/web/components/guide/` and `apps/web/app/(site)/[locale]/(frontend)/guides/[slug]/page.tsx`
- Phase 2 owns `apps/web/lib/api/get-guide-by-slug.ts` (done before Phase 4 starts)

## Related Code Files

### Modify
- `apps/web/components/guide/guide-detail-sidebar.tsx` — add tagline, split languages vs also-speaks, remove specializations section
- `apps/web/components/guide/guide-detail-bio.tsx` — simplify (already close to target)
- `apps/web/components/guide/guide-tours-section.tsx` — change grid to 2-col, 24px gap
- `apps/web/components/guide/index.ts` — add new component exports
- `apps/web/app/(site)/[locale]/(frontend)/guides/[slug]/page.tsx` — add new sections to right column, add sticky CTA
- `apps/web/messages/en.json` — add new i18n keys under `guides`
- `apps/web/messages/sv.json` — add new i18n keys
- `apps/web/messages/de.json` — add new i18n keys

### Create
- `apps/web/components/guide/guide-expertise-section.tsx` — bullet list with gold dots
- `apps/web/components/guide/guide-quote-section.tsx` — styled quote card
- `apps/web/components/guide/guide-approach-section.tsx` — guiding approach paragraph
- `apps/web/components/guide/guide-guest-feedback-section.tsx` — what guests say card
- `apps/web/components/guide/guide-sticky-cta.tsx` — mobile sticky bottom bar

## Implementation Steps

### Step 1: Add i18n Keys
Add to all 3 locale files under `guides` namespace:
```json
{
  "tagline": "Heritage Guide — Stockholm",
  "sidebar.tourLanguages": "Tour Languages",
  "sidebar.alsoSpeaks": "Also Speaks",
  "expertise.title": "Areas of Expertise",
  "quote.attribution": "— {name}",
  "approach.title": "Guiding Approach",
  "guestFeedback.title": "What Guests Say",
  "bookTour": "Book a Tour with {name}",
  "bookTourCta": "Book a Tour"
}
```
Note: `sidebar.languages` key already exists — rename usage to `sidebar.tourLanguages`.

### Step 2: Update GuideDetailSidebar
1. Add tagline below name: `"Heritage Guide — Stockholm"` via `t('tagline')`
2. Split languages: `guide.languages` = tour languages section; `guide.additionalLanguages` = "Also Speaks" section (outlined pills, not filled)
3. Remove specializations section (moved to right column expertise section)
4. Adjust photo to 160px on both breakpoints (currently 160px mobile, 200px desktop → both 160px)
5. Ensure no border stroke on photo circle

### Step 3: Create GuideExpertiseSection
```
apps/web/components/guide/guide-expertise-section.tsx (~60 lines)
```
- Props: `specialtyDescriptions: Array<{description: string}>`, no guide prop needed
- Sparkles icon (lucide) + heading (Playfair 22px)
- Unordered list with gold dot markers (`list-disc` + custom marker color via `marker:text-[var(--color-secondary)]`)
- Left padding 18px on list items
- Return null if empty array

### Step 4: Create GuideQuoteSection
```
apps/web/components/guide/guide-quote-section.tsx (~70 lines)
```
- Props: `quote: string | null, body: string | null, guideName: string`
- Card: `rounded-2xl bg-[var(--color-surface)] border-[1.5px] border-[var(--color-secondary)]`
- Large open-quote mark: Playfair 64px, secondary color, `leading-[0.5]`
- Quote text: Playfair 20px italic medium, primary color
- Gold divider: 2px × 40px
- Body text: Inter 15px, muted, 1.7 line-height
- Attribution: `"— {Name}"` Inter 13px 600, secondary color
- Return null if quote is null/empty

### Step 5: Create GuideApproachSection
```
apps/web/components/guide/guide-approach-section.tsx (~40 lines)
```
- Props: `guideStyle: string | null`
- Compass icon (lucide) + heading + paragraph
- Return null if guideStyle is null/empty

### Step 6: Create GuideGuestFeedbackSection
```
apps/web/components/guide/guide-guest-feedback-section.tsx (~45 lines)
```
- Props: `whatGuestsAppreciate: string | null`
- Card wrapper: `rounded-2xl bg-[var(--color-background-alt)] p-7`
- Heart icon (lucide) + heading + paragraph
- Return null if null/empty

### Step 7: Create GuideStickyCta
```
apps/web/components/guide/guide-sticky-cta.tsx (~35 lines)
```
- `'use client'` — only for CSS sticky behavior + link navigation
- Props: `guideName: string, guideSlug: string`
- Fixed bottom bar on mobile: `fixed bottom-0 left-0 right-0 lg:hidden`
- Surface bg, border-top, padding, shadow
- Button: "Book a Tour with {Name}" → links to `/tours?guide={slug}` or `#tours` anchor
- Uses `getButtonClassName('primary', 'lg')` for button styling

### Step 8: Update GuideToursSection
- Change grid: `grid-cols-1 md:grid-cols-2 xl:grid-cols-3` → `grid-cols-1 lg:grid-cols-2`
- Change gap: `gap-3 xl:gap-5` → `gap-6`
- Remove `justify-items-center`

### Step 9: Update page.tsx
1. Import new components
2. Add sections to right column in order: Bio → hr → Expertise → Quote → Approach → GuestFeedback → Tours
3. Add `<GuideStickyCta>` after main, before Footer
4. Pass new fields from `guide` object to new components
5. Add bottom padding to main to account for sticky CTA on mobile: `pb-20 lg:pb-0`

### Step 10: Update barrel index.ts
Add exports for 5 new components.

## Todo

- [ ] Add i18n keys to en.json, sv.json, de.json
- [ ] Update `guide-detail-sidebar.tsx` — tagline, split languages, remove specializations
- [ ] Update `guide-detail-bio.tsx` — verify plain bio rendering (may need no changes)
- [ ] Create `guide-expertise-section.tsx`
- [ ] Create `guide-quote-section.tsx`
- [ ] Create `guide-approach-section.tsx`
- [ ] Create `guide-guest-feedback-section.tsx`
- [ ] Create `guide-sticky-cta.tsx`
- [ ] Update `guide-tours-section.tsx` — 2-col grid, 24px gap
- [ ] Update `page.tsx` — compose new layout
- [ ] Update `index.ts` — add new exports
- [ ] Visual check: desktop 1440px layout
- [ ] Visual check: mobile 375px layout
- [ ] Verify null-safe: guide with no quote/guideStyle renders without empty sections

## Success Criteria
- Desktop: left sidebar 450px with photo/name/tagline/languages/areas/credentials/also-speaks
- Desktop: right column shows bio, expertise bullets, quote card, approach, guest feedback, tours (2-col)
- Mobile: stacked layout with header card, content sections, sticky CTA at bottom
- All text rendered via i18n (no hardcoded strings)
- All colors use CSS vars (no hex literals)
- Empty sections (null fields) render nothing
- Each component file under 200 LOC
- `npx tsc --noEmit` passes
- No hydration errors (server components except sticky CTA)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Bio richText still contains merged sections (Phase 3 incomplete) | Low | High | Phase 3 must complete first; verify in CMS admin before starting Phase 4 |
| Gold dot markers not supported in all browsers | Low | Low | Use `marker:` Tailwind modifier or pseudo-element fallback |
| Sticky CTA overlaps footer on mobile | Medium | Medium | Add `pb-20` to main; test scroll behavior |
| Existing guide listing pages break | Low | Medium | This phase only changes detail page + shared components; listing uses different components |
| i18n key conflicts with existing keys | Low | Low | New keys are namespaced under existing `guides` namespace; check for collisions |

## Security Considerations
- No new API endpoints
- No user input handling
- All data server-rendered from CMS

## Next Steps
- Phase 5: visual verification, test updates, lint/build checks
