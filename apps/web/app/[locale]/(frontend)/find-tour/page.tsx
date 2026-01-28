import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import Script from 'next/script'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

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
      <main className="flex min-h-screen flex-col bg-[var(--color-background)] pt-[var(--header-height)]">
        {/* Page Header */}
        <div className="border-b border-[var(--color-border)] bg-white px-4 py-6 lg:px-8">
          <div className="container mx-auto">
            <h1 className="font-serif text-2xl font-bold text-[var(--color-text)] md:text-3xl">
              {t('heading')}
            </h1>
            <p className="mt-2 text-[var(--color-text-muted)]">{t('subheading')}</p>
          </div>
        </div>

        {/* BubblaV AI Chat Container */}
        <div
          id="bubblav-ai-page"
          className="flex-1"
          style={{ width: '100%', minHeight: 'calc(100vh - var(--header-height) - 120px)' }}
        />

        {/* BubblaV Script */}
        <Script
          src="https://www.bubblav.com/ai-page.js"
          strategy="afterInteractive"
          data-site-id="ff276627-8ae7-42ab-a9e5-7ebd38613a98"
        />
      </main>
      <Footer />
    </>
  )
}
