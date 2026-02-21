# Phase 05: SEO & Domain Migration

## Context Links
- [Plan Overview](./plan.md)
- [Research: SEO Migration Best Practices](../reports/)

## Overview
- **Date:** 2026-02-17
- **Description:** Configure 301 redirects from old domain, update sitemap/robots, setup new domain on Vercel
- **Priority:** P1
- **Status:** Code Complete (deployment steps pending)
- **Review Status:** Code verified, tests passing

## Key Insights
- 301 redirects preserve ~95-99% of PageRank (Google confirmed)
- Must maintain redirects for minimum 180 days (1 year recommended)
- `next.config.ts` redirects with `has: [{ type: 'host' }]` pattern handles old-domain traffic
- Google Search Console "Change of Address" tool accelerates reindexing
- Vercel supports .se TLD with auto SSL via Let's Encrypt
- Keep old domain (heritageguiding.com) in Vercel project for redirect handling

## Requirements

### Functional
- All heritageguiding.com URLs 301-redirect to equivalent privatetours.se URLs
- New sitemap.xml references privatetours.se URLs
- robots.txt points to new sitemap
- Canonical URLs use privatetours.se
- hreflang tags use new domain
- Schema.org URLs use new domain (covered in Phase 01)

### Non-Functional
- Redirect latency <100ms (Vercel edge handles this)
- No duplicate content (old + new URLs both indexable)
- SSL certificate active on privatetours.se before go-live

## Architecture

### Redirect Strategy
```
heritageguiding.com/* -> 308 -> privatetours.se/*  (permanent, preserves method)
www.heritageguiding.com/* -> 308 -> privatetours.se/*
staging.heritageguiding.com/* -> 308 -> staging.privatetours.se/*
```

### next.config.ts Redirect Config
```typescript
async redirects() {
  return [
    {
      source: '/:path*',
      has: [{ type: 'host', value: 'heritageguiding.com' }],
      destination: 'https://privatetours.se/:path*',
      permanent: true,
    },
    {
      source: '/:path*',
      has: [{ type: 'host', value: 'www.heritageguiding.com' }],
      destination: 'https://privatetours.se/:path*',
      permanent: true,
    },
  ];
}
```

## Related Code Files

1. `apps/web/next.config.ts` -- redirect rules
2. `apps/web/app/sitemap.ts` -- sitemap generation (already updated in Phase 01)
3. `apps/web/app/robots.ts` -- robots.txt (already updated in Phase 01)
4. `apps/web/app/[locale]/layout.tsx` -- canonical URLs, hreflang (already updated in Phase 01)
5. `.env.example` -- NEXT_PUBLIC_URL documentation

## Implementation Steps

### Step 1: Add Domain Redirects to next.config.ts
In `apps/web/next.config.ts`, add `redirects()` function:

```typescript
async redirects() {
  return [
    // Old domain -> new domain (keep for 1+ year)
    {
      source: '/:path*',
      has: [{ type: 'host', value: 'heritageguiding.com' }],
      destination: 'https://privatetours.se/:path*',
      permanent: true, // 308
    },
    {
      source: '/:path*',
      has: [{ type: 'host', value: 'www.heritageguiding.com' }],
      destination: 'https://privatetours.se/:path*',
      permanent: true,
    },
    {
      source: '/:path*',
      has: [{ type: 'host', value: 'staging.heritageguiding.com' }],
      destination: 'https://staging.privatetours.se/:path*',
      permanent: true,
    },
  ];
},
```

### Step 2: Update .env.example
- Find: `NEXT_PUBLIC_URL=https://heritageguiding.com` -> Replace: `NEXT_PUBLIC_URL=https://privatetours.se`

### Step 3: Verify sitemap.ts Output
Confirm sitemap generates URLs with `privatetours.se` domain (should be done in Phase 01).

### Step 4: Verify robots.ts Output
Confirm robots.txt Sitemap line points to `https://privatetours.se/sitemap.xml`.

### Step 5: Verify Canonical URLs
Check layout.tsx generates `<link rel="canonical">` with new domain.

### Step 6: Build and Test Redirects Locally
```bash
npm run build
npm run start
# Test with curl:
# curl -I -H "Host: heritageguiding.com" http://localhost:3000/en/tours
# Should return 308 with Location: https://privatetours.se/en/tours
```

## Deployment Steps (Post-Code / DevOps)

### DNS Configuration
1. Register `privatetours.se` domain (if not done)
2. Point DNS to Vercel: `A` record -> `76.76.21.21`, `CNAME www` -> `cname.vercel-dns.com`
3. Add `staging.privatetours.se` CNAME -> `cname.vercel-dns.com`
4. Set low TTL (300s) during migration, increase to 3600s after stable

### Vercel Configuration
1. Add `privatetours.se` as custom domain in Vercel project settings
2. Add `www.privatetours.se` as redirect to `privatetours.se`
3. Keep `heritageguiding.com` domain in project (for redirect handling)
4. Keep `www.heritageguiding.com` domain in project
5. Verify SSL certificate issued for new domain

### Environment Variables
Update in Vercel dashboard:
- `NEXT_PUBLIC_URL` = `https://privatetours.se`
- `NEXT_PUBLIC_STAGING_URL` = `https://staging.privatetours.se` (if exists)

### Email / MX Records
1. Configure MX records for `privatetours.se` (same provider as before)
2. Setup email aliases: info@, bookings@, privacy@, admin@
3. Test email delivery to all addresses

### Google Search Console
1. Add `privatetours.se` as new property
2. Submit new sitemap: `https://privatetours.se/sitemap.xml`
3. Use "Change of Address" tool on old property (heritageguiding.com)
4. Monitor indexing for 2-4 weeks

### Social Media
1. Update Facebook page URL/username
2. Update Instagram handle
3. Update LinkedIn page URL
4. Update any link-in-bio services

## Todo List
- [x] Add redirect rules to next.config.ts
- [x] Update .env.example
- [x] Verify sitemap generates new domain URLs (done in Phase 01)
- [x] Verify robots.txt points to new sitemap (done in Phase 01)
- [x] Verify canonical URLs use new domain (done in Phase 01)
- [x] Build and test locally (1009 tests pass)
- [ ] DNS: Register privatetours.se and configure records
- [ ] Vercel: Add new domain, keep old for redirects
- [ ] Update env vars in Vercel dashboard
- [ ] Configure email MX records
- [ ] Google Search Console: Add property + Change of Address
- [ ] Update social media handles/URLs
- [ ] Monitor search rankings for 30 days post-launch

## Success Criteria
- `curl -I https://heritageguiding.com/en/tours` returns `308` with `Location: https://privatetours.se/en/tours`
- `https://privatetours.se/sitemap.xml` returns valid sitemap with new URLs
- SSL certificate active on privatetours.se (green padlock)
- Google Search Console shows new property with pages indexed
- No 404s on high-traffic pages (monitor via Vercel analytics)

## Risk Assessment
- **High risk:** DNS propagation delay (mitigate with low TTL)
- **Medium risk:** Google ranking drop during transition (mitigate with 301s + Search Console)
- **Low risk:** Email delivery issues (test before going live)
- **Mitigation:** Do DNS cutover during low-traffic hours; keep old domain active indefinitely

## Security Considerations
- SSL must be active on new domain before any traffic
- Old domain must continue to serve redirects (not expire)
- Email SPF/DKIM/DMARC records must be configured for new domain
- Do not let old domain registration lapse (domain squatting risk)

## Next Steps
- Phase 06: Documentation Update
- Monitor SEO metrics weekly for first month
- Remove redirect rules after 1 year (optional; low cost to keep)
