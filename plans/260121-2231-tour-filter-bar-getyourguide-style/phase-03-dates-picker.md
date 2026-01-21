# Phase 03: Dates Picker Component

## Context Links

- [Phase 02: Filter Bar Layout](./phase-02-filter-bar-layout.md) - Prerequisite
- [Design Guidelines](../../docs/design-guidelines.md) - Colors, typography
- [react-day-picker v9 docs](https://daypicker.dev/) - Component API

## Overview

| Field | Value |
|-------|-------|
| Priority | P2 |
| Status | pending |
| Effort | 3h |
| Dependencies | Phase 02 (Filter Bar Layout), npm install |

Build date range picker using react-day-picker v9.11.1 with Radix UI Popover for tour availability filtering. Updates URL with ISO date strings.

## Key Insights

1. **react-day-picker v9**: React 19 compatible, SSR-safe, accessible by default
2. **Radix Popover**: Accessible, handles focus management, portal rendering
3. **date-fns v4**: Already installed (4.1.0), use for formatting/parsing
4. **URL state**: `startDate=2026-01-25&endDate=2026-01-30` (ISO format)
5. **Button display**: "Jan 25 - Jan 30" or "Select dates" when empty

## Requirements

### Functional
- FR-01: Click button to open date picker popover
- FR-02: Select date range (start and end dates)
- FR-03: Display selected range in button label
- FR-04: Update URL with startDate and endDate params
- FR-05: Clear dates option (X button or "Clear" link)
- FR-06: Disable past dates (tours can't be in past)
- FR-07: Localized date format based on locale

### Non-Functional
- NFR-01: Popover closes on outside click
- NFR-02: Escape key closes popover
- NFR-03: Focus returns to trigger button on close
- NFR-04: Calendar keyboard navigable
- NFR-05: Screen reader announces selected range

## Architecture

```tsx
interface DatesPickerProps {
  locale: string  // For date formatting
}

// URL params
// ?startDate=2026-01-25&endDate=2026-01-30
```

### Visual Structure

```
┌─────────────────────────┐
│ [📅 Jan 25 - Jan 30 ✕]  │  ← Trigger button
└─────────────────────────┘
            │
            ▼
┌─────────────────────────────┐
│      < January 2026 >       │
├─────────────────────────────┤
│ Su Mo Tu We Th Fr Sa        │
│        1  2  3  4           │
│  5  6  7  8  9 10 11        │
│ 12 13 14 15 16 17 18        │
│ 19 20 21 22 23 24 [25]      │  ← Range start
│ 26 27 28 [29][30] 31        │  ← Range end
└─────────────────────────────┘
```

## Related Code Files

### Files to Create
- `apps/web/components/ui/popover.tsx` - Radix wrapper
- `apps/web/components/tour/filter-bar/dates-picker.tsx`

### Files to Modify
- `apps/web/components/tour/filter-bar/filter-bar.tsx` - Add DatesPicker
- `apps/web/lib/api/get-tours.ts` - Add date filtering
- `apps/web/messages/*.json` - Add i18n keys

### Dependencies to Install
```bash
npm install react-day-picker@^9.11.1 @radix-ui/react-popover
```

## Implementation Steps

### Step 1: Install Dependencies
```bash
cd apps/web
npm install react-day-picker@^9.11.1 @radix-ui/react-popover
```

### Step 2: Create Popover UI Component
```tsx
// apps/web/components/ui/popover.tsx
'use client'

import * as React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { cn } from '@/lib/utils'

const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger
const PopoverAnchor = PopoverPrimitive.Anchor

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = 'center', sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        'z-[600] rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-xl',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[side=bottom]:slide-in-from-top-2',
        'data-[side=top]:slide-in-from-bottom-2',
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
```

### Step 3: Create DatesPicker Component
```tsx
// apps/web/components/tour/filter-bar/dates-picker.tsx
'use client'

import { useState } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { DayPicker, type DateRange } from 'react-day-picker'
import { format, parse, isValid, startOfDay } from 'date-fns'
import { enUS, sv, de } from 'date-fns/locale'
import { CalendarDays, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

// Locale mapping for date-fns
const localeMap = {
  en: enUS,
  sv: sv,
  de: de,
}

const DATE_FORMAT = 'yyyy-MM-dd' // ISO format for URL

export function DatesPicker() {
  const t = useTranslations('tours.filters')
  const locale = useLocale() as keyof typeof localeMap
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  // Parse dates from URL
  const startDateStr = searchParams.get('startDate')
  const endDateStr = searchParams.get('endDate')

  const parseDate = (str: string | null): Date | undefined => {
    if (!str) return undefined
    const date = parse(str, DATE_FORMAT, new Date())
    return isValid(date) ? date : undefined
  }

  const startDate = parseDate(startDateStr)
  const endDate = parseDate(endDateStr)

  const selectedRange: DateRange | undefined =
    startDate || endDate ? { from: startDate, to: endDate } : undefined

  // Update URL with new date range
  const handleSelect = (range: DateRange | undefined) => {
    const params = new URLSearchParams(searchParams.toString())

    if (range?.from) {
      params.set('startDate', format(range.from, DATE_FORMAT))
    } else {
      params.delete('startDate')
    }

    if (range?.to) {
      params.set('endDate', format(range.to, DATE_FORMAT))
    } else {
      params.delete('endDate')
    }

    params.delete('page') // Reset pagination
    router.push(`${pathname}?${params.toString()}`)
  }

  // Clear date selection
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    handleSelect(undefined)
    setIsOpen(false)
  }

  // Format display text
  const getDisplayText = (): string => {
    if (!startDate && !endDate) {
      return t('selectDates')
    }

    const dateLocale = localeMap[locale] || enUS
    const displayFormat = 'MMM d'

    if (startDate && endDate) {
      return `${format(startDate, displayFormat, { locale: dateLocale })} - ${format(endDate, displayFormat, { locale: dateLocale })}`
    }

    if (startDate) {
      return `${format(startDate, displayFormat, { locale: dateLocale })} - ...`
    }

    return t('selectDates')
  }

  const hasSelection = startDate || endDate

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center gap-2 h-10 px-3 rounded-lg border',
            'text-sm font-medium transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2',
            hasSelection
              ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]'
              : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-background-alt)]'
          )}
          aria-label={t('selectDates')}
        >
          <CalendarDays className="h-4 w-4 flex-shrink-0" />
          <span className="whitespace-nowrap">{getDisplayText()}</span>
          {hasSelection && (
            <button
              type="button"
              onClick={handleClear}
              className="ml-1 rounded-full p-0.5 hover:bg-[var(--color-primary)]/20"
              aria-label={t('clearDates')}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <DayPicker
          mode="range"
          selected={selectedRange}
          onSelect={handleSelect}
          locale={localeMap[locale]}
          disabled={{ before: startOfDay(new Date()) }}
          numberOfMonths={1}
          showOutsideDays
          classNames={{
            root: 'p-3',
            months: 'flex flex-col',
            month: 'space-y-4',
            caption: 'flex justify-center pt-1 relative items-center',
            caption_label: 'text-sm font-medium text-[var(--color-text)]',
            nav: 'space-x-1 flex items-center',
            nav_button: cn(
              'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
              'inline-flex items-center justify-center rounded-md',
              'hover:bg-[var(--color-background-alt)]'
            ),
            nav_button_previous: 'absolute left-1',
            nav_button_next: 'absolute right-1',
            table: 'w-full border-collapse space-y-1',
            head_row: 'flex',
            head_cell: 'text-[var(--color-text-muted)] rounded-md w-9 font-normal text-[0.8rem]',
            row: 'flex w-full mt-2',
            cell: cn(
              'h-9 w-9 text-center text-sm p-0 relative',
              'focus-within:relative focus-within:z-20'
            ),
            day: cn(
              'h-9 w-9 p-0 font-normal',
              'inline-flex items-center justify-center rounded-md',
              'hover:bg-[var(--color-background-alt)]',
              'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]',
              'aria-selected:opacity-100'
            ),
            day_range_start: 'day-range-start rounded-l-md',
            day_range_end: 'day-range-end rounded-r-md',
            day_selected: cn(
              'bg-[var(--color-primary)] text-white',
              'hover:bg-[var(--color-primary)] hover:text-white',
              'focus:bg-[var(--color-primary)] focus:text-white'
            ),
            day_today: 'bg-[var(--color-secondary)]/20 text-[var(--color-secondary-dark)]',
            day_outside: 'text-[var(--color-text-muted)] opacity-50',
            day_disabled: 'text-[var(--color-text-muted)] opacity-50',
            day_range_middle: 'bg-[var(--color-primary)]/10 rounded-none',
            day_hidden: 'invisible',
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
```

### Step 4: Add CSS for Day Picker Range
```css
/* apps/web/app/globals.css - add to animations section */

/* react-day-picker range styling */
.day-range-start:not(.day-range-end) {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.day-range-end:not(.day-range-start) {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}
```

### Step 5: Integrate into FilterBar
```tsx
// apps/web/components/tour/filter-bar/filter-bar.tsx
// Add import
import { DatesPicker } from './dates-picker'

// In desktop layout, after CategoryChips:
<div className="flex-shrink-0">
  <DatesPicker />
</div>

// In mobile layout, add to row 3 or as separate row
```

### Step 6: Update get-tours.ts for Date Filtering
```tsx
// apps/web/lib/api/get-tours.ts
// Add to TourFilters interface:
export interface TourFilters {
  // ... existing fields
  startDate?: string  // ISO date string
  endDate?: string    // ISO date string
}

// Add to ValidatedTourFilters type:
// In validation, validate date format

// In applyFilters function:
// Date filtering (for mock data, just pass through)
// In production, query tours with availability in date range
```

### Step 7: Add i18n Keys
```json
// apps/web/messages/en.json
{
  "tours": {
    "filters": {
      "selectDates": "Select dates",
      "clearDates": "Clear dates",
      "dateRange": "{start} to {end}"
    }
  }
}

// apps/web/messages/sv.json
{
  "tours": {
    "filters": {
      "selectDates": "Välj datum",
      "clearDates": "Rensa datum",
      "dateRange": "{start} till {end}"
    }
  }
}

// apps/web/messages/de.json
{
  "tours": {
    "filters": {
      "selectDates": "Datum auswählen",
      "clearDates": "Datum löschen",
      "dateRange": "{start} bis {end}"
    }
  }
}
```

### Step 8: Export from Barrel
```ts
// apps/web/components/tour/filter-bar/index.ts
export { DatesPicker } from './dates-picker'
```

## Todo List

- [ ] Install react-day-picker@^9.11.1 and @radix-ui/react-popover
- [ ] Create `popover.tsx` Radix wrapper component
- [ ] Create `dates-picker.tsx` component
- [ ] Implement URL state management for dates
- [ ] Style calendar with design tokens
- [ ] Add clear button functionality
- [ ] Disable past dates
- [ ] Integrate into FilterBar (desktop and mobile)
- [ ] Update get-tours.ts TourFilters interface
- [ ] Add i18n keys for all 3 locales
- [ ] Test keyboard navigation
- [ ] Test screen reader announcements

## Success Criteria

- [ ] Clicking button opens calendar popover
- [ ] Can select date range (start and end)
- [ ] URL updates with startDate and endDate params
- [ ] Button label shows formatted date range
- [ ] Clear button removes date selection
- [ ] Past dates are disabled
- [ ] Calendar uses correct locale for day/month names
- [ ] Keyboard navigable (arrows, Enter, Escape)
- [ ] Screen reader announces selected dates

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| react-day-picker SSR issues | Low | High | Use 'use client' directive; test SSR |
| Popover positioning off-screen | Low | Medium | Use Radix collision detection |
| Locale imports increase bundle | Medium | Low | Dynamic import locales or accept bundle increase |

## Security Considerations

- Validate date format from URL params
- Ensure dates are sanitized before database queries
- Don't trust client date validation alone

## Next Steps

After completion:
1. Proceed to [Phase 04: Integration & Testing](./phase-04-integration-testing.md)
2. Write unit tests for DatesPicker
3. Test full filter flow end-to-end
