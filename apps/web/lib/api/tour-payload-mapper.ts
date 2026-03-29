/**
 * Shared mapper utilities for converting Payload CMS tour documents
 * to frontend FeaturedTour and TourDetail interfaces.
 *
 * Used by: get-featured-tours, get-tours, get-tour-by-slug
 */

import type { FeaturedTour } from './get-featured-tours'
import type { TourDetail } from './get-tour-by-slug'

// ─── Lexical types ────────────────────────────────────────────────────────────

interface LexicalTextNode {
  type: 'text'
  text?: string
}

interface LexicalBlock {
  type: string
  tag?: string
  children?: Array<LexicalTextNode | LexicalBlock>
}

interface LexicalRoot {
  root?: {
    children?: LexicalBlock[]
  }
}

// ─── Payload doc shape (runtime, not typed) ───────────────────────────────────

/** Media object after depth:2 population */
interface PayloadMedia {
  url?: string | null
  alt?: string
  sizes?: {
    card?: { url?: string | null } | null
  }
}

/** Image row in tour.images array */
interface TourImageRow {
  image?: PayloadMedia | number | null
  caption?: string | null
  isPrimary?: boolean | null
}

/** Populated guide object (depth:2) */
interface PayloadGuide {
  id: number | string
  name?: string
  photo?: PayloadMedia | number | null
  bio?: LexicalRoot | null
  credentials?: Array<{ credential: string }> | null
  languages?: string[]
}

/** Populated category object (depth:2) */
interface PayloadCategory {
  id: number | string
  name?: string
  slug?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convert a Lexical rich text JSON structure to simple HTML.
 * Handles paragraph nodes → <p>text</p> and heading nodes → <hN>text</hN>.
 * Returns empty string if input is falsy or malformed.
 */
export function lexicalToHtml(lexical: unknown): string {
  if (!lexical || typeof lexical !== 'object') return ''
  try {
    const root = (lexical as LexicalRoot).root
    if (!root?.children) return ''

    const parts: string[] = []
    for (const block of root.children) {
      const text = extractTextFromBlock(block)
      if (!text) continue

      if (block.type === 'heading' && block.tag) {
        parts.push(`<${block.tag}>${text}</${block.tag}>`)
      } else {
        // paragraph and all other block types → <p>
        parts.push(`<p>${text}</p>`)
      }
    }
    return parts.join('\n')
  } catch {
    return ''
  }
}

/** Recursively extract plain text from a Lexical block node */
function extractTextFromBlock(block: LexicalBlock | LexicalTextNode): string {
  if ('text' in block && typeof block.text === 'string') {
    return block.text
  }
  if ('children' in block && Array.isArray(block.children)) {
    return block.children.map((child) => extractTextFromBlock(child as LexicalBlock)).join('')
  }
  return ''
}

/**
 * Extract plain text excerpt from Lexical rich text.
 * Used for guide bio plain-text extraction.
 */
export function lexicalToPlainText(lexical: unknown, maxLength?: number): string {
  if (!lexical || typeof lexical !== 'object') return ''
  try {
    const root = (lexical as LexicalRoot).root
    if (!root?.children) return ''

    const texts: string[] = []
    for (const block of root.children) {
      const t = extractTextFromBlock(block)
      if (t) texts.push(t)
    }
    const full = texts.join(' ').trim()
    if (!maxLength) return full
    return full.length > maxLength ? `${full.substring(0, maxLength)}…` : full
  } catch {
    return ''
  }
}

/**
 * Resolve the primary image from a tour's images array.
 * Prefers rows where isPrimary === true, else falls back to first row.
 * Returns card-size URL when available, otherwise original URL.
 */
export function resolvePrimaryImage(
  images: TourImageRow[] | null | undefined,
  fallbackAlt = ''
): { url: string; alt: string } {
  if (!images || images.length === 0) {
    return { url: '', alt: fallbackAlt }
  }

  const primary = images.find((row) => row.isPrimary) ?? images[0]
  const media = primary?.image

  // Not populated (just an id number) or null
  if (!media || typeof media === 'number') {
    return { url: '', alt: fallbackAlt }
  }

  const cardUrl = media.sizes?.card?.url
  const url = cardUrl || media.url || ''
  const alt = media.alt || fallbackAlt

  return { url, alt }
}

// ─── Main mapper ──────────────────────────────────────────────────────────────

/**
 * Map a Payload tour document (Record<string, unknown>) to FeaturedTour.
 * Call with depth:2 result so relationships are populated objects.
 */
export function mapPayloadTourToFeaturedTour(doc: Record<string, unknown>): FeaturedTour {
  const pricing = doc.pricing as { basePrice?: number } | undefined
  const duration = doc.duration as { hours?: number } | undefined
  const accessibility = doc.accessibility as {
    wheelchairAccessible?: boolean | null
    hearingAssistance?: boolean | null
    visualAssistance?: boolean | null
  } | undefined
  const images = doc.images as TourImageRow[] | undefined

  const image = resolvePrimaryImage(images, String(doc.title ?? ''))

  return {
    id: String(doc.id),
    title: String(doc.title ?? ''),
    description: String(doc.shortDescription ?? ''),
    slug: String(doc.slug ?? ''),
    image,
    duration: Math.round((duration?.hours ?? 0) * 60),
    maxCapacity: (doc.maxGroupSize as number | null) ?? 0,
    rating: 0,
    reviewCount: 0,
    price: pricing?.basePrice ?? 0,
    featured: Boolean(doc.featured),
    accessibility: accessibility
      ? {
          wheelchairAccessible: accessibility.wheelchairAccessible ?? undefined,
          hearingAccessible: accessibility.hearingAssistance ?? undefined,
          visualAccessible: accessibility.visualAssistance ?? undefined,
        }
      : undefined,
  }
}

/**
 * Map a Payload tour document to TourDetail (extends FeaturedTour).
 * Expects depth:2 so guide, categories, images are fully populated.
 */
export function mapPayloadTourToTourDetail(doc: Record<string, unknown>): TourDetail {
  const base = mapPayloadTourToFeaturedTour(doc)

  // ── Description HTML from Lexical ──
  const descriptionHtml = lexicalToHtml(doc.description)

  // ── Highlights ──
  const rawHighlights = doc.highlights as Array<{ highlight: string }> | null | undefined
  const highlights: Array<{ highlight: string }> = (rawHighlights ?? []).map((h) => ({
    highlight: h.highlight,
  }))

  // ── Gallery ──
  const rawImages = doc.images as TourImageRow[] | null | undefined
  const gallery: Array<{ image: { url: string; alt: string } }> = (rawImages ?? []).map((row) => {
    const media = row.image
    if (!media || typeof media === 'number') return { image: { url: '', alt: '' } }
    return {
      image: {
        url: (media as PayloadMedia).url ?? '',
        alt: (media as PayloadMedia).alt ?? '',
      },
    }
  })

  // ── Logistics ──
  const rawLogistics = doc.logistics as {
    meetingPointName?: string | null
    meetingPointAddress?: string | null
    meetingPointInstructions?: string | null
    coordinates?: [number, number] | null
    googleMapsLink?: string | null
    publicTransportInfo?: string | null
    parkingInfo?: string | null
    endingPoint?: string | null
  } | undefined

  let logistics: TourDetail['logistics'] = undefined
  if (rawLogistics?.meetingPointName) {
    const coords = rawLogistics.coordinates
    logistics = {
      meetingPointName: rawLogistics.meetingPointName,
      meetingPointAddress: rawLogistics.meetingPointAddress ?? undefined,
      meetingPointInstructions: rawLogistics.meetingPointInstructions ?? undefined,
      // Payload stores point as [longitude, latitude]
      coordinates: coords
        ? { latitude: coords[1], longitude: coords[0] }
        : undefined,
      googleMapsLink: rawLogistics.googleMapsLink ?? undefined,
      publicTransportInfo: rawLogistics.publicTransportInfo ?? undefined,
      parkingInfo: rawLogistics.parkingInfo ?? undefined,
      endingPoint: rawLogistics.endingPoint ?? undefined,
    }
  }

  // ── Inclusions ──
  const rawIncluded = doc.included as Array<{ item: string }> | null | undefined
  const included = rawIncluded?.length
    ? rawIncluded.map((r) => ({ item: r.item }))
    : undefined

  const rawNotIncluded = doc.notIncluded as Array<{ item: string }> | null | undefined
  const notIncluded = rawNotIncluded?.length
    ? rawNotIncluded.map((r) => ({ item: r.item }))
    : undefined

  const rawWhatToBring = doc.whatToBring as Array<{ item?: string | null }> | null | undefined
  const whatToBring = rawWhatToBring?.length
    ? rawWhatToBring.filter((r) => r.item).map((r) => ({ item: r.item! }))
    : undefined

  // ── Guide ──
  const rawGuide = doc.guide as PayloadGuide | number | null | undefined
  let guide: TourDetail['guide'] = undefined
  if (rawGuide && typeof rawGuide !== 'number') {
    const guidePhoto = rawGuide.photo as PayloadMedia | number | null | undefined
    guide = {
      id: String(rawGuide.id),
      name: rawGuide.name ?? '',
      photo:
        guidePhoto && typeof guidePhoto !== 'number' && guidePhoto.url
          ? { url: guidePhoto.url, alt: guidePhoto.alt ?? rawGuide.name ?? '' }
          : undefined,
      bio: lexicalToPlainText(rawGuide.bio),
      credentials: rawGuide.credentials?.length ? rawGuide.credentials : undefined,
      languages: rawGuide.languages ?? [],
    }
  }

  // ── Categories ──
  const rawCategories = doc.categories as Array<PayloadCategory | number> | null | undefined
  const categories: TourDetail['categories'] = rawCategories
    ?.filter((c): c is PayloadCategory => typeof c !== 'number')
    .map((c) => ({
      id: String(c.id),
      name: c.name ?? '',
      slug: c.slug ?? '',
    }))

  // ── Audience tags ──
  const audienceTags = (doc.targetAudience as string[] | null | undefined) ?? undefined

  return {
    ...base,
    descriptionHtml,
    highlights,
    gallery,
    logistics,
    included,
    notIncluded,
    whatToBring,
    guide,
    categories,
    audienceTags,
    bokunExperienceId: (doc.bokunExperienceId as string | null | undefined) ?? undefined,
  }
}
