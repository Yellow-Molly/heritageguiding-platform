/**
 * Phase 5: Verify tour import — checks data integrity across all collections
 */
import { getPayload, payloadConfig as config } from './payload-bootstrap'

async function main() {
  const payload = await getPayload({ config })

  console.log('\n=== Phase 5: Verification ===\n')

  // Counts
  const { totalDocs: tourCount } = await payload.find({ collection: 'tours', limit: 0 })
  const { totalDocs: mediaCount } = await payload.find({ collection: 'media', limit: 0 })
  const { totalDocs: catCount } = await payload.find({ collection: 'categories', limit: 0 })
  const { totalDocs: hoodCount } = await payload.find({ collection: 'neighborhoods', limit: 0 })
  const { totalDocs: guideCount } = await payload.find({ collection: 'guides', limit: 0 })

  console.log('--- Collection Counts ---')
  console.log(`Tours: ${tourCount}`)
  console.log(`Media: ${mediaCount}`)
  console.log(`Categories: ${catCount}`)
  console.log(`Neighborhoods: ${hoodCount}`)
  console.log(`Guides: ${guideCount}`)

  // Check each tour
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { docs: tours } = await payload.find({ collection: 'tours', limit: 100, locale: 'all' as any, depth: 1 })

  console.log('\n--- Tour Verification ---')
  let issues = 0

  for (const tour of tours) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t = tour as any
    const checks: string[] = []

    // Check localized fields
    if (!t.title?.sv) checks.push('missing title.sv')
    if (!t.title?.en) checks.push('missing title.en')
    if (!t.title?.de) checks.push('missing title.de')
    if (!t.shortDescription?.sv) checks.push('missing shortDescription.sv')
    if (!t.description?.sv?.root?.children?.length) checks.push('missing description.sv')
    if (!t.description?.en?.root?.children?.length) checks.push('missing description.en')

    // Check relationships
    if (!t.guide) checks.push('missing guide')
    if (!t.categories?.length) checks.push('no categories')
    if (!t.neighborhoods?.length) checks.push('no neighborhoods')
    if (!t.images?.length) checks.push('no images')
    else {
      const hasPrimary = t.images.some((i: { isPrimary?: boolean }) => i.isPrimary)
      if (!hasPrimary) checks.push('no primary/hero image')
    }

    // Check SEO
    if (!t.seo?.metaTitle?.sv) checks.push('missing seo.metaTitle')
    if (!t.seo?.metaDescription?.sv) checks.push('missing seo.metaDescription')

    // Check pricing
    if (!t.pricing?.basePrice) checks.push('missing basePrice')

    const status = checks.length === 0 ? '✓' : '⚠'
    const imgCount = t.images?.length || 0
    const catNames = t.categories?.map((c: { slug?: string }) => c?.slug || '?').join(', ') || 'none'

    console.log(`${status} ${t.slug}`)
    console.log(`    title.en: ${t.title?.en?.substring(0, 60)}`)
    console.log(`    images: ${imgCount} | guide: ${t.guide?.slug || t.guide} | cats: ${catNames}`)

    if (checks.length > 0) {
      console.log(`    ISSUES: ${checks.join(', ')}`)
      issues += checks.length
    }
  }

  console.log(`\n--- Summary ---`)
  console.log(`Tours verified: ${tours.length}`)
  console.log(`Issues found: ${issues}`)
  console.log(`Status: ${issues === 0 ? 'ALL GOOD' : 'NEEDS ATTENTION'}`)

  process.exit(issues > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
