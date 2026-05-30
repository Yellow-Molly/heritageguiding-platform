/**
 * Pure transform: CMS Tour.optionalAddOns (depth=2, locale='all') → BokunExtraInput[].
 *
 * v1 maps CMS row → ExtraDto text fields only. Pricing + Required toggle are NOT
 * pushed — Bokun REST v2.0 does not expose those writes (Phase 01 4-variant probe
 * + OpenAPI audit). They remain dashboard-managed.
 *
 * Sorting: ascending `displayOrder`, stable for ties.
 * Filtering: rows with empty name in EVERY locale are dropped (would 400 against
 * Bokun's ExtraDto, which requires `title`).
 *
 * @see plans/260525-1417-bokun-extras-push-sync/phase-03-cms-addons-to-bokun-extras-mapper.md
 */

import type { BokunExperienceLocalizedString, BokunExtraInput } from './bokun-types'

type CmsLocale = 'sv' | 'en' | 'de'
const CMS_LOCALES: readonly CmsLocale[] = ['sv', 'en', 'de'] as const
type LocalizedString = Partial<Record<CmsLocale, string | null | undefined>>

/**
 * Subset of an `optionalAddOns[]` row that the mapper consumes.
 * Fields intentionally NOT in this interface — kept in CMS for tour-page UI but
 * not pushed to Bokun: `pricingType`, `adultPriceHint`, `childPriceHint`,
 * `currency`, `isRequired`.
 */
export interface AddOnSource {
  /** Payload-assigned array row id; used as Bokun `externalId` for correlation. */
  id?: string | number | null
  name: LocalizedString
  description?: LocalizedString | null
  /** Bokun-assigned numeric id (as string in CMS). Empty/missing → CREATE path. */
  bokunExtraId?: string | null
  displayOrder?: number | null
}

/**
 * Convert CMS-style localized record into Bokun's localized array.
 * Empty / whitespace-only values are skipped; stable sv → en → de order.
 */
function toLocalizedArray(
  value: LocalizedString | null | undefined
): BokunExperienceLocalizedString[] {
  if (!value) return []
  const out: BokunExperienceLocalizedString[] = []
  for (const locale of CMS_LOCALES) {
    const raw = value[locale]
    // Trim before pushing — Bokun stores the value verbatim, so leading/trailing
    // whitespace from CMS input would otherwise reach the extra title/description.
    if (raw && raw.trim()) out.push({ locale, value: raw.trim() })
  }
  return out
}

/** Stable sort by displayOrder asc; ties preserve original CMS array order. */
function sortByDisplayOrder(rows: AddOnSource[]): AddOnSource[] {
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      const aOrder = a.row.displayOrder ?? 0
      const bOrder = b.row.displayOrder ?? 0
      if (aOrder !== bOrder) return aOrder - bOrder
      return a.index - b.index
    })
    .map(({ row }) => row)
}

/**
 * Pure transform from CMS optional add-ons to BokunExtraInput[].
 * Returns empty array if input is empty/missing — caller decides whether to
 * include the (empty) array in the Bokun payload (omitting = preserve Bokun state).
 */
export function mapAddOnsToBokunExtras(
  addOns: AddOnSource[] | null | undefined
): BokunExtraInput[] {
  if (!addOns || addOns.length === 0) return []
  const out: BokunExtraInput[] = []

  for (const row of sortByDisplayOrder(addOns)) {
    const title = toLocalizedArray(row.name)
    if (title.length === 0) {
      console.warn(
        `[mapAddOnsToBokunExtras] dropping add-on with empty name (id=${row.id ?? 'unknown'})`
      )
      continue
    }
    const externalId = row.id != null ? String(row.id).trim() : ''
    if (!externalId) {
      console.warn(
        '[mapAddOnsToBokunExtras] dropping add-on with missing row id (CMS row predates Payload array-id assignment)'
      )
      continue
    }

    const extra: BokunExtraInput = { externalId, title }

    const description = toLocalizedArray(row.description ?? undefined)
    if (description.length > 0) extra.description = description

    const trimmedExtraId = row.bokunExtraId?.trim() || ''
    if (trimmedExtraId) extra.existingBokunExtraId = trimmedExtraId

    out.push(extra)
  }
  return out
}
