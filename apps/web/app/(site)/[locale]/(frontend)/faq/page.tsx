import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { FAQAccordion } from '@/components/pages/faq-accordion'
import type { FAQItem } from '@/components/pages/faq-accordion'
import { FAQSchema } from '@/components/seo'
import { Button } from '@/components/ui/button'
import { generatePageMetadata } from '@/lib/seo'
import type { Locale } from '@/i18n'

type CategoryKey =
  | 'understanding'
  | 'comparing'
  | 'booking'
  | 'afterBooking'
  | 'cancellation'
  | 'experience'
  | 'about'

const categoryKeys: CategoryKey[] = [
  'understanding',
  'comparing',
  'booking',
  'afterBooking',
  'cancellation',
  'experience',
  'about',
]

/** Number of Q&A items per category — must match faq.questions keys in locale JSON */
const categoryQuestionCounts: Record<CategoryKey, number> = {
  understanding: 5,
  comparing: 5,
  booking: 6,
  afterBooking: 4,
  cancellation: 6,
  experience: 5,
  about: 2,
}

/**
 * Builds FAQ items for a category by reading from i18n translations.
 * Uses numbered keys (q1, q2, ...) to avoid arrays in translation files.
 */
function buildCategoryFaqs(
  t: Awaited<ReturnType<typeof getTranslations>>,
  category: CategoryKey
): FAQItem[] {
  const count = categoryQuestionCounts[category]
  return Array.from({ length: count }, (_, i) => ({
    question: String(t.raw(`questions.${category}.q${i + 1}.question`)),
    answer: String(t.raw(`questions.${category}.q${i + 1}.answer`)),
  }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'faq' })

  return generatePageMetadata({
    title: t('title'),
    description: t('description'),
    locale: locale as Locale,
    pathname: '/faq',
  })
}

export default async function FAQPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'faq' })

  // Build FAQ items once per category, reuse for schema and render
  const categoryFaqs = Object.fromEntries(
    categoryKeys.map((cat) => [cat, buildCategoryFaqs(t, cat)])
  ) as Record<CategoryKey, FAQItem[]>

  const allFaqs = categoryKeys.flatMap((cat) => categoryFaqs[cat])

  return (
    <>
      <FAQSchema faqs={allFaqs} />
      <Header />
      <main className="min-h-screen bg-[var(--color-background)]">
        {/* Hero Section */}
        <section className="bg-[var(--color-primary)] py-16 text-white">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-serif text-4xl font-bold text-white md:text-5xl">
              {t('title')}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">
              {t('subtitle')}
            </p>
          </div>
        </section>

        {/* FAQ Content */}
        <section className="container mx-auto px-4 py-12 lg:py-16">
          <div className="mx-auto max-w-3xl">
            {categoryKeys.map((category, index) => (
              <div key={category} className={index > 0 ? 'mt-10' : ''}>
                <h2 className="mb-4 font-serif text-xl font-bold text-[var(--color-primary)] md:text-2xl">
                  {t(`categories.${category}`)}
                </h2>
                <FAQAccordion
                  faqs={categoryFaqs[category]}
                  className="rounded-xl bg-white"
                />
              </div>
            ))}
          </div>

          {/* Contact CTA */}
          <div className="mx-auto mt-16 max-w-2xl rounded-xl bg-[var(--color-background-alt)] p-8 text-center">
            <h3 className="font-serif text-2xl font-bold text-[var(--color-primary)]">
              {t('stillHaveQuestions')}
            </h3>
            <p className="mt-2 text-[var(--color-text-muted)]">
              {t('contactDescription')}
            </p>
            <Button asChild className="mt-6">
              <Link href="/contact">{t('contactUs')}</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
