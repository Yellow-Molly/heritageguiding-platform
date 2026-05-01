/**
 * Seed Sigtuna and Uppsala as first-class Cities.
 *
 * Idempotent: looks up by slug; creates only if missing. Coordinates included
 * for completeness; descriptions left empty (editorial owns those later).
 *
 * Usage:
 *   npx tsx --require ./scripts/patch-next-env.cjs scripts/seed-sigtuna-uppsala-cities.ts
 */
import { getPayload, payloadConfig as config } from './payload-bootstrap'

interface CitySeed {
  slug: string
  name: string
  country: string
  coordinates: [number, number] // [lng, lat]
}

const CITIES: CitySeed[] = [
  { slug: 'sigtuna', name: 'Sigtuna', country: 'Sweden', coordinates: [17.7242, 59.6173] },
  { slug: 'uppsala', name: 'Uppsala', country: 'Sweden', coordinates: [17.6389, 59.8586] },
]

async function main() {
  console.log('\n=== Seed Sigtuna + Uppsala Cities ===\n')
  const payload = await getPayload({ config })

  let created = 0
  let skipped = 0

  for (const seed of CITIES) {
    const { docs } = await payload.find({
      collection: 'cities',
      where: { slug: { equals: seed.slug } },
      limit: 1,
    })

    if (docs.length > 0) {
      console.log(`  skip: "${seed.slug}" already exists (id: ${docs[0].id})`)
      skipped++
      continue
    }

    const city = await payload.create({
      collection: 'cities',
      data: {
        name: seed.name,
        slug: seed.slug,
        country: seed.country,
        coordinates: seed.coordinates,
      },
    })
    console.log(`  + created: "${seed.slug}" -> "${seed.name}" (id: ${city.id})`)
    created++
  }

  console.log(`\nSummary: ${created} created, ${skipped} skipped\n`)
  process.exit(0)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
