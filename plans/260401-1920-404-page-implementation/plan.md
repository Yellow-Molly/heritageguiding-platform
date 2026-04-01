---
title: 404 Page Implementation
status: completed
created: 2026-04-01
completed: 2026-04-01
priority: medium
blockedBy: []
blocks: []
---

# 404 Page Implementation

## Overview

Implement a custom 404 page matching the design in `pencils/404.pen`. The design includes both Desktop (1440px) and Mobile (390px) variants with:
- Background image with low opacity
- Navigation header (reuse existing `<Header>`)
- Large "4 0 4" display with compass icon
- Illustration scene of guides in Stockholm
- Speech bubble: "Follow me! I know a shortcut!"
- Headline + subtext
- Two CTA buttons: "Take Me Home" + "Show Me Around"
- Search bar
- Location tags (mobile only)
- Fun fact text

## Design Reference

- Desktop: `pencils/404.pen` → node `8wgPH` (1440x900)
- Mobile: `pencils/404.pen` → node `gsblI` (390x844)

## Color Tokens (already in globals.css)

| Design Color | CSS Variable |
|---|---|
| `#1E3A5F` | `--color-primary` |
| `#C4A052` | `--color-secondary` |
| `#E67E5A` | `--color-accent` |
| `#FAFAF8` | `--color-background` |
| `#6B7280` | `--color-text-muted` |
| `#9CA3AF` | `--color-text-light` |

## Fonts

- Headings: Playfair Display (`--font-heading`) — already loaded via `next/font`
- Body: Inter (`--font-body`) — already loaded

## Phases

| # | Phase | Status | Effort |
|---|---|---|---|
| 1 | [Add i18n translations](./phase-01-i18n-translations.md) | completed | S |
| 2 | [Create not-found page component](./phase-02-not-found-page.md) | completed | M |

## Architecture

Next.js 16 `not-found.tsx` placement:
- `apps/web/app/(site)/[locale]/not-found.tsx` — catches 404s within the locale layout (has access to `next-intl` provider)
- Reuses existing `<Header variant="solid">` and `<Footer>`
- Responsive design via Tailwind breakpoints (mobile-first)

## Validation Summary

**Validated:** 2026-04-01
**Questions asked:** 4

### Confirmed Decisions
- **Images**: Export from .pen file to `public/` — pixel-perfect match with design
- **Search bar**: Functional with redirect — user types query, Enter redirects to `/tours?q=query`
- **Location tags** (mobile): Link to `/tours?city=X` — filtered tours by city
- **Layout**: Full Header + Footer — consistent site chrome matching the design

### Action Items
- [ ] Update phase-02: add image export step (use Pencil `export_nodes` tool)
- [ ] Update phase-02: search bar becomes a form with redirect to `/tours?q=`
- [ ] Update phase-02: location tags link to `/tours?city=stockholm` etc.
- [ ] Update phase-01: add translation keys for city names if needed

## Cook Command

```bash
/ck:cook auto plans/260401-1920-404-page-implementation
```
