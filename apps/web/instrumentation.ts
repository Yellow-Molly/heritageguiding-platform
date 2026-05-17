/**
 * Next.js instrumentation entry — runs once per server worker at boot.
 *
 * Two responsibilities:
 *  1. Force env validation (`@/lib/env`) so misconfiguration fails fast with
 *     a clear error instead of crashing at the first request.
 *  2. Initialise Sentry per runtime. The runtime-specific config is a no-op
 *     when DSN is unset, so dev / preview deploys stay silent.
 */
import * as Sentry from '@sentry/nextjs'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./lib/env')
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./lib/env')
    await import('./sentry.edge.config')
  }
}

/**
 * Capture errors from `nested-react-server-components` and Server Actions.
 * Sentry's recommended App Router hook (replaces manual error boundaries
 * for server-side request errors).
 */
export const onRequestError = Sentry.captureRequestError
