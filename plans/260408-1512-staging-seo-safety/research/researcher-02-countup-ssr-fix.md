# Count-Up Animation SSR Hydration Fix Research

**Date:** 2026-04-08 | **Status:** Complete

## Problem Summary

Count-up animations using `useState(0)` cause hydration mismatches: SSR renders target value (e.g., `1,234`), but client hydration initializes to `0`, causing React to throw hydration mismatch errors.

## Core Pattern: Render Target on SSR, Animate on Client

**Why this works:**
- Server renders HTML with target value → client hydrates the same value → zero mismatch
- `useEffect` runs only on client after hydration completes → animation begins safely
- No suppressHydrationWarning hack needed; no flicker

## Implementation Pattern

```typescript
'use client';

export function CountUpValue({ target }: { target: number }) {
  const [displayValue, setDisplayValue] = useState(target); // Match SSR
  
  useEffect(() => {
    // Trigger animation only on client, after hydration
    animateCount(0, target, (val) => setDisplayValue(val));
  }, [target]);

  return <span>{displayValue.toLocaleString()}</span>;
}
```

**Key detail:** `useState(target)` not `useState(0)`. SSR renders `target`, client hydrates `target`, animation uses `useEffect` to transition from 0→target visually while maintaining value state.

## Advanced: Intersection Observer Pattern

Combine with `IntersectionObserver` for viewport-triggered animations (avoid animating off-screen counters):

```typescript
'use client';

export function CountUpOnView({ target }: { target: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [displayValue, setDisplayValue] = useState(target);
  
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        animateCount(0, target, setDisplayValue);
        observer.unobserve(entry.target);
      }
    });
    
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{displayValue.toLocaleString()}</span>;
}
```

## Library Options

### react-countup
- **Pros:** Mature, well-tested, configurable duration/decimals
- **Cons:** Requires `'use client'` wrapper in server components; GitHub issue #806 documents Next.js integration
- **Pattern:** Wrap in `'use client'` boundary, pass `target` value from Server Component

### use-count-up (Lighter Alternative)
- Simpler API, smaller bundle
- Same SSR pattern applies (client component + useState(target))

### Custom useEffect Implementation
- **Best for control:** Full command over animation timing, easing, Intersection Observer
- **Lowest bundle impact**
- **React 19 compatible:** Works with async `params`/`searchParams`

## Hydration Fixes Ranked by Preference

| Approach | Pro | Con | Risk |
|----------|-----|-----|------|
| **useState(target) + useEffect** | No flicker, matches SSR, simple | Requires client component | Low |
| **useLayoutEffect** | Synchronous paint prevention | Complex timing, SSR incompatible | Medium |
| **suppressHydrationWarning** | Quick fix | Hides real issues, not recommended | High |
| **Inline script hack** | Works pre-hydration | Breaks framework patterns | Very High |

## React 19 Specifics

- `useEffect` runs correctly after async `params`/`searchParams` resolve
- No special handling needed; pattern is identical to React 18
- `useLayoutEffect` still SSR-incompatible (will error on server)

## Recommendation

**Use custom `useLayoutEffect` for client-side-only animations** (not SSR):
1. Initialize state with target value (renders correctly on SSR)
2. Wrap animation logic in `useLayoutEffect` for zero-flicker
3. Add `IntersectionObserver` to trigger only on viewport enter
4. For Server Components: create wrapper `'use client'` boundary that receives target value as prop

This avoids library overhead, prevents hydration errors entirely, and leverages native browser APIs.

---

### Unresolved Questions
- What easing function does the design call for? (linear, easeOut, spring?)
- Should animations respect `prefers-reduced-motion` for accessibility?
- Are there specific performance targets for animation duration?

### Sources
- [How to Fix Hydration Mismatch Errors in Next.js](https://oneuptime.com/blog/post/2026-01-24-fix-hydration-mismatch-errors-nextjs/view)
- [Next.js React Hydration Error Docs](https://nextjs.org/docs/messages/react-hydration-error)
- [SSR-Safe React Hooks Guide](https://reactuse.com/blog/ssr-safe-react-hooks/)
- [react-countup npm](https://www.npmjs.com/package/react-countup)
- [react-countup GitHub Issue #806](https://github.com/glennreyes/react-countup/issues/806)
- [Power of useLayoutEffect for Hydration Errors](https://dev.to/kawanedres/power-of-uselayouteffect-for-solving-hydration-error-in-next-js-4ekm)
- [React useOptimistic Documentation](https://react.dev/reference/react/useOptimistic)
- [Intersection Observer API Guide](https://www.builder.io/blog/react-intersection-observer)
