import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ContactHeroSection } from '@/components/contact/contact-hero-section'
import { ContactForm } from '@/components/contact/contact-form'
import { ContactInfoSection } from '@/components/contact/contact-info-section'
import { ContactQuickLinks } from '@/components/contact/contact-quick-links'
import { ContactTrustStrip } from '@/components/contact/contact-trust-strip'
import { ContactPageSchema } from '@/components/seo/contact-page-schema'
import { generatePageMetadata } from '@/lib/seo'
import type { Locale } from '@/i18n'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'contact' })

  return generatePageMetadata({
    title: t('meta.title'),
    description: t('meta.description'),
    locale: locale as Locale,
    pathname: '/contact',
  })
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  await params

  return (
    <>
      <ContactPageSchema />
      <Header />
      <main className="min-h-screen">
        <ContactHeroSection />

        {/* Form + Info — 2-column desktop, stacked mobile */}
        <section className="bg-[#FAFAF8]">
          <div className="px-5 py-16 md:px-[120px] md:py-20">
            <div className="flex flex-col gap-12 lg:flex-row lg:gap-12">
              <div className="flex-1">
                <Suspense>
                  <ContactForm />
                </Suspense>
              </div>
              <div className="w-full lg:w-[420px] lg:shrink-0">
                <ContactInfoSection />
              </div>
            </div>
          </div>
        </section>

        <ContactQuickLinks />
        <ContactTrustStrip />
      </main>
      <Footer />
    </>
  )
}
