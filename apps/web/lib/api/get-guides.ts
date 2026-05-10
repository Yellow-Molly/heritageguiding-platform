/**
 * Fetches active guides from Payload CMS with filtering and pagination.
 * Public API: email and phone fields are NEVER exposed.
 */

import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Where } from 'payload'
import { sql } from 'drizzle-orm'

type DrizzleDB = {
  execute: (query: unknown) => Promise<{ rows: Record<string, unknown>[] }>
}

export interface GuideListItem {
  id: string
  name: string
  slug: string
  photo?: { url: string; alt: string; blurDataUrl?: string }
  languages: string[]
  additionalLanguages?: string[]
  specializations: Array<{ id: string; name: string; slug: string }>
  operatingAreas: Array<{ id: string; name: string; slug: string }>
  credentials?: Array<{ credential: string }>
  bioExcerpt?: string
  tourCount: number
  yearsExperience?: number
}

export interface GuideFilters {
  language?: string
  specialization?: string
  area?: string
  q?: string
  page?: string
  limit?: string
}

export interface GuidesResponse {
  guides: GuideListItem[]
  total: number
  page: number
  totalPages: number
}

/** Extract plain text excerpt from Payload richText content */
function extractBioExcerpt(bio: unknown, maxLength = 150): string | undefined {
  if (!bio || typeof bio !== 'object') return undefined
  try {
    const root = bio as { root?: { children?: Array<{ children?: Array<{ text?: string }> }> } }
    const texts: string[] = []
    for (const block of root.root?.children ?? []) {
      for (const child of block.children ?? []) {
        if (child.text) texts.push(child.text)
      }
    }
    const full = texts.join(' ').trim()
    if (!full) return undefined
    return full.length > maxLength ? `${full.substring(0, maxLength)}…` : full
  } catch {
    return undefined
  }
}

/** Map a Payload guide doc to a public GuideListItem (no email/phone) */
function mapGuideToListItem(
  doc: Record<string, unknown>,
  tourCountMap: Map<string, number>
): GuideListItem {
  const photo = doc.photo as { url?: string; alt?: string } | undefined
  const specs = (doc.specializations ?? []) as Array<{ id: string; name: string; slug: string }>
  const areas = (doc.operatingAreas ?? []) as Array<{ id: string; name: string; slug: string }>
  const creds = (doc.credentials ?? []) as Array<{ credential: string }>
  const id = String(doc.id)

  return {
    id,
    name: String(doc.name),
    slug: String(doc.slug),
    photo: photo?.url
      ? {
          url: (photo as { sizes?: { thumbnail?: { url?: string } } }).sizes?.thumbnail?.url || photo.url,
          alt: photo.alt || String(doc.name),
          blurDataUrl: (photo as { blurDataUrl?: string }).blurDataUrl ?? undefined,
        }
      : undefined,
    languages: (doc.languages ?? []) as string[],
    additionalLanguages: (doc.additionalLanguages ?? []) as string[],
    specializations: specs.map((s) => ({ id: String(s.id), name: s.name, slug: s.slug })),
    operatingAreas: areas.map((a) => ({ id: String(a.id), name: a.name, slug: a.slug })),
    credentials: creds.length > 0 ? creds : undefined,
    bioExcerpt: extractBioExcerpt(doc.bio),
    tourCount: tourCountMap.get(id) ?? 0,
    yearsExperience: typeof doc.yearsExperience === 'number' ? doc.yearsExperience : undefined,
  }
}

/**
 * Fetch paginated list of active guides with optional filters.
 */
export async function getGuides(
  filters: GuideFilters = {},
  locale: string = 'en'
): Promise<GuidesResponse> {
  const payload = await getPayload({ config })
  const page = Math.max(1, parseInt(filters.page || '1', 10) || 1)
  const limit = Math.min(50, Math.max(1, parseInt(filters.limit || '12', 10) || 12))

  // Build where clause - only active guides
  const where: Where = { status: { equals: 'active' } }

  // Language filter: main and additional languages have disjoint enum sets in Postgres,
  // so only query the field whose enum contains the given code.
  const mainLanguageCodes = new Set(['sv', 'en', 'de', 'fr', 'es', 'it'])
  if (filters.language) {
    if (mainLanguageCodes.has(filters.language)) {
      where.languages = { contains: filters.language }
    } else {
      where.additionalLanguages = { contains: filters.language }
    }
  }

  // Search by name
  if (filters.q) {
    where.name = { like: `%${filters.q.trim()}%` }
  }

  const needsPostFilter = !!(filters.specialization || filters.area)

  // When post-filtering by relationship fields, fetch all results to paginate accurately.
  // `select` excludes email/phone (privacy-critical) and other unused profile fields.
  const result = await payload.find({
    collection: 'guides',
    where,
    depth: 1,
    locale: locale as 'sv' | 'en' | 'de',
    page: needsPostFilter ? 1 : page,
    limit: needsPostFilter ? 200 : limit,
    sort: 'name',
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      photo: true,
      bio: true,
      languages: true,
      additionalLanguages: true,
      specializations: true,
      operatingAreas: true,
      credentials: true,
      yearsExperience: true,
    },
  })

  // Aggregate published tour counts per guide via the tours_rels junction table.
  // After the 260510 migration, guide is hasMany and stored as junction rows
  // (path='guides') instead of the legacy tours.guide_id column.
  // COUNT(DISTINCT) defends against duplicate guide entries on a single tour.
  const guideIds = result.docs.map((doc) => Number(doc.id)).filter((n) => Number.isFinite(n))
  const tourCountMap = new Map<string, number>()
  if (guideIds.length > 0) {
    const drizzle = (payload.db as unknown as { drizzle: DrizzleDB }).drizzle
    const idList = sql.join(guideIds.map((id) => sql`${id}`), sql`, `)
    const tourCounts = await drizzle.execute(sql`
      SELECT r.guides_id::text AS guide_id, COUNT(DISTINCT t.id)::int AS count
      FROM tours_rels r
      JOIN tours t ON t.id = r.parent_id
      WHERE r.path = 'guides'
        AND r.guides_id IN (${idList})
        AND t.status = 'published'
      GROUP BY r.guides_id
    `)
    for (const row of tourCounts.rows) {
      tourCountMap.set(String(row.guide_id), Number(row.count))
    }
  }

  let allGuides = result.docs.map((doc) =>
    mapGuideToListItem(doc as unknown as Record<string, unknown>, tourCountMap)
  )

  // Post-query filters for relationship fields (Payload doesn't support deep where on populated relationships)
  if (filters.specialization) {
    allGuides = allGuides.filter((g) => g.specializations.some((s) => s.slug === filters.specialization))
  }
  if (filters.area) {
    allGuides = allGuides.filter((g) => g.operatingAreas.some((a) => a.slug === filters.area))
  }

  if (needsPostFilter) {
    const total = allGuides.length
    const start = (page - 1) * limit
    return {
      guides: allGuides.slice(start, start + limit),
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    }
  }

  return {
    guides: allGuides,
    total: result.totalDocs,
    page: result.page ?? page,
    totalPages: result.totalPages,
  }
}

/**
 * Cached version of getGuides for server-rendered pages and the listing route.
 * `unstable_cache` auto-keys by call args (filters + locale), so callers get
 * filter-aware cache entries without listing keys manually.
 * Tag `['guides']` is invalidated by packages/cms `revalidate-cache-tags-hook`
 * on guide upsert/delete; `revalidate: 600` is a 10 min failsafe that also
 * bounds tourCount drift (tour CRUD does not tag-bust guides).
 */
export const getCachedGuides = unstable_cache(
  getGuides,
  ['guides-list'],
  { tags: ['guides'], revalidate: 600 }
)

export interface GuideFilterOptions {
  languages: string[]
  specializations: Array<{ id: string; name: string; slug: string }>
  areas: Array<{ id: string; name: string; slug: string }>
}

/**
 * Extract unique filter options from all active guides.
 * Lightweight — reuses cached guide data.
 */
async function fetchGuideFilterOptions(locale: string = 'en'): Promise<GuideFilterOptions> {
  const { guides } = await getGuides({ limit: '200' }, locale)

  const langSet = new Set<string>()
  const specMap = new Map<string, { id: string; name: string; slug: string }>()
  const areaMap = new Map<string, { id: string; name: string; slug: string }>()

  for (const g of guides) {
    for (const l of [...g.languages, ...(g.additionalLanguages ?? [])]) langSet.add(l)
    for (const s of g.specializations) specMap.set(s.id, s)
    for (const a of g.operatingAreas) areaMap.set(a.id, a)
  }

  return {
    languages: [...langSet].sort(),
    specializations: [...specMap.values()].sort((a, b) => a.name.localeCompare(b.name)),
    areas: [...areaMap.values()].sort((a, b) => a.name.localeCompare(b.name)),
  }
}

/**
 * Cached filter options for the /guides listing.
 * Revalidates on-demand via guides/categories/cities tag invalidation;
 * 1 h soft TTL is the failsafe.
 */
export const getGuideFilterOptions = unstable_cache(
  fetchGuideFilterOptions,
  ['guide-filter-options'],
  { tags: ['guides', 'categories', 'cities'], revalidate: 3600 }
)
