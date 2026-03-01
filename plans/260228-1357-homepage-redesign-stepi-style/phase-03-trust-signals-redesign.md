# Phase 03: Trust Signals Redesign

## Context Links
- [Plan Overview](./plan.md)
- [Current trust-signals.tsx](../../apps/web/components/home/trust-signals.tsx) (126 lines)
- Stepi reference: horizontal row of 4 stat cards with circular icon backgrounds

## Overview
- **Priority:** P2
- **Status:** complete
- **Description:** Restyle trust signals to match Stepi pattern: horizontal row with circular icon containers, cleaner typography, dark background with gold accents. Keep animated count-up.

## Key Insights
- Current: 4 stats in 2x2 grid (mobile) / 4-col (desktop), navy background, gold icons
- Stepi pattern: circular bordered icon containers, stat number below, label below that
- Keep `useCountUp` hook -- proven animation pattern, good UX
- Keep IntersectionObserver trigger -- only animate when visible
- Background shifts from navy (#1E3A5F) to near-black (#0b0b0b) for dramatic contrast
- i18n keys already exist: `home.trust.*`

## Requirements

### Functional
- 4 stats in horizontal row (2x2 mobile, 4-col tablet+)
- Each stat: circular icon container (bordered circle, gold icon), number+suffix, label
- Animated count-up on scroll into view
- Dark background (#0b0b0b) with white text and gold (#DBC078) icon accents
- Use i18n translation keys for labels

### Non-Functional
- File stays under 130 lines
- Smooth count-up animation with ease-out
- Reduced motion support (already via CSS)

## Architecture
In-place modification of `trust-signals.tsx`. Same export, same location.

## Related Code Files
- **Modify:** `apps/web/components/home/trust-signals.tsx`

## Implementation Steps

1. Keep `useCountUp` hook unchanged
2. Update `StatCard` layout:
   ```tsx
   <div className="flex flex-col items-center text-center">
     {/* Circular icon container */}
     <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full
       border-2 border-[var(--color-secondary)]/30 bg-[var(--color-secondary)]/10">
       <IconComponent className="h-7 w-7 text-[var(--color-secondary)]" />
     </div>
     {/* Number */}
     <div className="mb-1 font-serif text-3xl font-bold text-white md:text-4xl">
       {count}{suffix}
     </div>
     {/* Label */}
     <div className="text-sm text-white/70">{label}</div>
   </div>
   ```
3. Update section background: `bg-[var(--color-primary-dark)]` (resolves to #0b0b0b)
4. Replace hardcoded labels with `t('home.trust.*')` translations
5. Update stat icons: use `Users`, `Compass`, `Star`, `Calendar` from lucide
6. Update stat data to use translation keys instead of hardcoded strings
7. Verify 2x2 grid on mobile, 4-col on md+

## Todo List
- [x] Add circular icon containers with gold border
- [x] Update background to primary-dark
- [x] Use i18n keys for stat labels
- [x] Verify count-up animation still works
- [x] Test 2x2 mobile / 4-col desktop layout
- [x] Verify reduced motion support

## Success Criteria
- Circular icon containers with gold border/bg tint
- Dark background, gold icons, white numbers/labels
- Count-up animation triggers on scroll
- i18n labels for all stats
- Mobile 2x2 layout, desktop 4-col

## Risk Assessment
- **Low:** Self-contained component, minimal deps
- **Note:** Count-up may flash on fast scroll -- already mitigated by IntersectionObserver

## Security Considerations
None.

## Next Steps
Phase 09 positions this section below hero.
