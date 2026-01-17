# Phase 03: Data Models & CMS Schema

## Context Links

- [MVP Project Plan v1.2](../../docs/MVP-PROJECT-PLAN-v1.2-ENHANCED-SCHEMA.md)
- [Next.js + Payload Research](../reports/researcher-260112-nextjs-payload-integration.md)
- [Payload Collections Docs](https://payloadcms.com/docs/configuration/collections)

## Overview

| Priority | Status | Effort |
|----------|--------|--------|
| P1 - Critical | pending | 28-32h |

Define Payload CMS collections for tours (with enhanced schema), guides, categories, reviews, neighborhoods, static pages, and media with full localization support, relationships, and access control.

## Key Insights

- Payload auto-generates TypeScript types from collections
- Schema auto-generates PostgreSQL tables
- Relationships via `relationship` field type
- Localization per-field using `localized: true`
- RBAC via `access` configuration per collection
- **Point field type for GPS coordinates**
- **Multi-select for audience tags (Concierge Wizard)**

## Requirements

### Functional
- Tours: title, description, pricing, duration, **logistics (meeting point + Google Maps link)**, **inclusions/exclusions**, **audience tags**, accessibility, gallery
- Guides: name, credentials, bio, photo, linked tours
- Categories: themes (history, architecture)
- ~~**Neighborhoods**: deferred to post-MVP~~
- Reviews: rating, text, date, tour reference
- Media: images with alt text, captions, responsive sizes
- **Pages**: static pages (FAQ, About Us, Terms, Privacy) with localization
- **FAQs**: CMS-managed FAQ collection with categories (validated decision)

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
            ├──── has many ───── Neighborhoods
            │
            ├──── has many ───── Reviews
            │
            └──── has many ───── Media (gallery)

Guide ────────── has one ────── Media (photo)

Categories ───── has many ───── Tours (inverse)

Neighborhoods ── belongs to ─── City
              └─ has many ───── Tours (inverse)

Pages ──────── static content (FAQ, About, Terms, Privacy)
```

### Collections Structure

```
packages/cms/
├── collections/
│   ├── tours.ts              # Enhanced with logistics, inclusions, audience
│   ├── guides.ts
│   ├── categories.ts
│   ├── neighborhoods.ts      # NEW: for GEO expansion
│   ├── cities.ts             # NEW: for GEO expansion
│   ├── reviews.ts
│   ├── media.ts
│   ├── users.ts
│   └── pages.ts              # NEW: static pages
├── fields/
│   ├── slug.ts
│   ├── seo-fields.ts
│   ├── accessibility-fields.ts
│   ├── logistics-fields.ts   # NEW: meeting point, coordinates
│   └── audience-tags.ts      # NEW: concierge wizard tags
├── access/
│   ├── is-admin.ts
│   └── is-authenticated.ts
├── hooks/
│   └── format-slug.ts
└── payload.config.ts
```

## Related Code Files

### Create
- `packages/cms/collections/tours.ts` - Tour collection (enhanced schema)
- `packages/cms/collections/guides.ts` - Guide/Expert collection
- `packages/cms/collections/categories.ts` - Categories collection
- `packages/cms/collections/neighborhoods.ts` - Neighborhoods (GEO)
- `packages/cms/collections/cities.ts` - Cities (GEO)
- `packages/cms/collections/reviews.ts` - Reviews collection
- `packages/cms/collections/media.ts` - Media collection
- `packages/cms/collections/pages.ts` - Static pages (FAQ, About, Terms, Privacy)
- `packages/cms/fields/slug.ts` - Reusable slug field
- `packages/cms/fields/seo-fields.ts` - SEO meta fields
- `packages/cms/fields/accessibility-fields.ts` - WCAG fields
- `packages/cms/fields/logistics-fields.ts` - Meeting point + coordinates
- `packages/cms/fields/audience-tags.ts` - Concierge wizard tags
- `packages/cms/access/is-admin.ts` - Admin check
- `packages/cms/hooks/format-slug.ts` - Slug generation

### Modify
- `packages/cms/payload.config.ts` - Register all collections

## Implementation Steps

1. **Create Tours Collection (Enhanced Schema)**
   ```typescript
   // packages/cms/collections/tours.ts
   import { CollectionConfig } from 'payload'
   import { accessibilityFields } from '../fields/accessibility-fields'
   import { seoFields } from '../fields/seo-fields'
   import { logisticsFields } from '../fields/logistics-fields'
   import { audienceTags } from '../fields/audience-tags'
   import { isAdmin } from '../access/is-admin'

   export const Tours: CollectionConfig = {
     slug: 'tours',
     admin: {
       useAsTitle: 'title',
       defaultColumns: ['title', 'price', 'duration', 'status']
     },
     access: {
       read: () => true,
       create: isAdmin,
       update: isAdmin,
       delete: isAdmin
     },
     fields: [
       // BASIC INFORMATION
       { name: 'title', type: 'text', required: true, localized: true },
       { name: 'slug', type: 'text', unique: true, required: true },
       { name: 'description', type: 'richText', required: true, localized: true },
       { name: 'shortDescription', type: 'textarea', required: true, localized: true, maxLength: 160 },
       {
         name: 'highlights',
         type: 'array',
         localized: true,
         fields: [{ name: 'highlight', type: 'text' }]
       },

       // PRICING & DURATION
       {
         name: 'pricing',
         type: 'group',
         fields: [
           { name: 'basePrice', type: 'number', required: true },
           { name: 'currency', type: 'select', defaultValue: 'SEK', options: ['SEK', 'EUR', 'USD'] },
           { name: 'priceType', type: 'select', required: true, options: ['per_person', 'per_group', 'custom'] },
           { name: 'groupDiscount', type: 'checkbox', defaultValue: false },
           { name: 'childPrice', type: 'number' }
         ]
       },
       {
         name: 'duration',
         type: 'group',
         fields: [
           { name: 'hours', type: 'number', required: true },
           { name: 'durationText', type: 'text', localized: true }
         ]
       },

       // LOGISTICS / MEETING POINT (NEW)
       { name: 'logistics', type: 'group', label: 'Logistics & Meeting Point', fields: logisticsFields },

       // INCLUSIONS & EXCLUSIONS (NEW)
       {
         name: 'included',
         type: 'array',
         label: "What's Included",
         localized: true,
         fields: [{ name: 'item', type: 'text', required: true }]
       },
       {
         name: 'notIncluded',
         type: 'array',
         label: "What's NOT Included",
         localized: true,
         fields: [{ name: 'item', type: 'text', required: true }]
       },
       {
         name: 'whatToBring',
         type: 'array',
         label: 'What to Bring',
         localized: true,
         fields: [{ name: 'item', type: 'text' }]
       },

       // CONCIERGE TAGS / SUITABILITY (NEW)
       audienceTags,
       {
         name: 'difficultyLevel',
         type: 'select',
         options: [
           { label: 'Easy (Mostly flat, minimal walking)', value: 'easy' },
           { label: 'Moderate (Some hills, 2-4km walking)', value: 'moderate' },
           { label: 'Challenging (Stairs, 5km+ walking)', value: 'challenging' }
         ]
       },
       {
         name: 'ageRecommendation',
         type: 'group',
         fields: [
           { name: 'minimumAge', type: 'number' },
           { name: 'childFriendly', type: 'checkbox', defaultValue: false },
           { name: 'teenFriendly', type: 'checkbox', defaultValue: false }
         ]
       },

       // ACCESSIBILITY
       { name: 'accessibility', type: 'group', fields: accessibilityFields },

       // RELATIONSHIPS
       { name: 'guide', type: 'relationship', relationTo: 'guides', required: true },
       { name: 'categories', type: 'relationship', relationTo: 'categories', hasMany: true },
       { name: 'neighborhoods', type: 'relationship', relationTo: 'neighborhoods', hasMany: true },
       {
         name: 'images',
         type: 'array',
         fields: [
           { name: 'image', type: 'upload', relationTo: 'media', required: true },
           { name: 'caption', type: 'text', localized: true },
           { name: 'isPrimary', type: 'checkbox', defaultValue: false }
         ]
       },

       // BOOKING & AVAILABILITY
       { name: 'rezdyProductId', type: 'text' },
       {
         name: 'availability',
         type: 'select',
         defaultValue: 'available',
         options: ['available', 'seasonal', 'by_request', 'unavailable']
       },
       { name: 'maxGroupSize', type: 'number' },
       { name: 'minGroupSize', type: 'number', defaultValue: 1 },

       // SEO & METADATA
       { name: 'seo', type: 'group', fields: seoFields },
       { name: 'featured', type: 'checkbox', defaultValue: false },
       {
         name: 'status',
         type: 'select',
         defaultValue: 'draft',
         options: ['draft', 'published', 'archived']
       }
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
     { name: 'wheelchairAccessible', type: 'checkbox', defaultValue: false },
     { name: 'mobilityNotes', type: 'textarea', localized: true },
     { name: 'hearingAssistance', type: 'checkbox', defaultValue: false },
     { name: 'visualAssistance', type: 'checkbox', defaultValue: false },
     { name: 'serviceAnimalsAllowed', type: 'checkbox', defaultValue: true }
   ]

   // packages/cms/fields/seo-fields.ts
   export const seoFields = [
     { name: 'metaTitle', type: 'text', localized: true },
     { name: 'metaDescription', type: 'textarea', localized: true, maxLength: 160 },
     { name: 'ogImage', type: 'upload', relationTo: 'media' }
   ]

   // packages/cms/fields/logistics-fields.ts (NEW)
   export const logisticsFields = [
     { name: 'meetingPointName', type: 'text', required: true, localized: true },
     { name: 'meetingPointAddress', type: 'text', localized: true },
     { name: 'coordinates', type: 'point', required: true }, // Payload's built-in geolocation
     { name: 'googleMapsLink', type: 'text' },
     { name: 'meetingPointInstructions', type: 'textarea', localized: true },
     { name: 'endingPoint', type: 'text', localized: true },
     { name: 'parkingInfo', type: 'textarea', localized: true },
     { name: 'publicTransportInfo', type: 'textarea', localized: true }
   ]

   // packages/cms/fields/audience-tags.ts (NEW)
   export const audienceTags = {
     name: 'targetAudience',
     type: 'select',
     hasMany: true, // Multi-select
     label: 'Target Audience (Concierge Wizard)',
     options: [
       { label: 'Family Friendly', value: 'family_friendly' },
       { label: 'Couples', value: 'couples' },
       { label: 'Corporate', value: 'corporate' },
       { label: 'Seniors', value: 'seniors' },
       { label: 'History Nerds', value: 'history_nerds' },
       { label: 'Photography', value: 'photography' },
       { label: 'Art Lovers', value: 'art_lovers' },
       { label: 'Food & Wine', value: 'food_wine' },
       { label: 'Adventure Seekers', value: 'adventure' },
       { label: 'Architecture Enthusiasts', value: 'architecture' }
     ]
   }
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

9. **Create Neighborhoods Collection (GEO)**
   ```typescript
   // packages/cms/collections/neighborhoods.ts
   export const Neighborhoods: CollectionConfig = {
     slug: 'neighborhoods',
     admin: { useAsTitle: 'name' },
     fields: [
       { name: 'name', type: 'text', required: true, localized: true },
       { name: 'slug', type: 'text', required: true, unique: true },
       { name: 'city', type: 'relationship', relationTo: 'cities', required: true },
       { name: 'description', type: 'richText', localized: true },
       { name: 'coordinates', type: 'point' }, // Center point
       { name: 'image', type: 'upload', relationTo: 'media' }
     ]
   }
   ```

10. **Create Cities Collection (GEO)**
    ```typescript
    // packages/cms/collections/cities.ts
    export const Cities: CollectionConfig = {
      slug: 'cities',
      admin: { useAsTitle: 'name' },
      fields: [
        { name: 'name', type: 'text', required: true, localized: true },
        { name: 'slug', type: 'text', required: true, unique: true },
        { name: 'country', type: 'text', required: true },
        { name: 'coordinates', type: 'point' },
        { name: 'description', type: 'richText', localized: true }
      ]
    }
    ```

11. **Create Pages Collection (Static Pages)**
    ```typescript
    // packages/cms/collections/pages.ts
    export const Pages: CollectionConfig = {
      slug: 'pages',
      admin: { useAsTitle: 'title' },
      fields: [
        { name: 'title', type: 'text', required: true, localized: true },
        { name: 'slug', type: 'text', required: true },
        { name: 'content', type: 'richText', required: true, localized: true },
        { name: 'metaTitle', type: 'text', localized: true },
        { name: 'metaDescription', type: 'textarea', localized: true },
        { name: 'showInFooter', type: 'checkbox', defaultValue: true },
        { name: 'showInHeader', type: 'checkbox', defaultValue: false },
        {
          name: 'pageType',
          type: 'select',
          options: [
            { label: 'About Us', value: 'about' },
            { label: 'FAQ', value: 'faq' },
            { label: 'Terms', value: 'terms' },
            { label: 'Privacy', value: 'privacy' },
            { label: 'Contact', value: 'contact' }
          ]
        }
      ]
    }
    ```

12. **Register Collections in Config**
    ```typescript
    // packages/cms/payload.config.ts
    import { Tours } from './collections/tours'
    import { Guides } from './collections/guides'
    import { Categories } from './collections/categories'
    import { Neighborhoods } from './collections/neighborhoods'
    import { Cities } from './collections/cities'
    import { Reviews } from './collections/reviews'
    import { Media } from './collections/media'
    import { Pages } from './collections/pages'
    import { Users } from './collections/users'

    export default buildConfig({
      collections: [Tours, Guides, Categories, Neighborhoods, Cities, Reviews, Media, Pages, Users]
    })
    ```

13. **Run Migrations**
    ```bash
    npm run db:migrate
    npm run payload:generate-types
    ```

## Todo List

- [ ] Create Tours collection with enhanced schema (logistics, inclusions, audience)
- [ ] Create Guides collection with credentials
- [ ] Create Categories collection (themes)
- [ ] Create Neighborhoods collection (GEO)
- [ ] Create Cities collection (GEO)
- [ ] Create Reviews collection with ratings
- [ ] Create Media collection with image sizes
- [ ] Create Pages collection (FAQ, About, Terms, Privacy)
- [ ] Create logistics-fields.ts (meeting point, coordinates)
- [ ] Create audience-tags.ts (concierge wizard tags)
- [ ] Create reusable accessibility fields
- [ ] Create reusable SEO fields
- [ ] Create slug field with auto-generation hook
- [ ] Set up access control (isAdmin, isAuthenticated)
- [ ] Register all collections in payload.config.ts
- [ ] Run database migrations
- [ ] Generate TypeScript types
- [ ] Seed sample data for testing
- [ ] Test CRUD operations via admin
- [ ] Verify point field works for coordinates

## Success Criteria

- [ ] All collections visible in Payload admin
- [ ] CRUD operations work for all collections
- [ ] Localized fields show per-locale tabs
- [ ] Relationships link correctly between collections
- [ ] TypeScript types generated in `payload-types.ts`
- [ ] Migrations run without errors
- [ ] Sample data seeded successfully
- [ ] Meeting point coordinates stored correctly
- [ ] Audience tags multi-select works
- [ ] Static pages (FAQ, About) editable in all 3 languages

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
