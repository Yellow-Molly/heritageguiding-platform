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
