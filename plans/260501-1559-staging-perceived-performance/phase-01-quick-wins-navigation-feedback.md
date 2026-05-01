---
phase: 1
title: "Quick Wins — Navigation Feedback"
status: pending
priority: P0
effort: 1 day (~6h)
---

# Phase 1: Quick Wins — Navigation Feedback

## Context
- [Plan overview](plan.md)
- [Brainstorm report](../reports/brainstorm-260501-1559-staging-perceived-performance.md)
- Independent phase — no blockers, ship immediately.

## Overview
Eliminate "frozen" perception on click. Three independent tracks, each shippable separately:
1. `loading.tsx` skeletons → instant page transition feedback.
2. `useLinkStatus` pending UI → instant tap feedback on cards/links.
3. `'use client'` audit → reduce hydration cost on mobile.

Plus dead-config cleanup (Webpack residual).

## Key Insights
- Browser stays on old page during RSC fetch — `loading.tsx` is the **only** way to show feedback during this gap.
- `useLinkStatus` is Next.js 16 native, exists exclusively for this UX gap.
- 64 client components — only ~10–20 use hooks/state. Rest are dead `'use client'` weight.
- Phase 1 work has zero overlap with `260404-1815-performance-overhaul` (which targeted images/LCP).

## Requirements

### Functional
- Every primary route segment renders a skeleton within ~100ms of click.
- Tour cards, guide cards, header nav links show pending state during navigation.
- Static content components rendered as Server Components (no JS shipped).

### Non-functional
- No regression in build (each `'use client'` removal verified by build).
- No regression in interactivity tests (existing 1009 unit tests must pass).
- Skeleton must not flash <50ms on fast connections (use existing `tour-grid-skeleton.tsx` patterns).

## Architecture

### Track A: loading.tsx Skeletons

Add per-route segment Suspense fallbacks. Reuse existing skeleton components.

```
app/(site)/[locale]/(frontend)/
├── loading.tsx                         (NEW — generic page skeleton)
├── tours/
│   ├── loading.tsx                     (NEW — reuse tour-grid-skeleton.tsx)
│   └── [slug]/
│       └── loading.tsx                 (NEW — tour detail skeleton)
├── guides/
│   ├── loading.tsx                     (NEW — guide grid skeleton)
│   └── [slug]/
│       └── loading.tsx                 (NEW — guide detail skeleton)
└── find-tour/
    └── loading.tsx                     (NEW — wizard skeleton)
```

### Track B: useLinkStatus Pending UI

Wrap Link children with `<NavigationPending>` helper component. When parent Link is pending, dim + spinner overlay.

```tsx
// components/shared/navigation-pending.tsx (NEW)
'use client'
import { useLinkStatus } from 'next/link'
export function NavigationPending({ children }: { children: React.ReactNode }) {
  const { pending } = useLinkStatus()
  return (
    <span className={pending ? 'opacity-60 pointer-events-none transition-opacity' : ''}>
      {children}
      {pending && <span className="absolute inset-0 flex items-center justify-center"><Spinner /></span>}
    </span>
  )
}
```

Apply inside `<Link>` children only — not on the Link itself.

### Track C: 'use client' Audit

Convert obvious static components to Server Components. **Verify each** — only remove if no hooks/state/event handlers/browser APIs.

**Confirmed candidates (verify per-component before removing):**
- `pages/about-hero-section.tsx`
- `pages/about-cta-section.tsx`
- `pages/about-mission-vision-section.tsx`
- `pages/about-story-section.tsx`
- `pages/about-responsible-tourism-section.tsx`
- `pages/about-certifications-section.tsx`
- `pages/values-section.tsx`
- `home/trust-signals.tsx`
- `home/seasonal-cta.tsx`
- `home/video-highlight.tsx` (verify — may have play handler)
- `home/guides-preview.tsx`
- `seo/about-schema.tsx`, `seo/guide-detail-schema.tsx`, `seo/tour-list-schema.tsx`, `seo/guide-list-schema.tsx`, `seo/faq-schema.tsx` (these are JSON-LD, definitely RSC)

### Track D: Dead Webpack Config

`next.config.ts` has webpack block that Turbopack ignores. Either remove or convert to Turbopack equivalent.

## Related Code Files

### Files to create
- `apps/web/app/(site)/[locale]/(frontend)/loading.tsx`
- `apps/web/app/(site)/[locale]/(frontend)/tours/loading.tsx`
- `apps/web/app/(site)/[locale]/(frontend)/tours/[slug]/loading.tsx`
- `apps/web/app/(site)/[locale]/(frontend)/guides/loading.tsx`
- `apps/web/app/(site)/[locale]/(frontend)/guides/[slug]/loading.tsx`
- `apps/web/app/(site)/[locale]/(frontend)/find-tour/loading.tsx`
- `apps/web/components/shared/navigation-pending.tsx`

### Files to modify
- `apps/web/components/tour/tour-card.tsx` — wrap link children in `<NavigationPending>`
- `apps/web/components/tour/related-tour-card.tsx` — same
- `apps/web/components/guide/guide-listing-card.tsx` — same
- `apps/web/components/layout/header.tsx` — pending state on nav links
- `apps/web/next.config.ts` — remove dead webpack config
- ~10–20 components above — strip `'use client'` directive

### Files to read for context
- `apps/web/components/tour/tour-grid-skeleton.tsx` — reuse pattern
- `apps/web/components/shared/loading-spinner.tsx` — reuse spinner

## Implementation Steps

### Step 1: Track A — loading.tsx (1.5h)
1. Read existing `tour-grid-skeleton.tsx` for pattern.
2. Create root `loading.tsx` with generic page skeleton (header + content placeholders).
3. Create per-route `loading.tsx` files reusing skeleton components where possible.
4. Test by throttling network to Slow 4G — verify skeleton appears instantly on click.

### Step 2: Track B — useLinkStatus (1.5h)
1. Create `components/shared/navigation-pending.tsx`.
2. Apply to `tour-card.tsx`, `related-tour-card.tsx`, `guide-listing-card.tsx` first.
3. Apply to header nav links last (lower-priority, smaller surface).
4. Test pending state visible during RSC fetch on Slow 4G.

### Step 3: Track C — 'use client' audit (2.5h)
1. **Batch in groups of 3–5**, build after each batch.
2. Group 1: Pure JSON-LD (`seo/*`) — zero risk.
3. Group 2: About page sections (verify no useState/useEffect).
4. Group 3: Home sections (verify no event handlers).
5. After each batch: `npm run build` — fix any "Hook X is not allowed in Server Component" errors by reverting that component.
6. Run smoke test on `/`, `/about-us`, `/find-tour` after each group.

### Step 4: Track D — Webpack cleanup (0.5h)
1. Verify build still succeeds with Turbopack only.
2. Remove webpack block from `next.config.ts` if not needed.
3. If module resolution still required, document as Turbopack-pending or convert.

### Step 5: Local validation (1h)
1. Run on local with `npm run dev`.
2. Throttle DevTools to "Slow 4G + 4x CPU".
3. Click each card type, nav link — verify <100ms feedback.
4. Run `npm test` — ensure 1009 tests still pass.
5. Run `npm run build` — verify no errors.

### Step 6: Deploy & verify on staging
1. Push to feature branch.
2. Deploy to staging.
3. Test on actual mobile device (or BrowserStack) — confirm freeze symptom gone.

## Todo List
- [ ] Create 6 `loading.tsx` files reusing existing skeletons
- [ ] Create `navigation-pending.tsx` shared component
- [ ] Apply `<NavigationPending>` to tour-card, related-tour-card, guide-listing-card
- [ ] Apply `<NavigationPending>` to header nav links
- [ ] Audit + remove `'use client'` from `seo/*` (5 files)
- [ ] Audit + remove `'use client'` from `pages/about-*` sections (6 files) — build after batch
- [ ] Audit + remove `'use client'` from `pages/values-section.tsx`
- [ ] Audit + remove `'use client'` from `home/trust-signals`, `home/seasonal-cta`, `home/guides-preview`
- [ ] Verify `home/video-highlight` interactivity, decide
- [ ] Remove or align webpack config in `next.config.ts`
- [ ] Run full test suite (1009 tests) — must pass
- [ ] Run full build — must succeed
- [ ] Test on throttled Chrome DevTools — verify <100ms click feedback
- [ ] Deploy to staging, test on real mobile

## Success Criteria
- All 6 `loading.tsx` files render skeleton within 100ms of route navigation.
- Tour/guide cards show pending dim+spinner state during RSC fetch.
- 10–15 client components converted to Server Components.
- Build succeeds, all tests pass.
- Manual mobile test on staging: no "frozen" perception.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Stripping `'use client'` breaks build (hooks present) | High | Low | Build per batch of 3–5, revert specific component |
| Skeleton flashes too fast on cached/prefetched routes | Medium | Low | Acceptable — Next.js skips skeleton if instant |
| `useLinkStatus` doesn't work on `router.push` paths | Medium | Medium | Audit imperative navigation; out of scope for Phase 1 |
| Webpack removal breaks build edge case | Low | Medium | Verify with full build before merging Track D |

## Security Considerations
- None. UX-only changes, no auth/data path changes.

## Next Steps
- Phase 2: measurement infrastructure to capture baseline before further optimization.
