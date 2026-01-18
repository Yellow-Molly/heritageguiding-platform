import { describe, it, expect } from 'vitest'
import { validateGoogleMapsUrl } from '../fields/logistics-fields'

describe('validateGoogleMapsUrl', () => {
  // Valid URLs
  it('accepts google.com/maps URL', () => {
    expect(validateGoogleMapsUrl('https://google.com/maps/place/Stockholm')).toBe(true)
  })

  it('accepts www.google.com/maps URL', () => {
    expect(validateGoogleMapsUrl('https://www.google.com/maps/place/Test')).toBe(true)
  })

  it('accepts google.se/maps URL (country TLD)', () => {
    expect(validateGoogleMapsUrl('https://google.se/maps/place/Stockholm')).toBe(true)
  })

  it('accepts goo.gl/maps short URL', () => {
    expect(validateGoogleMapsUrl('https://goo.gl/maps/abc123')).toBe(true)
  })

  it('accepts maps.google.com URL', () => {
    expect(validateGoogleMapsUrl('https://maps.google.com/maps?q=test')).toBe(true)
  })

  it('accepts maps.google.se URL (country TLD)', () => {
    expect(validateGoogleMapsUrl('https://maps.google.se/maps?q=test')).toBe(true)
  })

  it('accepts maps.app.goo.gl URL', () => {
    expect(validateGoogleMapsUrl('https://maps.app.goo.gl/abc123xyz')).toBe(true)
  })

  it('accepts http (non-https) URLs', () => {
    expect(validateGoogleMapsUrl('http://google.com/maps/place/Test')).toBe(true)
  })

  // Empty/null values (should pass - field not required)
  it('accepts null value', () => {
    expect(validateGoogleMapsUrl(null)).toBe(true)
  })

  it('accepts undefined value', () => {
    expect(validateGoogleMapsUrl(undefined)).toBe(true)
  })

  it('accepts empty string', () => {
    expect(validateGoogleMapsUrl('')).toBe(true)
  })

  // Invalid URLs
  it('rejects non-Google Maps URL', () => {
    expect(validateGoogleMapsUrl('https://example.com/maps')).toBe('Please enter a valid Google Maps URL')
  })

  it('rejects Google URL without /maps', () => {
    expect(validateGoogleMapsUrl('https://google.com/search')).toBe('Please enter a valid Google Maps URL')
  })

  it('rejects random text', () => {
    expect(validateGoogleMapsUrl('not a url at all')).toBe('Please enter a valid Google Maps URL')
  })

  it('rejects Apple Maps URL', () => {
    expect(validateGoogleMapsUrl('https://maps.apple.com/place/test')).toBe('Please enter a valid Google Maps URL')
  })

  it('rejects Bing Maps URL', () => {
    expect(validateGoogleMapsUrl('https://bing.com/maps')).toBe('Please enter a valid Google Maps URL')
  })
})
