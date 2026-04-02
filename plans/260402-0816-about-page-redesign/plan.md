---
title: "About Us Page Redesign"
description: "Redesign the About Us page with new visual design: hero image, section images, team cards, icon cards, and improved responsive layout"
status: completed
priority: P1
effort: 4h
branch: master
tags: [frontend, design, about-page, i18n]
created: 2026-04-02
---

# About Us Page Redesign

## Overview

Redesign the About Us page to match the new Pencil design. Current page is text-heavy with flat styling. New design adds: hero background image, side-by-side layouts with images, icon-driven cards, team member grid with photos, and a polished certifications bar.

## Architecture

**Data Flow**: Server component (`page.tsx`) fetches translations via `getTranslations` -> passes locale to client section components -> each section calls `useTranslations('about.X')` for its namespace.

**Component Strategy**: Break monolithic 187-line page into 7 focused section components (each < 200 lines) under `apps/web/components/pages/`. Page becomes a thin orchestrator importing sections.

**Image Strategy**: Hero uses CSS `background-image` with overlay. Story/Responsible Tourism sections use Next.js `<Image>`. Team photos use placeholder images initially (can integrate with CMS guides collection later).

## Dependency Graph

```
Phase 1 (Translations) ──> Phase 2 (Components) ──> Phase 3 (Verification)
```

No cross-phase file conflicts. Phase 2 components can be built in parallel since they touch separate files.

## Phases

| # | Phase | Files | Status |
|---|-------|-------|--------|
| 1 | [Translation Updates](./phase-01-translation-updates.md) | en.json, sv.json, de.json | Complete |
| 2 | [Component Implementation](./phase-02-component-implementation.md) | 6 new + 2 modified components | Complete |
| 3 | [Verification](./phase-03-verification.md) | Type-check, lint, build | Complete |

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Hero background image missing | High | Medium | Use CSS gradient fallback matching current design |
| Team placeholder photos look bad | Medium | Low | Use styled initials/avatar fallback |
| Translation keys break existing pages | Low | High | Only ADD keys, never rename/remove existing ones |
| Values section rename breaks imports | Low | Medium | Keep same file name and export name |

## Rollback Plan

- Phase 1: Revert translation JSON additions (additive only, no breakage risk)
- Phase 2: Revert component files + restore original page.tsx from git
- Phase 3: N/A (read-only verification)

## Validation Summary

**Validated:** 2026-04-02
**Questions asked:** 4

### Confirmed Decisions
- **Team section**: Skip entirely for now. Remove from component list — reduces scope by 1 component + translation keys.
- **Images**: Use static placeholder images in `/public/images/` for Hero, Story, and Responsible Tourism sections. Source stock images.
- **Story title**: Use design content. "WHO WE ARE" is the section label above, "Created for Travelers Who Value Depth" is the title. Update translation keys accordingly.
- **CTA buttons**: Use inline Tailwind for rounded-full + icon style. No Button component modifications.

### Action Items
- [ ] Remove `about-team-section.tsx` from Phase 2 file list
- [ ] Remove team translation keys from Phase 1
- [ ] Update story title translation to "Created for Travelers Who Value Depth"
- [ ] Add placeholder image sourcing step to Phase 2
- [ ] Reduce page.tsx to 7 sections (not 8)

## Success Criteria

- [x] All 7 sections render correctly at 1440px and 390px viewports (team section skipped per validation)
- [x] All 3 locales (EN/SV/DE) display correct translations
- [x] `npm run type-check` passes
- [x] `npm run lint` passes
- [x] `npm run build` succeeds
- [x] No existing functionality broken (navigation, SEO schema, metadata)
