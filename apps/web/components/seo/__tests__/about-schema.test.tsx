import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { AboutSchema } from '../about-schema'

describe('AboutSchema', () => {
  function getJson(container: HTMLElement) {
    const script = container.querySelector('script[type="application/ld+json"]')
    return JSON.parse(script!.innerHTML)
  }

  describe('basic rendering', () => {
    it('renders a script tag with valid JSON-LD', () => {
      const { container } = render(<AboutSchema />)
      const script = container.querySelector('script[type="application/ld+json"]')
      expect(script).toBeInTheDocument()
      expect(() => JSON.parse(script!.innerHTML)).not.toThrow()
    })

    it('has @type AboutPage', () => {
      const { container } = render(<AboutSchema />)
      expect(getJson(container)['@type']).toBe('AboutPage')
    })

    it('has @context schema.org', () => {
      const { container } = render(<AboutSchema />)
      expect(getJson(container)['@context']).toBe('https://schema.org')
    })
  })

  describe('mainEntity Organization', () => {
    it('includes Organization as mainEntity', () => {
      const { container } = render(<AboutSchema />)
      const json = getJson(container)
      expect(json.mainEntity['@type']).toBe('Organization')
      expect(json.mainEntity.name).toBe('HeritageGuiding')
    })

    it('includes areaServed Stockholm', () => {
      const { container } = render(<AboutSchema />)
      const json = getJson(container)
      expect(json.mainEntity.areaServed.name).toBe('Stockholm')
    })
  })

  describe('custom props', () => {
    it('accepts custom description', () => {
      const { container } = render(<AboutSchema description="Custom desc" />)
      const json = getJson(container)
      expect(json.description).toBe('Custom desc')
    })

    it('includes founders when provided', () => {
      const founders = [
        { name: 'Alice', image: 'https://example.com/alice.jpg' },
        { name: 'Bob' },
      ]
      const { container } = render(<AboutSchema founders={founders} />)
      const json = getJson(container)
      expect(json.mainEntity.founder).toHaveLength(2)
      expect(json.mainEntity.founder[0].name).toBe('Alice')
      expect(json.mainEntity.founder[0].image).toBe('https://example.com/alice.jpg')
      expect(json.mainEntity.founder[1].name).toBe('Bob')
    })

    it('omits founders when not provided', () => {
      const { container } = render(<AboutSchema />)
      const json = getJson(container)
      expect(json.mainEntity.founder).toBeUndefined()
    })
  })
})
