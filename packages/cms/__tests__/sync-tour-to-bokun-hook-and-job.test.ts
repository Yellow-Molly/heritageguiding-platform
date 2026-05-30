/**
 * Tests for the Bokun outbound sync pipeline:
 *  - syncTourToBokunAfterChangeHook (enqueues a job, with skip rules)
 *  - syncTourToBokunTask handler (calls create vs update, persists status, retry semantics)
 *  - sanitizeBokunError helper (redacts secrets + truncates)
 *
 * The Bokun client is mocked at module boundary; Payload's payload + jobs are mocked
 * inline. Mapper is exercised end-to-end with a realistic TourSource fixture.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

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

// Mock the SQL writer module so tests can assert on primitive args directly
// instead of inspecting drizzle SQL template internals.
vi.mock('../lib/bokun-sync-sql-writes', () => ({
  writeBokunStatusViaSql: vi.fn().mockResolvedValue(undefined),
  writeBokunErrorStatusViaSql: vi.fn().mockResolvedValue(undefined),
  backfillBokunExtraIdsViaSql: vi.fn().mockResolvedValue(0),
}))

import { syncTourToBokunAfterChangeHook } from '../hooks/sync-tour-to-bokun-after-change-hook'
import {
  sanitizeBokunError,
  syncTourToBokunTask,
} from '../lib/bokun-sync-job'
import {
  BokunError,
  getBokunClient,
} from '../../../apps/web/lib/bokun/bokun-api-client-with-hmac-authentication'
import {
  backfillBokunExtraIdsViaSql,
  writeBokunErrorStatusViaSql,
  writeBokunStatusViaSql,
} from '../lib/bokun-sync-sql-writes'

const mockedGetBokunClient = vi.mocked(getBokunClient)
const mockedWriteStatus = vi.mocked(writeBokunStatusViaSql)
const mockedWriteErrorStatus = vi.mocked(writeBokunErrorStatusViaSql)
const mockedBackfillExtras = vi.mocked(backfillBokunExtraIdsViaSql)

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
    // Default to having an Experience ID so tours hit the UPDATE path — that's
    // the only supported flow on the Start plan and the only mode v1 fully
    // serializes. Tests that specifically exercise CREATE override this to null
    // AND set BOKUN_ALLOW_CREATE=true via vi.stubEnv.
    bokunExperienceId: 'exp_test',
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
  const dbExecute = vi.fn().mockResolvedValue({ rowCount: 1 })
  const logger = { error: vi.fn(), info: vi.fn(), warn: vi.fn() }
  const payload = {
    jobs: { queue },
    update,
    findByID,
    logger,
    // Mirror Payload's Postgres adapter shape so backfill SQL path can run.
    db: { drizzle: { execute: dbExecute } },
    ...overrides,
  }
  return {
    payload,
    queue,
    update,
    findByID,
    dbExecute,
    logger,
    req: { payload, ...overrides },
  }
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

  it('calls createExperience when BOKUN_ALLOW_CREATE=true and no bokunExperienceId', async () => {
    vi.stubEnv('BOKUN_ALLOW_CREATE', 'true')
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
    expect(mockedWriteStatus).toHaveBeenCalledWith(
      expect.anything(),
      42,
      expect.objectContaining({
        bokunExperienceId: 'exp_999',
        bokunSyncStatus: 'synced',
        bokunLastError: null,
      })
    )
    expect(result).toMatchObject({ output: { experienceId: 'exp_999', action: 'create' } })
    vi.unstubAllEnvs()
  })

  it('fails fast with MISSING_EXPERIENCE_ID when bokunExperienceId is empty and CREATE not allowed', async () => {
    const client = buildMockClient()
    mockedGetBokunClient.mockReturnValue(client as never)

    const { req, findByID } = buildMockReq()
    findByID.mockResolvedValueOnce(buildTourDoc({ bokunExperienceId: null }))

    const result = await handler({ input: { tourId: 42 }, req: req as never } as never)

    expect(client.createExperience).not.toHaveBeenCalled()
    expect(client.updateExperience).not.toHaveBeenCalled()
    expect(mockedWriteErrorStatus).toHaveBeenCalledWith(
      expect.anything(),
      42,
      expect.objectContaining({
        bokunSyncStatus: 'failed',
        bokunLastError: expect.stringContaining('bokunExperienceId is empty'),
      })
    )
    expect(result).toMatchObject({
      output: { error: expect.stringContaining('MISSING_EXPERIENCE_ID') },
    })
  })

  it('trims whitespace-only bokunExperienceId and triggers fail-fast', async () => {
    const client = buildMockClient()
    mockedGetBokunClient.mockReturnValue(client as never)

    const { req, findByID } = buildMockReq()
    findByID.mockResolvedValueOnce(buildTourDoc({ bokunExperienceId: '   ' }))

    const result = await handler({ input: { tourId: 42 }, req: req as never } as never)

    expect(client.updateExperience).not.toHaveBeenCalled()
    expect(result).toMatchObject({
      output: { error: expect.stringContaining('MISSING_EXPERIENCE_ID') },
    })
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
    expect(result).toMatchObject({ output: { experienceId: 'exp_existing', action: 'update' } })
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
    client.updateExperience.mockRejectedValueOnce(
      new BokunError('Validation failed', 400, 'VALIDATION')
    )
    mockedGetBokunClient.mockReturnValue(client as never)

    const { req, findByID } = buildMockReq()
    findByID.mockResolvedValueOnce(buildTourDoc())

    const result = await handler({ input: { tourId: 42 }, req: req as never } as never)

    expect(mockedWriteErrorStatus).toHaveBeenCalledWith(
      expect.anything(),
      42,
      expect.objectContaining({
        bokunSyncStatus: 'failed',
        bokunLastError: expect.stringContaining('Validation failed'),
      })
    )
    expect(result).toMatchObject({
      output: { error: expect.stringContaining('Validation failed') },
    })
  })

  it('throws on 5xx so Payload retries (status NOT marked failed)', async () => {
    const client = buildMockClient()
    client.updateExperience.mockRejectedValueOnce(
      new BokunError('Upstream timeout', 502, 'BAD_GATEWAY')
    )
    mockedGetBokunClient.mockReturnValue(client as never)

    const { req, findByID } = buildMockReq()
    findByID.mockResolvedValueOnce(buildTourDoc())

    await expect(
      handler({ input: { tourId: 42 }, req: req as never } as never)
    ).rejects.toThrow('Upstream timeout')

    // Error captured but status preserved (not 'failed') so admin sees retry-in-progress
    expect(mockedWriteErrorStatus).toHaveBeenCalledWith(
      expect.anything(),
      42,
      expect.objectContaining({
        bokunSyncStatus: 'pending',
        bokunLastError: expect.stringContaining('Upstream timeout'),
      })
    )
  })

  it('throws on 429 so Payload retries (transient)', async () => {
    const client = buildMockClient()
    client.updateExperience.mockRejectedValueOnce(
      new BokunError('Rate limited', 429, 'RATE_LIMIT')
    )
    mockedGetBokunClient.mockReturnValue(client as never)

    const { req, findByID } = buildMockReq()
    findByID.mockResolvedValueOnce(buildTourDoc())

    await expect(
      handler({ input: { tourId: 42 }, req: req as never } as never)
    ).rejects.toThrow('Rate limited')
  })

  it('treats 2xx with no id as permanent error (CREATE path)', async () => {
    vi.stubEnv('BOKUN_ALLOW_CREATE', 'true')
    const client = buildMockClient()
    client.createExperience.mockResolvedValueOnce({}) // missing id
    mockedGetBokunClient.mockReturnValue(client as never)

    const { req, findByID } = buildMockReq()
    findByID.mockResolvedValueOnce(buildTourDoc({ bokunExperienceId: null }))

    const result = await handler({ input: { tourId: 42 }, req: req as never } as never)

    expect(mockedWriteErrorStatus).toHaveBeenCalledWith(
      expect.anything(),
      42,
      expect.objectContaining({ bokunSyncStatus: 'failed' })
    )
    expect(result).toMatchObject({
      output: { error: expect.stringContaining('no experience id') },
    })
    vi.unstubAllEnvs()
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

    const { req, findByID } = buildMockReq()
    findByID.mockResolvedValueOnce(buildTourDoc({ bokunExperienceId: 'exp_dead' }))

    await handler({ input: { tourId: 42 }, req: req as never } as never)

    expect(mockedWriteErrorStatus).toHaveBeenCalledWith(
      expect.anything(),
      42,
      expect.objectContaining({
        bokunSyncStatus: 'failed',
        bokunExperienceId: null,
      })
    )
  })

  it.each([408, 425, 500, 502, 503, 504])(
    'throws on %s so Payload retries (transient)',
    async (status) => {
      const client = buildMockClient()
      client.updateExperience.mockRejectedValueOnce(
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
      client.updateExperience.mockRejectedValueOnce(
        new BokunError(`Status ${status}`, status, 'PERMANENT')
      )
      mockedGetBokunClient.mockReturnValue(client as never)

      const { req, findByID } = buildMockReq()
      findByID.mockResolvedValueOnce(buildTourDoc())

      const result = await handler({
        input: { tourId: 42 },
        req: req as never,
      } as never)

      expect(mockedWriteErrorStatus).toHaveBeenCalledWith(
        expect.anything(),
        42,
        expect.objectContaining({ bokunSyncStatus: 'failed' })
      )
      expect(result).toMatchObject({ output: { error: expect.stringContaining(`Status ${status}`) } })
    }
  )

  it('writes status via direct SQL (bypasses Payload validation → never recurses into afterChange hook)', async () => {
    // Direct SQL writes don't fire Payload's collection hooks, so the
    // recursion guard previously implemented via context.skipBokunSync is now
    // structurally unnecessary — bypassing Payload entirely makes the
    // recursive afterChange impossible. payload.update must NOT be called.
    const client = buildMockClient()
    client.updateExperience.mockResolvedValueOnce({})
    mockedGetBokunClient.mockReturnValue(client as never)

    const { req, findByID, update } = buildMockReq()
    findByID.mockResolvedValueOnce(buildTourDoc({ bokunExperienceId: 'exp_1' }))

    await handler({ input: { tourId: 42 }, req: req as never } as never)

    expect(update).not.toHaveBeenCalled()
    expect(mockedWriteStatus).toHaveBeenCalledWith(
      expect.anything(),
      42,
      expect.objectContaining({
        bokunExperienceId: 'exp_1',
        bokunSyncStatus: 'synced',
      })
    )
  })

  // ── Phase 04: extras-push gate + ID backfill ────────────────────────────────

  describe('extras push gate', () => {
    afterEach(() => vi.unstubAllEnvs())

    it('default (env off, baseline null) → optionalAddOns NOT in payload, reason=gate-disabled', async () => {
      const client = buildMockClient()
      client.updateExperience.mockResolvedValueOnce({})
      mockedGetBokunClient.mockReturnValue(client as never)

      const { req, findByID } = buildMockReq()
      findByID.mockResolvedValueOnce(
        buildTourDoc({
          optionalAddOns: [
            { id: 'cms-1', name: { en: 'Museum' }, bokunExtraId: null },
          ],
        })
      )

      const result = await handler({ input: { tourId: 42 }, req: req as never } as never)

      const [, payload] = client.updateExperience.mock.calls[0] as [string, { extras?: unknown }]
      expect(payload.extras).toBeUndefined()
      expect(result).toMatchObject({ output: { extrasGateReason: 'gate-disabled' } })
    })

    it('env on but no baseline → still NOT pushed, reason=baseline-not-adopted', async () => {
      vi.stubEnv('BOKUN_EXTRAS_PUSH_ENABLED', 'true')
      const client = buildMockClient()
      client.updateExperience.mockResolvedValueOnce({})
      mockedGetBokunClient.mockReturnValue(client as never)

      const { req, findByID } = buildMockReq()
      findByID.mockResolvedValueOnce(
        buildTourDoc({
          bokunExtrasBaselineAt: null,
          optionalAddOns: [
            { id: 'cms-1', name: { en: 'Museum' }, bokunExtraId: null },
          ],
        })
      )

      const result = await handler({ input: { tourId: 42 }, req: req as never } as never)
      const [, payload] = client.updateExperience.mock.calls[0] as [string, { extras?: unknown }]
      expect(payload.extras).toBeUndefined()
      expect(result).toMatchObject({
        output: { extrasGateReason: 'baseline-not-adopted' },
      })
    })

    it('env on + baseline set → extras included AND IDs backfilled from PUT response', async () => {
      vi.stubEnv('BOKUN_EXTRAS_PUSH_ENABLED', 'true')

      const client = buildMockClient()
      client.updateExperience.mockResolvedValueOnce({
        extras: [
          {
            id: 5378,
            externalId: 'cms-1',
            title: 'Museum',
            type: 'OTHERS',
            maxPerBooking: 99,
            limitByPax: false,
          },
        ],
      })
      mockedGetBokunClient.mockReturnValue(client as never)

      const { req, findByID } = buildMockReq()
      const tourDoc = buildTourDoc({
        bokunExtrasBaselineAt: '2026-05-29T12:00:00.000Z',
        optionalAddOns: [
          { id: 'cms-1', name: { en: 'Museum' }, bokunExtraId: null },
        ],
      })
      findByID.mockResolvedValueOnce(tourDoc)

      const result = await handler({ input: { tourId: 42 }, req: req as never } as never)

      const [, payload] = client.updateExperience.mock.calls[0] as [
        string,
        { extras?: Array<{ externalId: string }> },
      ]
      expect(payload.extras).toHaveLength(1)
      expect(payload.extras?.[0].externalId).toBe('cms-1')

      // Backfill helper invoked with the Bokun-returned extras list.
      expect(mockedBackfillExtras).toHaveBeenCalledWith(
        expect.anything(),
        42,
        expect.arrayContaining([
          expect.objectContaining({ id: 5378, externalId: 'cms-1' }),
        ])
      )
      expect(result).toMatchObject({ output: { extrasGateReason: 'pushed' } })
    })

    it('env on + baseline set + no new rows → backfill still runs (no-op SQL); status writer called', async () => {
      vi.stubEnv('BOKUN_EXTRAS_PUSH_ENABLED', 'true')

      const client = buildMockClient()
      client.updateExperience.mockResolvedValueOnce({
        extras: [
          {
            id: 276080,
            externalId: 'cms-1',
            title: 'Museum',
            type: 'OTHERS',
            maxPerBooking: 99,
            limitByPax: false,
          },
        ],
      })
      mockedGetBokunClient.mockReturnValue(client as never)

      const { req, findByID, update } = buildMockReq()
      const tourDoc = buildTourDoc({
        bokunExtrasBaselineAt: '2026-05-29T12:00:00.000Z',
        optionalAddOns: [
          { id: 'cms-1', name: { en: 'Museum' }, bokunExtraId: '276080' }, // already wired
        ],
      })
      findByID.mockResolvedValueOnce(tourDoc)

      await handler({ input: { tourId: 42 }, req: req as never } as never)

      // payload.update is never used — the SQL helpers cover both status + backfill.
      expect(update).not.toHaveBeenCalled()
      expect(mockedWriteStatus).toHaveBeenCalledTimes(1)
      // Backfill helper still called; its internal SQL is a no-op because the
      // WHERE clause skips already-wired rows.
      expect(mockedBackfillExtras).toHaveBeenCalledTimes(1)
    })

    it('env on + baseline set + zero CMS rows → wire payload includes extras:[] (delete all in Bokun)', async () => {
      // Regression for the "operator deletes the last add-on" edge case: spec
      // promises Bokun cleans up its side; without the explicit empty-array
      // override the wire would omit `extras` and Bokun would retain stale state.
      vi.stubEnv('BOKUN_EXTRAS_PUSH_ENABLED', 'true')

      const client = buildMockClient()
      client.updateExperience.mockResolvedValueOnce({})
      mockedGetBokunClient.mockReturnValue(client as never)

      const { req, findByID } = buildMockReq()
      findByID.mockResolvedValueOnce(
        buildTourDoc({
          bokunExtrasBaselineAt: '2026-05-29T12:00:00.000Z',
          optionalAddOns: [], // baselined tour now has zero rows
        })
      )

      await handler({ input: { tourId: 42 }, req: req as never } as never)
      const [, payload] = client.updateExperience.mock.calls[0] as [string, { extras?: unknown[] }]
      expect(payload.extras).toEqual([])
    })

    it('regression: 2026-05-29 — payload.update is NEVER used (status+backfill go through SQL helpers)', async () => {
      // Root cause: Payload v3's update operation runs beforeChange/validation
      // across the WHOLE merged document, including existing optionalAddOns
      // rows. The localized `name` field fails its required check against the
      // validation locale (different from the locale the operator filled) →
      // "Add-ons > Name: required" even though we only patched status fields.
      // Fix: bypass payload.update entirely via direct SQL helpers.
      vi.stubEnv('BOKUN_EXTRAS_PUSH_ENABLED', 'true')

      const client = buildMockClient()
      client.updateExperience.mockResolvedValueOnce({
        extras: [
          {
            id: 7777,
            externalId: 'cms-1',
            title: 'Museum',
            type: 'OTHERS',
            maxPerBooking: 99,
            limitByPax: false,
          },
        ],
      })
      mockedGetBokunClient.mockReturnValue(client as never)

      const { req, findByID, update } = buildMockReq()
      const tourDoc = buildTourDoc({
        bokunExtrasBaselineAt: '2026-05-29T12:00:00.000Z',
        optionalAddOns: [
          { id: 'cms-1', name: { en: 'Museum' }, bokunExtraId: null },
        ],
      })
      findByID.mockResolvedValueOnce(tourDoc)

      await handler({ input: { tourId: 42 }, req: req as never } as never)

      // payload.update is the broken path — must not be touched.
      expect(update).not.toHaveBeenCalled()
      // Both SQL helpers were used: status write + extras backfill.
      expect(mockedWriteStatus).toHaveBeenCalledTimes(1)
      expect(mockedBackfillExtras).toHaveBeenCalledTimes(1)
    })

    it('race-safe: backfill SQL only touches bokun_extra_id, never clobbers concurrent edits to other fields', async () => {
      // With SQL backfill the lost-update race that existed for the old
      // full-row payload.update path is gone — UPDATE targets a single
      // non-localized column on a specific row, leaving everything else
      // (localized name/description, prices, isRequired) untouched.
      vi.stubEnv('BOKUN_EXTRAS_PUSH_ENABLED', 'true')

      const client = buildMockClient()
      client.updateExperience.mockResolvedValueOnce({
        extras: [
          {
            id: 9999,
            externalId: 'cms-1',
            title: 'Museum',
            type: 'OTHERS',
            maxPerBooking: 99,
            limitByPax: false,
          },
        ],
      })
      mockedGetBokunClient.mockReturnValue(client as never)

      const { req, findByID, update } = buildMockReq()
      findByID.mockResolvedValueOnce(
        buildTourDoc({
          bokunExtrasBaselineAt: '2026-05-29T12:00:00.000Z',
          optionalAddOns: [
            {
              id: 'cms-1',
              name: { en: 'Museum' },
              description: { en: 'old' },
              bokunExtraId: null,
            },
          ],
        })
      )

      await handler({ input: { tourId: 42 }, req: req as never } as never)

      // payload.update never called → cannot clobber concurrent edits.
      expect(update).not.toHaveBeenCalled()
      // Backfill happened via SQL helper.
      expect(mockedBackfillExtras).toHaveBeenCalledTimes(1)
    })

    it('env on + baseline set + only invalid rows (no titles) → still pushes extras:[]', async () => {
      // Rows with no usable title get filtered by the serializer; the result is
      // semantically the same as zero rows → wipe Bokun-side.
      vi.stubEnv('BOKUN_EXTRAS_PUSH_ENABLED', 'true')

      const client = buildMockClient()
      client.updateExperience.mockResolvedValueOnce({})
      mockedGetBokunClient.mockReturnValue(client as never)

      const { req, findByID } = buildMockReq()
      findByID.mockResolvedValueOnce(
        buildTourDoc({
          bokunExtrasBaselineAt: '2026-05-29T12:00:00.000Z',
          optionalAddOns: [{ id: 'cms-broken', name: {}, bokunExtraId: null }],
        })
      )

      await handler({ input: { tourId: 42 }, req: req as never } as never)
      const [, payload] = client.updateExperience.mock.calls[0] as [string, { extras?: unknown[] }]
      expect(payload.extras).toEqual([])
    })
  })
})
