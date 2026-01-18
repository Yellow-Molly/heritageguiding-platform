import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AccessibilityBadge, AccessibilityBadgeGroup } from '../accessibility-badge'

describe('AccessibilityBadge', () => {
  describe('rendering', () => {
    it('renders wheelchair badge', () => {
      render(<AccessibilityBadge type="wheelchair" />)
      expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Wheelchair accessible')
    })

    it('renders hearing badge', () => {
      render(<AccessibilityBadge type="hearing" />)
      expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Hearing accessible')
    })

    it('renders visual badge', () => {
      render(<AccessibilityBadge type="visual" />)
      expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Visual accessible')
    })

    it('renders cognitive badge', () => {
      render(<AccessibilityBadge type="cognitive" />)
      expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Cognitive friendly')
    })

    it('renders family badge', () => {
      render(<AccessibilityBadge type="family" />)
      expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Family friendly')
    })

    it('renders service-animal badge', () => {
      render(<AccessibilityBadge type="service-animal" />)
      expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Service animals welcome')
    })
  })

  describe('variants', () => {
    it('renders default variant with border', () => {
      render(<AccessibilityBadge type="wheelchair" variant="default" />)
      expect(screen.getByRole('img')).toHaveClass('border')
    })

    it('renders outline variant', () => {
      render(<AccessibilityBadge type="wheelchair" variant="outline" />)
      expect(screen.getByRole('img')).toHaveClass('border')
    })

    it('renders filled variant', () => {
      render(<AccessibilityBadge type="wheelchair" variant="filled" />)
      expect(screen.getByRole('img')).toBeInTheDocument()
    })
  })

  describe('sizes', () => {
    it('renders sm size', () => {
      render(<AccessibilityBadge type="wheelchair" size="sm" />)
      expect(screen.getByRole('img')).toHaveClass('text-xs')
    })

    it('renders md size', () => {
      render(<AccessibilityBadge type="wheelchair" size="md" />)
      expect(screen.getByRole('img')).toHaveClass('text-sm')
    })
  })

  describe('showLabel', () => {
    it('shows visible label when showLabel is true', () => {
      render(<AccessibilityBadge type="wheelchair" showLabel />)
      expect(screen.getByText('Wheelchair accessible')).toBeVisible()
    })

    it('has sr-only label when showLabel is false', () => {
      render(<AccessibilityBadge type="wheelchair" />)
      const srOnly = screen.getByText('Wheelchair accessible')
      expect(srOnly).toHaveClass('sr-only')
    })
  })

  describe('accessibility', () => {
    it('has role="img"', () => {
      render(<AccessibilityBadge type="wheelchair" />)
      expect(screen.getByRole('img')).toBeInTheDocument()
    })

    it('has title attribute for tooltip', () => {
      render(<AccessibilityBadge type="hearing" />)
      expect(screen.getByRole('img')).toHaveAttribute('title', 'Hearing accessible')
    })
  })
})

describe('AccessibilityBadgeGroup', () => {
  it('renders multiple badges', () => {
    render(<AccessibilityBadgeGroup types={['wheelchair', 'hearing', 'visual']} />)
    expect(screen.getByRole('group')).toHaveAttribute('aria-label', 'Accessibility features')
    expect(screen.getAllByRole('img')).toHaveLength(3)
  })

  it('returns null for empty types array', () => {
    const { container } = render(<AccessibilityBadgeGroup types={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('has role="group"', () => {
    render(<AccessibilityBadgeGroup types={['wheelchair']} />)
    expect(screen.getByRole('group')).toBeInTheDocument()
  })
})
