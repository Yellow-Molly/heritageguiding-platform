/**
 * One-time script to backfill blurDataUrl for existing media documents.
 * Run: npx tsx scripts/backfill-media-blur.ts
 *
 * Queries all media without blurDataUrl, generates blur from thumbnail,
 * and updates each document.
 */

import { getPayload } from 'payload'
import config from '../packages/cms/payload.config'
import sharp from 'sharp'

async function generateBlur(imageUrl: string): Promise<string | null> {
  if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) return null
  try {
    const response = await fetch(imageUrl)
    if (!response.ok) return null
    const buffer = Buffer.from(await response.arrayBuffer())
    const blurBuffer = await sharp(buffer)
      .resize(8, 6)
      .jpeg({ quality: 20 })
      .toBuffer()
    return `data:image/jpeg;base64,${blurBuffer.toString('base64')}`
  } catch {
    return null
  }
}

async function main() {
  const payload = await getPayload({ config })

  let page = 1
  let processed = 0
  let updated = 0

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const result = await payload.find({
      collection: 'media',
      where: {
        mimeType: { contains: 'image/' },
        blurDataUrl: { exists: false },
      },
      limit: 50,
      page,
      depth: 0,
    })

    if (result.docs.length === 0) break

    for (const doc of result.docs) {
      processed++
      const imageUrl =
        (doc as unknown as Record<string, unknown>).sizes &&
        ((doc as unknown as Record<string, unknown>).sizes as Record<string, { url?: string }>)?.thumbnail?.url
          ? ((doc as unknown as Record<string, unknown>).sizes as Record<string, { url?: string }>).thumbnail.url!
          : doc.url

      if (!imageUrl) {
        console.log(`  Skip ${doc.id} — no URL`)
        continue
      }

      const blur = await generateBlur(imageUrl)
      if (blur) {
        await payload.update({
          collection: 'media',
          id: doc.id,
          data: { blurDataUrl: blur } as Record<string, unknown>,
        })
        updated++
        console.log(`  Updated ${doc.id} (${doc.alt || 'no alt'})`)
      } else {
        console.log(`  Failed ${doc.id}`)
      }
    }

    if (!result.hasNextPage) break
    page++
  }

  console.log(`\nDone: ${processed} processed, ${updated} updated`)
  process.exit(0)
}

main().catch((err) => {
  console.error('Backfill failed:', err)
  process.exit(1)
})
