---
title: "Guide Profile Redesign (Option B Split Layout)"
description: "Redesign guide detail page with split layout, add structured CMS fields, import 12 guides including new Jack Voldstad"
status: complete
priority: P1
effort: 12h
branch: feat/guide-profile-redesign
tags: [frontend, cms, import, guides, redesign]
created: 2026-04-18
---

# Guide Profile Redesign

## Summary

Redesign guide detail/profile page to Option B "Split Profile" layout. Add dedicated CMS fields for structured guide data (guideStyle, whatGuestsAppreciate, quote, etc.) that are currently merged into a single bio richText field. Import updated data from 12 DOCX files (1 new guide: Jack Voldstad).

## Phases

| # | Phase | Status | Effort | Blocks |
|---|-------|--------|--------|--------|
| 1 | [Parse & Translate Guide Data](phase-01-guide-data-parsing-translation.md) | Complete | 2h | -- |
| 2 | [Update CMS Schema](phase-02-cms-fields-types-api.md) | Complete | 1.5h | -- |
| 3 | [Import Guide Data & Photos](phase-03-data-import-validation.md) | Complete | 2h | -- |
| 4 | [Redesign Guide Detail Page](phase-04-ui-components-frontend.md) | Complete | 5h | -- |
| 5 | [Verification & Testing](phase-05-testing-validation.md) | Complete | 1.5h | -- |

## Dependency Graph

```
Phase 1 (parse+translate) ──┐
                             ├──> Phase 3 (import) ──> Phase 4 (frontend) ──> Phase 5 (verify)
Phase 2 (CMS schema)  ──────┘
```

Phases 1 and 2 are independent and can run in parallel.

## Key Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| DOCX parser fails on new Jack Voldstad file | Medium | High | Update parser expected count; test parse before batch |
| CMS migration breaks existing bio data | Low | High | New fields only (additive); bio field untouched until import |
| Translation quality for new guide | Low | Medium | Review markdown generated; manual spot-check |
| Frontend breaks for guides missing new fields | Medium | Medium | Null-safe rendering; graceful fallback for empty sections |

## Rollback Strategy

- Phase 2: Remove new CMS fields, regenerate types
- Phase 3: Re-run v2 import with --update to restore previous bio content from git-tracked JSON
- Phase 4: Revert frontend branch; old components still exist until deleted

## Validation Summary

**Validated:** 2026-04-18
**Questions asked:** 6

### Confirmed Decisions
- **Jack Voldstad photo:** Has a real photo — import from Guide-photos/ (not placeholder)
- **Jack Voldstad status:** Set to `active` — immediately visible on site
- **Bio rewrite safety:** No manual CMS edits exist — safe to overwrite bio with plain text only
- **Mobile sticky CTA:** Anchor link scrolling to `#tours` section on same page
- **Tagline:** Skip — do NOT render the "Heritage Guide — Stockholm" tagline under guide name
- **Existing data handling:** Full re-parse all 12 DOCXs + delta translate (only re-translate changed fields)

### Action Items
- [x] No plan changes needed for Jack Voldstad photo/status — aligns with Phase 3
- [x] Phase 4: Remove tagline (`guideTag`) from sidebar design — skip rendering, remove i18n key
- [x] Phase 4: Update sticky CTA to use `#tours` anchor instead of route navigation
