/**
 * Preview the Bokun-side extras for a tour and diff them against CMS.
 *
 * GET /api/admin/bokun/extras-baseline-preview?tourId=<id>
 * Auth: Payload session cookie (admin role required) + same-origin only.
 *
 * Returns `DiffResult` (see diff-cms-bokun-extras). The UI uses this to show
 * the operator EXACTLY what the next sync would CREATE / UPDATE / DELETE
 * before they flip `bokunExtrasBaselineAt`.
 *
 * Read-only — no Bokun mutations.
 *
 * @see plans/260525-1417-bokun-extras-push-sync/phase-05-adopt-baseline-admin-ui.md
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@cms/payload.config'
import { getBokunClient, BokunError } from '@/lib/bokun/bokun-api-client-with-hmac-authentication'
import { diffCmsBokunExtras } from '@/lib/bokun/diff-cms-bokun-extras'

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
  if (!origin) {
    // Same-origin GET without Origin can happen on Safari; fall back to Referer.
    const referer = request.headers.get('referer')
    if (!referer) return false
    const expectedHost =
      request.headers.get('x-forwarded-host') || request.headers.get('host')
    if (!expectedHost) return false
    try {
      return new URL(referer).host === expectedHost
    } catch {
      return false
    }
  }
  const expectedHost =
    request.headers.get('x-forwarded-host') || request.headers.get('host')
  if (!expectedHost) return false
  try {
    return new URL(origin).host === expectedHost
  } catch {
    return false
  }
}

export async function GET(request: NextRequest) {
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

  const tourIdRaw = request.nextUrl.searchParams.get('tourId')
  if (!tourIdRaw) {
    return NextResponse.json({ error: 'tourId query param is required' }, { status: 400 })
  }
  const tourId = /^\d+$/.test(tourIdRaw) ? Number(tourIdRaw) : tourIdRaw

  let tour
  try {
    tour = await session.payload.findByID({
      collection: 'tours',
      id: tourId,
      depth: 0,
      locale: 'en',
    })
  } catch {
    return NextResponse.json({ error: 'Tour not found' }, { status: 404 })
  }

  const tourRecord = tour as unknown as {
    bokunExperienceId?: string | null
    optionalAddOns?: Array<{
      id?: string | number | null
      bokunExtraId?: string | null
      name?: string
    }>
  }
  const bokunExperienceId = tourRecord.bokunExperienceId?.trim()
  if (!bokunExperienceId) {
    return NextResponse.json(
      { error: 'Tour is not linked to a Bokun experience (bokunExperienceId is empty)' },
      { status: 422 }
    )
  }

  try {
    const client = getBokunClient()
    const bokunResp = await client.getExperienceExtras(bokunExperienceId)
    const diff = diffCmsBokunExtras(tourRecord.optionalAddOns, bokunResp.extras)
    return NextResponse.json({
      bokunExperienceId,
      diff: {
        inBoth: diff.inBoth.map((pair) => ({
          cmsRowId: pair.cms.id,
          cmsName: pair.cms.name,
          bokunId: pair.bokun.id,
          bokunTitle: pair.bokun.title,
        })),
        onlyInCms: diff.onlyInCms.map((row) => ({
          cmsRowId: row.id,
          cmsName: row.name,
          bokunExtraId: row.bokunExtraId,
        })),
        // Stale pointers — operator must clear `bokunExtraId` on these CMS rows
        // before adopting, or the sync's UPDATE-by-id attempt may 4xx.
        stalePointers: diff.stalePointers.map((row) => ({
          cmsRowId: row.id,
          cmsName: row.name,
          bokunExtraId: row.bokunExtraId,
        })),
        onlyInBokun: diff.onlyInBokun.map((extra) => ({
          bokunId: extra.id,
          bokunTitle: extra.title,
        })),
      },
    })
  } catch (err) {
    if (err instanceof BokunError) {
      session.payload.logger.error(
        { err, tourId, bokunExperienceId },
        '[extras-baseline-preview] Bokun GET failed'
      )
      return NextResponse.json(
        { error: `Bokun GET failed: HTTP ${err.status}` },
        { status: 502 }
      )
    }
    session.payload.logger.error(
      { err, tourId },
      '[extras-baseline-preview] unexpected error'
    )
    return NextResponse.json({ error: 'Preview failed' }, { status: 500 })
  }
}
