'use client'

import { useState, useCallback, useMemo } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { DayPicker, type DateRange } from 'react-day-picker'
import { format, parse, isValid, startOfDay } from 'date-fns'
import { enUS, sv, de } from 'date-fns/locale'
import { CalendarDays, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

// Locale mapping for date-fns
const localeMap = {
  en: enUS,
  sv: sv,
  de: de,
} as const

const DATE_FORMAT = 'yyyy-MM-dd' // ISO format for URL
const DISPLAY_FORMAT = 'MMM d' // Display format

/**
 * Parse date string from URL parameter.
 */
function parseDate(str: string | null): Date | undefined {
  if (!str) return undefined
  const date = parse(str, DATE_FORMAT, new Date())
  return isValid(date) ? date : undefined
}

/**
 * Date range picker for tour availability filtering.
 * Uses react-day-picker with Radix Popover for accessible dropdown.
 * Updates URL with startDate and endDate params.
 */
export function DatesPicker() {
  const t = useTranslations('tours.filters')
  const locale = useLocale() as keyof typeof localeMap
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  // Parse dates from URL
  const startDate = useMemo(
    () => parseDate(searchParams.get('startDate')),
    [searchParams]
  )
  const endDate = useMemo(
    () => parseDate(searchParams.get('endDate')),
    [searchParams]
  )

  const selectedRange: DateRange | undefined = useMemo(
    () => (startDate || endDate ? { from: startDate, to: endDate } : undefined),
    [startDate, endDate]
  )

  const dateLocale = localeMap[locale] || enUS
  const today = useMemo(() => startOfDay(new Date()), [])

  // Update URL with new date range
  const handleSelect = useCallback(
    (range: DateRange | undefined) => {
      const params = new URLSearchParams(searchParams.toString())

      if (range?.from) {
        params.set('startDate', format(range.from, DATE_FORMAT))
      } else {
        params.delete('startDate')
      }

      if (range?.to) {
        params.set('endDate', format(range.to, DATE_FORMAT))
      } else {
        params.delete('endDate')
      }

      params.delete('page') // Reset pagination
      router.push(`${pathname}?${params.toString()}`)
    },
    [searchParams, pathname, router]
  )

  // Clear date selection
  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      handleSelect(undefined)
      setIsOpen(false)
    },
    [handleSelect]
  )

  // Format display text
  const displayText = useMemo(() => {
    if (!startDate && !endDate) {
      return t('selectDates')
    }

    if (startDate && endDate) {
      return `${format(startDate, DISPLAY_FORMAT, { locale: dateLocale })} - ${format(endDate, DISPLAY_FORMAT, { locale: dateLocale })}`
    }

    if (startDate) {
      return `${format(startDate, DISPLAY_FORMAT, { locale: dateLocale })} - ...`
    }

    return t('selectDates')
  }, [startDate, endDate, dateLocale, t])

  const hasSelection = startDate || endDate

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex items-center gap-2 h-10 px-3 rounded-lg border',
            'text-sm font-medium transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2',
            hasSelection
              ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]'
              : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-background-alt)]'
          )}
          aria-label={t('selectDates')}
        >
          <CalendarDays className="h-4 w-4 flex-shrink-0" />
          <span className="whitespace-nowrap">{displayText}</span>
          {hasSelection && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === 'Enter' && handleClear(e as unknown as React.MouseEvent)}
              className="ml-1 rounded-full p-0.5 hover:bg-[var(--color-primary)]/20 cursor-pointer"
              aria-label={t('clearDates')}
            >
              <X className="h-3 w-3" />
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <DayPicker
          mode="range"
          selected={selectedRange}
          onSelect={handleSelect}
          locale={dateLocale}
          disabled={{ before: today }}
          numberOfMonths={1}
          showOutsideDays
          classNames={{
            root: 'p-3',
            months: 'flex flex-col',
            month: 'space-y-4',
            caption: 'flex justify-center pt-1 relative items-center',
            caption_label: 'text-sm font-medium text-[var(--color-text)]',
            nav: 'space-x-1 flex items-center',
            nav_button: cn(
              'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
              'inline-flex items-center justify-center rounded-md',
              'hover:bg-[var(--color-background-alt)]'
            ),
            nav_button_previous: 'absolute left-1',
            nav_button_next: 'absolute right-1',
            table: 'w-full border-collapse space-y-1',
            head_row: 'flex',
            head_cell:
              'text-[var(--color-text-muted)] rounded-md w-9 font-normal text-[0.8rem]',
            row: 'flex w-full mt-2',
            cell: cn(
              'h-9 w-9 text-center text-sm p-0 relative',
              'focus-within:relative focus-within:z-20'
            ),
            day: cn(
              'h-9 w-9 p-0 font-normal',
              'inline-flex items-center justify-center rounded-md',
              'hover:bg-[var(--color-background-alt)]',
              'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]',
              'aria-selected:opacity-100'
            ),
            day_range_start: 'day-range-start rounded-l-md',
            day_range_end: 'day-range-end rounded-r-md',
            day_selected: cn(
              'bg-[var(--color-primary)] text-white',
              'hover:bg-[var(--color-primary)] hover:text-white',
              'focus:bg-[var(--color-primary)] focus:text-white'
            ),
            day_today:
              'bg-[var(--color-secondary)]/20 text-[var(--color-secondary-dark)]',
            day_outside: 'text-[var(--color-text-muted)] opacity-50',
            day_disabled: 'text-[var(--color-text-muted)] opacity-50',
            day_range_middle: 'bg-[var(--color-primary)]/10 rounded-none',
            day_hidden: 'invisible',
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
