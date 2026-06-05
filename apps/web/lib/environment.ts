/**
 * Check if running on the live production site.
 * Returns false for staging (IS_STAGING=true), preview, and local development.
 *
 * Note: staging.privatetours.se is configured as a production domain in Vercel,
 * so VERCEL_ENV alone is insufficient — we also check the IS_STAGING env var.
 */
export function isProductionDeployment(): boolean {
  if (process.env.IS_STAGING === 'true') return false
  return process.env.VERCEL_ENV === 'production'
}

/**
 * Pre-launch holding state. True while the site is held on the "coming soon"
 * page — i.e. unless COMING_SOON is explicitly 'false' (fail-safe dark, mirrors
 * the redirect gate in next.config.ts). Crawl surfaces (robots, sitemap, llms)
 * consult this so a dark production deploy does not advertise live content.
 */
export function isComingSoon(): boolean {
  return process.env.COMING_SOON !== 'false'
}

/**
 * Whether crawlers should index this deployment. BUILD-RELIABLE: depends only on
 * COMING_SOON (set to 'false' on live prod) and IS_STAGING — NOT on VERCEL_ENV,
 * which is NOT 'production' during the Vercel build, so isProductionDeployment()
 * is wrong for build-time-static surfaces (robots.txt, sitemap.xml, noindex meta,
 * next.config headers). Reserve isProductionDeployment() for runtime-evaluated
 * code (env validation at boot, Sentry init).
 */
export function isPubliclyIndexable(): boolean {
  return !isComingSoon() && process.env.IS_STAGING !== 'true'
}
