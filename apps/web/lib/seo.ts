import { locales, localeMetadata, type Locale } from '@/i18n'
import type { Metadata } from 'next'

/**
 * Generate hreflang alternate links for SEO
 * @param pathname - The current pathname without locale prefix (e.g., '/tours' not '/sv/tours')
 * @param currentLocale - The current locale
 * @returns Metadata alternates object
 * @example
 * export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
 *   return {
 *     ...otherMetadata,
 *     alternates: generateHreflangAlternates('/tours', params.locale as Locale),
 *   }
 * }
 */
export function generateHreflangAlternates(
  pathname: string,
  currentLocale: Locale,
): Metadata['alternates'] {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://privatetours.se'

  // Ensure pathname starts with /
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`

  // Generate language alternates for each locale
  const languages: Record<string, string> = {}

  locales.forEach((locale) => {
    const hreflang = localeMetadata[locale].hreflang
    languages[hreflang] = `${baseUrl}/${locale}${normalizedPath}`
  })

  // Add x-default pointing to default locale (Swedish)
  languages['x-default'] = `${baseUrl}/sv${normalizedPath}`

  return {
    canonical: `${baseUrl}/${currentLocale}${normalizedPath}`,
    languages,
  }
}

/**
 * Generate Open Graph locale tags
 * @param locale - The current locale
 * @returns Array of alternate locale codes for OpenGraph
 */
export function generateOgLocaleAlternates(locale: Locale): string[] {
  return locales
    .filter((l) => l !== locale)
    .map((l) => localeMetadata[l].hreflang.replace('-', '_'))
}

/**
 * Generate structured data (JSON-LD) with multilingual support
 * @param data - Base structured data object
 * @param locale - The current locale
 * @returns JSON-LD script content
 */
export function generateStructuredData(
  data: Record<string, unknown>,
  locale: Locale,
): string {
  const structuredData = {
    '@context': 'https://schema.org',
    inLanguage: localeMetadata[locale].hreflang,
    ...data,
  }

  return JSON.stringify(structuredData)
}

/**
 * Get locale-specific robots directives
 * @param locale - The current locale
 * @param options - Additional robots options
 * @returns Metadata robots object
 */
export function generateRobotsDirectives(
  locale: Locale,
  options?: {
    index?: boolean
    follow?: boolean
    noarchive?: boolean
    nositelinkssearchbox?: boolean
    notranslate?: boolean
  },
): Metadata['robots'] {
  return {
    index: options?.index ?? true,
    follow: options?.follow ?? true,
    noarchive: options?.noarchive ?? false,
    nositelinkssearchbox: options?.nositelinkssearchbox ?? false,
    notranslate: options?.notranslate ?? false,
  }
}

/**
 * Generate complete SEO metadata for a page with i18n support
 * @param options - SEO options
 * @returns Complete Metadata object
 */
export function generatePageMetadata(options: {
  title: string
  description: string
  locale: Locale
  pathname: string
  keywords?: string[]
  ogImage?: string
  noIndex?: boolean
}): Metadata {
  const { title, description, locale, pathname, keywords, ogImage, noIndex } = options
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://privatetours.se'

  return {
    title,
    description,
    keywords: keywords?.join(', '),
    alternates: generateHreflangAlternates(pathname, locale),
    robots: generateRobotsDirectives(locale, { index: !noIndex }),
    openGraph: {
      title,
      description,
      url: `${baseUrl}/${locale}${pathname}`,
      siteName: 'Private Tours',
      locale: localeMetadata[locale].hreflang.replace('-', '_'),
      alternateLocale: generateOgLocaleAlternates(locale),
      type: 'website',
      ...(ogImage && {
        images: [
          {
            url: ogImage,
            alt: title,
          },
        ],
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(ogImage && {
        images: [ogImage],
      }),
    },
  }
}
