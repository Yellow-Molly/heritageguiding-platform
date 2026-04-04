# Phase 4: WCAG 2.1 AA Accessibility Audit

## Context Links
- [Design Specs — WCAG section](research/researcher-01-design-specs.md)
- [Plan Overview](plan.md)
- Blocked by: Phase 2 and Phase 3 (audit runs on final code)

## Overview
- **Priority**: P1
- **Status**: Complete
- **Effort**: 1h
- **Description**: Run automated and manual accessibility checks on all modified homepage components. Fix any WCAG 2.1 AA violations. Validate color contrast, semantic structure, focus management, touch targets, and reduced motion.

## Key Insights
- Project already has `eslint-plugin-jsx-a11y` configured and `axe-core` available
- Existing WCAG-safe CSS vars: `--color-secondary` (#856C2D, 4.5:1+ on light), `--color-accent` (#C05030, 4.5:1+ on white)
- Known concern: `text-white/60` on navy (#1E3A5F) — ratio ~4.3:1, borderline for normal text (14px), passes for large text (18px+)
- Known concern: `text-white/70` on navy — ratio ~5.8:1, passes AA
- Hero already has good a11y patterns (aria-label, semantic h1)
- All sections already have `aria-label` attributes
- Heading hierarchy: h1 (hero) > h2 (section titles) > h3 (card titles) — must verify after redesign

## Requirements

### Functional
- Zero `eslint-plugin-jsx-a11y` errors across all modified files
- Zero axe-core violations at AA level on homepage
- All interactive elements have visible focus indicators
- All images have descriptive alt text
- Semantic heading hierarchy maintained (h1 > h2 > h3)

### Non-functional
- Touch targets >= 44x44px on all interactive elements
- `prefers-reduced-motion` respected on all animations
- Screen reader announces sections meaningfully
- Keyboard navigation flows logically through sections

## Architecture

### Color Contrast Matrix (verify each)

| Element | Foreground | Background | Ratio | Status |
|---------|-----------|------------|-------|--------|
| Hero title | white | navy #1E3A5F | ~13:1 | PASS |
| Hero subtitle | white/70 | navy | ~5.8:1 | PASS |
| Hero tag | gold #C4A052 | navy | ~4.7:1 | PASS (large text) |
| Trust stat desc | white/60 | navy | ~4.3:1 | CHECK — may need white/70 for <18px |
| Tour card title | navy #1E3A5F | white | ~13:1 | PASS |
| Tour card desc | #6B7280 | white | ~5.2:1 | PASS |
| Tour card meta | #6B7280 | white | ~5.2:1 | PASS |
| Tour "VIEW TOUR" | `--color-accent` #C05030 | white | ~4.6:1 | PASS |
| Featured tag | `--color-secondary` #856C2D | #FAFAF8 | ~4.5:1 | PASS |
| Guide languages mob | white/60 | navy | ~4.3:1 | CHECK |
| Gold separator | #C4A052 | decorative | N/A | N/A |

### Heading Hierarchy Verification
```
<h1> "Discover Stockholm's Rich Heritage" (hero)
  <h2> "Why Travel With Us" (trust)
  <h2> "Discover our most loved..." (featured tours)
    <h3> Tour title 1
    <h3> Tour title 2
    <h3> Tour title 3
  <h2> "Meet Our Guides" (guides)
    <h3> Guide name 1...
  <h2> "Watch Our Video" (video)
```

## Related Code Files

### Audit Targets (all modified in prior phases)
- `apps/web/app/(site)/[locale]/(frontend)/page.tsx`
- `apps/web/components/home/featured-tours.tsx`
- `apps/web/components/home/trust-signals.tsx`
- `apps/web/components/home/guides-preview.tsx`
- `apps/web/components/home/video-highlight.tsx`

### Reference
- `apps/web/app/globals.css` — CSS var values for contrast calculations
- `.eslintrc.*` or `eslint.config.*` — jsx-a11y plugin config

## Implementation Steps

### 1. Run eslint-plugin-jsx-a11y
```bash
npx eslint apps/web/components/home/ apps/web/app/\(site\)/\[locale\]/\(frontend\)/page.tsx
```
Fix any reported violations.

### 2. Run axe-core browser audit
- Start dev server: `npm run dev`
- Open `localhost:3000/en` in Chrome
- Run axe DevTools extension or browser console:
  ```js
  // If axe-core is in devDependencies
  import('axe-core').then(axe => axe.default.run().then(console.log))
  ```
- Document and fix all AA violations

### 3. Fix contrast issues

**If `text-white/60` fails on navy for body text (<18px):**
- Trust section stat descriptions: bump to `text-white/70`
- Guide languages on mobile: bump to `text-white/70`

**Verify coral CTA uses `--color-accent` not raw #E67E5A:**
- Grep for `#E67E5A` or `#e67e5a` — should find zero matches in modified files

### 4. Verify focus indicators
- Tab through all interactive elements on homepage
- Each should show `outline: 2px solid var(--color-primary)` with `outline-offset: 2px`
- If missing, add focus-visible styles:
  ```tsx
  className="... focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2"
  ```

### 5. Verify touch targets
Check these interactive elements meet 44x44px minimum:
- Tour card links (entire card is clickable — passes)
- "VIEW TOUR" CTA (text link — may need padding increase)
- "View All Tours" button (already has px-8 py-3 — passes)
- Guide card links (entire card area — passes)
- Video play button (h-14 w-14 = 56px — passes)

If "VIEW TOUR" text is too small as touch target: the entire card is a Link, so the card itself is the touch target (passes).

### 6. Verify reduced motion
- Enable `prefers-reduced-motion: reduce` in browser DevTools
- Confirm: no translate/opacity animations on card entrance
- Confirm: trust signal count-up skips to final value
- Confirm: hero entrance animation disabled

### 7. Verify semantic HTML
- Check heading hierarchy with browser outline extension
- Ensure no skipped heading levels
- Ensure `main` landmark wraps all sections
- Ensure `aria-label` on all sections is descriptive

### 8. Run full test suite
```bash
npm run lint
npm run test
```

## Todo List
- [x] Run eslint jsx-a11y on all modified files
- [x] Fix any eslint a11y violations
- [x] Run axe-core in browser on homepage
- [x] Fix any axe-core violations
- [x] Verify/fix color contrast for white/60 text on navy
- [x] Grep for raw design colors (#E67E5A, #C4A052 used as text) — replace with CSS vars
- [x] Verify focus indicators on all interactive elements
- [x] Verify touch targets >= 44x44px
- [x] Test reduced motion behavior
- [x] Verify heading hierarchy (h1 > h2 > h3)
- [x] Run full lint
- [x] Run full test suite
- [x] Document any accepted exceptions

## Success Criteria
- Zero eslint-plugin-jsx-a11y errors
- Zero axe-core AA violations (or documented, justified exceptions)
- All color contrast ratios >= 4.5:1 for normal text, >= 3:1 for large text
- Focus indicators visible on all interactive elements
- Reduced motion fully supported
- Heading hierarchy sequential (no skipped levels)
- All tests pass

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| white/60 contrast fails AA | High | Medium | Bump to white/70; visually minimal difference |
| axe-core finds issue in unmodified component | Low | Low | Fix if easy, document if inherited from prior code |
| Focus styles conflict with design | Low | Low | Use focus-visible (only shows on keyboard nav) |

## Security Considerations
- No user input changes
- No API changes
- Accessibility improvements have no security implications

## Next Steps
- After this phase, homepage redesign is complete
- Create PR for review
- Update project roadmap and changelog via docs-manager
