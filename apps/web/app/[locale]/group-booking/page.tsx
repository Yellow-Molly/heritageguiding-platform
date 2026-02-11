import { getTranslations } from 'next-intl/server'
import { GroupInquiryForm } from '@/components/booking/group-inquiry-form'
import type { Metadata } from 'next'

interface PageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'groupBooking' })
  return {
    title: t('meta.title'),
    description: t('meta.description'),
  }
}

/**
 * Standalone group booking inquiry page for groups of 20+ people.
 * Accessible from tour detail page or direct URL (/[locale]/group-booking).
 */
export default async function GroupBookingPage() {
  const t = await getTranslations('groupBooking')

  return (
    <main className="container py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold">{t('title')}</h1>
        <p className="mt-2 text-[var(--color-text-muted)]">{t('description')}</p>
        <div className="mt-8">
          <GroupInquiryForm />
        </div>
      </div>
    </main>
  )
}
