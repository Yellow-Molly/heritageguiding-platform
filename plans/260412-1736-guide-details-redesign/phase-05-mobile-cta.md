# Phase 05 — Mobile Sticky CTA + Responsive Polish

## Context
- [Design spec](research/researcher-01-design-spec.md) — Mobile Sticky CTA Bar
- Page layout from Phase 3

## Overview
- **Priority:** P2
- **Status:** Pending
- **Effort:** 0.5h
- **Blocked by:** Phase 3 (page layout must exist to place CTA)

New `guide-sticky-cta.tsx` — mobile-only fixed bottom bar with "See Available Tours" button. Also includes final responsive polish pass.

## Key Insights
- Fixed bottom, full width, `bg-surface`, top border
- Button: `--color-accent` bg, white text, calendar icon
- Only shows on mobile (`lg:hidden`)
- Should only render when guide has tours (no point showing CTA for 0 tours)
- Needs `'use client'` for scroll-to-tours behavior (scrolls to tours section)
- Add `pb-20` to main content on mobile to prevent CTA from covering footer/content

## Requirements

**Functional:**
- Fixed bottom bar, z-50, full width
- "See Available Tours" button with calendar icon
- Tapping scrolls to tours section (`#tours` anchor or `scrollIntoView`)
- Hidden on desktop (`lg:hidden`)
- Hidden when guide has 0 tours

**Non-functional:**
- ~40 LOC, `'use client'` directive
- Smooth scroll behavior

## Related Code Files
| Action | File |
|--------|------|
| Create | `apps/web/components/guide/guide-sticky-cta.tsx` |
| Modify | `apps/web/app/(site)/[locale]/(frontend)/guides/[slug]/page.tsx` (add padding-bottom, import CTA) |
| Modify | `apps/web/components/guide/guide-tours-section.tsx` (add `id="tours"` to section) |
| Modify | `apps/web/components/guide/index.ts` (add export) |

## Implementation Steps

1. Create `guide-sticky-cta.tsx`:
   ```
   'use client'
   Props: { guideName: string, tourCount: number }
   - if tourCount === 0, return null
   - useTranslations('guides') for button text
   - onClick: document.getElementById('tours')?.scrollIntoView({ behavior: 'smooth' })
   - Fixed bottom bar: `fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-border)] bg-[var(--color-surface)] p-4 lg:hidden`
   - Button: full-width, accent bg, white text, calendar icon
   ```

2. Add `id="tours"` to `<section>` in `guide-tours-section.tsx`

3. In `page.tsx`, add `pb-20 lg:pb-0` to main element for mobile bottom padding

4. Add `GuideStickyCta` export to `index.ts`

## Responsive Polish (same phase)

5. Review sidebar at `lg` breakpoint (1024px):
   - Sidebar transitions from centered header to fixed panel
   - Verify no content overlap or gap

6. Test touch targets: pills and CTA button should be min 44x44px tap targets

## Todo
- [ ] Create `guide-sticky-cta.tsx`
- [ ] Add `id="tours"` to tours section
- [ ] Add mobile bottom padding to page
- [ ] Export from barrel
- [ ] Verify responsive breakpoint transition at 1024px

## Success Criteria
- Mobile: sticky bottom bar visible with "See Available Tours"
- Tapping scrolls smoothly to tours section
- Desktop: bar not visible
- No content hidden behind sticky bar (padding-bottom)
- Bar hidden when 0 tours

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Sticky bar covers footer on short pages | Low | Medium | `pb-20` padding + test with minimal content |
| iOS Safari bottom safe area | Medium | Low | Add `pb-safe` or `env(safe-area-inset-bottom)` padding |

## Security Considerations
None.

## Next Steps
Phase 7 testing covers this component.
