# Codebase Audit: "HeritageGuiding" String Occurrences

**Date:** 2026-02-17
**Scope:** C:\Data\Project\DMC\source\heritageguiding-platform
**Variants Found:** "heritageguiding", "HeritageGuiding", "heritageguiding.com"
**Variants NOT Found:** "heritage-guiding", "heritage_guiding"

---

## 1. Source Code Files (.ts, .tsx, .js)

### Email Templates
- `apps/web/lib/email/send-inquiry-notification-to-admin.ts:21` - From field: `HeritageGuiding <${process.env.GMAIL_USER}>`
- `apps/web/lib/email/send-inquiry-confirmation-to-customer.ts:16` - From field: `HeritageGuiding <${process.env.GMAIL_USER}>`
- `apps/web/lib/email/send-inquiry-confirmation-to-customer.ts:23` - Signature: "HeritageGuiding Team"

### SEO/Metadata
- `apps/web/lib/seo.ts:21` - Default URL: `https://heritageguiding.com`
- `apps/web/lib/seo.ts:113` - Base URL: `https://heritageguiding.com`
- `apps/web/lib/seo.ts:125` - OpenGraph siteName: `HeritageGuiding`

### API/Data
- `apps/web/lib/api/index.ts:2` - Comment: "API data fetching functions for HeritageGuiding"
- `apps/web/lib/api/get-tour-by-slug.ts:225` - Meeting point: "Guide will have a HeritageGuiding sign"
- `apps/web/lib/api/get-tour-by-slug.ts:317` - Meeting point: "Guide wears a HeritageGuiding badge"

### Components
- `apps/web/components/tour/tour-schema.tsx:88` - Organization name: `HeritageGuiding`
- `apps/web/components/tour/booking-section.tsx:84` - Email href: `info@heritageguiding.com`
- `apps/web/components/layout/header.tsx:80` - Image alt: `HeritageGuiding`
- `apps/web/components/layout/footer.tsx:91,165` - Brand name display
- `apps/web/components/layout/footer.tsx:112-113` - Contact email: `info@heritageguiding.com`
- `apps/web/components/pages/values-section.tsx:29` - Comment: "what makes HeritageGuiding different"

### Structured Data/Schema
- `apps/web/components/seo/travel-agency-schema.tsx:29,112,118,144` - Organization name: `HeritageGuiding`
- `apps/web/components/seo/travel-agency-schema.tsx:32,113,119,145` - URL: `https://heritageguiding.com`
- `apps/web/components/seo/travel-agency-schema.tsx:34,114` - Email: `info@heritageguiding.com`
- `apps/web/components/seo/travel-agency-schema.tsx:47-49` - Social media: facebook.com/heritageguiding, instagram.com/heritageguiding, linkedin.com/company/heritageguiding
- `apps/web/components/seo/tour-list-schema.tsx:20` - Base URL: `https://heritageguiding.com`
- `apps/web/components/seo/guide-list-schema.tsx:21` - Base URL: `https://heritageguiding.com`
- `apps/web/components/seo/guide-detail-schema.tsx:26,54` - Base URL & worksFor name
- `apps/web/components/seo/about-schema.tsx:15,21,23,26,28` - Organization name & description

### App Routes/Pages
- `apps/web/app/(payload)/layout.tsx:11-12` - Page title & description
- `apps/web/app/globals.css:4` - Comment: "HeritageGuiding Design System"
- `apps/web/app/robots.ts:8` - Base URL: `https://heritageguiding.com`
- `apps/web/app/[locale]/layout.tsx:24,37` - Base URL & siteName
- `apps/web/app/[locale]/group-booking/page.tsx:30` - Base URL
- `apps/web/app/sitemap.ts:5` - Const BASE_URL
- `apps/web/app/[locale]/(frontend)/privacy/page.tsx:33,125` - Base URL & privacy email
- `apps/web/app/[locale]/(frontend)/page.tsx:37` - Image alt
- `apps/web/app/[locale]/(frontend)/terms/page.tsx:33` - Base URL
- `apps/web/app/[locale]/(frontend)/find-tour/page.tsx:36` - Base URL

---

## 2. Configuration Files

### Package Files
- `package-lock.json:2` - Root name: `heritageguiding-platform`
- `package-lock.json:22,2045` - Package name: `@heritageguiding/web`
- `package-lock.json:2041,16759` - Package name: `@heritageguiding/cms`
- `packages/cms/package.json:2` - Package name: `@heritageguiding/cms`
- `apps/web/package.json:2` - Package name: `@heritageguiding/web`

### CMS Config
- `packages/cms/payload.config.ts:47` - Admin titleSuffix: `- HeritageGuiding`

---

## 3. Documentation Files (.md)

### Project Docs
- `README.md:1,6,7,8,9,169,175,372` - Project title, clone path, DB name, URL, Slack channel
- `docs/code-standards.md:4` - Project name
- `docs/codebase-summary.md:1,10,15` - Title & references
- `docs/deployment-guide.md:1,20,21,22,23,24,26,27,28,29,30,32,33,34,44,45,73,82,96,97,101,107,133,151,153,196,197,218,219,228,229,273,282,344,345` - Throughout deployment guide (domains, DNS, emails, monitoring)
- `docs/design-guidelines.md:1` - Title
- `docs/infrastructure-setup.md:1,29,88,89,92,93,94,95,96` - Setup guide
- `docs/system-architecture.md:1,413` - Architecture doc & domain
- `docs/project-overview-pdr.md:11,51` - PDR content
- `docs/MVP-PROJECT-PLAN.md:2,12,136,145,146` - MVP plan

### Plan Files (26 occurrences across plans/)
- Multiple phase files reference HeritageGuiding in context, examples, brand voice definitions

---

## 4. i18n/Translation Files

### Swedish (sv.json)
- Line 20: Meta title
- Lines 125,129,132: Footer & navigation
- Lines 226,231,254,256,265,273: Terms & Privacy content
- Lines 380,434,439: Group tours & GDPR

### German (de.json)
- Line 20: Meta title
- Lines 125,129,132: Footer & navigation
- Lines 226,231,254,265,273: Terms & Privacy content
- Lines 380,434,439: Group tours & GDPR

### English (en.json)
- Line 20: Meta title
- Lines 125,129,132: Footer & navigation
- Lines 226,231,254,265,273: Terms & Privacy content
- Lines 380,434,439: Group tours & GDPR

**Email addresses in translations:** `info@heritageguiding.com`

---

## 5. Test Files

### Unit Tests
- `apps/web/lib/__tests__/seo.test.ts:49,199` - Canonical URL & siteName assertions
- `apps/web/components/seo/__tests__/travel-agency-schema.test.tsx:37,41,208` - Schema name tests
- `apps/web/components/seo/__tests__/guide-detail-schema.test.tsx:80,83` - worksFor tests
- `apps/web/components/seo/__tests__/about-schema.test.tsx:35` - mainEntity name test

---

## 6. Environment/Domain References

### Email Domains
- `info@heritageguiding.com` - Primary contact (21 occurrences)
- `bookings@heritageguiding.com` - Booking notifications (4 occurrences)
- `privacy@heritageguiding.com` - Privacy inquiries (1 occurrence)
- `admin@heritageguiding.com` - Test env references (1 occurrence)

### Web Domains
- `heritageguiding.com` - Primary domain (58 occurrences)
- `staging.heritageguiding.com` - Staging env (6 occurrences)
- `www.heritageguiding.com` - WWW variant (3 occurrences)
- `heritageguiding.se` - Swedish TLD (2 occurrences)
- `pr-123.heritageguiding.vercel.app` - Preview deployments (1 occurrence)

### Social Media
- `facebook.com/heritageguiding`
- `instagram.com/heritageguiding`
- `linkedin.com/company/heritageguiding`

### Other Domain References
- `heritageguiding.rezdy.com` - Rezdy checkout subdomain (1 occurrence in plan file)

---

## Summary Statistics

- **Total Occurrences:** 194 (case-insensitive "heritageguiding")
- **Source Files:** 32 (.ts/.tsx)
- **Config Files:** 6 (package.json, payload.config)
- **Documentation:** 12 (.md files)
- **Translation Files:** 3 (en/sv/de.json)
- **Test Files:** 4 (.test.ts/.tsx)
- **Email Addresses:** 4 unique variants
- **Domains:** 7 unique variants

---

## Unresolved Questions

1. Does rebrand include social media handle changes (facebook/instagram/linkedin)?
2. Should Rezdy subdomain `heritageguiding.rezdy.com` be updated?
3. Are there any printed materials/QR codes with heritageguiding.com that need updating?
4. Should old domain redirect to new one permanently (301)?
5. Email forwarding strategy for bookings@/info@/privacy@ addresses?
