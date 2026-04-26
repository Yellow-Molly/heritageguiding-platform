# Phase 1: Block Staging Crawlers

## Context Links

- Research: [researcher-01-staging-seo-blocking.md](./research/researcher-01-staging-seo-blocking.md)
- Current robots.ts: `apps/web/app/robots.ts` (19 lines)
- Current tests: `apps/web/app/__tests__/robots.test.ts` (28 lines)
- Sitemap: `apps/web/app/sitemap.ts` (107 lines)
- Layout: `apps/web/app/(site)/[locale]/layout.tsx` (87 lines)
- Next config: `apps/web/next.config.ts` (143 lines)
- SEO utils: `apps/web/lib/seo.ts` (148 lines)

## Overview

- **Priority:** P1 (staging is currently indexable by Google)
- **Status:** Pending
- **Effort:** 1.5h
- **Description:** Add environment-aware SEO blocking via 3 layers: robots.txt, X-Robots-Tag HTTP header, and meta noindex fallback. Suppress sitemap on non-production.

## Key Insights

- `VERCEL_ENV` is `'production'` only on the production deployment; staging/preview get `'preview'` or custom values
- Custom staging domain bypasses Vercel's automatic `X-Robots-Tag: noindex` (that only applies to `*.vercel.app` preview URLs)
- robots.txt alone is advisory (90% compliance); X-Robots-Tag is authoritative per Google docs
- `NEXT_PUBLIC_SITE_URL` is set per-environment in Vercel, so canonicals already differ -- but crawlers still index staging pages

## Requirements

### Functional
- Non-production: robots.txt disallows all paths, no sitemap reference
- Non-production: X-Robots-Tag header on all responses
- Non-production: meta robots noindex in HTML head
- Non-production: sitemap returns empty array (no URLs leaked)
- Production: behavior identical to current (allow `/`, disallow `/admin/` and `/api/`, sitemap present)

### Non-Functional
- Zero new dependencies
- No performance impact (env check is a string comparison at build/request time)
- Backwards compatible -- production behavior unchanged

## Architecture

### Data Flow
```
Request → next.config.ts headers() → X-Robots-Tag (if non-prod)
       → robots.ts → robots.txt (disallow all if non-prod)
       → sitemap.ts → empty [] (if non-prod)
       → layout.tsx → <meta name="robots" noindex> (if non-prod)
```

### Environment Detection (single source of truth)
```typescript
// apps/web/lib/environment.ts
export function isProductionDeployment(): boolean {
  return process.env.VERCEL_ENV === 'production'
}
```

Why `VERCEL_ENV` only (not `NODE_ENV`):
- `NODE_ENV` is `'production'` on ALL Vercel deployments (staging included) -- useless for this
- `VERCEL_ENV` distinguishes production vs preview/staging
- Locally (`VERCEL_ENV` undefined) → treated as non-production (safe default)

## Related Code Files

### Create
| File | Purpose |
|------|---------|
| `apps/web/lib/environment.ts` | Shared env detection helper |

### Modify
| File | Change |
|------|--------|
| `apps/web/app/robots.ts` | Conditional rules based on `isProductionDeployment()` |
| `apps/web/app/__tests__/robots.test.ts` | Add production/staging test cases with env mocking |
| `apps/web/app/sitemap.ts` | Early return `[]` on non-production |
| `apps/web/next.config.ts` | Add X-Robots-Tag header for non-production |
| `apps/web/app/(site)/[locale]/layout.tsx` | Add `<meta name="robots" content="noindex, nofollow">` for non-production |

### No Changes Needed
| File | Reason |
|------|--------|
| `apps/web/lib/seo.ts` | Canonicals use `NEXT_PUBLIC_SITE_URL` which is already env-specific; `generateRobotsDirectives` already supports `noIndex` param |

## Implementation Steps

### Step 1: Create environment helper

Create `apps/web/lib/environment.ts`:

```typescript
/**
 * Check if running on Vercel production deployment.
 * Returns false for staging, preview, and local development (safe default).
 */
export function isProductionDeployment(): boolean {
  return process.env.VERCEL_ENV === 'production'
}
```

### Step 2: Update robots.ts

Replace `apps/web/app/robots.ts` body:

```typescript
import type { MetadataRoute } from 'next'
import { isProductionDeployment } from '@/lib/environment'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://privatetours.se'

  if (!isProductionDeployment()) {
    return {
      rules: { userAgent: '*', disallow: '/' },
    }
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
```

Key: no sitemap reference on non-prod (prevents crawlers from discovering URLs).

### Step 3: Add X-Robots-Tag header in next.config.ts

In `apps/web/next.config.ts`, add a new header block inside the existing `headers()` function. Insert BEFORE the `/:path*` security headers block (line 108):

```typescript
// Block search engine indexing on non-production deployments
...(process.env.VERCEL_ENV !== 'production'
  ? [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ]
  : []),
```

Note: Use inline `process.env.VERCEL_ENV` check here (not the helper) because `next.config.ts` runs before the app module system is available. The env var read is direct and simple.

### Step 4: Add meta noindex in layout.tsx

In `apps/web/app/(site)/[locale]/layout.tsx`, inside the `<head>` element (after the preconnect links, ~line 71):

```tsx
{/* Block indexing on non-production deployments */}
{process.env.VERCEL_ENV !== 'production' && (
  <meta name="robots" content="noindex, nofollow" />
)}
```

Note: Direct env check (not the helper import) because this is a server component and the check is trivial. However, using the helper is also fine -- implementer's choice. Keep consistent.

### Step 5: Guard sitemap on non-production

In `apps/web/app/sitemap.ts`, add early return at the top of the function body (after line 31):

```typescript
// Don't expose URLs on non-production deployments
if (process.env.VERCEL_ENV !== 'production') {
  return []
}
```

### Step 6: Update tests

Rewrite `apps/web/app/__tests__/robots.test.ts` to cover both environments:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import robots from '../robots'

describe('robots.ts', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('production', () => {
    beforeEach(() => {
      process.env.VERCEL_ENV = 'production'
      process.env.NEXT_PUBLIC_SITE_URL = 'https://privatetours.se'
    })

    it('allows crawling on /', () => {
      const result = robots()
      const rules = result.rules as { userAgent: string; allow: string }
      expect(rules.userAgent).toBe('*')
      expect(rules.allow).toBe('/')
    })

    it('disallows /admin/ and /api/', () => {
      const result = robots()
      const rules = result.rules as { disallow: string[] }
      expect(rules.disallow).toContain('/admin/')
      expect(rules.disallow).toContain('/api/')
    })

    it('includes sitemap URL', () => {
      const result = robots()
      expect(result.sitemap).toBe('https://privatetours.se/sitemap.xml')
    })
  })

  describe('non-production (staging/preview)', () => {
    beforeEach(() => {
      process.env.VERCEL_ENV = 'preview'
    })

    it('disallows all crawling', () => {
      const result = robots()
      const rules = result.rules as { userAgent: string; disallow: string }
      expect(rules.userAgent).toBe('*')
      expect(rules.disallow).toBe('/')
    })

    it('does not include sitemap', () => {
      const result = robots()
      expect(result.sitemap).toBeUndefined()
    })

    it('does not include allow directive', () => {
      const result = robots()
      const rules = result.rules as { allow?: string }
      expect(rules.allow).toBeUndefined()
    })
  })

  describe('local development (no VERCEL_ENV)', () => {
    beforeEach(() => {
      delete process.env.VERCEL_ENV
    })

    it('disallows all crawling', () => {
      const result = robots()
      const rules = result.rules as { disallow: string }
      expect(rules.disallow).toBe('/')
    })
  })
})
```

## Todo List

- [ ] Create `apps/web/lib/environment.ts` with `isProductionDeployment()`
- [ ] Update `apps/web/app/robots.ts` with conditional rules
- [ ] Add X-Robots-Tag header in `apps/web/next.config.ts`
- [ ] Add meta noindex in `apps/web/app/(site)/[locale]/layout.tsx`
- [ ] Add early return in `apps/web/app/sitemap.ts`
- [ ] Rewrite `apps/web/app/__tests__/robots.test.ts` with env-aware tests
- [ ] Run `npm run build` to verify no compile errors
- [ ] Run `npm run test` to verify all tests pass

## Success Criteria

- `robots()` returns `disallow: '/'` when `VERCEL_ENV !== 'production'`
- `robots()` returns current production behavior when `VERCEL_ENV === 'production'`
- Staging HTTP responses include `X-Robots-Tag: noindex, nofollow`
- Staging HTML includes `<meta name="robots" content="noindex, nofollow">`
- Sitemap returns empty on staging, full on production
- All tests pass (existing updated + new cases)
- No new dependencies added

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `VERCEL_ENV` not set on staging | Low | High (staging indexable) | Safe default: undefined = non-production. Verify in Vercel dashboard. |
| X-Robots-Tag conflicts with CSP | Very Low | Low | Different headers, no interaction |
| next.config.ts headers order matters | Low | Medium | Place X-Robots-Tag block before security headers; Next.js merges all matching rules |
| Production accidentally gets noindex | Very Low | Critical | `VERCEL_ENV === 'production'` is set by Vercel only on prod deployment. Test with env mocking. |

## Security Considerations

- No secrets exposed; only reads `VERCEL_ENV` (auto-populated by Vercel, not sensitive)
- Staging protection is defense-in-depth (not authentication); complement with Vercel Deployment Protection for full lockdown

## Next Steps

- After deployment: verify with `curl -I https://staging.privatetours.se/` that headers are correct
- Consider enabling Vercel Deployment Protection (password) for staging as additional layer
- Monitor Google Search Console for staging URL deindexing over following weeks
