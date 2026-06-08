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
  photo?: { url: string; alt: string; blurDataUrl?: string }
  languages: string[]
  additionalLanguages?: string[]
  specializations: Array<{ id: string; name: string; slug: string }>
  operatingAreas: Array<{ id: string; name: string; slug: string }>
  credentials?: Array<{ credential: string }>
  status: 'active' | 'on-leave'
  yearsExperience?: number
  /** Rich text bio as Payload lexical JSON */
  bio: SerializedEditorState | null
  /** Structured profile fields (populated from v2 import) */
  guideStyle?: string | null
  whatGuestsAppreciate?: string | null
  uniqueAspectsQuote?: string | null
  uniqueAspectsBody?: string | null
  specialtyDescriptions?: Array<{ description: string }>
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

  return {
    id: String(doc.id),
    name: String(doc.name),
    slug: String(doc.slug),
    status: doc.status as 'active' | 'on-leave',
    photo: photo?.url
      ? {
          url: (photo as { sizes?: { card?: { url?: string } } }).sizes?.card?.url || photo.url,
          alt: photo.alt || String(doc.name),
          blurDataUrl: (photo as { blurDataUrl?: string }).blurDataUrl ?? undefined,
        }
      : undefined,
    languages: (doc.languages ?? []) as string[],
    additionalLanguages: (doc.additionalLanguages ?? []) as string[],
    yearsExperience: typeof doc.yearsExperience === 'number' ? doc.yearsExperience : undefined,
    specializations: specs.map((s) => ({ id: String(s.id), name: s.name, slug: s.slug })),
    operatingAreas: areas.map((a) => ({ id: String(a.id), name: a.name, slug: a.slug })),
    credentials: creds.length > 0 ? creds : undefined,
    bio: (doc.bio as SerializedEditorState) ?? null,
    guideStyle: (doc.guideStyle as string) ?? null,
    whatGuestsAppreciate: (doc.whatGuestsAppreciate as string) ?? null,
    uniqueAspectsQuote: (doc.uniqueAspectsQuote as string) ?? null,
    uniqueAspectsBody: (doc.uniqueAspectsBody as string) ?? null,
    specialtyDescriptions: (doc.specialtyDescriptions ?? []) as Array<{ description: string }>,
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
