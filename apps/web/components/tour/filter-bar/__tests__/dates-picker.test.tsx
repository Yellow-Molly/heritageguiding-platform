import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DatesPicker } from '../dates-picker'

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      selectDates: 'Select dates',
      clearDates: 'Clear dates',
    }
    return translations[key] || key
  },
  useLocale: () => 'en',
}))

// Mock next/navigation
const mockPush = vi.fn()
let mockSearchParams = new URLSearchParams('')

vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: (key: string) => mockSearchParams.get(key),
    toString: () => mockSearchParams.toString(),
  }),
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/en/tours',
}))

describe('DatesPicker', () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockSearchParams = new URLSearchParams('')
  })

  it('renders trigger button with placeholder text', () => {
    render(<DatesPicker />)
    expect(screen.getByText('Select dates')).toBeInTheDocument()
  })

  it('has calendar icon', () => {
    const { container } = render(<DatesPicker />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('opens calendar popover on click', () => {
    render(<DatesPicker />)
    fireEvent.click(screen.getByText('Select dates'))
    // Calendar grid should be visible
    expect(screen.getByRole('grid')).toBeInTheDocument()
  })

  it('displays selected date range in button', () => {
    mockSearchParams = new URLSearchParams('startDate=2026-01-25&endDate=2026-01-30')
    render(<DatesPicker />)
    // Should show formatted dates
    expect(screen.getByText(/Jan 25 - Jan 30/)).toBeInTheDocument()
  })

  it('shows clear control when dates selected', () => {
    mockSearchParams = new URLSearchParams('startDate=2026-01-25')
    render(<DatesPicker />)
    expect(screen.getByRole('button', { name: 'Clear dates' })).toBeInTheDocument()
  })

  it('has accessible trigger button', () => {
    render(<DatesPicker />)
    const button = screen.getByRole('button', { name: /select dates/i })
    expect(button).toBeInTheDocument()
  })
})
