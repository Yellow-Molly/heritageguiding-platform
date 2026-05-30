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
  serializeBokunExtras,
} from '../serialize-bokun-wire-payload'
import type { BokunExperienceCreatePayload, BokunExtraInput } from '../bokun-types'

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
    // Exception: `extras` IS an array (Bokun's ExtraDto wire shape — Phase 01).
    const out = serializeBokunExperiencePayload(buildPayload())
    for (const [key, value] of Object.entries(out)) {
      if (key === 'extras') continue
      expect(Array.isArray(value)).toBe(false)
    }
  })

  it('does not include extras key when payload.extras is empty / missing', () => {
    const out = serializeBokunExperiencePayload(buildPayload())
    expect(out).not.toHaveProperty('extras')
  })

  it('emits extras:[] on the wire when payload.extras is an explicit empty array (delete signal)', () => {
    // Mirror of the sync-job behavior: baselined + push enabled + CMS has zero
    // add-on rows → mapper omits extras; sync-job sets `payload.extras = []`
    // to ask Bokun to wipe its side (full-replacement semantics).
    const out = serializeBokunExperiencePayload(buildPayload({ extras: [] }))
    expect(out.extras).toEqual([])
  })

  it('serializes extras into top-level extras array when provided', () => {
    const out = serializeBokunExperiencePayload(
      buildPayload({
        extras: [
          {
            externalId: 'cms-row-1',
            title: [{ locale: 'en', value: 'Museum Ticket' }],
            maxPerBooking: 5,
          },
        ],
      })
    )
    expect(out.extras).toHaveLength(1)
    expect(out.extras?.[0]).toMatchObject({
      externalId: 'cms-row-1',
      title: 'Museum Ticket',
      type: 'OTHERS',
      maxPerBooking: 5,
      limitByPax: false,
    })
  })
})

describe('serializeBokunExtras', () => {
  const baseExtra = (overrides: Partial<BokunExtraInput> = {}): BokunExtraInput => ({
    externalId: 'cms-row-default',
    title: [{ locale: 'en', value: 'Default Extra' }],
    maxPerBooking: 5,
    ...overrides,
  })

  it('returns undefined for missing input (caller omits the key — preserve Bokun)', () => {
    expect(serializeBokunExtras(undefined)).toBeUndefined()
  })

  it('returns [] for empty-array input (caller emits extras:[] — delete all in Bokun)', () => {
    // Phase 01: PUT { extras: [] } deletes every Bokun-side extra
    // (probe-empty verified destructive). The empty-list path is reachable
    // only when the per-tour `bokunExtrasBaselineAt` gate is active, so a
    // non-baselined tour can never trigger an accidental wipe.
    expect(serializeBokunExtras([])).toEqual([])
  })

  it('emits a single extra without id for the CREATE path', () => {
    const out = serializeBokunExtras([baseExtra({ externalId: 'cms-1' })])
    expect(out).toEqual([
      {
        externalId: 'cms-1',
        title: 'Default Extra',
        type: 'OTHERS',
        maxPerBooking: 5,
        limitByPax: false,
      },
    ])
    expect(out?.[0]).not.toHaveProperty('id')
  })

  it('emits id (numeric) when existingBokunExtraId is set — UPDATE path', () => {
    const out = serializeBokunExtras([baseExtra({ existingBokunExtraId: '276080' })])
    expect(out?.[0].id).toBe(276080)
  })

  it('coerces empty / whitespace existingBokunExtraId to undefined (CREATE)', () => {
    expect(serializeBokunExtras([baseExtra({ existingBokunExtraId: '' })])?.[0]).not.toHaveProperty(
      'id'
    )
    expect(
      serializeBokunExtras([baseExtra({ existingBokunExtraId: '   ' })])?.[0]
    ).not.toHaveProperty('id')
  })

  it('drops rows whose title is empty across all locales (no half-configured pushes)', () => {
    const out = serializeBokunExtras([
      baseExtra({ externalId: 'keep', title: [{ locale: 'en', value: 'Real' }] }),
      baseExtra({ externalId: 'skip', title: [] }),
      baseExtra({ externalId: 'skip-blank', title: [{ locale: 'en', value: '   ' }] }),
    ])
    expect(out).toHaveLength(1)
    expect(out?.[0].externalId).toBe('keep')
  })

  it('falls back to a default maxPerBooking when CMS does not supply one', () => {
    const out = serializeBokunExtras([baseExtra({ maxPerBooking: undefined })])
    expect(out?.[0].maxPerBooking).toBe(99) // DEFAULT_MAX_PER_BOOKING
  })

  it('honors BOKUN_SYNC_LOCALE for title/description picking', () => {
    vi.stubEnv('BOKUN_SYNC_LOCALE', 'sv')
    const out = serializeBokunExtras([
      baseExtra({
        title: [
          { locale: 'en', value: 'English Title' },
          { locale: 'sv', value: 'Svensk Titel' },
        ],
        description: [
          { locale: 'en', value: 'English desc' },
          { locale: 'sv', value: 'Svensk beskrivning' },
        ],
      }),
    ])
    expect(out?.[0].title).toBe('Svensk Titel')
    expect(out?.[0].description).toBe('Svensk beskrivning')
  })

  it('omits description when empty in every locale', () => {
    const out = serializeBokunExtras([baseExtra({ description: undefined })])
    expect(out?.[0]).not.toHaveProperty('description')
  })

  it('preserves input order across multiple extras', () => {
    const out = serializeBokunExtras([
      baseExtra({ externalId: 'a', title: [{ locale: 'en', value: 'A' }] }),
      baseExtra({ externalId: 'b', title: [{ locale: 'en', value: 'B' }] }),
      baseExtra({ externalId: 'c', title: [{ locale: 'en', value: 'C' }] }),
    ])
    expect(out?.map((e) => e.externalId)).toEqual(['a', 'b', 'c'])
  })

  it('Phase 01 regression: NEVER includes `required`, `included`, `price`, or `currency` — Bokun ExtraDto rejects these', () => {
    const out = serializeBokunExtras([baseExtra()])
    const dto = out?.[0] ?? {}
    expect(dto).not.toHaveProperty('required')
    expect(dto).not.toHaveProperty('included')
    expect(dto).not.toHaveProperty('price')
    expect(dto).not.toHaveProperty('currency')
    expect(dto).not.toHaveProperty('amount')
  })
})
