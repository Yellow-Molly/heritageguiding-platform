# Phase 3: Page Component Update

**Status:** Pending
**Effort:** 30m
**Depends on:** Phase 1 (final category map + counts) — can run in parallel with Phase 2

## Goal

Update `apps/web/app/(site)/[locale]/(frontend)/faq/page.tsx` so the `CategoryKey` type, `categoryKeys` array, and `categoryQuestionCounts` map match the new 7-section structure. SEO meta is read from `faq.title`/`faq.description` (already broadened in Phase 2), so no separate metadata changes are needed in the component.

## File

- `apps/web/app/(site)/[locale]/(frontend)/faq/page.tsx`

## Diff Summary

```ts
// BEFORE
type CategoryKey =
  | 'booking'
  | 'payment'
  | 'cancellation'
  | 'experience'
  | 'guides'
  | 'accessibility'

const categoryKeys: CategoryKey[] = [
  'booking', 'payment', 'cancellation', 'experience', 'guides', 'accessibility',
]

const categoryQuestionCounts: Record<CategoryKey, number> = {
  booking: 5,
  payment: 3,
  cancellation: 3,
  experience: 5,
  guides: 3,
  accessibility: 3,
}

// AFTER
type CategoryKey =
  | 'understanding'
  | 'comparing'
  | 'booking'
  | 'afterBooking'
  | 'cancellation'
  | 'experience'
  | 'about'

const categoryKeys: CategoryKey[] = [
  'understanding',
  'comparing',
  'booking',
  'afterBooking',
  'cancellation',
  'experience',
  'about',
]

const categoryQuestionCounts: Record<CategoryKey, number> = {
  understanding: 5,
  comparing: 5,
  booking: 6,
  afterBooking: 4,
  cancellation: 6,
  experience: 5,
  about: 2,
}
```

No other changes required:
- `buildCategoryFaqs` already reads `faq.questions.{category}.q{N}` dynamically — works with any key set
- Hero, contact CTA, and FAQ schema are key-agnostic
- `generateMetadata` already pulls from `faq.title` / `faq.description` — Phase 2 broadens those values

## Edge Cases

- **Render order**: `categoryKeys` array order = on-page render order. Order kept identical to docx flow (1→2→3→4→5→6→7) per UX expectation.
- **Section spacing**: `index > 0 ? 'mt-10' : ''` — unchanged; works for any number of sections.
- **Schema.org output**: All ~33 Q&As flatMapped into a single FAQPage entity — no per-category limit needed.

## Implementation Steps

1. Read current `page.tsx` to confirm the only edits land in the type/array/map block (lines ~13–38).
2. Apply the diff in a single `Edit` operation.
3. Run `npm run type-check` (workspace `apps/web`) to confirm no type errors.
4. Skim `buildCategoryFaqs` and `FAQPage` to confirm no other reference to the dropped category keys (`payment`, `guides`, `accessibility` as CategoryKey union members).

## Acceptance

- [ ] `CategoryKey` union has exactly the 7 new keys
- [ ] `categoryKeys` array order matches docx section order
- [ ] `categoryQuestionCounts` totals to 33
- [ ] `npm run type-check` passes for `apps/web`
- [ ] No leftover references to old category keys in `page.tsx`
