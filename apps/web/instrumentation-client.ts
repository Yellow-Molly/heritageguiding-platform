/**
 * Sentry init — browser (client) bundle.
 *
 * Auto-discovered by Next.js 16 as the client-side counterpart to
 * `instrumentation.ts`. Replaces the legacy `sentry.client.config.ts`.
 *
 * Uses NEXT_PUBLIC_SENTRY_DSN because the DSN must be inlined into the
 * client bundle. Session Replay is intentionally disabled (privacy + cost).
 */
import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN
const enabled = !!dsn && process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'

if (enabled) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    environment:
      process.env.NEXT_PUBLIC_IS_STAGING === 'true'
        ? 'staging'
        : process.env.NEXT_PUBLIC_VERCEL_ENV,
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
    // Browser-only noise we don't want to pay for.
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',
    ],
    // No Session Replay: privacy-by-default and our plan is to launch
    // without third-party trackers. See privacy policy stance.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  })
}

/**
 * Captures router transition timing for browser performance traces.
 * Required by Sentry to record client-side navigations; no-op when SDK
 * isn't initialised.
 */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
