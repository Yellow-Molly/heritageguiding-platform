import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { PrivacyRightsAccordion } from '../privacy-rights-accordion'

const props = {
  id: 'rights',
  heading: 'Your Rights',
  contactEmail: 'info@privatetours.se',
  slaCallout: 'We respond within 30 days. Free of charge.',
  items: [
    {
      id: 'access',
      numeral: '01',
      name: 'Right of access',
      description: 'Get a copy of your data.',
      exerciseInstruction: 'Email us with the subject below.',
      ctaLabel: 'Request access',
      mailtoSubject: 'GDPR Access Request',
    },
    {
      id: 'erasure',
      numeral: '03',
      name: 'Right to erasure',
      description: 'Have your data deleted.',
      exerciseInstruction: 'Email us; some data must be retained 7 years.',
      ctaLabel: 'Request deletion',
      mailtoSubject: 'GDPR Erasure Request',
    },
  ],
}

describe('PrivacyRightsAccordion', () => {
  it('renders heading + SLA callout', () => {
    render(<PrivacyRightsAccordion {...props} />)
    expect(screen.getByRole('heading', { name: /Your Rights/i, level: 2 })).toBeInTheDocument()
    expect(screen.getByText(/We respond within 30 days/i)).toBeInTheDocument()
  })

  it('renders one <details> per right item', () => {
    const { container } = render(<PrivacyRightsAccordion {...props} />)
    expect(container.querySelectorAll('details')).toHaveLength(2)
  })

  it('renders each right name as a heading', () => {
    render(<PrivacyRightsAccordion {...props} />)
    expect(screen.getByRole('heading', { name: /Right of access/i, level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Right to erasure/i, level: 3 })).toBeInTheDocument()
  })

  it('renders mailto with URL-encoded subject', () => {
    render(<PrivacyRightsAccordion {...props} />)
    const link = screen.getByRole('link', { name: /Request access/i })
    expect(link.getAttribute('href')).toBe(
      'mailto:info@privatetours.se?subject=GDPR%20Access%20Request',
    )
  })
})
