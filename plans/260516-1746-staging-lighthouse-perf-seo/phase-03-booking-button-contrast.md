---
phase: 3
title: "Fix Booking Button Color Contrast"
status: complete
priority: P1
effort: 0.5h
implemented_at: 2026-05-16
---

## Implementation Summary (2026-05-16)

**Root cause:** the `outline` button variant in `apps/web/components/ui/button.tsx:27-34` is `border-white text-white bg-transparent` — designed for use over the dark hero overlay (works there). But the sticky booking sidebar uses `bg-[var(--color-surface)]` (white). White-on-white = invisible.

There is already a sibling variant `outline-dark` (`button.tsx:35-40`) that uses `var(--color-primary)` (#1E3A5F navy) on transparent. On the surface white bg, contrast is ~11.7:1 (WCAG AAA).

**Changes (2 lines):**
- `apps/web/components/booking/group-inquiry-modal.tsx:25` — `variant="outline"` → `variant="outline-dark"`
- `apps/web/components/bokun-booking-widget-with-fallback.tsx:152` — same swap for the "Try Again" error-state button (rendered inside same sticky sidebar)

**No new tokens, no design-token edits** — KISS. Existing variant was the right one.

**Pending staging verification (post-deploy):** Lighthouse TourDetails mobile → A11y = 1.0 expected (only `color-contrast` audit was failing).



# Phase 3: Fix Booking Button Color Contrast

## Context
- [Plan overview](plan.md)
- Lighthouse `color-contrast` failure (TourDetails mobile, A11y 0.96) flagged 2 buttons in the sticky booking sidebar:
  - `div.sticky > div.mt-5 > div.rounded-lg > button.inline-flex` at top:3029
  - `div.sticky > div.mt-3 > span > button.inline-flex` at top:3239
- Source: `apps/web/components/tour/booking-section.tsx` → `BokunBookingWidget` (`bokun-booking-widget-with-fallback.tsx:142-161`) + `GroupInquiryModal` (`booking/group-inquiry-modal.tsx:25`)

## Why
Booking CTAs failing WCAG contrast is a conversion + a11y issue. Some users literally cannot read the action label.

## Root-Cause Map
- **Button 1** (`div.mt-5 > div.rounded-lg > button.inline-flex`): "Try Again" inside Bokun error fallback (`bokun-booking-widget-with-fallback.tsx:151-159`). Uses `<Button variant="outline">` inside `bg-destructive/10`.
  - **Likely auto-resolves after Phase 2 lands**: CSP fix → widget loads → error fallback never renders.
- **Button 2** (`div.mt-3 > span > button.inline-flex`): "Group Inquiry" modal trigger (`group-inquiry-modal.tsx:25`). `<Button variant="outline" className="w-full">` — shadcn outline variant with project's design tokens.
  - **Remains after Phase 2.** Must verify contrast against `--color-background`.

## Implementation Steps

### Step 1: Wait for Phase 2 → re-audit
After CSP fix deploys to staging, re-run Lighthouse on TourDetails. Check `color-contrast` audit details:
```bash
# Look for which button still fails — selector + bounding rect
```

### Step 2: Identify shadcn Button outline variant tokens
```
grep -n "variant.*outline\|outline:" apps/web/components/ui/button.tsx 2>&1
```
Locate the `outline` variant class definition (likely `border bg-background hover:bg-accent hover:text-accent-foreground` or similar).

### Step 3: Measure contrast of the failing token combo
Tokens to check (in `apps/web/app/(site)/[locale]/global.css` or design tokens file):
- `--color-secondary` (used in booking-section.tsx:78 for inquiry button)
- `--color-text` / foreground on `--color-background`

Use any contrast checker (Chrome DevTools, https://webaim.org/resources/contrastchecker/). Target: **4.5:1 for text, 3:1 for UI components and large text**.

### Step 4: Fix the failing token
Two options — pick the smaller-blast-radius one:
- **A. Adjust the design token** in the global stylesheet (changes everywhere — only if the token is genuinely too light)
- **B. Override the button's color locally** in `booking-section.tsx` or `group-inquiry-modal.tsx` (KISS, no system-wide ripple)

Prefer (B) unless the same token fails in multiple Lighthouse audits.

### Step 5: Verify
- Local: open `/en/tours/<slug>`, inspect button, devtools contrast ratio
- Staging: re-run Lighthouse, confirm A11y = 1.0

## Related Code Files
- `apps/web/components/tour/booking-section.tsx`
- `apps/web/components/booking/group-inquiry-modal.tsx`
- `apps/web/components/bokun-booking-widget-with-fallback.tsx` (may not need touching if Phase 2 lands first)
- `apps/web/components/ui/button.tsx` (shadcn variant definitions)
- Design tokens file (likely `apps/web/app/globals.css` or `apps/web/styles/...`)

## Todo List
- [ ] Wait for Phase 2 deployment, re-run Lighthouse TourDetails
- [ ] Confirm which button(s) still fail contrast
- [ ] Locate failing token(s); measure exact contrast ratio
- [ ] Apply minimal fix (local override preferred)
- [ ] Re-verify A11y = 1.0 on staging

## Success Criteria
- TourDetails A11y score = 1.0 on mobile & desktop
- All booking-area buttons pass WCAG AA (4.5:1 text, 3:1 UI)

## Risk
- Token adjustment may ripple to other components — visual regression check needed if going with option (A).

## Unresolved Questions
- Does Phase 2 fully eliminate Button 1 (the "Try Again" error state)? If the widget *can* fail for non-CSP reasons (network), that button still needs contrast fix. Decide after re-audit.
