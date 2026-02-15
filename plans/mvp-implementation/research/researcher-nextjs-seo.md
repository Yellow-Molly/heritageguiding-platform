# Next.js 16 SEO & Accessibility Research

**Research Date:** 2026-02-15
**Focus:** Dynamic sitemaps, robots.txt, WCAG 2.1 AA, metadata API for multi-locale sites (SV/EN/DE)

---

## 1. Dynamic Sitemap Generation (`app/sitemap.ts`)

### Multi-Locale Pattern
```typescript
import { MetadataRoute } from 'next'

const locales = ['sv', 'en', 'de']
const baseUrl = 'https://example.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = await getRoutes() // fetch from CMS/DB

  return routes.flatMap(route =>
    locales.map(locale => ({
      url: `${baseUrl}/${locale}${route.path}`,
      lastModified: route.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: route.priority || 0.7,
      alternates: {
        languages: Object.fromEntries(
          locales.map(l => [l, `${baseUrl}/${l}${route.path}`])
        )
      }
    }))
  )
}
```

### Large Sitemaps with `generateSitemaps`
```typescript
// Next.js 16: id is now a Promise
export async function generateSitemaps() {
  return [{ id: 'tours' }, { id: 'guides' }, { id: 'static' }]
}

export default async function sitemap({ id }: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const sitemapId = await id // MUST await in Next.js 16
  const items = await fetchItemsByType(sitemapId)
  return items.map(item => ({ url: item.url, lastModified: item.date }))
}
```

---

## 2. robots.ts Best Practices

### Basic Implementation
```typescript
import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/admin/', '/api/'] },
      { userAgent: 'GPTBot', disallow: '/' },          // Block AI scrapers
      { userAgent: 'CCBot', disallow: '/' },
      { userAgent: 'Google-Extended', disallow: '/' }
    ],
    sitemap: 'https://example.com/sitemap.xml'
  }
}
```

### Multi-Bot Configuration
```typescript
rules: [
  { userAgent: 'Googlebot', allow: '/', crawlDelay: 0 },
  { userAgent: 'Bingbot', allow: '/', crawlDelay: 1 },
  { userAgent: '*', allow: '/', disallow: ['/admin/'] }
]
```

**Note:** robots.ts is cached by default; use dynamic APIs if needed for multi-tenant scenarios.

---

## 3. WCAG 2.1 AA Quick Wins

### Skip Navigation Link
```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <a href="#main" className="skip-link">Skip to main content</a>
        <header>...</header>
        <main id="main" tabIndex={-1}>{children}</main>
      </body>
    </html>
  )
}
```

```css
/* globals.css - Show skip link on focus */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px;
  z-index: 100;
}
.skip-link:focus {
  top: 0;
}
```

### Focus Management (Modals/Drawers)
```tsx
'use client'
import { useEffect, useRef } from 'react'

function Modal({ isOpen, onClose }) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement
      closeButtonRef.current?.focus()
    } else {
      previousFocusRef.current?.focus()
    }
  }, [isOpen])

  return isOpen ? (
    <div role="dialog" aria-modal="true">
      <button ref={closeButtonRef} onClick={onClose}>Close</button>
    </div>
  ) : null
}
```

### Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Form Focus Indicators
```css
input:focus, button:focus, select:focus {
  outline: 2px solid #0070f3;
  outline-offset: 2px;
}
```

---

## 4. Metadata API for Localized Pages

### Static Rendering with next-intl
```typescript
import { getTranslations } from 'next-intl/server'
import { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params // Await params in Next.js 16
  const t = await getTranslations({ locale, namespace: 'Metadata' })

  return {
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: `/${locale}`,
      languages: {
        'sv': '/sv',
        'en': '/en',
        'de': '/de'
      }
    },
    openGraph: {
      title: t('ogTitle'),
      description: t('ogDescription'),
      locale: locale,
      alternateLocale: ['sv', 'en', 'de'].filter(l => l !== locale)
    }
  }
}
```

### Enable Static Rendering (next-intl)
```typescript
import { setRequestLocale } from 'next-intl/server'

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale) // Enable static rendering

  const t = await getTranslations('Page')
  return <h1>{t('title')}</h1>
}
```

---

## Sources

- [Next.js Sitemap.xml Metadata Files](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
- [Next.js generateSitemaps Function](https://nextjs.org/docs/app/api-reference/functions/generate-sitemaps)
- [Next.js robots.txt Metadata Files](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots)
- [Next.js generateMetadata Function](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [next-intl Server Actions & Metadata](https://next-intl.dev/docs/environments/actions-metadata-route-handlers)
- [next-intl Locale Routing Setup](https://next-intl.dev/docs/routing/setup)
- [Next.js Accessibility Architecture](https://nextjs.org/docs/architecture/accessibility)
- [React Accessibility Best Practices - AllAccessible](https://www.allaccessible.org/blog/react-accessibility-best-practices-guide)
- [Next.js and Accessibility - Bejamas](https://bejamas.com/hub/guides/next-js-and-accessibility)
- [Multiple Sitemaps in Next.js - RaddyDev](https://raddy.dev/blog/multiple-sitemaps-in-nextjs-app-router-sitemap-index/)
