import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { PrivacyProcessingTable } from '../privacy-processing-table'

const props = {
  id: 'purposes',
  heading: 'Purposes & Legal Basis',
  caption: 'How we use your data',
  columnHeaders: {
    activity: 'Activity',
    data: 'Data Categories',
    basis: 'Legal Basis',
    retention: 'Retention',
  },
  rows: [
    {
      activity: 'Process tour bookings',
      dataCategories: 'Name, email',
      legalBasis: 'Art. 6(1)(b) — Contract',
      retention: '7 years',
    },
    {
      activity: 'Web Vitals metrics',
      dataCategories: 'Anonymized IP',
      legalBasis: 'Art. 6(1)(f) — Legitimate interest',
      retention: '90 days',
    },
  ],
}

describe('PrivacyProcessingTable', () => {
  it('renders heading and caption', () => {
    render(<PrivacyProcessingTable {...props} />)
    expect(screen.getByRole('heading', { name: /Purposes & Legal Basis/i })).toBeInTheDocument()
    expect(screen.getByText(/How we use your data/i)).toBeInTheDocument()
  })

  it('renders column headers as <th scope="col">', () => {
    render(<PrivacyProcessingTable {...props} />)
    const headers = screen.getAllByRole('columnheader')
    expect(headers).toHaveLength(4)
    headers.forEach((h) => expect(h).toHaveAttribute('scope', 'col'))
  })

  it('renders all row activities and legal bases (table + mobile cards)', () => {
    render(<PrivacyProcessingTable {...props} />)
    expect(screen.getAllByText('Process tour bookings').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Web Vitals metrics').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Art\. 6\(1\)\(b\)/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Art\. 6\(1\)\(f\)/).length).toBeGreaterThan(0)
  })
})
