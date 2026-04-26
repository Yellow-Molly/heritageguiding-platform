# Phase 04 — Tours Section Update

## Context
- [Design spec](research/researcher-01-design-spec.md) — Tours Grid section
- [guide-tours-section.tsx](../../apps/web/components/guide/guide-tours-section.tsx)

## Overview
- **Priority:** P2
- **Status:** Pending
- **Effort:** 1h
- **Blocked by:** Phase 1 (data layer — tour data shape unchanged, but needs Phase 6 i18n keys)

Update tour card grid from 3-column to 2-column on desktop, and restyle cards: remove floating price badge overlay, add inline price below meta row, update image height, match design spec typography.

## Key Insights
- Current grid: `sm:grid-cols-2 lg:grid-cols-3` → change to `lg:grid-cols-2` (stays 1-col on mobile)
- Current card has price badge overlaying image bottom-right — design wants inline price in card body
- Rating + duration should be on same meta row (currently separate rows)
- Card uses existing `Card`/`CardContent` UI primitives — keep them
- Image height: 180px desktop, 160px mobile (currently `aspect-[4/3]`)

## Requirements

**Functional:**
- Grid: 2-column desktop (gap 24px), 1-column mobile (gap 16px)
- Card image: fixed height 180px (desktop) / 160px (mobile), full width, no overlay badge
- Card body: title (Inter 15px/14px semibold), meta row (duration + rating on same line, 13px/12px muted), price (Inter 16px/15px bold, primary color)
- Card border: `--color-border`, radius `--radius-lg`, bg `--color-surface`
- Hover: existing shadow-card-hover transition (keep)

**Non-functional:**
- File stays under 200 LOC (currently 90 lines, target ~85)

## Architecture
No new files — in-place update of `guide-tours-section.tsx`.

### Card layout change
```
BEFORE:                          AFTER:
┌─────────────────┐              ┌─────────────────┐
│     Image        │              │     Image        │
│          [$price]│              │                  │
├─────────────────┤              ├─────────────────┤
│ ★ 4.8 (12)      │              │ Tour Title       │
│ Tour Title       │              │ ⏱ 2h · ★ 4.8(12)│
│ ⏱ 2 hours       │              │ 1,200 SEK        │
└─────────────────┘              └─────────────────┘
```

## Related Code Files
| Action | File |
|--------|------|
| Modify | `apps/web/components/guide/guide-tours-section.tsx` |

## Implementation Steps

1. **Grid change:** Replace `sm:grid-cols-2 lg:grid-cols-3` with `grid-cols-1 lg:grid-cols-2` and `gap-4 lg:gap-6`

2. **Image container:** Replace `aspect-[4/3]` with `h-40 lg:h-[180px]` for fixed height

3. **Remove price badge overlay:** Delete the `absolute bottom-3 right-3` price div inside image container

4. **Reorder card body:**
   - Title first: `font-body text-[15px] font-semibold` (keep existing Link)
   - Meta row: combine duration + rating in single flex row with dot separator
     ```
     <div className="mt-2 flex items-center gap-3 text-[13px] text-[var(--color-text-muted)]">
       {duration && <span className="flex items-center gap-1"><Clock .../>{formatDuration(...)}</span>}
       {rating > 0 && <span className="flex items-center gap-1"><Star .../>{rating} ({reviewCount})</span>}
     </div>
     ```
   - Price: `<p className="mt-2 text-base font-bold text-[var(--color-primary)]">{formatPrice(tour.price)}</p>`

5. **Section heading:** Update to `font-serif text-[28px] font-bold` (from current `text-2xl font-semibold`) to match design

6. **Sizes attribute:** Update image `sizes` to `"(max-width: 1024px) 100vw, 50vw"` (was 33vw for 3-col)

## Todo
- [ ] Change grid to 2-column desktop
- [ ] Remove price overlay badge from image
- [ ] Merge duration + rating into single meta row
- [ ] Add inline price below meta row
- [ ] Update image height to fixed 180/160px
- [ ] Update heading typography
- [ ] Update image sizes attribute

## Success Criteria
- Desktop: 2-column grid with 24px gap
- Mobile: 1-column with 16px gap
- No floating price badge; price shown inline in card body
- Duration and rating on same meta row
- Heading matches design spec (28px Playfair bold)

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Fixed image height crops poorly | Low | Medium | `object-cover` handles this; test with various aspect ratios |
| `formatPrice` output format mismatch | Low | Low | Already used elsewhere, format is established |

## Security Considerations
None.

## Next Steps
Phase 5 adds mobile sticky CTA. Phase 7 tests the full page.
