# Phase 06: Testimonials Polish

## Context Links
- [Plan Overview](./plan.md)
- [Current testimonials.tsx](../../apps/web/components/home/testimonials.tsx) (234 lines)
- Stepi reference: clean carousel with avatar, stars, quote text, author info

## Overview
- **Priority:** P3
- **Status:** complete
- **Description:** Polish testimonials section to align with new color palette and Stepi aesthetic. Minor visual updates, not a full rewrite. Update colors, refine card styling, add i18n keys.

## Key Insights
- Current carousel is well-built: auto-play, dot navigation, prev/next buttons, accessible
- Main changes: color token updates (auto from Phase 01), slight visual refinements
- Stepi testimonials are simpler -- single card with large quote, avatar, name
- Keep existing carousel logic -- it works well and is accessible
- 234 lines is over the 200-line target; consider minor trimming

## Requirements

### Functional
- Keep existing carousel with auto-play + manual navigation
- Update section background to `bg-[var(--color-surface)]` (white) for contrast
- Quote card: white card on white bg with subtle border instead of shadow alone
- Gold accent on quote icon instead of primary/10
- Navigation dots: use secondary color for active dot instead of accent
- Replace hardcoded English text with i18n translation keys

### Non-Functional
- Trim file to ~200 lines (remove unnecessary whitespace, inline small things)
- Keep all accessibility: aria-labels, aria-hidden, aria-current
- Keep reduced motion support

## Architecture
In-place modification of `testimonials.tsx`. Same export, same file.

## Related Code Files
- **Modify:** `apps/web/components/home/testimonials.tsx`

## Implementation Steps

1. Update section background: `bg-[var(--color-surface)]` with subtle top/bottom border
2. Update Quote icon color: `text-[var(--color-secondary)]/20` (gold tint)
3. Update card styling:
   - Add `border border-[var(--color-border)]` to card
   - Keep rounded-2xl and shadow
4. Update active dot: `bg-[var(--color-secondary)]` instead of `bg-[var(--color-accent)]`
5. Update nav button hover: use secondary gold instead of primary navy
6. Replace hardcoded text with i18n keys:
   - Section tagline, title, subtitle
   - Navigation aria-labels already use generic text (keep)
7. Tour name text: use `text-[var(--color-secondary-dark)]` instead of accent
8. Trim whitespace and consolidate styles to hit ~200 lines
9. Color token refs auto-update from Phase 01

## Todo List
- [x] Update section background styling
- [x] Quote icon color to gold tint
- [x] Card border addition
- [x] Active dot color to secondary
- [x] Nav button hover to secondary
- [x] i18n keys for section header
- [x] Tour name color update
- [x] Trim to ~200 lines

## Success Criteria
- Visual consistency with new dark+gold palette
- Carousel functionality unchanged
- i18n keys for all visible text
- File ~200 lines
- Accessibility maintained

## Risk Assessment
- **Very Low:** Cosmetic changes only, no logic changes
- Carousel behavior stays identical

## Security Considerations
None.

## Next Steps
Phase 09 positions testimonials after FeaturedTours in page.tsx.
