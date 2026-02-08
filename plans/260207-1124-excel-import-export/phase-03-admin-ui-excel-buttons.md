# Phase 03: Admin UI Excel Export/Import Buttons

## Context Links

- [Parent Plan](./plan.md)
- [Phase 01 - Export Service](./phase-01-excel-export-service.md)
- [Phase 02 - Import Service](./phase-02-excel-import-service.md)
- Reference: `packages/cms/components/admin/tour-csv-export-button.tsx` (57 lines)
- Reference: `packages/cms/components/admin/tour-csv-import-button.tsx` (99 lines)
- Reference: `packages/cms/components/admin/tour-csv-actions-toolbar.tsx` (27 lines)
- Reused: `packages/cms/components/admin/tour-csv-import-results-modal.tsx` (189 lines)

## Overview

- **Priority:** P2
- **Status:** Pending
- **Effort:** 1h
- **Description:** Add Excel export and import buttons to the Tours admin toolbar. Create two new button components following the exact pattern of existing CSV buttons. Update toolbar to show all four buttons.

## Key Insights

- CSV export button is 57 lines -- Excel version will be nearly identical, just different URL + filename
- CSV import button is 99 lines -- Excel version changes URL, file accept filter, and labels
- Import results modal is fully reusable -- `ImportResultData` type is format-agnostic
- Toolbar is a simple flex container -- just add two more components
- Payload CMS uses `@payloadcms/ui` `Button` component with `buttonStyle` and `size` props

## Requirements

### Functional
- "Export Excel" button downloads `.xlsx` file via `GET /api/tours/export-excel`
- "Import Excel" button opens file picker for `.xlsx` files, uploads to `POST /api/tours/import-excel`
- Import results shown in existing modal component (reused as-is)
- All four buttons visible in toolbar: Export CSV, Export Excel, Import CSV, Import Excel
- Loading state during export/import operations

### Non-Functional
- Each button component under 100 lines
- Follow exact same patterns as CSV button components
- No modifications to existing CSV components or results modal

## Architecture

```
tour-csv-actions-toolbar.tsx (MODIFIED)
  ├── TourCSVExportButton        (existing, unchanged)
  ├── TourExcelExportButton      (NEW)
  ├── TourCSVImportButton        (existing, unchanged)
  └── TourExcelImportButton      (NEW)
       └── TourCSVImportResultsModal (existing, reused)
```

## Related Code Files

### Files to Create
1. `packages/cms/components/admin/tour-excel-export-button.tsx` (~57 lines)
2. `packages/cms/components/admin/tour-excel-import-button.tsx` (~99 lines)

### Files to Modify
1. `packages/cms/components/admin/tour-csv-actions-toolbar.tsx` -- add Excel buttons

### Files to Delete
- None

## Implementation Steps

### Step 1: Create `tour-excel-export-button.tsx`

Path: `packages/cms/components/admin/tour-excel-export-button.tsx`

Copy `tour-csv-export-button.tsx` and change:
- Component name: `TourExcelExportButton`
- Fetch URL: `/api/tours/export-excel`
- Download filename: `` `tours-${new Date().toISOString().slice(0, 10)}.xlsx` ``
- Button label: `'Export Excel'` / `'Exporting...'`
- Console error prefix: `[TourExcelExportButton]`

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@payloadcms/ui'

export function TourExcelExportButton() {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/tours/export-excel', {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Export failed' }))
        throw new Error(error.error || 'Export failed')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tours-${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('[TourExcelExportButton] Export error:', error)
      alert(error instanceof Error ? error.message : 'Export failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleExport} disabled={loading} buttonStyle="secondary" size="small">
      {loading ? 'Exporting...' : 'Export Excel'}
    </Button>
  )
}
```

### Step 2: Create `tour-excel-import-button.tsx`

Path: `packages/cms/components/admin/tour-excel-import-button.tsx`

Copy `tour-csv-import-button.tsx` and change:
- Component name: `TourExcelImportButton`
- Fetch URL: `/api/tours/import-excel`
- File accept: `.xlsx`
- aria-label: `"Select Excel file to import tours"`
- Button label: `'Import Excel'` / `'Importing...'`
- Console error prefix: `[TourExcelImportButton]`

Key differences from CSV import button:
```typescript
// File input accept attribute
<input accept=".xlsx" ... />

// Fetch URL
const response = await fetch('/api/tours/import-excel', { ... })
```

Everything else identical -- same `FormData` construction, same `ImportResultData` type, same modal component.

### Step 3: Update `tour-csv-actions-toolbar.tsx`

Path: `packages/cms/components/admin/tour-csv-actions-toolbar.tsx`

Add imports and render all four buttons:

```typescript
'use client'

import { TourCSVExportButton } from './tour-csv-export-button'
import { TourExcelExportButton } from './tour-excel-export-button'
import { TourCSVImportButton } from './tour-csv-import-button'
import { TourExcelImportButton } from './tour-excel-import-button'

export function TourCSVActionsToolbar() {
  return (
    <div
      style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '16px',
        flexWrap: 'wrap',
      }}
    >
      <TourCSVExportButton />
      <TourExcelExportButton />
      <TourCSVImportButton />
      <TourExcelImportButton />
    </div>
  )
}
```

Button order: Export CSV | Export Excel | Import CSV | Import Excel -- grouped by operation type.

### Step 4: Verify Build

```bash
npm run build
```

Ensure:
- No TypeScript errors
- Payload admin importMap regenerates correctly
- All four buttons render in Tours list view

### Step 5: Manual UI Test

1. Navigate to `/admin/collections/tours`
2. Verify all four buttons visible in toolbar
3. Click "Export Excel" -- verify `.xlsx` downloads
4. Click "Import Excel" -- verify file picker opens with `.xlsx` filter
5. Upload a valid `.xlsx` file -- verify results modal shows
6. Verify "Export CSV" and "Import CSV" still work (regression check)

## Unit Tests

### Note on UI Testing

UI components are thin wrappers around `fetch()` calls + file pickers. Testing strategy:
- **No separate unit test files** for button components (same pattern as existing CSV buttons which have no dedicated tests)
- Verify via **build validation** (TypeScript compilation catches structural issues)
- Verify via **manual testing** in admin UI (buttons are simple event handlers)
- If the project adds component testing later, Excel buttons follow same pattern as CSV buttons

### Regression Tests
- Run existing CSV tests to ensure shared helper refactoring didn't break anything:
  - `packages/cms/__tests__/tour-csv-schema-validation.test.ts`
  - `packages/cms/__tests__/tour-csv-column-mapping.test.ts`
  - `packages/cms/__tests__/tour-csv-markdown-to-lexical-converter.test.ts`

## Todo List

- [ ] Create dropdown components: `tour-export-dropdown.tsx`, `tour-import-dropdown.tsx`
- [ ] Update `packages/cms/components/admin/tour-csv-actions-toolbar.tsx` with dropdowns
- [ ] Verify build passes
- [ ] Run existing CSV tests (regression check)
- [ ] Manual test: all export/import options in admin UI
- [ ] Manual test: CSV export/import still works

## Success Criteria

- All four buttons visible in Tours admin list view toolbar
- Excel export downloads valid `.xlsx` file
- Excel import opens file picker filtered to `.xlsx`
- Import results modal displays correctly for Excel imports
- Existing CSV buttons unaffected
- No TypeScript or build errors

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Payload importMap not picking up new components | Low | Medium | Run `npx payload generate:importmap` manually |
| Button styling inconsistency | Low | Low | All use same `buttonStyle="secondary" size="small"` |
| Too many buttons crowding toolbar | Low | Low | `flexWrap: 'wrap'` handles overflow gracefully |

## Security Considerations

- No new security surface -- buttons call authenticated API routes created in Phase 01/02
- File picker restricted to `.xlsx` via `accept` attribute (client-side only, server validates too)

## Next Steps

- After all 3 phases complete: end-to-end testing
- Future enhancement: consider a dropdown/menu to reduce button count if more formats added
- Future enhancement: add "Export Excel (selected)" for partial exports
