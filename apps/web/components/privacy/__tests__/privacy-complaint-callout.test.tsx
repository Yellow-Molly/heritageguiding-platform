import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { PrivacyComplaintCallout } from '../privacy-complaint-callout'

const props = {
  id: 'complaint',
  heading: 'Right to Lodge a Complaint',
  body: 'Contact us first; you may also complain to IMY.',
  primaryCta: { label: 'Contact us first', mailto: 'mailto:info@privatetours.se' },
  secondaryCta: {
    label: 'Visit IMY (imy.se)',
    href: 'https://www.imy.se',
    ariaLabel: 'Visit IMY website (opens in new tab)',
  },
}

describe('PrivacyComplaintCallout', () => {
  it('renders heading + body', () => {
    render(<PrivacyComplaintCallout {...props} />)
    expect(screen.getByRole('heading', { name: /Right to Lodge a Complaint/i })).toBeInTheDocument()
    expect(screen.getByText(/Contact us first; you may also complain to IMY/i)).toBeInTheDocument()
  })

  it('renders primary mailto link', () => {
    render(<PrivacyComplaintCallout {...props} />)
    const primary = screen.getByRole('link', { name: /Contact us first/i })
    expect(primary).toHaveAttribute('href', 'mailto:info@privatetours.se')
  })

  it('renders external IMY link with rel=noopener noreferrer + target _blank + aria-label', () => {
    render(<PrivacyComplaintCallout {...props} />)
    const external = screen.getByRole('link', {
      name: /Visit IMY website \(opens in new tab\)/i,
    })
    expect(external).toHaveAttribute('href', 'https://www.imy.se')
    expect(external).toHaveAttribute('target', '_blank')
    expect(external).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
