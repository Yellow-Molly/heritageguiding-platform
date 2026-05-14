# Phase 05: Payload Job + afterChange Hook

## Context Links
- Plan: [plan.md](./plan.md)
- Depends on: Phase 02 (client methods), Phase 03 (mapper), Phase 04 (sync fields)

## Overview
- **Priority:** P1
- **Status:** not-started
- **Effort:** 2-3h
- **Description:** Wire the full sync pipeline. Tour `afterChange` hook enqueues a `syncTourToBokun` Payload job. Job loads tour, runs mapper, calls client. Handles create-vs-update via `bokunExperienceId` presence. Retry on transient failures, mark `failed` after retries exhausted.

## Key Insights
- `afterChange` runs on EVERY save (create + update). Enqueue must be cheap (single DB insert).
- Job, not hook, calls the Bokun API. Hook stays fast and non-blocking.
- Determine create-vs-update by checking `bokunExperienceId` on the tour at job runtime (not enqueue time — avoids race)
- Idempotency: re-running the job for a synced tour should be safe (calls `updateExperience`, not `createExperience`)
- Skip enqueue for tours with `bokunSyncStatus === 'disabled'` (escape hatch)

## Requirements

### Functional
- `afterChange` hook on Tour collection enqueues `syncTourToBokun` job with `tourId` payload
- Job loads tour (depth=2 for guides/images), runs mapper, calls `createExperience` (no existing ID) or `updateExperience` (has ID)
- On success: write `bokunExperienceId` (if new), `bokunSyncStatus='synced'`, `bokunLastSyncedAt=now`, clear `bokunLastError`
- On failure: increment retry count; after max retries write `bokunSyncStatus='failed'`, `bokunLastError=<sanitized message>`
- Skip if `bokunSyncStatus === 'disabled'`
- Skip if Tour is being deleted (Payload `operation === 'delete'`)
- Avoid recursive enqueue: when the hook writes back the sync fields after job completes, it must not re-trigger itself

### Non-Functional
- Hook fires synchronously but `enqueue` returns instantly (DB insert only)
- Retry schedule: 30s, 2m, 10m, 1h (4 attempts total)
- 4xx errors (validation) → no retry, fail immediately
- 5xx / 429 / network errors → retry
- Logs include tourId, attempt number, status code, response time

## Related Code Files

### Create
- `packages/cms/lib/bokun/sync-tour-to-bokun-job.ts` — Payload Jobs task definition
- `packages/cms/lib/bokun/tour-bokun-sync-after-change-hook.ts` — afterChange hook
- `packages/cms/lib/bokun/sync-recursive-guard.ts` — utility to prevent infinite loops

### Modify
- `packages/cms/payload.config.ts` — register the `syncTourToBokun` task in `jobs.tasks`
- `packages/cms/collections/tours.ts` — wire afterChange hook

## Implementation Steps

1. **Define the Payload job task** (`sync-tour-to-bokun-job.ts`)
   ```typescript
   import type { TaskConfig } from 'payload'
   import { tourToBokunExperiencePayload } from 'apps/web/lib/bokun/tour-to-bokun-experience-mapper'
   import { bokunClient, BokunError } from 'apps/web/lib/bokun/bokun-api-client-with-hmac-authentication'

   export const syncTourToBokunTask: TaskConfig<'syncTourToBokun'> = {
     slug: 'syncTourToBokun',
     retries: { attempts: 4, backoff: { type: 'exponential', delay: 30000 } },
     inputSchema: [{ name: 'tourId', type: 'text', required: true }],
     handler: async ({ input, req }) => {
       const { payload } = req
       const tour = await payload.findByID({
         collection: 'tours',
         id: input.tourId,
         depth: 2,
         locale: 'all',
       })

       if (tour.bokunSyncStatus === 'disabled') return { output: { skipped: true } }

       try {
         const bokunPayload = tourToBokunExperiencePayload(tour)

         let experienceId = tour.bokunExperienceId
         if (experienceId) {
           await bokunClient.updateExperience(experienceId, bokunPayload)
         } else {
           const created = await bokunClient.createExperience(bokunPayload)
           experienceId = created.id
         }

         await payload.update({
           collection: 'tours',
           id: tour.id,
           data: {
             bokunExperienceId: experienceId,
             bokunSyncStatus: 'synced',
             bokunLastSyncedAt: new Date(),
             bokunLastError: null,
           },
           context: { skipBokunSync: true }, // recursive guard
         })

         return { output: { experienceId, action: tour.bokunExperienceId ? 'update' : 'create' } }
       } catch (err) {
         const isClientError = err instanceof BokunError && err.status >= 400 && err.status < 500 && err.status !== 429
         const message = sanitizeError(err)

         await payload.update({
           collection: 'tours',
           id: tour.id,
           data: {
             bokunSyncStatus: isClientError ? 'failed' : tour.bokunSyncStatus,
             bokunLastError: message,
           },
           context: { skipBokunSync: true },
         })

         if (isClientError) {
           return { output: { error: message, retried: false } } // no retry for 4xx
         }
         throw err // let Payload retry on 5xx/429/network
       }
     },
   }
   ```

2. **Define the afterChange hook** (`tour-bokun-sync-after-change-hook.ts`)
   ```typescript
   import type { CollectionAfterChangeHook } from 'payload'

   export const tourBokunSyncAfterChangeHook: CollectionAfterChangeHook = async ({
     doc, req, operation, context,
   }) => {
     if (operation === 'delete') return doc
     if (context?.skipBokunSync) return doc  // recursive guard
     if (doc.bokunSyncStatus === 'disabled') return doc

     await req.payload.jobs.queue({
       task: 'syncTourToBokun',
       input: { tourId: doc.id },
     })

     return doc
   }
   ```

3. **Register task in `payload.config.ts`**
   ```typescript
   import { syncTourToBokunTask } from './lib/bokun/sync-tour-to-bokun-job'

   export default buildConfig({
     // ...
     jobs: {
       tasks: [syncTourToBokunTask],
       autoRun: [{ queue: 'default', cron: '* * * * *' }], // every minute
     },
   })
   ```

4. **Wire hook in `tours.ts`**
   ```typescript
   hooks: {
     afterChange: [tourBokunSyncAfterChangeHook],
   }
   ```

5. **Sanitize error helper** — strip credentials, truncate to 500 chars, no stack traces

6. **Configure jobs worker**
   - Local dev: rely on `autoRun` cron OR run `npx payload jobs:run` manually
   - Production: requires either Vercel Cron / Vercel Queues / external scheduler hitting Payload's job-run endpoint (note for deployment phase, out of scope for code)

7. **Integration tests**
   - Mock Bokun client at module boundary
   - Test: hook enqueues job on save
   - Test: hook skips when `skipBokunSync` context set
   - Test: hook skips when `bokunSyncStatus === 'disabled'`
   - Test: job creates Experience when no `bokunExperienceId`
   - Test: job updates Experience when ID exists
   - Test: job writes `synced` status on success
   - Test: job writes `failed` status on 4xx (no retry)
   - Test: job throws on 5xx (Payload retries)
   - Test: recursive write does not re-enqueue (context guard works)

## Todo List

- [ ] Create `sync-tour-to-bokun-job.ts` with retry config
- [ ] Create `tour-bokun-sync-after-change-hook.ts` with recursive guard
- [ ] Create `sanitize-error.ts` helper
- [ ] Register task in `payload.config.ts`
- [ ] Wire hook into Tours collection
- [ ] Document local job runner command in README or phase-05 notes
- [ ] Write 9+ integration tests covering hook + job behavior
- [ ] Verify recursive guard prevents loops (manually + test)

## Success Criteria
- Saving a tour with `bokunSyncStatus !== 'disabled'` enqueues a job
- Job runs, calls correct create/update method based on `bokunExperienceId` presence
- Success: `bokunExperienceId` populated (if new), status='synced', `lastSyncedAt` set, error cleared
- 4xx errors set status='failed' with no retry
- 5xx errors trigger retry with backoff
- No infinite recursion (verified)
- All tests pass

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Recursive enqueue from job's write-back to Tour | `context.skipBokunSync` flag set on internal updates; hook checks |
| Concurrent jobs for same tour cause duplicate Experiences | First create writes `bokunExperienceId`; subsequent runs see ID and do update. Race only if 2 creates execute in parallel — Payload Jobs Queue serializes per-task by default; verify config |
| 4xx error wrongly classified as transient (or vice versa) | Explicit list: 400/401/403/404/422 → no retry; 408/429/5xx/network → retry |
| Job runs but Payload restart loses queue | Payload Jobs Queue is DB-backed; survives restart |
| Local dev: jobs don't auto-run without scheduler | Document manual command in phase-05; in dev, hook fires + queue persists; manual trigger to run |

## Security Considerations
- `sanitizeError` must strip secrets that could appear in error messages
- Truncate response bodies to avoid bloating CMS DB
- Confirm Payload's job worker runs with same privileges as web tier — don't expose worker to anon

## Next Steps
- Phase 06 adds an admin UI "Run sync now" button that calls `payload.jobs.queue` directly (bypasses the hook for manual retries)
- Phase 07 canary uses the full flow end-to-end
