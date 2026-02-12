/**
 * Unit tests for getGuideBySlug and getAllGuideSlugs API functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGuideDoc = {
  id: '1',
  name: 'Erik Lindqvist',
  slug: 'erik-lindqvist',
  status: 'active',
  email: 'erik@test.com',
  phone: '+46701234567',
  bio: { root: { children: [{ children: [{ text: 'Expert guide' }] }] } },
  photo: { url: '/photo.jpg', alt: 'Erik' },
  languages: ['sv', 'en'],
  additionalLanguages: ['fi'],
  specializations: [{ id: 'cat1', name: 'History', slug: 'history' }],
  operatingAreas: [{ id: 'city1', name: 'Stockholm', slug: 'stockholm' }],
  credentials: [{ credential: 'PhD History' }],
}

const mockTourDoc = {
  id: 'tour1',
  title: 'Viking History Tour',
  slug: 'viking-history-tour',
  image: { url: '/tour.jpg', alt: 'Viking tour' },
  duration: 180,
  price: 500,
  rating: 4.8,
  reviewCount: 42,
}

const mockPayload = {
  find: vi.fn(),
}

vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue(mockPayload),
}))

vi.mock('@payload-config', () => ({ default: {} }))

describe('getGuideBySlug', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock: first call returns guide, second call returns tours
    mockPayload.find
      .mockResolvedValueOnce({
        docs: [mockGuideDoc],
      })
      .mockResolvedValueOnce({
        docs: [mockTourDoc],
      })
  })

  it('returns GuideDetail without email/phone when guide found', async () => {
    const { getGuideBySlug } = await import('../get-guide-by-slug')

    const result = await getGuideBySlug('erik-lindqvist', 'en')

    expect(result).not.toBeNull()
    expect(result?.id).toBe('1')
    expect(result?.name).toBe('Erik Lindqvist')
    expect(result?.slug).toBe('erik-lindqvist')
    expect(result?.status).toBe('active')
    expect(result?.photo).toEqual({ url: '/photo.jpg', alt: 'Erik' })
    expect(result?.languages).toEqual(['sv', 'en'])
    expect(result?.additionalLanguages).toEqual(['fi'])
    expect(result?.specializations).toEqual([{ id: 'cat1', name: 'History', slug: 'history' }])
    expect(result?.operatingAreas).toEqual([{ id: 'city1', name: 'Stockholm', slug: 'stockholm' }])
    expect(result?.credentials).toEqual([{ credential: 'PhD History' }])
    expect(result?.bio).toBeDefined()

    // Ensure email and phone are NOT in the output
    expect(result).not.toHaveProperty('email')
    expect(result).not.toHaveProperty('phone')
  })

  it('returns null when guide not found', async () => {
    mockPayload.find.mockReset().mockResolvedValueOnce({ docs: [] })

    const { getGuideBySlug } = await import('../get-guide-by-slug')

    const result = await getGuideBySlug('nonexistent', 'en')

    expect(result).toBeNull()
  })

  it('returns tours array from second Payload query', async () => {
    const { getGuideBySlug } = await import('../get-guide-by-slug')

    const result = await getGuideBySlug('erik-lindqvist', 'en')

    expect(result?.tours).toBeDefined()
    expect(Array.isArray(result?.tours)).toBe(true)
    expect(result?.tours).toHaveLength(1)
  })

  it('maps tours correctly with id, title, slug, image, duration, price, rating, reviewCount', async () => {
    const { getGuideBySlug } = await import('../get-guide-by-slug')

    const result = await getGuideBySlug('erik-lindqvist', 'en')

    expect(result?.tours[0]).toEqual({
      id: 'tour1',
      title: 'Viking History Tour',
      slug: 'viking-history-tour',
      image: { url: '/tour.jpg', alt: 'Viking tour' },
      duration: 180,
      price: 500,
      rating: 4.8,
      reviewCount: 42,
    })
  })

  it('calls Payload.find twice - once for guide, once for tours', async () => {
    const { getGuideBySlug } = await import('../get-guide-by-slug')

    await getGuideBySlug('erik-lindqvist', 'en')

    expect(mockPayload.find).toHaveBeenCalledTimes(2)

    // First call: guides collection
    expect(mockPayload.find).toHaveBeenNthCalledWith(1, expect.objectContaining({
      collection: 'guides',
      where: {
        slug: { equals: 'erik-lindqvist' },
        status: { in: ['active', 'on-leave'] },
      },
    }))

    // Second call: tours collection
    expect(mockPayload.find).toHaveBeenNthCalledWith(2, expect.objectContaining({
      collection: 'tours',
      where: {
        guide: { equals: '1' },
        status: { equals: 'published' },
      },
    }))
  })

  it('handles guide with no tours', async () => {
    mockPayload.find.mockReset()
      .mockResolvedValueOnce({ docs: [mockGuideDoc] })
      .mockResolvedValueOnce({ docs: [] })

    const { getGuideBySlug } = await import('../get-guide-by-slug')

    const result = await getGuideBySlug('erik-lindqvist', 'en')

    expect(result?.tours).toEqual([])
  })

  it('handles guide with no photo', async () => {
    const docWithoutPhoto = { ...mockGuideDoc, photo: undefined }
    mockPayload.find.mockReset()
      .mockResolvedValueOnce({ docs: [docWithoutPhoto] })
      .mockResolvedValueOnce({ docs: [] })

    const { getGuideBySlug } = await import('../get-guide-by-slug')

    const result = await getGuideBySlug('erik-lindqvist', 'en')

    expect(result?.photo).toBeUndefined()
  })

  it('returns on-leave guides', async () => {
    const onLeaveDoc = { ...mockGuideDoc, status: 'on-leave' }
    mockPayload.find.mockReset()
      .mockResolvedValueOnce({ docs: [onLeaveDoc] })
      .mockResolvedValueOnce({ docs: [] })

    const { getGuideBySlug } = await import('../get-guide-by-slug')

    const result = await getGuideBySlug('erik-lindqvist', 'en')

    expect(result?.status).toBe('on-leave')
  })
})

describe('getAllGuideSlugs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns array of slug objects', async () => {
    mockPayload.find.mockResolvedValueOnce({
      docs: [
        { slug: 'erik-lindqvist' },
        { slug: 'anna-berg' },
        { slug: 'lars-nilsson' },
      ],
    })

    const { getAllGuideSlugs } = await import('../get-guide-by-slug')

    const result = await getAllGuideSlugs()

    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ slug: 'erik-lindqvist' })
    expect(result[1]).toEqual({ slug: 'anna-berg' })
    expect(result[2]).toEqual({ slug: 'lars-nilsson' })
  })

  it('queries guides with active and on-leave status', async () => {
    mockPayload.find.mockResolvedValueOnce({ docs: [] })

    const { getAllGuideSlugs } = await import('../get-guide-by-slug')

    await getAllGuideSlugs()

    expect(mockPayload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'guides',
        where: { status: { in: ['active', 'on-leave'] } },
        depth: 0,
        limit: 200,
        select: { slug: true },
      })
    )
  })

  it('returns empty array when no guides', async () => {
    mockPayload.find.mockResolvedValueOnce({ docs: [] })

    const { getAllGuideSlugs } = await import('../get-guide-by-slug')

    const result = await getAllGuideSlugs()

    expect(result).toEqual([])
  })
})
