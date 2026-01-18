import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { TravelAgencySchema, WebPageSchema } from '../travel-agency-schema'

describe('TravelAgencySchema', () => {
  describe('default rendering', () => {
    it('renders a script tag', () => {
      const { container } = render(<TravelAgencySchema />)
      const script = container.querySelector('script[type="application/ld+json"]')
      expect(script).toBeInTheDocument()
    })

    it('contains valid JSON', () => {
      const { container } = render(<TravelAgencySchema />)
      const script = container.querySelector('script[type="application/ld+json"]')
      expect(script).not.toBeNull()

      const json = JSON.parse(script!.innerHTML)
      expect(json).toBeDefined()
    })

    it('has correct @context', () => {
      const { container } = render(<TravelAgencySchema />)
      const script = container.querySelector('script[type="application/ld+json"]')
      const json = JSON.parse(script!.innerHTML)
      expect(json['@context']).toBe('https://schema.org')
    })

    it('has correct @type', () => {
      const { container } = render(<TravelAgencySchema />)
      const script = container.querySelector('script[type="application/ld+json"]')
      const json = JSON.parse(script!.innerHTML)
      expect(json['@type']).toBe('TravelAgency')
    })

    it('has default name HeritageGuiding', () => {
      const { container } = render(<TravelAgencySchema />)
      const script = container.querySelector('script[type="application/ld+json"]')
      const json = JSON.parse(script!.innerHTML)
      expect(json.name).toBe('HeritageGuiding')
    })
  })

  describe('custom props', () => {
    it('accepts custom name', () => {
      const { container } = render(<TravelAgencySchema name="Custom Agency" />)
      const script = container.querySelector('script[type="application/ld+json"]')
      const json = JSON.parse(script!.innerHTML)
      expect(json.name).toBe('Custom Agency')
    })

    it('accepts custom description', () => {
      const { container } = render(<TravelAgencySchema description="Custom description" />)
      const script = container.querySelector('script[type="application/ld+json"]')
      const json = JSON.parse(script!.innerHTML)
      expect(json.description).toBe('Custom description')
    })

    it('accepts custom url', () => {
      const { container } = render(<TravelAgencySchema url="https://example.com" />)
      const script = container.querySelector('script[type="application/ld+json"]')
      const json = JSON.parse(script!.innerHTML)
      expect(json.url).toBe('https://example.com')
    })
  })

  describe('address schema', () => {
    it('includes address with correct @type', () => {
      const { container } = render(<TravelAgencySchema />)
      const script = container.querySelector('script[type="application/ld+json"]')
      const json = JSON.parse(script!.innerHTML)
      expect(json.address['@type']).toBe('PostalAddress')
    })

    it('includes Stockholm as addressLocality', () => {
      const { container } = render(<TravelAgencySchema />)
      const script = container.querySelector('script[type="application/ld+json"]')
      const json = JSON.parse(script!.innerHTML)
      expect(json.address.addressLocality).toBe('Stockholm')
    })
  })

  describe('aggregate rating', () => {
    it('includes aggregate rating with correct @type', () => {
      const { container } = render(<TravelAgencySchema />)
      const script = container.querySelector('script[type="application/ld+json"]')
      const json = JSON.parse(script!.innerHTML)
      expect(json.aggregateRating['@type']).toBe('AggregateRating')
    })

    it('includes rating value', () => {
      const { container } = render(<TravelAgencySchema />)
      const script = container.querySelector('script[type="application/ld+json"]')
      const json = JSON.parse(script!.innerHTML)
      expect(json.aggregateRating.ratingValue).toBe(4.9)
    })

    it('includes best and worst rating', () => {
      const { container } = render(<TravelAgencySchema />)
      const script = container.querySelector('script[type="application/ld+json"]')
      const json = JSON.parse(script!.innerHTML)
      expect(json.aggregateRating.bestRating).toBe(5)
      expect(json.aggregateRating.worstRating).toBe(1)
    })
  })

  describe('area served', () => {
    it('includes areaServed as Stockholm', () => {
      const { container } = render(<TravelAgencySchema />)
      const script = container.querySelector('script[type="application/ld+json"]')
      const json = JSON.parse(script!.innerHTML)
      expect(json.areaServed.name).toBe('Stockholm')
      expect(json.areaServed['@type']).toBe('City')
    })
  })

  describe('offer catalog', () => {
    it('includes hasOfferCatalog', () => {
      const { container } = render(<TravelAgencySchema />)
      const script = container.querySelector('script[type="application/ld+json"]')
      const json = JSON.parse(script!.innerHTML)
      expect(json.hasOfferCatalog).toBeDefined()
      expect(json.hasOfferCatalog['@type']).toBe('OfferCatalog')
    })
  })

  describe('opening hours', () => {
    it('includes openingHoursSpecification', () => {
      const { container } = render(<TravelAgencySchema />)
      const script = container.querySelector('script[type="application/ld+json"]')
      const json = JSON.parse(script!.innerHTML)
      expect(json.openingHoursSpecification).toBeDefined()
      expect(Array.isArray(json.openingHoursSpecification)).toBe(true)
    })

    it('opening hours have correct structure', () => {
      const { container } = render(<TravelAgencySchema />)
      const script = container.querySelector('script[type="application/ld+json"]')
      const json = JSON.parse(script!.innerHTML)
      const hours = json.openingHoursSpecification[0]
      expect(hours['@type']).toBe('OpeningHoursSpecification')
      expect(hours.opens).toBe('09:00')
      expect(hours.closes).toBe('18:00')
    })

    it('includes all days of the week', () => {
      const { container } = render(<TravelAgencySchema />)
      const script = container.querySelector('script[type="application/ld+json"]')
      const json = JSON.parse(script!.innerHTML)
      const hours = json.openingHoursSpecification[0]
      expect(hours.dayOfWeek).toContain('Monday')
      expect(hours.dayOfWeek).toContain('Sunday')
      expect(hours.dayOfWeek.length).toBe(7)
    })
  })
})

describe('WebPageSchema', () => {
  const defaultProps = {
    name: 'Test Page',
    description: 'Test description',
    url: 'https://example.com/page',
  }

  describe('basic rendering', () => {
    it('renders a script tag', () => {
      const { container } = render(<WebPageSchema {...defaultProps} />)
      const script = container.querySelector('script[type="application/ld+json"]')
      expect(script).toBeInTheDocument()
    })

    it('has correct @type', () => {
      const { container } = render(<WebPageSchema {...defaultProps} />)
      const script = container.querySelector('script[type="application/ld+json"]')
      const json = JSON.parse(script!.innerHTML)
      expect(json['@type']).toBe('WebPage')
    })

    it('includes provided name', () => {
      const { container } = render(<WebPageSchema {...defaultProps} />)
      const script = container.querySelector('script[type="application/ld+json"]')
      const json = JSON.parse(script!.innerHTML)
      expect(json.name).toBe('Test Page')
    })

    it('includes provided description', () => {
      const { container } = render(<WebPageSchema {...defaultProps} />)
      const script = container.querySelector('script[type="application/ld+json"]')
      const json = JSON.parse(script!.innerHTML)
      expect(json.description).toBe('Test description')
    })

    it('includes provided url', () => {
      const { container } = render(<WebPageSchema {...defaultProps} />)
      const script = container.querySelector('script[type="application/ld+json"]')
      const json = JSON.parse(script!.innerHTML)
      expect(json.url).toBe('https://example.com/page')
    })
  })

  describe('isPartOf', () => {
    it('includes isPartOf with WebSite type', () => {
      const { container } = render(<WebPageSchema {...defaultProps} />)
      const script = container.querySelector('script[type="application/ld+json"]')
      const json = JSON.parse(script!.innerHTML)
      expect(json.isPartOf['@type']).toBe('WebSite')
      expect(json.isPartOf.name).toBe('HeritageGuiding')
    })
  })

  describe('breadcrumb', () => {
    it('includes breadcrumb when provided', () => {
      const breadcrumb = [
        { name: 'Home', url: 'https://example.com' },
        { name: 'Tours', url: 'https://example.com/tours' },
      ]
      const { container } = render(<WebPageSchema {...defaultProps} breadcrumb={breadcrumb} />)
      const script = container.querySelector('script[type="application/ld+json"]')
      const json = JSON.parse(script!.innerHTML)
      expect(json.breadcrumb['@type']).toBe('BreadcrumbList')
      expect(json.breadcrumb.itemListElement).toHaveLength(2)
    })

    it('breadcrumb items have correct structure', () => {
      const breadcrumb = [{ name: 'Home', url: 'https://example.com' }]
      const { container } = render(<WebPageSchema {...defaultProps} breadcrumb={breadcrumb} />)
      const script = container.querySelector('script[type="application/ld+json"]')
      const json = JSON.parse(script!.innerHTML)
      const item = json.breadcrumb.itemListElement[0]
      expect(item['@type']).toBe('ListItem')
      expect(item.position).toBe(1)
      expect(item.name).toBe('Home')
    })
  })
})
