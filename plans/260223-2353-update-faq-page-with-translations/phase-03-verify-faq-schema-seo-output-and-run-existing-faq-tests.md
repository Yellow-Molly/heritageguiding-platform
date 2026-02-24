# Phase 03 — Verify FAQ Schema SEO Output and Run Existing FAQ Tests

## Context Links
- Plan: `./plan.md`
- Phase 02: `./phase-02-update-faq-page-tsx-to-read-qa-from-translations-instead-of-hardcoded-data.md`
- FAQSchema: `apps/web/components/seo/faq-schema.tsx`
- FAQAccordion: `apps/web/components/pages/faq-accordion.tsx`
- Test — accordion: `apps/web/components/pages/__tests__/faq-accordion.test.tsx`
- Test — schema: `apps/web/components/seo/__tests__/faq-schema.test.tsx`

## Overview
- **Priority:** P2
- **Status:** pending (depends on Phase 01 + 02)
- **Description:** Confirm `FAQSchema` and `FAQAccordion` components need no code changes. Run existing unit tests to verify nothing is broken. Both components accept `{ question: string; answer: string }[]` — the shape is unchanged; only the data source changes (translations vs. hardcoded). No test file edits expected.

## Key Insights
- `faq-schema.tsx` is data-agnostic: receives `FAQSchemaItem[]`, generates JSON-LD. No dependency on hardcoded strings. No change needed.
- `faq-accordion.tsx` is a pure presentational component: renders whatever `FAQItem[]` it receives. No change needed.
- Existing tests in `faq-accordion.test.tsx` use `mockFaqs` — fully independent of translation data. Tests remain valid.
- Existing tests in `faq-schema.test.tsx` use `mockFaqs` — same situation. Tests remain valid.
- Category rename (`safety` → `accessibility`) only affects `page.tsx` and the 3 locale JSON files — no component or test touches category keys directly.

## Requirements
- Functional: All existing FAQ unit tests pass with zero changes to test files
- Functional: `FAQSchema` JSON-LD output contains translated strings at runtime (verified via build/dev check, not unit test)
- Non-functional: No regressions in other test suites

## Architecture
No architectural changes. Verification only:

```
page.tsx (server component)
  └─ getTranslations('faq')
  └─ buildCategoryFaqs(t, category) → FAQItem[]
       ├─ FAQAccordion({ faqs: FAQItem[] })   ← unchanged component
       └─ FAQSchema({ faqs: FAQItem[] })      ← unchanged component
```

## Related Code Files
- **No change:** `apps/web/components/seo/faq-schema.tsx`
- **No change:** `apps/web/components/pages/faq-accordion.tsx`
- **No change:** `apps/web/components/pages/__tests__/faq-accordion.test.tsx`
- **No change:** `apps/web/components/seo/__tests__/faq-schema.test.tsx`

## Implementation Steps

### Step 1 — Run FAQ-specific tests

```bash
cd apps/web && npx vitest run --reporter=verbose \
  components/pages/__tests__/faq-accordion.test.tsx \
  components/seo/__tests__/faq-schema.test.tsx
```

Expected: all tests green, zero failures.

### Step 2 — Run full test suite to check for regressions

```bash
cd apps/web && npx vitest run
```

Expected: same pass/fail ratio as before this feature branch.

### Step 3 — TypeScript compile check

```bash
cd apps/web && npx tsc --noEmit
```

Expected: zero errors.

### Step 4 — Dev server smoke test (optional but recommended)

```bash
npm run dev
```

Navigate to `/en/faq`, `/sv/faq`, `/de/faq`. Verify:
- All 6 category headings render in correct language
- All 22 Q&A items render per locale
- Accordion opens/closes correctly
- View page source: `<script type="application/ld+json">` contains translated question strings

## Todo List

- [ ] Run FAQ unit tests — confirm all pass
- [ ] Run full vitest suite — confirm no regressions
- [ ] Run `tsc --noEmit` — confirm zero errors
- [ ] (Optional) Dev server smoke test across all 3 locales

## Success Criteria
- `faq-accordion.test.tsx`: all tests pass (rendering, interaction, accessibility)
- `faq-schema.test.tsx`: all tests pass (schema structure, FAQ items, edge cases)
- Full test suite: no new failures introduced
- TypeScript: zero compile errors

## Risk Assessment
- **Risk:** Vitest mock for `next-intl` breaks if page.tsx imports change → **Mitigation:** Component tests mock `t()` locally; they don't import `page.tsx` at all. No impact.
- **Risk:** `tsc` flags dynamic key path in `buildCategoryFaqs` → **Mitigation:** `t.raw()` + `String()` cast avoids strict key typing (covered in Phase 02)

## Security Considerations
- Tests run locally, no external data. No security surface.

## Next Steps
- Implementation complete. Delegate to `docs-manager` to update `./docs/codebase-summary.md` if needed (FAQ i18n pattern is now established for future reference).
