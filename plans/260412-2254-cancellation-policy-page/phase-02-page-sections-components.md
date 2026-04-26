# Phase 2: Page Sections/Components

## Context Links
- Design spec: Cancellation Option B (.pen file)
- Phase 1: [phase-01](./phase-01-page-route-and-i18n.md) (must complete first)
- Breadcrumb: `apps/web/components/shared/breadcrumb.tsx`
- CSS tokens: `apps/web/app/globals.css` (:root vars)
- Existing home components pattern: `apps/web/components/home/`

## Overview
- **Priority:** Medium
- **Status:** Pending (blocked by Phase 1)
- **Effort:** 2h
- Build 6 section components + barrel export. Each under 200 LOC. All server components (no interactivity). Props = translated strings from page.tsx.

## Key Insights
- Design uses `Playfair Display` for headings — already loaded as `font-serif` in Tailwind config.
- Gold accent color in design (#C8A96E / similar) maps to `--color-secondary` in globals.css. Verify exact hex.
- Card shadows, border-radius 20px, specific padding from design spec.
- Stepper connects steps with gold lines — horizontal on desktop (flex-row), vertical on mobile (flex-col).
- Breadcrumb component is `'use client'` — can still be imported from server component.
- Trust banner uses `--color-primary` background (dark blue #1E3A5F) with white text.

## Requirements

### Functional
- 6 components matching design spec pixel-close
- Responsive: desktop (1440px) and mobile (390px) layouts
- All icons from Lucide: CircleCheck, Clock, CircleX, Send, MailCheck, Wallet, RefreshCw, Clock3, ShieldCheck

### Non-functional
- Each file under 200 LOC
- No `'use client'` needed (pure presentational, no hooks)
- Tailwind utilities only, reference CSS vars for colors

## Architecture

### Component Tree
```
page.tsx
  ├── CancellationHero        props: title, subtitle, breadcrumbs, locale
  ├── CancellationTiers       props: sectionTag, title, subtitle, cards[3]
  ├── CancellationStepper     props: title, subtitle, steps[3]
  ├── CancellationProse       props: title, blocks[4]
  ├── CancellationTrustBanner props: title, items[3]
  └── CancellationCta         props: title, subtitle, buttonText, email, phone
```

### Props Strategy
Page.tsx builds props objects from `t()` calls and passes to each component. Components receive plain strings — no i18n dependency inside components. This keeps components testable and reusable.

## Related Code Files

### Create
| File | LOC Est. | Purpose |
|------|----------|---------|
| `components/cancellation/cancellation-hero.tsx` | ~60 | Gradient hero with breadcrumb, title, gold divider, decorative circles |
| `components/cancellation/cancellation-tiers.tsx` | ~80 | 3-column refund tier cards with colored top borders |
| `components/cancellation/cancellation-stepper.tsx` | ~70 | 3-step process with gold connecting lines |
| `components/cancellation/cancellation-prose.tsx` | ~60 | 4 policy blocks with gold left border |
| `components/cancellation/cancellation-trust-banner.tsx` | ~50 | Trust items on primary bg |
| `components/cancellation/cancellation-cta.tsx` | ~50 | Contact CTA with button |
| `components/cancellation/index.ts` | ~10 | Barrel exports |

### Modify
| File | Change |
|------|--------|
| `apps/web/app/(site)/[locale]/(frontend)/cancellation/page.tsx` | Replace placeholders with real component imports + prop wiring |

## Implementation Steps

### 1. Create barrel file `components/cancellation/index.ts`
```ts
export { CancellationHero } from './cancellation-hero'
export { CancellationTiers } from './cancellation-tiers'
export { CancellationStepper } from './cancellation-stepper'
export { CancellationProse } from './cancellation-prose'
export { CancellationTrustBanner } from './cancellation-trust-banner'
export { CancellationCta } from './cancellation-cta'
```

### 2. CancellationHero
- Container: `bg-gradient-to-r from-[#FAFAF8] to-[#F5F0E8]`, h-80, px-20 py-16
- Left column: Breadcrumb (Home / Cancellation Policy), title (font-serif text-5xl), gold divider (w-15 h-[3px] bg-[var(--color-secondary)]), subtitle
- Right column (desktop only): 3 decorative gold circles (absolute positioned, varying sizes/opacity)
- Mobile: center-aligned, no right column, title text-4xl
- Import `Breadcrumb` from `@/components/shared/breadcrumb`

### 3. CancellationTiers
- Section tag: uppercase tracking-wide text-sm text-[var(--color-secondary)]
- Title: font-serif text-3xl
- 3 cards in `grid grid-cols-1 md:grid-cols-3 gap-6`
- Each card: `rounded-[20px] shadow-lg p-8 bg-[var(--color-surface)]` with colored top border (4px)
  - Card 1: `border-t-4 border-[#10B981]` + CircleCheck icon (green)
  - Card 2: `border-t-4 border-[#F59E0B]` + Clock icon (amber)
  - Card 3: `border-t-4 border-[#EF4444]` + CircleX icon (red)
- Icon in circle bg matching border color at 10% opacity

### 4. CancellationStepper
- bg-[var(--color-background)]
- Title + subtitle centered
- Desktop: `flex flex-row items-start justify-center gap-8` with gold connecting lines between steps
- Each step: gold circle (w-16 h-16 rounded-full bg-[var(--color-secondary)]) with white Lucide icon, title, description
- Connecting line: `h-[2px] bg-[var(--color-secondary)] flex-1 mt-8` (between circles on desktop)
- Mobile: `flex flex-col items-center` with vertical connecting line `w-[2px] h-8`

### 5. CancellationProse
- bg-[var(--color-surface)], wide padding (px-40 on desktop, px-5 on mobile)
- Title centered + gold divider
- 4 blocks: `border-l-4 border-[var(--color-secondary)] pl-6 mb-8`
- Each block: bold title + paragraph content
- Content from i18n prose block translations

### 6. CancellationTrustBanner
- bg-[var(--color-primary)], py-16
- Title: white, font-serif, centered
- 3 items: `flex flex-col md:flex-row justify-center gap-12`
- Each item: gold icon (RefreshCw / Clock3 / ShieldCheck) + white label text
- Icons: `text-[var(--color-secondary)] w-8 h-8`

### 7. CancellationCta
- bg-[var(--color-background)], py-16, text-center
- Title: font-serif text-3xl
- Subtitle: text-[var(--color-text-muted)]
- Button: `bg-[var(--color-accent)] text-white px-8 py-3 rounded-lg hover:bg-[var(--color-accent-dark)]`
- Contact info below: email + phone in muted text

### 8. Wire components in page.tsx
- Import all from `@/components/cancellation`
- Build props from `t()` calls
- Pass tiers as array: `[{ title: t('tiers.card1.title'), ... }, ...]`
- Pass steps, blocks, trust items similarly

### 9. Verify
- `npm run build` — no errors
- Visual check at localhost for desktop + mobile breakpoints
- All 3 locales render translated content

## Todo
- [ ] Create barrel export index.ts
- [ ] Implement CancellationHero
- [ ] Implement CancellationTiers
- [ ] Implement CancellationStepper
- [ ] Implement CancellationProse
- [ ] Implement CancellationTrustBanner
- [ ] Implement CancellationCta
- [ ] Wire all components in page.tsx with translated props
- [ ] Visual verification desktop + mobile
- [ ] Build passes, all existing tests pass

## Success Criteria
- All 6 sections render matching design spec
- Desktop: 3-column tier grid, horizontal stepper, wide prose
- Mobile: stacked cards, vertical stepper, tight padding
- No `'use client'` directives (pure server components)
- Each file under 200 LOC
- Build succeeds with no new warnings

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Gold color mismatch with design | Medium | Low | Verify --color-secondary hex against design; add CSS var if needed |
| Stepper connecting lines tricky on responsive | Medium | Low | Use flex-1 spacer divs, test both breakpoints |
| Decorative circles in hero overflow | Low | Low | Use overflow-hidden on hero container |

## Security Considerations
- Pure presentational components, no user input, no dynamic data. Zero attack surface.

## Next Steps
- After implementation: run existing test suite to confirm no regressions.
- Consider adding snapshot/visual regression tests if team adopts them.
- Docs update: add cancellation page to `docs/codebase-summary.md` if applicable.
