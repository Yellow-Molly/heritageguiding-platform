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
import type {
  BokunExperienceUpdateResponse,
  BokunExperienceCreateResponse,
} from '../../../apps/web/lib/bokun/bokun-types'
import {
  backfillBokunExtraIdsViaSql,
  writeBokunErrorStatusViaSql,
  writeBokunStatusViaSql,
  type BokunSyncStatus,
} from './bokun-sync-sql-writes'

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

  // Always prepend HTTP status + errorCode for BokunError. Bokun sometimes
  // returns 4xx with no message body, leaving sanitizeBokunError to produce an
  // empty string that's useless in the admin UI; this guarantees the operator
  // sees at least the status code for diagnosis.
  if (err instanceof BokunError) {
    const trimmed = message.trim()
    const codeLabel = err.errorCode ? ` (${err.errorCode})` : ''
    const prefix = `Bokun HTTP ${err.status}${codeLabel}`
    message = trimmed ? `${prefix}: ${trimmed}` : prefix
  }

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

/**
 * Extras gate state — surfaced in the API response so the admin UI can
 * explain to the operator why extras weren't pushed despite the sync
 * "succeeding". Otherwise the panel just says "synced" and the operator
 * wonders why the Bokun dashboard is empty.
 */
export type ExtrasGateReason =
  | 'pushed' // gate open + at least one row → extras sent (or deletion sent)
  | 'gate-disabled' // BOKUN_EXTRAS_PUSH_ENABLED is not "true"
  | 'baseline-not-adopted' // tour.bokunExtrasBaselineAt is null

interface SyncTourOutput {
  experienceId?: string
  action?: 'create' | 'update' | 'skipped'
  error?: string
  extrasGateReason?: ExtrasGateReason
}

/**
 * Core sync logic, factored out so it can run BOTH inside Payload Jobs Queue
 * (with retries / backoff via the TaskConfig wrapper) AND directly from the
 * manual admin endpoint without depending on the payload_jobs table existing.
 *
 * Returns the same shape as the task `output`. Throws on transient errors
 * (so the task wrapper can re-raise to Payload for retry); the manual caller
 * should catch and surface as 500.
 *
 * @see plans/260514-1437-bokun-integration/phase-05-payload-jobs-task-and-after-change-hook.md
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function runBokunSyncForTour(
  payload: any,
  tourId: number | string
): Promise<SyncTourOutput> {
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
        bokunExtrasBaselineAt?: string | Date | null
      })
    | null

  // Tour deleted between enqueue and execution — bail without retrying.
  if (!tour) {
    return { action: 'skipped', error: 'Tour not found (deleted?)' }
  }

  if (tour.bokunSyncStatus === 'disabled') {
    return { action: 'skipped' }
  }

  // ── Extras push gate ────────────────────────────────────────────────────────
  // v1 extras sync is OFF unless BOTH:
  //   1. BOKUN_EXTRAS_PUSH_ENABLED=true (global kill switch — dark-deploy friendly),
  //   2. Per-tour `bokunExtrasBaselineAt` is set (operator has reviewed the diff
  //      and explicitly enabled push via the Phase 05 "Adopt baseline" button).
  // Until both conditions are met, optionalAddOns is excluded from the payload,
  // so existing tour text-sync behavior is unchanged.
  const extrasGloballyEnabled = process.env.BOKUN_EXTRAS_PUSH_ENABLED === 'true'
  const extrasBaselined = tour.bokunExtrasBaselineAt != null
  const extrasPushEnabled = extrasGloballyEnabled && extrasBaselined
  // Reason surfaced to the admin UI when the operator clicks Sync and the
  // Bokun dashboard ends up unchanged — explains the silent no-op gate state.
  const extrasGateReason: ExtrasGateReason = !extrasGloballyEnabled
    ? 'gate-disabled'
    : !extrasBaselined
      ? 'baseline-not-adopted'
      : 'pushed'

  try {
    const tourForMapping: TourSource = extrasPushEnabled
      ? tour
      : { ...tour, optionalAddOns: null }
    const bokunPayload = tourToBokunExperiencePayload(tourForMapping)

    // When push is enabled but CMS has zero (valid) add-on rows, force an
    // explicit empty `extras: []` on the wire so Bokun deletes its side
    // (full-replacement semantics — Phase 01 verified). Without this, the
    // mapper omits the key entirely and Bokun-side extras silently survive,
    // contradicting the "delete the last CMS row → Bokun cleans up" SOP.
    if (extrasPushEnabled && bokunPayload.extras === undefined) {
      bokunPayload.extras = []
    }

    const client = getBokunClient()

    const trimmedId = tour.bokunExperienceId?.trim() || undefined
    let experienceId = trimmedId
    let action: 'create' | 'update'
    let bokunResponse: BokunExperienceUpdateResponse | BokunExperienceCreateResponse | undefined

    if (experienceId) {
      bokunResponse = await client.updateExperience(experienceId, bokunPayload)
      action = 'update'
    } else if (process.env.BOKUN_ALLOW_CREATE === 'true') {
      // CREATE is gated off by default. Reasons:
      //  1. Bokun's Start plan rejects CREATE without BOX_SETTINGS (manual
      //     creation in the Bokun UI is the supported flow at that tier).
      //  2. Our v1 wire serializer only covers text fields; CREATE additionally
      //     requires rates, duration, location, etc. as typed DTOs that aren't
      //     mapped yet.
      // Set BOKUN_ALLOW_CREATE=true once both conditions are resolved.
      const created = await client.createExperience(bokunPayload)
      bokunResponse = created
      experienceId = created.id ?? created.experienceId
      action = 'create'
      if (!experienceId) {
        throw new BokunError(
          'Bokun create returned no experience id',
          422,
          'NO_ID_IN_RESPONSE'
        )
      }
    } else {
      throw new BokunError(
        'bokunExperienceId is empty. Create the Experience manually in Bokun, then paste its ID into the tour sidebar and click Sync again.',
        422,
        'MISSING_EXPERIENCE_ID'
      )
    }

    // Write sync status via direct SQL — see writeBokunStatusViaSql for the
    // reason `payload.update` cannot be used here. Skips Payload validation
    // on existing optionalAddOns rows that may have locale-asymmetric data.
    await writeBokunStatusViaSql(payload as never, tour.id, {
      bokunExperienceId: experienceId ?? null,
      bokunSyncStatus: 'synced',
      bokunLastSyncedAt: new Date().toISOString(),
      bokunLastError: null,
    })

    // ID backfill: when extras were pushed, Bokun's PUT response includes the
    // updated extras list with assigned numeric ids (Phase 01 verified).
    // Issued AFTER the status update so even if backfill fails the sync is
    // recorded as successful (Bokun side already has the new state).
    if (extrasPushEnabled && bokunResponse && 'extras' in bokunResponse && bokunResponse.extras) {
      try {
        const count = await backfillBokunExtraIdsViaSql(
          payload as never,
          tour.id,
          bokunResponse.extras
        )
        if (count > 0) {
          payload.logger?.info?.(
            { tourId: tour.id, backfilled: count },
            '[bokun-sync] backfilled bokun_extra_id on optionalAddOns rows'
          )
        }
      } catch (backfillErr) {
        // Backfill failure is non-fatal — sync already succeeded, operator
        // can copy IDs from Bokun manually if this consistently fails.
        payload.logger?.error?.(
          { err: backfillErr, tourId: tour.id },
          '[bokun-sync] backfill SQL failed (non-fatal — sync already complete)'
        )
      }
    }

    return { experienceId, action, extrasGateReason }
  } catch (err) {
    const message = sanitizeBokunError(err)
    const permanent = isPermanentClientError(err)
    const gone = isExperienceGone(err)

    // Direct SQL — same reason as success path. We don't want a recoverable
    // sync error masked by a separate "couldn't even write the error status"
    // failure caused by Payload's full-document validation.
    const newStatus: BokunSyncStatus = permanent
      ? 'failed'
      : tour.bokunSyncStatus ?? 'pending'
    await writeBokunErrorStatusViaSql(payload as never, tour.id, {
      // 410 Gone → wipe the stale id so the NEXT sync re-creates the Experience.
      // Otherwise keep whatever the tour already had — we never want to clobber
      // a working id on a transient failure.
      bokunExperienceId: gone ? null : tour.bokunExperienceId ?? null,
      bokunSyncStatus: newStatus,
      bokunLastError: message,
    })

    if (permanent) {
      // Don't throw — caller surfaces error from output instead of treating as retry.
      return { error: message }
    }
    throw err // transient (408/425/429/5xx) or network → caller decides retry
  }
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
    const output = await runBokunSyncForTour(req.payload, input.tourId)
    return { output }
  },
}
