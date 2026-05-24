import type { Field } from 'payload'

/**
 * Tour "Optional Add-ons" field — informational mirror of Bokun Extras
 * configured on the corresponding Bokun product.
 *
 * Bokun (dashboard config) is the source of truth for prices + checkout
 * availability; CMS only describes what to render on the tour page before
 * the customer reaches checkout. No CMS→Bokun push sync in v1 — operator
 * mirrors manually (same pattern as rates today).
 *
 * Lifecycle:
 *   1. Operator configures an Extra in Bokun → copies the numeric Extra ID
 *   2. Operator adds a row here and pastes `bokunExtraId`
 *   3. Tour page renders this row in the "Optional Add-ons" section
 *   4. Customer checks out via embedded Bokun widget — pays for the extra inline
 *   5. Webhook delivers purchased extras into `bookings.addOns` (mapper persists)
 *
 * Rows missing `bokunExtraId` are filtered out by the tour-page loader so
 * the public never sees half-configured items.
 *
 * @see plans/260519-2046-bokun-extras-add-ons-checkout/
 */
export const tourOptionalAddOnsField: Field = {
  name: 'optionalAddOns',
  type: 'array',
  label: 'Add-ons (Paid at Checkout)',
  // Override Payload's auto-generated per-row labels + "Add" button text
  // (would otherwise derive "Optional Add On" from the camelCase field name).
  labels: {
    singular: 'Add-on',
    plural: 'Add-ons',
  },
  maxRows: 10,
  admin: {
    description:
      'Paid extras configured in Bokun (e.g. museum tickets, meals). Each row can be marked Required or Optional individually. Must mirror what is configured in Bokun dashboard — CMS is informational only. Rows without `bokunExtraId` are hidden from the public.',
    components: {
      RowLabel: '@cms/components/admin/tour-add-on-row-label#TourAddOnRowLabel',
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
      maxLength: 100,
      admin: {
        description: 'Customer-facing add-on title (e.g. "Vasa Museum admission ticket"). Localize per language.',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      maxLength: 300,
      admin: {
        description: 'Optional one-line explanation rendered below the title.',
      },
    },
    {
      name: 'pricingType',
      type: 'select',
      required: true,
      defaultValue: 'perBooking',
      options: [
        { label: 'Per booking (flat)', value: 'perBooking' },
        { label: 'Per person', value: 'perPerson' },
      ],
      admin: {
        description:
          'Drives price-hint copy on tour page. Choose Per booking unless the tour has Adult/Child pricing categories configured on the Bokun side.',
      },
    },
    {
      name: 'adultPriceHint',
      type: 'number',
      required: true,
      min: 1,
      admin: {
        description:
          'Indicative price (must match Bokun-side price). Customers see final price at checkout — this is for the tour page hint only. Must be ≥1; for free items, omit the row entirely.',
      },
    },
    {
      name: 'childPriceHint',
      type: 'number',
      min: 0,
      admin: {
        description: 'Optional child-tier price hint (only used when pricing categories include Child).',
      },
    },
    {
      name: 'currency',
      type: 'select',
      defaultValue: 'SEK',
      options: [
        { label: 'SEK', value: 'SEK' },
        { label: 'EUR', value: 'EUR' },
        { label: 'USD', value: 'USD' },
      ],
    },
    {
      name: 'isRequired',
      type: 'checkbox',
      defaultValue: false,
      label: 'Required at checkout',
      admin: {
        description: 'Renders an amber "Required" pill on the tour page. Bokun-side Required toggle is set separately.',
      },
    },
    {
      name: 'bokunExtraId',
      type: 'text',
      maxLength: 50,
      admin: {
        description:
          'Paste from Bokun dashboard after configuring the matching Extra (URL pattern: /extras/<ID>/edit). Empty = not yet wired — row hidden from public tour page until set.',
      },
    },
    {
      name: 'displayOrder',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Lower numbers display first. Default 0; raise to push down.',
      },
    },
  ],
}
