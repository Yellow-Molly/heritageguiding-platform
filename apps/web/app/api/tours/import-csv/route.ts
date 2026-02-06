/**
 * Tours CSV Import API Route
 * POST /api/tours/import-csv
 * Uploads and processes CSV file to create new tours
 * Requires admin authentication via Payload CMS session
 */

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@cms/payload.config'
import { importToursFromCSV } from '@cms/lib/csv'

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
 * POST handler - import tours from CSV
 * Accepts multipart/form-data with 'file' field
 */
export async function POST(request: Request) {
  try {
    // Verify admin access
    const isAdmin = await verifyAdminAccess()

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    // Parse form data
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

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      return NextResponse.json(
        { error: 'File must be a CSV (.csv)' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Read file content
    const csvContent = await file.text()

    // Process import
    const result = await importToursFromCSV(csvContent, { dryRun })

    return NextResponse.json({
      success: true,
      dryRun,
      ...result,
    })
  } catch (error) {
    console.error('[Tours Import] CSV import failed:', error)

    return NextResponse.json(
      {
        error: 'Import failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
