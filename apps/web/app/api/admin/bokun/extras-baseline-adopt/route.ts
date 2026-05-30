/**
 * Flip the per-tour `bokunExtrasBaselineAt` flag → enables Phase-2 extras push
 * on subsequent saves for this tour.
 *
 * POST /api/admin/bokun/extras-baseline-adopt
 * Body: { tourId: number | string }
 * Auth: Payload session cookie (admin role required) + same-origin only.
 *
 * Sets `bokunExtrasBaselineAt = now()` via `payload.update` with
 * `context: { skipBokunSync: true }` so adoption itself does NOT trigger an
 * immediate push (operator can still review + edit before saving the tour).
 *
 * Idempotent — re-running just refreshes the timestamp ("re-baseline" flow).
 *
 * @see plans/260525-1417-bokun-extras-push-sync/phase-05-adopt-baseline-admin-ui.md
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@cms/payload.config'
import { writeBokunExtrasBaselineViaSql } from '@cms/lib/bokun-sync-sql-writes'

async function getAdminSession() {
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

  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized — admin access required' },
      { status: 401 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const tourIdRaw = (body as { tourId?: unknown })?.tourId
  if (typeof tourIdRaw !== 'number' && typeof tourIdRaw !== 'string') {
    return NextResponse.json(
      { error: 'tourId is required (number or string)' },
      { status: 400 }
    )
  }
  const tourId =
    typeof tourIdRaw === 'string' && /^\d+$/.test(tourIdRaw)
      ? Number(tourIdRaw)
      : tourIdRaw

  try {
    const baselineAt = new Date().toISOString()
    // Direct SQL — payload.update would run full-document validation and trip
    // on the existing localized `optionalAddOns[].name` (validation locale
    // mismatch). Bypass entirely; this column is a non-localized timestamp on
    // the `tours` table. See `writeBokunExtrasBaselineViaSql` for the why.
    const affected = await writeBokunExtrasBaselineViaSql(
      session.payload as never,
      tourId,
      baselineAt
    )
    if (affected === 0) {
      // No row matched — bad/stale tourId. Don't report success on a no-op
      // (the flag enables destructive prod pushes; silent ok would mislead).
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 })
    }
    return NextResponse.json({ ok: true, baselineAt })
  } catch (err) {
    session.payload.logger.error(
      { err, tourId },
      '[extras-baseline-adopt] update failed'
    )
    return NextResponse.json({ error: 'Failed to set baseline' }, { status: 500 })
  }
}
