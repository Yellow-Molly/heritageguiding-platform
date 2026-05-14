/**
 * Tests for tour-to-bokun-experience-mapper.ts
 * Goals: 100% branch coverage for priceType, locale, duration, optional fields.
 */
import { describe, it, expect } from 'vitest'
import { buildTourFixture, lexicalParagraph } from './fixtures/tour-fixtures'
import {
  hoursToISO8601,
  localizedField,
  localizedFieldArray,
  mapDescriptionToBokun,
  mapDifficultyLevel,
  mapLogisticsToBokunMeetingPoint,
  mapPricingToBokunRates,
  tourToBokunExperiencePayload,
} from '../tour-to-bokun-experience-mapper'

describe('hoursToISO8601', () => {
  it('formats integer hours as PT{n}H', () => {
    expect(hoursToISO8601(3)).toBe('PT3H')
  })
  it('formats half-hours as PT{n}H{m}M', () => {
    expect(hoursToISO8601(1.5)).toBe('PT1H30M')
  })
  it('formats sub-hour durations as PT{m}M', () => {
    expect(hoursToISO8601(0.5)).toBe('PT30M')
  })
  it('returns PT0M for zero or negative', () => {
    expect(hoursToISO8601(0)).toBe('PT0M')
    expect(hoursToISO8601(-1)).toBe('PT0M')
  })
  it('rounds fractional minutes', () => {
    expect(hoursToISO8601(2.25)).toBe('PT2H15M')
  })
})

describe('localizedField', () => {
  it('emits one entry per non-empty locale, in stable sv→en→de order', () => {
    const out = localizedField({ sv: 'Hej', en: 'Hi', de: 'Hallo' })
    expect(out).toEqual([
      { locale: 'sv', value: 'Hej' },
      { locale: 'en', value: 'Hi' },
      { locale: 'de', value: 'Hallo' },
    ])
  })
  it('skips empty/null/undefined values', () => {
    const out = localizedField({ sv: '', en: 'Hi', de: null })
    expect(out).toEqual([{ locale: 'en', value: 'Hi' }])
  })
  it('returns empty array for null/undefined input', () => {
    expect(localizedField(null)).toEqual([])
    expect(localizedField(undefined)).toEqual([])
  })
})

describe('localizedFieldArray', () => {
  it('joins items per locale with bullet separator', () => {
    const out = localizedFieldArray(
      { en: [{ item: 'A' }, { item: 'B' }] },
      (x) => x.item
    )
    expect(out).toEqual([{ locale: 'en', value: 'A • B' }])
  })
  it('omits locales with empty arrays or only blank items', () => {
    const out = localizedFieldArray(
      { en: [{ item: 'A' }], sv: [{ item: '' }, { item: '   ' }] },
      (x) => x.item
    )
    expect(out).toEqual([{ locale: 'en', value: 'A' }])
  })
})

describe('mapPricingToBokunRates', () => {
  it('per_person without childPrice → 1 Adult category', () => {
    const rates = mapPricingToBokunRates({
      basePrice: 199,
      currency: 'SEK',
      priceType: 'per_person',
    })
    expect(rates).toHaveLength(1)
    expect(rates[0].pricePerBooking).toBe(false)
    expect(rates[0].pricingCategories).toHaveLength(1)
    expect(rates[0].pricingCategories[0].title).toBe('Adult')
    expect(rates[0].pricingCategories[0].pricePerCategoryUnit).toBe('199.00')
  })

  it('per_person WITH childPrice → 2 categories (Adult + Child)', () => {
    const rates = mapPricingToBokunRates({
      basePrice: 199,
      currency: 'SEK',
      priceType: 'per_person',
      childPrice: 99,
    })
    expect(rates[0].pricingCategories).toHaveLength(2)
    expect(rates[0].pricingCategories[1]).toMatchObject({
      title: 'Child',
      pricePerCategoryUnit: '99.00',
      maxAge: 12,
    })
  })

  it('per_group → flat-rate, pricePerBooking=true, single Per-group category', () => {
    const rates = mapPricingToBokunRates({
      basePrice: 1500,
      currency: 'EUR',
      priceType: 'per_group',
    })
    expect(rates[0].pricePerBooking).toBe(true)
    expect(rates[0].currency).toBe('EUR')
    expect(rates[0].pricingCategories).toHaveLength(1)
    expect(rates[0].pricingCategories[0]).toMatchObject({
      title: 'Per group',
      flatPrice: '1500.00',
    })
    expect(rates[0].pricingCategories[0].pricePerCategoryUnit).toBeUndefined()
  })

  it('custom → behaves like per_person Adult-only (manual edit in Bokun afterwards)', () => {
    const rates = mapPricingToBokunRates({
      basePrice: 500,
      currency: 'USD',
      priceType: 'custom',
      childPrice: 250, // ignored for custom branch
    })
    expect(rates[0].pricePerBooking).toBe(false)
    expect(rates[0].pricingCategories).toHaveLength(1)
    expect(rates[0].pricingCategories[0].title).toBe('Adult')
  })

  it('defaults currency to SEK when missing', () => {
    const rates = mapPricingToBokunRates({
      basePrice: 100,
      priceType: 'per_person',
    })
    expect(rates[0].currency).toBe('SEK')
  })

  it('always emits prices as 2-decimal strings (never floats)', () => {
    const rates = mapPricingToBokunRates({
      basePrice: 199.5,
      currency: 'SEK',
      priceType: 'per_person',
      childPrice: 99,
    })
    expect(rates[0].pricingCategories[0].pricePerCategoryUnit).toBe('199.50')
    expect(rates[0].pricingCategories[1].pricePerCategoryUnit).toBe('99.00')
  })

  it.each([
    [NaN, '0.00'],
    [Infinity, '0.00'],
    [-100, '0.00'],
  ])('coerces invalid basePrice (%p) to "0.00" so Bokun rejects with 4xx', (bad, expected) => {
    const rates = mapPricingToBokunRates({
      basePrice: bad,
      currency: 'SEK',
      priceType: 'per_person',
    })
    expect(rates[0].pricingCategories[0].pricePerCategoryUnit).toBe(expected)
  })
})

describe('mapLogisticsToBokunMeetingPoint', () => {
  it('swaps GeoJSON [lng,lat] → Bokun {latitude, longitude}', () => {
    const mp = mapLogisticsToBokunMeetingPoint({
      meetingPointName: { en: 'Test' },
      coordinates: [18.0686, 59.3293],
    })
    expect(mp.latitude).toBe(59.3293)
    expect(mp.longitude).toBe(18.0686)
  })

  it('omits coordinates when null', () => {
    const mp = mapLogisticsToBokunMeetingPoint({
      meetingPointName: { en: 'Test' },
      coordinates: null,
    })
    expect(mp.latitude).toBeUndefined()
    expect(mp.longitude).toBeUndefined()
  })

  it('drops out-of-range WGS84 coordinates instead of forwarding bad data', () => {
    const mp = mapLogisticsToBokunMeetingPoint({
      meetingPointName: { en: 'Test' },
      coordinates: [200, 200], // both invalid
    })
    expect(mp.latitude).toBeUndefined()
    expect(mp.longitude).toBeUndefined()
  })

  it('omits address/instructions when not provided', () => {
    const mp = mapLogisticsToBokunMeetingPoint({
      meetingPointName: { en: 'Test' },
    })
    expect(mp.address).toBeUndefined()
    expect(mp.instructions).toBeUndefined()
  })
})

describe('mapDifficultyLevel', () => {
  it.each([
    ['easy', 'EASY'],
    ['moderate', 'MODERATE'],
    ['challenging', 'CHALLENGING'],
  ] as const)('maps %s → %s', (cms, bokun) => {
    expect(mapDifficultyLevel(cms)).toBe(bokun)
  })

  it('returns undefined for null/missing', () => {
    expect(mapDifficultyLevel(null)).toBeUndefined()
    expect(mapDifficultyLevel(undefined)).toBeUndefined()
  })
})

describe('mapDescriptionToBokun', () => {
  it('converts Lexical to sanitized HTML, one entry per locale', () => {
    const out = mapDescriptionToBokun({
      en: lexicalParagraph('Hello world'),
      sv: lexicalParagraph('Hej världen'),
    })
    expect(out).toHaveLength(2)
    const en = out.find((e) => e.locale === 'en')
    expect(en?.value).toContain('Hello world')
    expect(en?.value).toMatch(/<p>/)
  })

  it('preserves "&", "<", ">" in user content (no silent corruption)', () => {
    const out = mapDescriptionToBokun({
      en: lexicalParagraph('AT&T Tours <Best> in Town'),
    })
    expect(out[0]?.value).toContain('AT&amp;T Tours &lt;Best&gt; in Town')
  })

  it('escapes adversarial </p><script> payload so it cannot break out', () => {
    const out = mapDescriptionToBokun({
      en: lexicalParagraph('</p><script>alert(1)</script><p>'),
    })
    expect(out[0]?.value).not.toContain('<script')
    expect(out[0]?.value).toContain('&lt;script&gt;')
  })

  it('returns [] for null input', () => {
    expect(mapDescriptionToBokun(null)).toEqual([])
  })
})

describe('tourToBokunExperiencePayload (top-level)', () => {
  it('produces a complete payload from a fully-populated tour', () => {
    const tour = buildTourFixture()
    const payload = tourToBokunExperiencePayload(tour)

    expect(payload.title).toEqual([
      { locale: 'sv', value: 'Stadsvandring' },
      { locale: 'en', value: 'City Walk' },
      { locale: 'de', value: 'Stadtspaziergang' },
    ])
    expect(payload.summary).toHaveLength(3)
    expect(payload.description).toHaveLength(3)
    expect(payload.durationISO).toBe('PT2H')
    expect(payload.minParticipants).toBe(2)
    expect(payload.maxParticipants).toBe(15)
    expect(payload.rates[0].pricingCategories[0].pricePerCategoryUnit).toBe('199.00')
    expect(payload.meetingPoint.latitude).toBeCloseTo(59.3293)
    expect(payload.meetingPoint.longitude).toBeCloseTo(18.0686)
    expect(payload.activityLevel).toBe('EASY')
    expect(payload.wheelchairAccessible).toBe(true)
    expect(payload.highlights?.[0]?.value).toBe('Old Town • Royal Castle')
    expect(payload.inclusions?.[0]?.value).toBe('Guide • Map')
    expect(payload.exclusions?.[0]?.value).toBe('Food')
    expect(payload.bringList?.[0]?.value).toBe('Comfortable shoes')
  })

  it('omits optional arrays when CMS provides none', () => {
    const tour = buildTourFixture({
      highlights: null,
      included: null,
      notIncluded: null,
      whatToBring: null,
      difficultyLevel: null,
      accessibility: null,
    })
    const payload = tourToBokunExperiencePayload(tour)
    expect(payload.highlights).toBeUndefined()
    expect(payload.inclusions).toBeUndefined()
    expect(payload.exclusions).toBeUndefined()
    expect(payload.bringList).toBeUndefined()
    expect(payload.activityLevel).toBeUndefined()
    expect(payload.wheelchairAccessible).toBeUndefined()
  })

  it('falls back to defaults when group sizes missing', () => {
    const tour = buildTourFixture({ minGroupSize: null, maxGroupSize: null })
    const payload = tourToBokunExperiencePayload(tour)
    expect(payload.minParticipants).toBe(1)
    expect(payload.maxParticipants).toBe(12)
  })

  it('handles single-locale tour (only Bokun entries for present locales)', () => {
    const tour = buildTourFixture({
      title: { en: 'Only English' },
      description: { en: lexicalParagraph('Only English desc') },
      shortDescription: { en: 'Only short' },
    })
    const payload = tourToBokunExperiencePayload(tour)
    expect(payload.title).toEqual([{ locale: 'en', value: 'Only English' }])
    expect(payload.summary).toEqual([{ locale: 'en', value: 'Only short' }])
    expect(payload.description).toHaveLength(1)
  })

  it('per_group tour produces flat-rate pricing payload', () => {
    const tour = buildTourFixture({
      pricing: {
        basePrice: 2500,
        currency: 'SEK',
        priceType: 'per_group',
      },
    })
    const payload = tourToBokunExperiencePayload(tour)
    expect(payload.rates[0].pricePerBooking).toBe(true)
    expect(payload.rates[0].pricingCategories[0].flatPrice).toBe('2500.00')
  })
})
