import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VisuallyHidden } from '../visually-hidden'

describe('VisuallyHidden', () => {
  it('renders children text', () => {
    render(<VisuallyHidden>Hidden text</VisuallyHidden>)
    expect(screen.getByText('Hidden text')).toBeInTheDocument()
  })

  it('renders as span by default', () => {
    render(<VisuallyHidden>Test</VisuallyHidden>)
    const el = screen.getByText('Test')
    expect(el.tagName).toBe('SPAN')
  })

  it('renders as custom element when as prop provided', () => {
    render(<VisuallyHidden as="div">Test</VisuallyHidden>)
    const el = screen.getByText('Test')
    expect(el.tagName).toBe('DIV')
  })

  it('renders as h2 when specified', () => {
    render(<VisuallyHidden as="h2">Heading</VisuallyHidden>)
    const el = screen.getByText('Heading')
    expect(el.tagName).toBe('H2')
  })

  it('applies sr-only clip styles', () => {
    render(<VisuallyHidden>Hidden</VisuallyHidden>)
    const el = screen.getByText('Hidden')
    expect(el.style.position).toBe('absolute')
    expect(el.style.width).toBe('1px')
    expect(el.style.height).toBe('1px')
    expect(el.style.overflow).toBe('hidden')
  })
})
