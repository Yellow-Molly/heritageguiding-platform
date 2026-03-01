'use client'

import { useTransition } from 'react'
import { MapPin, Phone, Mail, Clock, Facebook, Instagram, Youtube, Linkedin } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Link, usePathname, useRouter } from '@/i18n/navigation'
import { locales, localeLabels, type Locale } from '@/i18n/routing'
import { cn } from '@/lib/utils'

/** Footer link columns with href and translation key for each link */
const footerColumns = [
  {
    key: 'tours',
    links: [
      { key: 'gamlastan', href: '/tours/gamla-stan-walking' as const },
      { key: 'royal', href: '/tours/royal-palace' as const },
      { key: 'vasa', href: '/tours/vasa-museum' as const },
      { key: 'private', href: '/tours?type=private' as const },
      { key: 'group', href: '/tours?type=group' as const },
    ],
  },
  {
    key: 'support',
    links: [
      { key: 'faq', href: '/faq' as const },
      { key: 'contact', href: '/contact' as const },
      { key: 'booking', href: '/help/booking' as const },
      { key: 'cancellation', href: '/help/cancellation' as const },
      { key: 'accessibility', href: '/accessibility' as const },
    ],
  },
  {
    key: 'company',
    links: [
      { key: 'about', href: '/about-us' as const },
      { key: 'guides', href: '/guides' as const },
      { key: 'blog', href: '/blog' as const },
      { key: 'careers', href: '/careers' as const },
      { key: 'press', href: '/press' as const },
    ],
  },
  {
    key: 'legal',
    links: [
      { key: 'terms', href: '/terms' as const },
      { key: 'privacy', href: '/privacy' as const },
      { key: 'cookies', href: '/cookies' as const },
    ],
  },
]

const socialLinks = [
  { name: 'Facebook', icon: Facebook, href: 'https://facebook.com' },
  { name: 'Instagram', icon: Instagram, href: 'https://instagram.com' },
  { name: 'YouTube', icon: Youtube, href: 'https://youtube.com' },
  { name: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com' },
]

export function Footer() {
  const currentYear = new Date().getFullYear()
  const t = useTranslations('footer')
  const locale = useLocale() as Locale
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === locale) return
    startTransition(() => {
      router.replace(pathname, { locale: newLocale })
    })
  }

  return (
    <footer className="bg-[var(--color-primary-dark)] text-white" aria-label="Site footer">
      {/* Newsletter */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-4 py-12 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="text-center md:text-left">
              <h3 className="mb-2 font-serif text-2xl font-bold">{t('newsletter.title')}</h3>
              <p className="text-white/70">{t('newsletter.subtitle')}</p>
            </div>
            <form className="flex w-full max-w-md gap-3" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder={t('newsletter.placeholder')}
                className="flex-1 rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/50 focus:border-[var(--color-secondary)] focus:outline-none"
                aria-label={t('newsletter.placeholder')}
              />
              <Button variant="secondary" size="lg" type="submit">
                {t('newsletter.button')}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link href="/" className="mb-6 inline-block font-serif text-2xl font-bold">
              {t('brand.name')}
            </Link>
            <p className="mb-6 max-w-sm text-white/70">{t('brand.description')}</p>

            {/* Contact Info */}
            <div className="space-y-3 text-sm text-white/70">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-[var(--color-secondary)]" />
                <span>{t('contact.address')}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-[var(--color-secondary)]" />
                <a href="tel:+46812345678" className="hover:text-white">+46 8 123 456 78</a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-[var(--color-secondary)]" />
                <a href="mailto:info@privatetours.se" className="hover:text-white">info@privatetours.se</a>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-[var(--color-secondary)]" />
                <span>{t('contact.hours')}</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="mt-6 flex gap-4">
              {socialLinks.map((social) => (
                <a key={social.name} href={social.href} target="_blank" rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-[var(--color-secondary)] hover:text-[var(--color-primary-dark)]"
                  aria-label={social.name}>
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-3 lg:grid-cols-4">
            {footerColumns.map((column) => (
              <div key={column.key}>
                <h4 className="mb-4 font-semibold text-[var(--color-secondary)]">
                  {t(`columns.${column.key}.title`)}
                </h4>
                <ul className="space-y-3">
                  {column.links.map((link) => (
                    <li key={link.key}>
                      <Link href={link.href}
                        className="text-sm text-white/70 transition-colors hover:text-white">
                        {t(`columns.${column.key}.links.${link.key}`)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-6 text-sm text-white/60 md:flex-row lg:px-8">
          <p>{t('copyright', { year: currentYear })}</p>
          <div className="flex items-center gap-4">
            <span>{t('language')}:</span>
            <div className="flex gap-2">
              {locales.map((loc) => (
                <button key={loc} onClick={() => handleLocaleChange(loc)} disabled={isPending}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs transition-colors disabled:opacity-50',
                    locale === loc
                      ? 'bg-[var(--color-secondary)] text-[var(--color-primary-dark)] font-medium'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  )}>
                  {localeLabels[loc]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
