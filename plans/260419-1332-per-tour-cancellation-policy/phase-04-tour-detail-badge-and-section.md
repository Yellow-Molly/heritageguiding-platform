# Phase 04 — Tour Detail UI: Sidebar Badge + Cancellation Section

**Priority:** P1
**Status:** pending
**Effort:** 2-3h
**Depends on:** Phase 02 (schema), Phase 03 (data)

## Context Links

- Tour detail page: `apps/web/app/(site)/[locale]/(frontend)/tours/[slug]/page.tsx`
- Existing booking sidebar with hardcoded "Free Cancellation" badge (per scout report)
- Existing `/cancellation` page components for visual reference: `apps/web/components/cancellation/*`
- Global default constant from Phase 02

## Overview

Surface the per-tour policy on tour detail via two artifacts:
1. **Sidebar badge** — derived label (short, glanceable).
2. **Dedicated section** — full tier list, optional notes, link to framework page.

Badge click scrolls to section.

## Key Insights

- Badge label is **derived**, not stored. Pure function: `rules[] → { label, tone }`. Keeps i18n minimal and avoids CMS/i18n drift.
- Section uses the same visual language as existing cancellation tier cards on `/cancellation` page (reuse colors, icons — not components, since tour section is denser).
- Inquiry tours (no rules) fall back to global default and display same badge/section. Add subtle "standard policy" marker so users know it's not tour-specific.

## Requirements

### Functional
- Badge derivation logic:
  - `rules.length === 0` → use `GLOBAL_DEFAULT_CANCELLATION_POLICY`, marker `source: 'global-default'`.
  - Top tier (highest `hoursBeforeStart`) has `refundPercentage === 100` → label = `"Free cancellation up to {X}h"`, tone = positive.
  - Top tier < 100 → label = `"Cancellation terms apply"`, tone = neutral.
- Badge is clickable → smooth scroll to `#cancellation-policy`.
- Section renders:
  - Heading "Cancellation policy" (i18n)
  - Ordered list of rules sorted by `hoursBeforeStart` desc, with human-readable labels
  - Optional localized `notes` richText below list
  - Microcopy "Final terms are confirmed at checkout."
  - Link: "Learn how our cancellation system works →" `/cancellation`
  - If `source === 'global-default'`: prepend note "This tour uses our standard cancellation policy."

### Non-functional
- Server component (no client JS needed for render).
- Smooth scroll can use CSS `scroll-behavior: smooth` or a thin client component only if anchor scroll doesn't suffice.
- Accessible: badge is `<a href="#cancellation-policy">` with `aria-describedby` pointing to section id.

## Related Code Files

**Create:**
- `apps/web/lib/cancellation/derive-badge.ts` — pure function, unit-testable. Returns `{ label: string, tone: 'positive' | 'neutral', sourceKey: 'tour' | 'global-default' }`. Takes `rules[]` + `t` function for i18n.
- `apps/web/lib/cancellation/format-rule.ts` — pure function: rule → localized label ("More than 24h before start", "Between 2 and 24h", "Less than 2h").
- `apps/web/components/tour-detail/cancellation-badge.tsx` — sidebar badge component.
- `apps/web/components/tour-detail/cancellation-section.tsx` — dedicated section component.

**Modify:**
- `apps/web/app/(site)/[locale]/(frontend)/tours/[slug]/page.tsx` — wire in new section below logistics.
- Existing booking sidebar component — replace hardcoded badge with new component.
- `apps/web/messages/en.json`, `sv.json`, `de.json` — add `tourDetail.cancellation.*` keys:
  - `section.title`
  - `section.microcopy.finalTermsAtCheckout`
  - `section.cta.learnFramework`
  - `section.fallback.standardPolicy`
  - `badge.freeUpTo` (e.g., `"Free cancellation up to {hours}h"`)
  - `badge.termsApply`
  - `tier.moreThan` (e.g., `"More than {hours}h before start"`)
  - `tier.between` (`"Between {min}h and {max}h before start"`)
  - `tier.lessThan` (`"Less than {hours}h before start"`)
  - `tier.refundPct` (`"{pct}% refund"`) — or inline

## Architecture

```
tour/[slug]/page.tsx
  ├── <BookingSidebar>
  │     └── <CancellationBadge rules={rules} />  ← derive-badge.ts
  └── <CancellationSection rules={rules} notes={notes} source={source} />
        └── uses format-rule.ts for each tier
```

```ts
// lib/cancellation/derive-badge.ts
export function deriveCancellationBadge(
  rules: CancellationRule[],
  globalDefault: CancellationRule[],
  t: TranslationFn
): { label: string; tone: 'positive' | 'neutral'; sourceKey: 'tour' | 'global-default' } {
  const effective = rules.length ? rules : globalDefault
  const sourceKey = rules.length ? 'tour' : 'global-default'
  const top = [...effective].sort((a,b) => b.hoursBeforeStart - a.hoursBeforeStart)[0]
  if (top?.refundPercentage === 100) {
    return { label: t('badge.freeUpTo', { hours: top.hoursBeforeStart }), tone: 'positive', sourceKey }
  }
  return { label: t('badge.termsApply'), tone: 'neutral', sourceKey }
}
```

## Implementation Steps

1. Write `derive-badge.ts` + vitest unit tests (covers: free-up-to, terms-apply, empty→default fallback).
2. Write `format-rule.ts` + unit tests (covers: top-tier "more than", middle "between", bottom "less than" — edge case: single rule → "more than X → Y% refund").
3. Add i18n keys to en/sv/de. English first; copy en values to sv/de as placeholders with `[TODO-TRANSLATE]` markers for translator review.
4. Build `CancellationBadge` component — render as `<a>` with icon (ShieldCheck for positive, Info for neutral), label text, smooth-scroll anchor.
5. Build `CancellationSection` component — heading, ordered list, notes richText render (reuse existing rich text renderer), microcopy, framework link, fallback-note conditional.
6. Replace hardcoded "Free Cancellation" badge in booking sidebar.
7. Wire section into tour detail page composition (below logistics/meeting point, above guide card — confirm with existing layout).
8. Test locally on 3 tours: one with Bokun standard, one with strict terms, one inquiry-only (no Bokun ID).
9. Check en/sv/de rendering; verify no key collisions.
10. Accessibility check: tab through booking sidebar, confirm badge is focusable and triggers scroll to section.

## Todo List

- [ ] `derive-badge.ts` + tests
- [ ] `format-rule.ts` + tests
- [ ] i18n keys in en.json (final), sv.json, de.json (placeholders)
- [ ] `CancellationBadge` component
- [ ] `CancellationSection` component
- [ ] Replace hardcoded badge in booking sidebar
- [ ] Wire section into tour detail page
- [ ] Test 3 tour variants locally
- [ ] Verify en/sv/de render
- [ ] a11y: focus order + scroll behavior

## Success Criteria

- Badge renders correctly for all 3 cases (free, terms-apply, fallback).
- Section shows exact rules matching Bokun for Bokun-linked tours.
- Inquiry tours show global default with "standard policy" note.
- No console errors, no TS errors, no hydration mismatches.
- Manual a11y check passes.

## Risk Assessment

- **Existing booking sidebar layout breaks** — the badge replacement should be a drop-in. If sidebar component is not modular enough, extract badge slot first.
- **Rich text renderer for notes** — confirm existing Payload lexical renderer is already used elsewhere on tour detail; reuse it. Don't introduce a new renderer.
- **Scroll anchor on mobile** — sticky header may cover section heading. Use `scroll-margin-top` CSS on the section container.

## Security Considerations

- No user input. All data CMS-sourced. No XSS risk beyond existing rich text handling.

## Next Steps

Phase 05 rewrites global `/cancellation` copy to align with this new per-tour flow.
