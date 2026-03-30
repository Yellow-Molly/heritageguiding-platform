import { readFile, stat } from 'fs/promises'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { REST_GET } from '@payloadcms/next/routes'
import config from '@payload-config'

/**
 * Media file server that tries local files first, then falls through to Payload.
 * - Localhost: serves from local media/ directory (Payload file handler broken in monorepo)
 * - Staging/Production: local file missing → delegates to Payload REST handler (Vercel Blob)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ filename: string }> }
) {
  const { filename } = await context.params

  // Prevent directory traversal
  if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
  }

  // Try local file first (works on localhost)
  const filePath = path.join(process.cwd(), 'media', filename)
  try {
    const [fileBuffer, fileStat] = await Promise.all([
      readFile(filePath),
      stat(filePath),
    ])

    const ext = path.extname(filename).toLowerCase()
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.avif': 'image/avif',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
    }

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': mimeTypes[ext] || 'application/octet-stream',
        'Content-Length': String(fileStat.size),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    // Local file not found — delegate to Payload REST handler (Vercel Blob on staging/prod)
    const payloadHandler = REST_GET(config)
    return payloadHandler(request, {
      params: Promise.resolve({ slug: ['media', 'file', filename] }),
    })
  }
}
