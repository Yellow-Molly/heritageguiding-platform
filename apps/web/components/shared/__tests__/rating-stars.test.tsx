import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RatingStars } from '../rating-stars'

describe('RatingStars', () => {
  describe('rating display', () => {
    it('renders with correct aria-label for full rating', () => {
      render(<RatingStars rating={4} />)
      expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Rating: 4.0 out of 5 stars')
    })

    it('handles half star ratings', () => {
      render(<RatingStars rating={3.5} />)
      expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Rating: 3.5 out of 5 stars')
    })

    it('handles zero rating', () => {
      render(<RatingStars rating={0} />)
      expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Rating: 0.0 out of 5 stars')
    })

    it('handles maximum rating', () => {
      render(<RatingStars rating={5} />)
      expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Rating: 5.0 out of 5 stars')
    })

    it('clamps rating above max', () => {
      render(<RatingStars rating={7} max={5} />)
      expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Rating: 5.0 out of 5 stars')
    })

    it('clamps negative rating to zero', () => {
      render(<RatingStars rating={-2} />)
      expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Rating: 0.0 out of 5 stars')
    })
  })

  describe('max stars', () => {
    it('uses custom max value', () => {
      render(<RatingStars rating={8} max={10} />)
      expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Rating: 8.0 out of 10 stars')
    })
  })

  describe('showValue', () => {
    it('shows numeric value when showValue is true', () => {
      render(<RatingStars rating={4.5} showValue />)
      expect(screen.getByText('4.5')).toBeInTheDocument()
    })

    it('does not show numeric value by default', () => {
      render(<RatingStars rating={4.5} />)
      expect(screen.queryByText('4.5')).not.toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has role="img"', () => {
      render(<RatingStars rating={3} />)
      expect(screen.getByRole('img')).toBeInTheDocument()
    })

    it('has descriptive aria-label', () => {
      render(<RatingStars rating={4.5} max={5} />)
      const element = screen.getByRole('img')
      expect(element.getAttribute('aria-label')).toContain('Rating:')
      expect(element.getAttribute('aria-label')).toContain('out of')
    })
  })
})
