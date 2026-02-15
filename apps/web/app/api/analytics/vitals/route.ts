/**
 * POST /api/analytics/vitals
 * Receives Core Web Vitals metrics from the client-side reporter.
 * Rate limited to prevent abuse. Logs metrics for monitoring.
 */

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { checkRateLimit } from '@/lib/rate-limit-by-ip'

/** Valid Web Vitals metric names */
const VALID_METRICS = new Set(['LCP', 'FID', 'CLS', 'TTFB', 'INP', 'FCP'])

/** Valid rating values */
const VALID_RATINGS = new Set(['good', 'needs-improvement', 'poor'])

interface VitalsPayload {
  name: string
  value: number
  rating: string
  id: string
  navigationType: string
}

/** Rate limit: 30 vitals reports per minute per IP */
const VITALS_RATE_LIMIT = { maxRequests: 30, windowMs: 60_000 }

export async function POST(request: Request) {
  try {
    // Rate limit by IP
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const { success } = checkRateLimit(`vitals:${ip}`, VITALS_RATE_LIMIT)
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    // Parse and validate payload
    const body = (await request.json()) as VitalsPayload

    if (!body.name || !VALID_METRICS.has(body.name)) {
      return NextResponse.json({ error: 'Invalid metric name' }, { status: 400 })
    }
    if (typeof body.value !== 'number' || !isFinite(body.value)) {
      return NextResponse.json({ error: 'Invalid metric value' }, { status: 400 })
    }
    if (body.rating && !VALID_RATINGS.has(body.rating)) {
      return NextResponse.json({ error: 'Invalid rating' }, { status: 400 })
    }

    // Log the metric (in production, forward to analytics service)
    console.info(
      `[WebVital] ${body.name}=${body.value.toFixed(2)} rating=${body.rating} nav=${body.navigationType}`
    )

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
}
