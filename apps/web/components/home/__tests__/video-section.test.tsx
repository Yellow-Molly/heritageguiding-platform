import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VideoSection } from '../video-section'

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

// Mock next/image
vi.mock('next/image', () => ({
  default: function MockImage({ alt, src, fill, className, ...rest }: Record<string, unknown>) {
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

// Mock button utility
vi.mock('@/components/ui/button', () => ({
  getButtonClassName: (...args: unknown[]) => 'mock-button-class',
}))

describe('VideoSection', () => {
  it('renders video thumbnail with play button', () => {
    render(<VideoSection />)
    expect(screen.getByRole('button', { name: 'playButton' })).toBeInTheDocument()
    expect(screen.getByAltText('thumbnailAlt')).toBeInTheDocument()
  })

  it('shows iframe when play button is clicked', async () => {
    const user = userEvent.setup()
    render(<VideoSection />)

    const playButton = screen.getByRole('button', { name: 'playButton' })
    await user.click(playButton)

    const iframe = screen.getByTitle('iframeTitle')
    expect(iframe).toBeInTheDocument()
    expect(iframe.getAttribute('src')).toContain('youtube.com/embed/')
  })

  it('renders section heading and description', () => {
    render(<VideoSection />)
    expect(screen.getByText('title')).toBeInTheDocument()
    expect(screen.getByText('description')).toBeInTheDocument()
    expect(screen.getByText('tagline')).toBeInTheDocument()
  })

  it('renders CTA link to tours page', () => {
    render(<VideoSection />)
    const ctaLink = screen.getByRole('link', { name: 'cta' })
    expect(ctaLink).toHaveAttribute('href', '/tours')
  })
})
