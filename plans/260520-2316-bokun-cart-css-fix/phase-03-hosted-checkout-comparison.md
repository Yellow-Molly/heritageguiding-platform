# Phase 03 — Hosted-checkout comparison test

## Context Links

- Plan: [plan.md](./plan.md)
- URL helper already in repo: `apps/web/lib/bokun/bokun-booking-service-and-widget-url-generator.ts` (exports `getBokunCheckoutUrl`)
- Existing fallback link: `apps/web/components/bokun-booking-widget-with-fallback.tsx:253-263` already surfaces `getBokunCheckoutUrl` when the embedded widget errors out
- Brainstorm decision: cheap empirical test to see if Bokun's full-page hosted checkout has materially better cart UX than the embedded iframe

## Overview

- **Priority:** Low — informational, may yield zero changes
- **Status:** pending (can run in parallel with Phase 02)
- **Estimated effort:** 1 hour
- **Description:** Open Bokun-hosted full-page checkout, compare cart UX side-by-side with embedded widget, decide whether to surface an escape-hatch link to users.

## Key Insights

- Hosted checkout URL is already computable via `getBokunCheckoutUrl` — no new code to test it
- This phase is research/decision, not implementation
- Outcome options: (a) hosted is materially better → consider exposing as "Continue on Bokun" link option; (b) same/worse → drop, no action
- A redirect to Bokun.io would hurt our brand continuity — would only be justified if hosted UX is *significantly* better

## Requirements

### Functional
- Side-by-side screenshot of embedded vs hosted cart row at desktop + mobile
- Documented assessment: is hosted cart delete button better, same, or worse?
- Documented decision: do we add a hosted-checkout link affordance, or skip?

### Non-functional
- No code change in this phase regardless of outcome (code change, if any, gets its own follow-up ticket)

## Architecture

No architecture change. Read-only evaluation.

## Related Code Files

**Read for context:**
- `apps/web/lib/bokun/bokun-booking-service-and-widget-url-generator.ts` — confirm URL shape
- `apps/web/components/bokun-booking-widget-with-fallback.tsx` — existing fallback-link pattern

**Modified this phase:** None

## Implementation Steps

1. Construct hosted-checkout URL using `getBokunCheckoutUrl(bookingChannelUUID, experienceId, { locale })` — pick a representative tour experienceId
2. Open URL in a fresh incognito Chrome window
3. Add tour to cart, advance to the cart/order-summary stage that mirrors the embedded screenshots
4. Screenshot the hosted cart at desktop breakpoint → `visuals/03-hosted-cart-desktop.png`
5. Resize to mobile (Device Toolbar) → screenshot → `visuals/03-hosted-cart-mobile.png`
6. Compare side-by-side with embedded cart screenshots from Phase 02
7. Evaluate against criteria:
   - Delete button size, contrast, label?
   - Cart row layout (item / price / delete separation)?
   - Mobile collapsible behavior?
   - Branding (does our channel logo + theme apply on hosted page)?
8. Write `phase-03-comparison-findings.md` with verdict: better / same / worse + decision
9. If "better" by a wide margin → file follow-up ticket (NOT in this phase) for surfacing a hosted-checkout link option to users
10. If "same / worse" → no action; close phase

## Todo List

- [ ] Compute hosted-checkout URL for representative tour
- [ ] Open in incognito, capture cart at desktop
- [ ] Capture cart at mobile breakpoint
- [ ] Side-by-side comparison vs embedded (Phase 02 screenshots)
- [ ] Write verdict + decision in `phase-03-comparison-findings.md`
- [ ] (If better) file follow-up ticket reference; this phase does NOT add link code

## Success Criteria

- Screenshots captured for hosted cart desktop + mobile
- Comparison documented
- Decision recorded (yes/no on follow-up ticket)

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Phase tempts scope creep ("let's add the link now") | Strict scope: research + decide only; code change is a separate ticket |
| Hosted checkout requires different auth/flow | Documented in brainstorm — `getBokunCheckoutUrl` is for cart resume / direct link; verify behavior, don't fight it |
| Hosted page brand mismatch (Bokun logo dominant) | If branding is jarring, that alone disqualifies the option — note in findings |

## Security Considerations

- Do not capture URLs with auth tokens in screenshots
- Do not submit actual payments during the test

## Next Steps

- Findings feed Phase 04 documentation
- If decision is "surface hosted link" → separate ticket (out of scope here)
