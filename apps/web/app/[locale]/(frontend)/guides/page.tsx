import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { GuideGrid } from '@/components/guide'
import { getGuides, type GuideFilters } from '@/lib/api/get-guides'
import { generatePageMetadata } from '@/lib/seo'
import type { Locale } from '@/i18n'
import { GuideListSchema } from '@/components/seo'

interface GuidesPageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<GuideFilters>
}

export async function generateMetadata({ params }: GuidesPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'guides' })
  return generatePageMetadata({
    title: t('title'),
    description: t('description'),
    locale: locale as Locale,
    pathname: '/guides',
  })
}

export default async function GuidesPage({ params, searchParams }: GuidesPageProps) {
  const { locale } = await params
  const filters = await searchParams
  const t = await getTranslations({ locale, namespace: 'guides' })
  const { guides, page, totalPages } = await getGuides(filters, locale)

  return (
    <>
      <GuideListSchema guides={guides} />
      <Header variant="solid" />
      <main className="min-h-screen bg-[var(--color-background)] pt-[var(--header-height)]">
        <section className="container mx-auto px-4 py-6 lg:py-8">
          <h1 className="font-serif text-3xl font-bold text-[var(--color-primary)] lg:text-4xl">
            {t('title')}
          </h1>
          <p className="mt-2 text-lg text-[var(--color-text-muted)]">
            {t('subtitle')}
          </p>
          <div className="mt-8">
            <GuideGrid guides={guides} page={page} totalPages={totalPages} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
