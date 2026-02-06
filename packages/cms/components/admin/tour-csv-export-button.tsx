'use client'

/**
 * Tour CSV Export Button Component
 * Downloads all tours as CSV file when clicked
 * Displays loading state during export operation
 */

import { useState } from 'react'
import { Button } from '@payloadcms/ui'

export function TourCSVExportButton() {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/tours/export-csv', {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Export failed' }))
        throw new Error(error.error || 'Export failed')
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
      console.error('[TourCSVExportButton] Export error:', error)
      alert(error instanceof Error ? error.message : 'Export failed. Please try again.')
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
