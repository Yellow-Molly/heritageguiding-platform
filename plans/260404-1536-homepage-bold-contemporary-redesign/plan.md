---
title: "Homepage Bold & Contemporary Redesign (Option 5)"
description: "Redesign homepage with new section order, landscape tour cards, spacing refinements, and WCAG compliance"
status: completed
priority: P1
effort: 6h
branch: feat/homepage-bold-contemporary-redesign
tags: [homepage, design, wcag, i18n]
created: 2026-04-04
completed: 2026-04-04
---

# Homepage Bold & Contemporary Redesign

## Context
- Design spec: `research/researcher-01-design-specs.md`
- Page: `apps/web/app/(site)/[locale]/(frontend)/page.tsx`
- Components: `apps/web/components/home/`
- Translations: `apps/web/messages/{en,sv,de}.json` under `home.*`
- CSS vars: `apps/web/app/globals.css` (WCAG-safe tokens already exist)

## Phases

| # | Phase | Status | Effort | Files Touched |
|---|-------|--------|--------|---------------|
| 1 | [Section Reorder & Translations](phase-01-section-reorder-and-translations.md) | Complete | 1h | page.tsx, en/sv/de.json |
| 2 | [Featured Tours Redesign](phase-02-featured-tours-redesign.md) | Complete | 2.5h | featured-tours.tsx |
| 3 | [Spacing & Styling Refinements](phase-03-spacing-and-styling-refinements.md) | Complete | 1.5h | trust-signals.tsx, guides-preview.tsx, video-highlight.tsx, globals.css |
| 4 | [WCAG Accessibility Audit](phase-04-wcag-accessibility-audit.md) | Complete | 1h | All modified files |

## Dependency Graph
```
Phase 1 (reorder + i18n keys)
    |
    v
Phase 2 (featured tours) ─┐
Phase 3 (spacing/styling) ─┤  (parallel, no file overlap)
    |                       |
    v                       v
Phase 4 (WCAG audit — runs on all modified files)
```

## Key Decisions
- **SeasonalCta**: Remove from page.tsx import/render; keep file for potential reuse
- **Footer**: Keep existing full footer; add gold separator line before it
- **Design colors**: Code uses WCAG-safe CSS vars (`--color-secondary` #856C2D, `--color-accent` #C05030), not raw design values
- **No new files**: All changes modify existing components
- **FeaturedTour type**: Already has `duration` + `maxCapacity` fields needed for new meta row

## Rollback
Each phase is a single commit. `git revert <commit>` per phase. No migrations or data changes.

## Validation Summary

**Validated:** 2026-04-04
**Questions asked:** 4

### Confirmed Decisions
- **Footer**: Keep existing full footer; add gold separator line before it (no footer redesign)
- **SeasonalCta**: Remove from homepage render; keep file for potential reuse
- **CMS Data**: Add graceful fallbacks for `description`, `duration`, `maxCapacity` (conditional render)
- **Contrast**: Bump all `white/60` to `white/70` on navy backgrounds for guaranteed WCAG AA

### Action Items
- [x] Phase 2: Add conditional rendering for tour card fields (description, duration, maxCapacity)
- [x] Phase 4: Replace all `text-white/60` with `text-white/70` in trust-signals.tsx and guides-preview.tsx

## Quality Gates
- `npm run lint` after each phase
- `npm run test` after each phase
- Manual visual check at `localhost:3000/en`, `/sv`, `/de`
- axe-core browser extension scan in Phase 4
