# Phase 02: i18n & Localization

## Context Links

- [MVP Project Plan](../../docs/MVP-PROJECT-PLAN.md)
- [Next.js + Payload Research](../reports/researcher-260112-nextjs-payload-integration.md)
- [next-intl Documentation](https://next-intl.dev/docs/getting-started/app-router)

## Overview

| Priority | Status | Effort |
|----------|--------|--------|
| P1 - Critical | pending | 24-28h |

Configure next-intl for Swedish, English, and German localization with locale-based routing, translation workflows, and Payload CMS per-field translations.

## Key Insights

- next-intl provides App Router integration with middleware
- Locale in URL: `/sv`, `/en`, `/de` as route prefixes
- Payload CMS supports per-field localization natively
- Date/time/currency formatting via `date-fns` or Intl API

## Requirements

### Functional
- All routes prefixed with locale: `/sv/tours`, `/en/tours`, `/de/touren`
- Language switcher persists preference across sessions
- CMS content editable in all 3 languages
- SEO metadata includes `hreflang` tags
- Date/time/currency formatted per locale

### Non-Functional
- Default locale: Swedish (`sv`)
- Fallback chain: requested locale -> default locale
- URL patterns localized (e.g., `/sv/turer`, `/en/tours`, `/de/touren`)
- Browser language detection on first visit

## Architecture

```
app/
├── [locale]/                    # All public routes under locale
│   ├── layout.tsx              # NextIntlClientProvider
│   ├── page.tsx                # Home
│   ├── (tours)/
│   │   ├── tours/page.tsx      # /en/tours, /de/touren
│   │   └── [slug]/page.tsx     # Tour detail
│   └── (booking)/
│       └── booking/page.tsx    # /en/booking, /de/buchung
├── (payload)/                   # Payload admin (no locale)
│   └── admin/[[...segments]]/
└── middleware.ts               # Locale detection + routing

messages/
├── sv.json                     # Swedish translations
├── en.json                     # English translations
└── de.json                     # German translations
```

## Related Code Files

### Create
- `i18n.ts` - Routing configuration
- `i18n/request.ts` - Request-scoped locale
- `middleware.ts` - Locale middleware
- `app/[locale]/layout.tsx` - Locale provider layout
- `app/[locale]/page.tsx` - Localized home page
- `messages/sv.json` - Swedish translations
- `messages/en.json` - English translations
- `messages/de.json` - German translations
- `components/language-switcher.tsx` - Language selector
- `lib/i18n/date-format.ts` - Date formatting utilities
- `lib/i18n/currency-format.ts` - Currency formatting

### Modify
- `packages/cms/payload.config.ts` - Add localization config
- `next.config.ts` - next-intl plugin

## Implementation Steps

1. **Install next-intl**
   ```bash
   npm install next-intl
   ```

2. **Configure Routing**
   ```typescript
   // i18n.ts
   import { defineRouting } from 'next-intl/routing'

   export const routing = defineRouting({
     locales: ['sv', 'en', 'de'],
     defaultLocale: 'sv',
     localePrefix: 'always',
     pathnames: {
       '/': '/',
       '/tours': { sv: '/turer', en: '/tours', de: '/touren' },
       '/tours/[slug]': { sv: '/turer/[slug]', en: '/tours/[slug]', de: '/touren/[slug]' },
       '/booking': { sv: '/bokning', en: '/booking', de: '/buchung' },
       '/about': { sv: '/om-oss', en: '/about', de: '/uber-uns' },
       '/contact': { sv: '/kontakt', en: '/contact', de: '/kontakt' }
     }
   })
   ```

3. **Create Middleware**
   ```typescript
   // middleware.ts
   import createMiddleware from 'next-intl/middleware'
   import { routing } from './i18n'

   export default createMiddleware(routing)

   export const config = {
     matcher: ['/((?!api|_next|admin|.*\\..*).*)']
   }
   ```

4. **Create Request Configuration**
   ```typescript
   // i18n/request.ts
   import { getRequestConfig } from 'next-intl/server'
   import { routing } from '@/i18n'

   export default getRequestConfig(async ({ requestLocale }) => {
     let locale = await requestLocale
     if (!locale || !routing.locales.includes(locale)) {
       locale = routing.defaultLocale
     }
     return {
       locale,
       messages: (await import(`../messages/${locale}.json`)).default
     }
   })
   ```

5. **Create Locale Layout**
   ```typescript
   // app/[locale]/layout.tsx
   import { NextIntlClientProvider } from 'next-intl'
   import { getMessages } from 'next-intl/server'

   export default async function LocaleLayout({
     children, params: { locale }
   }) {
     const messages = await getMessages()
     return (
       <html lang={locale}>
         <body>
           <NextIntlClientProvider messages={messages}>
             {children}
           </NextIntlClientProvider>
         </body>
       </html>
     )
   }
   ```

6. **Create Translation Files**
   - `messages/sv.json` - Swedish UI strings
   - `messages/en.json` - English UI strings
   - `messages/de.json` - German UI strings
   - Structure: `{ "nav": {...}, "tours": {...}, "booking": {...} }`

7. **Configure Payload Localization**
   ```typescript
   // packages/cms/payload.config.ts
   export default buildConfig({
     localization: {
       locales: [
         { label: 'Svenska', code: 'sv' },
         { label: 'English', code: 'en' },
         { label: 'Deutsch', code: 'de' }
       ],
       defaultLocale: 'sv',
       fallback: true
     }
   })
   ```

8. **Build Language Switcher**
   - Display current locale with flag/label
   - Dropdown with all locales
   - Persist preference to localStorage
   - Update URL while preserving path

9. **Implement Date/Currency Formatting**
   ```typescript
   // lib/i18n/date-format.ts
   export function formatDate(date: Date, locale: string) {
     return new Intl.DateTimeFormat(locale, {
       dateStyle: 'long'
     }).format(date)
   }

   // lib/i18n/currency-format.ts
   export function formatCurrency(amount: number, locale: string) {
     const currency = locale === 'en' ? 'USD' : 'SEK'
     return new Intl.NumberFormat(locale, {
       style: 'currency',
       currency
     }).format(amount)
   }
   ```

10. **Add SEO Hreflang Tags**
    ```typescript
    // app/[locale]/layout.tsx
    export async function generateMetadata({ params: { locale } }) {
      return {
        alternates: {
          canonical: `https://heritageguiding.com/${locale}`,
          languages: {
            'sv': 'https://heritageguiding.com/sv',
            'en': 'https://heritageguiding.com/en',
            'de': 'https://heritageguiding.com/de'
          }
        }
      }
    }
    ```

## Todo List

- [ ] Install and configure next-intl
- [ ] Create i18n routing configuration
- [ ] Set up locale middleware
- [ ] Create request configuration for server components
- [ ] Build locale layout with NextIntlClientProvider
- [ ] Create Swedish translation file (sv.json)
- [ ] Create English translation file (en.json)
- [ ] Create German translation file (de.json)
- [ ] Configure Payload CMS localization
- [ ] Build language switcher component
- [ ] Implement date formatting utilities
- [ ] Implement currency formatting utilities
- [ ] Add hreflang meta tags
- [ ] Test locale switching end-to-end
- [ ] Verify URL localization works

## Success Criteria

- [ ] `/sv`, `/en`, `/de` routes work correctly
- [ ] Language switcher changes locale and persists
- [ ] Payload admin shows locale tabs for content
- [ ] Dates display in locale format
- [ ] Currency displays correctly per locale
- [ ] hreflang tags present in HTML head
- [ ] Browser language detection works on first visit

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Missing translations | Medium | Medium | Add fallback to default locale |
| URL conflicts with Payload | Low | High | Exclude `/admin` and `/api` in middleware |
| Hydration mismatch | Medium | Medium | Use server components where possible |

## Security Considerations

- Validate locale parameter against allowed list
- Sanitize any user-provided content in translations
- Ensure CMS role-based access for translation editing

## Next Steps

After completion:
1. Proceed to [Phase 03: Data Models & CMS Schema](./phase-03-data-models-cms-schema.md)
2. Define Payload collections with localized fields
3. Set up tour/guide/review data models
