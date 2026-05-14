# Phase 04: Tour Collection Sync Fields

## Context Links
- Plan: [plan.md](./plan.md)
- Tour collection: `packages/cms/collections/tours.ts`

## Overview
- **Priority:** P1
- **Status:** not-started
- **Effort:** 1h
- **Description:** Add three sidebar fields to Tour collection for surfacing sync status, last-success timestamp, and last error to admins.

## Key Insights
- These fields are **admin-only metadata** — not localized, not part of public Tour API
- `bokunExperienceId` already exists; we're adding siblings
- DB migration needed (Payload auto-generates on first start in dev; production needs explicit migration)
- Hidden from public read by adding `admin.position: 'sidebar'` + `access.read` gating

## Requirements

### Functional
- `bokunSyncStatus`: select enum (`pending`, `synced`, `failed`, `disabled`); default `pending` for new tours
- `bokunLastSyncedAt`: date; null until first successful sync
- `bokunLastError`: textarea; cleared on successful sync, populated on failure

### Non-Functional
- All three fields shown in sidebar group with `bokunExperienceId`
- Read-only in admin UI for non-admin users (visible but not editable) — admins can manually reset
- Not exposed via public REST/GraphQL API to anon users
- DB migration script generated and committed

## Related Code Files

### Modify
- `packages/cms/collections/tours.ts` — add 3 fields to existing sidebar group with `bokunExperienceId`
- `packages/cms/payload-types.ts` — regenerated (auto)

### Create
- `packages/cms/migrations/<timestamp>_add_bokun_sync_fields.ts` — Payload migration script

## Implementation Steps

1. **Locate existing `bokunExperienceId` field** in `tours.ts` (line 165 per scout)

2. **Group fields into a `bokun` sidebar group** (optional refactor — improves admin UI grouping):
   ```typescript
   {
     name: 'bokun',
     type: 'group',
     admin: { position: 'sidebar' },
     fields: [
       {
         name: 'experienceId',
         type: 'text',
         admin: { description: 'Bokun Experience ID — auto-populated after first sync' },
         index: true,
       },
       {
         name: 'syncStatus',
         type: 'select',
         options: [
           { label: 'Pending', value: 'pending' },
           { label: 'Synced', value: 'synced' },
           { label: 'Failed', value: 'failed' },
           { label: 'Disabled', value: 'disabled' },
         ],
         defaultValue: 'pending',
         admin: { description: 'Auto-managed by sync job' },
         index: true,
       },
       {
         name: 'lastSyncedAt',
         type: 'date',
         admin: { date: { pickerAppearance: 'dayAndTime' }, readOnly: true },
       },
       {
         name: 'lastError',
         type: 'textarea',
         admin: {
           description: 'Last sync failure message; cleared on success',
           readOnly: true,
         },
       },
     ],
   }
   ```
   - **Migration risk:** renaming `bokunExperienceId` → `bokun.experienceId` is a breaking change. Decision:
     - **If safer:** Keep `bokunExperienceId` at top level; add new fields as flat siblings with `bokun*` prefix
     - **If cleaner:** Group + migration script to copy values + update consuming code (`apps/web/lib/api/get-tour-by-slug.ts`, `tour-payload-mapper.ts`)
   - **Recommended (KISS):** Keep flat. Add `bokunSyncStatus`, `bokunLastSyncedAt`, `bokunLastError` as top-level siblings.

3. **Add fields (flat approach)** in `tours.ts`:
   ```typescript
   {
     name: 'bokunSyncStatus',
     type: 'select',
     options: [
       { label: 'Pending', value: 'pending' },
       { label: 'Synced', value: 'synced' },
       { label: 'Failed', value: 'failed' },
       { label: 'Disabled', value: 'disabled' },
     ],
     defaultValue: 'pending',
     admin: { position: 'sidebar', description: 'Bokun sync state' },
     index: true,
   },
   {
     name: 'bokunLastSyncedAt',
     type: 'date',
     admin: {
       position: 'sidebar',
       date: { pickerAppearance: 'dayAndTime' },
       readOnly: true,
     },
   },
   {
     name: 'bokunLastError',
     type: 'textarea',
     admin: {
       position: 'sidebar',
       description: 'Last Bokun sync failure',
       readOnly: true,
     },
   },
   ```

4. **Generate migration**
   - `npm -w packages/cms run migrate:create add-bokun-sync-fields` (or equivalent Payload CLI command)
   - Verify generated SQL adds the columns; commit migration file

5. **Run migration in dev**
   - `npm -w packages/cms run migrate`
   - Restart dev server; confirm fields appear in admin

6. **Update generated types**
   - `npm -w packages/cms run generate:types`
   - Verify `Tour` type now includes new fields in `packages/cms/payload-types.ts`

7. **Sanity check existing consumers** — ensure `apps/web/lib/api/get-tour-by-slug.ts` and `tour-payload-mapper.ts` don't fail with new fields (they should ignore unknown fields)

## Todo List

- [ ] Decide flat vs grouped (recommend flat for KISS)
- [ ] Add 3 fields to `tours.ts` in sidebar position
- [ ] Generate Payload migration
- [ ] Run migration locally; verify schema change
- [ ] Regenerate types; verify Tour type updated
- [ ] Smoke-test admin UI; verify new fields visible + readOnly behaviors correct
- [ ] Verify existing tour pages still render

## Success Criteria
- 3 new fields visible in Tour admin sidebar
- `bokunSyncStatus` defaults to `pending` on new tours
- `bokunLastSyncedAt` and `bokunLastError` are read-only in UI
- DB migration committed and re-runnable
- Existing public Tour API responses unaffected (or new fields appear but don't break anything)
- Build + tests pass

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Migration fails on production DB due to existing data | Migration is additive (only ADD COLUMN); safe |
| Field appears in public GraphQL/REST and leaks internal state | Add `access.read` on the fields to restrict to authenticated admins if needed; for v1 acceptable as low-sensitivity |
| Status defaults to `pending` on existing tours causes immediate enqueue storm | Phase 05 hook only fires on `afterChange`, not on backfill; safe |

## Security Considerations
- `bokunLastError` may contain API response text — sanitize before display (no HTML injection)
- These fields are admin metadata; don't expose to anon users via API. Confirm Payload default access denies anon writes; reads OK if values are low-sensitivity.

## Next Steps
- Phase 05 reads/writes these fields from the job
- Phase 06 surfaces them in the admin UI with custom component
