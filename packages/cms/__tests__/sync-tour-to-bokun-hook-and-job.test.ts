/**
 * Tests for the Bokun outbound sync pipeline:
 *  - syncTourToBokunAfterChangeHook (enqueues a job, with skip rules)
 *  - syncTourToBokunTask handler (calls create vs update, persists status, retry semantics)
 *  - sanitizeBokunError helper (redacts secrets + truncates)
 *
 * The Bokun client is mocked at module boundary; Payload's payload + jobs are mocked
 * inline. Mapper is exercised end-to-end with a realistic TourSource fixture.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the Bokun client module BEFORE importing the job (which imports it transitively).
// Path resolves to the same file the job file imports.
vi.mock(
  '../../../apps/web/lib/bokun/bokun-api-client-with-hmac-authentication',
  async () => {
    const actual = await vi.importActual<
      typeof import('../../../apps/web/lib/bokun/bokun-api-client-with-hmac-authentication')
    >('../../../apps/web/lib/bokun/bokun-api-client-with-hmac-authentication')
    return {
      ...actual,
      getBokunClient: vi.fn(),
    }
  }
)

import { syncTourToBokunAfterChangeHook } from '../hooks/sync-tour-to-bokun-after-change-hook'
import {
  sanitizeBokunError,
  syncTourToBokunTask,
} from '../lib/bokun-sync-job'
import {
  BokunError,
  getBokunClient,
} from '../../../apps/web/lib/bokun/bokun-api-client-with-hmac-authentication'

const mockedGetBokunClient = vi.mocked(getBokunClient)

// ── Fixtures ─────────────────────────────────────────────────────────────────

function buildTourDoc(overrides: Record<string, unknown> = {}) {
  return {
    id: 42,
    title: { sv: 'Test', en: 'Test', de: 'Test' },
    description: { en: { root: { children: [] } } },
    shortDescription: { en: 'Short' },
    pricing: { basePrice: 199, currency: 'SEK', priceType: 'per_person' as const },
    duration: { hours: 2 },
    logistics: { meetingPointName: { en: 'Central' } },
    minGroupSize: 1,
    maxGroupSize: 10,
    bokunSyncStatus: 'pending' as const,
    bokunExperienceId: null,
    ...overrides,
  }
}

function buildMockClient() {
  return {
    createExperience: vi.fn(),
    updateExperience: vi.fn(),
  }
}

function buildMockReq(overrides: Record<string, unknown> = {}) {
  const queue = vi.fn().mockResolvedValue({ id: 'job_1' })
  const update = vi.fn().mockResolvedValue({})
  const findByID = vi.fn()
  const logger = { error: vi.fn(), info: vi.fn(), warn: vi.fn() }
  const payload = {
    jobs: { queue },
    update,
    findByID,
    logger,
    ...overrides,
  }
  return { payload, queue, update, findByID, logger, req: { payload, ...overrides } }
}

// ── sanitizeBokunError ────────────────────────────────────────────────────────

describe('sanitizeBokunError', () => {
  it('redacts long alphanumeric tokens (≥40 chars) that look like secrets', () => {
    const out = sanitizeBokunError(
      new Error('auth failed: abcdefghijklmnopqrstuvwxyz0123456789ABCD')
    )
    expect(out).toContain('[REDACTED]')
    expect(out).not.toContain('abcdefghijklmnopqrstuvwxyz0123456789ABCD')
  })

  it('redacts X-Bokun-* header values', () => {
    const out = sanitizeBokunError(new Error('rejected: X-Bokun-AccessKey: hunter2sekrit'))
    expect(out).toContain('X-Bokun-AccessKey: [REDACTED]')
    expect(out).not.toContain('hunter2sekrit')
  })

  it('redacts X-Bokun-Signature values', () => {
    const out = sanitizeBokunError(
      new Error('signature mismatch X-Bokun-Signature: aBcDeFgHiJkLmNoP')
    )
    expect(out).toContain('X-Bokun-Signature: [REDACTED]')
  })

  it('redacts Bearer tokens', () => {
    const out = sanitizeBokunError(new Error('401: Bearer eyJabc.def.ghi'))
    expect(out).toContain('Bearer [REDACTED]')
  })

  it('does NOT redact short alphanumeric strings (<40 chars) like "tour-42"', () => {
    const out = sanitizeBokunError(new Error('failed for tour-42 with code ABC123'))
    expect(out).toContain('tour-42')
  })

  it('truncates messages over 500 chars', () => {
    const long = 'x '.repeat(400) // 800 chars; spaces avoid the redaction regex
    const out = sanitizeBokunError(new Error(long))
    expect(out.length).toBeLessThanOrEqual(501) // 500 + ellipsis
    expect(out.endsWith('…')).toBe(true)
  })

  it('returns string for non-Error inputs', () => {
    expect(sanitizeBokunError('plain string')).toBe('plain string')
    expect(sanitizeBokunError(404)).toBe('404')
  })
})

// ── afterChange hook ─────────────────────────────────────────────────────────

describe('syncTourToBokunAfterChangeHook', () => {
  beforeEach(() => vi.clearAllMocks())

  // Helper to build the full args object Payload threads to a CollectionAfterChangeHook.
  // Cast `as never` afterwards in each call site since we mock only what the hook reads.
  function hookArgs(
    overrides: Record<string, unknown>
  ): Parameters<typeof syncTourToBokunAfterChangeHook>[0] {
    return {
      collection: {} as never,
      context: {},
      data: {},
      operation: 'create',
      previousDoc: {},
      ...overrides,
    } as never
  }

  it('enqueues a job on create', async () => {
    const { req, queue } = buildMockReq()
    const doc = buildTourDoc()
    await syncTourToBokunAfterChangeHook(
      hookArgs({ doc, req, operation: 'create', previousDoc: doc })
    )
    expect(queue).toHaveBeenCalledWith({
      task: 'syncTourToBokun',
      input: { tourId: 42 },
    })
  })

  it('enqueues a job on update', async () => {
    const { req, queue } = buildMockReq()
    await syncTourToBokunAfterChangeHook(
      hookArgs({ doc: buildTourDoc(), req, operation: 'update' })
    )
    expect(queue).toHaveBeenCalledTimes(1)
  })

  it('skips when context.skipBokunSync is set (recursive guard)', async () => {
    const { req, queue } = buildMockReq()
    await syncTourToBokunAfterChangeHook(
      hookArgs({
        doc: buildTourDoc(),
        req,
        operation: 'update',
        context: { skipBokunSync: true },
      })
    )
    expect(queue).not.toHaveBeenCalled()
  })

  it("skips when bokunSyncStatus === 'disabled'", async () => {
    const { req, queue } = buildMockReq()
    await syncTourToBokunAfterChangeHook(
      hookArgs({
        doc: buildTourDoc({ bokunSyncStatus: 'disabled' }),
        req,
        operation: 'update',
      })
    )
    expect(queue).not.toHaveBeenCalled()
  })

  it('does not crash the save when enqueue throws', async () => {
    const { req, queue, logger } = buildMockReq()
    queue.mockRejectedValueOnce(new Error('db down'))
    const doc = buildTourDoc()
    const result = await syncTourToBokunAfterChangeHook(
      hookArgs({ doc, req, operation: 'create', previousDoc: doc })
    )
    expect(result).toBe(doc)
    expect(logger.error).toHaveBeenCalled()
  })
})

// ── syncTourToBokunTask handler ──────────────────────────────────────────────

const handler = syncTourToBokunTask.handler as Extract<
  typeof syncTourToBokunTask.handler,
  Function
>

describe('syncTourToBokunTask handler', () => {
  beforeEach(() => vi.clearAllMocks())

  it('calls createExperience when no bokunExperienceId, persists returned id and synced status', async () => {
    const client = buildMockClient()
    client.createExperience.mockResolvedValueOnce({ id: 'exp_999' })
    mockedGetBokunClient.mockReturnValue(client as never)

    const { req, findByID, update } = buildMockReq()
    findByID.mockResolvedValueOnce(buildTourDoc({ bokunExperienceId: null }))

    const result = await handler({
      input: { tourId: 42 },
      req: req as never,
    } as never)

    expect(client.createExperience).toHaveBeenCalledTimes(1)
    expect(client.updateExperience).not.toHaveBeenCalled()
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'tours',
        id: 42,
        data: expect.objectContaining({
          bokunExperienceId: 'exp_999',
          bokunSyncStatus: 'synced',
          bokunLastError: null,
        }),
        context: { skipBokunSync: true },
      })
    )
    expect(result).toEqual({ output: { experienceId: 'exp_999', action: 'create' } })
  })

  it('calls updateExperience when bokunExperienceId already set', async () => {
    const client = buildMockClient()
    client.updateExperience.mockResolvedValueOnce({})
    mockedGetBokunClient.mockReturnValue(client as never)

    const { req, findByID } = buildMockReq()
    findByID.mockResolvedValueOnce(buildTourDoc({ bokunExperienceId: 'exp_existing' }))

    const result = await handler({ input: { tourId: 42 }, req: req as never } as never)

    expect(client.updateExperience).toHaveBeenCalledWith(
      'exp_existing',
      expect.any(Object)
    )
    expect(client.createExperience).not.toHaveBeenCalled()
    expect(result).toEqual({ output: { experienceId: 'exp_existing', action: 'update' } })
  })

  it("returns skipped when bokunSyncStatus === 'disabled'", async () => {
    const client = buildMockClient()
    mockedGetBokunClient.mockReturnValue(client as never)

    const { req, findByID } = buildMockReq()
    findByID.mockResolvedValueOnce(buildTourDoc({ bokunSyncStatus: 'disabled' }))

    const result = await handler({ input: { tourId: 42 }, req: req as never } as never)

    expect(result).toEqual({ output: { action: 'skipped' } })
    expect(client.createExperience).not.toHaveBeenCalled()
    expect(client.updateExperience).not.toHaveBeenCalled()
  })

  it('marks failed and does NOT throw on 4xx (no retry)', async () => {
    const client = buildMockClient()
    client.createExperience.mockRejectedValueOnce(
      new BokunError('Validation failed', 400, 'VALIDATION')
    )
    mockedGetBokunClient.mockReturnValue(client as never)

    const { req, findByID, update } = buildMockReq()
    findByID.mockResolvedValueOnce(buildTourDoc())

    const result = await handler({ input: { tourId: 42 }, req: req as never } as never)

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          bokunSyncStatus: 'failed',
          bokunLastError: expect.stringContaining('Validation failed'),
        }),
        context: { skipBokunSync: true },
      })
    )
    expect(result).toMatchObject({
      output: { error: expect.stringContaining('Validation failed') },
    })
  })

  it('throws on 5xx so Payload retries (status NOT marked failed)', async () => {
    const client = buildMockClient()
    client.createExperience.mockRejectedValueOnce(
      new BokunError('Upstream timeout', 502, 'BAD_GATEWAY')
    )
    mockedGetBokunClient.mockReturnValue(client as never)

    const { req, findByID, update } = buildMockReq()
    findByID.mockResolvedValueOnce(buildTourDoc())

    await expect(
      handler({ input: { tourId: 42 }, req: req as never } as never)
    ).rejects.toThrow('Upstream timeout')

    // Error captured but status preserved (not 'failed') so admin sees retry-in-progress
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          bokunSyncStatus: 'pending',
          bokunLastError: expect.stringContaining('Upstream timeout'),
        }),
      })
    )
  })

  it('throws on 429 so Payload retries (transient)', async () => {
    const client = buildMockClient()
    client.createExperience.mockRejectedValueOnce(
      new BokunError('Rate limited', 429, 'RATE_LIMIT')
    )
    mockedGetBokunClient.mockReturnValue(client as never)

    const { req, findByID } = buildMockReq()
    findByID.mockResolvedValueOnce(buildTourDoc())

    await expect(
      handler({ input: { tourId: 42 }, req: req as never } as never)
    ).rejects.toThrow('Rate limited')
  })

  it('treats 2xx with no id as permanent error', async () => {
    const client = buildMockClient()
    client.createExperience.mockResolvedValueOnce({}) // missing id
    mockedGetBokunClient.mockReturnValue(client as never)

    const { req, findByID, update } = buildMockReq()
    findByID.mockResolvedValueOnce(buildTourDoc())

    const result = await handler({ input: { tourId: 42 }, req: req as never } as never)

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ bokunSyncStatus: 'failed' }),
      })
    )
    expect(result).toMatchObject({
      output: { error: expect.stringContaining('no experience id') },
    })
  })

  it('returns skipped when tour was deleted between enqueue and execution', async () => {
    const client = buildMockClient()
    mockedGetBokunClient.mockReturnValue(client as never)

    const { req, findByID } = buildMockReq()
    findByID.mockResolvedValueOnce(null)

    const result = await handler({ input: { tourId: 999 }, req: req as never } as never)

    expect(result).toMatchObject({ output: { action: 'skipped' } })
    expect(client.createExperience).not.toHaveBeenCalled()
  })

  it('clears bokunExperienceId on 410 Gone so next sync re-creates the Experience', async () => {
    const client = buildMockClient()
    client.updateExperience.mockRejectedValueOnce(
      new BokunError('Gone', 410, 'NOT_FOUND')
    )
    mockedGetBokunClient.mockReturnValue(client as never)

    const { req, findByID, update } = buildMockReq()
    findByID.mockResolvedValueOnce(buildTourDoc({ bokunExperienceId: 'exp_dead' }))

    await handler({ input: { tourId: 42 }, req: req as never } as never)

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          bokunSyncStatus: 'failed',
          bokunExperienceId: null,
        }),
      })
    )
  })

  it.each([408, 425, 500, 502, 503, 504])(
    'throws on %s so Payload retries (transient)',
    async (status) => {
      const client = buildMockClient()
      client.createExperience.mockRejectedValueOnce(
        new BokunError(`Status ${status}`, status, 'TRANSIENT')
      )
      mockedGetBokunClient.mockReturnValue(client as never)

      const { req, findByID } = buildMockReq()
      findByID.mockResolvedValueOnce(buildTourDoc())

      await expect(
        handler({ input: { tourId: 42 }, req: req as never } as never)
      ).rejects.toThrow(`Status ${status}`)
    }
  )

  it.each([400, 401, 403, 404, 422])(
    'marks failed (no retry) on permanent %s',
    async (status) => {
      const client = buildMockClient()
      client.createExperience.mockRejectedValueOnce(
        new BokunError(`Status ${status}`, status, 'PERMANENT')
      )
      mockedGetBokunClient.mockReturnValue(client as never)

      const { req, findByID, update } = buildMockReq()
      findByID.mockResolvedValueOnce(buildTourDoc())

      const result = await handler({
        input: { tourId: 42 },
        req: req as never,
      } as never)

      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ bokunSyncStatus: 'failed' }),
        })
      )
      expect(result).toMatchObject({ output: { error: expect.stringContaining(`Status ${status}`) } })
    }
  )

  it('passes skipBokunSync context flag on success write-back (recursive guard)', async () => {
    const client = buildMockClient()
    client.createExperience.mockResolvedValueOnce({ id: 'exp_1' })
    mockedGetBokunClient.mockReturnValue(client as never)

    const { req, findByID, update } = buildMockReq()
    findByID.mockResolvedValueOnce(buildTourDoc())

    await handler({ input: { tourId: 42 }, req: req as never } as never)

    const updateCall = update.mock.calls[0][0] as { context?: Record<string, unknown> }
    expect(updateCall.context?.skipBokunSync).toBe(true)
  })
})
