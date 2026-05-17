/**
 * Sentry init — Edge runtime (middleware, edge API routes).
 *
 * Loaded by `instrumentation.ts` when NEXT_RUNTIME === 'edge'.
 *
 * Edge runtime is constrained (no fs, no node:*), so the Sentry SDK uses a
 * smaller integration set automatically. Same DSN + gating as the server
 * config — see sentry.server.config.ts for rationale.
 */
import * as Sentry from '@sentry/nextjs'

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN
const enabled = !!dsn && process.env.VERCEL_ENV === 'production'

if (enabled) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    environment:
      process.env.IS_STAGING === 'true'
        ? 'staging'
        : (process.env.VERCEL_ENV ?? process.env.NODE_ENV),
    release: process.env.SENTRY_RELEASE,
    ignoreErrors: ['AbortError', 'NEXT_NOT_FOUND', 'NEXT_REDIRECT'],
  })
}
