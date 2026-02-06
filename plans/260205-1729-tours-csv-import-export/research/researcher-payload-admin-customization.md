# Payload CMS 3.0 Admin Customization Research
**Tours CSV Import/Export Implementation**

---

## Executive Summary

Payload CMS 3.0 supports robust admin customization via:
1. **Custom React Components** in list/edit views for UI buttons
2. **Server Functions** (Next.js server actions) for backend file processing
3. **Custom Endpoints** for file download/upload operations
4. **Local API** direct database access without REST API overhead

CSV functionality requires combining client-side admin components with server-side file handling. Payload's modular architecture allows clean separation.

---

## 1. Adding Custom Buttons to List View

### Pattern: beforeListTable Component

```typescript
// File: packages/cms/components/tours-csv-actions.tsx
'use client'

import { Button } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function TourCSVActions() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleExportCSV = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/tours/export-csv', {
        method: 'GET',
      })
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tours-${new Date().toISOString().slice(0,10)}.csv`
      a.click()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
      <Button onClick={handleExportCSV} disabled={loading}>
        {loading ? 'Exporting...' : 'Export as CSV'}
      </Button>
      <Button onClick={() => router.push('#')} variant="secondary">
        Import from CSV
      </Button>
    </div>
  )
}
```

**Integration in collection config:**
```typescript
// packages/cms/collections/tours.ts
export const Tours: CollectionConfig = {
  // ... existing config
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'featured', 'guide'],
    group: 'Content',
    components: {
      beforeListTable: [() => <TourCSVActions />]  // Add custom component
    }
  },
  // ...
}
```

**Key Points:**
- React Server Components by default (can use 'use client' for interactivity)
- Can access `useRouter`, `useState` with client directive
- Props available: `data`, `permissions`, collection metadata
- Positioned before/after table or list elements

---

## 2. Server Function Pattern for File Export

### Using Next.js Server Actions

```typescript
// File: apps/web/app/api/tours/route.ts
import { getPayload } from 'payload'
import config from '@/cms/payload.config'
import { parse } from 'json2csv'

export async function GET(request: Request) {
  try {
    const payload = await getPayload({ config })

    // Query all tours via Local API
    const { docs: tours } = await payload.find({
      collection: 'tours',
      limit: 10000,
      depth: 1,
    })

    // Transform to CSV format
    const csvData = tours.map((tour: any) => ({
      id: tour.id,
      title: tour.title,
      slug: tour.slug,
      status: tour.status,
      price: tour.pricing?.basePrice,
      duration: tour.duration?.hours,
      guide: typeof tour.guide === 'object' ? tour.guide.name : tour.guide,
      featured: tour.featured,
    }))

    const csv = parse(csvData)

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="tours-${Date.now()}.csv"`,
      },
    })
  } catch (error) {
    return Response.json({ error: 'Export failed' }, { status: 500 })
  }
}
```

**Benefits over REST API:**
- Direct database access via Payload's Local API
- No HTTP overhead for large exports
- Access to internal hooks and middleware
- Native TypeScript support

---

## 3. CSV Import Endpoint

```typescript
// File: apps/web/app/api/tours/import/route.ts
import { getPayload } from 'payload'
import config from '@/cms/payload.config'
import { parse } from 'csv-parse/sync'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) throw new Error('No file provided')

    const csv = await file.text()
    const records = parse(csv, { columns: true })

    const payload = await getPayload({ config })
    const results = []

    for (const record of records) {
      try {
        // Transform CSV row to tour document
        const tourData = {
          title: record.title,
          slug: record.slug || record.title.toLowerCase().replace(/\s+/g, '-'),
          shortDescription: record.description || '',
          description: record.description || '',
          pricing: {
            basePrice: parseFloat(record.price) || 0,
            currency: 'SEK',
          },
          duration: {
            hours: parseInt(record.duration) || 1,
            days: 1,
          },
          status: record.status || 'draft',
        }

        const created = await payload.create({
          collection: 'tours',
          data: tourData,
        })

        results.push({ success: true, id: created.id })
      } catch (rowError) {
        results.push({ success: false, error: String(rowError) })
      }
    }

    return Response.json({
      imported: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    })
  } catch (error) {
    return Response.json(
      { error: String(error) },
      { status: 400 }
    )
  }
}
```

---

## 4. Admin Upload Component

```typescript
// File: packages/cms/components/tours-csv-import.tsx
'use client'

import { useState } from 'react'
import { Button } from '@payloadcms/ui'

export function ToursCSVImport() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/tours/import', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()
      setResults(data)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <label>
        <Button disabled={loading} as="span">
          {loading ? 'Importing...' : 'Choose CSV File'}
        </Button>
        <input
          type="file"
          accept=".csv"
          onChange={handleImport}
          style={{ display: 'none' }}
        />
      </label>
      {results && (
        <div style={{ marginTop: '1rem' }}>
          <p>Imported: {results.imported}</p>
          <p>Failed: {results.failed}</p>
        </div>
      )}
    </div>
  )
}
```

---

## 5. Authentication & Permissions

### Securing CSV Endpoints

```typescript
// apps/web/lib/auth-check.ts
import { getPayload } from 'payload'
import { cookies } from 'next/headers'
import config from '@/cms/payload.config'

export async function verifyAdminAccess() {
  const payload = await getPayload({ config })
  const cookieStore = await cookies()
  const token = cookieStore.get('payload-token')?.value

  if (!token) throw new Error('Unauthorized')

  const user = await payload.auth.verifyAuthenticationToken({
    token,
  })

  if (!user) throw new Error('Unauthorized')
  return user
}
```

**Add to route handlers:**
```typescript
export async function GET(request: Request) {
  await verifyAdminAccess() // Throws if not authenticated
  // ... export logic
}
```

---

## 6. Key Limitations & Constraints

| Feature | Status | Notes |
|---------|--------|-------|
| Custom List Buttons | ✅ Full Support | Via `beforeListTable` component |
| Server Functions | ✅ Full Support | Next.js server actions, Local API |
| File Downloads | ✅ Full Support | Response headers, blob handling |
| CSV Parsing | ✅ Library dependent | Use `csv-parse` or `papaparse` |
| Batch Operations | ✅ Full Support | Loop with Local API |
| Real-time Progress | ⚠️ Limited | Use `/api/route.ts` with streaming |
| Modal Dialogs | ⚠️ Limited | Requires `@payloadcms/ui` Modal |
| Validation | ✅ Full Support | Payload schema validation |

---

## 7. Implementation Checklist

- [ ] Install CSV libraries: `npm install csv-parse json2csv papaparse`
- [ ] Create `packages/cms/components/tours-csv-*.tsx` components
- [ ] Add route handlers: `/api/tours/export` and `/api/tours/import`
- [ ] Update `Tours` collection config with `components.beforeListTable`
- [ ] Add auth check middleware to API routes
- [ ] Test CSV format matches Tour schema fields
- [ ] Handle nested relationships (guide, category, etc.)
- [ ] Add error boundaries and user feedback UI
- [ ] Document CSV column headers and data types

---

## 8. Dependencies

```json
{
  "csv-parse": "^5.5.0",
  "json2csv": "^6.0.0",
  "papaparse": "^5.4.1"
}
```

**Payload CMS 3.0 already includes:**
- `@payloadcms/ui` for admin components
- Local API (built-in)
- Next.js 15 server functions (built-in)

---

## Sources

- [Payload List View Components](https://payloadcms.com/docs/custom-components/list-view)
- [Payload Admin Components](https://payloadcms.com/docs/admin/components)
- [Payload Local API](https://payloadcms.com/docs/local-api/overview)
- [Payload Server Functions](https://payloadcms.com/docs/local-api/server-functions)
- [Payload Custom Endpoints](https://payloadcms.com/docs/rest-api/custom-endpoints)
- [Payload Upload Field](https://payloadcms.com/docs/fields/upload)

---

**Report Generated:** 2026-02-05
**CMS Version:** Payload 3.0 with PostgreSQL adapter
**Next.js Version:** 15+
