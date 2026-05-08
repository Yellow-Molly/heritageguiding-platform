import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { PrivacyControllerCard } from '../privacy-controller-card'

const props = {
  id: 'controller',
  heading: 'Data Controller',
  controllerLabel: 'WHO WE ARE',
  contactLabel: 'CONTACT',
  emailLabel: 'Email',
  controller: {
    legalName: 'Yellow Molly AB',
    orgNumber: 'Org. nr 559577-5080',
    address: ['Karlavägen 18', '114 31 Stockholm', 'Sweden'],
    email: 'info@privatetours.se',
  },
}

describe('PrivacyControllerCard', () => {
  it('renders heading + identity + contact lines', () => {
    render(<PrivacyControllerCard {...props} />)
    expect(screen.getByRole('heading', { name: /Data Controller/i, level: 2 })).toBeInTheDocument()
    expect(screen.getByText(/Yellow Molly AB/i)).toBeInTheDocument()
    expect(screen.getByText(/559577-5080/)).toBeInTheDocument()
    expect(screen.getByText(/Karlavägen 18/)).toBeInTheDocument()
    expect(screen.getByText(/114 31 Stockholm/)).toBeInTheDocument()
  })

  it('renders email as mailto link', () => {
    render(<PrivacyControllerCard {...props} />)
    const link = screen.getByRole('link', { name: /info@privatetours\.se/i })
    expect(link).toHaveAttribute('href', 'mailto:info@privatetours.se')
  })

  it('exposes section id for anchor navigation', () => {
    const { container } = render(<PrivacyControllerCard {...props} />)
    expect(container.querySelector('#controller')).not.toBeNull()
  })
})
