import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { GuideListSchema } from '../guide-list-schema'

const mockGuides = [
  { name: 'Anna', slug: 'anna', photo: { url: 'https://example.com/anna.jpg' }, languages: ['Swedish'] },
  { name: 'Erik', slug: 'erik', languages: ['English', 'German'] },
]

describe('GuideListSchema', () => {
  function getJson(container: HTMLElement) {
    const script = container.querySelector('script[type="application/ld+json"]')
    return JSON.parse(script!.innerHTML)
  }

  it('renders a valid JSON-LD script', () => {
    const { container } = render(<GuideListSchema guides={mockGuides} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).toBeInTheDocument()
  })

  it('has @type ItemList', () => {
    const { container } = render(<GuideListSchema guides={mockGuides} />)
    expect(getJson(container)['@type']).toBe('ItemList')
  })

  it('has correct numberOfItems', () => {
    const { container } = render(<GuideListSchema guides={mockGuides} />)
    expect(getJson(container).numberOfItems).toBe(2)
  })

  it('includes list items with positions', () => {
    const { container } = render(<GuideListSchema guides={mockGuides} />)
    const json = getJson(container)
    expect(json.itemListElement).toHaveLength(2)
    expect(json.itemListElement[0].position).toBe(1)
    expect(json.itemListElement[1].position).toBe(2)
  })

  it('each item contains Person type', () => {
    const { container } = render(<GuideListSchema guides={mockGuides} />)
    const json = getJson(container)
    expect(json.itemListElement[0].item['@type']).toBe('Person')
    expect(json.itemListElement[0].item.name).toBe('Anna')
  })

  it('includes guide photo when available', () => {
    const { container } = render(<GuideListSchema guides={mockGuides} />)
    const json = getJson(container)
    expect(json.itemListElement[0].item.image).toBe('https://example.com/anna.jpg')
    expect(json.itemListElement[1].item.image).toBeUndefined()
  })

  it('includes knowsLanguage for each guide', () => {
    const { container } = render(<GuideListSchema guides={mockGuides} />)
    const json = getJson(container)
    expect(json.itemListElement[0].item.knowsLanguage).toEqual(['Swedish'])
    expect(json.itemListElement[1].item.knowsLanguage).toEqual(['English', 'German'])
  })

  it('handles empty guides array', () => {
    const { container } = render(<GuideListSchema guides={[]} />)
    const json = getJson(container)
    expect(json.numberOfItems).toBe(0)
    expect(json.itemListElement).toHaveLength(0)
  })
})
