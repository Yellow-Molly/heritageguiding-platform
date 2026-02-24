import { getPayload } from 'payload'
import config from '@payload-config'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://privatetours.se'

/** Cache for 1 hour */
export const revalidate = 3600

/**
 * Root /llms.txt — concise LLM-friendly site overview (English default).
 * Follows llmstxt.org standard: H1 title, blockquote, H2 sections with links.
 */
export async function GET(): Promise<Response> {
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
        locale: 'en',
        select: { title: true, slug: true, shortDescription: true },
      }),
      payload.find({
        collection: 'guides',
        where: { status: { in: ['active', 'on-leave'] } },
        depth: 0,
        limit: 200,
        locale: 'en',
        select: { name: true, slug: true, languages: true },
      }),
      payload.find({
        collection: 'categories',
        depth: 0,
        limit: 100,
        locale: 'en',
      }),
    ])

    if (tours.docs.length > 0) {
      const lines = tours.docs.map((doc) => {
        const t = doc as Record<string, unknown>
        const desc = t.shortDescription ? `: ${String(t.shortDescription)}` : ''
        return `- [${String(t.title || 'Tour')}](${BASE_URL}/en/tours/${String(t.slug)})${desc}`
      })
      toursSection = `## Tours\n\n${lines.join('\n')}`
    }

    if (guides.docs.length > 0) {
      const lines = guides.docs.map((doc) => {
        const g = doc as Record<string, unknown>
        const langs = Array.isArray(g.languages) ? ` (${g.languages.join(', ')})` : ''
        return `- [${String(g.name)}](${BASE_URL}/en/guides/${String(g.slug)})${langs}`
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
    `# Private Tours Sweden

> Premium heritage tour booking platform. Expert-led private walking tours in Stockholm and Sweden. Available in Swedish, English, and German.

## About

Private Tours (privatetours.se) offers curated heritage walking tours led by certified local guides. Tours cover history, architecture, food, art, and nature across Stockholm neighborhoods and Swedish cities.

- [Homepage](${BASE_URL}/en)
- [Browse All Tours](${BASE_URL}/en/tours)
- [Find Your Perfect Tour](${BASE_URL}/en/find-tour)
- [Our Guides](${BASE_URL}/en/guides)
- [Group Bookings](${BASE_URL}/en/group-booking)
- [About Us](${BASE_URL}/en/about-us)
- [FAQ](${BASE_URL}/en/faq)
- [Full LLM Content](${BASE_URL}/llms-full.txt)`,
    toursSection,
    guidesSection,
    categoriesSection,
    `## Booking

- Private tours for individuals, couples, families, and corporate groups
- Group bookings available for 20-200 participants
- Online booking via tour detail pages
- Contact via WhatsApp or group booking form

## Languages

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
