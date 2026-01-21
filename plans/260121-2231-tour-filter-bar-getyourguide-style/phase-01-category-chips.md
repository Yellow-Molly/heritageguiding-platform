# Phase 01: Category Chips Component

## Context Links

- [Design Guidelines](../../docs/design-guidelines.md) - Color palette, typography
- [Code Standards](../../docs/code-standards.md) - Component structure
- [Existing get-categories.ts](../../apps/web/lib/api/get-categories.ts) - Category data source

## Overview

| Field | Value |
|-------|-------|
| Priority | P2 |
| Status | pending |
| Effort | 2h |
| Dependencies | None (first phase) |

Build horizontally scrollable, multi-select category chip component using CSS scroll-snap. Categories fetched from CMS via existing `getCategories()` API.

## Key Insights

1. **GetYourGuide pattern**: Chips scroll horizontally with visible partial chips hinting at more content
2. **CSS scroll-snap**: Native browser feature, no JS library needed
3. **Fade gradient edges**: CSS gradient overlays to indicate scrollability
4. **Multi-select**: Chips toggle on/off, URL stores comma-separated slugs
5. **Existing API**: `getCategories('theme', locale)` returns categories with tourCount

## Requirements

### Functional
- FR-01: Display category chips in horizontal scrollable container
- FR-02: Support multi-select (multiple chips can be active)
- FR-03: Show "All" chip as first option to clear category filter
- FR-04: Display tour count badge on each chip
- FR-05: Update URL with comma-separated category slugs
- FR-06: Sync state from URL on mount (shareable links)

### Non-Functional
- NFR-01: Smooth scroll-snap behavior
- NFR-02: Fade gradient edges indicating scrollability
- NFR-03: Touch-friendly on mobile (min 44px height)
- NFR-04: Keyboard accessible (arrow keys to navigate)
- NFR-05: Screen reader announces selected state

## Architecture

```tsx
// Component props
interface CategoryChipsProps {
  categories: Category[]           // From CMS
  selectedCategories: string[]     // Current selected slugs
  onCategoriesChange: (slugs: string[]) => void
  resultsCount?: number           // Optional total results
}

// Internal state managed via URL
// URL: ?categories=history,nature
```

### Visual Structure

```
[fade] [All ✓] [History (8)] [Architecture (5)] [Nature (4)] [Maritime (3)] [Royal (4)] [fade]
                             ^^^^^^^^^^^^^^^^^
                             scroll-snap-align: start
```

## Related Code Files

### Files to Create
- `apps/web/components/tour/filter-bar/category-chips.tsx`

### Files to Reference
- `apps/web/lib/api/get-categories.ts` - Category type and API
- `apps/web/components/ui/button.tsx` - Button styles for chips
- `apps/web/app/globals.css` - CSS variables

## Implementation Steps

### Step 1: Create CategoryChips Component Shell
```tsx
// apps/web/components/tour/filter-bar/category-chips.tsx
'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import type { Category } from '@/lib/api/get-categories'

interface CategoryChipsProps {
  categories: Category[]
}

export function CategoryChips({ categories }: CategoryChipsProps) {
  const t = useTranslations('tours.filters')
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Parse selected categories from URL
  const selectedCategories = searchParams.get('categories')?.split(',').filter(Boolean) || []

  // Toggle category selection
  const toggleCategory = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString())
    let newSelected: string[]

    if (slug === '') {
      // "All" clicked - clear categories
      newSelected = []
    } else if (selectedCategories.includes(slug)) {
      // Deselect
      newSelected = selectedCategories.filter(s => s !== slug)
    } else {
      // Select
      newSelected = [...selectedCategories, slug]
    }

    if (newSelected.length > 0) {
      params.set('categories', newSelected.join(','))
    } else {
      params.delete('categories')
    }
    params.delete('page') // Reset pagination

    router.push(`${pathname}?${params.toString()}`)
  }

  // ... render chips
}
```

### Step 2: Add Scroll Container with CSS Snap
```tsx
// Inside CategoryChips component
return (
  <div className="relative">
    {/* Left fade gradient */}
    <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[var(--color-surface)] to-transparent z-10" />

    {/* Scrollable chip container */}
    <div
      className={cn(
        'flex gap-2 overflow-x-auto px-8 py-2',
        'scroll-smooth snap-x snap-mandatory',
        'scrollbar-hide' // Custom utility class
      )}
      role="listbox"
      aria-label={t('selectCategories')}
      aria-multiselectable="true"
    >
      {/* "All" chip */}
      <CategoryChip
        label={t('allCategories')}
        isSelected={selectedCategories.length === 0}
        onClick={() => toggleCategory('')}
      />

      {/* Category chips */}
      {categories.map((category) => (
        <CategoryChip
          key={category.id}
          label={category.name}
          count={category.tourCount}
          isSelected={selectedCategories.includes(category.slug)}
          onClick={() => toggleCategory(category.slug)}
        />
      ))}
    </div>

    {/* Right fade gradient */}
    <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[var(--color-surface)] to-transparent z-10" />
  </div>
)
```

### Step 3: Create Individual Chip Component
```tsx
// Inside same file or extract to separate component
interface CategoryChipProps {
  label: string
  count?: number
  isSelected: boolean
  onClick: () => void
}

function CategoryChip({ label, count, isSelected, onClick }: CategoryChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="option"
      aria-selected={isSelected}
      className={cn(
        'flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2',
        'text-sm font-medium transition-all duration-200',
        'snap-start scroll-ml-8', // Scroll snap alignment
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2',
        isSelected
          ? 'bg-[var(--color-primary)] text-white shadow-md'
          : 'bg-[var(--color-background-alt)] text-[var(--color-text)] hover:bg-[var(--color-border)]'
      )}
    >
      {label}
      {count !== undefined && (
        <span
          className={cn(
            'rounded-full px-1.5 py-0.5 text-xs',
            isSelected
              ? 'bg-white/20 text-white'
              : 'bg-[var(--color-border)] text-[var(--color-text-muted)]'
          )}
        >
          {count}
        </span>
      )}
    </button>
  )
}
```

### Step 4: Add CSS Utility for Hidden Scrollbar
```css
/* Add to apps/web/app/globals.css */
/* Hide scrollbar for Chrome, Safari and Opera */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
/* Hide scrollbar for IE, Edge and Firefox */
.scrollbar-hide {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}
```

### Step 5: Add i18n Keys
```json
// apps/web/messages/en.json - add to tours.filters section
{
  "tours": {
    "filters": {
      "selectCategories": "Select tour categories",
      "allCategories": "All",
      "categorySelected": "{name} selected",
      "categoryDeselected": "{name} deselected"
    }
  }
}
```

### Step 6: Add Keyboard Navigation (Optional Enhancement)
```tsx
// Add to scroll container
const handleKeyDown = (e: React.KeyboardEvent) => {
  const container = e.currentTarget
  if (e.key === 'ArrowRight') {
    container.scrollBy({ left: 100, behavior: 'smooth' })
  } else if (e.key === 'ArrowLeft') {
    container.scrollBy({ left: -100, behavior: 'smooth' })
  }
}

// On container: onKeyDown={handleKeyDown} tabIndex={0}
```

## Todo List

- [ ] Create `category-chips.tsx` component file
- [ ] Implement scroll container with CSS snap
- [ ] Add fade gradient overlays
- [ ] Implement multi-select logic with URL state
- [ ] Create individual chip styling
- [ ] Add `scrollbar-hide` utility to globals.css
- [ ] Add i18n keys for all 3 locales (en, sv, de)
- [ ] Test keyboard navigation
- [ ] Test screen reader announcements
- [ ] Verify touch scrolling on mobile

## Success Criteria

- [ ] Chips scroll horizontally with snap behavior
- [ ] Multiple chips can be selected simultaneously
- [ ] URL updates with comma-separated category slugs
- [ ] Page reloads preserve selection from URL
- [ ] Fade gradients visible at edges
- [ ] Touch scrolling smooth on mobile
- [ ] Keyboard accessible (Tab to focus, arrows to scroll)

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| scroll-snap inconsistent across browsers | Low | Medium | Test on Safari, Chrome, Firefox; fallback to overflow-x-auto only |
| Gradient overlays cover clickable area | Low | Low | Use `pointer-events-none` on overlays |
| Too many categories cause slow scroll | Low | Low | Consider virtualization if >20 categories |

## Security Considerations

- Sanitize category slugs from URL before using in queries
- Validate category slugs against known categories server-side

## Next Steps

After completion:
1. Proceed to [Phase 02: Filter Bar Layout](./phase-02-filter-bar-layout.md)
2. Integrate CategoryChips into FilterBar container
