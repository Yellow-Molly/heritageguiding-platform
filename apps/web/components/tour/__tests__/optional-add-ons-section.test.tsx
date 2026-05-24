import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock next-intl/server. The section uses `getTranslations` which is async on
// server. Return a synchronous resolver for test ergonomics; passes vars through.
vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string, vars?: Record<string, string | number>) => {
    if (key === 'title') return 'Optional Add-ons'
    if (key === 'subtitle') return 'Available to purchase during checkout.'
    if (key === 'pillRequired') return 'Required — added at checkout'
    if (key === 'pillOptional') return 'Optional — add at checkout'
    if (key === 'priceHintPerPerson') return `from ${vars?.price ?? ''} per person`
    if (key === 'priceHintPerBooking') return `${vars?.price ?? ''} per booking`
    return key
  },
}))

// Mock formatPrice util to keep assertions stable across locale-dependent output
vi.mock('@/lib/utils', () => ({
  formatPrice: (price: number, currency: string) => `${currency} ${price}`,
}))

import { OptionalAddOnsSection } from '../optional-add-ons-section'
import type { TourDetail, OptionalAddOn } from '@/lib/api/get-tour-by-slug'

function buildAddon(overrides: Partial<OptionalAddOn> = {}): OptionalAddOn {
  return {
    id: 'addon-1',
    name: 'Vasa Museum admission ticket',
    description: undefined,
    pricingType: 'perBooking',
    adultPriceHint: 150,
    childPriceHint: undefined,
    currency: 'SEK',
    isRequired: false,
    ...overrides,
  }
}

function buildTour(optionalAddOns?: OptionalAddOn[]): TourDetail {
  return {
    id: 'tour-1',
    title: 'Test Tour',
    description: 'desc',
    slug: 'test-tour',
    image: { url: '', alt: '' },
    duration: 120,
    maxCapacity: 9,
    rating: 0,
    reviewCount: 0,
    price: 3900,
    featured: false,
    descriptionHtml: '',
    highlights: [],
    gallery: [],
    guides: [],
    optionalAddOns,
  }
}

describe('OptionalAddOnsSection', () => {
  it('returns null (renders nothing) when tour has no add-ons', async () => {
    const result = await OptionalAddOnsSection({ tour: buildTour(undefined) })
    expect(result).toBeNull()
  })

  it('returns null when add-ons array is empty', async () => {
    const result = await OptionalAddOnsSection({ tour: buildTour([]) })
    expect(result).toBeNull()
  })

  it('renders title and one row when one add-on present', async () => {
    const result = await OptionalAddOnsSection({
      tour: buildTour([buildAddon({ name: 'Museum Ticket' })]),
    })
    render(result as React.ReactElement)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Optional Add-ons')
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Museum Ticket')
  })

  it('renders multiple rows in array order', async () => {
    const result = await OptionalAddOnsSection({
      tour: buildTour([
        buildAddon({ id: 'a', name: 'Ticket A' }),
        buildAddon({ id: 'b', name: 'Ticket B' }),
        buildAddon({ id: 'c', name: 'Ticket C' }),
      ]),
    })
    render(result as React.ReactElement)
    const rowHeadings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(rowHeadings).toEqual(['Ticket A', 'Ticket B', 'Ticket C'])
  })

  it('renders amber "Required" pill when isRequired is true', async () => {
    const result = await OptionalAddOnsSection({
      tour: buildTour([buildAddon({ isRequired: true })]),
    })
    render(result as React.ReactElement)
    expect(screen.getByText(/Required — added at checkout/)).toBeInTheDocument()
  })

  it('renders neutral "Optional" pill when isRequired is false', async () => {
    const result = await OptionalAddOnsSection({
      tour: buildTour([buildAddon({ isRequired: false })]),
    })
    render(result as React.ReactElement)
    expect(screen.getByText(/Optional — add at checkout/)).toBeInTheDocument()
  })

  it('uses per-booking copy when pricingType is perBooking', async () => {
    const result = await OptionalAddOnsSection({
      tour: buildTour([buildAddon({ pricingType: 'perBooking', adultPriceHint: 150, currency: 'SEK' })]),
    })
    render(result as React.ReactElement)
    expect(screen.getByText('SEK 150 per booking')).toBeInTheDocument()
  })

  it('uses per-person "from" copy when pricingType is perPerson', async () => {
    const result = await OptionalAddOnsSection({
      tour: buildTour([buildAddon({ pricingType: 'perPerson', adultPriceHint: 100, currency: 'SEK' })]),
    })
    render(result as React.ReactElement)
    expect(screen.getByText('from SEK 100 per person')).toBeInTheDocument()
  })

  it('renders description when present', async () => {
    const result = await OptionalAddOnsSection({
      tour: buildTour([buildAddon({ description: 'Skip-the-line entry for Vasa Museum' })]),
    })
    render(result as React.ReactElement)
    expect(screen.getByText('Skip-the-line entry for Vasa Museum')).toBeInTheDocument()
  })

  it('omits description when not present', async () => {
    const result = await OptionalAddOnsSection({
      tour: buildTour([buildAddon({ description: undefined })]),
    })
    render(result as React.ReactElement)
    // Description never rendered — only title + price + pill remain
    expect(screen.queryByText(/Skip-the-line/)).not.toBeInTheDocument()
  })
})
