# Phase 03: Admin UI Components

## Context Links

- [Plan Overview](./plan.md)
- [Phase 01: Export Service](./phase-01-csv-export-service.md)
- [Phase 02: Import Service](./phase-02-csv-import-service.md)
- [Payload Admin Customization Research](./research/researcher-payload-admin-customization.md)
- [Code Standards](../../docs/code-standards.md)

## Overview

| Priority | Status | Effort |
|----------|--------|--------|
| P2 | pending | 1h |

Add Export/Import CSV buttons to Tours collection list view in Payload CMS admin panel using `beforeListTable` component slot.

## Key Insights

- Payload 3.0 supports `admin.components.beforeListTable` for custom components
- Use `'use client'` directive for interactive components
- `@payloadcms/ui` provides Button, Modal components
- File input hidden, triggered by label button
- Show import results in modal or inline feedback

## Requirements

### Functional
- Export button downloads CSV immediately
- Import button opens file picker (.csv only)
- Show loading state during operations
- Display import results (created, skipped, errors)
- Download sample CSV template

### Non-Functional
- Buttons styled consistent with Payload admin
- Accessible (keyboard, screen reader)
- Mobile-friendly layout

## Architecture

```
packages/cms/components/admin/
├── tour-csv-actions-toolbar.tsx        # Main toolbar component
├── tour-csv-export-button.tsx          # Export button logic
├── tour-csv-import-button.tsx          # Import with file picker
└── tour-csv-import-results-modal.tsx   # Results display modal
```

## Related Code Files

### Files to Create
- `packages/cms/components/admin/tour-csv-actions-toolbar.tsx`
- `packages/cms/components/admin/tour-csv-export-button.tsx`
- `packages/cms/components/admin/tour-csv-import-button.tsx`
- `packages/cms/components/admin/tour-csv-import-results-modal.tsx`

### Files to Modify
- `packages/cms/collections/tours.ts` - Add `admin.components.beforeListTable`

## Implementation Steps

### Step 1: Create Export Button Component
```typescript
// packages/cms/components/admin/tour-csv-export-button.tsx
'use client'

import { useState } from 'react'
import { Button } from '@payloadcms/ui'

export function TourCSVExportButton() {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/tours/export-csv', {
        method: 'GET',
        credentials: 'include', // Include auth cookies
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      // Download file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tours-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export error:', error)
      alert('Export failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleExport}
      disabled={loading}
      buttonStyle="secondary"
      size="small"
    >
      {loading ? 'Exporting...' : 'Export CSV'}
    </Button>
  )
}
```

### Step 2: Create Import Button Component
```typescript
// packages/cms/components/admin/tour-csv-import-button.tsx
'use client'

import { useState, useRef } from 'react'
import { Button } from '@payloadcms/ui'
import { TourCSVImportResultsModal } from './tour-csv-import-results-modal'

interface ImportResult {
  success: boolean
  created: number
  skipped: number
  errors: { row: number; field?: string; message: string }[]
  warnings: { row: number; message: string }[]
}

export function TourCSVImportButton() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ImportResult | null>(null)
  const [showModal, setShowModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset file input for re-selection
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/tours/import-csv', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Import failed')
      }

      setResults(data)
      setShowModal(true)
    } catch (error) {
      console.error('Import error:', error)
      setResults({
        success: false,
        created: 0,
        skipped: 0,
        errors: [{ row: 0, message: error.message }],
        warnings: [],
      })
      setShowModal(true)
    } finally {
      setLoading(false)
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        aria-label="Select CSV file to import"
      />
      <Button
        onClick={handleButtonClick}
        disabled={loading}
        buttonStyle="secondary"
        size="small"
      >
        {loading ? 'Importing...' : 'Import CSV'}
      </Button>
      {showModal && results && (
        <TourCSVImportResultsModal
          results={results}
          onClose={() => {
            setShowModal(false)
            setResults(null)
            // Refresh list if tours were created
            if (results.created > 0) {
              window.location.reload()
            }
          }}
        />
      )}
    </>
  )
}
```

### Step 3: Create Results Modal Component
```typescript
// packages/cms/components/admin/tour-csv-import-results-modal.tsx
'use client'

import { Button } from '@payloadcms/ui'

interface ImportResult {
  success: boolean
  created: number
  skipped: number
  errors: { row: number; field?: string; message: string }[]
  warnings: { row: number; message: string }[]
}

interface Props {
  results: ImportResult
  onClose: () => void
}

export function TourCSVImportResultsModal({ results, onClose }: Props) {
  const hasErrors = results.errors.length > 0
  const hasWarnings = results.warnings.length > 0

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'var(--theme-bg)',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '600px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: '0 0 16px', fontSize: '1.25rem' }}>
          Import Results
        </h2>

        {/* Summary */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              padding: '12px',
              backgroundColor: 'var(--theme-success-50)',
              borderRadius: '4px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {results.created}
            </div>
            <div style={{ fontSize: '0.875rem' }}>Created</div>
          </div>
          <div
            style={{
              padding: '12px',
              backgroundColor: 'var(--theme-warning-50)',
              borderRadius: '4px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {results.skipped}
            </div>
            <div style={{ fontSize: '0.875rem' }}>Skipped</div>
          </div>
          <div
            style={{
              padding: '12px',
              backgroundColor: hasErrors
                ? 'var(--theme-error-50)'
                : 'var(--theme-elevation-50)',
              borderRadius: '4px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              {results.errors.length}
            </div>
            <div style={{ fontSize: '0.875rem' }}>Errors</div>
          </div>
        </div>

        {/* Errors */}
        {hasErrors && (
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '8px', color: 'var(--theme-error-500)' }}>
              Errors
            </h3>
            <ul
              style={{
                margin: 0,
                padding: '0 0 0 20px',
                maxHeight: '150px',
                overflow: 'auto',
              }}
            >
              {results.errors.slice(0, 20).map((err, i) => (
                <li key={i} style={{ fontSize: '0.875rem', marginBottom: '4px' }}>
                  <strong>Row {err.row}</strong>
                  {err.field && ` (${err.field})`}: {err.message}
                </li>
              ))}
              {results.errors.length > 20 && (
                <li style={{ fontSize: '0.875rem', fontStyle: 'italic' }}>
                  ...and {results.errors.length - 20} more errors
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Warnings */}
        {hasWarnings && (
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '8px', color: 'var(--theme-warning-500)' }}>
              Warnings (Skipped)
            </h3>
            <ul
              style={{
                margin: 0,
                padding: '0 0 0 20px',
                maxHeight: '100px',
                overflow: 'auto',
              }}
            >
              {results.warnings.slice(0, 10).map((warn, i) => (
                <li key={i} style={{ fontSize: '0.875rem', marginBottom: '4px' }}>
                  <strong>Row {warn.row}</strong>: {warn.message}
                </li>
              ))}
              {results.warnings.length > 10 && (
                <li style={{ fontSize: '0.875rem', fontStyle: 'italic' }}>
                  ...and {results.warnings.length - 10} more warnings
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Close Button */}
        <div style={{ textAlign: 'right' }}>
          <Button onClick={onClose} buttonStyle="primary">
            {results.created > 0 ? 'Close & Refresh' : 'Close'}
          </Button>
        </div>
      </div>
    </div>
  )
}
```

### Step 4: Create Main Toolbar Component
```typescript
// packages/cms/components/admin/tour-csv-actions-toolbar.tsx
'use client'

import { TourCSVExportButton } from './tour-csv-export-button'
import { TourCSVImportButton } from './tour-csv-import-button'

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
      <TourCSVImportButton />
    </div>
  )
}
```

### Step 5: Update Tours Collection Config
```typescript
// packages/cms/collections/tours.ts
import { TourCSVActionsToolbar } from '../components/admin/tour-csv-actions-toolbar'

export const Tours: CollectionConfig = {
  slug: 'tours',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'featured', 'guide'],
    group: 'Content',
    components: {
      beforeListTable: [TourCSVActionsToolbar],
    },
  },
  // ... rest of config
}
```

## Todo List

- [ ] Create tour-csv-export-button.tsx component
- [ ] Create tour-csv-import-button.tsx component
- [ ] Create tour-csv-import-results-modal.tsx component
- [ ] Create tour-csv-actions-toolbar.tsx wrapper
- [ ] Update tours.ts collection config with beforeListTable
- [ ] Test export button downloads CSV
- [ ] Test import button opens file picker
- [ ] Test results modal displays correctly
- [ ] Test page refresh after successful import
- [ ] Verify styling matches Payload admin theme

## Success Criteria

- [ ] Export button visible in Tours list view
- [ ] Import button visible in Tours list view
- [ ] Export downloads CSV file with correct name
- [ ] Import accepts .csv files only
- [ ] Loading states shown during operations
- [ ] Import results modal shows created/skipped/errors
- [ ] Page refreshes after successful import
- [ ] Buttons styled consistently with Payload admin
- [ ] Accessible via keyboard

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Component not rendering | Verify 'use client' directive, check imports |
| Modal z-index conflicts | Use high z-index (10000) |
| File picker not working | Use ref + click() pattern |
| Auth cookies not sent | credentials: 'include' in fetch |

## Security Considerations

- Buttons only visible to authenticated admin users
- API calls include auth cookies automatically
- No sensitive data exposed in client components

## Next Steps

After Phase 03 complete:
- Test full workflow: Export -> Edit -> Import
- Create sample CSV template for documentation
- Add to user documentation
