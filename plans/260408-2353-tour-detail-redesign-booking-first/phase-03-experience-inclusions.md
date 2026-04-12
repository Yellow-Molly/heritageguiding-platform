# Phase 3: Experience & Inclusions Redesign

**Status:** Complete
**Priority:** Medium
**Effort:** Medium

## Overview

Redesign the experience section styling and completely restyle the inclusions section to match Option B design with colored cards.

## Key Design Specs

### Experience Section
- Heading: "The Experience", Playfair Display 28px desktop / 22px mobile, `--color-primary`
- Body: Inter 16px/14px, line-height 1.7, `--color-text`
- Mobile: truncated with "Read More" expand button (accent color)

### Inclusions Section
- 3 side-by-side cards (desktop), stacked (mobile):
  1. **Included**: `bg: #10B98110`, `border: #10B98130`, green check icons
  2. **Not Included**: `bg: #EF444410`, `border: #EF444430`, red X icons
  3. **What to Bring**: `bg: var(--color-background-alt)`, `border: var(--color-border)`, secondary color icons
- Card radius: `--radius-xl` desktop, `--radius-lg` mobile
- Title: Inter 14px/13px bold
- Items: Inter 13px/12px, icon 14px/13px

## Related Code Files

### Modify
- `apps/web/components/tour/tour-content.tsx` — Restyle experience, add mobile Read More
- `apps/web/components/tour/inclusions-section.tsx` — Redesign card styling

## Implementation Steps

1. Update `tour-content.tsx`:
   - Change heading from "sections.experience" icon (Sparkles) to plain text "The Experience"
   - Adjust font sizes: Playfair 28px desktop, 22px mobile
   - Add mobile "Read More" toggle for long descriptions
   - `'use client'` needed for Read More state (component currently server — will need to split or convert)

2. Update `inclusions-section.tsx`:
   - Replace hard-coded `green-50`/`red-50`/`amber-50` with hex colors from design
   - Included card: `bg-[#10B98110]` border `border-[#10B98130]`
   - Not Included card: `bg-[#EF444410]` border `border-[#EF444430]`
   - What to Bring: `bg-[var(--color-background-alt)]` border `border-[var(--color-border)]`
   - Each card: `rounded-xl p-5` desktop, `rounded-lg p-4` mobile
   - Use `lucide-react` Check, X, and contextual icons (footprints, cloud-sun, camera) for What to Bring
   - Layout: flex row with gap-20 (desktop), stack (mobile)

## Todo

- [x] Restyle experience heading and body text
- [x] Add mobile "Read More" expand/collapse
- [x] Redesign inclusions cards with design colors
- [x] Update icons for What to Bring section
