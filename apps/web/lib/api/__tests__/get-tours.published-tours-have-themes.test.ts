import { describe, it, expect } from 'vitest'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Data invariant: every published tour must have at least one category with
 * type='theme'. Themes power the /tours category filter — a tour without a
 * theme cannot match any selection and silently disappears from filtered
 * results. Phase 03 of the category cleanup migration left 6 tours in this
 * state; the backfill script in plans/260503-1005-tours-category-backfill-fix
 * fixed it. This test guards against regression from admin edits, future
 * migrations, or import scripts.
 *
 * Integration test — requires live Postgres + seeded data. Auto-skips when
 * DATABASE_URL is absent (CI without DB); runs locally with .env.local.
 */
const HAS_DB = !!process.env.DATABASE_URL

describe.skipIf(!HAS_DB)('published tours have ≥1 theme category (integration)', () => {
  it('every published tour has at least one type=theme category', async () => {
    const payload = await getPayload({ config })

    const { docs } = await payload.find({
      collection: 'tours',
      where: { status: { equals: 'published' } },
      limit: 1000,
      depth: 1,
    })

    expect(docs.length).toBeGreaterThan(0)

    const offenders: string[] = []
    for (const tour of docs) {
      const cats = Array.isArray(tour.categories) ? tour.categories : []
      const themeCount = cats.filter(
        (c): c is { id: number | string; slug: string; type: string } =>
          !!c && typeof c === 'object' && 'type' in c && (c as { type: unknown }).type === 'theme',
      ).length
      if (themeCount === 0) offenders.push(tour.slug)
    }

    expect(
      offenders,
      `Published tours missing a theme category: ${offenders.join(', ')}`,
    ).toEqual([])
  })
})
