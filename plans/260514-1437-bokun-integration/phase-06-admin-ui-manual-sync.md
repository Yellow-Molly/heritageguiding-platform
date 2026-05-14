# Phase 06: Admin UI — Manual Sync + Status Display

## Context Links
- Plan: [plan.md](./plan.md)
- Depends on: Phase 04 (sync fields), Phase 05 (job)

## Overview
- **Priority:** P2 (nice-to-have for v1 launch, can ship without if time-pressed; recommend including)
- **Status:** not-started
- **Effort:** 2-3h
- **Description:** Add a custom Payload admin field component on Tour edit page that surfaces sync state and provides a "Sync to Bokun now" button for manual retries.

## Key Insights
- Payload 3 supports custom field components via `admin.components.Field`
- Component is a server-or-client React component that receives current doc state
- Manual sync button enqueues the same task via REST endpoint — no special logic
- Status pill (synced/pending/failed) is a quick visual signal for editors
- Banner explaining "CMS is source of truth — edit here, not in Bokun" prevents editor confusion

## Requirements

### Functional
- Sticky panel on Tour edit page showing:
  - Current `bokunSyncStatus` as colored pill (green/grey/red)
  - `bokunLastSyncedAt` formatted human-readable (e.g. "5 minutes ago")
  - `bokunLastError` in collapsible details (if present)
  - "Sync to Bokun now" button — enqueues job for this tour
  - "Reset status" button (admin-only) — clears error and sets `bokunSyncStatus='pending'`
- One-line banner above panel: "CMS is the source of truth. Edits here overwrite Bokun on next sync."

### Non-Functional
- Component is client-side ('use client')
- Button disabled while a job for this tour is pending/running
- Polls job status every 5s while pending (or relies on Payload's built-in admin live updates if available)
- A11y: button has `aria-busy` during pending state

## Related Code Files

### Create
- `packages/cms/admin/components/tour-bokun-sync-panel.tsx` — main UI component
- `packages/cms/admin/components/sync-status-pill.tsx` — small reusable status pill
- `apps/web/app/api/admin/bokun/sync-tour/route.ts` — endpoint to enqueue job manually (POST with tourId)

### Modify
- `packages/cms/collections/tours.ts` — register custom field component on a virtual `bokunSyncPanel` UI field

## Implementation Steps

1. **Create the manual-sync endpoint** (`apps/web/app/api/admin/bokun/sync-tour/route.ts`)
   - Auth: require Payload-admin session (check `req.user.role === 'admin'`)
   - Body: `{ tourId: string }`
   - Action: call `payload.jobs.queue({ task: 'syncTourToBokun', input: { tourId } })`
   - Response: `{ ok: true, jobId: <string> }`
   - Errors: 401 if no session, 403 if not admin, 400 if missing tourId, 500 on failure

2. **Add a UI-only field to Tour collection** (renders the custom component)
   ```typescript
   {
     name: 'bokunSyncPanel',
     type: 'ui',
     admin: {
       components: {
         Field: '@/admin/components/tour-bokun-sync-panel.tsx',
       },
       position: 'sidebar',
     },
   }
   ```

3. **Build the status pill component** (`sync-status-pill.tsx`)
   - Small reusable presentational component
   - Props: `status: 'pending' | 'synced' | 'failed' | 'disabled'`
   - Returns colored badge

4. **Build the main panel** (`tour-bokun-sync-panel.tsx`)
   - Reads current doc state via Payload's `useDocumentInfo()` / `useField()` hooks
   - Displays: pill, last synced timestamp (relative time), last error (collapsed), buttons
   - "Sync now" button POSTs to `/api/admin/bokun/sync-tour` with current tour ID
   - Disable button while `bokunSyncStatus === 'pending'`
   - After enqueue, optimistically show "pending"; reload doc or poll for status update

5. **Add source-of-truth banner**
   - Plain `<div>` with neutral styling above the panel
   - Localized text: EN/SV/DE

6. **Smoke-test in admin**
   - Open a tour, see panel
   - Click "Sync now"; verify job enqueued (check `payload-jobs` collection)
   - Verify status pill updates after job completes
   - Simulate failure (bad API key in env); verify error surfaces

## Todo List

- [ ] Create `/api/admin/bokun/sync-tour` route with auth + enqueue
- [ ] Build `sync-status-pill.tsx`
- [ ] Build `tour-bokun-sync-panel.tsx` with all UI elements
- [ ] Add `bokunSyncPanel` UI field to Tours collection
- [ ] Add localized strings for banner + button labels (EN/SV/DE)
- [ ] Manual test: success + failure paths in admin UI
- [ ] Verify only admins can hit the manual-sync endpoint

## Success Criteria
- Editor sees sync state at a glance on every tour
- Editor can manually trigger a sync without leaving the page
- Failure errors are visible and clearly attributed
- Endpoint enforces admin-only access
- Component does not break Payload admin UI in any locale

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Custom component breaks Payload admin bundle | Test in dev before commit; Payload's component-resolution path requires correct config |
| Polling for status causes admin slowness | Use Payload's reactive form state instead of HTTP polling; or longer interval (10s) |
| Non-admin user calls sync endpoint | Server-side role check; never trust client-only |
| `bokunLastError` contains sensitive info | Already sanitized in Phase 05 |

## Security Considerations
- Endpoint requires authenticated admin (Payload session cookie)
- CSRF: confirm Payload's session cookie includes SameSite=Lax/Strict
- Rate-limit manual-sync endpoint (e.g. 5 requests/min/user) to prevent abuse

## Next Steps
- Phase 07 uses the manual-sync button to drive the canary validation
