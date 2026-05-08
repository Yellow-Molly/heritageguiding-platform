import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { PrivacyProse } from '../privacy-prose'

const sections = [
  {
    id: 'scope',
    heading: 'Scope & Definitions',
    paragraphs: ['First scope paragraph.', 'Second scope paragraph.'],
  },
  {
    id: 'retention',
    heading: 'Retention Periods',
    intro: 'We keep data only as long as needed:',
    bullets: ['Booking: 7 years', 'Analytics: 90 days'],
  },
]

describe('PrivacyProse', () => {
  it('renders one section per entry with id and h2 heading', () => {
    const { container } = render(<PrivacyProse sections={sections} />)
    expect(container.querySelector('#scope')).not.toBeNull()
    expect(container.querySelector('#retention')).not.toBeNull()
    expect(screen.getByRole('heading', { name: /Scope & Definitions/i, level: 2 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Retention Periods/i, level: 2 })).toBeInTheDocument()
  })

  it('renders all paragraphs', () => {
    render(<PrivacyProse sections={sections} />)
    expect(screen.getByText(/First scope paragraph/i)).toBeInTheDocument()
    expect(screen.getByText(/Second scope paragraph/i)).toBeInTheDocument()
  })

  it('renders intro and bullets', () => {
    render(<PrivacyProse sections={sections} />)
    expect(screen.getByText(/We keep data only as long as needed/i)).toBeInTheDocument()
    expect(screen.getByText(/Booking: 7 years/i)).toBeInTheDocument()
    expect(screen.getByText(/Analytics: 90 days/i)).toBeInTheDocument()
  })
})
