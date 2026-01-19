import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => '/en/tours',
  useSearchParams: () => new URLSearchParams(),
}))

import { TourEmptyState } from '../tour-empty-state'

describe('TourEmptyState', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  describe('rendering', () => {
    it('renders empty state icon', () => {
      render(<TourEmptyState />)
      // SearchX icon is rendered
      const icon = document.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('renders title', () => {
      render(<TourEmptyState />)
      expect(screen.getByText('No tours found')).toBeInTheDocument()
    })

    it('renders description', () => {
      render(<TourEmptyState />)
      expect(
        screen.getByText(/We couldn't find any tours matching your criteria/)
      ).toBeInTheDocument()
    })

    it('renders clear filters button', () => {
      render(<TourEmptyState />)
      expect(screen.getByRole('button', { name: /clear all filters/i })).toBeInTheDocument()
    })
  })

  describe('interaction', () => {
    it('clears filters on button click', () => {
      render(<TourEmptyState />)
      const button = screen.getByRole('button', { name: /clear all filters/i })
      fireEvent.click(button)

      expect(mockPush).toHaveBeenCalledWith('/en/tours')
    })
  })

  describe('accessibility', () => {
    it('button is focusable', () => {
      render(<TourEmptyState />)
      const button = screen.getByRole('button', { name: /clear all filters/i })
      button.focus()
      expect(document.activeElement).toBe(button)
    })
  })
})
