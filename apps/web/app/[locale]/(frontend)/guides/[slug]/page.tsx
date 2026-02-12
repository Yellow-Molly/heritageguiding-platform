import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { getGuideBySlug, getAllGuideSlugs } from '@/lib/api/get-guide-by-slug'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { GuideDetailHeader, GuideDetailContent, GuideToursSection } from '@/components/guide'
import { Breadcrumb } from '@/components/shared/breadcrumb'

interface GuideDetailPageProps {
  params: Promise<{ locale: string; slug: string }>
}

/** Validate slug format - allows lowercase letters, numbers, hyphens */
function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug) && slug.length <= 100
}

export default async function GuideDetailPage({ params }: GuideDetailPageProps) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  if (!isValidSlug(slug)) notFound()

  const t = await getTranslations({ locale, namespace: 'guides' })
  const guide = await getGuideBySlug(slug, locale)

  if (!guide) notFound()

  const breadcrumbs = [
    { label: t('breadcrumb.home'), href: '/' },
    { label: t('breadcrumb.guides'), href: '/guides' },
    { label: guide.name, href: `/guides/${guide.slug}` },
  ]

  return (
    <>
      <Header variant="solid" />
      <main className="min-h-screen bg-[var(--color-background)] pt-[var(--header-height)]">
        <div className="container py-4">
          <Breadcrumb items={breadcrumbs} />
        </div>
        <GuideDetailHeader guide={guide} />
        <div className="container py-12">
          <div className="grid gap-12 lg:grid-cols-3">
            <div className="space-y-12 lg:col-span-2">
              <GuideDetailContent guide={guide} />
            </div>
          </div>
          {guide.tours.length > 0 && (
            <div className="mt-12">
              <GuideToursSection tours={guide.tours} guideName={guide.name} />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

export async function generateMetadata({ params }: GuideDetailPageProps) {
  const { locale, slug } = await params
  const guide = await getGuideBySlug(slug, locale)

  if (!guide) {
    return { title: 'Guide Not Found' }
  }

  return {
    title: guide.name,
    description: `Meet ${guide.name}, expert heritage guide in Stockholm.`,
  }
}

export async function generateStaticParams() {
  const guides = await getAllGuideSlugs()
  const locales = ['sv', 'en', 'de']
  return guides.flatMap(({ slug }) => locales.map((locale) => ({ locale, slug })))
}
