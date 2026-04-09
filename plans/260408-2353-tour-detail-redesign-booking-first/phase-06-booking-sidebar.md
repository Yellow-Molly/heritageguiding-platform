# Phase 6: Booking Sidebar Redesign

**Status:** Complete
**Priority:** High
**Effort:** Medium

## Overview

Redesign the booking sidebar to match Option B design with prominent price, cancellation badge, date/guest fields, styled CTA, total row, and inquiry button.

## Key Design Specs

- Container: `bg-surface`, `rounded-2xl`, border, shadow (`0 8px 32px #00000012`), padding 24px, sticky
- **Price row**: "895 SEK" Playfair 28px bold + "/ person" Inter 14px muted
- **Cancel badge**: green bg `#10B98110`, shield-check icon + "Free cancellation up to 24h before", Inter 12px bold
- **Date field**: label "Select Date" (Inter 13px bold), field with border, "Choose a date..." placeholder, calendar icon
- **Guest field**: label "Guests" (Inter 13px bold), field with border, "2 Adults" default, chevron-down icon
- **CTA**: `bg-[var(--color-accent)]`, full-width, `rounded-full`, calendar icon + "Check Availability", shadow
- **Total row**: "Total for 2 guests" left + "1,790 SEK" right bold
- **Inquiry button**: outline, `border-2 border-[var(--color-secondary)]`, `rounded-full`, mail icon + "Inquire About This Tour"
- **Instant confirmation**: zap icon + "Instant confirmation" small text

## Related Code Files

### Modify
- `apps/web/components/tour/booking-section.tsx` — Complete redesign

## Implementation Steps

1. Redesign container styling (remove Card component, use styled div)
2. Add price display (Playfair Display font)
3. Add cancellation trust badge
4. Keep Bokun widget integration — it replaces the date/guest/CTA fields when active
5. When NO Bokun integration: show static date/guest mockup fields + CTA
6. Restyle inquiry button with secondary border
7. Restyle trust signals (instant confirmation with zap icon)
8. Keep GroupInquiryModal integration

## Todo

- [x] Redesign sidebar container and price display
- [x] Add cancellation badge
- [x] Restyle CTA and inquiry buttons
- [x] Keep Bokun widget functional
- [x] Update trust signals styling
