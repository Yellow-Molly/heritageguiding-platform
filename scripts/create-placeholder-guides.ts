/** Create placeholder guide entries for tour import */
import { getPayload, payloadConfig as config } from './payload-bootstrap'

const GUIDE_SLUGS = [
  'stockholm-authorized-guide',
  'stockholm-authorized-guide-chauffeur-tour',
  'stockholm-authorized-guide-city-hall-walking-tour',
  'stockholm-authorized-guide-everyday-life-tour',
  'stockholm-authorized-guide-rib-skipper',
  'stockholm-authorized-guide-sigtuna-tour',
  'stockholm-authorized-guide-uppsala-tour',
  'stockholm-authorized-guide-walking-tour',
  'stockholm-authorized-guide-walking-tour-vasa-museum',
]

function slugToName(slug: string) {
  return slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

async function main() {
  const payload = await getPayload({ config })
  const { docs: existing } = await payload.find({ collection: 'guides', limit: 1000 })
  const existingSlugs = new Set(existing.map((g) => g.slug))
  for (const slug of GUIDE_SLUGS) {
    if (existingSlugs.has(slug)) { console.log('skip:', slug); continue }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await payload.create({ collection: 'guides', data: { name: slugToName(slug), slug, status: 'active', languages: ['sv', 'en'] } as any })
    console.log('+ created:', slug)
  }
  console.log('Done')
  process.exit(0)
}
main().catch((e) => { console.error(e); process.exit(1) })
