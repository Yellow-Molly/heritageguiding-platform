import { getPayload } from 'payload'
import config from '@payload-config'
import { isProductionDeployment, isComingSoon } from '@/lib/environment'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://privatetours.se'
const VALID_LOCALES = ['sv', 'en', 'de'] as const
type ValidLocale = (typeof VALID_LOCALES)[number]

/** Cache for 1 hour */
export const revalidate = 3600

/** Site titles per locale */
const SITE_TITLES: Record<ValidLocale, { title: string; tagline: string; about: string }> = {
  en: {
    title: 'Private Tours Sweden',
    tagline:
      'Premium heritage tour booking platform. Expert-led private walking tours in Stockholm and Sweden. Available in Swedish, English, and German.',
    about:
      'Private Tours (privatetours.se) offers curated heritage walking tours led by certified local guides. Tours cover history, architecture, food, art, and nature across Stockholm neighborhoods and Swedish cities.',
  },
  sv: {
    title: 'Private Tours Sverige',
    tagline:
      'Premiumplattform för kulturarvsguidade turer. Expertledda privata vandringsturer i Stockholm och Sverige. Tillgänglig på svenska, engelska och tyska.',
    about:
      'Private Tours (privatetours.se) erbjuder kurerade kulturvandringar ledda av certifierade lokala guider. Turerna täcker historia, arkitektur, mat, konst och natur i Stockholms stadsdelar och svenska städer.',
  },
  de: {
    title: 'Private Tours Schweden',
    tagline:
      'Premium-Buchungsplattform für Kulturerbe-Touren. Expertengeführte private Wandertouren in Stockholm und Schweden. Verfügbar auf Schwedisch, Englisch und Deutsch.',
    about:
      'Private Tours (privatetours.se) bietet kuratierte Kulturwanderungen unter der Leitung zertifizierter lokaler Guides. Die Touren umfassen Geschichte, Architektur, Essen, Kunst und Natur in Stockholms Vierteln und schwedischen Städten.',
  },
}

/**
 * Localized /[locale]/llms.txt — concise LLM-friendly site overview.
 * Serves content in sv, en, or de based on URL locale.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ locale: string }> }
): Promise<Response> {
  const { locale: rawLocale } = await params
  const locale = VALID_LOCALES.includes(rawLocale as ValidLocale) ? (rawLocale as ValidLocale) : 'en'
  const i18n = SITE_TITLES[locale]

  // Pre-launch: don't expose the catalog on the public dark production site.
  if (isProductionDeployment() && isComingSoon()) {
    return new Response(`# ${i18n.title}\n\n> Launching soon.\n`, {
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
        depth: 0,
        limit: 500,
        locale,
        select: { title: true, slug: true, shortDescription: true },
      }),
      payload.find({
        collection: 'guides',
        where: { status: { in: ['active', 'on-leave'] } },
        depth: 0,
        limit: 200,
        locale,
        select: { name: true, slug: true, languages: true },
      }),
      payload.find({
        collection: 'categories',
        depth: 0,
        limit: 100,
        locale,
      }),
    ])

    if (tours.docs.length > 0) {
      const lines = tours.docs.map((doc) => {
        const t = doc as Record<string, unknown>
        const desc = t.shortDescription ? `: ${String(t.shortDescription)}` : ''
        return `- [${String(t.title || 'Tour')}](${BASE_URL}/${locale}/tours/${String(t.slug)})${desc}`
      })
      toursSection = `## Tours\n\n${lines.join('\n')}`
    }

    if (guides.docs.length > 0) {
      const lines = guides.docs.map((doc) => {
        const g = doc as Record<string, unknown>
        const langs = Array.isArray(g.languages) ? ` (${g.languages.join(', ')})` : ''
        return `- [${String(g.name)}](${BASE_URL}/${locale}/guides/${String(g.slug)})${langs}`
      })
      guidesSection = `## Guides\n\n${lines.join('\n')}`
    }

    if (categories.docs.length > 0) {
      const lines = categories.docs.map((doc) => `- ${String((doc as unknown as Record<string, unknown>).name)}`)
      categoriesSection = `## Tour Categories\n\n${lines.join('\n')}`
    }
  } catch {
    // CMS unavailable — continue with static content only
  }

  const sections = [
    `# ${i18n.title}

> ${i18n.tagline}

## About

${i18n.about}

- [Homepage](${BASE_URL}/${locale})
- [Browse All Tours](${BASE_URL}/${locale}/tours)
- [Find Your Perfect Tour](${BASE_URL}/${locale}/find-tour)
- [Our Guides](${BASE_URL}/${locale}/guides)
- [Group Bookings](${BASE_URL}/${locale}/group-booking)
- [About Us](${BASE_URL}/${locale}/about-us)
- [FAQ](${BASE_URL}/${locale}/faq)
- [Full LLM Content](${BASE_URL}/${locale}/llms-full.txt)`,
    toursSection,
    guidesSection,
    categoriesSection,
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
