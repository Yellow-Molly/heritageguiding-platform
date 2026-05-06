/**
 * Canonical business contact data — single source of truth.
 *
 * Address decided in plan validation (2026-04-25): Karlavägen 18, 114 31 Stockholm.
 * Other values default here and may be overridden by NEXT_PUBLIC_* env vars
 * once business owner sign-off (phase-03) lands.
 */

export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? 'info@privatetours.se'

export const CONTACT_PHONE =
  process.env.NEXT_PUBLIC_CONTACT_PHONE ?? '+46 70 123 45 67'

/** Phone in tel:-link format — keep digits and leading +, drop everything else. */
export const CONTACT_PHONE_TEL = CONTACT_PHONE.replace(/[^\d+]/g, '')

export const CONTACT_ADDRESS = {
  streetAddress: 'Karlavägen 18',
  postalCode: '114 31',
  addressLocality: 'Stockholm',
  addressCountry: 'SE',
} as const

/** Single-line address for footer / cards. */
export const CONTACT_ADDRESS_LINE = `${CONTACT_ADDRESS.streetAddress}, ${CONTACT_ADDRESS.postalCode} ${CONTACT_ADDRESS.addressLocality}`

export const CONTACT_HOURS = {
  sv: 'Mån–Fre 08:00–18:00 CET',
  en: 'Mon–Fri 08:00–18:00 CET',
  de: 'Mo–Fr 08:00–18:00 CET',
} as const

/**
 * Legal entity identifiers — single source of truth for the registered
 * business identity (rendered in T&C §01 CompanyInfoCard, schema.org
 * Organization, invoices). The §01 narrative paragraph in
 * messages/{en,sv,de}.json deliberately omits the VAT number and points
 * readers to this card so there is exactly one place to update.
 *
 * `vat`: NEXT_PUBLIC_LEGAL_VAT is inlined at build time by Next.js — setting
 * it on Vercel requires a redeploy to propagate. Until set, the literal
 * "<VAT-TBD>" renders in the CompanyInfoCard so reviewers can spot the gap.
 */
export const LEGAL_ENTITY = {
  legalName: 'Yellow Molly Aktiebolag',
  orgNr: '559577-5080',
  vat: process.env.NEXT_PUBLIC_LEGAL_VAT ?? '<VAT-TBD>',
  tradingName: 'Private Tours',
  competentCourt: 'Stockholms tingsrätt',
} as const

export const SOCIAL_URLS = {
  instagram:
    process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? 'https://instagram.com/privatetours',
  facebook:
    process.env.NEXT_PUBLIC_FACEBOOK_URL ?? 'https://facebook.com/privatetours',
  linkedin:
    process.env.NEXT_PUBLIC_LINKEDIN_URL ??
    'https://linkedin.com/company/privatetours',
  youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL ?? 'https://youtube.com',
} as const
