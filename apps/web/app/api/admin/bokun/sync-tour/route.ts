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
import { runBokunSyncForTour } from '@cms/lib/bokun-sync-job'

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
 *
 * Self-referencing same-origin: compare Origin.host to the request's own Host
 * header (or X-Forwarded-Host on Vercel). This works on staging, production,
 * and localhost without depending on an env var being set per environment.
 */
function isAllowedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return false
  const expectedHost =
    request.headers.get('x-forwarded-host') || request.headers.get('host')
  if (!expectedHost) return false
  try {
    return new URL(origin).host === expectedHost
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
    // Call the sync logic directly rather than via payload.jobs.queue + run.
    // The `payload_jobs` table is not yet provisioned on this DB (no migration
    // exists for it), so going through the Jobs Queue would fail with
    // `relation "payload_jobs" does not exist`. Direct invocation also gives
    // immediate feedback to the operator clicking "Sync to Bokun now"; retries
    // are unnecessary for a manual trigger (user can click again on failure).
    const output = await runBokunSyncForTour(session.payload, tourId)
    return NextResponse.json({ ok: true, ...output })
  } catch (err) {
    session.payload.logger.error(
      { err, tourId },
      '[admin/bokun/sync-tour] sync failed with transient error'
    )
    return NextResponse.json({ error: 'Sync failed (transient)' }, { status: 500 })
  }
}
