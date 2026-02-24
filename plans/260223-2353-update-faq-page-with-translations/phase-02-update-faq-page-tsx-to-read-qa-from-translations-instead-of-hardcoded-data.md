# Phase 02 — Update FAQ page.tsx to Read Q&A from Translations Instead of Hardcoded Data

## Context Links
- Plan: `./plan.md`
- Phase 01: `./phase-01-add-faq-qa-translation-keys-to-en-sv-de-locale-json-files.md`
- Source file: `apps/web/app/[locale]/(frontend)/faq/page.tsx`

## Overview
- **Priority:** P2
- **Status:** pending (depends on Phase 01)
- **Description:** Remove the hardcoded `faqCategories` object and `CategoryKey` type from `page.tsx`. Replace with translation-driven Q&A data built from `getTranslations`. Update `categoryKeys` to replace `'safety'` with `'accessibility'`.

## Key Insights
- `faqCategories` is ~125 lines of hardcoded EN-only data — all of it goes away
- `FAQAccordion` expects `{ question: string; answer: string }[]` — no interface changes needed
- `FAQSchema` also expects same shape — no changes needed there either
- `getTranslations` is already called for the `faq` namespace in both `generateMetadata` and `FAQPage` — reuse the same `t` instance
- Translation keys follow pattern: `faq.questions.{category}.q{N}.question` / `.answer`
- Per-category question counts: booking=5, payment=3, cancellation=3, experience=5, guides=3, accessibility=3
- Must derive `{ question, answer }[]` per category by iterating numbered keys q1..qN
- File must stay under 200 LOC after changes (currently 235 lines; removing hardcoded data brings it well under)

## Requirements
- Functional: Page renders all 22 Q&A items from translations for each locale
- Functional: `allFaqs` array for `FAQSchema` contains translated strings (not hardcoded EN)
- Functional: Category order preserved: booking → payment → cancellation → experience → guides → accessibility
- Non-functional: No TypeScript errors, no `any` types
- Non-functional: File stays under 200 LOC

## Architecture

### Question count map (replaces implicit `faqCategories` length)
Define a `const` mapping each category to its question count so the page can iterate `q1..qN`:

```ts
const categoryQuestionCounts: Record<CategoryKey, number> = {
  booking: 5,
  payment: 3,
  cancellation: 3,
  experience: 5,
  guides: 3,
  accessibility: 3,
}
```

### Building FAQs per category
For each category, build the array by iterating from 1 to count:

```ts
function buildCategoryFaqs(
  t: Awaited<ReturnType<typeof getTranslations>>,
  category: CategoryKey
): FAQItem[] {
  const count = categoryQuestionCounts[category]
  return Array.from({ length: count }, (_, i) => ({
    question: t(`questions.${category}.q${i + 1}.question`),
    answer: t(`questions.${category}.q${i + 1}.answer`),
  }))
}
```

Note: `FAQItem` is already exported from `faq-accordion.tsx` — import it.

### allFaqs for schema
```ts
const allFaqs = categoryKeys.flatMap((category) => buildCategoryFaqs(t, category))
```

## Related Code Files
- **Modify:** `apps/web/app/[locale]/(frontend)/faq/page.tsx`
- **Read-only:** `apps/web/components/pages/faq-accordion.tsx` (imports `FAQItem` type)
- **No change:** `apps/web/components/seo/faq-schema.tsx`

## Implementation Steps

### Step 1 — Update `categoryKeys` and `CategoryKey`

Replace:
```ts
const faqCategories = { ... } // entire ~125-line object

type CategoryKey = keyof typeof faqCategories

const categoryKeys: CategoryKey[] = [
  'booking', 'payment', 'cancellation', 'experience', 'safety', 'guides',
]
```

With:
```ts
type CategoryKey = 'booking' | 'payment' | 'cancellation' | 'experience' | 'guides' | 'accessibility'

const categoryKeys: CategoryKey[] = [
  'booking',
  'payment',
  'cancellation',
  'experience',
  'guides',
  'accessibility',
]

const categoryQuestionCounts: Record<CategoryKey, number> = {
  booking: 5,
  payment: 3,
  cancellation: 3,
  experience: 5,
  guides: 3,
  accessibility: 3,
}
```

### Step 2 — Add `FAQItem` import

Add to existing imports:
```ts
import type { FAQItem } from '@/components/pages/faq-accordion'
```

### Step 3 — Add `buildCategoryFaqs` helper

Add before `generateMetadata`:
```ts
/**
 * Builds FAQ items for a category by reading from i18n translations.
 * Uses numbered keys (q1, q2, ...) to avoid arrays in translation files.
 */
function buildCategoryFaqs(
  t: Awaited<ReturnType<typeof getTranslations<'faq'>>>,
  category: CategoryKey
): FAQItem[] {
  const count = categoryQuestionCounts[category]
  return Array.from({ length: count }, (_, i) => ({
    question: t(`questions.${category}.q${i + 1}.question` as Parameters<typeof t>[0]),
    answer: t(`questions.${category}.q${i + 1}.answer` as Parameters<typeof t>[0]),
  }))
}
```

Note on the type cast: `next-intl`'s `t()` function is typed against known keys. Dynamic string keys require a cast. Alternatively, use `t.raw()` which accepts any string and returns `string`. Use whichever compiles cleanly — `t.raw()` is simpler:

```ts
function buildCategoryFaqs(
  t: Awaited<ReturnType<typeof getTranslations>>,
  category: CategoryKey
): FAQItem[] {
  const count = categoryQuestionCounts[category]
  return Array.from({ length: count }, (_, i) => ({
    question: String(t.raw(`questions.${category}.q${i + 1}.question`)),
    answer: String(t.raw(`questions.${category}.q${i + 1}.answer`)),
  }))
}
```

### Step 4 — Update `FAQPage` body

Replace the `allFaqs` computation and `FAQAccordion` prop:
```ts
// Before:
const allFaqs = categoryKeys.flatMap((category) =>
  faqCategories[category].map((faq) => ({ question: faq.question, answer: faq.answer }))
)
// ...
<FAQAccordion faqs={faqCategories[category]} ... />

// After:
const allFaqs = categoryKeys.flatMap((category) => buildCategoryFaqs(t, category))
// ...
<FAQAccordion faqs={buildCategoryFaqs(t, category)} ... />
```

### Step 5 — Verify line count

Run: `wc -l apps/web/app/[locale]/(frontend)/faq/page.tsx` — expect ~100 lines (well under 200).

### Step 6 — Type-check

```bash
cd apps/web && npx tsc --noEmit
```

## Todo List

- [ ] Remove `faqCategories` object (~125 lines) from `page.tsx`
- [ ] Replace `CategoryKey` type with explicit union
- [ ] Update `categoryKeys` array: swap `'safety'` → `'accessibility'`
- [ ] Add `categoryQuestionCounts` const
- [ ] Add `FAQItem` import from `faq-accordion`
- [ ] Add `buildCategoryFaqs` helper function
- [ ] Update `allFaqs` to use `buildCategoryFaqs`
- [ ] Update `FAQAccordion` faqs prop to use `buildCategoryFaqs`
- [ ] Run `tsc --noEmit` — no errors
- [ ] Verify file is under 200 lines

## Success Criteria
- `page.tsx` compiles without TypeScript errors
- Page renders correct translated content for all three locales
- `FAQSchema` receives translated strings (verified by checking rendered HTML)
- File is under 200 LOC

## Risk Assessment
- **Risk:** `t.raw()` return type is `unknown` — `String()` wrap handles it
- **Risk:** Dynamic key path not caught by TypeScript at compile time → missing key renders empty string silently. **Mitigation:** JSON validation in Phase 01 ensures keys exist; count map must match JSON exactly.
- **Risk:** `buildCategoryFaqs` called twice per category (once for `allFaqs`, once for render) → negligible server-side cost, acceptable for KISS

## Security Considerations
- Content comes from translation files (static build-time data) — no injection risk

## Next Steps
- Phase 04: Verify tests still pass
