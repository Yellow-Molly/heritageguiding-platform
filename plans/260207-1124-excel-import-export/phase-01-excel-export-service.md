# Phase 01: Excel Export Service + API Route

## Context Links

- [Parent Plan](./plan.md)
- [Excel Libraries Research](./research/researcher-excel-libraries.md)
- [Integration Patterns Research](./research/researcher-excel-integration-patterns.md)
- Reference: `packages/cms/lib/csv/tour-csv-export-service.ts` (63 lines)
- Reference: `apps/web/app/api/tours/export-csv/route.ts` (75 lines)

## Overview

- **Priority:** P2
- **Status:** Pending
- **Effort:** 2h
- **Description:** Create Excel export service using ExcelJS that reuses existing `flattenTourToCSVRow()` and `getCSVHeaders()` from CSV column mapping. Add API route for downloading `.xlsx` files.

## Key Insights

- `flattenTourToCSVRow()` returns `Record<string, string>` -- format-agnostic, works for Excel rows too
- `getCSVHeaders()` returns `{ displayHeaders, columnKeys }` -- directly usable as Excel column definitions
- ExcelJS `Workbook` produces a `Buffer` via `workbook.xlsx.writeBuffer()` -- return this from service
- ExcelJS natively handles UTF-8 (Swedish/German chars) without config
- `TOUR_CSV_COLUMNS` array has section comments (Basic Info, Pricing, Duration, etc.) useful for column grouping

## Requirements

### Functional
- Export all tours to `.xlsx` format with proper column headers
- Bold header row, frozen at row 1
- Auto-width columns based on content length
- Section-colored headers (group by Basic Info, Pricing, Duration, etc.)
- Return `Buffer` from service (not string like CSV)

### Non-Functional
- File under 200 lines
- Reuse existing CSV column mapping -- no duplication
- Handle 100+ tours without memory issues (use standard Workbook, not streaming -- data fits in memory)

## Architecture

```
exportToursToExcel(options)
  1. Fetch tours via Payload (same as CSV export)
  2. Flatten each tour via flattenTourToCSVRow() (reuse from csv/)
  3. Get headers via getCSVHeaders() (reuse from csv/)
  4. Create ExcelJS Workbook + Worksheet
  5. Write header row with bold font + fill colors
  6. Write data rows
  7. Auto-fit column widths
  8. Freeze header row
  9. Return workbook.xlsx.writeBuffer()
```

## Related Code Files

### Files to Create
1. `packages/cms/lib/excel/tour-excel-export-service.ts` (~80 lines)
2. `packages/cms/lib/excel/index.ts` (~15 lines)
3. `apps/web/app/api/tours/export-excel/route.ts` (~75 lines)

### Files to Modify
- None (CSV code untouched)

### Files to Delete
- None

## Implementation Steps

### Step 1: Install ExcelJS

```bash
cd apps/web && npm install exceljs
```

Verify `exceljs` appears in `apps/web/package.json` dependencies.

### Step 2: Create `tour-excel-export-service.ts`

Path: `packages/cms/lib/excel/tour-excel-export-service.ts`

```typescript
import ExcelJS from 'exceljs'
import { getPayload } from 'payload'
import config from '../../payload.config'
import {
  getCSVHeaders,
  flattenTourToCSVRow,
  TOUR_CSV_COLUMNS,
  type TourWithLocales,
} from '../csv/tour-csv-column-mapping'

// Re-export ExportOptions from CSV (same interface)
export type { ExportOptions } from '../csv/tour-csv-export-service'
import type { ExportOptions } from '../csv/tour-csv-export-service'
```

Key function signature:
```typescript
export async function exportToursToExcel(options: ExportOptions = {}): Promise<Buffer>
```

Logic:
1. Fetch tours same as `exportToursToCSV()` -- copy the `payload.find()` call
2. `const rows = tours.map(t => flattenTourToCSVRow(t as unknown as TourWithLocales))`
3. `const { displayHeaders, columnKeys } = getCSVHeaders()`
4. Create workbook: `const workbook = new ExcelJS.Workbook()`
5. Add worksheet: `const sheet = workbook.addWorksheet('Tours')`
6. Set columns: map `columnKeys` + `displayHeaders` to ExcelJS column defs with `header`, `key`, `width`
7. Style header row:
   - `sheet.getRow(1).font = { bold: true }`
   - `sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E8E8' } }`
8. Add data rows: `rows.forEach(row => sheet.addRow(row))`
9. Auto-width: iterate columns, compute `Math.max(header.length, ...cellValues.length) * 1.2`, clamp 10-50
10. Freeze header: `sheet.views = [{ state: 'frozen', ySplit: 1 }]`
11. Return: `const buffer = await workbook.xlsx.writeBuffer(); return Buffer.from(buffer)`

Section coloring (optional enhancement): Use `TOUR_CSV_COLUMNS` section comments to apply light color fills to header cells by group. Map column index ranges to colors:
- Basic Info: light blue `FFD6EAF8`
- Pricing: light green `FFD5F5E3`
- Duration: light yellow `FFFEF9E7`
- Logistics: light orange `FFFDEBD0`
- Inclusions: light purple `FFE8DAEF`
- Audience: light pink `FFFDEDEC`
- Accessibility: light teal `FFD1F2EB`
- Relationships: light gray `FFF2F3F4`
- Status/Meta: white `FFFFFFFF`

### Step 3: Create `index.ts` barrel

Path: `packages/cms/lib/excel/index.ts`

```typescript
export {
  exportToursToExcel,
  generateExcelExportFilename,
  type ExportOptions,
} from './tour-excel-export-service'
```

(Will extend with import exports in Phase 02)

### Step 4: Create API Route

Path: `apps/web/app/api/tours/export-excel/route.ts`

Mirror `export-csv/route.ts` pattern exactly:
1. Same `verifyAdminAccess()` function
2. Call `exportToursToExcel()` instead of `exportToursToCSV()`
3. Return `new Response(buffer, { headers })` with:
   - `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
   - `Content-Disposition: attachment; filename="${filename}"`
   - `Cache-Control: no-store, must-revalidate`

### Step 5: Verify Build

```bash
npm run build
```

Ensure no TypeScript errors and the new route is accessible.

## Unit Tests

### File: `packages/cms/__tests__/tour-excel-export-service.test.ts`

Test the export service in isolation (mock Payload, verify ExcelJS output):

1. **Generates valid XLSX buffer** - Call `exportToursToExcel()` with mocked Payload, verify buffer is non-empty and parseable by ExcelJS
2. **Header row matches CSV headers** - Parse exported XLSX, verify column headers match `getCSVHeaders().displayHeaders`
3. **Flattened data matches CSV output** - Compare row values from XLSX export with `flattenTourToCSVRow()` output for same tour
4. **Header row is bold** - Parse XLSX, check `getRow(1).font.bold === true`
5. **Header row is frozen** - Check `worksheet.views[0].state === 'frozen'`
6. **Section colors applied** - Verify header cells have fill colors per section grouping
7. **UTF-8 characters preserved** - Export tour with Swedish/German chars, verify cell values contain å, ä, ö, ü, ß
8. **Empty tours returns empty worksheet** - Mock empty `payload.find()`, verify XLSX has header row only
9. **generateExcelExportFilename()** - Returns `tours-export-YYYY-MM-DD.xlsx` format

### Approach
- Mock `getPayload` to return fake tour data (reuse mock patterns from existing CSV tests)
- Use ExcelJS to parse the generated buffer and verify structure/content
- No need to test API route auth (already covered by CSV route tests pattern)

## Todo List

- [ ] Install `exceljs` in `apps/web`
- [ ] Create `packages/cms/lib/excel/tour-excel-export-service.ts`
- [ ] Create `packages/cms/lib/excel/index.ts`
- [ ] Create `apps/web/app/api/tours/export-excel/route.ts`
- [ ] Create `packages/cms/__tests__/tour-excel-export-service.test.ts`
- [ ] Verify build passes
- [ ] Verify all tests pass (`npm test`)

## Success Criteria

- `GET /api/tours/export-excel` returns downloadable `.xlsx` file
- File opens in Excel with bold headers, auto-width columns, frozen header row
- Same tour data as CSV export (verified by comparing row count and slug column)
- Swedish chars (a, a, o) and German chars (u, o, ss) display correctly
- Build passes with no TypeScript errors

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| ExcelJS buffer too large for Vercel response | Low | Medium | Tours dataset is small (<500 rows). Monitor response size. |
| ExcelJS API changes | Low | Low | Pin version in package.json |
| Column order mismatch with CSV | Low | Medium | Both use same `getCSVHeaders()` -- guaranteed same order |

## Security Considerations

- Admin auth required (same pattern as CSV export route)
- No user input in export -- server-side data only
- No file system writes -- buffer returned directly

## Next Steps

- Phase 02: Excel Import Service (depends on this phase for `index.ts` barrel)
- Phase 03: Admin UI buttons (depends on API routes from Phase 01 + 02)
