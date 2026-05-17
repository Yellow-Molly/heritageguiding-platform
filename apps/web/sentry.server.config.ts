/**
 * Sentry init — Node.js runtime (server components, API routes, server actions).
 *
 * Loaded by `instrumentation.ts` when NEXT_RUNTIME === 'nodejs'.
 *
 * Env-gated: skipped entirely when no DSN is configured. Activates on Vercel
 * production deployments (including the staging branch, which Vercel treats
 * as production); local dev and preview deployments stay silent.
 */
import * as Sentry from '@sentry/nextjs'

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN
const enabled = !!dsn && process.env.VERCEL_ENV === 'production'

if (enabled) {
  Sentry.init({
    dsn,
    // Trace sampling — keep low for cost control; raise per-release if needed.
    tracesSampleRate: 0.1,
    // Distinguish staging from production in the Sentry UI.
    environment:
      process.env.IS_STAGING === 'true'
        ? 'staging'
        : (process.env.VERCEL_ENV ?? process.env.NODE_ENV),
    // Tie events to a deploy. CI should set SENTRY_RELEASE (e.g. to the
    // Vercel commit SHA) for source-map symbolication.
    release: process.env.SENTRY_RELEASE,
    // Drop noisy known-safe errors before they bill against the quota.
    ignoreErrors: [
      'AbortError',
      'NEXT_NOT_FOUND',
      'NEXT_REDIRECT',
    ],
  })
}
