'use client'

/**
 * Tour Excel Export Button Component
 * Downloads all tours as .xlsx file when clicked
 * Displays loading state during export operation
 */

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
    <Button
      onClick={handleExport}
      disabled={loading}
      buttonStyle="secondary"
      size="small"
    >
      {loading ? 'Exporting...' : 'Export Excel'}
    </Button>
  )
}
