'use client'

/**
 * Tour CSV Import Results Modal
 * Displays import results with created/skipped/error counts
 * Shows detailed error and warning messages with row numbers
 */

import { Button } from '@payloadcms/ui'

export interface ImportResultData {
  success: boolean
  dryRun?: boolean
  created: number
  skipped: number
  errors: { row: number; field?: string; message: string }[]
  warnings: { row: number; message: string }[]
}

interface Props {
  results: ImportResultData
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
          Import Results {results.dryRun && '(Dry Run)'}
        </h2>

        {results.dryRun && (
          <p style={{ marginBottom: '16px', color: 'var(--theme-warning-500)', fontSize: '0.875rem' }}>
            This was a preview - no tours were actually created.
          </p>
        )}

        {/* Summary Grid */}
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
              backgroundColor: 'var(--theme-success-100)',
              borderRadius: '4px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--theme-success-600)' }}>
              {results.created}
            </div>
            <div style={{ fontSize: '0.875rem' }}>{results.dryRun ? 'Would Create' : 'Created'}</div>
          </div>
          <div
            style={{
              padding: '12px',
              backgroundColor: 'var(--theme-warning-100)',
              borderRadius: '4px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--theme-warning-600)' }}>
              {results.skipped}
            </div>
            <div style={{ fontSize: '0.875rem' }}>Skipped</div>
          </div>
          <div
            style={{
              padding: '12px',
              backgroundColor: hasErrors ? 'var(--theme-error-100)' : 'var(--theme-elevation-100)',
              borderRadius: '4px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: hasErrors ? 'var(--theme-error-600)' : 'inherit',
              }}
            >
              {results.errors.length}
            </div>
            <div style={{ fontSize: '0.875rem' }}>Errors</div>
          </div>
        </div>

        {/* Errors Section */}
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
                fontSize: '0.875rem',
              }}
            >
              {results.errors.slice(0, 20).map((err, i) => (
                <li key={i} style={{ marginBottom: '4px' }}>
                  <strong>Row {err.row}</strong>
                  {err.field && ` (${err.field})`}: {err.message}
                </li>
              ))}
              {results.errors.length > 20 && (
                <li style={{ fontStyle: 'italic' }}>...and {results.errors.length - 20} more errors</li>
              )}
            </ul>
          </div>
        )}

        {/* Warnings Section */}
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
                fontSize: '0.875rem',
              }}
            >
              {results.warnings.slice(0, 10).map((warn, i) => (
                <li key={i} style={{ marginBottom: '4px' }}>
                  <strong>Row {warn.row}</strong>: {warn.message}
                </li>
              ))}
              {results.warnings.length > 10 && (
                <li style={{ fontStyle: 'italic' }}>...and {results.warnings.length - 10} more warnings</li>
              )}
            </ul>
          </div>
        )}

        {/* Close Button */}
        <div style={{ textAlign: 'right' }}>
          <Button onClick={onClose} buttonStyle="primary">
            {results.created > 0 && !results.dryRun ? 'Close & Refresh' : 'Close'}
          </Button>
        </div>
      </div>
    </div>
  )
}
