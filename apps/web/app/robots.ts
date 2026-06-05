import type { MetadataRoute } from 'next'
import { isProductionDeployment, isComingSoon } from '@/lib/environment'

/**
 * Generates robots.txt directives.
 * Non-production OR pre-launch holding: blocks all crawlers.
 * Live production: allows all except admin/API.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://privatetours.se'

  if (!isProductionDeployment() || isComingSoon()) {
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
