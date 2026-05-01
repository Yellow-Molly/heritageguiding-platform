/**
 * Re-parent Sigtuna/Uppsala-area neighborhoods to their proper Cities.
 *
 * Background: when the catalogue was first imported, Sigtuna and Uppsala
 * existed only as neighborhoods under Stockholm. Phase 01 promotes them to
 * Cities; this script fixes the city pointer on the affected neighborhood
 * rows.
 *
 * Mälardalen stays under Stockholm — it's a regional/valley label that maps
 * naturally to the Stockholm metro area.
 *
 * Dry-run by default; pass --apply to actually write.
 *
 * Usage:
 *   npx tsx --require ./scripts/patch-next-env.cjs scripts/repair-neighborhood-cities.ts
 *   npx tsx --require ./scripts/patch-next-env.cjs scripts/repair-neighborhood-cities.ts --apply
 */
import { getPayload, payloadConfig as config } from './payload-bootstrap'

const APPLY = process.argv.includes('--apply')

const REPARENT_MAP: Record<string, string[]> = {
  // city slug → neighborhood slugs to reparent under it
  sigtuna: ['sigtuna'],
  uppsala: ['uppsala', 'gamla-uppsala', 'uppland'],
}

async function main() {
  console.log(`\n=== Repair Neighborhood Cities ${APPLY ? '(APPLY)' : '(DRY RUN)'} ===\n`)
  const payload = await getPayload({ config })

  let updated = 0
  let skipped = 0
  let missing = 0

  for (const [citySlug, hoodSlugs] of Object.entries(REPARENT_MAP)) {
    const { docs: cities } = await payload.find({
      collection: 'cities',
      where: { slug: { equals: citySlug } },
      limit: 1,
    })
    if (cities.length === 0) {
      console.error(`  ! city "${citySlug}" not found — run seed-sigtuna-uppsala-cities.ts first`)
      missing++
      continue
    }
    const cityId = cities[0].id

    for (const hoodSlug of hoodSlugs) {
      const { docs: hoods } = await payload.find({
        collection: 'neighborhoods',
        where: { slug: { equals: hoodSlug } },
        limit: 1,
      })
      if (hoods.length === 0) {
        console.log(`  - neighborhood "${hoodSlug}" not present (skip)`)
        missing++
        continue
      }
      const hood = hoods[0]
      const currentCityId =
        typeof hood.city === 'object' && hood.city !== null ? hood.city.id : hood.city

      if (currentCityId === cityId) {
        console.log(`  skip: "${hoodSlug}" already on city ${citySlug}`)
        skipped++
        continue
      }

      console.log(`  ${APPLY ? '+' : '~'} "${hoodSlug}": city ${currentCityId} -> ${cityId} (${citySlug})`)
      if (APPLY) {
        await payload.update({
          collection: 'neighborhoods',
          id: hood.id,
          data: { city: cityId },
        })
      }
      updated++
    }
  }

  console.log(`\nSummary: ${updated} ${APPLY ? 'updated' : 'would update'}, ${skipped} skipped, ${missing} missing`)
  if (!APPLY) console.log('\n(Re-run with --apply to write changes.)')
  process.exit(0)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
