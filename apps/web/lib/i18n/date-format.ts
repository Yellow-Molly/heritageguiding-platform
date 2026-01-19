/**
 * Date formatting utilities for internationalization.
 */

const dateFormatOptions: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}

const shortDateFormatOptions: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
}

/**
 * Format a date according to the specified locale.
 * @param date - Date to format
 * @param locale - Locale string (e.g., 'en', 'sv', 'de')
 * @returns Formatted date string
 */
export function formatDate(date: Date, locale: string = 'en'): string {
  const localeMap: Record<string, string> = {
    en: 'en-US',
    sv: 'sv-SE',
    de: 'de-DE',
  }

  const fullLocale = localeMap[locale] || locale

  try {
    return new Intl.DateTimeFormat(fullLocale, dateFormatOptions).format(date)
  } catch {
    return date.toLocaleDateString()
  }
}

/**
 * Format a date in short format.
 * @param date - Date to format
 * @param locale - Locale string
 * @returns Short formatted date string
 */
export function formatShortDate(date: Date, locale: string = 'en'): string {
  const localeMap: Record<string, string> = {
    en: 'en-US',
    sv: 'sv-SE',
    de: 'de-DE',
  }

  const fullLocale = localeMap[locale] || locale

  try {
    return new Intl.DateTimeFormat(fullLocale, shortDateFormatOptions).format(date)
  } catch {
    return date.toLocaleDateString()
  }
}

/**
 * Format a relative time (e.g., "2 days ago").
 * @param date - Date to compare against now
 * @param locale - Locale string
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date, locale: string = 'en'): string {
  const localeMap: Record<string, string> = {
    en: 'en-US',
    sv: 'sv-SE',
    de: 'de-DE',
  }

  const fullLocale = localeMap[locale] || locale
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  try {
    const rtf = new Intl.RelativeTimeFormat(fullLocale, { numeric: 'auto' })

    if (diffInDays === 0) {
      return rtf.format(0, 'day') // "today"
    } else if (diffInDays < 7) {
      return rtf.format(-diffInDays, 'day')
    } else if (diffInDays < 30) {
      return rtf.format(-Math.floor(diffInDays / 7), 'week')
    } else if (diffInDays < 365) {
      return rtf.format(-Math.floor(diffInDays / 30), 'month')
    } else {
      return rtf.format(-Math.floor(diffInDays / 365), 'year')
    }
  } catch {
    return formatDate(date, locale)
  }
}
