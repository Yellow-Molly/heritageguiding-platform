import type { MetadataRoute } from 'next'
import { isPubliclyIndexable } from '@/lib/environment'

/**
 * Generates robots.txt directives.
 * Not publicly indexable (holding, staging, preview, local): blocks all crawlers.
 * Live production: allows all except admin/API.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://privatetours.se'

  if (!isPubliclyIndexable()) {
    return {
      rules: { userAgent: '*', disallow: '/' },
    }
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
