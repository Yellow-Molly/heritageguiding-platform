import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { GuideDetailSchema } from '../guide-detail-schema'

const defaultProps = {
  name: 'Anna Svensson',
  slug: 'anna-svensson',
  languages: ['Swedish', 'English'],
  specializations: [{ name: 'Medieval History' }, { name: 'Architecture' }],
}

describe('GuideDetailSchema', () => {
  function getJson(container: HTMLElement) {
    const script = container.querySelector('script[type="application/ld+json"]')
    return JSON.parse(script!.innerHTML)
  }

  it('renders a valid JSON-LD script', () => {
    const { container } = render(<GuideDetailSchema {...defaultProps} />)
    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).toBeInTheDocument()
    expect(() => JSON.parse(script!.innerHTML)).not.toThrow()
  })

  it('has @type Person', () => {
    const { container } = render(<GuideDetailSchema {...defaultProps} />)
    expect(getJson(container)['@type']).toBe('Person')
  })

  it('includes name and url', () => {
    const { container } = render(<GuideDetailSchema {...defaultProps} />)
    const json = getJson(container)
    expect(json.name).toBe('Anna Svensson')
    expect(json.url).toContain('/guides/anna-svensson')
  })

  it('includes knowsLanguage', () => {
    const { container } = render(<GuideDetailSchema {...defaultProps} />)
    const json = getJson(container)
    expect(json.knowsLanguage).toEqual(['Swedish', 'English'])
  })

  it('includes knowsAbout from specializations', () => {
    const { container } = render(<GuideDetailSchema {...defaultProps} />)
    const json = getJson(container)
    expect(json.knowsAbout).toEqual(['Medieval History', 'Architecture'])
  })

  it('includes hasOccupation as Tour Guide', () => {
    const { container } = render(<GuideDetailSchema {...defaultProps} />)
    const json = getJson(container)
    expect(json.hasOccupation['@type']).toBe('Occupation')
    expect(json.hasOccupation.name).toBe('Tour Guide')
  })

  it('includes photo when provided', () => {
    const { container } = render(
      <GuideDetailSchema {...defaultProps} photo="https://example.com/anna.jpg" />,
    )
    const json = getJson(container)
    expect(json.image).toBe('https://example.com/anna.jpg')
  })

  it('omits photo when not provided', () => {
    const { container } = render(<GuideDetailSchema {...defaultProps} />)
    const json = getJson(container)
    expect(json.image).toBeUndefined()
  })

  it('includes credentials when provided', () => {
    const credentials = [{ credential: 'Licensed Guide' }]
    const { container } = render(
      <GuideDetailSchema {...defaultProps} credentials={credentials} />,
    )
    const json = getJson(container)
    expect(json.hasCredential).toHaveLength(1)
    expect(json.hasCredential[0].name).toBe('Licensed Guide')
  })

  it('includes worksFor Private Tours', () => {
    const { container } = render(<GuideDetailSchema {...defaultProps} />)
    const json = getJson(container)
    expect(json.worksFor.name).toBe('Private Tours')
  })
})
