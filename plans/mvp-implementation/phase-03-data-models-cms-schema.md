# Phase 03: Data Models & CMS Schema

## Context Links

- [MVP Project Plan](../../docs/MVP-PROJECT-PLAN.md)
- [Next.js + Payload Research](../reports/researcher-260112-nextjs-payload-integration.md)
- [Payload Collections Docs](https://payloadcms.com/docs/configuration/collections)

## Overview

| Priority | Status | Effort |
|----------|--------|--------|
| P1 - Critical | pending | 20-24h |

Define Payload CMS collections for tours, guides, categories, reviews, and media with full localization support, relationships, and access control.

## Key Insights

- Payload auto-generates TypeScript types from collections
- Schema auto-generates PostgreSQL tables
- Relationships via `relationship` field type
- Localization per-field using `localized: true`
- RBAC via `access` configuration per collection

## Requirements

### Functional
- Tours: title, description, pricing, duration, accessibility, gallery
- Guides: name, credentials, bio, photo, linked tours
- Categories: themes (history, architecture) + neighborhoods
- Reviews: rating, text, date, tour reference
- Media: images with alt text, captions, responsive sizes

### Non-Functional
- All text fields localized (SV/EN/DE)
- Auto-generated TypeScript types
- Soft delete for critical content
- Audit logging for content changes

## Architecture

### Entity Relationship Diagram

```
Tours ──────┬──── has one ────── Guide
            │
            ├──── has many ───── Categories
            │
            ├──── has many ───── Reviews
            │
            └──── has many ───── Media (gallery)

Guide ────────── has one ────── Media (photo)

Categories ───── has many ───── Tours (inverse)
```

### Collections Structure

```
packages/cms/
├── collections/
│   ├── tours.ts
│   ├── guides.ts
│   ├── categories.ts
│   ├── reviews.ts
│   ├── media.ts
│   ├── users.ts
│   └── pages.ts
├── fields/
│   ├── slug.ts
│   ├── seo-fields.ts
│   └── accessibility-fields.ts
├── access/
│   ├── is-admin.ts
│   └── is-authenticated.ts
├── hooks/
│   └── format-slug.ts
└── payload.config.ts
```

## Related Code Files

### Create
- `packages/cms/collections/tours.ts` - Tour collection
- `packages/cms/collections/guides.ts` - Guide/Expert collection
- `packages/cms/collections/categories.ts` - Categories collection
- `packages/cms/collections/reviews.ts` - Reviews collection
- `packages/cms/collections/media.ts` - Media collection
- `packages/cms/collections/pages.ts` - Static pages
- `packages/cms/fields/slug.ts` - Reusable slug field
- `packages/cms/fields/seo-fields.ts` - SEO meta fields
- `packages/cms/fields/accessibility-fields.ts` - WCAG fields
- `packages/cms/access/is-admin.ts` - Admin check
- `packages/cms/hooks/format-slug.ts` - Slug generation

### Modify
- `packages/cms/payload.config.ts` - Register collections

## Implementation Steps

1. **Create Tours Collection**
   ```typescript
   // packages/cms/collections/tours.ts
   import { CollectionConfig } from 'payload'

   export const Tours: CollectionConfig = {
     slug: 'tours',
     admin: { useAsTitle: 'title' },
     access: {
       read: () => true,
       create: isAdmin,
       update: isAdmin,
       delete: isAdmin
     },
     fields: [
       { name: 'title', type: 'text', required: true, localized: true },
       { name: 'slug', type: 'text', unique: true },
       { name: 'description', type: 'richText', localized: true },
       { name: 'emotionalDescription', type: 'richText', localized: true },
       { name: 'duration', type: 'number', required: true }, // minutes
       { name: 'price', type: 'number', required: true },
       { name: 'currency', type: 'select', options: ['SEK', 'EUR'] },
       { name: 'maxCapacity', type: 'number' },
       {
         name: 'guide',
         type: 'relationship',
         relationTo: 'guides',
         required: true
       },
       {
         name: 'categories',
         type: 'relationship',
         relationTo: 'categories',
         hasMany: true
       },
       {
         name: 'gallery',
         type: 'array',
         fields: [
           { name: 'image', type: 'upload', relationTo: 'media' },
           { name: 'caption', type: 'text', localized: true }
         ]
       },
       { name: 'accessibility', type: 'group', fields: accessibilityFields },
       { name: 'seo', type: 'group', fields: seoFields },
       { name: 'rezdyProductCode', type: 'text' },
       { name: 'status', type: 'select', options: ['draft', 'published', 'archived'] }
     ]
   }
   ```

2. **Create Guides Collection**
   ```typescript
   // packages/cms/collections/guides.ts
   export const Guides: CollectionConfig = {
     slug: 'guides',
     admin: { useAsTitle: 'name' },
     fields: [
       { name: 'name', type: 'text', required: true },
       { name: 'bio', type: 'richText', localized: true },
       { name: 'credentials', type: 'array', fields: [
         { name: 'credential', type: 'text', localized: true }
       ]},
       { name: 'photo', type: 'upload', relationTo: 'media' },
       { name: 'email', type: 'email' },
       { name: 'languages', type: 'select', hasMany: true, options: ['sv', 'en', 'de', 'fr'] }
     ]
   }
   ```

3. **Create Categories Collection**
   ```typescript
   // packages/cms/collections/categories.ts
   export const Categories: CollectionConfig = {
     slug: 'categories',
     admin: { useAsTitle: 'name' },
     fields: [
       { name: 'name', type: 'text', required: true, localized: true },
       { name: 'slug', type: 'text', unique: true },
       { name: 'type', type: 'select', options: ['theme', 'neighborhood'] },
       { name: 'description', type: 'textarea', localized: true },
       { name: 'icon', type: 'text' } // Lucide icon name
     ]
   }
   ```

4. **Create Reviews Collection**
   ```typescript
   // packages/cms/collections/reviews.ts
   export const Reviews: CollectionConfig = {
     slug: 'reviews',
     fields: [
       { name: 'tour', type: 'relationship', relationTo: 'tours', required: true },
       { name: 'rating', type: 'number', min: 1, max: 5, required: true },
       { name: 'text', type: 'textarea', localized: true },
       { name: 'authorName', type: 'text', required: true },
       { name: 'authorCountry', type: 'text' },
       { name: 'date', type: 'date', required: true },
       { name: 'verified', type: 'checkbox', defaultValue: false }
     ]
   }
   ```

5. **Create Media Collection**
   ```typescript
   // packages/cms/collections/media.ts
   export const Media: CollectionConfig = {
     slug: 'media',
     upload: {
       staticURL: '/media',
       staticDir: 'media',
       mimeTypes: ['image/*'],
       imageSizes: [
         { name: 'thumbnail', width: 300, height: 200 },
         { name: 'card', width: 600, height: 400 },
         { name: 'hero', width: 1920, height: 1080 }
       ]
     },
     fields: [
       { name: 'alt', type: 'text', required: true, localized: true },
       { name: 'caption', type: 'text', localized: true }
     ]
   }
   ```

6. **Create Reusable Fields**
   ```typescript
   // packages/cms/fields/accessibility-fields.ts
   export const accessibilityFields = [
     { name: 'wheelchairAccessible', type: 'checkbox' },
     { name: 'hearingAssistance', type: 'checkbox' },
     { name: 'visualAssistance', type: 'checkbox' },
     { name: 'mobilityNotes', type: 'textarea', localized: true }
   ]

   // packages/cms/fields/seo-fields.ts
   export const seoFields = [
     { name: 'metaTitle', type: 'text', localized: true },
     { name: 'metaDescription', type: 'textarea', localized: true },
     { name: 'ogImage', type: 'upload', relationTo: 'media' }
   ]
   ```

7. **Create Access Control**
   ```typescript
   // packages/cms/access/is-admin.ts
   export const isAdmin = ({ req: { user } }) => {
     return user?.role === 'admin'
   }
   ```

8. **Create Slug Hook**
   ```typescript
   // packages/cms/hooks/format-slug.ts
   export const formatSlug = (val: string) =>
     val.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')
   ```

9. **Register Collections in Config**
   ```typescript
   // packages/cms/payload.config.ts
   import { Tours } from './collections/tours'
   import { Guides } from './collections/guides'
   import { Categories } from './collections/categories'
   import { Reviews } from './collections/reviews'
   import { Media } from './collections/media'

   export default buildConfig({
     collections: [Tours, Guides, Categories, Reviews, Media, Users, Pages]
   })
   ```

10. **Run Migrations**
    ```bash
    npm run db:migrate
    npm run payload:generate-types
    ```

## Todo List

- [ ] Create Tours collection with all fields
- [ ] Create Guides collection with credentials
- [ ] Create Categories collection (themes + neighborhoods)
- [ ] Create Reviews collection with ratings
- [ ] Create Media collection with image sizes
- [ ] Create reusable accessibility fields
- [ ] Create reusable SEO fields
- [ ] Create slug field with auto-generation hook
- [ ] Set up access control (isAdmin, isAuthenticated)
- [ ] Register all collections in payload.config.ts
- [ ] Run database migrations
- [ ] Generate TypeScript types
- [ ] Seed sample data for testing
- [ ] Test CRUD operations via admin

## Success Criteria

- [ ] All collections visible in Payload admin
- [ ] CRUD operations work for all collections
- [ ] Localized fields show per-locale tabs
- [ ] Relationships link correctly between collections
- [ ] TypeScript types generated in `payload-types.ts`
- [ ] Migrations run without errors
- [ ] Sample data seeded successfully

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Schema migration errors | Medium | High | Test locally before staging |
| Missing required fields | Low | Medium | Review against MVP requirements |
| Complex relationships | Low | Medium | Keep relationships simple for MVP |

## Security Considerations

- Only admins can create/update/delete content
- Public read access for published tours only
- Email fields never exposed to frontend
- Validate file uploads (mime types, size limits)

## Next Steps

After completion:
1. Proceed to [Phase 04: Design System](./phase-04-design-system.md)
2. Build component library with shadcn/ui
3. Implement Tailwind theme configuration
