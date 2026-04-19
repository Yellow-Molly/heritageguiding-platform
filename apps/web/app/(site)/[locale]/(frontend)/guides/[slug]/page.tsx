import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { getGuideBySlug, getAllGuideSlugs } from '@/lib/api/get-guide-by-slug'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import {
  GuideDetailSidebar,
  GuideDetailBio,
  GuideToursSection,
  GuideExpertiseSection,
  GuideQuoteSection,
  GuideApproachSection,
  GuideGuestFeedbackSection,
  GuideStickyCta,
} from '@/components/guide'
import { Breadcrumb } from '@/components/shared/breadcrumb'
import { generatePageMetadata } from '@/lib/seo'
import type { Locale } from '@/i18n'
import { GuideDetailSchema } from '@/components/seo'

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
      <GuideDetailSchema
        name={guide.name}
        slug={guide.slug}
        photo={guide.photo?.url}
        languages={guide.languages}
        specializations={guide.specializations}
        credentials={guide.credentials}
      />
      <Header variant="solid" />
      {/* pb-20 on mobile to clear the sticky CTA bar; removed on lg+ */}
      <main className="min-h-screen bg-[var(--color-background)] pb-20 pt-[var(--header-height)] lg:pb-0">
        {/* Mobile breadcrumb */}
        <div className="bg-[var(--color-background-alt)] px-5 py-3 lg:hidden">
          <Breadcrumb items={breadcrumbs} />
        </div>

        {/* Split panel container */}
        <div className="mx-auto flex max-w-[1536px] flex-col lg:flex-row">
          <GuideDetailSidebar guide={guide} />

          {/* Right column */}
          <div className="flex-1 px-5 py-6 lg:px-16 lg:py-10">
            {/* Desktop breadcrumb */}
            <div className="mb-10 hidden lg:block">
              <Breadcrumb items={breadcrumbs} />
            </div>

            <div className="space-y-10">
              <GuideDetailBio guide={guide} />
              <hr className="border-[var(--color-border)]" />
              <GuideExpertiseSection specialtyDescriptions={guide.specialtyDescriptions} />
              <GuideQuoteSection
                quote={guide.uniqueAspectsQuote}
                body={guide.uniqueAspectsBody}
                guideName={guide.name}
              />
              <GuideApproachSection guideStyle={guide.guideStyle} />
              <GuideGuestFeedbackSection whatGuestsAppreciate={guide.whatGuestsAppreciate} />
              {guide.tours.length > 0 && (
                <>
                  <hr className="border-[var(--color-border)]" />
                  <GuideToursSection tours={guide.tours} guideName={guide.name} />
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      {guide.tours.length > 0 && <GuideStickyCta guideName={guide.name} />}
      <Footer />
    </>
  )
}

export async function generateMetadata({ params }: GuideDetailPageProps) {
  const { locale, slug } = await params
  if (!isValidSlug(slug)) return { title: 'Guide Not Found' }
  const guide = await getGuideBySlug(slug, locale)

  if (!guide) {
    return { title: 'Guide Not Found' }
  }

  return generatePageMetadata({
    title: guide.name,
    description: `Meet ${guide.name}, expert heritage guide in Stockholm.`,
    locale: locale as Locale,
    pathname: `/guides/${guide.slug}`,
    ogImage: guide.photo?.url,
  })
}

export async function generateStaticParams() {
  const guides = await getAllGuideSlugs()
  const locales = ['sv', 'en', 'de']
  return guides.flatMap(({ slug }) => locales.map((locale) => ({ locale, slug })))
}
