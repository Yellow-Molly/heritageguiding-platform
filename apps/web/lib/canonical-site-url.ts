/**
 * Canonical public origin — single source of truth for every absolute URL the
 * site emits: canonical tags, hreflang alternates, sitemap entries, the
 * robots.txt Sitemap directive, schema.org JSON-LD and Open Graph metadata.
 *
 * The fallback MUST match the host Vercel actually serves. `www` is the primary
 * domain and the apex 308-redirects to it, so emitting the apex here makes every
 * canonical URL we advertise a redirect — which dilutes crawl budget and muddies
 * hreflang clustering across the three locales. Defaulting to the apex was a live
 * SEO defect found on 2026-10-10.
 *
 * Do NOT "fix" a host mismatch by adding a www-to-apex redirect in next.config:
 * Vercel already owns apex-to-www at the domain layer and a counter-rule produces
 * an infinite redirect loop.
 *
 * Read at call time rather than captured in a module constant so tests can stub
 * the environment, and so a server render always reflects current configuration.
 */

/** Used when NEXT_PUBLIC_SITE_URL is unset. Must be the real serving host. */
export const CANONICAL_SITE_URL_FALLBACK = 'https://www.privatetours.se'

/**
 * The canonical origin, without a trailing slash.
 *
 * Trailing slashes are stripped so callers can always concatenate a rooted path
 * (`${getCanonicalSiteUrl()}/sv/tours`) without producing a double slash if the
 * environment variable happens to be set with one.
 */
export function getCanonicalSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  const origin = configured || CANONICAL_SITE_URL_FALLBACK
  return origin.replace(/\/+$/, '')
}
