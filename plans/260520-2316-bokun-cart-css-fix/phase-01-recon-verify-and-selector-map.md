# Phase 01 — Recon: verify CSS editor + selector mapping

## Context Links

- Plan: [plan.md](./plan.md)
- Brainstorm: `plans/reports/brainstorm-260520-2316-bokun-cart-delete-button-css-fix.md`
- Research: `plans/reports/researcher-260520-2257-bokun-checkout-customization-options.md`
- Widget integration: `apps/web/components/bokun-booking-widget-with-fallback.tsx`

## Overview

- **Priority:** Hard gate — blocks all subsequent phases
- **Status:** pending
- **Estimated effort:** 1 hour
- **Description:** Confirm Bokun admin exposes the "Show advanced options" CSS editor on our tier, then inspect the live cart in Chrome DevTools to identify the exact selectors we need to target.

## Key Insights

- Researcher confirmed feature exists per Bokun docs; tier coverage was NOT confirmed
- Bokun's scrambled class names (`sc-abCDe cbdEFg`) auto-regenerate on deploys; we want **readable** classes only
- Cart layout differs between desktop right-rail and mobile collapsible "Order summary" — both must be mapped

## Requirements

### Functional
- Document path to CSS editor in Bokun admin
- Record screenshot of CSS editor UI (proof of access)
- Record DOM snippet for cart item row, delete button, price text — desktop AND mobile
- Identify selector chain we can rely on (parent + readable class)

### Non-functional
- Use staging tour page if available; otherwise prod (no risk — read-only inspection)
- Capture both desktop (≥1024px) and mobile (<768px) breakpoints

## Architecture

No code architecture. This is recon work.

## Related Code Files

**Read for context only:**
- `apps/web/components/bokun-booking-widget-with-fallback.tsx` — confirms widget loader URL
- `apps/web/lib/bokun/bokun-booking-service-and-widget-url-generator.ts` — URL helpers

**To modify:** None this phase

## Implementation Steps

1. Open Bokun admin → log in
2. Navigate Settings → Booking channels → select the channel matching `NEXT_PUBLIC_BOKUN_UUID`
3. Open Widget tab → Theme section
4. Click **"Show advanced options"** (or equivalent label) — verify CSS/SASS editor appears
5. If present: screenshot the editor pane, save to `plans/260520-2316-bokun-cart-css-fix/visuals/01-bokun-css-editor.png`
6. If absent: HALT plan, escalate to user with proof — revisit Path B/C
7. Open a tour-detail page on the live site, scroll to booking widget, add tour to cart, proceed to checkout step where cart shows the X icon
8. Open Chrome DevTools → click the iframe content (DevTools may show iframe boundary; click into it)
9. Inspect the delete button element — capture:
   - Tag (button? a? span?)
   - All class names (note which look readable vs scrambled)
   - Parent chain up to a stable container
   - Computed bounding box dimensions
   - Computed color, background, contrast
10. Repeat at mobile breakpoint (DevTools device toolbar, iPhone preset)
11. Repeat for the price text adjacent to X (since separation styling will target it)
12. Record findings in `phase-01-recon-findings.md` (selector chain, current state, opportunities)

## Todo List

- [ ] Log into Bokun admin and locate Theme → Show advanced options
- [ ] Verify CSS editor is exposed; screenshot proof
- [ ] If absent → escalate; STOP plan (hard gate)
- [ ] Inspect cart delete button on desktop (≥1024px)
- [ ] Inspect cart delete button on mobile (<768px)
- [ ] Record DOM snippet, classes, bounding box for both breakpoints
- [ ] Identify stable readable-class selector chain
- [ ] Record findings to `phase-01-recon-findings.md`

## Success Criteria

- CSS editor confirmed accessible (screenshot in `visuals/`)
- Selector chain documented for desktop + mobile cart delete button
- At least one readable class identified per element (not scrambled)
- Current contrast and bounding-box measurements captured for before/after comparison

## Risk Assessment

| Risk | Mitigation |
|---|---|
| CSS editor absent on tier | Hard gate — escalate immediately, do not improvise |
| Iframe DevTools quirks | Use Chrome's "Select iframe content" or right-click → Inspect inside iframe |
| Scrambled-only classes | Walk DOM parent chain; combine readable parent + tag selector |
| Cart only visible after real checkout entry | Use Bokun test mode or low-value test booking; do NOT submit payment |

## Security Considerations

- Do not log in with personal account; use designated admin
- Do not commit screenshots containing real customer data or API keys
- Do not capture full network HAR with auth tokens

## Next Steps

- On success → Phase 02 (CSS implementation)
- On hard-gate failure → escalate to stakeholder, revisit Path B/C in brainstorm
