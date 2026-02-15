import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locales, localeMetadata, type Locale } from '@/i18n'
import { WhatsAppFloatingButton } from '@/components/shared/whatsapp-floating-button'
import { SkipToContentLink } from '@/components/accessibility'
import { WebVitalsReporter } from '@/components/analytics/web-vitals-reporter'
import { inter, playfairDisplay } from '@/lib/fonts'
import { getWhatsAppNumber } from '@/lib/get-whatsapp-number-from-cms'
import { generateHreflangAlternates, generateOgLocaleAlternates } from '@/lib/seo'
import type { Metadata } from 'next'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'meta' })
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://heritageguiding.com'

  return {
    metadataBase: new URL(baseUrl),
    title: t('defaultTitle'),
    description: t('defaultDescription'),
    keywords: t('keywords'),
    alternates: generateHreflangAlternates('/', locale as Locale),
    openGraph: {
      type: 'website',
      locale: localeMetadata[locale as Locale]?.hreflang.replace('-', '_') || 'en_US',
      alternateLocale: generateOgLocaleAlternates(locale as Locale),
      url: `${baseUrl}/${locale}`,
      siteName: 'HeritageGuiding',
    },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Validate locale parameter
  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  // Load messages for the current locale
  const messages = await getMessages()

  // Fetch WhatsApp number from CMS globals (safe fallback to env var)
  const whatsappNumber = await getWhatsAppNumber()

  return (
    <html lang={locale} dir={localeMetadata[locale as Locale]?.dir || 'ltr'} suppressHydrationWarning>
      <head>
        {/* Preconnect to critical third-party origins */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} ${playfairDisplay.variable} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <WebVitalsReporter />
          <SkipToContentLink />
          <div id="main">{children}</div>
          {whatsappNumber && <WhatsAppFloatingButton phoneNumber={whatsappNumber} />}
          {/* ARIA live region for dynamic announcements */}
          <div id="aria-announcer" role="status" aria-live="polite" className="sr-only" />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
