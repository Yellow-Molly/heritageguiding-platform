# Phase 06 — FAQ Cancellation Q&A Rewrite

**Priority:** P2
**Status:** pending
**Effort:** 30m
**Depends on:** Phase 04 (link targets must exist)

## Context Links

- FAQ page: `apps/web/app/(site)/[locale]/(frontend)/faq/page.tsx`
- i18n keys: `faq.questions.cancellation.q1..q3` in en/sv/de messages

## Overview

Rewrite the 3 existing cancellation Q&As to defer to per-tour pages. No structural changes to FAQ page.

## Key Insights

- Q3 ("what if YOU cancel") remains platform-wide and should be emphasized as the one constant.
- Q1 and Q2 shift from definitive answers to pointers.
- Do NOT add per-tour FAQ accordion anywhere. User confirmed in brainstorm: global FAQ + tour detail section is sufficient.

## Requirements

### Functional

Rewrite all 3 Q&As in `faq.questions.cancellation`:

- **Q1 "What is your cancellation policy?"** — Answer: "Cancellation terms vary by tour. Open any tour and scroll to the 'Cancellation policy' section for its exact refund schedule. See [how our system works](/cancellation) for the overall framework."
- **Q2 "Can I reschedule my tour?"** — Answer: "Rescheduling is handled through our booking system and depends on the tour's own terms. Check the tour's Cancellation section, or contact us if you need help."
- **Q3 "What if the tour is canceled by you?"** — Answer: "If we cancel (weather, safety, guide availability), you always receive a 100% refund — no tour-specific exceptions." (emphasize as platform constant)

### Non-functional
- Links in answers render correctly via existing FAQ answer renderer.
- No structural changes to FAQ page, accordion, or categories.

## Related Code Files

**Modify:**
- `apps/web/messages/en.json` — rewrite `faq.questions.cancellation.q1.answer`, `q2.answer`, `q3.answer`, and any linked metadata keys
- `apps/web/messages/sv.json` — sync with `[TODO-TRANSLATE]` markers
- `apps/web/messages/de.json` — sync with `[TODO-TRANSLATE]` markers

**Read:**
- `apps/web/components/faq/faq-accordion.tsx` (or wherever) — confirm answer rendering supports links (markdown or rich text)

## Implementation Steps

1. Locate FAQ answer renderer; confirm it supports inline links. If pure text only, either use the closest supported syntax (likely next-intl rich text) or add a static "Learn more" link outside the answer body.
2. Rewrite en.json Q1/Q2/Q3 answers.
3. Sync sv/de with `[TODO-TRANSLATE]` markers.
4. Render check `/en/faq`, `/sv/faq`, `/de/faq`. Expand each cancellation Q&A. Verify formatting and links.
5. Click link in Q1 answer, confirm navigates to `/cancellation`.

## Todo List

- [ ] Confirm FAQ answer renderer link capability
- [ ] Rewrite en.json 3 Q&As
- [ ] Sync sv.json with markers
- [ ] Sync de.json with markers
- [ ] Render + interaction check across 3 locales

## Success Criteria

- All 3 Q&As read as pointers (except Q3 which is platform guarantee).
- Links work and target correct pages.
- No broken rich-text rendering.
- No orphaned i18n keys left behind.

## Risk Assessment

- **FAQ renderer doesn't support inline links** → render links as plain URL text or adjacent "Read more" button. Don't over-engineer for this.
- **Users land on FAQ from Google and miss the per-tour detail** → mitigated by explicit pointer language in Q1.

## Security Considerations

- None.

## Next Steps

Phase 07 validates end-to-end: tour page, FAQ, /cancellation all tell the same story.
