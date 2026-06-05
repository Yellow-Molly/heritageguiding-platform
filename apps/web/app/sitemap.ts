import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { isPubliclyIndexable } from '@/lib/environment'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://privatetours.se'
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
  { path: '/imprint', priority: 0.3, changeFrequency: 'yearly' as const },
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
  // Only emit URLs when publicly indexable (live prod). Build-reliable check:
  // this sitemap is prerendered at build, where VERCEL_ENV is not 'production'.
  if (!isPubliclyIndexable()) {
    return []
  }

  const entries: MetadataRoute.Sitemap = []

  // Static routes - fixed date so crawlers get accurate change signals
  const staticLastModified = new Date('2026-02-24')
  for (const route of STATIC_ROUTES) {
    entries.push({
      url: `${BASE_URL}/sv${route.path}`,
      lastModified: staticLastModified,
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
      depth: 1, // Resolve media relations for image URLs
      limit: 500,
      select: { slug: true, updatedAt: true, images: true },
    })

    for (const tour of tours.docs) {
      const t = tour as Record<string, unknown>
      const slug = String(t.slug)
      const updatedAt = t.updatedAt as string | undefined
      const path = `/tours/${slug}`

      // Extract image URLs from tour gallery for Google Image Search
      const tourImages = (t.images as Array<{ image?: { url?: string } }> | undefined) ?? []
      const imageUrls = tourImages
        .map((img) => img.image?.url)
        .filter((url): url is string => !!url)
        .map((url) => (url.startsWith('http') ? url : `${BASE_URL}${url}`))

      entries.push({
        url: `${BASE_URL}/sv${path}`,
        lastModified: updatedAt ? new Date(updatedAt) : staticLastModified,
        changeFrequency: 'weekly',
        priority: 0.9,
        alternates: { languages: buildAlternates(path) },
        ...(imageUrls.length > 0 && { images: imageUrls }),
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
        lastModified: updatedAt ? new Date(updatedAt) : staticLastModified,
        changeFrequency: 'monthly',
        priority: 0.8,
        alternates: { languages: buildAlternates(path) },
      })
    }
  } catch (error) {
    console.error('[sitemap] CMS fetch failed, returning static routes only:', error)
  }

  return entries
}
