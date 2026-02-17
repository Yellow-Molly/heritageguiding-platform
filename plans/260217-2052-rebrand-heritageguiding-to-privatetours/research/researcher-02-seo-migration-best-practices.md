# SEO & Domain Migration Best Practices Research

**Research Date**: 2026-02-17
**Domain Change**: heritageguiding.com → privatetours.se
**Stack**: Next.js 16, Payload CMS 3.75, Vercel

## 1. SEO Impact & Mitigation Strategy

### Google Search Console Process
- **Change of Address Tool**: Use GSC tool to notify Google of domain change; emphasizes crawling new site for 180 days
- **Timeline**: Medium sites take few weeks, larger sites longer; maintain redirects minimum 180 days (longer if traffic exists)
- **Pre-checks**: If passed, migration notification appears in GSC for 180 days
- **Sitemap**: Submit new XML sitemap to new domain in GSC for faster discovery

**Sources**: [Site Moves and Migrations](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes), [Change of Address tool](https://support.google.com/webmasters/answer/9370220?hl=en)

### 301 Redirect Strategy
- **Redirect Type**: Use 301 or 308 (Google treats both identically); Next.js defaults to 308 which is SEO-safe
- **PageRank**: 301/302/308 redirects don't cause PageRank loss
- **Redirect Chains**: Avoid chains; max 3-5 hops, ideally direct to final destination
- **Duration**: Keep redirects indefinitely or minimum 180 days

**Sources**: [Redirects and Google Search](https://developers.google.com/search/docs/crawling-indexing/301-redirects), [Next.js Redirects Guide](https://medium.com/@sureshdotariya/handling-redirects-in-next-js-without-breaking-seo-2f8c754bf586)

### Ranking Protection
- Various signals (authority, backlinks) forward from old → new site during 180-day GSC migration period
- Server-side redirects recognized by search engines (better than client-side)
- Maintain old domain redirects long-term to preserve SEO equity from external links

## 2. Next.js Implementation

### next.config.ts Redirects
```typescript
// next.config.ts - redirects run BEFORE middleware
async redirects() {
  return [
    {
      source: '/:path*',
      has: [{ type: 'host', value: 'heritageguiding.com' }],
      destination: 'https://privatetours.se/:path*',
      permanent: true, // 308 by default, SEO-safe
    },
    {
      source: '/:path*',
      has: [{ type: 'host', value: 'www.heritageguiding.com' }],
      destination: 'https://privatetours.se/:path*',
      permanent: true,
    },
  ]
}
```

**Key Points**:
- Redirects in next.config.ts execute before middleware
- Server-side redirects preferred for SEO
- Default 308 status code (permanent) treated same as 301 by Google
- Use `statusCode: 301` if needed for legacy compatibility

**Sources**: [Next.js redirects docs](https://nextjs.org/docs/app/api-reference/config/next-config-js/redirects), [Permanent Redirect Guide](https://robertmarshall.dev/blog/how-to-permanently-redirect-301-308-with-next-js/)

### Middleware Considerations
- Middleware runs AFTER next.config.ts redirects
- Can modify request/response headers for domain-specific logic
- Use for conditional behavior (A/B testing, geo-routing) not primary redirects
- File location: `middleware.ts` in project root

**Sources**: [Next.js Redirecting Guides](https://nextjs.org/docs/app/guides/redirecting)

### Environment Variables
Update all instances:
```bash
NEXT_PUBLIC_URL=https://privatetours.se
NEXT_PUBLIC_SITE_URL=https://privatetours.se
# Update in .env, .env.production, Vercel dashboard
```

Check references in:
- sitemap.xml generation
- robots.txt generation
- canonical URLs
- Open Graph tags
- API endpoint URLs

### Schema.org/JSON-LD Updates
- **URL References**: Update all `@id`, `url`, `sameAs` properties to new domain
- **Organization Schema**: Change `url` field to privatetours.se
- **BreadcrumbList**: Update item URLs
- **Context Stability**: Schema.org context uses http/https interchangeably; both accepted
- **Testing**: Validate with Google Rich Results Test after migration

**Sources**: [Schema.org developers](https://schema.org/docs/developers.html), [JSON-LD Best Practices](https://w3c.github.io/json-ld-bp/)

## 3. Payload CMS Considerations

### Configuration Updates
Check `payload.config.ts`:
```typescript
serverURL: process.env.NEXT_PUBLIC_URL || 'https://privatetours.se'
```

### Media URL References
- **Upload Collections**: Payload stores media with relative paths by default
- **Absolute URLs**: If using `staticURL` config, update to new domain
- **S3/Cloud Storage**: If media stored externally, URLs unaffected
- **Database Migration**: Run SQL query to update any hardcoded domain references:
  ```sql
  UPDATE media SET url = REPLACE(url, 'heritageguiding.com', 'privatetours.se');
  ```

### Database References
- **Collection Data**: Check for hardcoded URLs in rich text fields, external links
- **Migration Script**: Create Payload migration to update domain references:
  ```typescript
  // migrations/update-domain-refs.ts
  import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-mongodb'

  export async function up({ payload }: MigrateUpArgs): Promise<void> {
    // Update collections with domain references
  }
  ```

**Sources**: [Payload Migrations](https://payloadcms.com/docs/database/migrations), [Payload Config](https://payloadcms.com/docs/configuration/overview)

## 4. DNS & Deployment

### Vercel Domain Setup (.se TLD)
1. **Add Domain**: Dashboard → Project → Settings → Domains → Add "privatetours.se"
2. **Apex + WWW**: Vercel prompts to add www subdomain; configure redirect preference
3. **DNS Records**: Configure with registrar:
   - A record: Point to Vercel IP (provided in dashboard)
   - CNAME (www): Point to cname.vercel-dns.com
4. **Verification**: Domain validates once DNS propagates

**Sources**: [Adding a Custom Domain](https://vercel.com/docs/domains/working-with-domains/add-a-domain), [Working with domains](https://vercel.com/docs/domains/working-with-domains)

### SSL Certificate (Automatic)
- **Auto-Generation**: Vercel auto-generates Let's Encrypt cert once DNS propagates
- **Challenge Method**: HTTP-01 for non-wildcard domains
- **CAA Records**: If existing CAA records, add: `0 issue "letsencrypt.org"`
- **Timeline**: Certificate generation starts after DNS validation; usually < 24hrs
- **Renewal**: Auto-renewed by Vercel

**Sources**: [Working with SSL](https://vercel.com/docs/domains/working-with-ssl), [Automatic SSL](https://vercel.com/blog/automatic-ssl-with-vercel-lets-encrypt)

### Old Domain Redirect Config
1. **Keep Old Domain Active**: Don't delete heritageguiding.com from Vercel
2. **Add to Project**: Add old domain to same Vercel project
3. **Domain Redirect Setting**: Vercel dashboard → Domain settings → Redirect to privatetours.se
4. **Alternative**: Use next.config.ts redirects (preferred for control)
5. **Duration**: Maintain indefinitely or min 180 days

## Migration Checklist

### Pre-Migration
- [ ] Add privatetours.se to Vercel, verify SSL
- [ ] Set up next.config.ts redirects
- [ ] Update all env variables (local + Vercel)
- [ ] Audit codebase for hardcoded URLs
- [ ] Update schema.org/JSON-LD markup
- [ ] Prepare Payload migration scripts

### During Migration
- [ ] Deploy updated code with redirects
- [ ] Verify old domain redirects working (test all major paths)
- [ ] Submit new sitemap to GSC for privatetours.se
- [ ] Use GSC Change of Address tool
- [ ] Monitor error logs for broken references

### Post-Migration (0-30 days)
- [ ] Monitor GSC for crawl errors
- [ ] Check redirect coverage in server logs
- [ ] Verify structured data with Google Rich Results Test
- [ ] Update external profiles (social media, directories)
- [ ] Monitor rankings and traffic patterns

### Post-Migration (30-180 days)
- [ ] Continue monitoring redirects for traffic
- [ ] Track ranking recovery in GSC
- [ ] Maintain redirects minimum 180 days
- [ ] Update backlinks where possible

## Unresolved Questions
1. Does Payload CMS have any internal references to domain in database schema/migrations?
2. Are there any third-party integrations (analytics, CDN) that need domain updates?
3. Is there existing backlink profile analysis for heritageguiding.com to prioritize redirect coverage?
4. Should we implement redirect monitoring/analytics to track old domain traffic?
