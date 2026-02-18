import type { MetadataRoute } from 'next'

/**
 * Generates robots.txt directives.
 * Allows all crawlers (including AI: GPTBot, CCBot) except for admin/API paths.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://privatetours.se'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
