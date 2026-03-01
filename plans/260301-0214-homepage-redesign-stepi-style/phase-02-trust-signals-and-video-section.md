# Phase 02 - Trust Signals Restyle + Video Section

## Context Links
- [Research Report](research/researcher-01-reference-site-design.md)
- [Current Trust Signals](../../apps/web/components/home/trust-signals.tsx) (~127 LOC)
- [Trust Stats API](../../apps/web/lib/api/get-trust-stats.ts)
- [Design Guidelines](../../docs/design-guidelines.md)

## Overview
- **Priority:** P1
- **Status:** complete
- **Effort:** 1.5h
- **Description:** Restyle stats bar from dark navy background to light/cream. Add NEW video section component below stats.

## Key Insights
- Brand base colors updated in Phase 1: primary is now dark charcoal (#252525), gold is #DBC078
- Stepi stats bar: light background, 4 stats with SVG icons, large numbers, descriptive labels
- Current implementation: dark `bg-[var(--color-primary)]` with white text and count-up animation
- Stepi video section: 2-column layout (video left, text right), stacked on mobile
- Video section breaks scroll monotony and boosts engagement mid-page

## Requirements

### Trust Signals Restyle
- Change background from dark navy to light: `bg-[var(--color-background-alt)]` (#F5F5F3)
- Text color: dark (`text-[var(--color-text)]`) instead of white
- Icon color: keep `text-[var(--color-accent)]` (coral orange)
- Keep count-up animation and IntersectionObserver pattern
- Update stat values to match Stepi pattern: guides count, trusted %, years, happy %
- Keep `useCountUp` hook (good UX)

### Video Section (NEW)
- 2-column layout: embedded video (left) + text content (right)
- Mobile: stacked (video top, text below)
- Video: YouTube iframe with lazy-load pattern (user will provide URL; use placeholder until then)
- Text: section label, H2 "Watch Our Story", paragraph, optional CTA
- Light background (white)

## Architecture

### Trust Signals - Updated Stats
```ts
const stats = [
  { icon: <Users />, value: 12, suffix: '+', label: t('home.trust.licensedGuides') },
  { icon: <ShieldCheck />, value: 100, suffix: '%', label: t('home.trust.trusted') },
  { icon: <Calendar />, value: 15, suffix: '+', label: t('home.trust.yearsExperience') },
  { icon: <Smile />, value: 98, suffix: '%', label: t('home.trust.happyTravelers') },
]
```

### Video Section Structure
```
<section> (bg-white, py-20)
  <div> (container, grid lg:grid-cols-2, gap-12)
    <div> (video wrapper, aspect-video, rounded-2xl, overflow-hidden)
      <iframe> or <div with play button overlay>
    <div> (text content, flex col justify-center)
      <span> (section label, uppercase, accent color)
      <h2> (Playfair, primary color)
      <p> (body text, muted)
      <Link> (optional CTA)
```

## Related Code Files

### MODIFY
- `apps/web/components/home/trust-signals.tsx` - restyle: light bg, dark text, updated stats
- `apps/web/messages/en.json` - add `home.trust.trusted`, `home.trust.licensedGuides`, `home.video.*`
- `apps/web/messages/sv.json` - same keys
- `apps/web/messages/de.json` - same keys
- `apps/web/components/home/index.ts` - add `VideoSection` export

### CREATE
- `apps/web/components/home/video-section.tsx` - NEW component (~90 LOC)

## Implementation Steps

1. **Update i18n keys** in all 3 message files:
   ```json
   "trust": {
     "licensedGuides": "Licensed Guides",
     "trusted": "Trusted",
     "happyTravelers": "Happy Travelers",
     "yearsExperience": "Years Experience"
   },
   "video": {
     "label": "Our Story",
     "title": "Watch Our Video, Take a Tour",
     "description": "See what makes our heritage tours special. Join our expert guides as they reveal Stockholm's hidden stories, from medieval alleyways to royal chambers.",
     "cta": "Learn More About Us"
   }
   ```

2. **Restyle `trust-signals.tsx`**:
   - Change section bg: `bg-[var(--color-background-alt)]` (was `bg-[var(--color-primary)]`)
   - StatCard number: `text-[var(--color-primary)]` (was `text-white`)
   - StatCard label: `text-[var(--color-text-muted)]` (was `text-white/80`)
   - Icon: `text-[var(--color-accent)]` (was `text-[var(--color-secondary)]`)
   - Update stat data array to: guides(12+), trusted(100%), years(15+), happy(98%)
   - Add `useTranslations('home')` for labels
   - Keep `useCountUp` hook and IntersectionObserver unchanged

3. **Create `video-section.tsx`** (~90 LOC):
   ```tsx
   'use client'
   import { useRef, useState, useEffect } from 'react'
   import { Play } from 'lucide-react'
   import { useTranslations } from 'next-intl'
   import { cn } from '@/lib/utils'
   import Image from 'next/image'

   export function VideoSection() {
     const t = useTranslations('home.video')
     // IntersectionObserver for scroll animation
     // YouTube embed or placeholder with play overlay
     // 2-col grid on desktop, stacked on mobile
   }
   ```
   - Use placeholder image with play button overlay initially
   - On click, swap to YouTube iframe (lazy load pattern - better perf)
   - Wrap video in `aspect-video rounded-2xl overflow-hidden shadow-lg`
   - Text side: section label + H2 + paragraph + optional CTA link

4. **Update barrel export** `apps/web/components/home/index.ts`:
   - Add `export { VideoSection } from './video-section'`

5. **Verify build** compiles without errors

## Todo List
- [x] Add trust + video i18n keys to en/sv/de
- [x] Restyle trust-signals.tsx (light bg, dark text, updated stats)
- [x] Create video-section.tsx with lazy YouTube embed
- [x] Add VideoSection to barrel export
- [x] Verify both components under 200 LOC
- [x] Verify build compiles

## Success Criteria
- Stats bar has light background with dark text, coral icons
- Count-up animation still works on scroll into view
- Video section shows placeholder image, loads iframe on click
- Mobile: video stacks above text
- Desktop: 2-column side-by-side layout
- All 3 locales render correctly

## Risk Assessment
- **Low:** YouTube iframe adds external dependency; mitigated by lazy-load on click
- **Low:** Stat values are hardcoded; same as current behavior (TODO in API)
- **Medium:** Video URL needs to be configurable; use env var or CMS global for now

## Security Considerations
- YouTube iframe: use `allow="accelerometer; autoplay; encrypted-media"` with no cookies domain (`youtube-nocookie.com`)
- No user input collected in these components

## Next Steps
- Phase 03: Tours Carousel Redesign
