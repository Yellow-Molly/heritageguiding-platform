/**
 * Next.js instrumentation entry — runs once per server worker at boot.
 *
 * Forces env validation (`@/lib/env`) to execute at startup so misconfiguration
 * fails fast with a clear error, instead of crashing at the first request with
 * an opaque `undefined`.
 */
export async function register() {
  if (
    process.env.NEXT_RUNTIME === 'nodejs' ||
    process.env.NEXT_RUNTIME === 'edge'
  ) {
    await import('./lib/env')
  }
}
