'use client'

/**
 * Tour CSV Actions Toolbar
 * Renders Export/Import CSV buttons in Tours collection list view
 * Used as beforeListTable component in Payload CMS admin
 */

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
