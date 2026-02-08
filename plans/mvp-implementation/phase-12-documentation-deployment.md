# Phase 12: Documentation + Deployment

## Context Links

- [MVP Project Plan](../../docs/MVP-PROJECT-PLAN.md)
- [Infrastructure Setup](../../docs/INFRASTRUCTURE-SETUP-COMPLETE.md)
- [Vercel Deployment Docs](https://vercel.com/docs/deployments)

## Overview

| Priority | Status | Effort |
|----------|--------|--------|
| P1 - Critical | pending | 16-22h |

Create CMS user guide, technical documentation, and deployment procedures. Deploy to production with proper DNS, SSL, monitoring, and launch checklist.

## Key Insights

- CMS user guide for non-technical users (tour content management)
- Technical docs for future developers
- Vercel handles SSL, CDN, auto-scaling
- Monitor with Vercel Analytics + Sentry (optional)
- Post-launch stabilization period (3 months)

## Requirements

### Documentation
- CMS user guide (create/edit tours, manage translations)
- Technical documentation (architecture, API, deployment)
- Environment variables documentation
- Deployment procedures (staging, production)
- Troubleshooting guide

### Deployment
- Production deployment on Vercel
- DNS configuration (heritageguiding.com)
- SSL certificate verified
- Monitoring configured
- Launch checklist completed

## Architecture

### Documentation Structure

```
docs/
├── user-guide/
│   ├── cms-overview.md
│   ├── managing-tours.md
│   ├── managing-translations.md
│   └── media-management.md
├── technical/
│   ├── architecture.md
│   ├── api-reference.md
│   ├── deployment.md
│   └── troubleshooting.md
└── README.md (project overview)
```

### Deployment Pipeline

```
Development (local)
       ↓
Push to develop branch
       ↓
CI tests pass
       ↓
Merge to staging
       ↓
Auto-deploy to staging.heritageguiding.com
       ↓
QA testing
       ↓
Merge to main
       ↓
Auto-deploy to heritageguiding.com
       ↓
🚀 LIVE
```

## Related Code Files

### Create
- `docs/user-guide/cms-overview.md` - CMS introduction
- `docs/user-guide/managing-tours.md` - Tour CRUD guide
- `docs/user-guide/managing-translations.md` - i18n guide
- `docs/user-guide/media-management.md` - Image uploads
- `docs/technical/architecture.md` - System design
- `docs/technical/api-reference.md` - API endpoints
- `docs/technical/deployment.md` - Deploy procedures
- `docs/technical/troubleshooting.md` - Common issues
- `DEPLOYMENT_CHECKLIST.md` - Launch checklist

### Modify
- `README.md` - Update with project overview
- `.env.example` - Document all variables

## Implementation Steps

### Part 1: Documentation

1. **Create CMS Overview**
   ```markdown
   # HeritageGuiding CMS User Guide

   ## Accessing the CMS

   1. Navigate to https://heritageguiding.com/admin
   2. Log in with your admin credentials
   3. You'll see the main dashboard with content types

   ## Dashboard Overview

   | Section | Description |
   |---------|-------------|
   | Tours | Manage tour listings |
   | Guides | Manage guide profiles |
   | Categories | Theme and neighborhood tags |
   | Reviews | Customer reviews |
   | Media | Images and files |

   ## User Roles

   - **Admin**: Full access to all content
   - **Editor**: Can create/edit content, cannot delete

   ## Getting Help

   Contact your technical team for issues.
   ```

2. **Create Managing Tours Guide**
   ```markdown
   # Managing Tours

   ## Creating a New Tour

   1. Click **Tours** in the sidebar
   2. Click **Create New** button
   3. Fill in required fields:
      - **Title** (required): Tour name
      - **Slug**: Auto-generated from title
      - **Description**: Full tour description
      - **Emotional Description**: Storytelling version
      - **Price**: In SEK
      - **Duration**: In minutes
      - **Guide**: Select from dropdown
      - **Categories**: Select themes/areas

   ## Adding Multiple Languages

   1. Look for the **language tabs** (SV | EN | DE)
   2. Click each tab to enter translated content
   3. Fields with globe icon support translations

   ## Managing the Gallery

   1. Scroll to **Gallery** section
   2. Click **Add Image**
   3. Upload or select from Media Library
   4. Add Alt Text (important for accessibility)
   5. Add optional Caption

   ## Publishing

   1. Set **Status** to "Published"
   2. Click **Save** button
   3. Tour is now live on the website

   ## Tips

   - Preview before publishing
   - Add high-quality images (min 1200px wide)
   - Fill in SEO fields for better search ranking
   - Mark accessibility features if applicable
   ```

3. **Create Technical Architecture Doc**
   ```markdown
   # Technical Architecture

   ## Overview

   HeritageGuiding is built on a modern JAMstack architecture.

   ## Technology Stack

   | Layer | Technology |
   |-------|------------|
   | Frontend | Next.js 16, React 19, TypeScript |
   | CMS | Payload CMS 3.75 (embedded) |
   | Database | PostgreSQL 15 (Supabase) |
   | Styling | Tailwind CSS, shadcn/ui |
   | Hosting | Vercel |
   | Booking | Rezdy API |
   | Email | Resend |

   ## Architecture Diagram

   ```
   [Browser] → [Vercel Edge] → [Next.js App]
                                    │
                    ┌───────────────┼───────────────┐
                    ↓               ↓               ↓
               [Payload CMS]  [Rezdy API]    [Resend]
                    │
                    ↓
              [PostgreSQL]
   ```

   ## Key Directories

   ```
   /apps/web/app        - Next.js pages
   /apps/web/components - React components
   /packages/cms        - Payload configuration
   /packages/ui         - Shared UI components
   ```

   ## Data Flow

   1. User requests page
   2. Next.js fetches from Payload
   3. Payload queries PostgreSQL
   4. Server renders HTML
   5. Client hydrates for interactivity

   ## Caching Strategy

   - Static pages: Revalidate every 5 minutes
   - API responses: 15-minute cache
   - Images: 1-year CDN cache
   ```

4. **Create Deployment Guide**
   ```markdown
   # Deployment Guide

   ## Prerequisites

   - Vercel account connected to GitHub
   - Supabase database running
   - Environment variables configured
   - Domain DNS pointing to Vercel

   ## Environment Variables

   Required in Vercel dashboard:

   ```
   DATABASE_URL=postgresql://...
   PAYLOAD_SECRET=your-32-char-secret
   REZDY_API_KEY=your-rezdy-key
   RESEND_API_KEY=re_...
   NEXT_PUBLIC_URL=https://heritageguiding.com
   ```

   ## Deploying to Staging

   1. Push changes to `staging` branch
   2. Vercel auto-deploys to staging.heritageguiding.com
   3. Test all functionality
   4. Check for console errors

   ## Deploying to Production

   1. Create PR from `staging` to `main`
   2. Review changes
   3. Merge PR
   4. Vercel auto-deploys to heritageguiding.com
   5. Monitor for errors

   ## Rolling Back

   1. Go to Vercel dashboard
   2. Select the project
   3. Go to Deployments tab
   4. Find previous working deployment
   5. Click "..." → "Promote to Production"

   ## Database Migrations

   1. Test migrations locally first
   2. Run `npm run db:migrate` on staging
   3. Verify no data loss
   4. Apply to production

   ## Troubleshooting

   ### Build Fails

   - Check build logs in Vercel
   - Run `npm run build` locally
   - Verify all env vars are set

   ### Database Connection Error

   - Check DATABASE_URL is correct
   - Verify IP allowlist in Supabase
   - Check connection pooling settings
   ```

5. **Create Troubleshooting Guide**
   ```markdown
   # Troubleshooting Guide

   ## Common Issues

   ### "500 Internal Server Error"

   **Cause**: Usually database or API error

   **Solution**:
   1. Check Vercel function logs
   2. Verify DATABASE_URL is correct
   3. Check Supabase status

   ### "Tours not loading"

   **Cause**: Payload query or cache issue

   **Solution**:
   1. Clear Next.js cache: Redeploy
   2. Check Payload admin for data
   3. Verify tour status is "published"

   ### "Images not displaying"

   **Cause**: Media URL or CORS issue

   **Solution**:
   1. Check image URL in Payload
   2. Verify Cloudinary/Vercel Blob config
   3. Check next.config.ts image domains

   ### "Booking not working"

   **Cause**: Rezdy API issue

   **Solution**:
   1. Check REZDY_API_KEY is valid
   2. Verify tour has rezdyProductCode
   3. Check Rezdy dashboard for issues

   ### "Emails not sending"

   **Cause**: Resend configuration

   **Solution**:
   1. Check RESEND_API_KEY
   2. Verify sender domain in Resend
   3. Check spam folder

   ## Getting Help

   1. Check Vercel logs first
   2. Search error message
   3. Contact technical team
   ```

### Part 2: Deployment

6. **Create Launch Checklist**
   ```markdown
   # Launch Checklist

   ## Pre-Launch (1 Week Before)

   - [ ] All features complete and tested
   - [ ] Content populated (min 5 tours)
   - [ ] Translations complete (SV/EN/DE)
   - [ ] Images optimized and uploaded
   - [ ] Rezdy products linked
   - [ ] Email templates tested

   ## Infrastructure

   - [ ] Vercel production environment ready
   - [ ] Supabase production database created
   - [ ] All env vars set in Vercel
   - [ ] Domain DNS configured
   - [ ] SSL certificate active

   ## Testing

   - [ ] All pages load correctly
   - [ ] Booking flow works end-to-end
   - [ ] Group inquiry form works
   - [ ] Language switching works
   - [ ] Mobile responsive
   - [ ] Accessibility audit passed
   - [ ] Performance audit passed (Lighthouse 90+)

   ## SEO

   - [ ] Sitemap accessible (/sitemap.xml)
   - [ ] robots.txt correct
   - [ ] Schema.org validates
   - [ ] hreflang tags present
   - [ ] Google Search Console configured
   - [ ] Google Analytics set up

   ## Monitoring

   - [ ] Vercel Analytics enabled
   - [ ] Error tracking configured (Sentry optional)
   - [ ] Uptime monitoring set up
   - [ ] Team notified of launch

   ## Go Live

   - [ ] Final content review
   - [ ] Final functionality check
   - [ ] Merge to main branch
   - [ ] Verify production deployment
   - [ ] Test live site
   - [ ] Announce launch

   ## Post-Launch

   - [ ] Monitor for errors (24 hours)
   - [ ] Check analytics data
   - [ ] Respond to user feedback
   - [ ] Fix any critical bugs
   ```

7. **Configure Vercel Production**
   ```bash
   # Verify Vercel project settings
   vercel link

   # Set production env vars
   vercel env add DATABASE_URL production
   vercel env add PAYLOAD_SECRET production
   vercel env add REZDY_API_KEY production
   vercel env add RESEND_API_KEY production
   vercel env add NEXT_PUBLIC_URL production

   # Deploy to production
   vercel --prod
   ```

8. **Configure DNS**
   ```
   # DNS Records for heritageguiding.com

   Type    Name    Value                    TTL
   ─────────────────────────────────────────────────
   A       @       76.76.21.21              300
   CNAME   www     cname.vercel-dns.com     300

   # Verify in Vercel dashboard:
   # Project Settings → Domains → Add Domain
   ```

9. **Set Up Monitoring**
   ```typescript
   // Vercel Analytics (automatic with Vercel)
   // Add to layout if using @vercel/analytics
   import { Analytics } from '@vercel/analytics/react'

   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           {children}
           <Analytics />
         </body>
       </html>
     )
   }
   ```

10. **Configure Error Tracking (Optional)**
    ```bash
    npm install @sentry/nextjs
    npx @sentry/wizard@latest -i nextjs
    ```

    ```typescript
    // sentry.client.config.ts
    import * as Sentry from '@sentry/nextjs'

    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1
    })
    ```

11. **Update README**
    ```markdown
    # HeritageGuiding Platform

    AI-first tourism booking platform for Stockholm tours.

    ## Quick Start

    ```bash
    npm install
    cp .env.example .env.local
    npm run dev
    ```

    ## Documentation

    - [CMS User Guide](./docs/user-guide/cms-overview.md)
    - [Technical Architecture](./docs/technical/architecture.md)
    - [Deployment Guide](./docs/technical/deployment.md)

    ## Tech Stack

    - Next.js 16 + React 19
    - Payload CMS 3.75
    - PostgreSQL (Supabase)
    - Tailwind CSS + shadcn/ui
    - Rezdy API

    ## Scripts

    | Command | Description |
    |---------|-------------|
    | `npm run dev` | Start development server |
    | `npm run build` | Build for production |
    | `npm run start` | Start production server |
    | `npm run lint` | Run ESLint |
    | `npm run type-check` | TypeScript check |
    | `npm run db:migrate` | Run migrations |

    ## Contributing

    1. Create feature branch
    2. Make changes
    3. Run tests
    4. Create PR to develop

    ## License

    Private - All rights reserved
    ```

## Todo List

### Documentation
- [ ] Create CMS overview guide
- [ ] Create managing tours guide
- [ ] Create managing translations guide
- [ ] Create media management guide
- [ ] Create technical architecture doc
- [ ] Create API reference
- [ ] Create deployment guide
- [ ] Create troubleshooting guide
- [ ] Update README with project overview
- [ ] Document all environment variables

### Deployment
- [ ] Verify Vercel production setup
- [ ] Configure all environment variables
- [ ] Set up DNS for heritageguiding.com
- [ ] Verify SSL certificate
- [ ] Enable Vercel Analytics
- [ ] Set up error tracking (optional)
- [ ] Complete launch checklist
- [ ] Deploy to production
- [ ] Verify live site functionality
- [ ] Monitor for 24 hours post-launch

## Success Criteria

- [ ] CMS user guide complete and usable
- [ ] Technical docs cover all key areas
- [ ] README provides quick start
- [ ] Production deployed and accessible
- [ ] SSL certificate valid
- [ ] No critical errors in first 24 hours
- [ ] Monitoring active
- [ ] Team knows how to deploy

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| DNS propagation delay | Medium | Low | Set low TTL, plan 24h buffer |
| Production env vars missing | Medium | High | Checklist verification |
| Database migration issues | Low | High | Test on staging first |

## Security Considerations

- Never commit production env vars
- Restrict CMS admin access
- Enable 2FA for Vercel/Supabase
- Regular security updates

## Next Steps

After completion:
1. **MVP LAUNCH COMPLETE**
2. Enter 3-month stabilization period
3. Monitor and fix bugs
4. Collect user feedback
5. Plan post-MVP features
