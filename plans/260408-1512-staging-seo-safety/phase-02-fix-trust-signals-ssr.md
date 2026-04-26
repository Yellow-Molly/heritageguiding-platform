# Phase 2: Fix Trust Signals SSR

## Context Links

- Research: [researcher-02-countup-ssr-fix.md](./research/researcher-02-countup-ssr-fix.md)
- Component: `apps/web/components/home/trust-signals.tsx` (147 lines)
- Homepage: `apps/web/app/(site)/[locale]/(frontend)/page.tsx` (passes `guideCount` prop)

## Overview

- **Priority:** P2 (visual issue, not SEO-blocking)
- **Status:** Pending
- **Effort:** 30m
- **Description:** Fix `useCountUp` hook to render target value on SSR, then animate 0->target on client after IntersectionObserver triggers. Eliminates "0+" flash.

## Key Insights

- `useState(0)` causes SSR to render "0" for all stats -- client then animates to target, creating a flash
- Fix: `useState(target)` so SSR renders correct value; `useEffect` resets to 0 then animates to target
- Component already handles `prefers-reduced-motion` (line 20-23) -- must preserve
- IntersectionObserver pattern already in place (line 103-119) -- reuse as-is
- No hydration mismatch: server renders `target`, client hydrates `target`, then `useEffect` triggers animation

## Requirements

### Functional
- SSR HTML contains target stat values (e.g., "7+", "100%", "15+", "98%")
- Client-side animation still runs 0->target when section enters viewport
- `prefers-reduced-motion` users see target immediately (no animation) -- already works
- When `guideCount=0` (empty staging CMS), render "0+" correctly (it IS the value)

### Non-Functional
- No new dependencies
- No hydration mismatch warnings
- Animation behavior unchanged for end users

## Architecture

### State Flow

```
SSR:    useState(target) → renders "7+" in HTML
Hydrate: useState(target) → matches SSR, no mismatch
useEffect fires (isVisible=false): no-op
IntersectionObserver: setIsVisible(true)
useEffect fires (isVisible=true): setCount(0) → animate 0→target
```

The key insight: we need to reset count to 0 inside the useEffect BEFORE starting the animation, so the visual animation still plays 0->target.

## Related Code Files

### Modify
| File | Change |
|------|--------|
| `apps/web/components/home/trust-signals.tsx` | Fix `useCountUp` hook initial state and animation logic |

### No Changes
| File | Reason |
|------|--------|
| Homepage `page.tsx` | Props unchanged |
| Test files | No existing unit tests for this component; adding tests is out of scope |

## Implementation Steps

### Step 1: Fix useCountUp hook

In `apps/web/components/home/trust-signals.tsx`, change the `useCountUp` function (lines 13-49):

**Before (line 14):**
```typescript
const [count, setCount] = useState(0)
```

**After:**
```typescript
const [count, setCount] = useState(target)
```

**Before (lines 16-46, the useEffect body):**
```typescript
useEffect(() => {
  if (!isVisible) return

  /* Skip animation for users who prefer reduced motion */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setCount(target)
    return
  }

  const startTime = Date.now()
  const isDecimal = target % 1 !== 0

  const animate = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    const easeProgress = 1 - Math.pow(1 - progress, 3)
    const currentValue = easeProgress * target

    if (isDecimal) {
      setCount(parseFloat(currentValue.toFixed(1)))
    } else {
      setCount(Math.floor(currentValue))
    }

    if (progress < 1) {
      requestAnimationFrame(animate)
    }
  }

  requestAnimationFrame(animate)
}, [target, duration, isVisible])
```

**After:**
```typescript
useEffect(() => {
  if (!isVisible) return

  /* Skip animation for users who prefer reduced motion */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setCount(target)
    return
  }

  /* Reset to 0 before animating up (SSR rendered target value) */
  setCount(0)

  const startTime = Date.now()
  const isDecimal = target % 1 !== 0

  const animate = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)
    const easeProgress = 1 - Math.pow(1 - progress, 3)
    const currentValue = easeProgress * target

    if (isDecimal) {
      setCount(parseFloat(currentValue.toFixed(1)))
    } else {
      setCount(Math.floor(currentValue))
    }

    if (progress < 1) {
      requestAnimationFrame(animate)
    }
  }

  requestAnimationFrame(animate)
}, [target, duration, isVisible])
```

Changes are minimal:
1. Line 14: `useState(0)` -> `useState(target)`
2. Add `setCount(0)` before animation starts (after reduced-motion check)

## Todo List

- [ ] Change `useState(0)` to `useState(target)` in `useCountUp` hook
- [ ] Add `setCount(0)` before animation start in useEffect
- [ ] Verify SSR output contains target values (view source)
- [ ] Verify animation still plays correctly in browser
- [ ] Run `npm run build` to check for compile errors

## Success Criteria

- SSR HTML for homepage contains stat values like "7+", "100%", "15+", "98%" (not "0+", "0%")
- Animation still visually plays 0->target when section scrolls into view
- No React hydration mismatch warnings in console
- `prefers-reduced-motion` users see target values immediately
- Component stays under 200 lines

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Brief visual flash: target->0->target on very fast connections | Low | Low | `setCount(0)` followed immediately by `requestAnimationFrame(animate)` happens in same tick; browser batches state updates |
| `guideCount=0` on staging shows "0+" | N/A | None | This is correct behavior -- 0 IS the value when no guides exist |
| Hydration mismatch if target changes between SSR and client | Very Low | Low | Target comes from server component prop, same value for both renders |

## Security Considerations

- No security implications; purely visual/UX change

## Next Steps

- Consider adding unit tests for `useCountUp` hook (extract to `apps/web/hooks/use-count-up.ts` if reused elsewhere)
- If count-up is needed in other components, extract hook to shared location
