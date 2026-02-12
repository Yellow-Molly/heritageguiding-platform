/**
 * Unit tests for getGuides API function
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGuideDoc = {
  id: '1',
  name: 'Erik Lindqvist',
  slug: 'erik-lindqvist',
  status: 'active',
  email: 'erik@test.com',
  phone: '+46701234567',
  bio: { root: { children: [{ children: [{ text: 'Expert guide with 10 years of experience in Swedish history' }] }] } },
  photo: { url: '/photo.jpg', alt: 'Erik' },
  languages: ['sv', 'en'],
  additionalLanguages: ['fi'],
  specializations: [{ id: 'cat1', name: 'History', slug: 'history' }],
  operatingAreas: [{ id: 'city1', name: 'Stockholm', slug: 'stockholm' }],
  credentials: [{ credential: 'PhD History' }],
}

const mockPayload = {
  find: vi.fn().mockResolvedValue({
    docs: [mockGuideDoc],
    totalDocs: 1,
    totalPages: 1,
    page: 1,
  }),
}

vi.mock('payload', () => ({
  getPayload: vi.fn().mockResolvedValue(mockPayload),
}))

vi.mock('@payload-config', () => ({ default: {} }))

describe('getGuides', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns paginated response structure with guides, total, page, totalPages', async () => {
    const { getGuides } = await import('../get-guides')

    const result = await getGuides()

    expect(result).toHaveProperty('guides')
    expect(result).toHaveProperty('total')
    expect(result).toHaveProperty('page')
    expect(result).toHaveProperty('totalPages')
    expect(Array.isArray(result.guides)).toBe(true)
    expect(result.total).toBe(1)
    expect(result.page).toBe(1)
    expect(result.totalPages).toBe(1)
  })

  it('maps docs correctly and excludes email/phone from output', async () => {
    const { getGuides } = await import('../get-guides')

    const result = await getGuides()

    expect(result.guides).toHaveLength(1)
    const guide = result.guides[0]

    expect(guide.id).toBe('1')
    expect(guide.name).toBe('Erik Lindqvist')
    expect(guide.slug).toBe('erik-lindqvist')
    expect(guide.photo).toEqual({ url: '/photo.jpg', alt: 'Erik' })
    expect(guide.languages).toEqual(['sv', 'en'])
    expect(guide.additionalLanguages).toEqual(['fi'])
    expect(guide.specializations).toEqual([{ id: 'cat1', name: 'History', slug: 'history' }])
    expect(guide.operatingAreas).toEqual([{ id: 'city1', name: 'Stockholm', slug: 'stockholm' }])
    expect(guide.credentials).toEqual([{ credential: 'PhD History' }])
    expect(guide.bioExcerpt).toBe('Expert guide with 10 years of experience in Swedish history')

    // Ensure email and phone are NOT in the output
    expect(guide).not.toHaveProperty('email')
    expect(guide).not.toHaveProperty('phone')
  })

  it('passes name filter to Payload where clause when q param provided', async () => {
    const { getGuides } = await import('../get-guides')

    await getGuides({ q: 'erik' })

    expect(mockPayload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { equals: 'active' },
          name: { like: '%erik%' },
        }),
      })
    )
  })

  it('passes language filter to Payload where clause', async () => {
    const { getGuides } = await import('../get-guides')

    await getGuides({ language: 'sv' })

    expect(mockPayload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: { equals: 'active' },
          or: [
            { languages: { contains: 'sv' } },
            { additionalLanguages: { contains: 'sv' } },
          ],
        }),
      })
    )
  })

  it('filters by specialization slug post-query', async () => {
    const mockDocsWithDifferentSpecs = [
      { ...mockGuideDoc, id: '1', specializations: [{ id: 'cat1', name: 'History', slug: 'history' }] },
      { ...mockGuideDoc, id: '2', name: 'Anna Berg', slug: 'anna-berg', specializations: [{ id: 'cat2', name: 'Art', slug: 'art' }] },
    ]

    mockPayload.find.mockResolvedValueOnce({
      docs: mockDocsWithDifferentSpecs,
      totalDocs: 2,
      totalPages: 1,
      page: 1,
    })

    const { getGuides } = await import('../get-guides')
    const result = await getGuides({ specialization: 'history' })

    expect(result.guides).toHaveLength(1)
    expect(result.guides[0].name).toBe('Erik Lindqvist')
    expect(result.guides[0].specializations[0].slug).toBe('history')
  })

  it('filters by area slug post-query', async () => {
    const mockDocsWithDifferentAreas = [
      { ...mockGuideDoc, id: '1', operatingAreas: [{ id: 'city1', name: 'Stockholm', slug: 'stockholm' }] },
      { ...mockGuideDoc, id: '2', name: 'Anna Berg', slug: 'anna-berg', operatingAreas: [{ id: 'city2', name: 'Gothenburg', slug: 'gothenburg' }] },
    ]

    mockPayload.find.mockResolvedValueOnce({
      docs: mockDocsWithDifferentAreas,
      totalDocs: 2,
      totalPages: 1,
      page: 1,
    })

    const { getGuides } = await import('../get-guides')
    const result = await getGuides({ area: 'stockholm' })

    expect(result.guides).toHaveLength(1)
    expect(result.guides[0].name).toBe('Erik Lindqvist')
    expect(result.guides[0].operatingAreas[0].slug).toBe('stockholm')
  })

  it('parses pagination params correctly', async () => {
    const { getGuides } = await import('../get-guides')

    await getGuides({ page: '2', limit: '20' })

    expect(mockPayload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 2,
        limit: 20,
      })
    )
  })

  it('enforces minimum page of 1', async () => {
    const { getGuides } = await import('../get-guides')

    await getGuides({ page: '0' })

    expect(mockPayload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
      })
    )
  })

  it('enforces maximum limit of 50', async () => {
    const { getGuides } = await import('../get-guides')

    await getGuides({ limit: '100' })

    expect(mockPayload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 50,
      })
    )
  })

  it('uses default page 1 and limit 12 when not specified', async () => {
    const { getGuides } = await import('../get-guides')

    await getGuides({})

    expect(mockPayload.find).toHaveBeenCalledWith(
      expect.objectContaining({
        page: 1,
        limit: 12,
      })
    )
  })
})
