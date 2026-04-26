# Phase 05 — /cancellation Page Copy Rewrite

**Priority:** P2
**Status:** pending
**Effort:** 1h
**Depends on:** Phase 04 (UX language alignment)

## Context Links

- Existing page: `apps/web/app/(site)/[locale]/(frontend)/cancellation/page.tsx`
- Existing components: `apps/web/components/cancellation/*` (6 files — all reused, no structural change)
- Prior plan: `plans/260412-2254-cancellation-policy-page/` (built this page)
- i18n namespace: `cancellation` in `apps/web/messages/{en,sv,de}.json`

## Overview

Reframe `/cancellation` from "the platform policy" to "how our cancellation system works." Content changes only — zero code changes to components.

## Key Insights

- All 6 components (hero, tiers, stepper, prose, trust banner, CTA) are keepers. Visual design stays; copy shifts perspective.
- Tiers section becomes **illustrative examples**, explicitly labeled. Users should not read tiers as binding for all tours.
- The "we-cancel" guarantee (100% refund if WE cancel) is the only remaining platform-wide absolute. Elevate it visually/copy-wise.
- CTA changes from "Contact support" focus to "Browse tours for specific policies."

## Requirements

### Functional
Rewrite all `cancellation.*` keys in `en.json` first, then sync sv.json + de.json with `[TODO-TRANSLATE]` placeholders for any substantially changed strings (minor tweaks can keep current translations).

Section-by-section changes:

1. **Hero** — subtitle shifts from definitive to framing: "Every tour has its own cancellation terms. Here's how our system works — check each tour for specific refund rules."
2. **Tiers** — add section eyebrow "Example tiers you'll see" or "Typical refund structure." Keep the 3-card visual but ensure copy says "typical" / "most tours."
3. **Stepper** — "How to cancel" — keep as-is; process is platform-wide.
4. **Prose** — revise 4 blocks:
   - Block 1: remove hard-coded cutoffs if any; talk about tiered refunds generically.
   - Block 2: emphasize "If WE cancel, you always get a 100% refund" as a boldened guarantee.
   - Block 3: reschedule = handled via booking system per tour.
   - Block 4: how to find your tour's exact policy (link to tour detail anchor).
5. **Trust banner** — minor: add "per-tour transparency" or similar item.
6. **CTA** — change primary button from generic contact to "Browse tours" → `/tours`. Keep secondary contact option.

### Non-functional
- Zero component structure changes.
- Preserve existing SEO metadata shape (just update `description`).
- i18n keys preserved where copy unchanged; only changed strings need re-translation.

## Related Code Files

**Modify:**
- `apps/web/messages/en.json` — rewrite changed keys under `cancellation.*`
- `apps/web/messages/sv.json` — update matching keys, mark `[TODO-TRANSLATE]` on substantially changed
- `apps/web/messages/de.json` — same
- `apps/web/app/(site)/[locale]/(frontend)/cancellation/page.tsx` — update `generateMetadata` description only

**Do not touch:**
- Any file in `apps/web/components/cancellation/` — component code is fine

## Implementation Steps

1. Open `en.json`, navigate to `cancellation` namespace.
2. Walk through each section's keys; rewrite per "Requirements" above.
3. Update page metadata description to reflect framework-explainer framing.
4. Copy new en values to sv.json and de.json; mark substantially changed values with leading `[TODO-TRANSLATE]`.
5. Local dev render check across en/sv/de: `/en/cancellation`, `/sv/cancellation`, `/de/cancellation`. Confirm no missing-key warnings.
6. Open PR with translator review request for flagged keys.

## Todo List

- [ ] Rewrite en.json `cancellation.*` keys
- [ ] Update page metadata description
- [ ] Sync sv.json with `[TODO-TRANSLATE]` markers
- [ ] Sync de.json with `[TODO-TRANSLATE]` markers
- [ ] Render check all 3 locales
- [ ] Flag translator review

## Success Criteria

- `/cancellation` reads as framework explainer, not authoritative table.
- "We cancel → 100% refund" clearly elevated.
- CTA drives users to tour pages.
- Zero i18n key-missing warnings.
- No component code changed.

## Risk Assessment

- **Translator turnaround delay** → sv/de can ship with `[TODO-TRANSLATE]` markers but NOT show them to users. Either hold launch until translations back, OR temporarily keep old sv/de copy (safe but inconsistent with en).
- **SEO drop from copy rewrite** — minimal risk; page still covers same topic. Keep slug and meta title similar.

## Security Considerations

- None. Static content.

## Next Steps

Phase 06 aligns FAQ with this new framing.
