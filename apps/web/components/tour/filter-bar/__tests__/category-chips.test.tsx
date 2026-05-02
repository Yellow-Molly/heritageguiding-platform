import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSyncExternalStore } from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { CategoryChips } from '../category-chips'
import { FilterStateProvider } from '../../filter-state-provider'

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      selectCategories: 'Select tour categories',
      allCategories: 'All',
    }
    return translations[key] || key
  },
}))

// Reactive search-param store — when router.push fires, currentSearch updates
// and listeners re-render. Lets us assert the optimistic flip resolves through
// to the chip's aria-selected state after the click.
const mockPush = vi.fn()
const mockReplace = vi.fn()
let currentSearch = ''
const listeners = new Set<() => void>()
function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}
function notify() {
  for (const l of listeners) l()
}
function setSearchFromUrl(url: string) {
  const idx = url.indexOf('?')
  currentSearch = idx >= 0 ? url.slice(idx + 1) : ''
  notify()
}

vi.mock('next/navigation', () => ({
  useSearchParams: () => {
    useSyncExternalStore(subscribe, () => currentSearch, () => currentSearch)
    return {
      get: (key: string) => new URLSearchParams(currentSearch).get(key),
      toString: () => currentSearch,
    }
  },
  useRouter: () => ({
    push: (url: string, opts?: unknown) => {
      mockPush(url, opts)
      setSearchFromUrl(url)
    },
    replace: (url: string, opts?: unknown) => {
      mockReplace(url, opts)
      setSearchFromUrl(url)
    },
  }),
  usePathname: () => '/en/tours',
}))

const mockCategories = [
  { id: 'history', name: 'History & Heritage', slug: 'history', type: 'theme' as const, tourCount: 8 },
  { id: 'architecture', name: 'Architecture', slug: 'architecture', type: 'theme' as const, tourCount: 5 },
  { id: 'nature', name: 'Nature & Parks', slug: 'nature', type: 'theme' as const, tourCount: 4 },
]

function renderWithProvider(ui: React.ReactElement) {
  return render(<FilterStateProvider>{ui}</FilterStateProvider>)
}

describe('CategoryChips', () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockReplace.mockClear()
    currentSearch = ''
  })

  it('renders all category chips plus "All" chip', () => {
    renderWithProvider(<CategoryChips categories={mockCategories} />)

    expect(screen.getByText('All')).toBeInTheDocument()
    expect(screen.getByText('History & Heritage')).toBeInTheDocument()
    expect(screen.getByText('Architecture')).toBeInTheDocument()
    expect(screen.getByText('Nature & Parks')).toBeInTheDocument()
  })

  it('has accessible listbox role', () => {
    renderWithProvider(<CategoryChips categories={mockCategories} />)

    const listbox = screen.getByRole('listbox')
    expect(listbox).toHaveAttribute('aria-label', 'Select tour categories')
    expect(listbox).toHaveAttribute('aria-multiselectable', 'true')
  })

  it('marks "All" as selected when no categories selected', () => {
    renderWithProvider(<CategoryChips categories={mockCategories} />)

    const allChip = screen.getByText('All').closest('button')
    expect(allChip).toHaveAttribute('aria-selected', 'true')
  })

  it('flips chip aria-selected on click and pushes URL with scroll:false', () => {
    renderWithProvider(<CategoryChips categories={mockCategories} />)

    const historyChip = screen.getByText('History & Heritage').closest('button')!
    expect(historyChip).toHaveAttribute('aria-selected', 'false')

    act(() => {
      fireEvent.click(historyChip)
    })

    // Optimistic-flip path resolved: the chip is selected after the click
    expect(historyChip).toHaveAttribute('aria-selected', 'true')
    expect(mockPush).toHaveBeenCalledWith('/en/tours?categories=history', { scroll: false })
  })

  it('multi-select adds to existing categories', () => {
    currentSearch = 'categories=architecture'
    renderWithProvider(<CategoryChips categories={mockCategories} />)

    const historyChip = screen.getByText('History & Heritage').closest('button')!
    act(() => {
      fireEvent.click(historyChip)
    })

    // Comma-list extends rather than replacing
    expect(mockPush).toHaveBeenCalledWith(
      '/en/tours?categories=architecture%2Chistory',
      { scroll: false },
    )
    // Both chips end up selected
    const archChip = screen.getByText('Architecture').closest('button')!
    expect(historyChip).toHaveAttribute('aria-selected', 'true')
    expect(archChip).toHaveAttribute('aria-selected', 'true')
  })

  it('clicking "All" clears categories', () => {
    currentSearch = 'categories=history,architecture'
    renderWithProvider(<CategoryChips categories={mockCategories} />)

    const allChip = screen.getByText('All').closest('button')!
    act(() => {
      fireEvent.click(allChip)
    })

    expect(mockPush).toHaveBeenCalledWith('/en/tours', { scroll: false })
    expect(allChip).toHaveAttribute('aria-selected', 'true')
  })

  it('has scrollbar-hide class for hidden scrollbar', () => {
    const { container } = renderWithProvider(<CategoryChips categories={mockCategories} />)

    const scrollContainer = container.querySelector('.scrollbar-hide')
    expect(scrollContainer).toBeInTheDocument()
  })
})
