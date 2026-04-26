import { getLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/i18n/navigation'
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
} from 'lucide-react'
import {
  CONTACT_ADDRESS_LINE,
  CONTACT_EMAIL,
  CONTACT_HOURS,
  CONTACT_PHONE,
  CONTACT_PHONE_TEL,
  SOCIAL_URLS,
} from '@/lib/contact-constants'
import { getFeaturedTours } from '@/lib/api/get-featured-tours'
import type { Locale } from '@/i18n'
import { FooterNewsletterForm } from './footer-newsletter-form'
import { FooterLanguageSelector } from './footer-language-selector'

const socialIcons = [
  { name: 'Facebook', icon: Facebook, href: SOCIAL_URLS.facebook },
  { name: 'Instagram', icon: Instagram, href: SOCIAL_URLS.instagram },
  { name: 'YouTube', icon: Youtube, href: SOCIAL_URLS.youtube },
  { name: 'LinkedIn', icon: Linkedin, href: SOCIAL_URLS.linkedin },
]

export async function Footer() {
  const locale = (await getLocale()) as Locale
  const t = await getTranslations({ locale, namespace: 'footer' })
  const tCommon = await getTranslations({ locale, namespace: 'common' })
  const currentYear = new Date().getFullYear()

  // Top 3 featured tours for the footer column. Fallback to empty list if Payload is unreachable.
  let featuredTours: Awaited<ReturnType<typeof getFeaturedTours>> = []
  try {
    featuredTours = await getFeaturedTours(locale, 3)
  } catch (err) {
    console.error('[footer] getFeaturedTours failed; rendering without tour links', err)
    featuredTours = []
  }

  const supportLinks = [
    { label: t('supportLinks.faq'), href: '/faq' },
    { label: t('supportLinks.contactUs'), href: '/contact' },
    { label: t('supportLinks.cancellationPolicy'), href: '/cancellation' },
  ]

  const companyLinks = [
    { label: t('companyLinks.aboutUs'), href: '/about-us' },
    { label: t('companyLinks.ourGuides'), href: '/guides' },
  ]

  const legalLinks = [
    { label: t('legalLinks.terms'), href: '/terms' },
    { label: t('legalLinks.privacy'), href: '/privacy' },
  ]

  return (
    <footer className="bg-[#0b0b0b] text-white" aria-label="Site footer">
      {/* Newsletter Section */}
      <div className="border-b border-[#3e3e3e]">
        <div className="container mx-auto px-4 py-12 lg:px-8">
          <FooterNewsletterForm
            heading={t('newsletter.heading')}
            copy={t('newsletter.copy')}
            placeholder={t('newsletter.placeholder')}
            button={t('newsletter.button')}
            ariaLabel={t('newsletter.ariaLabel')}
          />
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="mb-6 inline-block font-serif text-2xl font-bold text-white"
            >
              Private Tours
            </Link>
            <p className="mb-6 max-w-sm text-[#e6d3a0]/70">{t('tagline')}</p>

            {/* Contact Info */}
            <address className="not-italic space-y-3 text-sm text-[#e6d3a0]/70">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-[#DBC078]" />
                <span>{CONTACT_ADDRESS_LINE}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-[#DBC078]" />
                <a
                  href={`tel:${CONTACT_PHONE_TEL}`}
                  className="transition-colors hover:text-white"
                >
                  {CONTACT_PHONE}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-[#DBC078]" />
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="transition-colors hover:text-white"
                >
                  {CONTACT_EMAIL}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-[#DBC078]" />
                <span>{CONTACT_HOURS[locale]}</span>
              </div>
            </address>

            {/* Social Links */}
            <div className="mt-6 flex gap-4">
              {socialIcons.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-[#DBC078] hover:text-[#0b0b0b]"
                  aria-label={social.name}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-3 lg:grid-cols-4">
            {/* Tours — server-fetched featured tours */}
            <div>
              <h4 className="mb-4 font-semibold text-[#DBC078]">
                {t('tourLinks.heading')}
              </h4>
              <ul className="space-y-3">
                {featuredTours.map((tour) => (
                  <li key={tour.id}>
                    <Link
                      href={`/tours/${tour.slug}`}
                      className="text-sm text-[#e6d3a0]/70 transition-colors hover:text-white"
                    >
                      {tour.title}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/tours"
                    className="text-sm text-[#e6d3a0]/70 transition-colors hover:text-white"
                  >
                    {tCommon('tours')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="mb-4 font-semibold text-[#DBC078]">
                {t('supportLinks.heading')}
              </h4>
              <ul className="space-y-3">
                {supportLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[#e6d3a0]/70 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="mb-4 font-semibold text-[#DBC078]">
                {t('companyLinks.heading')}
              </h4>
              <ul className="space-y-3">
                {companyLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[#e6d3a0]/70 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="mb-4 font-semibold text-[#DBC078]">
                {t('legalLinks.heading')}
              </h4>
              <ul className="space-y-3">
                {legalLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[#e6d3a0]/70 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[#3e3e3e]">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 py-6 text-sm text-[#e6d3a0]/70 md:flex-row lg:px-8">
          <p>{t('copyright', { year: currentYear })}</p>
          <div className="flex items-center gap-4">
            <FooterLanguageSelector
              label={t('languageSelector.label')}
              ariaLabel={t('languageSelector.ariaLabel')}
              options={{
                en: t('languageSelector.en'),
                sv: t('languageSelector.sv'),
                de: t('languageSelector.de'),
              }}
            />
          </div>
        </div>
      </div>
    </footer>
  )
}
