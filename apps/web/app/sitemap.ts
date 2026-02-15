import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://heritageguiding.com'
const LOCALES = ['sv', 'en', 'de'] as const

/** Static public routes (without locale prefix) */
const STATIC_ROUTES = [
  { path: '', priority: 1.0, changeFrequency: 'weekly' as const },
  { path: '/about-us', priority: 0.7, changeFrequency: 'monthly' as const },
  { path: '/faq', priority: 0.7, changeFrequency: 'monthly' as const },
  { path: '/find-tour', priority: 0.8, changeFrequency: 'weekly' as const },
  { path: '/guides', priority: 0.9, changeFrequency: 'weekly' as const },
  { path: '/tours', priority: 0.9, changeFrequency: 'weekly' as const },
  { path: '/group-booking', priority: 0.7, changeFrequency: 'monthly' as const },
  { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' as const },
  { path: '/terms', priority: 0.3, changeFrequency: 'yearly' as const },
]

/** Build hreflang alternates map for a given path */
function buildAlternates(path: string): Record<string, string> {
  const languages: Record<string, string> = {}
  for (const locale of LOCALES) {
    languages[locale] = `${BASE_URL}/${locale}${path}`
  }
  languages['x-default'] = `${BASE_URL}/sv${path}`
  return languages
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = []

  // Static routes - one entry per route with hreflang alternates
  for (const route of STATIC_ROUTES) {
    entries.push({
      url: `${BASE_URL}/sv${route.path}`,
      lastModified: new Date(),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
      alternates: { languages: buildAlternates(route.path) },
    })
  }

  // Dynamic tour routes from CMS
  try {
    const payload = await getPayload({ config })

    const tours = await payload.find({
      collection: 'tours',
      where: { status: { equals: 'published' } },
      depth: 0,
      limit: 500,
      select: { slug: true, updatedAt: true },
    })

    for (const tour of tours.docs) {
      const slug = String((tour as Record<string, unknown>).slug)
      const updatedAt = (tour as Record<string, unknown>).updatedAt as string | undefined
      const path = `/tours/${slug}`
      entries.push({
        url: `${BASE_URL}/sv${path}`,
        lastModified: updatedAt ? new Date(updatedAt) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
        alternates: { languages: buildAlternates(path) },
      })
    }

    // Dynamic guide routes from CMS
    const guides = await payload.find({
      collection: 'guides',
      where: { status: { in: ['active', 'on-leave'] } },
      depth: 0,
      limit: 200,
      select: { slug: true, updatedAt: true },
    })

    for (const guide of guides.docs) {
      const slug = String((guide as Record<string, unknown>).slug)
      const updatedAt = (guide as Record<string, unknown>).updatedAt as string | undefined
      const path = `/guides/${slug}`
      entries.push({
        url: `${BASE_URL}/sv${path}`,
        lastModified: updatedAt ? new Date(updatedAt) : new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
        alternates: { languages: buildAlternates(path) },
      })
    }
  } catch {
    // If CMS is unavailable, return static routes only
  }

  return entries
}
