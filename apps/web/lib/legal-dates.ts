/**
 * Effective dates for legal pages.
 *
 * Phase-04 (legal counsel review) sets each value to the actual review date
 * before launch. Until counsel sign-off, these reflect the latest content
 * audit (2026-04-25) — NOT the prior placeholder 2026-01-01.
 */

export const LEGAL_DATES = {
  privacy: '2026-04-25',
  terms: '2026-04-25',
  cancellation: '2026-04-25',
} as const

export type LegalPage = keyof typeof LEGAL_DATES
