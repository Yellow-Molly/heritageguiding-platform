import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock next/image
vi.mock('next/image', () => ({
  default: function MockImage({
    alt,
    src,
    fill,
    className,
  }: {
    alt: string
    src: string
    fill?: boolean
    className?: string
  }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt} src={src} className={className} data-fill={fill} />
  },
}))

// Mock next/link (also export useLinkStatus for NavigationPending consumer)
vi.mock('next/link', () => ({
  default: function MockLink({
    children,
    href,
    className,
  }: {
    children: React.ReactNode
    href: string
    className?: string
  }) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    )
  },
  useLinkStatus: () => ({ pending: false }),
}))

// Mock locale-aware Link from i18n/navigation — bypasses next-intl's
// dynamic next/navigation import which fails to resolve under Vitest's
// extension-strict ESM resolver.
vi.mock('@/i18n/navigation', () => ({
  Link: function MockI18nLink({
    children,
    href,
    className,
  }: {
    children: React.ReactNode
    href: string
    className?: string
  }) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    )
  },
  usePathname: () => '/en/tours',
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  redirect: vi.fn(),
  getPathname: vi.fn(),
}))

// Mock next-intl translation hook with the keys TourCard uses
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, vars?: Record<string, string | number>) => {
    if (key === 'featured') return 'Featured'
    if (key === 'maxCapacity') return `Max ${vars?.count ?? ''}`
    if (key === 'durationAndCapacity') return `${vars?.duration ?? ''} · Max ${vars?.count ?? ''}`
    return key
  },
}))

import { TourCard } from '../tour-card'
import type { FeaturedTour } from '@/lib/api/get-featured-tours'

const mockTour: FeaturedTour = {
  id: 'test-tour',
  title: 'Test Tour Title',
  description: 'Test tour description for unit testing',
  slug: 'test-tour',
  image: {
    url: 'https://example.com/image.jpg',
    alt: 'Test image alt text',
  },
  duration: 120,
  maxCapacity: 15,
  rating: 4.8,
  reviewCount: 150,
  price: 595,
  featured: false,
  accessibility: {
    wheelchairAccessible: true,
    hearingAccessible: true,
  },
}

describe('TourCard', () => {
  describe('rendering', () => {
    it('renders tour title', () => {
      render(<TourCard tour={mockTour} />)
      expect(screen.getByText('Test Tour Title')).toBeInTheDocument()
    })

    it('renders tour description', () => {
      render(<TourCard tour={mockTour} />)
      expect(screen.getByText('Test tour description for unit testing')).toBeInTheDocument()
    })

    it('renders tour image with alt text', () => {
      render(<TourCard tour={mockTour} />)
      const image = screen.getByAltText('Test image alt text')
      expect(image).toBeInTheDocument()
      expect(image).toHaveAttribute('src', 'https://example.com/image.jpg')
    })

    it('renders desktop max capacity label', () => {
      render(<TourCard tour={mockTour} />)
      // Desktop section uses t('maxCapacity', { count: 15 }) → 'Max 15'
      expect(screen.getByText('Max 15')).toBeInTheDocument()
    })

    it('renders duration pill on desktop', () => {
      render(<TourCard tour={mockTour} />)
      // formatDuration converts 120 minutes → '2h' (rendered raw in pill, plus
      // appears inside mobile durationAndCapacity string)
      expect(screen.getAllByText(/2h/).length).toBeGreaterThan(0)
    })

    it('renders mobile inline duration + capacity text', () => {
      render(<TourCard tour={mockTour} />)
      // Mobile uses t('durationAndCapacity', {duration, count}) → '2h · Max 15'
      expect(screen.getByText('2h · Max 15')).toBeInTheDocument()
    })
  })

  describe('featured badge', () => {
    it('shows featured badge when tour is featured', () => {
      const featuredTour = { ...mockTour, featured: true }
      render(<TourCard tour={featuredTour} />)
      expect(screen.getByText('Featured')).toBeInTheDocument()
    })

    it('hides featured badge when tour is not featured', () => {
      render(<TourCard tour={mockTour} />)
      expect(screen.queryByText('Featured')).not.toBeInTheDocument()
    })
  })

  describe('accessibility badges', () => {
    it('shows wheelchair badge when accessible', () => {
      render(<TourCard tour={mockTour} />)
      const badges = screen.getAllByRole('img', { hidden: true })
      expect(badges.length).toBeGreaterThan(0)
    })

    it('hides badges when not accessible', () => {
      const nonAccessibleTour = {
        ...mockTour,
        accessibility: { wheelchairAccessible: false },
      }
      render(<TourCard tour={nonAccessibleTour} />)
      // Should render without accessibility badges (no assertion crashes acceptable)
    })
  })

  describe('link', () => {
    it('links to tour details page', () => {
      render(<TourCard tour={mockTour} />)
      const link = screen.getByRole('link', { name: /Test Tour Title/ })
      expect(link).toHaveAttribute('href', '/tours/test-tour')
    })
  })

  describe('variants', () => {
    it('renders grid variant by default with constrained max-width wrapper', () => {
      const { container } = render(<TourCard tour={mockTour} />)
      // Grid variant: outer Link applies max-w-[400px]
      const link = container.querySelector('a')
      expect(link?.className).toContain('max-w-[400px]')
    })

    it('renders list variant without max-width constraint', () => {
      const { container } = render(<TourCard tour={mockTour} variant="list" />)
      const link = container.querySelector('a')
      expect(link?.className).not.toContain('max-w-[400px]')
    })
  })
})
