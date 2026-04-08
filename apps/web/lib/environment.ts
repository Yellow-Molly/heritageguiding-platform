/**
 * Check if running on Vercel production deployment.
 * Returns false for staging, preview, and local development (safe default).
 */
export function isProductionDeployment(): boolean {
  return process.env.VERCEL_ENV === 'production'
}
