# Phase 2: Highlights Section

**Status:** Complete
**Priority:** Medium
**Effort:** Small

## Overview

Extract highlights from `TourContent` into a dedicated section that appears between the title section and the experience text. Desktop: 2-column grid of checkmark items. Mobile: single column with alt background.

## Key Design Specs

- Heading: "Tour Highlights", Playfair Display 24px desktop / 20px mobile, `--color-primary`
- 2-column grid (desktop), single column (mobile)
- Each item: `circle-check` icon (green #10B981) + text (Inter 14px/13px)
- Mobile: entire section has `bg-[var(--color-background-alt)]` with `py-24 px-20` padding

## Related Code Files

### Modify
- `apps/web/components/tour/tour-content.tsx` — Remove highlights rendering

### Create
- `apps/web/components/tour/tour-highlights-section.tsx` — Dedicated highlights component

### Read for Context
- `apps/web/app/(site)/[locale]/(frontend)/tours/[slug]/page.tsx` — Will add new component here

## Implementation Steps

1. Create `tour-highlights-section.tsx`:
   - Accept `highlights` array prop
   - Return null if empty
   - Desktop: `grid grid-cols-2 gap-3`
   - Mobile: `flex flex-col gap-2.5` with alt background wrapper
   - Each item: flex row with CheckCircle icon + text
   - Use `lucide-react` CircleCheck icon

2. Update `tour-content.tsx`:
   - Remove the highlights section (the `<section>` with `t('sections.highlights')`)
   - Keep experience/description and accessibility sections only

## Todo

- [x] Create `tour-highlights-section.tsx`
- [x] Remove highlights from `tour-content.tsx`
- [x] Integrate in page.tsx between title and experience
