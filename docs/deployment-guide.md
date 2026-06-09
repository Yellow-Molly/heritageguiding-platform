# Private Tours - Deployment Guide

CI/CD pipeline, environment variables, domain configuration, and deployment workflows.

**Last Updated:** April 25, 2026

---

## Table of Contents

1. CI/CD Pipeline
2. Environment Variables
3. Cache Revalidation (Phase 16)
4. Staging Environment (IS_STAGING)
5. Domain & DNS Configuration
6. Monitoring & Analytics
7. Development Workflow
8. Setup Checklist

---

## 1. CI/CD Pipeline

### GitHub Actions Workflow

**File:** `.github/workflows/ci.yml`

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, staging, develop]
  pull_request:
    branches: [main, staging]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run type-check

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          NEXT_PUBLIC_URL: ${{ secrets.NEXT_PUBLIC_URL }}

  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/staging'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Vercel Staging
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}

  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Vercel Production
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Deployment Flow

```
1. Developer pushes to feature branch
   ↓
2. GitHub Actions runs tests
   ↓
3. Create PR to develop
   ↓
4. Code review + approval
   ↓
5. Merge to develop
   ↓
6. Merge develop → staging
   ↓
7. Vercel auto-deploys to staging.privatetours.se
   ↓
8. QA testing on staging
   ↓
9. Merge staging → main
   ↓
10. Vercel auto-deploys to privatetours.se
```

---

## 2. Environment Variables

### Environment Files

```
.env.local          # Local development (gitignored)
.env.staging        # Staging environment
.env.production     # Production environment
.env.example        # Template (committed to git)
```

### Required Variables

```bash
# .env.example

# App
NODE_ENV=development
NEXT_PUBLIC_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/privatetours

# Payload CMS
PAYLOAD_SECRET=your-secret-key-minimum-32-characters
PAYLOAD_CONFIG_PATH=packages/cms/payload.config.ts

# Bokun Integration (Phase 08.1-08.2: inbound + outbound sync)
# REST API credentials (Bokun extranet → Settings → Connections → API keys)
BOKUN_API_KEY=your-bokun-access-key
BOKUN_SECRET_KEY=your-bokun-secret-key
# Public booking channel UUID (Settings → Sales settings → Booking channels)
NEXT_PUBLIC_BOKUN_UUID=your-booking-channel-uuid
# Webhook signature (Bokun PLUS plan or higher — leave blank on START)
BOKUN_WEBHOOK_SECRET=
# Base URL switches automatically: NODE_ENV=production → api.bokun.io,
# otherwise api.bokuntest.com. On Vercel both Preview and Production have
# NODE_ENV=production, so staging hits the live Bokun account — mitigated
# by canary tour pattern (see plans/260514-1437-bokun-integration/phase-07).

# OpenAI (Semantic Search)
OPENAI_API_KEY=sk-your-openai-key

# Media Storage (Vercel Blob)
BLOB_READ_WRITE_TOKEN=vercel_blob_token

# Email (Gmail SMTP via Nodemailer)
# GMAIL_USER = primary licensed Workspace login (SMTP auth; an alias cannot authenticate)
GMAIL_USER=primary-account@privatetours.se
GMAIL_APP_PASSWORD=your-google-app-password
# EMAIL_FROM = visible sender (optional; defaults to GMAIL_USER). Use a Workspace
# alias to send "from" bookings@ while authenticating as the primary account.
EMAIL_FROM=bookings@privatetours.se
# Recipient for contact-form + group-inquiry notifications (REQUIRED for email delivery)
ADMIN_EMAIL=info@privatetours.se

# Analytics (optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# AI chat (Bubblav) — temporarily DISABLED for MVP launch.
# Set to 'true' to re-enable the floating chat widget. When unset/false,
# AiChatProvider returns a no-op context and the ~1.9 MB widget script
# never loads. WhatsApp floating button is unaffected.
NEXT_PUBLIC_ENABLE_AI_CHAT=false

# i18n
DEFAULT_LOCALE=sv
SUPPORTED_LOCALES=sv,en,de
```

### Vercel Setup

**Via Dashboard:**
1. Project Settings → Environment Variables
2. Add each variable
3. Select environments: Production, Preview, Development
4. Save

**Via CLI:**
```bash
vercel env add DATABASE_URL production
vercel env add PAYLOAD_SECRET production
```

### Secret Management

**Never Commit:**
- DATABASE_URL
- PAYLOAD_SECRET
- BOKUN_API_KEY
- BOKUN_SECRET_KEY
- BOKUN_WEBHOOK_SECRET
- OPENAI_API_KEY
- GMAIL_APP_PASSWORD

**Public Variables (NEXT_PUBLIC_*):**
- NEXT_PUBLIC_URL
- NEXT_PUBLIC_GA_ID
- NEXT_PUBLIC_BOKUN_UUID
- NEXT_PUBLIC_ENABLE_AI_CHAT (set to `true` post-launch to re-enable Bubblav)

---

## 3. Cache Revalidation (Phase 16)

> **Correction (2026-06-05):** the code samples below are illustrative and do NOT
> match the implementation. The real flow: (1) the CMS `afterChange` hook calls
> `revalidateTag()` **in-process** (no HTTP round-trip); (2) the on-demand endpoint
> is `POST /api/revalidate?secret=<REVALIDATION_SECRET>&tag=<tag>` — a **query
> param**, not an `X-Revalidate-Token` header. The env var is `REVALIDATION_SECRET`
> (falls back to `PAYLOAD_SECRET`), not `REVALIDATE_TOKEN`.

### Overview

Cache revalidation strategy using Payload CMS hooks + on-demand API endpoint.

### Setup

#### Environment Variables (Required)

Add to Vercel environment variables:
```bash
REVALIDATE_TOKEN=your-secret-random-token-here
```

Example:
```bash
REVALIDATE_TOKEN=sk_test_51234567890abcdefg
```

#### CMS Hook Configuration

File: `packages/cms/hooks/revalidate-cache-tags-hook.ts`

```typescript
export const revalidateCacheTagsHook = async ({ doc, operation }) => {
  const tags = ['tours', 'guides', 'categories']
  
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_URL}/api/revalidate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Revalidate-Token': process.env.REVALIDATE_TOKEN,
        },
        body: JSON.stringify({ tags }),
      }
    )
    if (!response.ok) console.error('Revalidation failed:', response.status)
  } catch (error) {
    console.error('Cache revalidation error:', error)
  }
  
  return doc
}
```

#### API Endpoint

File: `apps/web/app/api/revalidate/route.ts`

```typescript
import { revalidateTag } from 'next/cache'

export async function POST(req: Request) {
  // Token validation
  const token = req.headers.get('X-Revalidate-Token')
  if (token !== process.env.REVALIDATE_TOKEN) {
    return new Response('Unauthorized', { status: 401 })
  }
  
  try {
    const { tags } = await req.json()
    if (!Array.isArray(tags)) {
      return Response.json({ error: 'tags must be an array' }, { status: 400 })
    }
    
    tags.forEach((tag: string) => revalidateTag(tag))
    return Response.json({ revalidated: true, tags })
  } catch (error) {
    console.error('Revalidation error:', error)
    return Response.json({ error: 'Revalidation failed' }, { status: 500 })
  }
}
```

### Cache Tags

Standard tags for revalidation:
- `tours` - Tour listing, detail pages
- `guides` - Guide listing, detail pages
- `categories` - Filter categories
- `homepage` - Homepage featured sections

### Testing Cache Revalidation

```bash
# From server/local machine
curl -X POST http://localhost:3000/api/revalidate \
  -H "Content-Type: application/json" \
  -H "X-Revalidate-Token: your-secret-token" \
  -d '{"tags": ["tours", "guides"]}'

# Expected response:
# {"revalidated": true, "tags": ["tours", "guides"]}
```

### CMS Hook Integration

Add hook to collection's `afterChange` hook array:
```typescript
// packages/cms/collections/tours.ts
import { revalidateCacheTagsHook } from '../hooks/revalidate-cache-tags-hook'

export const Tours: CollectionConfig = {
  slug: 'tours',
  // ... other config ...
  hooks: {
    afterChange: [revalidateCacheTagsHook],
  },
}
```

---

## 3.1 Payload Jobs Queue (Phase 08.2)

### Purpose

Async task execution for long-running operations (e.g., Bokun tour sync). Jobs run via Payload's built-in queue.

### Behavior

**Local Development:**
- Jobs execute inline (synchronously) by default
- No worker scheduler required
- Useful for testing

**Production:**
- Jobs require a worker scheduler (e.g., Vercel Cron, AWS Lambda, BullMQ queue)
- Production implementation depends on deployment platform
- **TODO:** Configure production worker scheduler (not yet implemented; see risk register Phase 08.2 plan)

### Current Usage

**Bokun Outbound Sync (Phase 08.2):**
- Hook: `packages/cms/hooks/sync-tour-to-bokun-hook.ts` enqueues `syncTourToBokun` job on Tour afterChange
- Job: `packages/cms/jobs/sync-tour-to-bokun-job.ts` with exponential backoff retry
- Runs inline in dev; production deployment pending

### Reference

- Payload Jobs documentation: https://payloadcms.com/docs/jobs
- Existing usage in codebase: Search for `job.enqueue()` or `defineJob()`

---

## 4. Staging Environment (IS_STAGING)

### Purpose

Prevent search engines from indexing staging environment while allowing internal testing.

### Setup

#### Vercel Staging Project

Set environment variable `IS_STAGING` to `true`:
1. Vercel Dashboard → Project → Settings → Environment Variables
2. Add variable: `IS_STAGING` = `true`
3. Select environment: **Preview** only (NOT Production)
4. Save

#### Production Project

Do NOT set `IS_STAGING` (or set to `false`) on production Vercel project.

### Implementation

#### robots.txt

File: `apps/web/app/robots.ts`

```typescript
export default function robots() {
  if (process.env.IS_STAGING === 'true') {
    // Deny all crawlers on staging
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    }
  }
  // Allow all crawlers on production
  return {
    rules: {
      userAgent: '*',
      disallow: [],
    },
  }
}
```

#### Vercel Headers

File: `vercel.json` (root)

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Robots-Tag",
          "value": "noindex,nofollow"
        }
      ]
    }
  ]
}
```

Add logic to only apply headers when `IS_STAGING=true`.

### Verification

Test on staging:
```bash
curl -I https://staging.privatetours.se/robots.txt
# Should return: Disallow: /

curl -I https://staging.privatetours.se/
# Should have header: X-Robots-Tag: noindex,nofollow

# Check production (should be indexed):
curl -I https://privatetours.se/robots.txt
# Should allow crawlers
```

---

## 4.5 Launch Gate (COMING_SOON)

The production apex (`privatetours.se`) is held on a "coming soon" page by a
**fail-safe** env gate in `next.config.ts`. The holding redirect is active unless
`COMING_SOON` is explicitly `false`, and is host-scoped to the bare apex
(local dev, preview, and `staging.privatetours.se` are never gated).

- **Go live:** set `COMING_SOON=false` on the Production Vercel project + redeploy.
- **Roll back to dark:** set `COMING_SOON=true` (or remove it) + redeploy the
  *current* build. Do NOT promote an older deployment to roll back (it would
  revert env-var fixes and re-expose stale behavior).
- Covers all locales (`sv`, `en`, `de`). Leaving it unset keeps the site dark.

---

## 5. Domain & DNS Configuration

### Domain Setup

**Primary:** privatetours.se

### DNS Records

**For .com (Namecheap):**
```
Type    Name    Value                    TTL
A       @       76.76.21.21              300
CNAME   www     cname.vercel-dns.com     300
```

**For .se (Loopia):**
```
Type    Name    Value                    TTL
A       @       76.76.21.21              300
CNAME   www     cname.vercel-dns.com     300
```

### Vercel Domain Setup

1. Go to Vercel Project → Settings → Domains
2. Add `privatetours.se`
3. Add `www.privatetours.se`
4. Vercel provides DNS configuration
5. Update DNS at registrar
6. Wait for propagation (1-48 hours)
7. SSL auto-provisioned

### Redirect Strategy

```
heritageguiding.com  → privatetours.se
www.privatetours.se  → privatetours.se
```

### Email DNS (Google Workspace)

```
Type    Name    Value
MX      @       Google Workspace MX records (configured in Google Admin)
TXT     @       v=SPF1 include:_spf.google.com ~all
TXT     @       v=DMARC1; p=none
```

---

## 6. Monitoring & Analytics

### Performance Monitoring

**Vercel Analytics (Built-in):**
- Real User Monitoring (RUM)
- Core Web Vitals
- Edge function metrics
- No configuration needed

### Error Tracking

**Option 1: Sentry**
```bash
npm install @sentry/nextjs
```

**Option 2: Vercel Error Logging**
- Built-in error capture
- Function logs
- Real-time monitoring

### Uptime Monitoring

**Tools:**
- UptimeRobot (free tier)
- Better Uptime ($10/month)

**Configuration:**
```
Monitor: privatetours.se
Check interval: 5 minutes
Alert: Email, SMS
```

### Log Aggregation

```bash
# View logs
vercel logs privatetours-platform

# Real-time logs
vercel logs --follow
```

---

## 7. Development Workflow

### Daily Workflow

```bash
# Start work
git checkout develop
git pull origin develop
git checkout -b feature/tour-detail-page

# Development
npm run dev
# ... make changes ...
npm run type-check
npm run lint
git add .
git commit -m "feat: add tour detail page"
git push origin feature/tour-detail-page

# Create PR on GitHub
```

### PR Checklist

- [ ] Code compiles without errors
- [ ] TypeScript types correct
- [ ] Linting passes
- [ ] Mobile responsive
- [ ] Accessibility tested
- [ ] i18n works (sv, en, de)
- [ ] No console.logs
- [ ] Performance acceptable

### Hotfix Process

```bash
# Critical bug in production
git checkout main
git checkout -b hotfix/booking-bug
# ... fix bug ...
git commit -m "fix: resolve booking calculation error"
git push origin hotfix/booking-bug

# Create PR to main (fast-track review)
# Deploy immediately
```

---

## 8. Setup Checklist

### Pre-Development

- [ ] GitHub repository created (private)
- [ ] privatetours.se registered
- [ ] Vercel account created (production + staging projects)
- [ ] Vercel connected to GitHub
- [ ] Supabase database created
- [ ] pgvector extension enabled
- [ ] Bokun API access granted
- [ ] OpenAI API key obtained
- [ ] Google Workspace Business account created
- [ ] Email DNS configured
- [ ] Generate REVALIDATE_TOKEN for cache API (random 32+ char string)

### Week 1 Setup

- [ ] Repository structure created
- [ ] Next.js 16.2.3 initialized (Turbopack bundler)
- [ ] Payload CMS 3.81.0 installed
- [ ] Database migrations run
- [ ] Development server working
- [ ] Type checking working
- [ ] Linting configured
- [ ] CI/CD pipeline working
- [ ] Staging deployed (IS_STAGING=true on preview)
- [ ] Production project created (IS_STAGING not set or false)
- [ ] Domain pointed to Vercel
- [ ] SSL certificate active
- [ ] Cache revalidation token generated and stored
- [ ] /api/revalidate endpoint tested

### Post-Launch

- [ ] Production deployment successful
- [ ] Database backups verified
- [ ] Monitoring alerts configured
- [ ] Error tracking active
- [ ] Analytics verified
- [ ] Performance baseline established
- [ ] Security audit completed

---

## Setup Timeline

**Week 0 (Pre-Development):**
- Day 1: Create GitHub repository
- Day 2: Register domains
- Day 3: Set up Vercel, connect repo
- Day 4: Create Supabase database
- Day 5: Configure environment variables
- Day 6: Set up Bokun + OpenAI accounts
- Day 7: Configure email (Google Workspace + app password)

**Week 1 (Phase 1 - Foundation):**
- Initialize Next.js 16 + Payload CMS 3.75
- Configure database connection
- Set up development environment
- Test integrations
- Deploy to staging

---

## Related Documentation

- [Infrastructure Setup](./infrastructure-setup.md) - Hosting, database, services
- [System Architecture](./system-architecture.md) - Technical design
- [Code Standards](./code-standards.md) - Development guidelines
- [Bokun Cart CSS Customization](./bokun-cart-css-customization.md) - **Load-bearing CSS** injected via Bokun admin Theme → Advanced options. WCAG fix for the cart delete button. Lives in Bokun admin, NOT in this repo.
