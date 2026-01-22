import { getRequestConfig } from 'next-intl/server'
import { routing, locales, type Locale } from './i18n/routing'

// Re-export for convenience
export { locales, defaultLocale, localeLabels, localeMetadata, type Locale } from './i18n/routing'

export default getRequestConfig(async ({ requestLocale }) => {
  // This will be inferred from the URL by next-intl
  let locale = await requestLocale

  // Validate that the incoming locale is valid
  if (!locale || !routing.locales.includes(locale as Locale)) {
    locale = routing.defaultLocale
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
