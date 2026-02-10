import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ConciergeWizardContainer } from '@/components/wizard'

interface FindTourPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: FindTourPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'findTour' })

  return {
    title: t('title'),
    description: t('description'),
  }
}

export default async function FindTourPage({ params }: FindTourPageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'findTour' })

  return (
    <>
      <Header variant="solid" />
      <main className="min-h-screen bg-gradient-to-b from-[var(--color-primary)]/5 to-[var(--color-background)] pt-[var(--header-height)]">
        <div className="container mx-auto px-4 pt-12 pb-4 text-center">
          <h1 className="font-serif text-3xl font-bold text-[var(--color-primary)] md:text-4xl lg:text-5xl">
            {t('heading')}
          </h1>
          <p className="mt-4 text-lg text-[var(--color-text-muted)]">
            {t('subheading')}
          </p>
        </div>
        <ConciergeWizardContainer />
      </main>
      <Footer />
    </>
  )
}
