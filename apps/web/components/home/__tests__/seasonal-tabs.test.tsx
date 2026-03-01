import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SeasonalTabs } from '../seasonal-tabs'

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

// Mock next/image
vi.mock('next/image', () => ({
  default: function MockImage({ alt, src, fill, className }: Record<string, unknown>) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt as string} src={src as string} className={className as string} data-fill={fill as boolean} />
  },
}))

// Mock @/i18n/navigation
vi.mock('@/i18n/navigation', () => ({
  Link: function MockLink({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) {
    return <a href={href} className={className}>{children}</a>
  },
}))

// Mock utilities
vi.mock('@/components/ui/button', () => ({
  getButtonClassName: (...args: unknown[]) => 'mock-button-class',
}))
vi.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}))

describe('SeasonalTabs', () => {
  it('renders 4 season tab buttons', () => {
    render(<SeasonalTabs />)
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(4)
  })

  it('shows winter content by default (first tab pressed)', () => {
    render(<SeasonalTabs />)
    const buttons = screen.getAllByRole('button')
    const winterButton = buttons.find(b => b.getAttribute('aria-pressed') === 'true')
    expect(winterButton).toBeDefined()
  })

  it('switches content when tab is clicked', async () => {
    const user = userEvent.setup()
    render(<SeasonalTabs />)

    const buttons = screen.getAllByRole('button')
    // Click second tab (spring)
    await user.click(buttons[1])

    expect(buttons[1]).toHaveAttribute('aria-pressed', 'true')
    // Previous tab should no longer be pressed
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'false')
  })

  it('renders CTA link to tours page', () => {
    render(<SeasonalTabs />)
    const ctaLink = screen.getByRole('link', { name: 'cta' })
    expect(ctaLink).toHaveAttribute('href', '/tours')
  })
})
