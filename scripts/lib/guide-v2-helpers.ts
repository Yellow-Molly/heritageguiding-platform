/**
 * Helpers for Phase 4 of 260414-2310-guides-data-v2-update.
 *
 * Extracted to keep scripts/import-guide-data.ts manageable.
 * Used ONLY when the --input=<path> JSON matches the v2 shape.
 */

/** v2 input shape — matches data/translated-guides-v2.json */
export interface V2LocaleBlock {
  bio: string
  specializations: string[]
  guideStyle: string
  whatGuestsAppreciate: string
  uniqueAspectsQuote: string
  uniqueAspectsBody: string
}

export interface TranslatedGuideV2 {
  slug: string
  name: string
  sv: V2LocaleBlock
  en: V2LocaleBlock
  de: V2LocaleBlock
  passThroughLanguages: string[]
  passThroughAdditionalLanguages: string[]
  /**
   * v3 extension: raw city/area names extracted from docx header, mapped to
   * Payload city slugs via AREA_TO_CITY. Falls back to ['stockholm'] if empty
   * or unmapped. Existing v2 inputs without this field default to Stockholm.
   */
  operatingAreasRaw?: string[]
  /**
   * v3 extension: per-locale extra credential strings appended to the FSAG
   * default for new guides. Used to surface non-enum capabilities (e.g.
   * Meänkieli) that don't fit Payload's additionalLanguages select.
   */
  extraCredentialsByLocale?: Record<V2Locale, string[]>
}

export type V2Locale = 'sv' | 'en' | 'de'

/** Section heading text per locale — rendered as H3 in the composed bio markdown. */
export const V2_HEADINGS: Record<V2Locale, { spec: string; style: string; appreciate: string; unique: string }> = {
  sv: { spec: 'Specialisering', style: 'Guidestil', appreciate: 'Vad gästerna uppskattar', unique: 'Det som gör turer unika' },
  en: { spec: 'Specializations', style: 'Guide Style', appreciate: 'What Guests Appreciate', unique: 'What Makes Tours Unique' },
  de: { spec: 'Spezialisierungen', style: 'Führungsstil', appreciate: 'Was Gäste schätzen', unique: 'Was die Touren einzigartig macht' },
}

/** Default FSAG credential string, per locale — applied only to NEW v2 guides. */
export const NEW_GUIDE_CREDENTIALS: Record<V2Locale, string> = {
  sv: 'Auktoriserad Stockholmsguide (FSAG)',
  en: 'Authorized Stockholm Guide (FSAG)',
  de: 'Autorisierter Stockholm-Guide (FSAG)',
}

/**
 * Compose structured markdown bio: base bio + 4 H3 sections + blockquote pull quote.
 * Fed into markdownToLexical() for Payload richText storage.
 */
export function buildV2BioMarkdown(locale: V2Locale, data: V2LocaleBlock): string {
  const h = V2_HEADINGS[locale]
  return [
    data.bio.trim(),
    '',
    `### ${h.spec}`,
    ...data.specializations.map((s) => `- ${s}`),
    '',
    `### ${h.style}`,
    data.guideStyle.trim(),
    '',
    `### ${h.appreciate}`,
    data.whatGuestsAppreciate.trim(),
    '',
    `### ${h.unique}`,
    `> ${data.uniqueAspectsQuote.trim()}`,
    '',
    data.uniqueAspectsBody.trim(),
  ].join('\n')
}

/** Extract structured fields for CMS storage (no merging into bio). */
export function buildV2FieldData(data: V2LocaleBlock) {
  return {
    guideStyle: data.guideStyle.trim(),
    whatGuestsAppreciate: data.whatGuestsAppreciate.trim(),
    uniqueAspectsQuote: data.uniqueAspectsQuote.trim(),
    uniqueAspectsBody: data.uniqueAspectsBody.trim(),
    specialtyDescriptions: data.specializations.map((s) => ({ description: s })),
  }
}

/** Probe shape to decide v1 vs v2 code path. v2 entries have sv.guideStyle. */
export function isV2Shape(entry: unknown): entry is TranslatedGuideV2 {
  if (!entry || typeof entry !== 'object') return false
  const obj = entry as Record<string, unknown>
  if (!obj.sv || typeof obj.sv !== 'object') return false
  return 'guideStyle' in (obj.sv as Record<string, unknown>)
}

/** Normalize a relationship array (ID | {id} | object) → array of raw IDs. */
export function extractIds(rel: unknown): (string | number)[] {
  if (!Array.isArray(rel)) return []
  return rel
    .map((item): string | number | null => {
      if (typeof item === 'string' || typeof item === 'number') return item
      if (item && typeof item === 'object' && 'id' in item) {
        const id = (item as { id: unknown }).id
        if (typeof id === 'string' || typeof id === 'number') return id
      }
      return null
    })
    .filter((v): v is string | number => v !== null)
}
