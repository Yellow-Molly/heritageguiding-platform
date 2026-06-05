import { getPayload } from 'payload'
import config from '@payload-config'
import enMessages from '@/messages/en.json'
import svMessages from '@/messages/sv.json'
import deMessages from '@/messages/de.json'
import { extractPlainText } from '@/lib/payload-rich-text-to-plain'
import { isProductionDeployment, isComingSoon } from '@/lib/environment'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://privatetours.se'
const VALID_LOCALES = ['sv', 'en', 'de'] as const
type ValidLocale = (typeof VALID_LOCALES)[number]

/** Cache for 1 hour */
export const revalidate = 3600

const MESSAGES_MAP: Record<ValidLocale, typeof enMessages> = { en: enMessages, sv: svMessages, de: deMessages }

/** Site copy per locale */
const SITE_COPY: Record<ValidLocale, { title: string; tagline: string; about: string }> = {
  en: {
    title: 'Private Tours Sweden — Full Content',
    tagline:
      'Premium heritage tour booking platform. Expert-led private walking tours in Stockholm and Sweden. Available in Swedish, English, and German.',
    about:
      'Private Tours (privatetours.se) offers curated heritage walking tours led by certified local guides. Tours cover history, architecture, food, art, and nature across Stockholm neighborhoods and Swedish cities.',
  },
  sv: {
    title: 'Private Tours Sverige — Fullständigt innehåll',
    tagline:
      'Premiumplattform för kulturarvsguidade turer. Expertledda privata vandringsturer i Stockholm och Sverige. Tillgänglig på svenska, engelska och tyska.',
    about:
      'Private Tours (privatetours.se) erbjuder kurerade kulturvandringar ledda av certifierade lokala guider. Turerna täcker historia, arkitektur, mat, konst och natur i Stockholms stadsdelar och svenska städer.',
  },
  de: {
    title: 'Private Tours Schweden — Vollständiger Inhalt',
    tagline:
      'Premium-Buchungsplattform für Kulturerbe-Touren. Expertengeführte private Wandertouren in Stockholm und Schweden. Verfügbar auf Schwedisch, Englisch und Deutsch.',
    about:
      'Private Tours (privatetours.se) bietet kuratierte Kulturwanderungen unter der Leitung zertifizierter lokaler Guides. Die Touren umfassen Geschichte, Architektur, Essen, Kunst und Natur in Stockholms Vierteln und schwedischen Städten.',
  },
}

/** Format FAQ section from i18n messages for given locale */
function formatFaqSection(locale: ValidLocale): string {
  const faq = MESSAGES_MAP[locale].faq
  const categories = faq.categories as Record<string, string>
  const questions = faq.questions as Record<string, Record<string, { question: string; answer: string }>>
  const lines: string[] = ['## Frequently Asked Questions']

  for (const [catKey, catLabel] of Object.entries(categories)) {
    const catQuestions = questions[catKey]
    if (!catQuestions) continue
    lines.push(`\n### ${catLabel}`)
    for (const qa of Object.values(catQuestions)) {
      lines.push(`\n**${qa.question}**\n${qa.answer}`)
    }
  }
  return lines.join('\n')
}

/**
 * Localized /[locale]/llms-full.txt — comprehensive LLM content.
 * Includes full tour details, guide bios, FAQ, pricing info.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string }> }
): Promise<Response> {
  const { locale: rawLocale } = await params
  const locale = VALID_LOCALES.includes(rawLocale as ValidLocale) ? (rawLocale as ValidLocale) : 'en'
  const copy = SITE_COPY[locale]

  // Pre-launch: don't expose the catalog on the public dark production site.
  if (isProductionDeployment() && isComingSoon()) {
    return new Response(`# ${copy.title}\n\n> Launching soon.\n`, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  }

  let toursSection = ''
  let guidesSection = ''
  let categoriesSection = ''

  try {
    const payload = await getPayload({ config })

    const [tours, guides, categories] = await Promise.all([
      payload.find({
        collection: 'tours',
        where: { status: { equals: 'published' } },
        depth: 1,
        limit: 500,
        locale,
        select: { title: true, slug: true, shortDescription: true, highlights: true, pricing: true, duration: true },
      }),
      payload.find({
        collection: 'guides',
        where: { status: { in: ['active', 'on-leave'] } },
        depth: 1,
        limit: 200,
        locale,
        select: { name: true, slug: true, languages: true, bio: true, credentials: true },
      }),
      payload.find({ collection: 'categories', depth: 0, limit: 100, locale }),
    ])

    if (tours.docs.length > 0) {
      const tourBlocks = tours.docs.map((doc) => {
        const t = doc as Record<string, unknown>
        const title = String(t.title || 'Tour')
        const slug = String(t.slug)
        const desc = t.shortDescription ? `\n${String(t.shortDescription)}` : ''
        const pricing = t.pricing as { basePrice?: number; currency?: string; priceType?: string } | undefined
        const priceStr = pricing?.basePrice
          ? `\nPrice: ${pricing.basePrice} ${pricing.currency || 'SEK'} ${pricing.priceType === 'per_person' ? 'per person' : pricing.priceType === 'per_group' ? 'per group' : ''}`
          : ''
        const duration = t.duration as { hours?: number; durationText?: string } | undefined
        const durStr = duration?.durationText
          ? `\nDuration: ${duration.durationText}`
          : duration?.hours
            ? `\nDuration: ${duration.hours} hours`
            : ''
        const highlights = t.highlights as Array<{ highlight?: string }> | undefined
        const hlStr =
          highlights && highlights.length > 0
            ? `\nHighlights: ${highlights.map((h) => h.highlight).filter(Boolean).join(', ')}`
            : ''
        return `### [${title}](${BASE_URL}/${locale}/tours/${slug})${desc}${priceStr}${durStr}${hlStr}`
      })
      toursSection = `## Tours\n\n${tourBlocks.join('\n\n')}`
    }

    if (guides.docs.length > 0) {
      const guideBlocks = guides.docs.map((doc) => {
        const g = doc as Record<string, unknown>
        const name = String(g.name)
        const slug = String(g.slug)
        const langs = Array.isArray(g.languages) ? `\nLanguages: ${g.languages.join(', ')}` : ''
        const bio = extractPlainText(g.bio)
        const bioStr = bio ? `\n${bio}` : ''
        const creds = g.credentials as Array<{ credential?: string }> | undefined
        const credStr =
          creds && creds.length > 0
            ? `\nCredentials: ${creds.map((c) => c.credential).filter(Boolean).join(', ')}`
            : ''
        return `### [${name}](${BASE_URL}/${locale}/guides/${slug})${langs}${credStr}${bioStr}`
      })
      guidesSection = `## Guides\n\n${guideBlocks.join('\n\n')}`
    }

    if (categories.docs.length > 0) {
      const lines = categories.docs.map((doc) => {
        const c = doc as unknown as Record<string, unknown>
        const desc = c.description ? `: ${String(c.description)}` : ''
        return `- **${String(c.name)}**${desc}`
      })
      categoriesSection = `## Tour Categories\n\n${lines.join('\n')}`
    }
  } catch {
    // CMS unavailable — continue with static + FAQ content only
  }

  const faqSection = formatFaqSection(locale)

  const sections = [
    `# ${copy.title}

> ${copy.tagline}

## About

${copy.about}

- [Homepage](${BASE_URL}/${locale})
- [Browse All Tours](${BASE_URL}/${locale}/tours)
- [Find Your Perfect Tour](${BASE_URL}/${locale}/find-tour)
- [Our Guides](${BASE_URL}/${locale}/guides)
- [Group Bookings](${BASE_URL}/${locale}/group-booking)
- [About Us](${BASE_URL}/${locale}/about-us)
- [FAQ](${BASE_URL}/${locale}/faq)`,
    toursSection,
    guidesSection,
    categoriesSection,
    faqSection,
    `## Languages

- Swedish (sv): ${BASE_URL}/sv
- English (en): ${BASE_URL}/en
- German (de): ${BASE_URL}/de`,
  ]
    .filter(Boolean)
    .join('\n\n')

  return new Response(sections, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
