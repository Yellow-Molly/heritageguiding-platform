/**
 * Payload afterChange hook on Tours collection.
 *
 * Enqueues a `syncTourToBokun` job whenever a tour is created or updated, unless:
 *  - the operation is a delete (handled separately by Payload),
 *  - `context.skipBokunSync` is set (the sync job itself sets this when writing back
 *    sync metadata, breaking the otherwise-recursive loop),
 *  - `bokunSyncStatus === 'disabled'` (operator escape-hatch on a per-tour basis).
 *
 * Hook stays cheap — it does a single `jobs.queue` insert and returns immediately.
 * The actual Bokun API call happens in the worker process (see `bokun-sync-job.ts`).
 */

import type { CollectionAfterChangeHook } from 'payload'

export const syncTourToBokunAfterChangeHook: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
  context,
}) => {
  if (operation !== 'create' && operation !== 'update') return doc
  // Payload's RequestContext is already an indexable record — no cast needed.
  if (context?.skipBokunSync) return doc
  if (doc.bokunSyncStatus === 'disabled') return doc

  try {
    // Cast: generated payload-types.ts has `jobs.tasks: unknown` until the dev server
    // boots once with the new task registered and regenerates types.
    await req.payload.jobs.queue({
      task: 'syncTourToBokun',
      input: { tourId: doc.id },
    } as Parameters<typeof req.payload.jobs.queue>[0])
  } catch (err) {
    // Don't fail the save just because the queue insert errored — log loudly.
    req.payload.logger.error(
      { err, tourId: doc.id },
      '[bokun-sync] failed to enqueue syncTourToBokun job'
    )
  }

  return doc
}
