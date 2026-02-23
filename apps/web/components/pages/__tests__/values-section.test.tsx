import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock next-intl before importing component
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      title: 'What Makes Us Different',
      subtitle: 'A considered approach to cultural tourism in Stockholm',
      'authorizedExperts.title': 'Authorized Experts Only',
      'authorizedExperts.description': 'Every experience is led by a fully licensed guide or verified expert.',
      'curated.title': 'Curated, Never Crowded',
      'curated.description': 'We are not an open platform.',
      'privateByDesign.title': 'Private by Design',
      'privateByDesign.description': 'All experiences are exclusively private.',
      'seamlessHosting.title': 'Seamless Hosting',
      'seamlessHosting.description': 'Your guide manages logistics, transportation, and transitions.',
      'multilingual.title': 'Multilingual Expertise',
      'multilingual.description': 'Tours are offered in Swedish, English, German, French, Portuguese, and Spanish.',
    }
    return translations[key] || key
  },
}))

// Import after mocking
import { ValuesSection } from '../values-section'

describe('ValuesSection', () => {
  describe('rendering', () => {
    it('renders section title', () => {
      render(<ValuesSection />)
      expect(screen.getByText('What Makes Us Different')).toBeInTheDocument()
    })

    it('renders section subtitle', () => {
      render(<ValuesSection />)
      expect(screen.getByText('A considered approach to cultural tourism in Stockholm')).toBeInTheDocument()
    })

    it('renders all five value cards', () => {
      render(<ValuesSection />)

      expect(screen.getByText('Authorized Experts Only')).toBeInTheDocument()
      expect(screen.getByText('Curated, Never Crowded')).toBeInTheDocument()
      expect(screen.getByText('Private by Design')).toBeInTheDocument()
      expect(screen.getByText('Seamless Hosting')).toBeInTheDocument()
      expect(screen.getByText('Multilingual Expertise')).toBeInTheDocument()
    })

    it('renders value descriptions', () => {
      render(<ValuesSection />)

      expect(screen.getByText('Every experience is led by a fully licensed guide or verified expert.')).toBeInTheDocument()
      expect(screen.getByText('All experiences are exclusively private.')).toBeInTheDocument()
    })
  })

  describe('structure', () => {
    it('renders as a section element', () => {
      const { container } = render(<ValuesSection />)
      const section = container.querySelector('section')
      expect(section).toBeInTheDocument()
    })

    it('has proper grid layout', () => {
      const { container } = render(<ValuesSection />)
      const grid = container.querySelector('.grid')
      expect(grid).toBeInTheDocument()
    })
  })
})
