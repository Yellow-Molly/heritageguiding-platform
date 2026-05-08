import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { PrivacyContactCta } from '../privacy-contact-cta'

const props = {
  heading: 'Privacy questions?',
  email: 'info@privatetours.se',
  emailDisplay: 'info@privatetours.se',
  responseSla: 'We respond within 12 hours.',
}

describe('PrivacyContactCta', () => {
  it('renders heading + SLA copy', () => {
    render(<PrivacyContactCta {...props} />)
    expect(screen.getByRole('heading', { name: /Privacy questions\?/i })).toBeInTheDocument()
    expect(screen.getByText(/We respond within 12 hours/i)).toBeInTheDocument()
  })

  it('renders email as mailto link', () => {
    render(<PrivacyContactCta {...props} />)
    const link = screen.getByRole('link', { name: /info@privatetours\.se/i })
    expect(link).toHaveAttribute('href', 'mailto:info@privatetours.se')
  })
})
