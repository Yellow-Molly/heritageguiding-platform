# Phase 01: Color System Migration

## Context Links
- [Plan Overview](./plan.md)
- [globals.css](../../apps/web/app/globals.css)
- [Design Guidelines](../../docs/design-guidelines.md)

## Overview
- **Priority:** P1 (blocker for all other phases)
- **Status:** complete
- **Description:** Replace navy/gold CSS custom properties with new dark+warm gold palette from logo. Update globals.css, design-guidelines.md, and Tailwind theme config.

## Key Insights
- All components use CSS custom properties via `var(--color-*)` -- changing root values propagates everywhere
- Tailwind v4 `@theme inline` block maps CSS vars to Tailwind utilities
- Heading color `color: var(--color-primary)` will shift from navy to dark charcoal
- Accent coral (#E67E5A) stays unchanged -- used for CTAs
- Focus ring and selection styles reference primary/secondary and need visual QA

## Requirements

### Functional
- Replace all 6 primary/secondary color tokens in `:root`
- Update `@theme inline` block if needed (it references vars, so auto-propagates)
- Update `::selection` background to new secondary
- Heading `color: var(--color-primary)` must pass WCAG AA contrast against #FAFAF8

### Non-Functional
- No visual regression on pages using accent/neutral colors
- Maintain WCAG 2.1 AA contrast ratios (4.5:1 normal, 3:1 large text)

## Architecture
Single-file change to `globals.css` `:root` block. No component changes needed since everything references CSS variables.

## Related Code Files
- **Modify:** `apps/web/app/globals.css` (lines 11-19)
- **Modify:** `docs/design-guidelines.md` (color palette section)

## Implementation Steps

1. Open `apps/web/app/globals.css`
2. Replace `:root` color values:
   ```css
   --color-primary: #252525;
   --color-primary-light: #3e3e3e;
   --color-primary-dark: #0b0b0b;
   --color-secondary: #DBC078;
   --color-secondary-light: #e6d3a0;
   --color-secondary-dark: #d0ad50;
   ```
3. Verify `@theme inline` block still correctly maps vars (it should, since it uses `var()`)
4. Check heading color contrast: #252525 on #FAFAF8 = ~14.5:1 (passes)
5. Check secondary on primary: #DBC078 on #252525 = ~7.5:1 (passes)
6. Update `docs/design-guidelines.md` color palette section with new values
7. Run `npm run build` to verify no compilation errors
8. Visual spot-check on dev server: homepage, tour catalog, tour detail

## Todo List
- [x] Update `:root` primary color tokens (3 values)
- [x] Update `:root` secondary color tokens (3 values)
- [x] Verify `@theme inline` auto-propagation
- [x] Update design-guidelines.md
- [x] Contrast ratio check (heading, CTA, selection)
- [x] Build passes
- [x] Visual QA on 3 pages

## Success Criteria
- All `--color-primary*` and `--color-secondary*` use new hex values
- Build compiles without errors
- WCAG AA contrast maintained
- Design guidelines doc matches code

## Risk Assessment
- **Low:** Since all components use CSS vars, change propagates automatically
- **Medium:** Some hardcoded hex values may exist in components (search for `#1E3A5F`, `#C4A052`)
- **Mitigation:** Grep for old hex values across codebase before marking complete

## Security Considerations
None -- purely cosmetic change.

## Next Steps
All other phases (02-10) can begin once colors are updated.
