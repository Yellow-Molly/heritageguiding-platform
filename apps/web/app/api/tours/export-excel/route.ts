/**
 * Tours Excel Export API Route
 * GET /api/tours/export-excel
 * Downloads all tours as .xlsx file with styled headers
 * Requires admin authentication via Payload CMS session
 */

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@cms/payload.config'
import { exportToursToExcel, generateExcelExportFilename } from '@cms/lib/excel'

/**
 * Verify admin access using Payload CMS authentication
 */
async function verifyAdminAccess(): Promise<boolean> {
  try {
    const payload = await getPayload({ config })
    const headersList = await headers()
    const { user } = await payload.auth({ headers: headersList })

    if (!user) {
      return false
    }

    return user.role === 'admin'
  } catch {
    return false
  }
}

/**
 * GET handler - export tours to Excel
 * Returns .xlsx file download with proper headers
 */
export async function GET() {
  try {
    const isAdmin = await verifyAdminAccess()

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const buffer = await exportToursToExcel()
    const filename = generateExcelExportFilename()

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('[Tours Export] Excel export failed:', error)

    return NextResponse.json(
      { error: 'Export failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
