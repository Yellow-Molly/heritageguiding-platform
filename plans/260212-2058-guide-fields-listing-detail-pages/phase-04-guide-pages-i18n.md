# Phase 04: Guide Pages + i18n

## Context Links

- Tour listing page: `apps/web/app/[locale]/(frontend)/tours/page.tsx` (54 lines)
- Tour detail page: `apps/web/app/[locale]/(frontend)/tours/[slug]/page.tsx` (135 lines)
- Header nav: `apps/web/components/layout/header.tsx` (line 12-16 navigation array)
- English translations: `apps/web/messages/en.json`
- Swedish translations: `apps/web/messages/sv.json`
- German translations: `apps/web/messages/de.json`
- Guide components from Phase 03: `apps/web/components/guide/`
- API functions from Phase 02: `apps/web/lib/api/get-guides.ts`, `get-guide-by-slug.ts`

## Overview

- **Priority:** P1
- **Status:** Pending
- **Estimate:** 1.5h
- **Description:** Create guide listing and detail page routes, add i18n translations for all 3 locales, add "Guides" link to header navigation.

## Key Insights

- Tours listing page pattern: server component, fetches data, renders Header + main + Footer, passes data to client catalog component
- Tour detail page pattern: server component, slug validation, notFound(), generateMetadata, generateStaticParams, breadcrumbs
- Header uses hardcoded `navigation` array on line 12-16 -- just add Guides entry
- i18n uses `getTranslations({ locale, namespace })` in server components
- Messages files are flat JSON with nested namespaces (e.g., `tours.title`, `tours.filters.selectCategories`)

## Requirements

### Functional
- `/guides` listing page: shows all active guides in grid, with metadata
- `/guides/[slug]` detail page: shows guide profile + their tours, breadcrumbs, metadata, static params
- i18n translations: `guides` namespace in en.json, sv.json, de.json
- Header nav: add "Guides" link between "Tours" and "About"

### Non-Functional
- Server components for both pages (SSR/SSG)
- SEO: generateMetadata with title + description
- SSG: generateStaticParams for detail page
- Slug validation on detail page (same regex as tour detail)

## Architecture

```
apps/web/app/[locale]/(frontend)/guides/
  page.tsx                    <- NEW (listing)
  [slug]/page.tsx             <- NEW (detail)
apps/web/messages/en.json     <- UPDATE (add guides namespace)
apps/web/messages/sv.json     <- UPDATE (add guides namespace)
apps/web/messages/de.json     <- UPDATE (add guides namespace)
apps/web/components/layout/header.tsx  <- UPDATE (add nav link)
```

## Related Code Files

### Files to Create
- `apps/web/app/[locale]/(frontend)/guides/page.tsx`
- `apps/web/app/[locale]/(frontend)/guides/[slug]/page.tsx`

### Files to Modify
- `apps/web/messages/en.json` -- add `guides` namespace
- `apps/web/messages/sv.json` -- add `guides` namespace
- `apps/web/messages/de.json` -- add `guides` namespace
- `apps/web/components/layout/header.tsx` -- add nav link

## Implementation Steps

### Step 1: Add i18n translations

Add `guides` namespace to each message file. Structure:

**en.json** -- add after `tours` namespace:
```json
"guides": {
  "title": "Our Expert Guides",
  "description": "Meet the passionate experts who bring Stockholm's heritage to life. Each guide brings unique expertise and local knowledge.",
  "subtitle": "Meet the people behind the experiences",
  "specializations": "Specializations",
  "languages": "Languages",
  "operatingAreas": "Operating Areas",
  "credentials": "Credentials & Certifications",
  "about": "About {name}",
  "toursBy": "Tours by {name}",
  "noTours": "No tours currently available",
  "onLeave": "On Leave",
  "emptyState": "No guides found matching your criteria",
  "breadcrumb": {
    "home": "Home",
    "guides": "Guides"
  },
  "filters": {
    "language": "Language",
    "specialization": "Specialization",
    "area": "Area",
    "search": "Search guides..."
  }
}
```

**sv.json** -- Swedish translations:
```json
"guides": {
  "title": "Vara expertguider",
  "description": "Mot de passionerade experterna som ger liv at Stockholms kulturarv. Varje guide bidrar med unik expertis och lokal kunskap.",
  "subtitle": "Mot personerna bakom upplevelserna",
  "specializations": "Specialiseringar",
  "languages": "Sprak",
  "operatingAreas": "Verksamhetsomraden",
  "credentials": "Meriter och certifieringar",
  "about": "Om {name}",
  "toursBy": "Turer med {name}",
  "noTours": "Inga turer tillgangliga for narvarande",
  "onLeave": "Ledig",
  "emptyState": "Inga guider hittades som matchar dina kriterier",
  "breadcrumb": {
    "home": "Hem",
    "guides": "Guider"
  },
  "filters": {
    "language": "Sprak",
    "specialization": "Specialisering",
    "area": "Omrade",
    "search": "Sok guider..."
  }
}
```

**de.json** -- German translations:
```json
"guides": {
  "title": "Unsere Experten-Fuhrer",
  "description": "Lernen Sie die leidenschaftlichen Experten kennen, die Stockholms Kulturerbe zum Leben erwecken.",
  "subtitle": "Die Menschen hinter den Erlebnissen",
  "specializations": "Spezialisierungen",
  "languages": "Sprachen",
  "operatingAreas": "Einsatzgebiete",
  "credentials": "Qualifikationen und Zertifizierungen",
  "about": "Uber {name}",
  "toursBy": "Touren mit {name}",
  "noTours": "Derzeit keine Touren verfugbar",
  "onLeave": "Abwesend",
  "emptyState": "Keine Fuhrer gefunden, die Ihren Kriterien entsprechen",
  "breadcrumb": {
    "home": "Startseite",
    "guides": "Fuhrer"
  },
  "filters": {
    "language": "Sprache",
    "specialization": "Spezialisierung",
    "area": "Gebiet",
    "search": "Fuhrer suchen..."
  }
}
```

Note: Swedish/German special characters (a-umlaut, o-umlaut, etc.) should use proper Unicode in actual implementation. Shown simplified here for readability.

### Step 2: Create guides listing page

`apps/web/app/[locale]/(frontend)/guides/page.tsx`

Follow tours/page.tsx pattern exactly:

```typescript
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { GuideGrid } from '@/components/guide'
import { getGuides } from '@/lib/api/get-guides'

interface GuidesPageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<Record<string, string | undefined>>
}

export async function generateMetadata({ params }: GuidesPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'guides' })
  return {
    title: t('title'),
    description: t('description'),
  }
}

export default async function GuidesPage({ params, searchParams }: GuidesPageProps) {
  const { locale } = await params
  const filters = await searchParams
  const t = await getTranslations({ locale, namespace: 'guides' })
  const { guides, page, totalPages } = await getGuides(filters)

  return (
    <>
      <Header variant="solid" />
      <main className="min-h-screen bg-[var(--color-background)] pt-[var(--header-height)]">
        <section className="container mx-auto px-4 py-6 lg:py-8">
          <h1 className="font-serif text-3xl font-bold text-[var(--color-primary)] lg:text-4xl">
            {t('title')}
          </h1>
          <p className="mt-2 text-lg text-[var(--color-text-muted)]">
            {t('subtitle')}
          </p>
          <div className="mt-8">
            <GuideGrid guides={guides} page={page} totalPages={totalPages} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
```

### Step 3: Create guide detail page

`apps/web/app/[locale]/(frontend)/guides/[slug]/page.tsx`

Follow tours/[slug]/page.tsx pattern:

```typescript
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { getGuideBySlug, getAllGuideSlugs } from '@/lib/api/get-guide-by-slug'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { GuideDetailHeader, GuideDetailContent, GuideToursSection } from '@/components/guide'
import { Breadcrumb } from '@/components/shared/breadcrumb'

interface GuidePageProps {
  params: Promise<{ locale: string; slug: string }>
}

function isValidSlug(slug: string): boolean {
  return /^[a-z0-9-]+$/.test(slug) && slug.length <= 100
}

export default async function GuidePage({ params }: GuidePageProps) {
  const { locale, slug } = await params
  setRequestLocale(locale)

  if (!isValidSlug(slug)) notFound()

  const t = await getTranslations({ locale, namespace: 'guides' })
  const guide = await getGuideBySlug(slug, locale)

  if (!guide) notFound()

  const breadcrumbs = [
    { label: t('breadcrumb.home'), href: '/' },
    { label: t('breadcrumb.guides'), href: '/guides' },
    { label: guide.name },
  ]

  return (
    <>
      <Header variant="solid" />
      <main className="min-h-screen bg-[var(--color-background)] pt-[var(--header-height)]">
        <div className="container py-4">
          <Breadcrumb items={breadcrumbs} />
        </div>
        <GuideDetailHeader guide={guide} />
        <div className="container py-12">
          <div className="grid gap-12 lg:grid-cols-3">
            <div className="space-y-12 lg:col-span-2">
              <GuideDetailContent guide={guide} />
            </div>
          </div>
          {guide.tours.length > 0 && (
            <div className="mt-12">
              <GuideToursSection tours={guide.tours} />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}

export async function generateMetadata({ params }: GuidePageProps) { /* ... */ }
export async function generateStaticParams() { /* ... */ }
```

### Step 4: Update header navigation

In `apps/web/components/layout/header.tsx`, update line 12-16:

```typescript
const navigation = [
  { name: 'Tours', href: '/tours' as const },
  { name: 'Guides', href: '/guides' as const },
  { name: 'About', href: '/about' as const },
  { name: 'Contact', href: '/contact' as const },
]
```

Note: Navigation labels are hardcoded (not i18n). This is consistent with current implementation. If i18n nav labels needed later, that's a separate concern.

## Todo List

- [ ] Add `guides` namespace to en.json
- [ ] Add `guides` namespace to sv.json (with proper Swedish characters)
- [ ] Add `guides` namespace to de.json (with proper German characters)
- [ ] Create guides listing page (page.tsx)
- [ ] Create guide detail page ([slug]/page.tsx)
- [ ] Add generateMetadata to both pages
- [ ] Add generateStaticParams to detail page
- [ ] Add slug validation to detail page
- [ ] Add breadcrumbs to detail page
- [ ] Update header.tsx navigation array
- [ ] Verify pages render without errors
- [ ] Verify i18n works in all 3 locales

## Success Criteria

- `/en/guides` renders listing with guide cards
- `/en/guides/erik-lindqvist` renders detail page with bio + tours
- `/sv/guides` renders with Swedish translations
- `/de/guides` renders with German translations
- Header shows "Guides" link between "Tours" and "About"
- Non-existent slug returns 404
- Invalid slug format returns 404
- Metadata (title/description) is locale-aware
- generateStaticParams produces all locale+slug combos
- Breadcrumbs render correctly on detail page

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Breadcrumb component expects different prop shape | Low | Check Breadcrumb interface; it accepts `{ label, href? }[]` |
| TourPagination reuse fails | Low | GuideGrid can render without pagination initially |
| Swedish/German translations inaccurate | Low | Placeholder text acceptable; native speaker can refine |

## Security Considerations

- Slug validation with regex (same pattern as tour detail) prevents injection
- No admin-only data (email/phone) rendered on any page
- Server components prevent client-side data leakage

## Next Steps

- After all 4 phases complete: run `npm run lint`, `npm run type-check`, `npm run build`
- Consider adding tests for API functions (get-guides, get-guide-by-slug)
- Consider adding guide schema.org markup in Phase 13 (SEO phase)
- Consider client-side filter component for guide listing (future enhancement)
