import { getPayload } from 'payload'
import config from '@payload-config'
import enMessages from '@/messages/en.json'
import { extractPlainText } from '@/lib/payload-rich-text-to-plain'
import { isComingSoon } from '@/lib/environment'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://privatetours.se'

/** Cache for 1 hour */
export const revalidate = 3600

/** Format FAQ section from i18n messages */
function formatFaqSection(): string {
  const faq = enMessages.faq
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
 * Root /llms-full.txt — comprehensive LLM content (English default).
 * Includes full tour details, guide bios, FAQ, pricing info.
 */
export async function GET(): Promise<Response> {
  // Pre-launch holding: gate on COMING_SOON only. This route is build-time
  // static (revalidate), so VERCEL_ENV / isProductionDeployment is unreliable here.
  if (isComingSoon()) {
    return new Response('# Private Tours Sweden — Full Content\n\n> Launching soon.\n', {
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
        locale: 'en',
        select: {
          title: true,
          slug: true,
          shortDescription: true,
          highlights: true,
          pricing: true,
          duration: true,
        },
      }),
      payload.find({
        collection: 'guides',
        where: { status: { in: ['active', 'on-leave'] } },
        depth: 1,
        limit: 200,
        locale: 'en',
        select: { name: true, slug: true, languages: true, bio: true, credentials: true },
      }),
      payload.find({
        collection: 'categories',
        depth: 0,
        limit: 100,
        locale: 'en',
      }),
    ])

    if (tours.docs.length > 0) {
      const tourBlocks = tours.docs.map((doc) => {
        const t = doc as Record<string, unknown>
        const title = String(t.title || 'Tour')
        const slug = String(t.slug)
        const desc = t.shortDescription ? `\n${String(t.shortDescription)}` : ''

        // Pricing
        const pricing = t.pricing as { basePrice?: number; currency?: string; priceType?: string } | undefined
        const priceStr = pricing?.basePrice
          ? `\nPrice: ${pricing.basePrice} ${pricing.currency || 'SEK'} ${pricing.priceType === 'per_person' ? 'per person' : pricing.priceType === 'per_group' ? 'per group' : ''}`
          : ''

        // Duration
        const duration = t.duration as { hours?: number; durationText?: string } | undefined
        const durStr = duration?.durationText
          ? `\nDuration: ${duration.durationText}`
          : duration?.hours
            ? `\nDuration: ${duration.hours} hours`
            : ''

        // Highlights
        const highlights = t.highlights as Array<{ highlight?: string }> | undefined
        const hlStr =
          highlights && highlights.length > 0
            ? `\nHighlights: ${highlights.map((h) => h.highlight).filter(Boolean).join(', ')}`
            : ''

        return `### [${title}](${BASE_URL}/en/tours/${slug})${desc}${priceStr}${durStr}${hlStr}`
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
        return `### [${name}](${BASE_URL}/en/guides/${slug})${langs}${credStr}${bioStr}`
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

  const faqSection = formatFaqSection()

  const sections = [
    `# Private Tours Sweden — Full Content

> Premium heritage tour booking platform. Expert-led private walking tours in Stockholm and Sweden. Available in Swedish, English, and German.

## About

Private Tours (privatetours.se) offers curated heritage walking tours led by certified local guides. Tours cover history, architecture, food, art, and nature across Stockholm neighborhoods and Swedish cities.

- [Homepage](${BASE_URL}/en)
- [Browse All Tours](${BASE_URL}/en/tours)
- [Find Your Perfect Tour](${BASE_URL}/en/find-tour)
- [Our Guides](${BASE_URL}/en/guides)
- [Group Bookings](${BASE_URL}/en/group-booking)
- [About Us](${BASE_URL}/en/about-us)
- [FAQ](${BASE_URL}/en/faq)`,
    toursSection,
    guidesSection,
    categoriesSection,
    faqSection,
    `## Booking Information

- Private tours for individuals, couples, families, and corporate groups
- Group bookings available for 20-200 participants via dedicated form
- Online booking via tour detail pages with real-time availability
- Contact via WhatsApp or group booking form
- Cancellation: full refund >48h before, partial 24-48h, non-refundable <24h

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
