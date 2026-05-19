'use client'

import { useTransition } from 'react'
import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'
import { locales, type Locale } from '@/i18n'

interface FooterLanguageSelectorProps {
  label: string
  ariaLabel: string
  options: Record<Locale, string>
}

export function FooterLanguageSelector({
  label,
  ariaLabel,
  options,
}: FooterLanguageSelectorProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()
  const currentLocale = useLocale() as Locale

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as Locale
    if (!locales.includes(next)) return

    // Mirrors header switcher: tour-detail pages embed the Bokun widget whose
    // loader can't soft-refresh language. Hard-navigate so the iframe loads
    // against a fresh page in the target locale.
    if (/^\/tours\/[^/]+/.test(pathname)) {
      window.location.assign(`/${next}${pathname}`)
      return
    }

    startTransition(() => {
      router.replace(pathname, { locale: next })
    })
  }

  return (
    <>
      <span>{label}:</span>
      <select
        className="rounded border border-[#3e3e3e] bg-transparent px-2 py-1 text-[#e6d3a0]/70 focus:border-[#DBC078] focus:outline-none"
        value={currentLocale}
        onChange={onChange}
        disabled={isPending}
        aria-label={ariaLabel}
      >
        {locales.map((loc) => (
          <option key={loc} value={loc} className="bg-[#0b0b0b]">
            {options[loc]}
          </option>
        ))}
      </select>
    </>
  )
}
