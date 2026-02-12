/**
 * Fetches active guides from Payload CMS with filtering and pagination.
 * Public API: email and phone fields are NEVER exposed.
 */

import { getPayload } from 'payload'
import config from '@payload-config'
import type { Where } from 'payload'

export interface GuideListItem {
  id: string
  name: string
  slug: string
  photo?: { url: string; alt: string }
  languages: string[]
  additionalLanguages?: string[]
  specializations: Array<{ id: string; name: string; slug: string }>
  operatingAreas: Array<{ id: string; name: string; slug: string }>
  credentials?: Array<{ credential: string }>
  bioExcerpt?: string
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
function mapGuideToListItem(doc: Record<string, unknown>): GuideListItem {
  const photo = doc.photo as { url?: string; alt?: string } | undefined
  const specs = (doc.specializations ?? []) as Array<{ id: string; name: string; slug: string }>
  const areas = (doc.operatingAreas ?? []) as Array<{ id: string; name: string; slug: string }>
  const creds = (doc.credentials ?? []) as Array<{ credential: string }>

  return {
    id: String(doc.id),
    name: String(doc.name),
    slug: String(doc.slug),
    photo: photo?.url ? { url: photo.url, alt: photo.alt || String(doc.name) } : undefined,
    languages: (doc.languages ?? []) as string[],
    additionalLanguages: (doc.additionalLanguages ?? []) as string[],
    specializations: specs.map((s) => ({ id: String(s.id), name: s.name, slug: s.slug })),
    operatingAreas: areas.map((a) => ({ id: String(a.id), name: a.name, slug: a.slug })),
    credentials: creds.length > 0 ? creds : undefined,
    bioExcerpt: extractBioExcerpt(doc.bio),
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

  // Language filter: check main languages or additionalLanguages
  if (filters.language) {
    where.or = [
      { languages: { contains: filters.language } },
      { additionalLanguages: { contains: filters.language } },
    ]
  }

  // Search by name
  if (filters.q) {
    where.name = { like: `%${filters.q.trim()}%` }
  }

  const needsPostFilter = !!(filters.specialization || filters.area)

  // When post-filtering by relationship fields, fetch all results to paginate accurately
  const result = await payload.find({
    collection: 'guides',
    where,
    depth: 2,
    locale: locale as 'sv' | 'en' | 'de',
    page: needsPostFilter ? 1 : page,
    limit: needsPostFilter ? 200 : limit,
    sort: 'name',
  })

  let allGuides = result.docs.map((doc) => mapGuideToListItem(doc as unknown as Record<string, unknown>))

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
