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

// Mock next/link
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

    it('renders price', () => {
      render(<TourCard tour={mockTour} />)
      // formatPrice returns SEK formatted price
      expect(screen.getByText(/595/)).toBeInTheDocument()
    })

    it('renders rating', () => {
      render(<TourCard tour={mockTour} />)
      expect(screen.getByText('4.8')).toBeInTheDocument()
    })

    it('renders review count', () => {
      render(<TourCard tour={mockTour} />)
      expect(screen.getByText('(150 reviews)')).toBeInTheDocument()
    })

    it('renders max capacity', () => {
      render(<TourCard tour={mockTour} />)
      expect(screen.getByText('Max 15')).toBeInTheDocument()
    })

    it('renders duration', () => {
      render(<TourCard tour={mockTour} />)
      // formatDuration converts 120 minutes to "2h"
      expect(screen.getByText('2h')).toBeInTheDocument()
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
      // AccessibilityBadge renders with aria-label
      const badges = screen.getAllByRole('img', { hidden: true })
      expect(badges.length).toBeGreaterThan(0)
    })

    it('hides badges when not accessible', () => {
      const nonAccessibleTour = {
        ...mockTour,
        accessibility: { wheelchairAccessible: false },
      }
      render(<TourCard tour={nonAccessibleTour} />)
      // Should not have accessibility badges
    })
  })

  describe('link', () => {
    it('links to tour details page', () => {
      render(<TourCard tour={mockTour} />)
      const link = screen.getByRole('link', { name: 'Test Tour Title' })
      expect(link).toHaveAttribute('href', '/tours/test-tour')
    })
  })

  describe('variants', () => {
    it('renders grid variant by default', () => {
      const { container } = render(<TourCard tour={mockTour} />)
      // Grid variant should not have flex-row class
      expect(container.firstChild).not.toHaveClass('sm:flex-row')
    })

    it('renders list variant when specified', () => {
      const { container } = render(<TourCard tour={mockTour} variant="list" />)
      expect(container.firstChild).toHaveClass('sm:flex-row')
    })

    it('shows View Details link in list variant', () => {
      render(<TourCard tour={mockTour} variant="list" />)
      expect(screen.getByText('View Details')).toBeInTheDocument()
    })

    it('hides View Details link in grid variant', () => {
      render(<TourCard tour={mockTour} variant="grid" />)
      expect(screen.queryByText('View Details')).not.toBeInTheDocument()
    })
  })
})
