---
title: "Tours CSV Import/Export Feature"
description: "Bulk tour data management via CSV for admin users with localization support"
status: completed
priority: P2
effort: 6h
branch: master
tags: [csv, import, export, tours, admin, payload-cms]
created: 2026-02-05
---

# Tours CSV Import/Export Feature

## Overview

Enable bulk tour management via CSV import/export in Payload CMS admin panel. Supports 3 languages (SV/EN/DE) in same file with flattened columns.

## Research Reports

- [Payload Admin Customization](./research/researcher-payload-admin-customization.md) - List view components, server functions
- [CSV Libraries Comparison](./research/researcher-csv-libraries.md) - csv-parse + csv-stringify recommended

## Phases

| Phase | File | Status | Effort |
|-------|------|--------|--------|
| 01 | [CSV Export Service](./phase-01-csv-export-service.md) | completed | 2h |
| 02 | [CSV Import Service](./phase-02-csv-import-service.md) | completed | 3h |
| 03 | [Admin UI Components](./phase-03-admin-ui-components.md) | completed | 1h |

## Architecture

```
packages/cms/
├── lib/csv/
│   ├── tour-csv-export-service.ts     # Export logic
│   ├── tour-csv-import-service.ts     # Import + validation
│   ├── tour-csv-column-mapping.ts     # Field <-> column mapping
│   └── tour-csv-schema-validation.ts  # Zod schemas
└── components/admin/
    └── tour-csv-actions.tsx           # Admin UI buttons

apps/web/app/api/tours/
├── export-csv/route.ts                # GET - download CSV
└── import-csv/route.ts                # POST - upload CSV
```

## CSV Column Strategy

- **Localized fields**: `{field}_sv`, `{field}_en`, `{field}_de`
- **Grouped fields**: `pricing_basePrice`, `logistics_meetingPointName_sv`
- **Arrays**: Semicolon-separated (`highlight1;highlight2`)
- **Relationships**: Slugs (`guide_slug`, `categories: cat1;cat2`)
- **Rich text**: Accept markdown, convert to Lexical JSON
- **Coordinates**: `lat,lng` format
- **Media**: URL references (existing Media URLs or external)

## Key Requirements

1. **Export**: All tours to CSV with flattened structure
2. **Import**: Create-only mode (no overwrite) with row-level validation
3. **Admin UI**: Buttons in Tours list view (beforeListTable)
4. **Libraries**: csv-parse + csv-stringify
5. **Auth**: Admin-only access via Payload auth verification

## Dependencies

- csv-parse ^5.5.x
- csv-stringify ^6.4.x
- Zod (already installed)

## Success Criteria

- [x] Export all tours with correct encoding (UTF-8 BOM)
- [x] Import creates tours with all fields populated correctly
- [x] Validation errors reported with row numbers
- [x] Admin UI accessible only to authenticated admins
- [x] Swedish/German characters preserved (UTF-8)

## Validation Summary

**Validated:** 2026-02-05
**Questions asked:** 4

### Confirmed Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Rich Text Handling | Markdown ↔ Lexical | Export Lexical as markdown, import markdown → Lexical JSON |
| Images Handling | Skip on import | Import text fields only, add images manually in CMS |
| Dry-run Mode | Yes, add preview | Validate CSV and show results before creating tours |
| Translation Fallback | Swedish fallback | Copy Swedish content to empty EN/DE fields |

### Action Items

- [ ] **Phase 02**: Add `dryRun` parameter to import service (returns validation results without creating)
- [ ] **Phase 02**: Document that images[] field is skipped during import
- [ ] **Phase 03**: Add dry-run toggle/checkbox to import UI
