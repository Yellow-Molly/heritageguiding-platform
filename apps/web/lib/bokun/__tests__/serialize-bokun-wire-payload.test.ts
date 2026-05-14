/**
 * Tests for serializeBokunExperiencePayload — the boundary that converts our
 * internal localized-array payload to Bokun's ExperienceComponentsDto wire shape.
 * Regression-critical: a mismatch here is what triggered HTTP 400 on 2026-05-15.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  localizedListToHtml,
  pickPrimaryLocaleValue,
  serializeBokunExperiencePayload,
} from '../serialize-bokun-wire-payload'
import type { BokunExperienceCreatePayload } from '../bokun-types'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('pickPrimaryLocaleValue', () => {
  it('returns undefined for missing or empty input', () => {
    expect(pickPrimaryLocaleValue(undefined)).toBeUndefined()
    expect(pickPrimaryLocaleValue([])).toBeUndefined()
  })

  it('defaults to en when present', () => {
    expect(
      pickPrimaryLocaleValue([
        { locale: 'sv', value: 'sv-value' },
        { locale: 'en', value: 'en-value' },
      ])
    ).toBe('en-value')
  })

  it('falls back through en → sv → de when primary missing', () => {
    expect(pickPrimaryLocaleValue([{ locale: 'sv', value: 'only-sv' }])).toBe('only-sv')
    expect(pickPrimaryLocaleValue([{ locale: 'de', value: 'only-de' }])).toBe('only-de')
  })

  it('honors BOKUN_SYNC_LOCALE env override', () => {
    vi.stubEnv('BOKUN_SYNC_LOCALE', 'sv')
    expect(
      pickPrimaryLocaleValue([
        { locale: 'en', value: 'en-value' },
        { locale: 'sv', value: 'sv-value' },
      ])
    ).toBe('sv-value')
  })

  it('ignores invalid env override and falls back to en', () => {
    vi.stubEnv('BOKUN_SYNC_LOCALE', 'jp')
    expect(
      pickPrimaryLocaleValue([
        { locale: 'sv', value: 'sv-value' },
        { locale: 'en', value: 'en-value' },
      ])
    ).toBe('en-value')
  })

  it('skips empty / whitespace-only values', () => {
    expect(
      pickPrimaryLocaleValue([
        { locale: 'en', value: '   ' },
        { locale: 'sv', value: 'real' },
      ])
    ).toBe('real')
  })
})

describe('localizedListToHtml', () => {
  it('converts mapper-joined items into <ul><li> HTML', () => {
    expect(localizedListToHtml([{ locale: 'en', value: 'Guide • Map' }])).toBe(
      '<ul><li>Guide</li><li>Map</li></ul>'
    )
  })

  it('escapes HTML chars in items to prevent injection', () => {
    expect(localizedListToHtml([{ locale: 'en', value: '<b>Bad</b> & evil' }])).toBe(
      '<ul><li>&lt;b&gt;Bad&lt;/b&gt; &amp; evil</li></ul>'
    )
  })

  it('returns undefined for missing input', () => {
    expect(localizedListToHtml(undefined)).toBeUndefined()
    expect(localizedListToHtml([])).toBeUndefined()
  })
})

describe('serializeBokunExperiencePayload', () => {
  function buildPayload(
    overrides: Partial<BokunExperienceCreatePayload> = {}
  ): BokunExperienceCreatePayload {
    return {
      title: [{ locale: 'en', value: 'Test Tour' }],
      description: [{ locale: 'en', value: '<p>Long description</p>' }],
      summary: [{ locale: 'en', value: 'Short summary' }],
      durationISO: 'PT2H',
      minParticipants: 1,
      maxParticipants: 10,
      rates: [
        {
          title: 'Standard',
          currency: 'SEK',
          pricePerBooking: false,
          pricingCategories: [{ title: 'Adult', pricePerCategoryUnit: '199.00' }],
        },
      ],
      meetingPoint: { title: [{ locale: 'en', value: 'Central Station' }] },
      ...overrides,
    }
  }

  it('produces flat strings for title/shortDescription/description (not arrays)', () => {
    const out = serializeBokunExperiencePayload(buildPayload())
    expect(out.title).toBe('Test Tour')
    expect(out.shortDescription).toBe('Short summary')
    expect(out.description).toBe('<p>Long description</p>')
  })

  it('renames summary → shortDescription on the wire', () => {
    const out = serializeBokunExperiencePayload(buildPayload())
    expect(out).not.toHaveProperty('summary')
    expect(out.shortDescription).toBeDefined()
  })

  it('omits fields with no Bokun equivalent (highlights, rates, duration, etc.)', () => {
    const out = serializeBokunExperiencePayload(
      buildPayload({
        highlights: [{ locale: 'en', value: 'Old Town • Castle' }],
        activityLevel: 'EASY',
        wheelchairAccessible: true,
      })
    )
    expect(out).not.toHaveProperty('highlights')
    expect(out).not.toHaveProperty('durationISO')
    expect(out).not.toHaveProperty('minParticipants')
    expect(out).not.toHaveProperty('maxParticipants')
    expect(out).not.toHaveProperty('rates')
    expect(out).not.toHaveProperty('meetingPoint')
    expect(out).not.toHaveProperty('activityLevel')
    expect(out).not.toHaveProperty('wheelchairAccessible')
  })

  it('maps inclusions/exclusions/bringList → included/excluded/requirements as HTML', () => {
    const out = serializeBokunExperiencePayload(
      buildPayload({
        inclusions: [{ locale: 'en', value: 'Guide • Map' }],
        exclusions: [{ locale: 'en', value: 'Food • Drinks' }],
        bringList: [{ locale: 'en', value: 'Shoes • Water' }],
      })
    )
    expect(out.included).toBe('<ul><li>Guide</li><li>Map</li></ul>')
    expect(out.excluded).toBe('<ul><li>Food</li><li>Drinks</li></ul>')
    expect(out.requirements).toBe('<ul><li>Shoes</li><li>Water</li></ul>')
  })

  it('omits empty optional fields rather than sending empty strings', () => {
    const out = serializeBokunExperiencePayload({
      title: [{ locale: 'en', value: 'Only Title' }],
      description: [],
      summary: [],
      durationISO: 'PT1H',
      minParticipants: 1,
      maxParticipants: 5,
      rates: [],
      meetingPoint: { title: [] },
    })
    expect(out).toEqual({ title: 'Only Title' })
  })

  it('regression: 2026-05-15 — never produces arrays at the wire layer', () => {
    // Bokun returned HTTP 400 (Jackson MismatchedInputException) when title was
    // serialized as a JSON array. This test fails if anyone re-introduces arrays.
    const out = serializeBokunExperiencePayload(buildPayload())
    for (const value of Object.values(out)) {
      expect(Array.isArray(value)).toBe(false)
    }
  })
})
