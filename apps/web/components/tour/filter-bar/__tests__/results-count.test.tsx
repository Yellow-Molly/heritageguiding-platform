import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ResultsCount } from '../results-count'

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string, values?: { count: number }) => {
    if (key === 'resultsCount' && values) {
      const { count } = values
      if (count === 0) return 'No results'
      if (count === 1) return '1 result'
      return `${count} results`
    }
    return key
  },
}))

describe('ResultsCount', () => {
  it('renders count with pluralization', () => {
    render(<ResultsCount count={42} />)
    expect(screen.getByText('42 results')).toBeInTheDocument()
  })

  it('handles singular case', () => {
    render(<ResultsCount count={1} />)
    expect(screen.getByText('1 result')).toBeInTheDocument()
  })

  it('handles zero results', () => {
    render(<ResultsCount count={0} />)
    expect(screen.getByText('No results')).toBeInTheDocument()
  })

  it('has correct styling classes', () => {
    const { container } = render(<ResultsCount count={10} />)
    const span = container.querySelector('span')
    expect(span).toHaveClass('text-sm', 'whitespace-nowrap')
  })
})
