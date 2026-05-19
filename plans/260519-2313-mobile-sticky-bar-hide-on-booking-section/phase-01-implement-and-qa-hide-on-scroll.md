---
phase: 01
title: "Implement & QA hide-on-scroll for TourMobilePriceBar"
status: completed
priority: P2
effort: 1-2h
owner: fullstack-developer
---

# Phase 01 — Implement & QA hide-on-scroll for TourMobilePriceBar

## Context Links

- Brainstorm: `plans/reports/brainstorm-260519-2313-mobile-sticky-bar-hide-on-booking-section.md`
- Plan overview: `plans/260519-2313-mobile-sticky-bar-hide-on-booking-section/plan.md`
- Target file: `apps/web/components/tour/tour-mobile-price-bar.tsx`
- Consumer: `apps/web/app/(site)/[locale]/(frontend)/tours/[slug]/page.tsx:72`
- Anchor host: `apps/web/components/tour/booking-section.tsx` (mounted at `#booking` in `page.tsx:88`)

## Overview

- **Priority:** P2 (UX polish, no blocker for go-live)
- **Status:** completed
- **Description:** Convert `tour-mobile-price-bar.tsx` to client component, observe `#booking` via IntersectionObserver, hide bar when booking enters viewport.

## Implementation Notes (post-impl)

**Resolved bug during dev-server QA:** Initial implementation observed `#booking` directly. IntersectionObserver only fires at intersection-state transitions — for a tall booking section, callbacks fire once at full-enter and once at full-exit, never at the precise top-edge crossing of the trigger line. Result: bar didn't hide when widget reached view.

**Fix applied:** Inject a 1px-height, 0-width sentinel as first child of `#booking` via `useEffect` DOM manipulation (cleaned up on unmount). Sentinel is effectively a point, so IO callbacks fire exactly when it crosses the trigger line. Combined with `boundingClientRect.top <= TRIGGER_PX` direction check, state updates correctly at every crossing — including on scroll-back-up.

## Key Insights

- Bar currently server-rendered with `getTranslations` — next-intl supports both server/client, so swap to `useTranslations`.
- `#booking` wrapper exists in initial DOM (server-rendered), so observer can attach immediately on mount regardless of Bokun widget async load.
- `rootMargin: '-130px 0px 0px 0px'` shifts effective viewport top to 130px, making intersection callbacks fire precisely at bar's bottom edge.
- IntersectionObserver only fires on threshold crossings — combined with `boundingClientRect.top` check, state correctly persists when scrolled past the booking section.

## Requirements

### Functional
- Hide bar when `#booking` top reaches/crosses 130px from viewport top.
- Restore bar when scrolling back above trigger.
- Desktop (`lg+`): no change (bar remains `lg:hidden`).
- SSR: bar emitted shown by default; hydration syncs state.

### Non-functional
- Animation via transform + opacity (compositor-only, no layout shift).
- `motion-safe:` Tailwind prefix for `prefers-reduced-motion` users.
- Screen-reader: `aria-hidden` + `tabIndex=-1` when hidden.

## Architecture

Single client component. State `hidden: boolean` driven by IntersectionObserver. No new files; modify in place.

```
TourMobilePriceBar (client)
 ├── useTranslations('tourDetail.booking')   // i18n
 ├── useState(hidden)                         // visibility
 ├── useEffect(IntersectionObserver on #booking, rootMargin -130px)
 └── render with conditional Tailwind classes
```

## Related Code Files

**Modify:**
- `apps/web/components/tour/tour-mobile-price-bar.tsx` — convert to client; add hook + visibility classes.

**Read for context (no edits expected):**
- `apps/web/app/(site)/[locale]/(frontend)/tours/[slug]/page.tsx` — confirms `#booking` anchor wrapper.
- `apps/web/components/tour/booking-section.tsx` — confirms widget mount location.

**No changes:**
- `page.tsx`, `booking-section.tsx`, locale message files.

## Implementation Steps

### 1. Convert to client component
- Add `'use client'` directive at top.
- Remove `import { getTranslations } from 'next-intl/server'`.
- Add `import { useTranslations } from 'next-intl'`.
- Add `import { useEffect, useState } from 'react'`.
- Add `cn` util import (check `apps/web/lib/utils` for existing helper; if absent, use template literal).

### 2. Translations swap
- Change `export async function TourMobilePriceBar({ tour })` → `export function TourMobilePriceBar({ tour })`.
- Replace `const t = await getTranslations(...)` → `const t = useTranslations('tourDetail.booking')`.

### 3. Visibility hook
```tsx
const [hidden, setHidden] = useState(false)

useEffect(() => {
  const target = document.getElementById('booking')
  if (!target) return

  // 130px = header h-20 (80px) + sticky bar content height (~50px).
  // Trigger fires when #booking top crosses the bar's bottom edge.
  const TRIGGER_PX = 130

  const io = new IntersectionObserver(
    ([entry]) => setHidden(entry.boundingClientRect.top <= TRIGGER_PX),
    { rootMargin: `-${TRIGGER_PX}px 0px 0px 0px` }
  )
  io.observe(target)
  return () => io.disconnect()
}, [])
```

### 4. Apply hidden state to root + CTA
- Root `<div>`: append classes conditionally:
  - Base: `motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out`
  - When hidden: `pointer-events-none -translate-y-full opacity-0`
- Add `aria-hidden={hidden}` to root.
- On CTA `<a href="#booking">`: add `tabIndex={hidden ? -1 : undefined}` to remove from focus order when hidden.

### 5. Compile check
- `npm run typecheck` (or `tsc --noEmit` at apps/web).
- `npm run lint` for the changed file.

### 6. Manual mobile QA
Test in browser devtools mobile emulation + real devices if available:
- **iOS Safari** (375×667 / 393×852):
  - Load `/en/tours/<slug>` with Bokun-integrated tour.
  - Verify bar visible on page load.
  - Tap "Book Now" → smooth scroll → bar fades out as `#booking` enters viewport.
  - Continue scroll to footer → bar stays hidden.
  - Scroll back up past `#booking` → bar fades in.
  - VoiceOver: bar not announced when hidden.
- **Chrome Android** (412×915):
  - Repeat above.
- **Desktop ≥1024px**: bar not rendered at all (verify `lg:hidden` unaffected).
- **Reduced motion** (System Prefs / DevTools emulation): no animation, instant hide/show.

## Todo List

- [x] Add `'use client'` and swap imports
- [x] Replace `getTranslations` → `useTranslations`, drop `async`
- [x] Implement IntersectionObserver hook with TRIGGER_PX constant + inline comment
- [x] Apply conditional `translate-y-full opacity-0 pointer-events-none` + transition classes
- [x] Add `aria-hidden` on root + `tabIndex` on CTA
- [x] Fix sentinel-injection bug (callbacks weren't firing at top-edge crossings)
- [x] `npm run typecheck` passes (no errors in changed file)
- [x] `npm run lint` clean on changed file
- [x] Manual QA on dev server localhost:3000

## Success Criteria

- Bar visible on initial load; hides as `#booking` enters viewport (matches scroll-to landing position).
- Stays hidden through end of page including footer.
- Restores on scroll-back-up above booking.
- No console errors, no hydration warnings.
- TypeScript + ESLint pass.
- A11y: screen reader skips hidden bar; keyboard tab order excludes hidden CTA.

## Risk Assessment

| Risk | Likelihood | Mitigation |
|---|---|---|
| Hydration mismatch (server SSR vs client init state) | Low | Default `hidden=false` matches server render; effect updates after mount |
| `#booking` not found at mount time | Very low | Element is server-rendered, exists in initial DOM |
| TRIGGER_PX drift if header height changes | Low | Inline comment + would surface as visible misalignment in QA |
| IO callback fires repeatedly during scroll | None | IO is threshold-based, not scroll-event-based |

## Security Considerations

None. Pure presentational change. No data flow, no user input, no auth surface.

## Next Steps

- Commit on `master` (no feature branch — small UX fix).
- Deploy via standard pipeline.
- Optional follow-up: extract `useElementScrollPast(elementId, triggerPx)` hook if pattern reused elsewhere (YAGNI for now).
