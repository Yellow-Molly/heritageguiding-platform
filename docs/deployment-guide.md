# Private Tours - Deployment Guide

CI/CD pipeline, environment variables, domain configuration, and deployment workflows.

**Last Updated:** February 8, 2026

---

## Table of Contents

1. CI/CD Pipeline
2. Environment Variables
3. Domain & DNS Configuration
4. Monitoring & Analytics
5. Development Workflow
6. Setup Checklist

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

# Bokun Integration (Phase 08.1)
BOKUN_ACCESS_KEY=your-bokun-access-key
BOKUN_SECRET_KEY=your-bokun-secret-key
BOKUN_ENVIRONMENT=test

# OpenAI (Semantic Search)
OPENAI_API_KEY=sk-your-openai-key

# Media Storage (Vercel Blob)
BLOB_READ_WRITE_TOKEN=vercel_blob_token

# Email (Gmail SMTP via Nodemailer)
GMAIL_USER=bookings@privatetours.se
GMAIL_APP_PASSWORD=your-google-app-password
EMAIL_FROM=bookings@privatetours.se

# Analytics (optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

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
- BOKUN_SECRET_KEY
- OPENAI_API_KEY
- GMAIL_APP_PASSWORD

**Public Variables (NEXT_PUBLIC_*):**
- NEXT_PUBLIC_URL
- NEXT_PUBLIC_GA_ID

---

## 3. Domain & DNS Configuration

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

## 4. Monitoring & Analytics

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

## 5. Development Workflow

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

## 6. Setup Checklist

### Pre-Development

- [ ] GitHub repository created (private)
- [ ] privatetours.se registered
- [ ] Vercel account created
- [ ] Vercel connected to GitHub
- [ ] Supabase database created
- [ ] pgvector extension enabled
- [ ] Bokun API access granted
- [ ] OpenAI API key obtained
- [ ] Google Workspace Business account created
- [ ] Email DNS configured

### Week 1 Setup

- [ ] Repository structure created
- [ ] Next.js 16 initialized (Turbopack bundler)
- [ ] Payload CMS 3.75 installed
- [ ] Database migrations run
- [ ] Development server working
- [ ] Type checking working
- [ ] Linting configured
- [ ] CI/CD pipeline working
- [ ] Staging deployed
- [ ] Domain pointed to Vercel
- [ ] SSL certificate active

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
