import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SkipToContentLink } from '../skip-to-content-link'

describe('SkipToContentLink', () => {
  it('renders a link with href #main', () => {
    render(<SkipToContentLink />)
    const link = screen.getByText('Skip to content')
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '#main')
  })

  it('renders as an anchor element', () => {
    render(<SkipToContentLink />)
    const link = screen.getByText('Skip to content')
    expect(link.tagName).toBe('A')
  })

  it('is visually hidden by default (translated off screen)', () => {
    render(<SkipToContentLink />)
    const link = screen.getByText('Skip to content')
    expect(link.className).toContain('-translate-y-full')
  })

  it('becomes visible on focus (translate-y-0)', () => {
    render(<SkipToContentLink />)
    const link = screen.getByText('Skip to content')
    expect(link.className).toContain('focus:translate-y-0')
  })
})
