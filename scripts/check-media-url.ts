import { getPayload, payloadConfig as config } from './payload-bootstrap'

async function main() {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'media', limit: 1, depth: 0 })
  const m = docs[0] as Record<string, unknown>
  console.log('ALL KEYS:', Object.keys(m))
  console.log('url:', m.url)
  console.log('thumbnailURL:', m.thumbnailURL)
  console.log('sizes:', JSON.stringify(m.sizes, null, 2))
  console.log('alt:', m.alt)
  console.log('filename:', m.filename)
  console.log('prefix:', m.prefix)
  process.exit(0)
}
main()
