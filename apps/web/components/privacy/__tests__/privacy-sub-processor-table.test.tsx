import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { PrivacySubProcessorTable } from '../privacy-sub-processor-table'

const props = {
  id: 'subProcessors',
  heading: 'Sub-Processors & Recipients',
  intro: 'We share data only with required providers.',
  caption: 'Trusted partners',
  columnHeaders: {
    provider: 'Provider',
    role: 'Role',
    location: 'Location',
    transfer: 'Transfer Mechanism',
  },
  rows: [
    { provider: 'Bokun (Tripadvisor LLC)', monogram: 'B', role: 'Booking platform', location: 'Iceland / United States', transfer: 'EU SCCs' },
    { provider: 'Stripe (via Bokun Pay)', monogram: 'S', role: 'Payment processing', location: 'Ireland (EU) / United States', transfer: 'EU SCCs + DPF' },
  ],
}

describe('PrivacySubProcessorTable', () => {
  it('renders heading + intro + caption', () => {
    render(<PrivacySubProcessorTable {...props} />)
    expect(screen.getByRole('heading', { name: /Sub-Processors & Recipients/i })).toBeInTheDocument()
    expect(screen.getByText(/share data only with required providers/i)).toBeInTheDocument()
    expect(screen.getByText(/Trusted partners/i)).toBeInTheDocument()
  })

  it('renders provider names', () => {
    render(<PrivacySubProcessorTable {...props} />)
    expect(screen.getAllByText(/Bokun \(Tripadvisor LLC\)/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Stripe \(via Bokun Pay\)/i).length).toBeGreaterThan(0)
  })

  it('wraps EU SCCs in <abbr> with title for tooltip', () => {
    const { container } = render(<PrivacySubProcessorTable {...props} />)
    const abbrs = container.querySelectorAll('abbr')
    expect(abbrs.length).toBeGreaterThan(0)
    abbrs.forEach((a) => expect(a).toHaveAttribute('title', 'EU Standard Contractual Clauses'))
  })

  it('renders four column headers with scope=col', () => {
    render(<PrivacySubProcessorTable {...props} />)
    const headers = screen.getAllByRole('columnheader')
    expect(headers).toHaveLength(4)
    headers.forEach((h) => expect(h).toHaveAttribute('scope', 'col'))
  })
})
