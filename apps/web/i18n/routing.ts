import { defineRouting } from 'next-intl/routing'

export const locales = ['sv', 'en', 'de'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'sv'

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'always',
})

// Locale labels for language switcher
export const localeLabels: Record<Locale, string> = {
  sv: 'Svenska',
  en: 'English',
  de: 'Deutsch',
}

// Locale metadata for SEO
export const localeMetadata: Record<
  Locale,
  { hreflang: string; dir: 'ltr' | 'rtl'; displayName: string }
> = {
  sv: { hreflang: 'sv-SE', dir: 'ltr', displayName: 'Swedish' },
  en: { hreflang: 'en-US', dir: 'ltr', displayName: 'English' },
  de: { hreflang: 'de-DE', dir: 'ltr', displayName: 'German' },
}
