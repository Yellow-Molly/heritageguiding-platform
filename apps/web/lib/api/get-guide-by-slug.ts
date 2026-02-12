/**
 * Fetches a single guide by slug from Payload CMS.
 * Also provides getAllGuideSlugs for static generation.
 * Public API: email and phone fields are NEVER exposed.
 */

import { getPayload } from 'payload'
import config from '@payload-config'
import type { SerializedEditorState } from 'lexical'

export interface GuideDetail {
  id: string
  name: string
  slug: string
  photo?: { url: string; alt: string }
  languages: string[]
  additionalLanguages?: string[]
  specializations: Array<{ id: string; name: string; slug: string }>
  operatingAreas: Array<{ id: string; name: string; slug: string }>
  credentials?: Array<{ credential: string }>
  status: 'active' | 'on-leave'
  /** Rich text bio as Payload lexical JSON */
  bio: SerializedEditorState | null
  /** Tours led by this guide */
  tours: Array<{
    id: string
    title: string
    slug: string
    image?: { url: string; alt: string }
    duration: number
    price: number
    rating: number
    reviewCount: number
  }>
}

/**
 * Fetch a single guide by slug. Returns null if not found or inactive.
 * Active and on-leave guides are returned (on-leave shows status badge on UI).
 */
export async function getGuideBySlug(
  slug: string,
  locale: string = 'en'
): Promise<GuideDetail | null> {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'guides',
    where: {
      slug: { equals: slug },
      status: { in: ['active', 'on-leave'] },
    },
    depth: 2,
    locale: locale as 'sv' | 'en' | 'de',
    limit: 1,
  })

  if (docs.length === 0) return null

  const doc = docs[0] as unknown as Record<string, unknown>
  const photo = doc.photo as { url?: string; alt?: string } | undefined
  const specs = (doc.specializations ?? []) as Array<{ id: string; name: string; slug: string }>
  const areas = (doc.operatingAreas ?? []) as Array<{ id: string; name: string; slug: string }>
  const creds = (doc.credentials ?? []) as Array<{ credential: string }>

  // Fetch tours led by this guide
  const toursResult = await payload.find({
    collection: 'tours',
    where: {
      guide: { equals: doc.id },
      status: { equals: 'published' },
    },
    depth: 1,
    locale: locale as 'sv' | 'en' | 'de',
    limit: 20,
    sort: '-createdAt',
  })

  const tours = toursResult.docs.map((tour) => {
    const t = tour as unknown as Record<string, unknown>
    const tourImage = t.image as { url?: string; alt?: string } | undefined
    return {
      id: String(t.id),
      title: String(t.title ?? ''),
      slug: String(t.slug ?? ''),
      image: tourImage?.url ? { url: tourImage.url, alt: tourImage.alt || '' } : undefined,
      duration: Number(t.duration ?? 0),
      price: Number(t.price ?? 0),
      rating: Number(t.rating ?? 0),
      reviewCount: Number(t.reviewCount ?? 0),
    }
  })

  return {
    id: String(doc.id),
    name: String(doc.name),
    slug: String(doc.slug),
    status: doc.status as 'active' | 'on-leave',
    photo: photo?.url ? { url: photo.url, alt: photo.alt || String(doc.name) } : undefined,
    languages: (doc.languages ?? []) as string[],
    additionalLanguages: (doc.additionalLanguages ?? []) as string[],
    specializations: specs.map((s) => ({ id: String(s.id), name: s.name, slug: s.slug })),
    operatingAreas: areas.map((a) => ({ id: String(a.id), name: a.name, slug: a.slug })),
    credentials: creds.length > 0 ? creds : undefined,
    bio: (doc.bio as SerializedEditorState) ?? null,
    tours,
  }
}

/**
 * Get all guide slugs for static generation (generateStaticParams).
 */
export async function getAllGuideSlugs(): Promise<Array<{ slug: string }>> {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'guides',
    where: { status: { in: ['active', 'on-leave'] } },
    depth: 0,
    limit: 200,
    select: { slug: true },
  })

  return docs.map((doc) => ({ slug: String((doc as Record<string, unknown>).slug) }))
}
