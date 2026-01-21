# CMS Package Scout Report - HeritageGuiding Platform

Date: 2026-01-19

## Overview

Payload CMS v3.70.0 headless setup with PostgreSQL, 9 collections, 3-locale localization (SV/EN/DE).

## Collections

### Content Collections

1. **Tours** (Core)
   - Fields: title, slug, description, shortDescription (160 char), highlights array
   - Pricing: basePrice, currency, priceType (per_person/per_group/custom), groupDiscount, childPrice
   - Duration: hours, durationText
   - Logistics: meeting point, parking, transport
   - Inclusions: included, notIncluded, whatToBring (arrays, localized)
   - Audience: tags, difficulty
   - Accessibility: wheelchair, mobility
   - Gallery: images array (max 20, isPrimary flag)
   - Booking: rezdyProductId, availability, max/minGroupSize
   - Status: draft/published/archived, featured
   - Relationships: guide (required, indexed), categories (hasMany), neighborhoods (hasMany)
   - Access: Read public, admin-only create/update/delete

2. **Guides** (Tour Experts)
   - Fields: name, slug, bio (richText), credentials (array), photo, email (internal), languages (multi-select)
   - One guide → many tours
   - Access: Read public, admin write

3. **Reviews** (Testimonials)
   - Fields: tour (required), rating (1-5), text (2000 chars), authorName, authorCountry, date, verified
   - Many reviews → one tour
   - Access: Read public, admin write

4. **Categories** (Tour Classification)
   - Fields: name, slug, type (theme/activity), description, icon (Lucide)
   - Many-to-many with Tours
   - Access: Read public, admin write

5. **Pages** (Static Content)
   - Types: About, FAQ, Terms, Privacy, Contact, Custom
   - Fields: title, slug, content (richText), metaTitle, metaDescription, showInFooter, showInHeader
   - Access: Read public, admin write

### Geography Collections

6. **Cities** (Expansion Base)
   - Fields: name, slug, country (default: Sweden), coordinates (PostGIS), description
   - Parent of Neighborhoods
   - Access: Read public, admin write

7. **Neighborhoods** (Area Details)
   - Fields: name, slug, city (required), description, coordinates, image
   - Relationship: Many neighborhoods → many tours
   - Access: Read public, admin write

### Support Collections

8. **Media** (Assets)
   - Upload types: image/*, video/*, PDF
   - Sizes: thumbnail (400x300), card (768x512), hero (1920x1080)
   - Fields: alt (required, localized), caption (localized)
   - Storage: Vercel Blob (BLOB_READ_WRITE_TOKEN configurable)
   - Access: Public read

9. **Users** (Authentication)
   - Auth: Enabled
   - Roles: admin (full), editor (limited)
   - Default role: editor
   - Access: Self-read, admin manage

## Reusable Field Groups

Located in packages/cms/fields/:
- tourPricingFields
- tourDurationFields
- logisticsFields
- tourInclusionFields
- accessibilityFields
- seoFields
- slugField
- audienceTagsField
- tourDifficultyFields

## Access Control

Helpers in packages/cms/access/:
- isAdmin: req.user?.role === 'admin'
- isAuthenticated: req.user exists

## Hooks

packages/cms/hooks/:
- formatSlugHook: Auto-formats slug on beforeValidate

## Integration with Web App

API Exports:
- '.': payload.config.ts
- './collections': All collections
- './collections/*': Individual collections

Type Generation:
- Auto-generated payload-types.ts

Database:
- PostgreSQL connection via DATABASE_URL env var

Expected Web App APIs:
- GET /api/tours (list, filter)
- GET /api/tours/:slug
- GET /api/guides/:slug
- GET /api/reviews?tour=id
- GET /api/categories
- GET /api/cities, /api/neighborhoods
- GET /api/pages/:slug
- GET /api/media/:id

## Security & Sensitive Data

Guide email: Stored, not public
User passwords: Payload auth managed
rezdyProductId: Internal booking integration

## Environment Configuration

Required:
- DATABASE_URL (PostgreSQL)
- PAYLOAD_SECRET (32+ chars in production)

Optional:
- BLOB_READ_WRITE_TOKEN (Vercel Blob)

## Testing

Vitest framework
Tests: access-control, format-slug, validate-google-maps-url
Coverage: v8 reporter

## Unresolved Questions

- API layer: GraphQL vs REST exposure to web app?
- Rezdy integration: Product sync and booking callback workflow?
- Webhooks: Tour/guide updates triggering web app rebuilds?
