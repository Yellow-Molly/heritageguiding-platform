---
title: "About Us Page Content Update (EN/SV/DE)"
description: "Refresh About Us copy from docx/About_Us_English.docx + docx/About_Us_Svenska.docx (Part 1 short web copy). Add Dutch to languages list. Broaden geography from Stockholm to Sweden. AI-translate to German."
status: completed
priority: P2
effort: 2-3h
branch: master
tags: [content, i18n, about-page, copywriting]
created: 2026-05-06
blockedBy: []
blocks: []
---

# About Us Page Content Update (EN/SV/DE)

## Overview

Update the About Us page copy across all 3 locales using the new source-of-truth docx files. Source content broadens scope from Stockholm-only to Sweden-wide and adds Dutch as a 7th supported language. Content-only work — component structure largely unchanged. German locale gets AI-translated from the polished English.

## Source Material

| File | Role | Use |
|------|------|-----|
| `docx/About_Us_English.docx` | Authoritative EN | Part 1 (short web copy) → page text |
| `docx/About_Us_Svenska.docx` | Authoritative SV | Part 1 → page text |
| (AI-translated) | DE | Generated from polished EN by AI |

**Decision (validated):** Use Part 1 only. Manifest (Part 2) deferred. Exception: align existing Responsible Tourism section with Manifest's "A Responsibility to Places and People" since the theme is identical and we're broadening geography anyway.

## Decisions (validated 2026-05-06)

| # | Decision |
|---|----------|
| 1 | **Scope**: Part 1 (short web copy) only |
| 2 | **Languages**: 7 languages including Dutch (per EN docx) — update SV/DE accordingly |
| 3 | **Geography**: Broaden Stockholm → Sweden (hero image, alt text, SEO meta) |
| 4 | **EN polish**: Light only — typos, en-dashes, curly quotes; preserve docx voice |

## Architecture

**Content-only flow.** All copy lives in `apps/web/messages/{en,sv,de}.json` under `about.*`. Components read via `useTranslations('about')`. No new components needed; minor adjustments to existing components (paragraph counts, image src) only where structure differs.

**Geography handling.** Hero image and image alt texts updated for Sweden-wide framing. SEO metadata (`title`, `description`) broadened. No structural component changes.

## Phases

| # | Phase | Outputs | Status |
|---|-------|---------|--------|
| 1 | [Content prep & EN verification](./phase-01-content-prep-and-en-verification.md) | Final EN copy table, mapping to translation keys | Complete |
| 2 | [EN/SV/DE translation file updates](./phase-02-translation-file-updates.md) | Updated `en.json`, `sv.json`, `de.json` | Complete |
| 3 | [Imagery & metadata broadening](./phase-03-imagery-and-metadata.md) | Hero image swap, alt texts, SEO meta updates | Complete |
| 4 | [Verification](./phase-04-verification.md) | Type-check, lint, build, visual across 3 locales | Complete |

## Dependency Graph

```
Phase 1 ──> Phase 2 ──> Phase 4
            Phase 3 ──┘
```

Phase 2 and Phase 3 can run in parallel after Phase 1 completes; both feed into Phase 4 verification.

## Files Touched (Estimated)

**Translations (3 files):**
- `apps/web/messages/en.json`
- `apps/web/messages/sv.json`
- `apps/web/messages/de.json`

**Components (potential — only if paragraph counts change):**
- `apps/web/components/pages/about-story-section.tsx` (paragraph count: currently 6, new docx has 5 — adjust)
- `apps/web/components/pages/about-hero-section.tsx` (image src swap)
- `apps/web/components/pages/about-responsible-tourism-section.tsx` (image alt only, no structural)

**SEO:**
- `apps/web/messages/{en,sv,de}.json` → `about.title` and `about.description` keys

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Story section paragraph count mismatch breaks layout | Med | Low | Adjust `about-story-section.tsx` to render 5 paragraphs. Map docx structure: 1 opener line + 1 secondary line + 3 body paragraphs |
| AI German translation introduces inaccuracies | Med | Med | Use the same translation pattern as existing de.json (formal "Sie", consistent terminology). Cross-check core terms (Verifierad → Verifizierte; auktoriserad → autorisiert; etc.) against existing de.json glossary |
| Dutch language addition mismatches between locales | Low | Low | Add Dutch consistently to all 3 locales' `multilingual.description` |
| Hero image change affects test snapshots | Low | Low | Update component test if it asserts the image URL |
| Existing translations have non-ASCII corruption (mojibake) | High | Med | When reading existing files, do not preserve mojibake — recompute SV/DE from clean source. Confirmed: existing `sv.json` and `de.json` show `�` characters; rewrite cleanly |

## Rollback Plan

- Phase 2: `git checkout apps/web/messages/{en,sv,de}.json`
- Phase 3: `git checkout apps/web/components/pages/about-*.tsx`
- Phase 4: Verification only — no rollback needed

## Success Criteria

- [ ] Part 1 docx content reflected in all 3 locales (EN/SV/DE)
- [ ] Languages list shows 7 (Dutch included) consistently across locales
- [ ] Hero image swapped to Sweden-wide visual; alt text updated
- [ ] SEO meta (title, description) broadened to Sweden
- [ ] No mojibake (`�`) in updated translation files
- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] Browser verification at `/en/about-us`, `/sv/about-us`, `/de/about-us` shows clean rendering at 1440px and 390px

## Out of Scope

- Manifest (Part 2) long-form content
- New components or section additions
- Image asset generation (use Unsplash/existing)
- Homepage or other page updates
- CMS schema changes
