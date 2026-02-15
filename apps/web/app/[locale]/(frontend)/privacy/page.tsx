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
  const t = await getTranslations({ locale, namespace: 'privacy' })

  return generatePageMetadata({
    title: t('title'),
    description: t('description'),
    locale: locale as Locale,
    pathname: '/privacy',
  })
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'privacy' })

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://heritageguiding.com'

  return (
    <>
      <WebPageSchema
        name={t('title')}
        description={t('description')}
        url={`${baseUrl}/${locale}/privacy`}
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
            {/* GDPR Notice */}
            <div className="rounded-lg bg-[var(--color-background-alt)] p-6 not-prose mb-8">
              <h2 className="font-semibold text-[var(--color-primary)]">
                {t('gdpr.title')}
              </h2>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                {t('gdpr.content')}
              </p>
            </div>

            {/* Introduction */}
            <h2>{t('sections.intro.title')}</h2>
            <p>{t('sections.intro.content')}</p>

            {/* Data We Collect */}
            <h2>{t('sections.dataCollected.title')}</h2>
            <p>{t('sections.dataCollected.intro')}</p>
            <ul>
              <li>{t('sections.dataCollected.point1')}</li>
              <li>{t('sections.dataCollected.point2')}</li>
              <li>{t('sections.dataCollected.point3')}</li>
              <li>{t('sections.dataCollected.point4')}</li>
            </ul>

            {/* How We Use Data */}
            <h2>{t('sections.dataUse.title')}</h2>
            <p>{t('sections.dataUse.intro')}</p>
            <ul>
              <li>{t('sections.dataUse.point1')}</li>
              <li>{t('sections.dataUse.point2')}</li>
              <li>{t('sections.dataUse.point3')}</li>
              <li>{t('sections.dataUse.point4')}</li>
            </ul>

            {/* Data Sharing */}
            <h2>{t('sections.dataSharing.title')}</h2>
            <p>{t('sections.dataSharing.content')}</p>

            {/* Cookies */}
            <h2>{t('sections.cookies.title')}</h2>
            <p>{t('sections.cookies.intro')}</p>
            <ul>
              <li>{t('sections.cookies.point1')}</li>
              <li>{t('sections.cookies.point2')}</li>
              <li>{t('sections.cookies.point3')}</li>
            </ul>

            {/* Your Rights */}
            <h2>{t('sections.rights.title')}</h2>
            <p>{t('sections.rights.intro')}</p>
            <ul>
              <li>{t('sections.rights.point1')}</li>
              <li>{t('sections.rights.point2')}</li>
              <li>{t('sections.rights.point3')}</li>
              <li>{t('sections.rights.point4')}</li>
              <li>{t('sections.rights.point5')}</li>
            </ul>

            {/* Data Retention */}
            <h2>{t('sections.retention.title')}</h2>
            <p>{t('sections.retention.content')}</p>

            {/* Security */}
            <h2>{t('sections.security.title')}</h2>
            <p>{t('sections.security.content')}</p>

            {/* Contact */}
            <h2>{t('sections.contact.title')}</h2>
            <p>{t('sections.contact.content')}</p>
            <p>
              <strong>Email:</strong> privacy@heritageguiding.com
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
