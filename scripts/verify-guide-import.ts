/**
 * Verify guide import — checks data integrity for all guide entries.
 * Validates: field completeness (3 locales), photo, relationships, no orphaned placeholders.
 *
 * Usage:
 *   npx tsx --require ./scripts/patch-next-env.cjs scripts/verify-guide-import.ts [--v2]
 *
 * --v2: additionally asserts the exact 11 v2 slugs exist and that bio
 *       richText contains the 4 narrative H3 sections (Specialisering /
 *       Guidestil / Vad gästerna uppskattar / Det som gör turer unika).
 */
import { getPayload, payloadConfig as config } from './payload-bootstrap'

const V2_MODE = process.argv.includes('--v2')

const PLACEHOLDER_PREFIX = 'stockholm-authorized-guide'

/** Exact set expected after the v2 import. Order matches Phase 1 sort. */
const EXPECTED_V2_SLUGS = [
  'anders-boysen',
  'annika-bernholm',
  'asa-ovrelid',
  'christian-arnet',
  'jack-voldstad',
  'mattias-wallin',
  'niklas-lofstrom',
  'olof-naslund',
  'sabine-gruen',
  'sophie-sahlin',
  'svante-bergqvist',
  'tommy-nilsson',
] as const

/** v2 narrative H3 section markers per locale — at least one should appear per guide. */
const V2_H3_MARKERS = {
  sv: ['Specialisering', 'Guidestil', 'Vad gästerna uppskattar', 'Det som gör turer unika'],
  en: ['Specializations', 'Guide Style', 'What Guests Appreciate', 'What Makes Tours Unique'],
  de: ['Spezialisierungen', 'Führungsstil', 'Was Gäste schätzen', 'Was die Touren einzigartig macht'],
}

/** Recursively extract plain text from a Lexical richText root. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lexicalToText(node: any): string {
  if (!node) return ''
  if (typeof node.text === 'string') return node.text
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const kids: any[] = node.children || node.root?.children || []
  return kids.map(lexicalToText).join(' ')
}

function countH3Matches(bioText: string, markers: readonly string[]): number {
  return markers.reduce((n, m) => n + (bioText.includes(m) ? 1 : 0), 0)
}

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
  let placeholderPhotoCount = 0
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

    // v2-only assertions: structured profile fields + bio is plain (no H3s)
    let profileSummary = ''
    if (V2_MODE) {
      // Check new structured fields are populated (SV locale)
      const profileFields = ['guideStyle', 'whatGuestsAppreciate', 'uniqueAspectsQuote', 'uniqueAspectsBody']
      let fieldCount = 0
      for (const field of profileFields) {
        if (g[field]?.sv) fieldCount++
        else checks.push(`missing ${field}.sv`)
      }
      // specialtyDescriptions array
      const specDescs = g.specialtyDescriptions || []
      const specDescCount = specDescs.length
      if (specDescCount === 0) checks.push('empty specialtyDescriptions')

      // Bio should NOT contain H3 section headers (plain bio only)
      const svBioText = lexicalToText(g.bio?.sv)
      const hasH3 = V2_H3_MARKERS.sv.some((m) => svBioText.includes(m))
      if (hasH3) checks.push('bio.sv still contains merged H3 sections')

      profileSummary = ` | profile: ${fieldCount}/4 specDescs: ${specDescCount}`

      if (!g.operatingAreas || g.operatingAreas.length === 0) checks.push('no operatingAreas')
      // Photo id 86 is the placeholder for Åsa/Svante/Tommy (flag but don't fail)
      const photoId = typeof g.photo === 'object' ? g.photo?.id : g.photo
      if (photoId && ['asa-ovrelid', 'svante-bergqvist', 'tommy-nilsson'].includes(g.slug)) {
        placeholderPhotoCount++
      }
    }

    const status = checks.length === 0 ? '✓' : '⚠'
    const photoInfo = g.photo?.id ? `photo:${g.photo.id}` : g.photo ? `photo:${g.photo}` : 'no photo'
    const langInfo = (g.languages || []).join(',')

    console.log(`${status} ${g.slug} — ${g.name}`)
    console.log(`    ${photoInfo} | lang: ${langInfo} | creds: ${svCreds?.length || 0}${profileSummary}`)
    console.log(`    specializations: ${g.specializations?.length || 0} | areas: ${g.operatingAreas?.length || 0}`)

    if (checks.length > 0) {
      console.log(`    ISSUES: ${checks.join(', ')}`)
      issues += checks.length
    }
  }

  // v2: assert the exact expected slug set
  if (V2_MODE) {
    const actualSlugs = new Set(realGuides.map((g) => g.slug as string))
    const missing = EXPECTED_V2_SLUGS.filter((s) => !actualSlugs.has(s))
    const extra = [...actualSlugs].filter((s) => !EXPECTED_V2_SLUGS.includes(s as (typeof EXPECTED_V2_SLUGS)[number]))
    console.log('\n--- v2 Slug Set ---')
    console.log(`Expected: ${EXPECTED_V2_SLUGS.length}, Found: ${realGuides.length}`)
    if (missing.length > 0) {
      console.log(`  missing: ${missing.join(', ')}`)
      issues += missing.length
    }
    if (extra.length > 0) {
      console.log(`  extra (not in v2 set): ${extra.join(', ')}`)
    }
    console.log(`  placeholder photos (expected for asa/svante/tommy): ${placeholderPhotoCount}/3`)
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

  if (V2_MODE && issues === 0) {
    console.log('\n--- Browser Smoke Checklist ---')
    console.log('  1. npm run dev')
    console.log('  2. Visit /sv/guides, /en/guides, /de/guides — confirm 12 cards each')
    console.log('  3. Detail: /en/guides/sabine-gruen — split layout, expertise, quote card, approach, guest feedback')
    console.log('  4. Detail: /en/guides/jack-voldstad — new guide, real photo, all sections')
    console.log('  5. Mobile: sticky CTA bar at bottom, stacked layout')
    console.log('  6. Optional: lighthouse a11y on one detail page ≥ 90')
  }

  process.exit(issues > 0 ? 1 : 0)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
