/**
 * One-shot ETL: transform the CMS tour export (docx/tours-2026-05-15.xlsx)
 * into a Bokun bulk-import xlsx matching docx/Bokun-template.xlsx structure.
 *
 * Usage:
 *   npx tsx scripts/generate-bokun-import.ts \
 *     [--input docx/tours-2026-05-15.xlsx] \
 *     [--template docx/Bokun-template.xlsx] \
 *     [--output docx/bokun-import-<YYYY-MM-DD>.xlsx] \
 *     [--image-base https://privatetours.se] \
 *     [--dry-run] [--verbose]
 *
 * See: plans/260515-2013-bokun-import-spreadsheet-generation/
 */

import path from 'path'
import { readCmsTourExport } from './lib/bokun-import-reader'
import { mapTourToBokunRows } from './lib/bokun-import-mapper'
import { writeBokunImportXlsx } from './lib/bokun-import-writer'
import { BOKUN_DEFAULTS } from './lib/bokun-import-defaults'

interface Args {
  input: string
  template: string
  output: string
  imageBase: string
  dryRun: boolean
  verbose: boolean
}

function parseArgs(argv: string[]): Args {
  const get = (flag: string): string | undefined =>
    argv.find((a) => a.startsWith(`${flag}=`))?.split('=')[1]

  const today = new Date().toISOString().slice(0, 10)
  return {
    input: get('--input') ?? 'docx/tours-2026-05-15.xlsx',
    template: get('--template') ?? 'docx/Bokun-template.xlsx',
    output: get('--output') ?? `docx/bokun-import-${today}.xlsx`,
    imageBase: get('--image-base') ?? BOKUN_DEFAULTS.imageBaseUrl,
    dryRun: argv.includes('--dry-run'),
    verbose: argv.includes('--verbose'),
  }
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2))
  const cwd = process.cwd()
  const inputAbs = path.resolve(cwd, args.input)
  const templateAbs = path.resolve(cwd, args.template)
  const outputAbs = path.resolve(cwd, args.output)

  console.log('Bokun import generator')
  console.log(`  Input    : ${args.input}`)
  console.log(`  Template : ${args.template}`)
  console.log(`  Output   : ${args.output}`)
  console.log(`  ImageBase: ${args.imageBase}`)
  console.log(`  Dry run  : ${args.dryRun}`)
  console.log('')

  // 1. Read CMS export.
  let tours
  try {
    tours = await readCmsTourExport({ filePath: inputAbs })
  } catch (err) {
    console.error(`✗ Failed to read CMS export: ${(err as Error).message}`)
    process.exit(1)
  }
  console.log(`✓ Read ${tours.length} published tours from CMS export`)

  if (tours.length === 0) {
    console.error('✗ No published tours found — aborting')
    process.exit(1)
  }

  // 2. Transform.
  const bundles = tours.map((t) => mapTourToBokunRows(t, { imageBaseUrl: args.imageBase }))
  console.log(`✓ Mapped ${bundles.length} tours to Bokun row bundles`)

  // 3. Summary table.
  console.log('')
  console.log('Per-tour summary:')
  let totalPhotos = 0
  for (const b of bundles) {
    const photos = b.photos.length
    totalPhotos += photos
    const coordsLabel = b.meetingPoint.latitude === '' ? '(no coords)' : '✓ coords'
    const cityLabel = b.meetingPoint.city
    if (args.verbose || args.dryRun) {
      console.log(
        `  • ${b.product.productCode.padEnd(60)} ` +
          `photos:${String(photos).padStart(2)}  ${coordsLabel.padEnd(11)}  city:${cityLabel}`
      )
    }
  }

  console.log('')
  console.log(`Totals: products=${bundles.length}  pricing=${bundles.length}  ` +
    `rates=${bundles.length}  photos=${totalPhotos}  meetingPoints=${bundles.length}`)

  // 4. Write or skip.
  if (args.dryRun) {
    console.log('')
    console.log('[dry-run] Skipping xlsx write')
    return
  }

  try {
    const counts = await writeBokunImportXlsx({
      templatePath: templateAbs,
      outputPath: outputAbs,
      bundles,
    })
    console.log('')
    console.log(`✓ Wrote ${args.output}`)
    console.log(
      `  Rows written: Products=${counts.productRows}  ` +
        `Pricing categories=${counts.pricingRows}  Rates=${counts.rateRows}  ` +
        `Photos=${counts.photoRows}  Meeting points=${counts.meetingPointRows}`
    )
  } catch (err) {
    console.error(`✗ Write failed: ${(err as Error).message}`)
    process.exit(1)
  }

  // 5. Post-write validation (lightweight — file structure only).
  const validationErrors: string[] = []
  const slugs = new Set<string>()
  for (const b of bundles) {
    if (slugs.has(b.product.productCode)) {
      validationErrors.push(`Duplicate product code: ${b.product.productCode}`)
    }
    slugs.add(b.product.productCode)
    if (!b.product.title) validationErrors.push(`${b.product.productCode}: missing title`)
    if (!b.meetingPoint.title) validationErrors.push(`${b.product.productCode}: missing meeting point title`)
    const totalMinutes = b.product.durationHours * 60 + b.product.durationMinutes
    if (totalMinutes <= 0) validationErrors.push(`${b.product.productCode}: duration is zero`)
    for (const p of b.photos) {
      try {
        new URL(p.photoUrl)
      } catch {
        validationErrors.push(`${b.product.productCode}: malformed photo URL "${p.photoUrl}"`)
      }
    }
  }

  if (validationErrors.length > 0) {
    console.error('')
    console.error('✗ Validation errors:')
    for (const e of validationErrors) console.error(`   - ${e}`)
    process.exit(2)
  }

  console.log('✓ Output validated (uniqueness, required fields, URL well-formedness)')
}

main().catch((err) => {
  console.error('Unhandled error:', err)
  process.exit(1)
})
