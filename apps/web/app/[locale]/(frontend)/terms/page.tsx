import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { generatePageMetadata } from '@/lib/seo'
import type { Locale } from '@/i18n'
import { WebPageSchema } from '@/components/seo'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'terms' })

  return generatePageMetadata({
    title: t('title'),
    description: t('description'),
    locale: locale as Locale,
    pathname: '/terms',
  })
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'terms' })

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://heritageguiding.com'

  return (
    <>
      <WebPageSchema
        name={t('title')}
        description={t('description')}
        url={`${baseUrl}/${locale}/terms`}
      />
      <Header />
      <main className="min-h-screen bg-[var(--color-background)]">
        {/* Hero Section */}
        <section className="bg-[var(--color-primary)] py-12 text-white">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-serif text-4xl font-bold text-white">{t('title')}</h1>
            <p className="mt-2 text-white/80">{t('lastUpdated')}: 2026-01-01</p>
          </div>
        </section>

        {/* Content */}
        <section className="container mx-auto px-4 py-12">
          <div className="prose prose-lg mx-auto max-w-3xl">
            {/* Introduction */}
            <h2>{t('sections.intro.title')}</h2>
            <p>{t('sections.intro.content')}</p>

            {/* Booking Terms */}
            <h2>{t('sections.booking.title')}</h2>
            <p>{t('sections.booking.intro')}</p>
            <ul>
              <li>{t('sections.booking.point1')}</li>
              <li>{t('sections.booking.point2')}</li>
              <li>{t('sections.booking.point3')}</li>
              <li>{t('sections.booking.point4')}</li>
            </ul>

            {/* Payment */}
            <h2>{t('sections.payment.title')}</h2>
            <p>{t('sections.payment.content')}</p>

            {/* Cancellation Policy */}
            <h2>{t('sections.cancellation.title')}</h2>
            <p>{t('sections.cancellation.intro')}</p>
            <ul>
              <li>{t('sections.cancellation.point1')}</li>
              <li>{t('sections.cancellation.point2')}</li>
              <li>{t('sections.cancellation.point3')}</li>
            </ul>

            {/* Liability */}
            <h2>{t('sections.liability.title')}</h2>
            <p>{t('sections.liability.content')}</p>

            {/* Tour Conduct */}
            <h2>{t('sections.conduct.title')}</h2>
            <p>{t('sections.conduct.intro')}</p>
            <ul>
              <li>{t('sections.conduct.point1')}</li>
              <li>{t('sections.conduct.point2')}</li>
              <li>{t('sections.conduct.point3')}</li>
            </ul>

            {/* Intellectual Property */}
            <h2>{t('sections.ip.title')}</h2>
            <p>{t('sections.ip.content')}</p>

            {/* Governing Law */}
            <h2>{t('sections.law.title')}</h2>
            <p>{t('sections.law.content')}</p>

            {/* Contact */}
            <h2>{t('sections.contact.title')}</h2>
            <p>{t('sections.contact.content')}</p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
