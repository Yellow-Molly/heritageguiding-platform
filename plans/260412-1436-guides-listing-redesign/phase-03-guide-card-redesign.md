# Phase 03: Guide Card Redesign

## Context Links
- Current card: `apps/web/components/guide/guide-listing-card.tsx`
- Badge component: `apps/web/components/ui/badge.tsx`
- Design tokens: Navy `--color-primary`, Gold `--color-secondary`, Coral `--color-accent`

## Overview
- **Priority:** High (core visual change)
- **Status:** Complete
- **Description:** Redesign guide card from horizontal layout to portrait gallery style with circular photo, centered content, stats line.

## Key Insights
- Current card is 96 lines — redesign stays within 200-line limit
- Card remains `'use client'` for hover interactions and Link component
- Reuse existing `Badge`, `Card`, `CardContent` components
- Photo size increases from 96px to **160px desktop / 120px mobile**

## Requirements

### Functional
- Large circular photo centered: **160px desktop, 120px mobile**, with **3px / 2px gold border** (`$--color-secondary-light`, outside)
- Card cornerRadius: **20px desktop, 16px mobile**
- Card padding: `[40, 24, 24, 24]` desktop / `[28, 16, 16, 16]` mobile
- Name: Playfair Display **22px desktop / 20px mobile**, bold, centered, navy
- Max 2 specialization tags: `$--color-background-alt` fill, **cornerRadius 12/10**, padding `[4,10]`/`[3,8]`, fontSize **11/10**
- Bio excerpt: italic, fontSize **13/12**, lineHeight **1.6/1.5**, centered, fill-width
- Info section: **border-top** `$--color-border-light` 1px, padding-top 12/10
- Globe icon (13/12px) + languages, MapPin icon (13/12px) + areas, both `$--color-text-light` icons
- Stats line in **gold** (`$--color-secondary`): "{N} tours" **fontWeight 600** + "·" separator + **credential-first** (first credential if exists, else "{years}+ years", else omit second part)
- Desktop stats: tour count gold + separator + credential/years muted (3 separate elements)
- Mobile stats: single line all gold bold: "4 tours · 10+ years experience"
- Entire card links to guide detail

### Non-Functional
- Responsive: works at all breakpoints within grid
- Accessible: alt text on images, semantic heading levels
- Smooth hover transition on card shadow

## Architecture

```
GuideListingCard (client component)
├── Card wrapper (link to /guides/{slug}, rounded-[20px] / rounded-2xl)
│   ├── Circular photo (160px/120px) + 3px/2px gold border, or initial fallback
│   ├── h3 guide name (Playfair 22/20px, navy)
│   ├── Specialization tags (max 2, bg-alt pills, rounded-xl)
│   ├── Bio excerpt (italic 13/12px, quoted, line-clamp-2)
│   ├── Info section (border-top, pt-3)
│   │   ├── Globe 13/12px + languages
│   │   ├── MapPin 13/12px + areas
│   │   └── Stats: "{N} tours" (gold bold) · credential|years (muted)
```

## Related Code Files
- **Modify:** `apps/web/components/guide/guide-listing-card.tsx` — complete redesign

## Implementation Steps

1. Update `GuideListingCardProps` to accept extended `GuideListItem` (with `tourCount`, `yearsExperience`)
2. Restructure JSX:
   - Wrap entire card in `Link` to `/guides/${guide.slug}`
   - Center all content with `text-center` and `items-center`
   - Photo: `h-[160px] w-[160px] md:h-[160px] md:w-[160px] h-[120px] w-[120px] rounded-full` + ring `ring-3 md:ring-3 ring-2 ring-[var(--color-secondary-light)]`
   - Name: `font-serif text-[20px] lg:text-[22px] font-bold text-[var(--color-primary)]`
   - Tags: custom pills with `bg-[var(--color-background-alt)] rounded-xl px-2.5 py-1 text-[11px]`, max 2
   - Bio: `italic text-[13px] lg:text-[13px] text-[12px] text-[var(--color-text-muted)] line-clamp-2` with curly quotes
   - Info section: `border-t border-[var(--color-border-light)] pt-3`, gap-1.5
   - Language/Area: 13px/12px icons `text-[var(--color-text-light)]` + text
   - Stats: `text-[12px] font-semibold text-[var(--color-secondary)]` for tour count, `text-[var(--color-text-muted)]` for credential/years
   - Credential-first logic: `guide.credentials?.[0]?.credential ?? (guide.yearsExperience ? \`${guide.yearsExperience}+ years\` : null)`
3. Keep hover effect: `transition-shadow hover:shadow-[var(--shadow-card-hover)]`
4. Graceful fallbacks: no stats line if both tourCount=0 and no yearsExperience

## Todo List
- [ ] Redesign card layout to portrait gallery style
- [ ] Increase photo size to 140px circle
- [ ] Add stats line (tour count + experience)
- [ ] Add credential display
- [ ] Add italic bio with quotes
- [ ] Limit specialization badges to 2
- [ ] Verify hover and focus states

## Success Criteria
- Card visually matches "Guides - Option A" design
- All content displays correctly with real CMS data
- Card is under 150 lines
- No accessibility regressions (alt text, focus outlines)

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Long names overflow on narrow cards | Medium | Low | line-clamp and truncation on name |
| Missing photo looks awkward at 140px | Low | Medium | Initial fallback circle with larger font size |

## Security Considerations
- None (display component, no user input)

## Next Steps
- Phase 5 uses this card in the grid layout
