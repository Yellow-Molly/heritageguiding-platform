import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { FAQAccordion } from '@/components/pages/faq-accordion'
import { FAQSchema } from '@/components/seo'
import { Button } from '@/components/ui/button'
import { generatePageMetadata } from '@/lib/seo'
import type { Locale } from '@/i18n'

/**
 * FAQ data organized by category.
 * Each category contains questions and answers for the FAQ page.
 */
const faqCategories = {
  booking: [
    {
      question: 'How do I book a tour?',
      answer:
        'You can book directly through our website by selecting your preferred tour, choosing a date and time, and completing the booking form. You will receive an instant confirmation via email.',
    },
    {
      question: 'Can I book a tour for a group?',
      answer:
        'Yes, we offer group bookings for parties of 10 or more people. Contact us directly for special group rates and customized tour options.',
    },
    {
      question: 'How far in advance should I book?',
      answer:
        'We recommend booking at least 48 hours in advance, especially during peak season (May-September). Popular tours can fill up quickly.',
    },
    {
      question: 'Can I book a private tour?',
      answer:
        'Absolutely! Private tours are available for individuals, families, and groups. You can customize the itinerary, pace, and focus areas to match your interests.',
    },
  ],
  payment: [
    {
      question: 'What payment methods do you accept?',
      answer:
        'We accept all major credit cards (Visa, Mastercard, American Express), Swish, and bank transfers. Payment is processed securely through our booking system.',
    },
    {
      question: 'When do I need to pay?',
      answer:
        'Full payment is required at the time of booking to confirm your reservation. For group bookings over 10 people, we may offer deposit options.',
    },
    {
      question: 'Are there any hidden fees?',
      answer:
        'No, the price you see is the price you pay. All tour fees, guide services, and applicable taxes are included. Museum entrance fees are clearly stated when applicable.',
    },
    {
      question: 'Do you offer refunds?',
      answer:
        'Yes, we offer full refunds for cancellations made more than 48 hours before the tour. See our cancellation policy for complete details.',
    },
  ],
  cancellation: [
    {
      question: 'What is your cancellation policy?',
      answer:
        'Free cancellation up to 48 hours before the tour start time. Cancellations within 48 hours are non-refundable, but you may reschedule to another date subject to availability.',
    },
    {
      question: 'Can I reschedule my tour?',
      answer:
        'Yes, you can reschedule free of charge up to 24 hours before your tour, subject to availability. Contact us to arrange a new date.',
    },
    {
      question: 'What happens if the tour is cancelled due to weather?',
      answer:
        'Tours operate rain or shine. In case of severe weather that makes the tour unsafe, we will offer a full refund or reschedule to another date of your choice.',
    },
    {
      question: 'What if I am late for my tour?',
      answer:
        'Tours start promptly at the scheduled time. If you are running late, please contact us immediately. We may be able to meet you along the route, but we cannot guarantee this.',
    },
  ],
  experience: [
    {
      question: 'What should I wear on a walking tour?',
      answer:
        'Wear comfortable walking shoes and dress for the weather. Stockholm can be unpredictable, so layers are recommended. We walk at a leisurely pace with frequent stops.',
    },
    {
      question: 'Are your tours wheelchair accessible?',
      answer:
        'Many of our tours are wheelchair accessible. Check the accessibility information on each tour page, or contact us to discuss your specific needs.',
    },
    {
      question: 'Can children join the tours?',
      answer:
        'Yes, children are welcome on all our tours. We offer family-friendly tours designed specifically for younger visitors. Children under 6 join free.',
    },
    {
      question: 'How long are the tours?',
      answer:
        'Tour duration varies from 1.5 to 4 hours depending on the tour type. Each tour page displays the exact duration and what is included.',
    },
  ],
  safety: [
    {
      question: 'What COVID-19 safety measures are in place?',
      answer:
        'We follow all current public health guidelines. Tours are conducted outdoors when possible, group sizes are managed, and guides are trained in health protocols.',
    },
    {
      question: 'Is travel insurance recommended?',
      answer:
        'We recommend travel insurance that covers trip cancellation and medical emergencies. This provides peace of mind for unexpected situations.',
    },
    {
      question: 'What happens in case of emergency during a tour?',
      answer:
        'All our guides are trained in first aid and emergency procedures. We have protocols for medical emergencies and will assist with contacting local services if needed.',
    },
  ],
  guides: [
    {
      question: 'Who are your guides?',
      answer:
        'Our guides are licensed professionals with deep expertise in Swedish history and culture. Many hold advanced degrees in history, art history, or archaeology.',
    },
    {
      question: 'What languages do your guides speak?',
      answer:
        'We offer tours in Swedish, English, and German. Private tours can be arranged in additional languages upon request.',
    },
    {
      question: 'Can I request a specific guide?',
      answer:
        'Yes, for private tours you can request a specific guide based on availability. Contact us with your preferences when booking.',
    },
  ],
}

type CategoryKey = keyof typeof faqCategories

const categoryKeys: CategoryKey[] = [
  'booking',
  'payment',
  'cancellation',
  'experience',
  'safety',
  'guides',
]

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

  // Flatten all FAQs for schema markup
  const allFaqs = categoryKeys.flatMap((category) =>
    faqCategories[category].map((faq) => ({
      question: faq.question,
      answer: faq.answer,
    }))
  )

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
          <div className="mx-auto max-w-3xl space-y-12">
            {categoryKeys.map((category) => (
              <div key={category}>
                <h2 className="mb-6 font-serif text-2xl font-bold text-[var(--color-primary)]">
                  {t(`categories.${category}`)}
                </h2>
                <FAQAccordion
                  faqs={faqCategories[category]}
                  className="rounded-lg border bg-white shadow-sm"
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
