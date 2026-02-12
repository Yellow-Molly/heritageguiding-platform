/**
 * Unit tests for GuideListingCard component
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import type { GuideListItem } from '@/lib/api/get-guides'

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, className }: { src: string; alt: string; className?: string }) => (
    <img src={src} alt={alt} className={className} />
  ),
}))

// Mock i18n navigation Link component
vi.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

const mockGuideWithPhoto: GuideListItem = {
  id: '1',
  name: 'Erik Lindqvist',
  slug: 'erik-lindqvist',
  photo: { url: '/photo.jpg', alt: 'Erik Lindqvist' },
  languages: ['sv', 'en'],
  additionalLanguages: ['fi'],
  specializations: [
    { id: 'cat1', name: 'History', slug: 'history' },
    { id: 'cat2', name: 'Architecture', slug: 'architecture' },
  ],
  operatingAreas: [
    { id: 'city1', name: 'Stockholm', slug: 'stockholm' },
    { id: 'city2', name: 'Uppsala', slug: 'uppsala' },
  ],
  credentials: [{ credential: 'PhD History' }],
  bioExcerpt: 'Expert guide with 10 years of experience',
}

const mockGuideWithoutPhoto: GuideListItem = {
  id: '2',
  name: 'Anna Berg',
  slug: 'anna-berg',
  languages: ['sv'],
  specializations: [],
  operatingAreas: [],
}

const mockGuideWithManySpecializations: GuideListItem = {
  id: '3',
  name: 'Lars Nilsson',
  slug: 'lars-nilsson',
  languages: ['en'],
  specializations: [
    { id: 'cat1', name: 'History', slug: 'history' },
    { id: 'cat2', name: 'Architecture', slug: 'architecture' },
    { id: 'cat3', name: 'Art', slug: 'art' },
    { id: 'cat4', name: 'Culture', slug: 'culture' },
    { id: 'cat5', name: 'Food', slug: 'food' },
  ],
  operatingAreas: [],
}

describe('GuideListingCard', () => {
  it('renders guide name', async () => {
    const { GuideListingCard } = await import('../guide-listing-card')

    render(<GuideListingCard guide={mockGuideWithPhoto} />)

    expect(screen.getByText('Erik Lindqvist')).toBeInTheDocument()
  })

  it('renders guide photo with alt text', async () => {
    const { GuideListingCard } = await import('../guide-listing-card')

    render(<GuideListingCard guide={mockGuideWithPhoto} />)

    const photo = screen.getByAltText('Erik Lindqvist')
    expect(photo).toBeInTheDocument()
    expect(photo).toHaveAttribute('src', '/photo.jpg')
  })

  it('shows fallback initial when no photo', async () => {
    const { GuideListingCard } = await import('../guide-listing-card')

    render(<GuideListingCard guide={mockGuideWithoutPhoto} />)

    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('renders specialization badges', async () => {
    const { GuideListingCard } = await import('../guide-listing-card')

    render(<GuideListingCard guide={mockGuideWithPhoto} />)

    expect(screen.getByText('History')).toBeInTheDocument()
    expect(screen.getByText('Architecture')).toBeInTheDocument()
  })

  it('renders language names - Swedish, English, Finnish', async () => {
    const { GuideListingCard } = await import('../guide-listing-card')

    render(<GuideListingCard guide={mockGuideWithPhoto} />)

    const languagesText = screen.getByText(/Swedish, English, Finnish/)
    expect(languagesText).toBeInTheDocument()
  })

  it('renders operating areas', async () => {
    const { GuideListingCard } = await import('../guide-listing-card')

    render(<GuideListingCard guide={mockGuideWithPhoto} />)

    const areasText = screen.getByText(/Stockholm, Uppsala/)
    expect(areasText).toBeInTheDocument()
  })

  it('links to correct guide detail URL', async () => {
    const { GuideListingCard } = await import('../guide-listing-card')

    render(<GuideListingCard guide={mockGuideWithPhoto} />)

    const link = screen.getByRole('link', { name: /Erik Lindqvist/ })
    expect(link).toHaveAttribute('href', '/guides/erik-lindqvist')
  })

  it('shows bio excerpt when present', async () => {
    const { GuideListingCard } = await import('../guide-listing-card')

    render(<GuideListingCard guide={mockGuideWithPhoto} />)

    expect(screen.getByText('Expert guide with 10 years of experience')).toBeInTheDocument()
  })

  it('limits displayed specializations to 3 and shows overflow badge', async () => {
    const { GuideListingCard } = await import('../guide-listing-card')

    render(<GuideListingCard guide={mockGuideWithManySpecializations} />)

    // First 3 should be visible
    expect(screen.getByText('History')).toBeInTheDocument()
    expect(screen.getByText('Architecture')).toBeInTheDocument()
    expect(screen.getByText('Art')).toBeInTheDocument()

    // 4th and 5th should not be visible
    expect(screen.queryByText('Culture')).not.toBeInTheDocument()
    expect(screen.queryByText('Food')).not.toBeInTheDocument()

    // Overflow badge showing +2 more
    expect(screen.getByText('+2')).toBeInTheDocument()
  })

  it('does not show bio excerpt when not present', async () => {
    const { GuideListingCard } = await import('../guide-listing-card')

    render(<GuideListingCard guide={mockGuideWithoutPhoto} />)

    expect(screen.queryByText(/Expert guide/)).not.toBeInTheDocument()
  })

  it('handles guide with no specializations', async () => {
    const { GuideListingCard } = await import('../guide-listing-card')

    render(<GuideListingCard guide={mockGuideWithoutPhoto} />)

    expect(screen.queryByText('History')).not.toBeInTheDocument()
  })

  it('handles guide with no operating areas', async () => {
    const { GuideListingCard } = await import('../guide-listing-card')

    render(<GuideListingCard guide={mockGuideWithoutPhoto} />)

    expect(screen.queryByText('Stockholm')).not.toBeInTheDocument()
  })

  it('combines main languages and additional languages', async () => {
    const { GuideListingCard } = await import('../guide-listing-card')

    const guideWithAdditionalLangs: GuideListItem = {
      ...mockGuideWithoutPhoto,
      languages: ['sv', 'en'],
      additionalLanguages: ['de', 'fr'],
    }

    render(<GuideListingCard guide={guideWithAdditionalLangs} />)

    const languagesText = screen.getByText(/Swedish, English, German, French/)
    expect(languagesText).toBeInTheDocument()
  })
})
