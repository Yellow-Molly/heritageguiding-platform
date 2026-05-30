---
phase: 05
title: "Adopt-Baseline Admin UI"
status: complete
effort: 2-3h
blocks: [06]
---

# Phase 05 — Adopt-Baseline Admin UI

## Context links

- Existing admin pattern: `packages/cms/components/admin/bokun-sync-status-pill.tsx`
- Tour schema: `packages/cms/collections/tours.ts` (sidebar — `bokunSyncPanel`)
- Sync job: `packages/cms/lib/bokun-sync-job.ts` (Phase 04)
- API client: `apps/web/lib/bokun/bokun-api-client-with-hmac-authentication.ts` (new `getExperience`)

## Overview

**Priority:** P1
**Status:** pending
**Goal:** Per-tour admin button that (1) GETs current Bokun extras for the tour, (2) shows a diff against CMS `optionalAddOns`, (3) on operator confirm, sets `tour.bokunExtrasBaselineAt = now()` → unlocks extras push for that tour.

This is the **one-time gate** preventing the first sync from silently deleting dashboard-only extras.

## Key insights

- Payload's `ui` field type supports rendering React components in the sidebar (existing pattern: `bokunSyncPanel`)
- API route pattern already exists: `apps/web/app/api/bokun/manual-sync/route.ts` (or similar) — extend or mirror for the GET-and-diff endpoint
- Diff UI should be brutally simple: 3 columns — "In CMS only" (will be CREATED in Bokun), "In Bokun only" (will be DELETED), "In both" (will be UPDATED)
- Operator clicks "I understand — adopt baseline" → POST to set `bokunExtrasBaselineAt`. From that moment, next tour save triggers full extras push.

## Requirements

### Functional
- New sidebar button on Tour edit page (visible when `bokunExperienceId` is set AND `bokunExtrasBaselineAt` is null)
- When clicked: opens modal, calls backend endpoint that GETs Bokun extras, returns diff against CMS
- Modal renders diff table + warning copy ("Pressing 'Adopt' allows future tour saves to push add-ons to Bokun. Bokun extras not mirrored in CMS will be DELETED on next save.")
- Operator confirms → POST sets `bokunExtrasBaselineAt = now()` → modal closes → page refreshes → sidebar now shows "Baseline adopted at [date]" instead of the button
- "Re-baseline" affordance: a less prominent button to clear/redo baseline if operator imported new dashboard extras after initial adoption

### Non-functional
- Auth: API endpoint requires Payload admin session (reuse existing `req.user` check pattern)
- All UI strings English-only (admin-side, no need to localize)
- Error states: GET fails → modal shows error, no state change

## Architecture

```
Sidebar (Tour edit page)
  └── BokunExtrasBaselinePanel (UI field)
        ├── if bokunExtrasBaselineAt is null:
        │     "Adopt baseline" button
        │     onClick → fetch /api/bokun/extras-baseline-preview?tourId={id}
        │              ↓
        │            modal (diff table + confirm)
        │              ↓
        │            POST /api/bokun/extras-baseline-adopt with tourId
        │              ↓
        │            updates tour.bokunExtrasBaselineAt, returns 200
        │              ↓
        │            page refreshes
        └── else:
              "Baseline adopted: {date}" + "Re-baseline" link

Backend:
  ├── GET /api/bokun/extras-baseline-preview
  │     ├── auth check (Payload admin only)
  │     ├── load tour with optionalAddOns
  │     ├── client.getExperience(tour.bokunExperienceId)
  │     ├── diff CMS rows vs Bokun extras
  │     └── return { onlyInCms[], onlyInBokun[], inBoth[] }
  └── POST /api/bokun/extras-baseline-adopt
        ├── auth check
        ├── payload.update tour with bokunExtrasBaselineAt = new Date()
        │   (use context.skipBokunSync = true to avoid triggering immediate full push)
        └── return 200
```

## Related code files

**Read:**
- `packages/cms/components/admin/tour-bokun-sync-panel.tsx` (existing sidebar UI — pattern to mirror)
- `packages/cms/components/admin/bokun-sync-status-pill.tsx`
- `apps/web/app/api/bokun/*/route.ts` (any existing Bokun route for auth pattern)
- `packages/cms/lib/bokun-sync-job.ts` (Phase 04 changes for env gate logic)

**Create:**
- `packages/cms/components/admin/tour-bokun-extras-baseline-panel.tsx` — sidebar component (client component, `'use client'`)
- `packages/cms/components/admin/bokun-extras-diff-modal.tsx` — diff display
- `apps/web/app/api/bokun/extras-baseline-preview/route.ts` — GET endpoint
- `apps/web/app/api/bokun/extras-baseline-adopt/route.ts` — POST endpoint

**Modify:**
- `packages/cms/collections/tours.ts` — add new `bokunExtrasBaselinePanel: ui` field below `bokunSyncPanel`

## Implementation steps

1. **Diff helper** (pure function, server-side):
   - `function diffExtras(cmsAddOns, bokunExtras): { onlyInCms: AddOn[], onlyInBokun: BokunExtra[], inBoth: Array<{cms, bokun}> }`
   - Matching: CMS row `bokunExtraId === bokun.id.toString()` → "inBoth"; else "onlyInCms" / "onlyInBokun"
   - Place in `apps/web/lib/bokun/diff-cms-bokun-extras.ts` for reuse + isolated testing
2. **Preview endpoint** (`route.ts`):
   - Validate admin auth (mirror existing endpoint's check)
   - Load tour + GET Bokun experience
   - Call diff helper
   - Return JSON
3. **Adopt endpoint** (`route.ts`):
   - Auth check
   - `payload.update` tour with `bokunExtrasBaselineAt: new Date()`, `context: { skipBokunSync: true }` so the adoption itself doesn't trigger an immediate push
4. **Sidebar component**:
   - Read current `bokunExtrasBaselineAt` from Payload's form context (`useFormFields` or similar — match existing pattern in `tour-bokun-sync-panel.tsx`)
   - If null + `bokunExperienceId` set: render "Adopt baseline" button
   - On click: fetch preview, open modal
   - Modal: render diff table with clear warning copy, "Adopt" + "Cancel" buttons
   - On Adopt: POST adopt endpoint, on success: `router.refresh()` (Next.js) or window.location.reload()
   - If `bokunExtrasBaselineAt` is set: render readonly "Baseline adopted: {formatted date}" + "Re-baseline" link (re-opens modal but POST clears the field first then re-sets — or simpler: same modal flow, idempotent set)
5. **Re-baseline path**: simplest is identical to first-adopt flow (re-runs diff, re-sets timestamp). Document that "Re-baseline" doesn't undo prior pushes — Bokun state is already what it is.

## Todo list

- [ ] Implement `diffExtras` helper + 4 unit tests (empty cases, all-cms, all-bokun, mixed)
- [ ] Build preview API route + auth
- [ ] Build adopt API route + auth + skipBokunSync context
- [ ] Build sidebar React component
- [ ] Build modal component
- [ ] Wire UI field in tours.ts collection
- [ ] Smoke test against sandbox tour (real-tour walk-through)
- [ ] `npm run build` + lint passes

## Success criteria

- Tour without baseline: button visible, diff loads, operator can adopt
- After adoption: button disappears, "Baseline adopted at X" shows, next tour save pushes extras
- Tour without `bokunExperienceId`: button hidden entirely (extras push impossible without an Experience)
- API endpoints reject non-admin requests
- "Adopt" action does NOT immediately push extras (operator can still review/edit before saving)

## Risks

- **Operator clicks Adopt without reading diff** — UI mitigates: prominent warning copy, primary CTA labeled "Adopt — this will allow future deletions in Bokun"
- **GET preview times out** — show error, allow retry; baseline NOT set on failure
- **Bokun extras change between preview and tour save** — small race window. Acceptable — operator is signing off on a snapshot in time. Document.
- **`useFormFields` API drift in Payload 3.x** — verify pattern matches existing `tour-bokun-sync-panel.tsx` before building

## Security considerations

- Both endpoints REQUIRE admin auth (Payload session) — no unauthenticated access
- Adopt endpoint mutates a tour field — log to audit trail if Payload has one configured
- No PII handled by these endpoints; only tour config

## Next steps

- Phase 06 canaries the full flow end-to-end on a real sandbox tour
