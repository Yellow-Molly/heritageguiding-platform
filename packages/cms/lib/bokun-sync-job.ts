/**
 * Payload Job: syncTourToBokun
 *
 * Fired by the afterChange hook on the Tours collection. Loads the tour with
 * locale='all', runs the pure mapper, then calls Bokun create or update depending
 * on whether `bokunExperienceId` is already set. Persists status + ID + last error
 * back to the tour using a `skipBokunSync` context flag so the same hook does not
 * re-enqueue itself recursively.
 *
 * Retry policy:
 *  - 4xx (validation, auth, not-found) → no retry, status='failed'
 *  - 5xx / 429 / network → throw to let Payload retry with exponential backoff
 *
 * @see plans/260514-1437-bokun-integration/phase-05-payload-jobs-task-and-after-change-hook.md
 */

import type { TaskConfig } from 'payload'
import {
  BokunError,
  getBokunClient,
} from '../../../apps/web/lib/bokun/bokun-api-client-with-hmac-authentication'
import {
  tourToBokunExperiencePayload,
  type TourSource,
} from '../../../apps/web/lib/bokun/tour-to-bokun-experience-mapper'

const MAX_ERROR_LENGTH = 500

/**
 * Strip credentials and other secret-looking material from error messages
 * before persisting them to `bokunLastError`. Layered:
 *  1. Redact the value of any X-Bokun-* / Authorization header echoed back.
 *  2. Redact long opaque tokens (≥40 chars from a base64-ish alphabet).
 *
 * Threshold is 40 (not 32) to avoid false positives on hex digests / URL paths
 * while still catching realistic API keys.
 */
export function sanitizeBokunError(err: unknown): string {
  let message = err instanceof Error ? err.message : String(err)

  // Strip header values (Bokun-AccessKey, Bokun-Signature, Bokun-Date, Authorization, Bearer).
  message = message.replace(
    /(X-Bokun-(?:AccessKey|Signature|Date)|Authorization)\s*[:=]\s*\S+/gi,
    '$1: [REDACTED]'
  )
  message = message.replace(/Bearer\s+\S+/gi, 'Bearer [REDACTED]')

  // Catch loose long opaque tokens — 40 chars covers JWT bodies + most secrets,
  // and is long enough to skip ordinary URL paths and small hex digests.
  message = message.replace(/[A-Za-z0-9+/=_-]{40,}/g, '[REDACTED]')

  if (message.length > MAX_ERROR_LENGTH) {
    message = `${message.slice(0, MAX_ERROR_LENGTH)}…`
  }
  return message
}

/**
 * Transient HTTP statuses that should be retried. Whitelist (not blacklist) so
 * unknown future codes default to "permanent" — safer than retry-storming on a
 * misclassified error.
 */
const TRANSIENT_HTTP_STATUSES: ReadonlySet<number> = new Set([
  408, // Request Timeout (also raised by Bokun on HMAC clock-skew)
  425, // Too Early
  429, // Too Many Requests (also handled inside the client's own backoff)
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
])

/**
 * Permanent failure → no retry, mark `bokunSyncStatus='failed'`.
 * Anything in the transient set, plus network errors, throws back to Payload
 * for exponential-backoff retry.
 */
function isPermanentClientError(err: unknown): boolean {
  if (!(err instanceof BokunError)) return false
  if (TRANSIENT_HTTP_STATUSES.has(err.status)) return false
  return err.status >= 400 && err.status < 600
}

/**
 * 410 Gone = "the Experience id you tried to update no longer exists in Bokun".
 * Recover by clearing the stored id so the next sync re-creates the Experience.
 */
function isExperienceGone(err: unknown): boolean {
  return err instanceof BokunError && err.status === 410
}

interface SyncTourInput {
  tourId: number | string
}

interface SyncTourOutput {
  experienceId?: string
  action?: 'create' | 'update' | 'skipped'
  error?: string
}

export const syncTourToBokunTask: TaskConfig<{
  input: SyncTourInput
  output: SyncTourOutput
}> = {
  slug: 'syncTourToBokun',
  retries: {
    attempts: 4,
    backoff: { type: 'exponential', delay: 30_000 },
  },
  inputSchema: [{ name: 'tourId', type: 'text', required: true }],
  handler: async ({ input, req }) => {
    const { payload } = req
    const tourId = input.tourId

    const tour = (await payload.findByID({
      collection: 'tours',
      id: tourId,
      depth: 2,
      locale: 'all',
    })) as unknown as
      | (TourSource & {
          id: number | string
          bokunExperienceId?: string | null
          bokunSyncStatus?: 'pending' | 'synced' | 'failed' | 'disabled' | null
        })
      | null

    // Tour deleted between enqueue and execution — bail without retrying.
    if (!tour) {
      return { output: { action: 'skipped', error: 'Tour not found (deleted?)' } }
    }

    if (tour.bokunSyncStatus === 'disabled') {
      return { output: { action: 'skipped' } }
    }

    try {
      const bokunPayload = tourToBokunExperiencePayload(tour)
      const client = getBokunClient()

      let experienceId = tour.bokunExperienceId ?? undefined
      let action: 'create' | 'update'

      if (experienceId) {
        await client.updateExperience(experienceId, bokunPayload)
        action = 'update'
      } else {
        const created = await client.createExperience(bokunPayload)
        experienceId = created.id ?? created.experienceId
        action = 'create'
        if (!experienceId) {
          // Bokun returned 2xx but no id — treat as permanent (4xx-class) so we don't
          // pointlessly retry; surface the failure in the admin UI for human follow-up.
          throw new BokunError(
            'Bokun create returned no experience id',
            422,
            'NO_ID_IN_RESPONSE'
          )
        }
      }

      // Cast `data` because the generated Tour type doesn't yet include the new
      // bokunSyncStatus / bokunLastSyncedAt / bokunLastError fields until Payload
      // regenerates payload-types.ts on next dev-server boot (additive schema change).
      await payload.update({
        collection: 'tours',
        id: tour.id,
        data: {
          bokunExperienceId: experienceId,
          bokunSyncStatus: 'synced',
          bokunLastSyncedAt: new Date().toISOString(),
          bokunLastError: null,
        } as Record<string, unknown>,
        context: { skipBokunSync: true },
      })

      return { output: { experienceId, action } }
    } catch (err) {
      const message = sanitizeBokunError(err)
      const permanent = isPermanentClientError(err)
      const gone = isExperienceGone(err)

      await payload.update({
        collection: 'tours',
        id: tour.id,
        data: {
          bokunSyncStatus: permanent ? 'failed' : tour.bokunSyncStatus ?? 'pending',
          bokunLastError: message,
          // 410 Gone → wipe the stale id so the NEXT sync re-creates the Experience.
          ...(gone ? { bokunExperienceId: null } : {}),
        } as Record<string, unknown>,
        context: { skipBokunSync: true },
      })

      if (permanent) {
        // Don't throw — Payload would retry. Return the error in the output instead.
        return { output: { error: message } }
      }
      throw err // transient (408/425/429/5xx) or network → Payload retries with exponential backoff
    }
  },
}
