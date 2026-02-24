---
title: "Update FAQ Page with New Content, i18n Translations, and UI Redesign"
description: "Replace hardcoded FAQ Q&A with i18n-backed content across EN/SV/DE, update categories, fix cramped UI with Kayak-style spacing."
status: complete
priority: P2
effort: 4h
branch: master
tags: [faq, i18n, translations, content, seo, ui]
created: 2026-02-23
---

# FAQ Page Update with Translations + UI Redesign

## Objective
Move FAQ Q&A content from hardcoded `page.tsx` into `messages/{en,sv,de}.json`. Replace 24 old Q&A items (6 categories) with 22 new items (6 categories), swapping `safety` category for `accessibility`. Fix cramped UI with proper padding and visual hierarchy.

## Phases

| # | Phase | Status | Effort |
|---|-------|--------|--------|
| 1 | [Add FAQ Q&A translation keys to EN/SV/DE locale JSON files](./phase-01-add-faq-qa-translation-keys-to-en-sv-de-locale-json-files.md) | complete | 1.5h |
| 2 | [Update faq page.tsx to read Q&A from translations instead of hardcoded data](./phase-02-update-faq-page-tsx-to-read-qa-from-translations-instead-of-hardcoded-data.md) | complete | 0.5h |
| 3 | [Verify FAQ schema SEO output and run existing FAQ tests](./phase-03-verify-faq-schema-seo-output-and-run-existing-faq-tests.md) | complete | 0.5h |
| 4 | [Redesign FAQ page UI spacing and visual hierarchy](./phase-04-redesign-faq-page-ui-spacing-and-visual-hierarchy.md) | complete | 0.5h |

## Execution Order
- Phase 1 → 2 → 3 (sequential, complete)
- Phase 4 runs independently (UI-only, no data changes)

## Files Touched
- `apps/web/messages/en.json` — add `faq.questions.*`, rename category key ✅
- `apps/web/messages/sv.json` — add `faq.questions.*`, rename category key ✅
- `apps/web/messages/de.json` — add `faq.questions.*`, rename category key ✅
- `apps/web/app/(site)/[locale]/(frontend)/faq/page.tsx` — translation-driven build + UI spacing ✅ (Phase 4 pending)
- `apps/web/components/pages/faq-accordion.tsx` — padding/spacing update (Phase 4)
- `apps/web/components/seo/faq-schema.tsx` — verify only, no changes ✅
- `apps/web/components/pages/__tests__/faq-accordion.test.tsx` — verify only ✅
- `apps/web/components/seo/__tests__/faq-schema.test.tsx` — verify only ✅

## Validation Summary

**Validated:** 2026-02-23
**Questions asked:** 4

### Confirmed Decisions
- **Drop safety category entirely**: New docx is single source of truth; old safety Q&As (COVID, insurance, emergency) are outdated
- **Hardcoded count map is acceptable**: FAQ content changes rarely; manual sync between JSON and `categoryQuestionCounts` is fine
- **AI translations ship as-is**: SV/DE translations used immediately; native speaker review scheduled post-deploy
- **Update UI strings**: Align `faq.title`, `faq.subtitle`, `faq.description`, `faq.contactDescription` with new brand tone across all 3 locales

### Action Items
- [x] Phase 01: Update `faq.title`, `faq.subtitle`, `faq.description`, `faq.contactDescription` in en/sv/de.json to match new brand tone
- [x] Phase 04: Fix cramped FAQ UI — add padding, spacing, visual hierarchy (Kayak-style)
