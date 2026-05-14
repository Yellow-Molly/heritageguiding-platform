/**
 * Admin-only manual Bokun sync trigger.
 *
 * POST /api/admin/bokun/sync-tour
 * Body: { tourId: number | string }
 * Auth: Payload session cookie (admin role required).
 *
 * Enqueues a `syncTourToBokun` job for the given tour id. The job runs the same
 * pipeline as the auto-fired afterChange hook (Phase 05), so this is purely a
 * "do it now" button — no special-case logic.
 *
 * @see plans/260514-1437-bokun-integration/phase-06-admin-ui-manual-sync.md
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@cms/payload.config'

async function getAdminUser() {
  try {
    const payload = await getPayload({ config })
    const headersList = await headers()
    const { user } = await payload.auth({ headers: headersList })
    if (!user || user.role !== 'admin') return null
    return { user, payload }
  } catch {
    return null
  }
}

/**
 * CSRF defense: reject cross-origin POSTs.
 * Browser-issued cross-site fetches always send Origin; missing or mismatched origin
 * means the request is forged or scripted from a foreign tab. SameSite=Lax cookies
 * do NOT block POSTs, so this header check is the load-bearing protection.
 */
function isAllowedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const expected = process.env.NEXT_PUBLIC_SITE_URL
  if (!origin || !expected) return false
  try {
    return new URL(origin).host === new URL(expected).host
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  if (!isAllowedOrigin(request)) {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
  }

  const session = await getAdminUser()
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized - admin access required' },
      { status: 401 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const tourId = (body as { tourId?: unknown })?.tourId
  if (typeof tourId !== 'number' && typeof tourId !== 'string') {
    return NextResponse.json(
      { error: 'tourId is required (number or string)' },
      { status: 400 }
    )
  }

  try {
    // Cast: generated payload-types.ts has `jobs.tasks: unknown` until the dev server
    // boots once with the syncTourToBokun task registered and regenerates types.
    const job = (await session.payload.jobs.queue({
      task: 'syncTourToBokun',
      input: { tourId },
    } as Parameters<typeof session.payload.jobs.queue>[0])) as { id?: string | number }

    // Drain the queue inline so the manual button gives immediate feedback.
    // Payload Jobs `autoRun` cron is not configured (Vercel serverless cannot
    // host an in-process scheduler), and we have no Vercel Cron hitting a
    // runner endpoint yet — without this call, the just-queued job would sit
    // indefinitely. Synchronous run is safe: the sync task is short
    // (<10s typically) and well under the function timeout.
    await session.payload.jobs.run({ queue: 'default', limit: 5 })

    return NextResponse.json({ ok: true, jobId: job?.id ?? null })
  } catch (err) {
    session.payload.logger.error(
      { err, tourId },
      '[admin/bokun/sync-tour] failed to enqueue or run job'
    )
    return NextResponse.json({ error: 'Failed to enqueue sync job' }, { status: 500 })
  }
}
