---
phase: 05
title: "Email Templates — Render Add-on Lines in Confirmation & Cancellation"
status: complete
priority: P2
effort: 1-2h
blockedBy: [04]
completed: 2026-05-25
---

# Phase 05 — Email Templates: Add-on Lines

## Context Links

- Confirmation email: `apps/web/lib/email/send-booking-confirmation-to-customer.ts`
- Cancellation email: `apps/web/lib/email/send-booking-cancellation-to-customer.ts`
- Caller: `apps/web/lib/bokun/persist-bokun-booking.ts`
- Mapper output: Phase 04 `MappedAddOnLine`

## Overview

**Priority:** P2 (nice-to-have for v1; can ship after Phase 04 if blocking go-live)
**Status:** complete (2026-05-25) — `AddOnEmailLine` type shared between confirmation + cancellation senders; persist-bokun-booking wires via `toEmailAddOns` helper

Add optional `addOns` parameter to both email senders. When present, render a small itemized block under the tour/date lines and before total. When absent, emails behave exactly as today.

## Key Insights

- Existing emails use simple inline HTML strings — no template engine. Stay consistent.
- HTML-escape every dynamic field (existing `escapeHtml` helper)
- Match existing email tone: concise, plain-text-friendly
- Currency display: per-line currency, with fallback to booking currency (safety)

## Requirements

**Functional:**
- `BookingConfirmationData` accepts optional `addOns?: AddOnEmailLine[]`
- Same for `BookingCancellationData`
- When `addOns` populated: render under `peopleLine`, before `total` line
- When absent or empty array: zero email diff vs today

**Non-functional:**
- No new dependencies (no template engine)
- All copy in-line in template; localized copy deferred (Bokun confirmation emails today are English-only — confirm and follow existing pattern)

## Architecture

### Shape passed into emails

```ts
export interface AddOnEmailLine {
  name: string
  qty: number
  totalPrice: string
  currency: string
}
```

Caller (`persist-bokun-booking.ts`) maps from `MappedAddOnLine[]` → `AddOnEmailLine[]` (just picks the 4 fields needed; drops internal IDs and per-person flag).

### Confirmation email block

Inside `send-booking-confirmation-to-customer.ts`, after `peopleLine`, before total:

```ts
const addOnsBlock = data.addOns?.length
  ? `<p><strong>Add-ons:</strong></p>
     <ul style="margin: 4px 0; padding-left: 20px;">
       ${data.addOns.map((a) =>
         `<li>${escapeHtml(a.name)} × ${a.qty} — ${escapeHtml(a.totalPrice)} ${escapeHtml(a.currency)}</li>`
       ).join('')}
     </ul>`
  : ''
```

Insert `${addOnsBlock}` between `${peopleLine}` and total line.

### Cancellation email

Less detail needed — single summary line:

```ts
const addOnsLine = data.addOns?.length
  ? `<p><strong>Add-ons included:</strong> ${data.addOns.map((a) => `${escapeHtml(a.name)} × ${a.qty}`).join(', ')}</p>`
  : ''
```

### Caller wiring

`persist-bokun-booking.ts` — add `addOns` to both `sendBookingConfirmationToCustomer` and `sendBookingCancellationToCustomer` call sites:

```ts
addOns: row.addOns?.map(({ name, qty, totalPrice, currency }) => ({ name, qty, totalPrice, currency })),
```

## Related Code Files

**Modify:**
- `apps/web/lib/email/send-booking-confirmation-to-customer.ts` — extend `BookingConfirmationData`, add render block
- `apps/web/lib/email/send-booking-cancellation-to-customer.ts` — extend `BookingCancellationData`, add render line
- `apps/web/lib/bokun/persist-bokun-booking.ts` — pass `addOns` to both calls

**Read:**
- Existing email tests (if any) to keep parity

## Implementation Steps

1. Extend `BookingConfirmationData` with `addOns?: AddOnEmailLine[]`
2. Add `addOnsBlock` render between people line and total line
3. Extend `BookingCancellationData` and add inline summary line
4. Update `persist-bokun-booking.ts` to pass mapped add-ons into both senders
5. Manual: trigger a confirmation email locally with fixture add-ons → inspect HTML (open in browser or email client)
6. Manual: same for cancellation
7. Verify no regression: send confirmation/cancellation for a booking without add-ons; HTML matches pre-change snapshot
8. Typecheck + lint green

## Todo List

- [x] `AddOnEmailLine` type defined (in confirmation file, imported by cancellation)
- [x] Confirmation: `addOns?` on data shape + `addOnsBlock` itemized `<ul>` between `peopleLine` and total
- [x] Cancellation: `addOns?` on data shape + single comma-separated summary line
- [x] `persist-bokun-booking.ts` wires both via `toEmailAddOns` helper (picks 4 fields from `MappedAddOnLine`)
- [ ] Manual email render with add-ons (pending real sandbox booking — non-blocking)
- [ ] Manual email render without add-ons (pending; code-path inspection confirms empty-string fallthrough)
- [x] Typecheck green; 171/171 tests pass

## Success Criteria

- Confirmation email for a booking with 2 add-ons shows itemized list
- Cancellation email for the same booking shows summary line
- Booking without add-ons produces byte-identical HTML to pre-change baseline (manual diff)

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Email clients render lists inconsistently | Use inline `style="..."` on `<ul>` (Gmail-friendly); keep markup minimal |
| Currency code differs per line vs booking | Show per-line currency (already in `MappedAddOnLine`); never mix on a single line |
| Long add-on name wraps awkwardly | No fix needed — list items wrap; if QA reports issue, truncate at 60 chars |

## Security Considerations

- All dynamic fields routed through existing `escapeHtml` helper
- No raw HTML from Bokun trusted

## Next Steps

- No downstream phase depends on this
- If localized emails become a priority later, this template becomes a candidate for migration to react-email or similar

## Unresolved Questions

- Should emails localize add-on copy (sv/en/de) to match the tour booking locale? **Default v1:** no — existing emails are English-only; defer until full email i18n is scoped.
