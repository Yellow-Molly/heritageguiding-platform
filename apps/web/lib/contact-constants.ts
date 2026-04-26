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
