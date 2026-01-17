import { format as dateFnsFormat } from 'date-fns'
import { sv, enUS, de } from 'date-fns/locale'
import type { Locale } from '@/i18n'

// Map our locale codes to date-fns locales
const dateLocales = {
  sv,
  en: enUS,
  de,
} as const

/**
 * Format a date according to the user's locale
 * @param date - The date to format
 * @param locale - The locale code (sv, en, de)
 * @param formatString - date-fns format string (default: 'PPP')
 * @returns Formatted date string
 * @example formatDate(new Date(), 'sv') => "13 januari 2026"
 */
export function formatDate(
  date: Date | string | number,
  locale: Locale,
  formatString: string = 'PPP',
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  return dateFnsFormat(dateObj, formatString, { locale: dateLocales[locale] })
}

/**
 * Format a date and time according to the user's locale
 * @param date - The date to format
 * @param locale - The locale code (sv, en, de)
 * @param formatString - date-fns format string (default: 'PPPp')
 * @returns Formatted date and time string
 * @example formatDateTime(new Date(), 'sv') => "13 januari 2026 kl. 14:30"
 */
export function formatDateTime(
  date: Date | string | number,
  locale: Locale,
  formatString: string = 'PPPp',
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  return dateFnsFormat(dateObj, formatString, { locale: dateLocales[locale] })
}

/**
 * Format a time according to the user's locale
 * @param date - The date to format
 * @param locale - The locale code (sv, en, de)
 * @param formatString - date-fns format string (default: 'p')
 * @returns Formatted time string
 * @example formatTime(new Date(), 'sv') => "14:30"
 */
export function formatTime(
  date: Date | string | number,
  locale: Locale,
  formatString: string = 'p',
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  return dateFnsFormat(dateObj, formatString, { locale: dateLocales[locale] })
}

/**
 * Format a price/currency according to the user's locale
 * @param amount - The amount to format
 * @param locale - The locale code (sv, en, de)
 * @param currency - The currency code (default: 'SEK')
 * @returns Formatted currency string
 * @example formatCurrency(1500, 'sv', 'SEK') => "1 500 kr"
 */
export function formatCurrency(
  amount: number,
  locale: Locale,
  currency: string = 'SEK',
): string {
  const localeMap: Record<Locale, string> = {
    sv: 'sv-SE',
    en: 'en-US',
    de: 'de-DE',
  }

  return new Intl.NumberFormat(localeMap[locale], {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format a number according to the user's locale
 * @param value - The number to format
 * @param locale - The locale code (sv, en, de)
 * @param options - Intl.NumberFormat options
 * @returns Formatted number string
 * @example formatNumber(1500.5, 'sv') => "1 500,5"
 */
export function formatNumber(
  value: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions,
): string {
  const localeMap: Record<Locale, string> = {
    sv: 'sv-SE',
    en: 'en-US',
    de: 'de-DE',
  }

  return new Intl.NumberFormat(localeMap[locale], options).format(value)
}

/**
 * Format a relative time (e.g., "2 hours ago", "in 3 days")
 * @param date - The date to format
 * @param locale - The locale code (sv, en, de)
 * @param baseDate - The base date to compare against (default: now)
 * @returns Formatted relative time string
 * @example formatRelativeTime(new Date(Date.now() - 3600000), 'en') => "1 hour ago"
 */
export function formatRelativeTime(
  date: Date | string | number,
  locale: Locale,
  baseDate: Date = new Date(),
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date
  const diffInSeconds = Math.floor((baseDate.getTime() - dateObj.getTime()) / 1000)

  const localeMap: Record<Locale, string> = {
    sv: 'sv-SE',
    en: 'en-US',
    de: 'de-DE',
  }

  const rtf = new Intl.RelativeTimeFormat(localeMap[locale], { numeric: 'auto' })

  const intervals: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
    { unit: 'year', seconds: 31536000 },
    { unit: 'month', seconds: 2592000 },
    { unit: 'week', seconds: 604800 },
    { unit: 'day', seconds: 86400 },
    { unit: 'hour', seconds: 3600 },
    { unit: 'minute', seconds: 60 },
    { unit: 'second', seconds: 1 },
  ]

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds)
    if (Math.abs(count) >= 1) {
      return rtf.format(-count, interval.unit)
    }
  }

  return rtf.format(0, 'second')
}

/**
 * Format a duration in minutes to hours and minutes
 * @param minutes - Duration in minutes
 * @param locale - The locale code (sv, en, de)
 * @returns Formatted duration string
 * @example formatDuration(90, 'en') => "1 hour 30 minutes"
 */
export function formatDuration(minutes: number, locale: Locale): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  const translations = {
    sv: {
      hour: 'timme',
      hours: 'timmar',
      minute: 'minut',
      minutes: 'minuter',
    },
    en: {
      hour: 'hour',
      hours: 'hours',
      minute: 'minute',
      minutes: 'minutes',
    },
    de: {
      hour: 'Stunde',
      hours: 'Stunden',
      minute: 'Minute',
      minutes: 'Minuten',
    },
  }

  const t = translations[locale]
  const parts: string[] = []

  if (hours > 0) {
    parts.push(`${hours} ${hours === 1 ? t.hour : t.hours}`)
  }

  if (mins > 0) {
    parts.push(`${mins} ${mins === 1 ? t.minute : t.minutes}`)
  }

  return parts.join(' ')
}
