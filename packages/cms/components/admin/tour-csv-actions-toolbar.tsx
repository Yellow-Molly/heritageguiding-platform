'use client'

/**
 * Tour CSV Actions Toolbar
 * Renders Export/Import CSV buttons in Tours collection list view
 * Used as beforeListTable component in Payload CMS admin
 */

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
