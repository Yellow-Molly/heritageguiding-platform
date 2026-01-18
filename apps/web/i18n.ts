import { getRequestConfig } from 'next-intl/server'
import { notFound } from 'next/navigation'

// Supported locales
export const locales = ['sv', 'en', 'de'] as const
export type Locale = (typeof locales)[number]

// Default locale
export const defaultLocale: Locale = 'sv'

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

export default getRequestConfig(async ({ requestLocale }) => {
  // This will usually be inferred from the URL
  const locale = await requestLocale

  // Ensure locale is valid
  if (!locale || !locales.includes(locale as Locale)) {
    notFound()
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
