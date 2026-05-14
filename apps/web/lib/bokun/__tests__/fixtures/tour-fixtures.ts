/**
 * Fixture builders for tour-to-bokun-experience-mapper tests.
 * Produces minimal, realistic Tour shapes (depth=2, locale='all') with override hooks.
 */
import type { TourSource } from '../../tour-to-bokun-experience-mapper'

/** Build a minimal valid Lexical paragraph node for a given text. */
export function lexicalParagraph(text: string) {
  return {
    root: {
      type: 'root',
      version: 1,
      direction: 'ltr',
      format: '',
      indent: 0,
      children: [
        {
          type: 'paragraph',
          version: 1,
          children: [{ type: 'text', text, version: 1 }],
        },
      ],
    },
  }
}

/**
 * Shallow merge: top-level keys in `override` replace `base` entirely.
 * Tests must supply full nested objects (pricing, logistics, etc.) when overriding —
 * this avoids ambiguity for localized records where partial merge would leak base locales.
 */
function mergeOverrides<T extends object>(base: T, override?: Partial<T>): T {
  if (!override) return base
  return { ...base, ...override } as T
}

/**
 * Build a fully-populated Tour fixture with all 3 locales.
 * Use overrides to test specific branches without re-declaring the whole shape.
 */
export function buildTourFixture(overrides?: Partial<TourSource>): TourSource {
  const base: TourSource = {
    title: { sv: 'Stadsvandring', en: 'City Walk', de: 'Stadtspaziergang' },
    description: {
      sv: lexicalParagraph('Svensk beskrivning'),
      en: lexicalParagraph('English description'),
      de: lexicalParagraph('Deutsche Beschreibung'),
    },
    shortDescription: {
      sv: 'Kort sammanfattning',
      en: 'Short summary',
      de: 'Kurze Zusammenfassung',
    },
    highlights: {
      en: [{ highlight: 'Old Town' }, { highlight: 'Royal Castle' }],
    },
    pricing: {
      basePrice: 199,
      currency: 'SEK',
      priceType: 'per_person',
      childPrice: null,
    },
    duration: { hours: 2 },
    logistics: {
      meetingPointName: { en: 'Central Station', sv: 'Centralstationen' },
      meetingPointAddress: { en: 'Vasagatan 1' },
      meetingPointInstructions: { en: 'Look for the blue umbrella' },
      coordinates: [18.0686, 59.3293], // [lng, lat] for Stockholm
    },
    included: { en: [{ item: 'Guide' }, { item: 'Map' }] },
    notIncluded: { en: [{ item: 'Food' }] },
    whatToBring: { en: [{ item: 'Comfortable shoes' }] },
    difficultyLevel: 'easy',
    accessibility: { wheelchairAccessible: true },
    minGroupSize: 2,
    maxGroupSize: 15,
  }
  return mergeOverrides(base, overrides)
}
