import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { TourGridSkeleton } from '../tour-grid-skeleton'

describe('TourGridSkeleton', () => {
  describe('grid variant', () => {
    it('renders default 6 skeleton cards', () => {
      const { container } = render(<TourGridSkeleton />)
      // Each card has overflow-hidden class
      const cards = container.querySelectorAll('.overflow-hidden')
      expect(cards.length).toBe(6)
    })

    it('renders custom count of skeleton cards', () => {
      const { container } = render(<TourGridSkeleton count={3} />)
      // Should have 3 card containers
      const cards = container.querySelectorAll('.overflow-hidden')
      expect(cards.length).toBe(3)
    })

    it('uses grid layout by default', () => {
      const { container } = render(<TourGridSkeleton />)
      const grid = container.querySelector('.grid')
      expect(grid).toBeInTheDocument()
    })
  })

  describe('list variant', () => {
    it('uses list layout when specified', () => {
      const { container } = render(<TourGridSkeleton viewMode="list" />)
      const listContainer = container.querySelector('.space-y-4')
      expect(listContainer).toBeInTheDocument()
    })

    it('renders list item skeletons in list mode', () => {
      const { container } = render(<TourGridSkeleton viewMode="list" count={3} />)
      // List items have sm:flex-row class
      const listItems = container.querySelectorAll('.sm\\:flex-row')
      expect(listItems.length).toBe(3)
    })
  })

  describe('accessibility', () => {
    it('skeleton elements are rendered', () => {
      render(<TourGridSkeleton />)
      // Skeleton component renders divs with skeleton styling
      const container = document.querySelector('.grid')
      expect(container).toBeInTheDocument()
    })
  })
})
