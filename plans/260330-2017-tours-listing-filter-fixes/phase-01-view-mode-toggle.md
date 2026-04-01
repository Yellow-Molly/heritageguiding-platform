# Phase 1: View Mode Toggle Fix

**Status:** TODO
**Priority:** High

## Problem

`TourCatalogClient` manages `viewMode` state and passes it to `FilterBar`, but **never passes it to `TourGrid`**. `TourGrid` is a server component that always renders in `grid` mode (default param).

The toggle buttons visually update (highlight state changes) but the actual grid layout doesn't change.

## Root Cause

`viewMode` is client-side state in `TourCatalogClient`. `TourGrid` is a **server component** — it can't receive client state as a prop. The `children` slot pattern means `TourGrid` is rendered independently on the server.

## Solution (Validated: client-side only)

Keep `viewMode` as client state. Extract the grid rendering logic from the server `TourGrid` into a client component that accepts `viewMode` prop. The server component fetches data; the client component handles layout.

**Approach:** `TourCatalogClient` already manages `viewMode` state + passes it to `FilterBar`. Now also pass it to a new client wrapper around the tour cards, or restructure so `TourGrid` returns data and `TourCatalogClient` handles layout.

## Files to Modify

| File | Action |
|------|--------|
| `apps/web/app/(site)/[locale]/(frontend)/tours/tour-catalog-client.tsx` | Pass `viewMode` to children via render prop or context |
| `apps/web/components/tour/tour-grid.tsx` | Split: server fetches data, client renders layout with viewMode |

## Implementation Steps

1. **`tour-grid.tsx`**: Extract layout into a client component `TourGridLayout` that accepts `tours`, `viewMode`, and pagination props. The server `TourGrid` fetches data and passes it to `TourGridLayout`.
2. **`tour-catalog-client.tsx`**: Pass `viewMode` down to `TourGridLayout` (via context, render prop, or restructured children).
3. Simplest: make `TourGrid` pass tours as prop to a client `TourGridLayout`, and have `TourCatalogClient` wrap it with viewMode context.

## Success Criteria

- Clicking grid/list toggle changes layout instantly (no server round trip)
- FilterBar toggle state and grid layout stay in sync
- SSR still works for initial page load (server fetches data, client handles layout)
