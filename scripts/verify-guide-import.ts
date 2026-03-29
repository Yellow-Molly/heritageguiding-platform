/**
 * Verify guide import — checks data integrity for all guide entries.
 * Validates: field completeness (3 locales), photo, relationships, no orphaned placeholders.
 *
 * Usage:
 *   npx tsx --require ./scripts/patch-next-env.cjs scripts/verify-guide-import.ts
 */
import { getPayload, payloadConfig as config } from './payload-bootstrap'

const PLACEHOLDER_PREFIX = 'stockholm-authorized-guide'

async function main() {
  const payload = await getPayload({ config })

  console.log('\n=== Guide Import Verification ===\n')

  // Collection counts
  const { totalDocs: guideCount } = await payload.find({ collection: 'guides', limit: 0 })
  const { totalDocs: tourCount } = await payload.find({ collection: 'tours', limit: 0 })
  console.log(`Guides: ${guideCount} | Tours: ${tourCount}`)

  // Fetch all guides with all locales
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { docs: guides } = await payload.find({ collection: 'guides', limit: 100, locale: 'all' as any, depth: 1 })

  console.log('\n--- Guide Verification ---')
  let issues = 0

  // Check for leftover placeholders
  const placeholders = guides.filter((g) => g.slug?.startsWith(PLACEHOLDER_PREFIX))
  if (placeholders.length > 0) {
    console.log(`\n⚠ ${placeholders.length} placeholder guide(s) still exist:`)
    for (const p of placeholders) {
      console.log(`    - ${p.slug}`)
      issues++
    }
  }

  // Verify each non-placeholder guide
  const realGuides = guides.filter((g) => !g.slug?.startsWith(PLACEHOLDER_PREFIX))
  for (const guide of realGuides) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = guide as any
    const checks: string[] = []

    // Name and slug
    if (!g.name) checks.push('missing name')
    if (!g.slug) checks.push('missing slug')

    // Bio (localized richText)
    if (!g.bio?.sv?.root?.children?.length) checks.push('missing bio.sv')
    if (!g.bio?.en?.root?.children?.length) checks.push('missing bio.en')
    if (!g.bio?.de?.root?.children?.length) checks.push('missing bio.de')

    // Credentials (array with localized inner text)
    const svCreds = g.credentials
    if (!svCreds || svCreds.length === 0) checks.push('no credentials')

    // Photo
    if (!g.photo) checks.push('missing photo')

    // Languages
    if (!g.languages || g.languages.length === 0) checks.push('no languages')

    const status = checks.length === 0 ? '✓' : '⚠'
    const photoInfo = g.photo?.id ? `photo:${g.photo.id}` : g.photo ? `photo:${g.photo}` : 'no photo'
    const langInfo = (g.languages || []).join(',')

    console.log(`${status} ${g.slug} — ${g.name}`)
    console.log(`    ${photoInfo} | lang: ${langInfo} | creds: ${svCreds?.length || 0}`)
    console.log(`    specializations: ${g.specializations?.length || 0} | areas: ${g.operatingAreas?.length || 0}`)

    if (checks.length > 0) {
      console.log(`    ISSUES: ${checks.join(', ')}`)
      issues += checks.length
    }
  }

  // Tour → guide relationship check
  console.log('\n--- Tour→Guide Relationships ---')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { docs: tours } = await payload.find({ collection: 'tours', limit: 1000, depth: 1 })

  let tourIssues = 0
  for (const tour of tours) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t = tour as any
    const guideRef = t.guide
    const guideSlug = guideRef?.slug || null
    const isPlaceholder = guideSlug?.startsWith(PLACEHOLDER_PREFIX)

    if (!guideRef) {
      console.log(`  ⚠ ${t.slug}: no guide assigned`)
      tourIssues++
    } else if (isPlaceholder) {
      console.log(`  ⚠ ${t.slug}: still references placeholder "${guideSlug}"`)
      tourIssues++
    } else {
      console.log(`  ✓ ${t.slug} → ${guideSlug}`)
    }
  }
  issues += tourIssues

  // Summary
  console.log('\n--- Summary ---')
  console.log(`Real guides: ${realGuides.length}`)
  console.log(`Placeholders remaining: ${placeholders.length}`)
  console.log(`Tours verified: ${tours.length}`)
  console.log(`Issues found: ${issues}`)
  console.log(`Status: ${issues === 0 ? 'ALL GOOD ✓' : 'NEEDS ATTENTION ⚠'}`)

  process.exit(issues > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
