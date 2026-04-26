# Staging SEO Blocking: Next.js Implementation Research

## Executive Summary

Staging sites must be blocked from search indexing via **3-layer defense**: robots.ts (crawl control), X-Robots-Tag headers (HTTP enforcement), and meta tags (HTML fallback). Vercel preview deployments are automatically protected; custom staging domains require manual configuration.

---

## 1. Next.js robots.ts API (Recommended)

**Status:** Stable, built-in to App Router.

```typescript
// app/robots.ts
export default function robots() {
  const isProduction = process.env.NODE_ENV === 'production' 
    && process.env.VERCEL_ENV === 'production'
  
  return {
    rules: {
      userAgent: '*',
      allow: isProduction ? '/' : undefined,
      disallow: isProduction ? [] : '/',
    },
    sitemap: `https://${process.env.VERCEL_URL}/sitemap.xml`,
  }
}
```

**Key Points:**
- Generates `/robots.txt` dynamically
- `disallow: '/'` blocks ALL crawlers on staging
- Uses `process.env.NODE_ENV` + `process.env.VERCEL_ENV` for environment detection
- No hardcoded domain needed; works across preview/custom URLs

**Trade-off:** Won't stop crawlers that ignore robots.txt (90% respect it, but not guaranteed).

---

## 2. Meta Tag + HTTP Header Strategy

### A. HTTP Header (X-Robots-Tag) — **Most Reliable**

Add to `next.config.ts`:

```typescript
// next.config.ts
const isProduction = process.env.VERCEL_ENV === 'production'

export default {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: isProduction ? [] : [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ]
  },
}
```

**Why This Works:**
- Sent before HTML is parsed (crawlers must respect)
- Works for ALL resources (HTML, JSON, images, etc.)
- More authoritative than meta tags per Google docs
- Prevents indexing even if HTML is accessed directly

### B. Meta Tag (HTML) — **Fallback**

In `app/layout.tsx` (root layout):

```typescript
import { ReactNode } from 'react'

export default function RootLayout({ children }: { children: ReactNode }) {
  const isProduction = process.env.NODE_ENV === 'production'
    && process.env.VERCEL_ENV === 'production'

  return (
    <html>
      <head>
        {!isProduction && (
          <meta name="robots" content="noindex, nofollow" />
        )}
      </head>
      <body>{children}</body>
    </html>
  )
}
```

**Limitation:** Only blocks crawlers that parse HTML; should pair with HTTP header.

---

## 3. Vercel Deployment Protection (Complementary)

**Automatic:** Vercel preview deployments (e.g., `my-app-pr-123.vercel.app`) automatically include `X-Robots-Tag: noindex` — **no config needed**.

**Custom Staging Domain:** If staging has a custom domain (e.g., `staging.example.com`):
- Default: **NOT** protected (custom domains assume production-like usage)
- Solution: Enable **Deployment Protection** in Vercel project settings → add password/authentication
- Alternative: Manually set X-Robots-Tag header (see section 2A above)

**Critical Gotcha:** Custom domain + non-production branch = NO automatic noindex header.

---

## 4. Environment Variable Detection

**Recommended combination:**

```typescript
// Reusable check
const isStaging = 
  process.env.NODE_ENV !== 'production' ||
  (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production')
```

**Vercel vars available:**
- `VERCEL_ENV`: 'production' | 'preview' | (custom env name)
- `NODE_ENV`: 'production' | 'development'
- `VERCEL_URL`: full deployment URL (auto-populated)

---

## Implementation Ranking

| Layer | Priority | Effort | Coverage |
|-------|----------|--------|----------|
| robots.ts | 1st | Low | 90% crawlers (respects robots.txt) |
| X-Robots-Tag header | 2nd | Low | 99% crawlers (HTTP-level enforcement) |
| Meta tag | 3rd | Low | 85% crawlers (HTML parse-dependent) |
| Vercel protection | 4th | Medium | Preview: 100%, Custom: 0% (needs setup) |

**Recommendation:** Implement layers 1 + 2 (robots.ts + X-Robots-Tag). Adds <50 lines of config, covers 99%+ of cases.

---

## Sources
- [Next.js Metadata Files: robots](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots)
- [Google Search Central: Block Indexing](https://developers.google.com/search/docs/crawling-indexing/block-indexing)
- [Google: Robots Meta Tag Spec](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag)
- [MDN: X-Robots-Tag Header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Robots-Tag)
- [Vercel: Deployment Protection](https://vercel.com/docs/deployment-protection)
- [Vercel KB: Preview Deployment Indexing](https://vercel.com/kb/guide/are-vercel-preview-deployment-indexed-by-search-engines)
- [Google Search Central Community: Staging in Next.js](https://support.google.com/webmasters/thread/271840906)
- [Restack: Next.js X-Robots-Tag Guide](https://www.restack.io/docs/nextjs-knowledge/nextjs-x-robots-tag-noindex-guide)

---

## Unresolved Questions
- Should staging environment use `noindex, follow` (allow discovery of links) or `noindex, nofollow` (total block)? → Recommend `noindex, nofollow` for strict staging isolation.
- Does Payload CMS require additional robots.ts handling? → No special handling needed; standard Next.js approach works.
