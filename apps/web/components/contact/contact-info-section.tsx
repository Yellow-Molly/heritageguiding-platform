import { useTranslations } from 'next-intl'
import { Mail, Phone, MapPin, Clock, Instagram, Facebook, Linkedin } from 'lucide-react'
import {
  CONTACT_ADDRESS,
  CONTACT_ADDRESS_LINE,
  SOCIAL_URLS,
} from '@/lib/contact-constants'

const GOOGLE_MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${CONTACT_ADDRESS.streetAddress}, ${CONTACT_ADDRESS.postalCode} ${CONTACT_ADDRESS.addressLocality}`,
)}`

/**
 * Contact info section with email, phone, address, hours,
 * social links, and static map image.
 */
export function ContactInfoSection() {
  const t = useTranslations('contact')
  const tCommon = useTranslations('common')

  const infoItems = [
    { icon: Mail, label: t('info.emailLabel'), value: t('info.emailValue'), href: `mailto:${t('info.emailValue')}` },
    { icon: Phone, label: t('info.phoneLabel'), value: t('info.phoneValue'), href: `tel:${t('info.phoneValue').replace(/\s/g, '')}` },
    { icon: MapPin, label: t('info.addressLabel'), value: t('info.addressValue') },
    { icon: Clock, label: t('info.hoursLabel'), value: t('info.hoursValue') },
  ]

  const socialLinks = [
    { icon: Instagram, href: SOCIAL_URLS.instagram, label: 'Instagram' },
    { icon: Facebook, href: SOCIAL_URLS.facebook, label: 'Facebook' },
    { icon: Linkedin, href: SOCIAL_URLS.linkedin, label: 'LinkedIn' },
  ]

  return (
    <div>
      <h2 className="font-serif !text-2xl font-bold text-[#1E3A5F] md:!text-[28px]">
        {t('info.title')}
      </h2>
      <p className="mt-2 text-[15px] text-[var(--color-text-muted)]">{t('info.subtitle')}</p>

      {/* Info items */}
      <div className="mt-8 flex flex-col gap-6">
        {infoItems.map(({ icon: Icon, label, value, href }) => (
          <div key={label} className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-secondary)]/10">
              <Icon className="h-5 w-5 text-[var(--color-secondary)]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#2D3748]">{label}</p>
              {href ? (
                <a href={href} className="text-sm text-[var(--color-text-muted)] hover:text-[#1E3A5F] transition-colors">
                  {value}
                </a>
              ) : (
                <p className="text-sm text-[var(--color-text-muted)]">{value}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Social links */}
      <div className="mt-8">
        <p className="text-sm font-medium text-[#2D3748]">{t('info.followUs')}</p>
        <div className="mt-3 flex gap-3">
          {socialLinks.map(({ icon: Icon, href, label }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={label}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] transition-colors hover:bg-[var(--color-secondary)]/20"
            >
              <Icon className="h-5 w-5" />
            </a>
          ))}
        </div>
      </div>

      {/* Static map — links to Google Maps without loading tracking scripts */}
      <a
        href={GOOGLE_MAPS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 block overflow-hidden rounded-2xl bg-[#E5E7EB]"
      >
        <div className="flex h-[180px] w-full items-center justify-center md:h-[200px]">
          <div className="text-center">
            <MapPin className="mx-auto h-8 w-8 text-[var(--color-secondary)]" />
            <p className="mt-2 text-sm font-medium text-[#2D3748]">{CONTACT_ADDRESS_LINE}</p>
            <p className="mt-1 text-xs text-[var(--color-text)]">{tCommon('viewOnGoogleMaps')}</p>
          </div>
        </div>
      </a>
    </div>
  )
}
