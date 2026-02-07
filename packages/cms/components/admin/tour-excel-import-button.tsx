'use client'

/**
 * Tour Excel Import Button Component
 * Opens file picker for .xlsx upload and displays import results
 * Reuses existing TourCSVImportResultsModal for result display
 */

import { useState, useRef } from 'react'
import { Button } from '@payloadcms/ui'
import { TourCSVImportResultsModal, type ImportResultData } from './tour-csv-import-results-modal'

export function TourExcelImportButton() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<ImportResultData | null>(null)
  const [showModal, setShowModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/tours/import-excel', {
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
      console.error('[TourExcelImportButton] Import error:', error)
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
        accept=".xlsx"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        aria-label="Select Excel file to import tours"
      />
      <Button
        onClick={handleButtonClick}
        disabled={loading}
        buttonStyle="secondary"
        size="small"
      >
        {loading ? 'Importing...' : 'Import Excel'}
      </Button>
      {showModal && results && (
        <TourCSVImportResultsModal results={results} onClose={handleCloseModal} />
      )}
    </>
  )
}
