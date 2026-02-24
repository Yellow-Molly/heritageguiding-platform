# Phase 04 — Redesign FAQ Page UI Spacing and Visual Hierarchy

## Context Links
- Plan: `./plan.md`
- Phase 01-03: translation + data changes (complete)
- Design guidelines: `docs/design-guidelines.md`
- Reference: Kayak FAQ (`https://www.kayak.se/help`) — clean, spacious, minimalist accordion layout
- Screenshots: `screenshots/FAQ ugly.PNG` (current), `screenshots/Kayak FAQ.PNG` (target)

## Overview
- **Priority:** P1
- **Status:** pending
- **Description:** Fix cramped FAQ page by adding proper padding, spacing, and visual hierarchy. Two files to change: `faq-accordion.tsx` (component padding) and `page.tsx` (category section layout).

## Key Insights

### Current Problems (from screenshot analysis)
1. **No horizontal padding** — Question text and answer text sit flush against container edge
2. **Cramped vertical spacing** — `py-4` on triggers, `pb-4 pt-0` on content = tight
3. **Category sections too close** — `space-y-12` between groups but inner spacing poor
4. **Border treatment** — `border-b` on each item + outer `border` on container = double-border look

### Kayak Reference Style
- Generous `px-6` internal padding on accordion items
- Clean `py-5` vertical spacing on triggers
- Answer text has `pb-6` for breathing room
- Categories separated by clear section headers with `mb-4` + `mt-10` spacing
- No outer container border — relies on whitespace for visual separation
- Questions use `text-base font-medium`, answers use `text-sm text-muted` with `leading-relaxed`

### Design System Alignment
- Use `var(--color-border-light)` (#F3F4F6) for subtle dividers
- Use `var(--color-text)` (#2D3748) for questions
- Use `var(--color-text-muted)` (#6B7280) for answers
- Keep Playfair Display for category headings (already using `font-serif`)

## Requirements
- Functional: All 22 Q&A items render identically — data unchanged
- Visual: Generous padding inside accordion items (px-5 md:px-6)
- Visual: Relaxed vertical spacing on triggers (py-5) and content (pb-6)
- Visual: Category sections clearly delineated with whitespace
- Visual: Remove outer border/shadow from accordion container — use card-style or plain
- Accessibility: No changes to ARIA attributes or keyboard navigation
- Responsive: Padding scales down on mobile (px-4 → px-6 at md breakpoint)

## Architecture
No new components. Styling-only changes to 2 existing files.

## Related Code Files
- **Modify:** `apps/web/components/pages/faq-accordion.tsx` — padding on trigger/content
- **Modify:** `apps/web/app/(site)/[locale]/(frontend)/faq/page.tsx` — category section spacing, container styling
- **No change:** `apps/web/components/ui/accordion.tsx` — base primitives untouched (shared component)

## Validated Decisions
- **Card style:** White card with `rounded-xl`, heading outside (above card)
- **Card border:** No border, rely on white-vs-off-white background contrast only
- **Heading position:** Outside card, above the accordion container

## Implementation Steps

### Step 1 — Update `faq-accordion.tsx` padding and spacing

Update the `FAQAccordion` component classes:

```tsx
export function FAQAccordion({ faqs, className }: FAQAccordionProps) {
  return (
    <Accordion type="single" collapsible className={className}>
      {faqs.map((faq, index) => (
        <AccordionItem
          key={index}
          value={`item-${index}`}
          className="border-b border-[var(--color-border-light)] last:border-b-0"
        >
          <AccordionTrigger className="px-5 py-5 text-left text-base font-medium text-[var(--color-text)] md:px-6">
            {faq.question}
          </AccordionTrigger>
          <AccordionContent className="px-5 pb-6 leading-relaxed text-[var(--color-text-muted)] md:px-6">
            {faq.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
```

Key changes:
- `AccordionItem`: lighter border color, remove border on last item
- `AccordionTrigger`: add `px-5 md:px-6`, increase to `py-5`, explicit text color
- `AccordionContent`: add `px-5 md:px-6`, increase to `pb-6`, add `leading-relaxed`

### Step 2 — Update `page.tsx` category section layout

Update the FAQ content section in `page.tsx`:

```tsx
{/* FAQ Content */}
<section className="container mx-auto px-4 py-12 lg:py-16">
  <div className="mx-auto max-w-3xl">
    {categoryKeys.map((category, index) => (
      <div key={category} className={index > 0 ? 'mt-10' : ''}>
        <h2 className="mb-4 font-serif text-xl font-bold text-[var(--color-primary)] md:text-2xl">
          {t(`categories.${category}`)}
        </h2>
        <FAQAccordion
          faqs={categoryFaqs[category]}
          className="rounded-xl bg-white"
        />
      </div>
    ))}
  </div>
  ...
```

Key changes:
- Replace `space-y-12` with explicit `mt-10` for category gaps (more control)
- Category heading: `mb-6` → `mb-4`, reduce from `text-2xl` to `text-xl md:text-2xl`
- Accordion container: remove `border shadow-sm`, keep `rounded-xl bg-white` only (no border)

### Step 3 — Verify visual output

Run dev server, check `/en/faq`, `/sv/faq`, `/de/faq`:
- Questions have visible horizontal padding (not flush with edge)
- Answers have relaxed line height and padding
- Category sections have clear visual separation
- Mobile: padding slightly smaller but still generous

### Step 4 — Run existing tests

```bash
cd apps/web && npx vitest run components/pages/__tests__/faq-accordion.test.tsx
```

Tests should pass unchanged — they test content rendering and interaction, not CSS classes.

## Todo List

- [ ] Update `faq-accordion.tsx`: add padding to trigger, content, lighter borders
- [ ] Update `page.tsx`: adjust category spacing, remove container border/shadow
- [ ] Visual verify across 3 locales in dev server
- [ ] Run FAQ accordion tests — confirm pass
- [ ] Run `tsc --noEmit` — confirm zero errors

## Success Criteria
- Questions/answers have visible horizontal padding (px-5 on mobile, px-6 on md+)
- Answer text uses `leading-relaxed` for readability
- Category sections visually separated with whitespace (mt-10)
- No outer heavy border on accordion groups
- All existing tests pass
- Zero TypeScript errors
- File stays under 200 LOC each

## Risk Assessment
- **Risk:** Changing `AccordionItem` className might conflict with base component's `border-b` → **Mitigation:** Override via className prop which uses `cn()` merge
- **Risk:** `leading-relaxed` on long German text could increase page height → **Acceptable:** readability > compactness

## Security Considerations
- CSS-only changes. No security surface.

## Next Steps
- Implementation via `/ck:code` or `/ck:cook`
- Post-implementation screenshot comparison
