/**
 * Simple in-memory IP-based rate limiter for form submissions.
 * Tracks request counts per IP within a sliding window.
 * Suitable for MVP; replace with Redis/KV for multi-instance deployments.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

/** Clean expired entries periodically to prevent memory leaks */
const CLEANUP_INTERVAL_MS = 60_000
let lastCleanup = Date.now()

function cleanupExpired() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key)
  }
}

export interface RateLimitOptions {
  /** Max requests allowed in the window */
  maxRequests: number
  /** Window duration in milliseconds */
  windowMs: number
}

const DEFAULT_OPTIONS: RateLimitOptions = {
  maxRequests: 5,
  windowMs: 60_000, // 5 requests per minute
}

/**
 * Check if IP is rate-limited. Returns { success: true } if allowed.
 */
export function checkRateLimit(
  ip: string,
  options: RateLimitOptions = DEFAULT_OPTIONS
): { success: boolean } {
  cleanupExpired()

  const now = Date.now()
  const entry = store.get(ip)

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + options.windowMs })
    return { success: true }
  }

  if (entry.count >= options.maxRequests) {
    return { success: false }
  }

  entry.count++
  return { success: true }
}
