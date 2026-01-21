# Phase 04: Integration & Testing

## Context Links

- [Phase 01: Category Chips](./phase-01-category-chips.md)
- [Phase 02: Filter Bar Layout](./phase-02-filter-bar-layout.md)
- [Phase 03: Dates Picker](./phase-03-dates-picker.md)
- [Code Standards - Testing](../../docs/code-standards.md#testing-strategy)

## Overview

| Field | Value |
|-------|-------|
| Priority | P2 |
| Status | pending |
| Effort | 1h |
| Dependencies | Phases 01-03 complete |

Final integration, testing, and cleanup. Deprecate old `tour-filters.tsx`, ensure 80%+ test coverage, verify accessibility and performance.

## Key Insights

1. **Integration point**: `tour-catalog-client.tsx` connects all filter components
2. **Test strategy**: Unit tests for each component, integration test for filter flow
3. **Deprecation**: Mark old `tour-filters.tsx` as deprecated, keep for reference
4. **Accessibility**: Verify WCAG 2.1 AA with automated and manual testing
5. **Performance**: Lighthouse 90+ target, check bundle size impact

## Requirements

### Functional
- FR-01: All filter components work together in FilterBar
- FR-02: URL state persists across navigation
- FR-03: Filters combine correctly (categories AND dates AND search)
- FR-04: Old tour-filters.tsx deprecated/removed

### Non-Functional
- NFR-01: 80%+ test coverage on new components
- NFR-02: Lighthouse performance 90+
- NFR-03: WCAG 2.1 AA compliant
- NFR-04: Bundle size increase < 20KB gzipped

## Architecture

### Test Structure
```
apps/web/components/tour/filter-bar/__tests__/
├── category-chips.test.tsx      # Unit tests
├── dates-picker.test.tsx        # Unit tests
├── filter-bar.test.tsx          # Integration tests
└── results-count.test.tsx       # Unit tests
```

## Related Code Files

### Files to Create
- `apps/web/components/tour/filter-bar/__tests__/category-chips.test.tsx`
- `apps/web/components/tour/filter-bar/__tests__/dates-picker.test.tsx`
- `apps/web/components/tour/filter-bar/__tests__/filter-bar.test.tsx`
- `apps/web/components/tour/filter-bar/__tests__/results-count.test.tsx`

### Files to Modify
- `apps/web/components/tour/tour-filters.tsx` - Add deprecation notice
- `apps/web/components/tour/index.ts` - Update exports

### Files to Verify
- `apps/web/app/[locale]/(frontend)/tours/page.tsx`
- `apps/web/app/[locale]/(frontend)/tours/tour-catalog-client.tsx`

## Implementation Steps

### Step 1: Create Test Setup
```tsx
// apps/web/components/tour/filter-bar/__tests__/test-utils.tsx
import { render } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'

const messages = {
  tours: {
    filters: {
      selectCategories: 'Select tour categories',
      allCategories: 'All',
      selectDates: 'Select dates',
      clearDates: 'Clear dates',
      resultsCount: '{count} results',
    },
  },
}

export function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  )
}
```

### Step 2: CategoryChips Unit Tests
```tsx
// apps/web/components/tour/filter-bar/__tests__/category-chips.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from './test-utils'
import { CategoryChips } from '../category-chips'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(''),
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/en/tours',
}))

const mockCategories = [
  { id: 'history', name: 'History', slug: 'history', type: 'theme' as const, tourCount: 8 },
  { id: 'nature', name: 'Nature', slug: 'nature', type: 'theme' as const, tourCount: 4 },
]

describe('CategoryChips', () => {
  it('renders all category chips plus "All" chip', () => {
    renderWithIntl(<CategoryChips categories={mockCategories} />)

    expect(screen.getByText('All')).toBeInTheDocument()
    expect(screen.getByText('History')).toBeInTheDocument()
    expect(screen.getByText('Nature')).toBeInTheDocument()
  })

  it('shows tour count badges', () => {
    renderWithIntl(<CategoryChips categories={mockCategories} />)

    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('applies selected styling to active chips', () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams('categories=history')
    )

    renderWithIntl(<CategoryChips categories={mockCategories} />)

    const historyChip = screen.getByText('History').closest('button')
    expect(historyChip).toHaveAttribute('aria-selected', 'true')
  })

  it('updates URL on chip click', () => {
    const mockPush = vi.fn()
    vi.mocked(useRouter).mockReturnValue({ push: mockPush })

    renderWithIntl(<CategoryChips categories={mockCategories} />)

    fireEvent.click(screen.getByText('History'))

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('categories=history')
    )
  })

  it('supports multi-select', () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams('categories=history')
    )
    const mockPush = vi.fn()
    vi.mocked(useRouter).mockReturnValue({ push: mockPush })

    renderWithIntl(<CategoryChips categories={mockCategories} />)

    fireEvent.click(screen.getByText('Nature'))

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('categories=history,nature')
    )
  })

  it('clears selection when "All" is clicked', () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams('categories=history,nature')
    )
    const mockPush = vi.fn()
    vi.mocked(useRouter).mockReturnValue({ push: mockPush })

    renderWithIntl(<CategoryChips categories={mockCategories} />)

    fireEvent.click(screen.getByText('All'))

    expect(mockPush).toHaveBeenCalledWith(
      expect.not.stringContaining('categories=')
    )
  })
})
```

### Step 3: DatesPicker Unit Tests
```tsx
// apps/web/components/tour/filter-bar/__tests__/dates-picker.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from './test-utils'
import { DatesPicker } from '../dates-picker'

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(''),
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/en/tours',
}))

describe('DatesPicker', () => {
  it('renders trigger button with placeholder text', () => {
    renderWithIntl(<DatesPicker />)

    expect(screen.getByText('Select dates')).toBeInTheDocument()
  })

  it('opens calendar popover on click', () => {
    renderWithIntl(<DatesPicker />)

    fireEvent.click(screen.getByText('Select dates'))

    // Calendar should be visible
    expect(screen.getByRole('grid')).toBeInTheDocument()
  })

  it('displays selected date range in button', () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams('startDate=2026-01-25&endDate=2026-01-30')
    )

    renderWithIntl(<DatesPicker />)

    expect(screen.getByText(/Jan 25/)).toBeInTheDocument()
    expect(screen.getByText(/Jan 30/)).toBeInTheDocument()
  })

  it('shows clear button when dates selected', () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams('startDate=2026-01-25')
    )

    renderWithIntl(<DatesPicker />)

    expect(screen.getByLabelText('Clear dates')).toBeInTheDocument()
  })

  it('clears dates on clear button click', () => {
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams('startDate=2026-01-25')
    )
    const mockPush = vi.fn()
    vi.mocked(useRouter).mockReturnValue({ push: mockPush })

    renderWithIntl(<DatesPicker />)

    fireEvent.click(screen.getByLabelText('Clear dates'))

    expect(mockPush).toHaveBeenCalledWith(
      expect.not.stringContaining('startDate=')
    )
  })

  it('disables past dates', () => {
    renderWithIntl(<DatesPicker />)

    fireEvent.click(screen.getByText('Select dates'))

    // Yesterday's date should be disabled
    // (Implementation depends on current date, use mock date in CI)
  })
})
```

### Step 4: ResultsCount Unit Tests
```tsx
// apps/web/components/tour/filter-bar/__tests__/results-count.test.tsx
import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from './test-utils'
import { ResultsCount } from '../results-count'

describe('ResultsCount', () => {
  it('renders count with pluralization', () => {
    renderWithIntl(<ResultsCount count={42} />)

    expect(screen.getByText('42 results')).toBeInTheDocument()
  })

  it('handles singular case', () => {
    renderWithIntl(<ResultsCount count={1} />)

    expect(screen.getByText('1 result')).toBeInTheDocument()
  })

  it('handles zero results', () => {
    renderWithIntl(<ResultsCount count={0} />)

    expect(screen.getByText('No results')).toBeInTheDocument()
  })
})
```

### Step 5: FilterBar Integration Tests
```tsx
// apps/web/components/tour/filter-bar/__tests__/filter-bar.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithIntl } from './test-utils'
import { FilterBar } from '../filter-bar'

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(''),
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/en/tours',
}))

const mockCategories = [
  { id: 'history', name: 'History', slug: 'history', type: 'theme' as const, tourCount: 8 },
]

describe('FilterBar', () => {
  it('renders all filter components', () => {
    renderWithIntl(
      <FilterBar totalResults={42} categories={mockCategories} />
    )

    // Search input
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()

    // Category chips
    expect(screen.getByText('History')).toBeInTheDocument()

    // Results count
    expect(screen.getByText('42 results')).toBeInTheDocument()
  })

  it('applies sticky positioning', () => {
    const { container } = renderWithIntl(
      <FilterBar totalResults={42} categories={mockCategories} />
    )

    const stickyElement = container.querySelector('.sticky')
    expect(stickyElement).toBeInTheDocument()
  })

  it('shows view mode toggle when callback provided', () => {
    const onViewModeChange = vi.fn()

    renderWithIntl(
      <FilterBar
        totalResults={42}
        categories={mockCategories}
        viewMode="grid"
        onViewModeChange={onViewModeChange}
      />
    )

    expect(screen.getByLabelText('Grid view')).toBeInTheDocument()
    expect(screen.getByLabelText('List view')).toBeInTheDocument()
  })
})
```

### Step 6: Deprecate Old tour-filters.tsx
```tsx
// apps/web/components/tour/tour-filters.tsx
// Add at top of file:

/**
 * @deprecated Use FilterBar from '@/components/tour/filter-bar' instead.
 * This component will be removed in a future release.
 * Migration: Replace <TourFilters /> with <FilterBar /> and pass required props.
 */

// Keep rest of file for backward compatibility during transition
```

### Step 7: Update Component Exports
```ts
// apps/web/components/tour/index.ts
// Add new exports
export { FilterBar, CategoryChips, DatesPicker, ResultsCount } from './filter-bar'

// Keep old export with deprecation warning (remove in next major version)
export { TourFilters } from './tour-filters' // @deprecated
```

### Step 8: Run Tests and Check Coverage
```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Check specific file coverage
npm test -- --coverage apps/web/components/tour/filter-bar/
```

### Step 9: Performance Audit
```bash
# Build and analyze bundle
npm run build

# Run Lighthouse audit
npx lighthouse http://localhost:3000/en/tours --output html --output-path ./lighthouse-report.html
```

### Step 10: Accessibility Audit Checklist

Manual testing:
- [ ] Tab through all interactive elements in order
- [ ] Use arrow keys to navigate category chips
- [ ] Use keyboard to select dates in picker
- [ ] Test with screen reader (VoiceOver/NVDA)
- [ ] Verify focus visible states
- [ ] Check color contrast ratios

Automated testing:
```bash
# Using axe-core
npx @axe-core/cli http://localhost:3000/en/tours
```

## Todo List

- [ ] Create test setup utilities
- [ ] Write CategoryChips unit tests
- [ ] Write DatesPicker unit tests
- [ ] Write ResultsCount unit tests
- [ ] Write FilterBar integration tests
- [ ] Add deprecation notice to old tour-filters.tsx
- [ ] Update component barrel exports
- [ ] Run test suite and verify 80%+ coverage
- [ ] Run Lighthouse audit (target 90+)
- [ ] Complete accessibility audit
- [ ] Document migration path from old to new component

## Success Criteria

- [ ] All tests pass
- [ ] Coverage >= 80% on new components
- [ ] Lighthouse performance >= 90
- [ ] No accessibility violations (WCAG 2.1 AA)
- [ ] Bundle size increase < 20KB gzipped
- [ ] Old component marked deprecated
- [ ] Migration documentation complete

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Test flakiness with dates | Medium | Low | Mock Date.now() in tests |
| Coverage threshold not met | Low | Medium | Add edge case tests |
| Accessibility violations found | Medium | Medium | Fix before merge |

## Security Considerations

- Ensure tests don't expose sensitive data
- Verify URL params sanitization in integration tests

## Next Steps

After completion:
1. Create PR for review
2. Update project documentation
3. Announce new component to team
4. Plan removal of deprecated component in next sprint
