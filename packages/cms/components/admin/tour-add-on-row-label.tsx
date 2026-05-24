'use client'

/**
 * Custom RowLabel for the Tours.optionalAddOns array field.
 *
 * Renders the row's `name` field (localized — shows current admin locale value)
 * as the collapsed-row label, with a fallback to "Add-on NN" when the row is
 * fresh and the name hasn't been entered yet.
 *
 * @see packages/cms/fields/tour-optional-add-ons-fields.ts
 */

import { useRowLabel } from '@payloadcms/ui'

interface AddOnRowData {
  name?: string
  bokunExtraId?: string
}

export function TourAddOnRowLabel() {
  const { data, rowNumber } = useRowLabel<AddOnRowData>()
  const index = String((rowNumber ?? 0) + 1).padStart(2, '0')

  // typeof guard: Payload may surface a localized field as an object
  // (`{ en, sv, de }`) in some locale-switch transitions; calling `.trim()`
  // on a non-string would crash the admin panel row label.
  if (typeof data?.name === 'string' && data.name.trim().length > 0) {
    const hasExtraId =
      typeof data.bokunExtraId === 'string' && data.bokunExtraId.trim().length > 0
    const suffix = hasExtraId ? '' : ' — not yet wired'
    return `${data.name}${suffix}`
  }

  return `Add-on ${index}`
}
