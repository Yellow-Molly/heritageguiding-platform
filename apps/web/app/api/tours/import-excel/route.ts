/**
 * Tours Excel Import API Route
 * POST /api/tours/import-excel
 * Uploads and processes .xlsx file to create new tours
 * Requires admin authentication via Payload CMS session
 */

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@cms/payload.config'
import { importToursFromExcel } from '@cms/lib/excel'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

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
 * POST handler - import tours from Excel
 * Accepts multipart/form-data with 'file' field
 */
export async function POST(request: Request) {
  try {
    const isAdmin = await verifyAdminAccess()

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const dryRunParam = formData.get('dryRun')
    const dryRun = dryRunParam === 'true' || dryRunParam === '1'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      return NextResponse.json(
        { error: 'File must be an Excel file (.xlsx)' },
        { status: 400 }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await importToursFromExcel(buffer, { dryRun })

    return NextResponse.json({
      success: true,
      dryRun,
      ...result,
    })
  } catch (error) {
    console.error('[Tours Import] Excel import failed:', error)

    return NextResponse.json(
      {
        error: 'Import failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
