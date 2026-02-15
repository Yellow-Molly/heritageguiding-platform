import { getTranslations } from 'next-intl/server'
import { GroupInquiryForm } from '@/components/booking/group-inquiry-form'
import type { Metadata } from 'next'
import { generatePageMetadata } from '@/lib/seo'
import type { Locale } from '@/i18n'
import { WebPageSchema } from '@/components/seo'

interface PageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'groupBooking' })
  return generatePageMetadata({
    title: t('meta.title'),
    description: t('meta.description'),
    locale: locale as Locale,
    pathname: '/group-booking',
  })
}

/**
 * Standalone group booking inquiry page for groups of 9+ people.
 * Accessible from tour detail page or direct URL (/[locale]/group-booking).
 */
export default async function GroupBookingPage({ params }: PageProps) {
  const { locale } = await params
  const t = await getTranslations('groupBooking')
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://heritageguiding.com'

  return (
    <>
      <WebPageSchema
        name={t('title')}
        description={t('description')}
        url={`${baseUrl}/${locale}/group-booking`}
        breadcrumb={[
          { name: 'Home', url: `${baseUrl}/${locale}` },
          { name: t('title'), url: `${baseUrl}/${locale}/group-booking` },
        ]}
      />
      <main className="container py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="mt-2 text-[var(--color-text-muted)]">{t('description')}</p>
        <div className="mt-8">
          <GroupInquiryForm />
        </div>
      </div>
      </main>
    </>
  )
}
