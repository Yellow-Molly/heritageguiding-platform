import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { TourListSchema } from '../tour-list-schema'

const mockTours = [
  { title: 'Old Town Walk', slug: 'old-town-walk', image: { url: 'https://example.com/old.jpg' } },
  { title: 'Royal Palace', slug: 'royal-palace' },
]

describe('TourListSchema', () => {
  function getJson(container: HTMLElement) {
    const script = container.querySelector('script[type="application/ld+json"]')
    return JSON.parse(script!.innerHTML)
  }

  it('renders a valid JSON-LD script', () => {
    const { container } = render(<TourListSchema tours={mockTours} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).toBeInTheDocument()
  })

  it('has @type ItemList', () => {
    const { container } = render(<TourListSchema tours={mockTours} />)
    expect(getJson(container)['@type']).toBe('ItemList')
  })

  it('has correct numberOfItems', () => {
    const { container } = render(<TourListSchema tours={mockTours} />)
    expect(getJson(container).numberOfItems).toBe(2)
  })

  it('includes list items with correct positions', () => {
    const { container } = render(<TourListSchema tours={mockTours} />)
    const json = getJson(container)
    expect(json.itemListElement).toHaveLength(2)
    expect(json.itemListElement[0].position).toBe(1)
    expect(json.itemListElement[1].position).toBe(2)
  })

  it('each item contains TouristAttraction type', () => {
    const { container } = render(<TourListSchema tours={mockTours} />)
    const json = getJson(container)
    expect(json.itemListElement[0].item['@type']).toBe('TouristAttraction')
    expect(json.itemListElement[0].item.name).toBe('Old Town Walk')
  })

  it('includes tour image when available', () => {
    const { container } = render(<TourListSchema tours={mockTours} />)
    const json = getJson(container)
    expect(json.itemListElement[0].item.image).toBe('https://example.com/old.jpg')
    expect(json.itemListElement[1].item.image).toBeUndefined()
  })

  it('includes correct urls', () => {
    const { container } = render(<TourListSchema tours={mockTours} />)
    const json = getJson(container)
    expect(json.itemListElement[0].url).toContain('/tours/old-town-walk')
    expect(json.itemListElement[1].url).toContain('/tours/royal-palace')
  })

  it('handles empty tours array', () => {
    const { container } = render(<TourListSchema tours={[]} />)
    const json = getJson(container)
    expect(json.numberOfItems).toBe(0)
    expect(json.itemListElement).toHaveLength(0)
  })
})
