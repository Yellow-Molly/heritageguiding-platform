/**
 * On-demand cache revalidation endpoint.
 * Revalidates Next.js unstable_cache tags (tours, categories, guides).
 *
 * Usage:
 *   POST /api/revalidate?secret=<REVALIDATION_SECRET>&tag=tours
 *   POST /api/revalidate?secret=<REVALIDATION_SECRET>&tag=all
 */
import { revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit-by-ip'

const VALID_TAGS = ['tours', 'categories', 'guides', 'cities'] as const

// Defense-in-depth: even with secret-auth, cap requests/min/IP to slow brute-force
// guessing of REVALIDATION_SECRET. Legitimate use (CMS afterChange hooks) fires
// only a handful of requests per minute.
const REVALIDATE_RATE_LIMIT = { maxRequests: 10, windowMs: 60_000 }

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const { success } = checkRateLimit(`revalidate:${ip}`, REVALIDATE_RATE_LIMIT)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const secret = request.nextUrl.searchParams.get('secret')
  const tag = request.nextUrl.searchParams.get('tag')

  // Validate secret (falls back to PAYLOAD_SECRET if no dedicated env var)
  const expectedSecret = process.env.REVALIDATION_SECRET || process.env.PAYLOAD_SECRET
  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 })
  }

  if (!tag) {
    return NextResponse.json({ error: 'Missing tag parameter' }, { status: 400 })
  }

  // Revalidate all tags or a specific one.
  // Next.js 16 requires a cache-life profile as the second arg.
  // `{ expire: 0 }` is the documented way to force immediate hard
  // invalidation — named profiles like 'max' only trigger SWR with
  // long TTLs, which isn't what callers of this endpoint expect.
  const HARD_EXPIRE = { expire: 0 } as const
  if (tag === 'all') {
    for (const t of VALID_TAGS) {
      revalidateTag(t, HARD_EXPIRE)
    }
    return NextResponse.json({ revalidated: VALID_TAGS, now: Date.now() })
  }

  if (!VALID_TAGS.includes(tag as (typeof VALID_TAGS)[number])) {
    return NextResponse.json({ error: `Invalid tag. Valid: ${VALID_TAGS.join(', ')}, all` }, { status: 400 })
  }

  revalidateTag(tag, HARD_EXPIRE)
  return NextResponse.json({ revalidated: [tag], now: Date.now() })
}
