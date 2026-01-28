'use client'

import { useState, useEffect, useTransition } from 'react'
import Image from 'next/image'
import { Menu, X, Globe, ChevronDown } from 'lucide-react'
import { useLocale } from 'next-intl'
import { cn } from '@/lib/utils'
import { getButtonClassName } from '@/components/ui/button'
import { Link, usePathname, useRouter } from '@/i18n/navigation'
import { locales, localeLabels, type Locale } from '@/i18n/routing'

const navigation = [
  { name: 'Tours', href: '/tours' as const },
  { name: 'About', href: '/about' as const },
  { name: 'Contact', href: '/contact' as const },
]

interface HeaderProps {
  /** 'transparent' for pages with hero (home), 'solid' for pages without hero (tours) */
  variant?: 'transparent' | 'solid'
}

export function Header({ variant = 'transparent' }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const locale = useLocale() as Locale
  const pathname = usePathname()
  const router = useRouter()

  // For solid variant, always show scrolled styling
  const showSolidStyle = variant === 'solid' || isScrolled

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === locale) {
      setIsLangMenuOpen(false)
      return
    }

    startTransition(() => {
      router.replace(pathname, { locale: newLocale })
      setIsLangMenuOpen(false)
    })
  }

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-[var(--z-fixed)] transition-all duration-300',
        showSolidStyle ? 'bg-white/95 shadow-md backdrop-blur-md' : 'bg-transparent'
      )}
    >
      <nav className="container mx-auto flex h-20 items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="relative h-8 w-48 transition-opacity hover:opacity-80">
          <Image
            src="/logo1.svg"
            alt="HeritageGuiding"
            fill
            className="object-contain object-left"
            priority
            unoptimized
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'text-base font-medium transition-colors hover:opacity-80',
                showSolidStyle ? 'text-[#2D3748]' : 'text-white text-shadow-sm'
              )}
            >
              {item.name}
            </Link>
          ))}

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              onBlur={() => setTimeout(() => setIsLangMenuOpen(false), 150)}
              disabled={isPending}
              className={cn(
                'flex items-center gap-1 text-sm font-medium transition-colors disabled:opacity-50',
                showSolidStyle ? 'text-[#2D3748]' : 'text-white text-shadow-sm'
              )}
              aria-label="Select language"
              aria-expanded={isLangMenuOpen}
            >
              <Globe className="h-4 w-4" />
              <span>{locale.toUpperCase()}</span>
              <ChevronDown
                className={cn('h-4 w-4 transition-transform', isLangMenuOpen && 'rotate-180')}
              />
            </button>

            {isLangMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-32 rounded-lg bg-white py-2 shadow-lg">
                {locales.map((loc) => (
                  <button
                    key={loc}
                    onClick={() => handleLocaleChange(loc)}
                    disabled={isPending}
                    className={cn(
                      'block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-[var(--color-background-alt)] disabled:opacity-50',
                      locale === loc
                        ? 'font-medium text-[var(--color-primary)]'
                        : 'text-[var(--color-text)]'
                    )}
                  >
                    {localeLabels[loc]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* CTA Button */}
          <Link
            href="/find-tour"
            className={getButtonClassName(showSolidStyle ? 'primary' : 'outline', 'md')}
          >
            Find Your Tour
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg md:hidden',
            showSolidStyle ? 'text-[#1E3A5F]' : 'text-white text-shadow-sm'
          )}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      <div
        className={cn(
          'absolute left-0 right-0 top-full bg-white shadow-lg transition-all duration-300 md:hidden',
          isMobileMenuOpen
            ? 'pointer-events-auto max-h-[400px] opacity-100'
            : 'pointer-events-none max-h-0 overflow-hidden opacity-0'
        )}
      >
        <div className="container mx-auto flex flex-col gap-2 px-4 py-6">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="rounded-lg px-4 py-3 text-base font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-background-alt)]"
            >
              {item.name}
            </Link>
          ))}

          {/* Mobile Language Options */}
          <div className="mt-2 border-t border-[var(--color-border)] pt-4">
            <p className="px-4 pb-2 text-sm font-medium text-[var(--color-text-muted)]">Language</p>
            <div className="flex gap-2 px-4">
              {locales.map((loc) => (
                <button
                  key={loc}
                  onClick={() => handleLocaleChange(loc)}
                  disabled={isPending}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-sm transition-colors disabled:opacity-50',
                    locale === loc
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'bg-[var(--color-background-alt)] text-[var(--color-text)]'
                  )}
                >
                  {loc.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile CTA */}
          <div className="px-4 pt-4">
            <Link
              href="/find-tour"
              onClick={() => setIsMobileMenuOpen(false)}
              className={getButtonClassName('primary', 'lg', 'w-full')}
            >
              Find Your Tour
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
