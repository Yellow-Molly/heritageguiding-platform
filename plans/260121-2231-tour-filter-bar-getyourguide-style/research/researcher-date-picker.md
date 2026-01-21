# Date Picker Research Report
**Project:** Tour Filter Bar with Date Range Selection
**Stack:** Next.js 15 + React 19 + Tailwind CSS 4
**Date:** 2026-01-21

---

## Executive Summary

**Recommendation:** Use **react-day-picker v9.11.1** + **shadcn/ui Date Range Picker** for production-ready date selection. Alternative: **react-datepicker** if vanilla HTML input fallback needed.

Current codebase already has:
- ✅ `date-fns@4.1.0` (date utilities)
- ✅ Tailwind CSS 4 with PostCSS
- ✅ Lucide React icons
- ✅ `react-datepicker` in CMS package (NOT in web app)

---

## Library Recommendation

### Primary: react-day-picker v9.11.1
**Status:** React 19 compatible (v9.4.3+)
**Latest Release:** 9.11.1 (actively maintained)
**Bundle Size:** ~8KB (gzipped)

**Advantages:**
- Headless calendar component (full control over UI)
- Works perfectly with Tailwind CSS 4
- Excellent accessibility (ARIA, keyboard navigation)
- Lightweight, zero dependencies
- Mobile-friendly by default
- Composable with shadcn/ui ecosystem

**React 19 Compatibility:**
- Earlier v9 releases (9.4.2) had ref issues with custom components
- Fixed in v9.4.3+
- Current v9.11.1 fully stable

**Integration Pattern:**
```typescript
// apps/web/components/tour/tour-date-range-picker.tsx
'use client'
import { DayPicker } from 'react-day-picker'
import { format } from 'date-fns'
import 'react-day-picker/dist/style.css'
// Custom Tailwind styling wraps default styles
```

---

## Implementation Approach

### Option 1: shadcn/ui Date Range Picker (Recommended)
- Pre-built component combining DayPicker + Popover + Input
- Styled with Tailwind CSS 4
- Copy-paste pattern (no npm install needed beyond dependencies)
- Already has date-fns@4.1.0 in project

**Steps:**
1. Copy shadcn/ui date-range-picker component
2. Integrate into FilterDrawer
3. Parse date range, update URL query params (existing pattern in filter-drawer.tsx)

### Option 2: Custom DayPicker + Popover
- Manual composition for specialized UI
- Full control over mobile/desktop behavior
- Slightly more code but maximum flexibility

### Option 3: Radix UI + React DayPicker
- Leverage existing Radix Accordion dependency
- Use Radix Popover + DayPicker
- Native accessibility built-in

---

## Tailwind CSS 4 Integration

**Tailwind CSS 4 with PostCSS v4** already configured (`@tailwindcss/postcss`).

**Styling approach:**
- React DayPicker ships with default CSS (minimal, easily overridable)
- Override with Tailwind utility classes via custom CSS module
- No CSS-in-JS needed; pure Tailwind

**Mobile-Friendly CSS:**
```css
/* apps/web/styles/date-picker.css */
.rdp {
  --cell-size: 36px; /* Smaller on mobile */
  --months: 1; /* Single month on mobile, 2 on desktop */
  font-size: 14px;
}

@media (min-width: 768px) {
  .rdp {
    --cell-size: 40px;
    --months: 2;
    font-size: 16px;
  }
}
```

---

## Accessibility Considerations

**react-day-picker v9 defaults:**
- ✅ Full keyboard navigation (arrows, Enter, Escape)
- ✅ ARIA labels on all interactive elements
- ✅ `role="grid"` for month calendar
- ✅ `aria-disabled` for unavailable dates
- ✅ Focus management with visible focus indicators
- ✅ Respects `prefers-reduced-motion`

**Implementation checklist:**
- [ ] Test with screen reader (NVDA/JAWS)
- [ ] Keyboard-only navigation (Tab, arrow keys)
- [ ] Test focus indicators visible
- [ ] Ensure date range label accessible in UI

**Required additions:**
```typescript
// ARIA labels for date inputs
<label htmlFor="start-date" className="sr-only">
  Start date
</label>
<label htmlFor="end-date" className="sr-only">
  End date
</label>
```

---

## Mobile-Friendly Considerations

**Screen size challenges:**
- Date picker needs 280px min width (single month)
- Full dialog on mobile (<768px), popover on desktop
- Touch targets: 44px minimum (DayPicker: 36px, needs padding)

**Recommended mobile approach:**
```typescript
// Render as full-screen dialog on mobile (≤640px)
// Render as popover on desktop (>640px)
const isMobile = useMediaQuery('(max-width: 640px)')

return isMobile ? <Dialog /> : <Popover />
```

**Mobile CSS adjustments:**
- Increase cell padding (4px → 8px on mobile)
- Show single month by default
- Allow swipe to change months
- Use touch-friendly date input format

---

## Existing Codebase Integration

**Current patterns in filter-drawer.tsx:**
- URL query params for state management (`?category=...&duration=...`)
- `useSearchParams()`, `useRouter()` for navigation
- Custom select filters with translation support

**Date range integration:**
```typescript
// Add to FilterDrawer component
const startDate = searchParams.get('startDate')  // YYYY-MM-DD
const endDate = searchParams.get('endDate')      // YYYY-MM-DD

const updateDateRange = (start: Date | null, end: Date | null) => {
  const params = new URLSearchParams(searchParams.toString())
  if (start) params.set('startDate', format(start, 'yyyy-MM-dd'))
  if (end) params.set('endDate', format(end, 'yyyy-MM-dd'))
  router.push(`${pathname}?${params.toString()}`)
}
```

---

## Installation Summary

**No new npm packages needed** if using react-day-picker alone:
- Already have: `date-fns@4.1.0`, `tailwindcss@4`, `@radix-ui/react-accordion`

**Optional additions:**
- `react-day-picker@9.11.1` if not using shadcn/ui pre-built
- `@radix-ui/react-popover@1.0.0+` for popover container

---

## Unresolved Questions

1. Should date range persist across page navigation or reset per session?
2. What date format for display (localized vs ISO)?
3. Should past dates be disabled for tour booking?
4. Mobile: Full-screen dialog or drawer-based popover?
