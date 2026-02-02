/**
 * Bokun availability API route
 * GET /api/bokun/availability?experienceId=xxx&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Returns cached availability data with 60-second TTL
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  getCachedBokunAvailability,
  groupAvailabilityByDate,
  BokunError,
} from '@/lib/bokun'

// Experience ID pattern (alphanumeric, hyphens, underscores only)
const EXPERIENCE_ID_REGEX = /^[a-zA-Z0-9_-]+$/

/**
 * Validate date string is a real calendar date (not just format)
 */
function isValidDate(dateStr: string): boolean {
  const [year, month, day] = dateStr.split('-').map(Number)
  if (!year || !month || !day) return false

  const date = new Date(year, month - 1, day)
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  )
}

/**
 * GET handler for fetching Bokun availability
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const experienceId = searchParams.get('experienceId')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  // Validate required parameters
  if (!experienceId || !startDate || !endDate) {
    return NextResponse.json(
      {
        error: 'Missing required parameters',
        details: 'experienceId, startDate, and endDate are required',
      },
      { status: 400 }
    )
  }

  // Sanitize experienceId - only allow safe characters
  if (!EXPERIENCE_ID_REGEX.test(experienceId) || experienceId.length > 100) {
    return NextResponse.json(
      {
        error: 'Invalid experienceId',
        details: 'experienceId must be alphanumeric (max 100 chars)',
      },
      { status: 400 }
    )
  }

  // Validate dates are real calendar dates
  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    return NextResponse.json(
      {
        error: 'Invalid date',
        details: 'Dates must be valid calendar dates in YYYY-MM-DD format',
      },
      { status: 400 }
    )
  }

  // Parse dates for range validation
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (start > end) {
    return NextResponse.json(
      {
        error: 'Invalid date range',
        details: 'startDate must be before or equal to endDate',
      },
      { status: 400 }
    )
  }

  // Limit date range to 90 days max
  const maxRange = 90 * 24 * 60 * 60 * 1000 // 90 days in ms
  if (end.getTime() - start.getTime() > maxRange) {
    return NextResponse.json(
      {
        error: 'Date range too large',
        details: 'Maximum date range is 90 days',
      },
      { status: 400 }
    )
  }

  try {
    // Fetch cached availability
    const availabilities = await getCachedBokunAvailability(
      experienceId,
      startDate,
      endDate
    )

    // Group by date for calendar display
    const grouped = groupAvailabilityByDate(availabilities)

    return NextResponse.json({
      success: true,
      experienceId,
      startDate,
      endDate,
      totalSlots: availabilities.length,
      availabilities,
      byDate: Object.fromEntries(grouped),
    })
  } catch (error) {
    console.error('[Bokun Availability API]', error)

    if (error instanceof BokunError) {
      // Return appropriate status based on Bokun error
      const status = error.status >= 400 && error.status < 600 ? error.status : 500

      return NextResponse.json(
        {
          error: error.message,
          code: error.errorCode,
        },
        { status }
      )
    }

    // Generic server error
    return NextResponse.json(
      {
        error: 'Failed to fetch availability',
        details: 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}
