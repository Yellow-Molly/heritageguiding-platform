/**
 * Tours CSV Export API Route
 * GET /api/tours/export-csv
 * Downloads all tours as CSV file with UTF-8 BOM for Excel compatibility
 * Requires admin authentication via Payload CMS session
 */

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@cms/payload.config'
import { exportToursToCSV, generateExportFilename } from '@cms/lib/csv'

/**
 * Verify admin access using Payload CMS authentication
 * Checks for valid session cookie and admin role
 */
async function verifyAdminAccess(): Promise<boolean> {
  try {
    const payload = await getPayload({ config })
    const headersList = await headers()

    // Use Payload's auth to verify the user from session cookie
    const { user } = await payload.auth({ headers: headersList })

    if (!user) {
      return false
    }

    // Check if user has admin role
    return user.role === 'admin'
  } catch {
    return false
  }
}

/**
 * GET handler - export tours to CSV
 * Returns CSV file download with proper headers
 */
export async function GET() {
  try {
    // Verify admin access
    const isAdmin = await verifyAdminAccess()

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    // Generate CSV content
    const csv = await exportToursToCSV()
    const filename = generateExportFilename()

    // Return CSV file response
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('[Tours Export] CSV export failed:', error)

    return NextResponse.json(
      { error: 'Export failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
