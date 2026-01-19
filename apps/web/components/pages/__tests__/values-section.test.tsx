import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock next-intl before importing component
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      title: 'What Makes Us Different',
      subtitle: "We're committed to excellence",
      'expertise.title': 'PhD-Level Expertise',
      'expertise.description': 'Tours led by professional historians',
      'multilingual.title': 'Multilingual Tours',
      'multilingual.description': 'Available in Swedish, English, and German',
      'accessibility.title': 'Fully Accessible',
      'accessibility.description': 'Wheelchair-friendly routes',
      'heritage.title': 'Heritage Focused',
      'heritage.description': 'Deep dive into authentic Swedish history',
      'smallGroups.title': 'Small Groups',
      'smallGroups.description': 'Intimate experiences with maximum 12 participants',
      'sustainable.title': 'Sustainable Tourism',
      'sustainable.description': 'Eco-conscious practices',
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
      expect(screen.getByText("We're committed to excellence")).toBeInTheDocument()
    })

    it('renders all six value cards', () => {
      render(<ValuesSection />)

      expect(screen.getByText('PhD-Level Expertise')).toBeInTheDocument()
      expect(screen.getByText('Multilingual Tours')).toBeInTheDocument()
      expect(screen.getByText('Fully Accessible')).toBeInTheDocument()
      expect(screen.getByText('Heritage Focused')).toBeInTheDocument()
      expect(screen.getByText('Small Groups')).toBeInTheDocument()
      expect(screen.getByText('Sustainable Tourism')).toBeInTheDocument()
    })

    it('renders value descriptions', () => {
      render(<ValuesSection />)

      expect(screen.getByText('Tours led by professional historians')).toBeInTheDocument()
      expect(screen.getByText('Wheelchair-friendly routes')).toBeInTheDocument()
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
