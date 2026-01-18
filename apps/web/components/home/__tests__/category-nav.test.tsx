import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CategoryNav } from '../category-nav'

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  constructor(callback: IntersectionObserverCallback) {
    // Immediately trigger with isIntersecting: true
    setTimeout(() => {
      callback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver
      )
    }, 0)
  }
}

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
})

describe('CategoryNav', () => {
  describe('rendering', () => {
    it('renders the section', () => {
      render(<CategoryNav />)
      expect(screen.getByRole('region', { name: /explore tours by category/i })).toBeInTheDocument()
    })

    it('renders the main heading', () => {
      render(<CategoryNav />)
      expect(screen.getByText('Find Your Perfect Experience')).toBeInTheDocument()
    })

    it('renders the section subtitle', () => {
      render(<CategoryNav />)
      expect(
        screen.getByText(/Browse tours by theme or explore Stockholm/i)
      ).toBeInTheDocument()
    })
  })

  describe('theme categories', () => {
    it('renders "Explore by Theme" heading', () => {
      render(<CategoryNav />)
      expect(screen.getByText('Explore by Theme')).toBeInTheDocument()
    })

    it('renders History & Heritage category', () => {
      render(<CategoryNav />)
      expect(screen.getByText('History & Heritage')).toBeInTheDocument()
    })

    it('renders Architecture category', () => {
      render(<CategoryNav />)
      expect(screen.getByText('Architecture')).toBeInTheDocument()
    })

    it('renders Nature & Parks category', () => {
      render(<CategoryNav />)
      expect(screen.getByText('Nature & Parks')).toBeInTheDocument()
    })

    it('renders Maritime History category', () => {
      render(<CategoryNav />)
      expect(screen.getByText('Maritime History')).toBeInTheDocument()
    })
  })

  describe('area categories', () => {
    it('renders "Explore by Area" heading', () => {
      render(<CategoryNav />)
      expect(screen.getByText('Explore by Area')).toBeInTheDocument()
    })

    it('renders Gamla Stan category', () => {
      render(<CategoryNav />)
      expect(screen.getByText('Gamla Stan')).toBeInTheDocument()
    })

    it('renders Djurgården category', () => {
      render(<CategoryNav />)
      expect(screen.getByText('Djurgården')).toBeInTheDocument()
    })

    it('renders Södermalm category', () => {
      render(<CategoryNav />)
      expect(screen.getByText('Södermalm')).toBeInTheDocument()
    })

    it('renders Norrmalm category', () => {
      render(<CategoryNav />)
      expect(screen.getByText('Norrmalm')).toBeInTheDocument()
    })
  })

  describe('links', () => {
    it('renders links with correct href pattern', () => {
      render(<CategoryNav />)
      const links = screen.getAllByRole('link')

      // All links should contain /tours?category=
      links.forEach((link) => {
        expect(link.getAttribute('href')).toMatch(/\/tours\?category=/)
      })
    })

    it('renders 8 category links total (4 themes + 4 areas)', () => {
      render(<CategoryNav />)
      const links = screen.getAllByRole('link')
      expect(links.length).toBe(8)
    })
  })

  describe('tour counts', () => {
    it('displays tour count for categories', () => {
      render(<CategoryNav />)
      // Check that tour counts are displayed
      const tourCountElements = screen.getAllByText(/\d+ tours/)
      expect(tourCountElements.length).toBeGreaterThan(0)
    })
  })

  describe('accessibility', () => {
    it('has aria-label on section', () => {
      render(<CategoryNav />)
      const section = screen.getByRole('region')
      expect(section).toHaveAttribute('aria-label', 'Explore tours by category')
    })
  })
})
