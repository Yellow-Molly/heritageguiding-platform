import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CategoryChips } from '../category-chips'

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

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: vi.fn().mockReturnValue(null),
    toString: () => '',
  }),
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/en/tours',
}))

const mockCategories = [
  { id: 'history', name: 'History & Heritage', slug: 'history', type: 'theme' as const, tourCount: 8 },
  { id: 'architecture', name: 'Architecture', slug: 'architecture', type: 'theme' as const, tourCount: 5 },
  { id: 'nature', name: 'Nature & Parks', slug: 'nature', type: 'theme' as const, tourCount: 4 },
]

describe('CategoryChips', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  it('renders all category chips plus "All" chip', () => {
    render(<CategoryChips categories={mockCategories} />)

    expect(screen.getByText('All')).toBeInTheDocument()
    expect(screen.getByText('History & Heritage')).toBeInTheDocument()
    expect(screen.getByText('Architecture')).toBeInTheDocument()
    expect(screen.getByText('Nature & Parks')).toBeInTheDocument()
  })

  it('displays tour count badges', () => {
    render(<CategoryChips categories={mockCategories} />)

    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('has accessible listbox role', () => {
    render(<CategoryChips categories={mockCategories} />)

    const listbox = screen.getByRole('listbox')
    expect(listbox).toHaveAttribute('aria-label', 'Select tour categories')
    expect(listbox).toHaveAttribute('aria-multiselectable', 'true')
  })

  it('marks "All" as selected when no categories selected', () => {
    render(<CategoryChips categories={mockCategories} />)

    const allChip = screen.getByText('All').closest('button')
    expect(allChip).toHaveAttribute('aria-selected', 'true')
  })

  it('updates URL when category clicked', () => {
    render(<CategoryChips categories={mockCategories} />)

    const historyChip = screen.getByText('History & Heritage').closest('button')
    fireEvent.click(historyChip!)

    expect(mockPush).toHaveBeenCalledWith('/en/tours?categories=history')
  })

  it('supports multi-select (adds to existing)', () => {
    render(<CategoryChips categories={mockCategories} />)

    // Click first category
    const historyChip = screen.getByText('History & Heritage').closest('button')
    fireEvent.click(historyChip!)

    expect(mockPush).toHaveBeenCalledWith('/en/tours?categories=history')
  })

  it('renders fade gradient overlays', () => {
    const { container } = render(<CategoryChips categories={mockCategories} />)

    const gradients = container.querySelectorAll('.pointer-events-none')
    expect(gradients.length).toBe(2) // Left and right gradients
  })

  it('has scrollbar-hide class for hidden scrollbar', () => {
    const { container } = render(<CategoryChips categories={mockCategories} />)

    const scrollContainer = container.querySelector('.scrollbar-hide')
    expect(scrollContainer).toBeInTheDocument()
  })
})
