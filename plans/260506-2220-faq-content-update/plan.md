---
title: "FAQ Page Content Update (EN/SV/DE)"
description: "Refresh FAQ from docx/Private_Tours_FAQ_EN.docx + docx/Private_Tours_FAQ_SV.docx (Version 5.0). Restructure to 7 docx sections, broaden Stockholm to Sweden, keep cancellation Q&As generic (defer to tour pages), AI-translate to German."
status: completed
priority: P2
effort: 3-4h
branch: master
tags: [content, i18n, faq, copywriting]
created: 2026-05-06
blockedBy: []
blocks: [260419-1332-per-tour-cancellation-policy]
---

# FAQ Page Content Update (EN/SV/DE)

## Overview

Replace the current 6-category / 22-Q&A FAQ with the new 7-section / ~31-Q&A structure from the Version 5.0 docx source. Cancellation Q&As intentionally kept generic (no specific tier numbers) so per-tour terms remain authoritative — this preserves the architecture goal of the in-progress per-tour-cancellation plan. German locale is AI-translated from polished English using the existing formal "Sie" tone of `de.json`.

## Source Material

| File | Role | Use |
|------|------|-----|
| `docx/Private_Tours_FAQ_EN.docx` | Authoritative EN | Q&A copy (Version 5.0, April 2026) |
| `docx/Private_Tours_FAQ_SV.docx` | Authoritative SV | Q&A copy (Version 5.0, April 2026) |
| (AI-translated) | DE | Generated from polished EN; cross-checked against existing `de.json` glossary |

## Decisions (validated 2026-05-06)

| # | Decision |
|---|----------|
| 1 | **Categories**: 7 docx sections, no number prefixes — `understanding`, `comparing`, `booking`, `afterBooking`, `cancellation`, `experience`, `about` |
| 2 | **Cancellation policy**: Generic Q&As only — no specific tier numbers (7-day or 48h). Defer to per-tour cancellation displayed at booking. Drop the SV-only refund tier table. |
| 3 | **Geography**: Broaden Stockholm → Sweden across all 3 locales (matches About Us update direction) |
| 4 | **EN polish**: Light only — typos, en-dashes, curly quotes; preserve docx voice |
| 5 | **DE translation**: AI-generated from polished EN, formal "Sie", aligned with existing `de.json` terminology (auktoriserad → autorisiert, etc.) |

## Architecture

Content-only flow. All copy in `apps/web/messages/{en,sv,de}.json` under `faq.*`. The page component reads via `useTranslations('faq')` with numbered keys (`q1`, `q2`, …) so no array support needed. Existing components (`FAQAccordion`, `FAQSchema`) reused as-is — no rich content / tables required.

## Phases

| # | Phase | Outputs | Status |
|---|-------|---------|--------|
| 1 | [Content prep & EN polish](./phase-01-content-prep-and-en-polish.md) | Final EN/SV mapping table, generic-cancellation rewrites | Complete |
| 2 | [Translation file updates](./phase-02-translation-file-updates.md) | Updated `en.json`, `sv.json`, `de.json` faq block | Complete |
| 3 | [Page component update](./phase-03-page-component-update.md) | New `CategoryKey` type, `categoryQuestionCounts`, broadened SEO meta | Complete |
| 4 | [Verification](./phase-04-verification.md) | Type-check, lint, build, browser smoke at /en/faq, /sv/faq, /de/faq, FAQ schema validation | Complete (FAQ tests + structural checks pass; full `npm run build` not run — pre-existing type errors in unrelated files) |

## Dependency Graph

```
Phase 1 ──> Phase 2 ──> Phase 4
            Phase 3 ──┘
```

Phase 2 and Phase 3 can run in parallel after Phase 1; both feed Phase 4.

## Cross-Plan Relationship

`260419-1332-per-tour-cancellation-policy` Phase 06 ("FAQ cancellation Q&A rewrite") is now superseded by this plan's Phase 1+2 cancellation content. That phase should be marked complete or removed once this plan ships. The two plans agree in intent — generic FAQ that defers to per-tour terms.

## Files Touched (Estimated)

**Translations (3 files):**
- `apps/web/messages/en.json` — replace `faq.categories.*` and `faq.questions.*`; broaden `faq.description`/`faq.subtitle` to Sweden
- `apps/web/messages/sv.json` — same
- `apps/web/messages/de.json` — same (AI-translated)

**Page component (1 file):**
- `apps/web/app/(site)/[locale]/(frontend)/faq/page.tsx` — update `CategoryKey` union, `categoryKeys` array, `categoryQuestionCounts` map

**Tests (verify only, no changes expected):**
- `apps/web/components/pages/__tests__/faq-accordion.test.tsx` (mock data, locale-agnostic)
- `apps/web/components/seo/__tests__/faq-schema.test.tsx` (mock data, locale-agnostic)

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Mojibake (`�`) in updated translation files | Med | Med | Source docx with utf-8 stdout; verify no replacement chars before commit |
| Q&A count mismatch between JSON and `categoryQuestionCounts` map | Med | Low | Phase 3 hardcodes counts; Phase 4 verification opens each category to confirm render |
| AI German introduces inaccuracies | Med | Med | Cross-check against existing `de.json` glossary; preserve formal "Sie" register |
| Cancellation rewrite contradicts /cancellation-policy page (still 48h tier) | Low | Med | FAQ becomes generic; /cancellation page rewrite is out of scope (handled by per-tour plan) |
| `q1`–`q6` keys for new sections not present → render crashes | Low | High | Phase 3 verification opens each category in browser before merge |
| Stockholm broadening misses geo-tied SEO meta | Low | Low | Phase 2 also updates `faq.description` and `faq.subtitle` |

## Rollback Plan

- Phase 2: `git checkout apps/web/messages/{en,sv,de}.json`
- Phase 3: `git checkout apps/web/app/(site)/[locale]/(frontend)/faq/page.tsx`
- Phase 4: Verification only — no rollback needed

## Success Criteria

- [ ] All 7 sections render with correct Q&A counts at /en/faq, /sv/faq, /de/faq
- [ ] No `Stockholm` in generic Q&As (specific where context requires it, e.g., examples)
- [ ] Cancellation Q&As contain no specific tier numbers (7d, 48h, 24h percentages)
- [ ] No mojibake (`�`) in updated translation files
- [ ] FAQ schema JSON-LD includes all ~31 Q&As as plain text
- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] Existing FAQ tests (`faq-accordion.test.tsx`, `faq-schema.test.tsx`) still pass

## Out of Scope

- /cancellation-policy page copy update (deferred — handled by per-tour-cancellation plan)
- New components or section additions
- FAQAccordion rich-content support (no tables / markdown needed)
- Q&A search or filter UX
- CMS migration of FAQ content
