'use client'

/**
 * Tour CSV Import Button Component
 * Opens file picker for CSV upload and displays import results
 * Supports dry-run mode for validation without creating tours
 */

import { useState, useRef } from 'react'
import { Button } from '@payloadcms/ui'
import { TourCSVImportResultsModal, type ImportResultData } from './tour-csv-import-results-modal'

export function TourCSVImportButton() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ImportResultData | null>(null)
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
        throw new Error(data.error || data.message || 'Import failed')
      }

      setResults(data)
      setShowModal(true)
    } catch (error) {
      console.error('[TourCSVImportButton] Import error:', error)
      setResults({
        success: false,
        created: 0,
        skipped: 0,
        errors: [{ row: 0, message: error instanceof Error ? error.message : 'Import failed' }],
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

  const handleCloseModal = () => {
    const shouldRefresh = results?.created && results.created > 0 && !results.dryRun
    setShowModal(false)
    setResults(null)
    if (shouldRefresh) {
      window.location.reload()
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        aria-label="Select CSV file to import tours"
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
        <TourCSVImportResultsModal results={results} onClose={handleCloseModal} />
      )}
    </>
  )
}
