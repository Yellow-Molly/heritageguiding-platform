# HeritageGuiding MVP - Infrastructure Setup

Complete technical infrastructure plan for the platform.

**Last Updated:** February 8, 2026

---

## Table of Contents

1. Repository Strategy
2. Development Environment
3. Hosting & Infrastructure
4. Database Setup
5. Third-Party Services
6. Security Setup
7. Backup Strategy
8. Monthly Cost Breakdown

---

## 1. Repository Strategy

### Monorepo Approach (Recommended)

**Total Repositories: 1**

```
heritageguiding-platform/
├── apps/
│   └── web/                    # Next.js 15 frontend
│       ├── app/                # App router pages
│       ├── components/         # React components
│       ├── lib/                # Utilities, services
│       └── public/             # Static assets
├── packages/
│   ├── cms/                    # Payload CMS config
│   │   ├── collections/        # 10 data models
│   │   ├── access/             # Access control
│   │   ├── fields/             # 7 reusable field modules
│   │   └── payload.config.ts
│   ├── ui/                     # Shared UI components
│   └── types/                  # Shared TypeScript types
├── scripts/                    # Build & deployment
├── .github/                    # GitHub Actions
├── docs/                       # Documentation
└── plans/                      # Development phases
```

**Advantages:**
- Single source of truth
- Shared types between frontend and CMS
- Unified CI/CD pipeline
- Simpler dependency management
- Easier onboarding

### Branch Strategy

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

---

## 2. Development Environment

### Prerequisites

```bash
Node.js: v24+ (LTS)
npm: v10+
PostgreSQL: v15+ (with pgvector extension)
Git: v2.40+
```

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/heritageguiding-platform.git
cd heritageguiding-platform

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Set up database + run migrations
npm run db:setup

# Generate Payload types
npm run payload:generate-types

# Start development server
npm run dev
```

### Development Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server + Payload CMS |
| `npm run build` | Build for production |
| `npm run start` | Run production build |
| `npm run lint` | Check code quality |
| `npm run type-check` | Validate TypeScript |
| `npm test` | Run tests |
| `npm run payload` | Payload CLI |
| `npm run db:migrate` | Run migrations |

### Tech Stack Versions

```json
{
  "dependencies": {
    "next": "^16.1.6",
    "react": "^19.2.3",
    "@payloadcms/next": "^3.75.0",
    "@payloadcms/db-postgres": "^3.75.0",
    "next-intl": "^4.7.0",
    "tailwindcss": "^4.0.0",
    "zod": "^4.3.5",
    "exceljs": "^4.4.0"
  },
  "devDependencies": {
    "typescript": "^5.9.3",
    "vitest": "^4.0.17",
    "eslint": "^9.0.0"
  }
}
```

### IDE Configuration

**VS Code Extensions:**
- dbaeumer.vscode-eslint
- esbenp.prettier-vscode
- bradlc.vscode-tailwindcss
- ms-vscode.vscode-typescript-next
- lokalise.i18n-ally

---

## 3. Hosting & Infrastructure

### Frontend: Vercel

**Plan:** Pro ($20/month)

**Configuration:**
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "regions": ["fra1"]
}
```

**Deployment Environments:**
```
Production:  main branch     → heritageguiding.com
Staging:     staging branch  → staging.heritageguiding.com
Preview:     PR branches     → pr-123.heritageguiding.vercel.app
```

**Features:**
- Edge Functions (serverless)
- Image Optimization (automatic)
- Analytics & Web Vitals
- Automatic HTTPS & DDoS protection

### Database: Supabase

**Plan:** Pro ($25/month)

**Specifications:**
- PostgreSQL 15+ with pgvector extension
- 8GB RAM, 500GB bandwidth/month
- Daily backups, EU region (Stockholm)

**Required Extensions:**
```sql
CREATE EXTENSION IF NOT EXISTS vector;  -- Semantic search
```

### CMS: Integrated with Next.js

Payload CMS runs as part of the Next.js application:
```
app/
├── (payload)/
│   └── admin/[[...segments]]/page.tsx  # Admin UI
└── api/[...slug]/route.ts              # API routes
```

No separate hosting - reduces complexity and cost.

---

## 4. Database Setup

### Collections (Tables)

| Collection | Purpose |
|------------|---------|
| tours | Core tour catalog with embeddings |
| guides | Tour expert profiles |
| categories | Tour themes/activities |
| reviews | Customer testimonials |
| media | Images/videos with sizes |
| users | Admin authentication |
| pages | Static content |
| bookings | Bokun webhook data |
| cities | Geographic parent |
| neighborhoods | Geographic child |

### Migration Strategy

Payload handles migrations automatically:
```bash
npm run db:migrate:create  # Generate migration
npm run db:migrate         # Run migrations
npm run db:migrate:rollback # Rollback
```

### Connection Pooling

Use PgBouncer (included with Supabase):
```typescript
// payload.config.ts
db: postgresAdapter({
  pool: { connectionString: process.env.DATABASE_URL, max: 20 }
})
```

---

## 5. Third-Party Services

### Bokun (Booking System - Phase 08.1)

**Integration:** REST API with HMAC-SHA256 authentication

```bash
BOKUN_ACCESS_KEY=<your-access-key>
BOKUN_SECRET_KEY=<your-secret-key>
BOKUN_ENVIRONMENT=production|test
```

**Features:**
- HMAC-SHA256 auth for all requests
- Webhook signature verification
- 60-second availability caching
- Rate limiting: 400 req/min with backoff

### OpenAI + pgvector (Semantic Search)

**Vector Database:** pgvector extension
- Model: text-embedding-3-small (1536 dimensions)
- Similarity: cosine distance
- Auto-embedding on tour save

```bash
OPENAI_API_KEY=<your-openai-key>
```

### Media Storage: Vercel Blob

**Plan:** $10/month (recommended for MVP)

```bash
BLOB_READ_WRITE_TOKEN=<vercel-blob-token>
```

Features: Automatic WebP, responsive images, lazy loading

### Email: Resend

**Plan:** Pro ($20/month for 50k emails)

```bash
RESEND_API_KEY=re_your-api-key
EMAIL_FROM=bookings@heritageguiding.com
```

### Analytics

**Vercel Analytics:** Built-in Web Vitals, no config needed
**Google Analytics 4:** Optional, via NEXT_PUBLIC_GA_ID

---

## 6. Security Setup

### SSL/TLS

**Provider:** Vercel (automatic)
- Let's Encrypt certificates
- Auto-renewal, HTTPS enforcement
- TLS 1.3

### Security Headers

```typescript
// next.config.ts
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
]
```

### Rate Limiting

**Vercel Edge + Upstash:**
```typescript
// middleware.ts
const ratelimit = new Ratelimit({
  limiter: Ratelimit.slidingWindow(10, "10 s"),
})
```

### Authentication

**Payload CMS Auth:**
- Built-in user management
- JWT tokens, bcrypt passwords
- Role-based access control (admin/editor)

### Database Security

- SSL/TLS connections required
- Connection string encryption
- IP allowlisting (Supabase)

---

## 7. Backup Strategy

### Database Backups (Supabase)

**Automated:**
- Daily: 7 days retention
- Weekly: 30 days retention
- Point-in-time recovery (PITR)

**Manual:**
```bash
pg_dump $DATABASE_URL > backups/$(date +%Y%m%d).sql
```

### Code Backups

**Git Repository:** GitHub (primary)

### Disaster Recovery

- **RTO:** 4 hours
- **RPO:** 24 hours

**Steps:**
1. Restore database from backup
2. Redeploy from git
3. Restore media from Vercel Blob
4. Update DNS if needed
5. Test & monitor

---

## 8. Monthly Cost Breakdown

| Service | Cost/Month |
|---------|------------|
| Vercel Pro | $20 |
| Supabase Pro | $25 |
| Vercel Blob | $10 |
| Resend Pro | $20 |
| Domains (.com + .se) | $3 |
| **TOTAL** | **$78/month** |

**Optional:**
- Sentry Developer: $26/month
- Better Uptime: $10/month

---

## Related Documentation

- [Deployment Guide](./deployment-guide.md) - CI/CD, environment variables, DNS
- [System Architecture](./system-architecture.md) - Technical design
- [Code Standards](./code-standards.md) - Development guidelines
