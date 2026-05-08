import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { PrivacyHero } from '../privacy-hero'

const props = {
  breadcrumb: [{ label: 'Home', href: '/en' }, { label: 'Privacy Policy' }],
  title: 'Privacy Policy',
  subtitle: 'How we use your data',
  updatedChip: { label: 'Updated', date: '2026-05-09' },
}

describe('PrivacyHero', () => {
  it('renders title, subtitle, and updated chip date', () => {
    render(<PrivacyHero {...props} />)
    expect(screen.getByRole('heading', { level: 1, name: /Privacy Policy/i })).toBeInTheDocument()
    expect(screen.getByText(/How we use your data/i)).toBeInTheDocument()
    expect(screen.getByText('2026-05-09')).toBeInTheDocument()
    expect(screen.getByText(/Updated/i)).toBeInTheDocument()
  })

  it('renders breadcrumb with home link and current as non-link', () => {
    render(<PrivacyHero {...props} />)
    const home = screen.getByRole('link', { name: /Home/i })
    expect(home).toHaveAttribute('href', '/en')
    expect(screen.queryByRole('link', { name: /Privacy Policy/i })).toBeNull()
  })

  it('marks current breadcrumb item with aria-current', () => {
    render(<PrivacyHero {...props} />)
    const current = screen.getByText('Privacy Policy', { selector: '[aria-current="page"]' })
    expect(current).toBeInTheDocument()
  })
})
