import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MeetOurGuides } from '../meet-our-guides'

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

// Mock next/image
vi.mock('next/image', () => ({
  default: function MockImage({ alt, src, width, height, className }: Record<string, unknown>) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt as string} src={src as string} width={width as number} height={height as number} className={className as string} />
  },
}))

// Mock @/i18n/navigation
vi.mock('@/i18n/navigation', () => ({
  Link: function MockLink({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) {
    return <a href={href} className={className}>{children}</a>
  },
}))

// Mock button utility
vi.mock('@/components/ui/button', () => ({
  getButtonClassName: (...args: unknown[]) => 'mock-button-class',
}))

describe('MeetOurGuides', () => {
  it('renders guide cards with avatars', () => {
    render(<MeetOurGuides />)
    const images = screen.getAllByRole('img')
    expect(images.length).toBeGreaterThanOrEqual(4)
  })

  it('displays guide names and roles', () => {
    render(<MeetOurGuides />)
    expect(screen.getByText('Johan Lindberg')).toBeInTheDocument()
    expect(screen.getByText('Anna Eriksson')).toBeInTheDocument()
    expect(screen.getByText('History Specialist')).toBeInTheDocument()
    expect(screen.getByText('Architecture Expert')).toBeInTheDocument()
  })

  it('renders social media links with aria-labels', () => {
    render(<MeetOurGuides />)
    expect(screen.getByLabelText('Johan Lindberg Instagram')).toBeInTheDocument()
    expect(screen.getByLabelText('Johan Lindberg LinkedIn')).toBeInTheDocument()
    expect(screen.getByLabelText('Anna Eriksson Instagram')).toBeInTheDocument()
  })

  it('renders "Meet All Guides" CTA linking to /guides', () => {
    render(<MeetOurGuides />)
    const ctaLink = screen.getByRole('link', { name: 'viewAll' })
    expect(ctaLink).toHaveAttribute('href', '/guides')
  })
})
