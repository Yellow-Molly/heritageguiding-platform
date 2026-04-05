/**
 * afterChange hook for Media collection.
 * Generates a tiny blur placeholder (8x6 JPEG base64) on image upload.
 * Stores result in blurDataUrl field for frontend blur placeholders.
 */

import type { CollectionAfterChangeHook } from 'payload'
import sharp from 'sharp'

export const generateBlurOnUploadHook: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
}) => {
  // Skip non-image MIME types
  if (doc.mimeType && !doc.mimeType.startsWith('image/')) return doc

  // Skip if blurDataUrl already exists on update
  if (doc.blurDataUrl && operation === 'update') return doc

  const imageUrl = doc.sizes?.thumbnail?.url || doc.url
  if (!imageUrl || typeof imageUrl !== 'string') return doc

  // Only fetch absolute HTTP(S) URLs to prevent SSRF on relative paths
  if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) return doc

  try {
    const response = await fetch(imageUrl)
    if (!response.ok) return doc

    const buffer = Buffer.from(await response.arrayBuffer())
    const blurBuffer = await sharp(buffer)
      .resize(8, 6)
      .jpeg({ quality: 20 })
      .toBuffer()
    const blurDataUrl = `data:image/jpeg;base64,${blurBuffer.toString('base64')}`

    // Update the document with blur data (pass req to avoid recursive hook trigger)
    // Cast data to bypass strict types — blurDataUrl field exists but types need regeneration
    await req.payload.update({
      collection: 'media',
      id: doc.id,
      data: { blurDataUrl } as Record<string, unknown>,
      req,
    })
  } catch (error) {
    req.payload.logger.warn(`Blur generation failed for media ${doc.id}: ${error}`)
  }

  return doc
}
