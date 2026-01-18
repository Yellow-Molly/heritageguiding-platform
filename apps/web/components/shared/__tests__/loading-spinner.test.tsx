import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoadingSpinner, LoadingOverlay, LoadingDots } from '../loading-spinner'

describe('LoadingSpinner', () => {
  describe('rendering', () => {
    it('renders with default props', () => {
      render(<LoadingSpinner />)
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading')
    })

    it('uses custom label', () => {
      render(<LoadingSpinner label="Processing..." />)
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Processing...')
    })
  })

  describe('sizes', () => {
    it('renders sm size', () => {
      render(<LoadingSpinner size="sm" />)
      const spinner = screen.getByRole('status').querySelector('div')
      expect(spinner).toHaveClass('h-4', 'w-4')
    })

    it('renders md size', () => {
      render(<LoadingSpinner size="md" />)
      const spinner = screen.getByRole('status').querySelector('div')
      expect(spinner).toHaveClass('h-6', 'w-6')
    })

    it('renders lg size', () => {
      render(<LoadingSpinner size="lg" />)
      const spinner = screen.getByRole('status').querySelector('div')
      expect(spinner).toHaveClass('h-8', 'w-8')
    })

    it('renders xl size', () => {
      render(<LoadingSpinner size="xl" />)
      const spinner = screen.getByRole('status').querySelector('div')
      expect(spinner).toHaveClass('h-12', 'w-12')
    })
  })

  describe('variants', () => {
    it('renders primary variant', () => {
      render(<LoadingSpinner variant="primary" />)
      const spinner = screen.getByRole('status').querySelector('div')
      expect(spinner).toHaveClass('border-t-[var(--color-primary)]')
    })

    it('renders secondary variant', () => {
      render(<LoadingSpinner variant="secondary" />)
      const spinner = screen.getByRole('status').querySelector('div')
      expect(spinner).toHaveClass('border-t-[var(--color-secondary)]')
    })

    it('renders accent variant', () => {
      render(<LoadingSpinner variant="accent" />)
      const spinner = screen.getByRole('status').querySelector('div')
      expect(spinner).toHaveClass('border-t-[var(--color-accent)]')
    })

    it('renders white variant', () => {
      render(<LoadingSpinner variant="white" />)
      const spinner = screen.getByRole('status').querySelector('div')
      expect(spinner).toHaveClass('border-t-white')
    })
  })

  describe('accessibility', () => {
    it('has role="status"', () => {
      render(<LoadingSpinner />)
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('includes sr-only text', () => {
      render(<LoadingSpinner label="Loading data" />)
      expect(screen.getByText('Loading data')).toHaveClass('sr-only')
    })
  })
})

describe('LoadingOverlay', () => {
  it('returns null when not loading', () => {
    const { container } = render(<LoadingOverlay isLoading={false} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders when loading', () => {
    render(<LoadingOverlay isLoading />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('shows message when provided', () => {
    render(<LoadingOverlay isLoading message="Please wait..." />)
    expect(screen.getByText('Please wait...')).toBeInTheDocument()
  })

  it('has aria-busy attribute', () => {
    render(<LoadingOverlay isLoading />)
    expect(screen.getByRole('alert')).toHaveAttribute('aria-busy', 'true')
  })

  it('has aria-live attribute', () => {
    render(<LoadingOverlay isLoading />)
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite')
  })
})

describe('LoadingDots', () => {
  it('renders three dots', () => {
    render(<LoadingDots />)
    expect(screen.getByRole('status')).toBeInTheDocument()
    // 3 dots + 1 sr-only span = 4 span children
    const dots = screen.getByRole('status').querySelectorAll('span')
    expect(dots.length).toBeGreaterThanOrEqual(3)
  })

  it('has sr-only text', () => {
    render(<LoadingDots />)
    expect(screen.getByText('Loading')).toHaveClass('sr-only')
  })

  it('applies custom className', () => {
    render(<LoadingDots className="my-class" />)
    expect(screen.getByRole('status')).toHaveClass('my-class')
  })
})
