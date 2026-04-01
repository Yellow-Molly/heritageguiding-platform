---
phase: 2
title: Create not-found page component
status: completed
priority: medium
effort: M
completed: 2026-04-01
---

# Phase 2: Create Not-Found Page Component

## Overview

Build the 404 page as `not-found.tsx` matching the Pencil design. Mobile-first responsive layout using Tailwind CSS.

## Design Specs

### Desktop (1440px)
- Full-width bg image at 15% opacity over `#FAFAF8` background
- Existing `<Header variant="solid">` at top
- Centered content: large "4 🧭 4" display, illustration (500x180), speech bubble, headline, subtext, 2 CTA buttons side-by-side, search bar (420px), fun fact
- Playfair Display 144px for numbers, 36px for headline
- Inter 16px for body, 14px for search/buttons

### Mobile (390px)
- Hamburger nav (existing Header handles this)
- Stacked layout, 24px horizontal padding
- Illustration 340x220, rounded-2xl with shadow
- Full-width CTA buttons stacked vertically
- Full-width search bar
- Location tags row (Stockholm, Gothenburg, Visby)
- Smaller typography: 26px headline, 15px body

### Shared Elements
- Speech bubble: white bg, rounded-2xl, shadow, italic text
- Primary CTA: `#E67E5A` bg, white text, pill shape
- Secondary CTA: white bg, `#C4A052` border, pill shape
- Search bar: white bg, rounded-full, border, search icon
- Fun fact: italic, `#9CA3AF` text

## Files to Create

- `apps/web/app/(site)/[locale]/not-found.tsx` — the Not Found page

## Files to Reuse

- `apps/web/components/layout/header.tsx` — `<Header variant="solid">`
- `apps/web/components/layout/footer.tsx` — `<Footer>`
- `apps/web/i18n/navigation.ts` — `<Link>` for localized routing

## Implementation Steps

1. Create `apps/web/app/(site)/[locale]/not-found.tsx`
2. Import `Header`, `Footer`, `Link`, `useTranslations` (or server-side `getTranslations`)
3. Build the page structure:
   - Background image container (absolute, 15% opacity)
   - Header with solid variant
   - Main content area (flex column, centered)
     - "4 🧭 4" display (compass icon from lucide-react)
     - Illustration image (use a placeholder or actual tour image from public/)
     - Speech bubble
     - Headline (Playfair Display)
     - Subtext paragraph
     - Button row (Link to `/` and `/tours`)
     - Search bar (functional form — redirects to `/tours?q={query}` on Enter)
     - Location tags (mobile only, `md:hidden` — link to `/tours?city=stockholm` etc.)
     - Fun fact text
   - Footer
4. Use Tailwind responsive classes: mobile-first → `md:` for desktop
5. Use `next-intl` `useTranslations('notFound')` for all text content

### Key Tailwind Classes

```
Background: bg-[var(--color-background)]
Primary text: text-[var(--color-primary)]
Muted text: text-[var(--color-text-muted)]
Light text: text-[var(--color-text-light)]
Accent bg: bg-[var(--color-accent)]
Secondary border: border-[var(--color-secondary)]
Heading font: font-[family-name:var(--font-heading)]
Body font: font-[family-name:var(--font-body)]
```

### Next.js 16 not-found.tsx Pattern

```tsx
// Server component — gets translations server-side
import { getTranslations } from 'next-intl/server'

export default async function NotFound() {
  const t = await getTranslations('notFound')
  // ... render
}
```

**Note:** In Next.js 16, `not-found.tsx` in `app/(site)/[locale]/` is a server component that catches `notFound()` calls and unmatched routes within that layout segment.

## Images (Validated: export from .pen)

- Background: Export from `pencils/404.pen` → `public/images/404-background.png` (Stockholm cityscape, used at 15% opacity)
- Illustration: Export from `pencils/404.pen` → `public/images/404-illustration.png` (guide scene, 500x180 desktop / 340x220 mobile)
- Compass icon: use `lucide-react` `Compass` icon
- Use Pencil `export_nodes` MCP tool to extract images from the .pen file

## Success Criteria

- [x] Page renders at `/en/any-invalid-path` with correct 404 content
- [x] Desktop layout matches design (centered, side-by-side buttons)
- [x] Mobile layout matches design (stacked, full-width buttons, location tags)
- [x] All text uses i18n translations
- [x] "Take Me Home" links to homepage
- [x] "Show Me Around" links to `/tours`
- [x] Correct fonts, colors, spacing match design tokens
- [x] Reuses existing Header and Footer components
- [x] No console errors or hydration mismatches

## Completion Summary

Implementation complete:
- Created `apps/web/app/(site)/[locale]/not-found.tsx` — Server component with full 404 page layout
- Created `apps/web/components/pages/not-found-search-bar.tsx` — Client component for search bar with redirect functionality
- Exported 3 images from design file:
  - `apps/web/public/images/404-background.webp`
  - `apps/web/public/images/404-illustration-desktop.webp`
  - `apps/web/public/images/404-illustration-mobile.webp`
- Responsive design: mobile-first layout with full-width buttons/search, desktop layout with side-by-side buttons
- Location tags (mobile-only) link to `/tours?city=X`
- Search bar form redirects to `/tours?q=query`
- Full Header and Footer integration with all design tokens applied
