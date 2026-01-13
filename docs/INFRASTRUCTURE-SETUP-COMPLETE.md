# HERITAGEGUIDING MVP - INFRASTRUCTURE SETUP & REPOSITORY STRATEGY
Complete Technical Infrastructure Plan

═══════════════════════════════════════════════════════════════════════
## TABLE OF CONTENTS
═══════════════════════════════════════════════════════════════════════

1. Repository Strategy
2. Development Environment
3. Hosting & Infrastructure
4. Database Setup
5. Third-Party Services
6. CI/CD Pipeline
7. Environment Variables
8. Domain & DNS Configuration
9. Monitoring & Analytics
10. Security Setup
11. Backup Strategy
12. Development Workflow

═══════════════════════════════════════════════════════════════════════
## 1. REPOSITORY STRATEGY
═══════════════════════════════════════════════════════════════════════

### RECOMMENDED: **MONOREPO APPROACH**

**Total Repositories: 1 (ONE)**

```
heritageguiding-platform/
├── apps/
│   └── web/                    # Next.js 15 frontend application
│       ├── app/                # App router pages
│       ├── components/         # React components
│       ├── lib/                # Utilities
│       └── public/             # Static assets
├── packages/
│   ├── cms/                    # Payload CMS configuration
│   │   ├── collections/        # CMS data models
│   │   ├── access/             # Access control
│   │   └── payload.config.ts   # Payload config
│   ├── ui/                     # Shared UI components
│   │   ├── components/         # shadcn/ui components
│   │   └── styles/             # Tailwind config
│   └── types/                  # Shared TypeScript types
├── scripts/                    # Build & deployment scripts
├── .github/                    # GitHub Actions workflows
├── docs/                       # Documentation
├── package.json                # Root package.json
├── turbo.json                  # Turborepo config (optional)
└── README.md
```

### WHY MONOREPO?

✅ **Advantages:**
- Single source of truth for entire platform
- Shared types between frontend and CMS
- Easier dependency management
- Unified CI/CD pipeline
- Better code reuse
- Simpler to onboard new developers

❌ **Multi-Repo Approach (NOT RECOMMENDED):**
```
# DON'T DO THIS for MVP:
- heritageguiding-frontend (Next.js)
- heritageguiding-cms (Payload)
- heritageguiding-shared (types)
```
**Why not:** 
- More complexity
- Type sync issues
- Multiple deployments
- Harder to maintain
- Overkill for MVP


### REPOSITORY SETUP

**Git Provider:** GitHub (recommended) or GitLab

**Repository Name:** 
```
heritageguiding-platform
```

**Visibility:** Private

**Initial Setup:**
```bash
# Create repository
git init
git add .
git commit -m "Initial commit: Heritage Guiding MVP setup"
git branch -M main
git remote add origin git@github.com:yourusername/heritageguiding-platform.git
git push -u origin main
```

### BRANCH STRATEGY

```
main (production)
├── staging (pre-production)
├── develop (active development)
└── feature/* (feature branches)
```

**Branch Protection:**
- `main`: Require PR approval, passing CI
- `staging`: Require passing CI
- `develop`: Open for direct commits during MVP

**Branch Flow:**
```
feature/tour-catalog → develop → staging → main
```

═══════════════════════════════════════════════════════════════════════
## 2. DEVELOPMENT ENVIRONMENT
═══════════════════════════════════════════════════════════════════════

### LOCAL DEVELOPMENT SETUP

**Prerequisites:**
```bash
Node.js: v20+ (LTS)
npm: v10+
PostgreSQL: v15+
Git: v2.40+
```

**Installation Script:**
```bash
#!/bin/bash
# setup-dev.sh

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Set up database
npm run db:setup

# Generate Payload types
npm run payload:generate-types

# Start development server
npm run dev
```

**Development Commands:**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "payload": "payload",
    "db:migrate": "payload migrate",
    "db:seed": "payload seed",
    "db:reset": "payload migrate:reset && payload seed"
  }
}
```

### TECH STACK VERSIONS

```json
{
  "dependencies": {
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@payloadcms/next": "^3.0.0",
    "@payloadcms/db-postgres": "^3.0.0",
    "@payloadcms/richtext-lexical": "^3.0.0",
    "postgres": "^3.4.0",
    "sharp": "^0.33.0",
    "next-intl": "^3.20.0",
    "tailwindcss": "^3.4.0",
    "@radix-ui/react-*": "latest",
    "lucide-react": "^0.454.0",
    "zod": "^3.23.0",
    "date-fns": "^4.1.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "eslint": "^9.0.0",
    "prettier": "^3.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

### IDE CONFIGURATION

**VS Code Extensions:**
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "lokalise.i18n-ally",
    "prisma.prisma"
  ]
}
```

**Editor Config (.editorconfig):**
```ini
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false
```

═══════════════════════════════════════════════════════════════════════
## 3. HOSTING & INFRASTRUCTURE
═══════════════════════════════════════════════════════════════════════

### FRONTEND HOSTING: **VERCEL**

**Plan:** Pro ($20/month)

**Configuration:**
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "regions": ["fra1"]
}
```

**Vercel Project Setup:**
1. Connect GitHub repository
2. Select `main` branch for production
3. Set environment variables (see section 7)
4. Enable automatic deployments
5. Configure custom domain

**Deployment Environments:**
```
Production:  main branch     → heritageguiding.com
Staging:     staging branch  → staging.heritageguiding.com
Preview:     PR branches     → pr-123.heritageguiding.vercel.app
```

**Vercel Features Used:**
- ✓ Edge Functions (serverless)
- ✓ Image Optimization (automatic)
- ✓ Analytics
- ✓ Web Vitals monitoring
- ✓ Automatic HTTPS
- ✓ DDoS protection

**Cost Estimate:** $20/month (Pro plan)


### DATABASE HOSTING: **SUPABASE** (Recommended)

**Plan:** Pro ($25/month)

**Specifications:**
- PostgreSQL 15+
- 8GB RAM
- 500GB bandwidth/month
- Daily backups
- EU region (Stockholm preferred)

**Setup Steps:**
1. Create Supabase project
2. Note connection string
3. Configure Payload CMS database adapter
4. Run migrations
5. Set up connection pooling

**Alternative:** Railway ($20/month)

**Cost Estimate:** $25/month


### CMS HOSTING: **INTEGRATED WITH NEXT.JS**

Payload CMS runs as part of the Next.js application:
```
app/
├── (payload)/
│   └── admin/
│       └── [[...segments]]/
│           └── page.tsx  # Payload admin UI
└── api/
    └── [...slug]/
        └── route.ts      # Payload API routes
```

No separate hosting needed - reduces complexity and cost.


═══════════════════════════════════════════════════════════════════════
## 4. DATABASE SETUP
═══════════════════════════════════════════════════════════════════════

### DATABASE STRUCTURE

**Schema Management:** Payload CMS auto-generates schema from collections

**Collections (Tables):**
```
- tours
- guides
- categories
- reviews
- media
- users
- pages (for static content)
```

**Database URL Format:**
```
postgresql://user:password@host:5432/heritageguiding?pgbouncer=true
```

### MIGRATION STRATEGY

**Payload handles migrations automatically:**
```bash
# Generate migration
npm run db:migrate:create

# Run migrations
npm run db:migrate

# Rollback migration
npm run db:migrate:rollback
```

**Migration Files Location:**
```
packages/cms/migrations/
├── 20250112_initial_schema.ts
├── 20250115_add_accessibility_fields.ts
└── 20250120_add_schema_org_fields.ts
```

### DATABASE BACKUPS

**Automated Backups (Supabase):**
- Daily automated backups (retained 7 days)
- Weekly backups (retained 4 weeks)
- Point-in-time recovery (PITR)

**Manual Backup Script:**
```bash
#!/bin/bash
# backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
pg_dump $DATABASE_URL > backups/db_backup_$DATE.sql
```

### CONNECTION POOLING

**Use PgBouncer (included with Supabase):**
```typescript
// payload.config.ts
export default buildConfig({
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
      max: 20
    }
  })
})
```

═══════════════════════════════════════════════════════════════════════
## 5. THIRD-PARTY SERVICES
═══════════════════════════════════════════════════════════════════════

### BOOKING SYSTEM: **REZDY**

**Integration Type:** REST API

**API Endpoints Used:**
- `/products` - Get tour inventory
- `/availability` - Check availability
- `/bookings` - Create bookings
- `/customers` - Customer management

**Setup:**
```typescript
// lib/rezdy.ts
export const rezdyClient = {
  apiKey: process.env.REZDY_API_KEY,
  apiUrl: 'https://api.rezdy.com/v1',
  // API integration code
}
```

**Cost:** Varies (typically 2-3% per booking + monthly fee)


### MEDIA STORAGE: **CLOUDINARY**

**Plan:** Plus ($89/month) or Vercel Blob ($10/month)

**Cloudinary Configuration:**
```typescript
// lib/cloudinary.ts
export const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
}
```

**Features:**
- Automatic WebP conversion
- Responsive image generation
- Lazy loading
- Image optimization

**Alternative: Vercel Blob**
- Simpler setup
- Lower cost for MVP
- Good for <10GB storage

**Cost:** $10-89/month


### EMAIL SERVICE: **RESEND**

**Plan:** Pro ($20/month for 50k emails)

**Configuration:**
```typescript
// lib/email.ts
import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY);
```

**Email Templates:**
```
emails/
├── booking-confirmation.tsx
├── inquiry-received.tsx
├── inquiry-notification.tsx
└── password-reset.tsx
```

**Cost:** $20/month


### ANALYTICS: **VERCEL ANALYTICS + GOOGLE ANALYTICS**

**Vercel Analytics:**
- Built-in Web Vitals
- Real-time visitor data
- No configuration needed

**Google Analytics 4:**
```typescript
// app/layout.tsx
<Script
  src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
  strategy="afterInteractive"
/>
```

**Cost:** Free


### ERROR TRACKING: **SENTRY** (Optional for MVP)

**Plan:** Developer ($26/month)

```typescript
// sentry.config.ts
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
})
```

**Cost:** $0 (free tier sufficient for MVP) or $26/month


═══════════════════════════════════════════════════════════════════════
## 6. CI/CD PIPELINE
═══════════════════════════════════════════════════════════════════════

### GITHUB ACTIONS WORKFLOW

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

### DEPLOYMENT FLOW

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
6. Test on develop branch
   ↓
7. Merge develop → staging
   ↓
8. Vercel auto-deploys to staging.heritageguiding.com
   ↓
9. QA testing on staging
   ↓
10. Merge staging → main
    ↓
11. Vercel auto-deploys to heritageguiding.com
    ↓
12. 🚀 LIVE
```

═══════════════════════════════════════════════════════════════════════
## 7. ENVIRONMENT VARIABLES
═══════════════════════════════════════════════════════════════════════

### ENVIRONMENT FILES

```
.env.local          # Local development (gitignored)
.env.staging        # Staging environment
.env.production     # Production environment
.env.example        # Template (committed to git)
```

### REQUIRED ENVIRONMENT VARIABLES

```bash
# .env.example

# App
NODE_ENV=development
NEXT_PUBLIC_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/heritageguiding

# Payload CMS
PAYLOAD_SECRET=your-secret-key-minimum-32-characters
PAYLOAD_CONFIG_PATH=packages/cms/payload.config.ts

# Rezdy
REZDY_API_KEY=your-rezdy-api-key
REZDY_API_SECRET=your-rezdy-api-secret

# Cloudinary (or Vercel Blob)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (Resend)
RESEND_API_KEY=re_your-api-key
EMAIL_FROM=bookings@heritageguiding.com

# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Optional: Sentry
SENTRY_DSN=https://your-sentry-dsn

# i18n
DEFAULT_LOCALE=sv
SUPPORTED_LOCALES=sv,en,de
```

### VERCEL ENVIRONMENT VARIABLES SETUP

**Via Vercel Dashboard:**
1. Go to Project Settings → Environment Variables
2. Add each variable
3. Select environments: Production, Preview, Development
4. Save

**Via Vercel CLI:**
```bash
vercel env add DATABASE_URL production
vercel env add PAYLOAD_SECRET production
# ... etc
```

### SECRET MANAGEMENT

**Sensitive Variables (never commit):**
- `DATABASE_URL`
- `PAYLOAD_SECRET`
- `REZDY_API_SECRET`
- `CLOUDINARY_API_SECRET`
- `RESEND_API_KEY`

**Public Variables (can be exposed to frontend):**
- `NEXT_PUBLIC_URL`
- `NEXT_PUBLIC_GA_ID`
- `NEXT_PUBLIC_REZDY_PARTNER_ID` (if needed)

═══════════════════════════════════════════════════════════════════════
## 8. DOMAIN & DNS CONFIGURATION
═══════════════════════════════════════════════════════════════════════

### DOMAIN SETUP

**Primary Domain:** HeritageGuiding.com
**Secondary:** HeritageGuiding.se

### DNS RECORDS (Namecheap/Loopia)

**For .com (Namecheap):**
```
Type    Name    Value                           TTL
────────────────────────────────────────────────────────
A       @       76.76.21.21 (Vercel IP)         300
CNAME   www     cname.vercel-dns.com            300
TXT     @       "v=spf1 include:_spf.mx..."     300
```

**For .se (Loopia):**
```
Type    Name    Value                           TTL
────────────────────────────────────────────────────────
A       @       76.76.21.21 (Vercel IP)         300
CNAME   www     cname.vercel-dns.com            300
```

**Setup with Vercel:**
1. Go to Vercel Project → Settings → Domains
2. Add `heritageguiding.com`
3. Add `www.heritageguiding.com`
4. Vercel provides DNS configuration
5. Update DNS records at registrar
6. Wait for propagation (1-48 hours)
7. Vercel automatically provisions SSL

**Redirect Strategy:**
```
heritageguiding.se     → heritageguiding.com
www.heritageguiding.com → heritageguiding.com
```

### EMAIL DNS (for Resend)

```
Type    Name              Value
──────────────────────────────────────────────────
CNAME   resend._domainkey resend-value
TXT     @                 v=DMARC1; p=none
```

═══════════════════════════════════════════════════════════════════════
## 9. MONITORING & ANALYTICS
═══════════════════════════════════════════════════════════════════════

### PERFORMANCE MONITORING

**Vercel Analytics (Built-in):**
- Real User Monitoring (RUM)
- Core Web Vitals
- Page performance
- Edge function metrics

**Setup:** Automatic (no configuration)

### ERROR TRACKING

**Option 1: Sentry (Recommended)**
```bash
npm install @sentry/nextjs
```

**Option 2: Vercel Error Logging**
- Built-in error capture
- Function logs
- Real-time monitoring

### UPTIME MONITORING

**Tools:**
- UptimeRobot (free tier)
- Vercel Status (built-in)
- Better Uptime ($10/month)

**Setup:**
```
Monitor: heritageguiding.com
Check interval: 5 minutes
Alert: Email, SMS
```

### LOG AGGREGATION

**Vercel Logs:**
```bash
# View logs
vercel logs heritageguiding-platform

# Real-time logs
vercel logs --follow
```

**Alternative:** DataDog, LogRocket (optional, post-MVP)

═══════════════════════════════════════════════════════════════════════
## 10. SECURITY SETUP
═══════════════════════════════════════════════════════════════════════

### SSL/TLS

**Provider:** Vercel (automatic)
- Let's Encrypt SSL certificates
- Auto-renewal
- HTTPS enforcement
- TLS 1.3

### SECURITY HEADERS

**Next.js Config:**
```typescript
// next.config.ts
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  }
]

export default {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}
```

### RATE LIMITING

**Vercel Edge Middleware:**
```typescript
// middleware.ts
import { Ratelimit } from "@upstash/ratelimit"

const ratelimit = new Ratelimit({
  limiter: Ratelimit.slidingWindow(10, "10 s"),
})

export async function middleware(request: Request) {
  const ip = request.ip ?? "127.0.0.1"
  const { success } = await ratelimit.limit(ip)
  
  return success
    ? NextResponse.next()
    : NextResponse.json({ error: "Too many requests" }, { status: 429 })
}
```

### AUTHENTICATION

**Payload CMS Auth:**
- Built-in user management
- JWT tokens
- Password hashing (bcrypt)
- Role-based access control (RBAC)

### DATABASE SECURITY

- SSL/TLS connections
- Connection string encryption
- IP allowlisting (if using Supabase)
- Regular security patches

═══════════════════════════════════════════════════════════════════════
## 11. BACKUP STRATEGY
═══════════════════════════════════════════════════════════════════════

### DATABASE BACKUPS

**Automated (Supabase):**
- Daily: 7 days retention
- Weekly: 30 days retention
- Monthly: 90 days retention

**Manual Backups:**
```bash
#!/bin/bash
# scripts/backup.sh

# Create backup
pg_dump $DATABASE_URL > "backups/$(date +%Y%m%d).sql"

# Upload to S3 or cloud storage
aws s3 cp "backups/$(date +%Y%m%d).sql" s3://heritageguiding-backups/
```

**Schedule:** Weekly manual backups via cron

### CODE BACKUPS

**Git Repository:**
- Primary: GitHub
- Mirror: GitLab (optional redundancy)

### MEDIA BACKUPS

**Cloudinary:**
- Automatic redundancy
- Multi-region replication

**Backup Strategy:**
- Cloudinary primary
- S3 bucket mirror (optional)

### DISASTER RECOVERY PLAN

**RTO (Recovery Time Objective):** 4 hours
**RPO (Recovery Point Objective):** 24 hours

**Recovery Steps:**
1. Restore database from latest backup
2. Redeploy application from git
3. Restore media from Cloudinary
4. Update DNS if needed
5. Test functionality
6. Monitor for issues

═══════════════════════════════════════════════════════════════════════
## 12. DEVELOPMENT WORKFLOW
═══════════════════════════════════════════════════════════════════════

### DAILY WORKFLOW

```bash
# Start work
git checkout develop
git pull origin develop
git checkout -b feature/tour-detail-page

# Development
npm run dev                    # Start dev server (localhost:3000)
# ... make changes ...
npm run type-check             # Check TypeScript
npm run lint                   # Check linting
git add .
git commit -m "feat: add tour detail page"
git push origin feature/tour-detail-page

# Create PR on GitHub
# Request review
# Merge after approval
```

### CODE REVIEW PROCESS

**PR Checklist:**
- [ ] Code compiles without errors
- [ ] TypeScript types are correct
- [ ] Linting passes
- [ ] Mobile responsive
- [ ] Accessibility tested
- [ ] i18n works (all 3 languages)
- [ ] No console.logs left
- [ ] Performance acceptable

### TESTING STRATEGY (MVP)

**Manual Testing:**
- Browser testing (Chrome, Firefox, Safari)
- Mobile testing (iOS, Android)
- Accessibility audit (Lighthouse)

**Post-MVP (Optional):**
- Unit tests: Vitest
- E2E tests: Playwright
- Component tests: Testing Library

### HOTFIX PROCESS

```bash
# Critical bug in production
git checkout main
git checkout -b hotfix/booking-bug
# ... fix bug ...
git commit -m "fix: resolve booking calculation error"
git push origin hotfix/booking-bug

# Create PR to main
# Fast-track review
# Deploy immediately
```

═══════════════════════════════════════════════════════════════════════
## MONTHLY COST BREAKDOWN
═══════════════════════════════════════════════════════════════════════

```
Service                      Cost/Month
────────────────────────────────────────────
Vercel Pro                   $20
Supabase Pro                 $25
Cloudinary Plus              $89 (or Vercel Blob $10)
Resend Pro                   $20
Domain (.com + .se)          $3
Email (Google Workspace)     $6
──────────────────────────────────────────── 
TOTAL (with Cloudinary):     $163/month
TOTAL (with Vercel Blob):    $84/month

Optional:
- Sentry Developer           $26/month
- Better Uptime              $10/month
```

**Recommended for MVP:** ~$84-110/month (using Vercel Blob)

═══════════════════════════════════════════════════════════════════════
## SETUP TIMELINE
═══════════════════════════════════════════════════════════════════════

**Week 0 (Pre-Development):**
- Day 1: Create GitHub repository
- Day 2: Register domains (HeritageGuiding.com/.se)
- Day 3: Set up Vercel account, connect repo
- Day 4: Create Supabase database
- Day 5: Configure environment variables
- Day 6: Set up Rezdy account + API access
- Day 7: Configure email (Resend)

**Week 1 (Phase 1 - Foundation):**
- Initialize Next.js + Payload CMS project
- Configure database connection
- Set up development environment
- Test all integrations
- Deploy to staging for first time

═══════════════════════════════════════════════════════════════════════
## CHECKLIST: INFRASTRUCTURE SETUP
═══════════════════════════════════════════════════════════════════════

### Pre-Development Setup
- [ ] GitHub repository created (private)
- [ ] HeritageGuiding.com registered
- [ ] HeritageGuiding.se registered
- [ ] Vercel account created
- [ ] Vercel connected to GitHub repo
- [ ] Supabase database created
- [ ] Database connection tested
- [ ] Rezdy account created
- [ ] Rezdy API access granted
- [ ] Resend account created
- [ ] Email DNS configured
- [ ] Environment variables documented
- [ ] Team access granted (partner)

### Week 1 Setup
- [ ] Repository structure created
- [ ] Next.js 15 initialized
- [ ] Payload CMS installed
- [ ] Database migrations run
- [ ] Development server working
- [ ] Type checking working
- [ ] Linting configured
- [ ] Git hooks (Husky) configured
- [ ] CI/CD pipeline working
- [ ] Staging environment deployed
- [ ] Domain pointed to Vercel
- [ ] SSL certificate active

### Post-Launch Setup
- [ ] Production deployment successful
- [ ] Database backups verified
- [ ] Monitoring alerts configured
- [ ] Error tracking active
- [ ] Analytics tracking verified
- [ ] Performance baseline established
- [ ] Security audit completed

═══════════════════════════════════════════════════════════════════════
## NEXT STEPS
═══════════════════════════════════════════════════════════════════════

1. **Review this document with your partner**
   - Align on infrastructure choices
   - Confirm budget ($80-110/month)
   - Assign responsibilities

2. **Create accounts (Week before development)**
   - GitHub organization (if needed)
   - Vercel
   - Supabase
   - Resend
   - Domain registrars

3. **Set up repository (Day 1 of development)**
   - Initialize monorepo
   - Configure tooling
   - Document setup process

4. **Begin Phase 1 development**
   - Follow MVP Project Plan
   - Test infrastructure as you build
   - Keep this document updated

═══════════════════════════════════════════════════════════════════════

**Questions? Issues during setup?**
- Document blockers immediately
- Slack/email for quick resolution
- Update this document with solutions

Good luck with your infrastructure setup! 🚀
