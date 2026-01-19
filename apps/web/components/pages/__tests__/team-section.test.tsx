import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock next-intl before importing component
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      title: 'Meet Our Team',
      subtitle: 'Passionate historians',
      'founder.name': 'Dr. Erik Lindström',
      'founder.role': 'Founder & Lead Historian',
      'founder.bio': 'With over 20 years of experience',
      'leadGuide.name': 'Anna Bergström',
      'leadGuide.role': 'Senior Guide',
      'leadGuide.bio': 'Anna specializes in art history',
      'historian.name': 'Dr. Magnus Olsson',
      'historian.role': 'Archaeological Advisor',
      'historian.bio': 'Magnus brings archaeological expertise',
    }
    return translations[key] || key
  },
}))

// Mock next/image - proper factory function
vi.mock('next/image', () => ({
  default: function MockImage({ alt, src }: { alt: string; src: string }) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt} src={src} />
  },
}))

// Import after mocking
import { TeamSection } from '../team-section'

describe('TeamSection', () => {
  describe('rendering', () => {
    it('renders section title', () => {
      render(<TeamSection />)
      expect(screen.getByText('Meet Our Team')).toBeInTheDocument()
    })

    it('renders section subtitle', () => {
      render(<TeamSection />)
      expect(screen.getByText('Passionate historians')).toBeInTheDocument()
    })

    it('renders all team member names', () => {
      render(<TeamSection />)

      expect(screen.getByText('Dr. Erik Lindström')).toBeInTheDocument()
      expect(screen.getByText('Anna Bergström')).toBeInTheDocument()
      expect(screen.getByText('Dr. Magnus Olsson')).toBeInTheDocument()
    })

    it('renders team member roles', () => {
      render(<TeamSection />)

      expect(screen.getByText('Founder & Lead Historian')).toBeInTheDocument()
      expect(screen.getByText('Senior Guide')).toBeInTheDocument()
      expect(screen.getByText('Archaeological Advisor')).toBeInTheDocument()
    })

    it('renders team member bios', () => {
      render(<TeamSection />)

      expect(screen.getByText('With over 20 years of experience')).toBeInTheDocument()
      expect(screen.getByText('Anna specializes in art history')).toBeInTheDocument()
      expect(screen.getByText('Magnus brings archaeological expertise')).toBeInTheDocument()
    })
  })

  describe('structure', () => {
    it('renders as a section element', () => {
      const { container } = render(<TeamSection />)
      const section = container.querySelector('section')
      expect(section).toBeInTheDocument()
    })

    it('renders three team member names', () => {
      render(<TeamSection />)
      // Verify all three team members are rendered
      expect(screen.getByText('Dr. Erik Lindström')).toBeInTheDocument()
      expect(screen.getByText('Anna Bergström')).toBeInTheDocument()
      expect(screen.getByText('Dr. Magnus Olsson')).toBeInTheDocument()
    })

    it('renders team member images', () => {
      render(<TeamSection />)
      const images = screen.getAllByRole('img')
      expect(images).toHaveLength(3)
    })

    it('renders credentials badges', () => {
      render(<TeamSection />)

      expect(screen.getByText('PhD Medieval History')).toBeInTheDocument()
      expect(screen.getByText('Uppsala University')).toBeInTheDocument()
      expect(screen.getByText('MA Art History')).toBeInTheDocument()
      expect(screen.getByText('Licensed Tour Guide')).toBeInTheDocument()
    })
  })
})
