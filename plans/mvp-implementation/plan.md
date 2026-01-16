---
title: "HeritageGuiding MVP Implementation"
description: "AI-first tourism booking platform with Next.js 15 + Payload CMS 3.0"
status: in-progress
priority: P1
effort: "310-372h (12 weeks)"
branch: main
tags: [mvp, next.js, payload-cms, rezdy, i18n, accessibility, concierge-wizard]
created: 2026-01-12
updated: 2026-01-15
---

# HeritageGuiding MVP Implementation Plan

## Overview

Stockholm tourism booking platform with AI-first architecture, multi-language support (SV/EN/DE), WCAG 2.1 AA accessibility, Rezdy booking integration, and AI-powered Concierge Wizard for personalized tour recommendations.

## Technology Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **CMS:** Payload CMS 3.0 (embedded mode)
- **Database:** PostgreSQL 15+ (Supabase)
- **i18n:** next-intl (SV/EN/DE)
- **Booking:** Rezdy API
- **Hosting:** Vercel
- **Maps:** Google Maps (meeting point coordinates)

## Phase Overview

| Phase | Name | Effort | Status | File |
|-------|------|--------|--------|------|
| 01 | Foundation & Setup | 16-20h | done (2026-01-13) | [phase-01](./phase-01-foundation-setup.md) |
| 02 | i18n & Localization | 24-28h | pending | [phase-02](./phase-02-i18n-localization.md) |
| 03 | Data Models & CMS Schema | 28-32h | pending | [phase-03](./phase-03-data-models-cms-schema.md) |
| 04 | Design System | 32-36h | pending | [phase-04](./phase-04-design-system.md) |
| 05 | Homepage | 28-32h | pending | [phase-05](./phase-05-homepage.md) |
| 05.5 | Static Pages (FAQ, About) | 6-10h | pending | [phase-05.5](./phase-05.5-static-pages.md) |
| 06 | Tour Catalog | 24-28h | pending | [phase-06](./phase-06-tour-catalog.md) |
| 07 | Tour Details | 32-36h | pending | [phase-07](./phase-07-tour-details.md) |
| 08 | Rezdy Integration | 24-28h | pending | [phase-08](./phase-08-rezdy-integration.md) |
| 08.5 | Concierge Wizard | 8-12h | pending | [phase-08.5](./phase-08.5-concierge-wizard.md) |
| 09 | Group Bookings + WhatsApp | 20-24h | pending | [phase-09](./phase-09-group-bookings-whatsapp.md) |
| 10 | Accessibility + SEO | 44-54h | pending | [phase-10](./phase-10-accessibility-seo.md) |
| 11 | Performance + Testing | 32-40h | pending | [phase-11](./phase-11-performance-testing.md) |
| 12 | Documentation + Deployment | 16-22h | pending | [phase-12](./phase-12-documentation-deployment.md) |

## Key Dependencies

- Rezdy API access (required by Phase 8)
- Supabase PostgreSQL database
- Vercel hosting account
- Domain DNS configuration
- Tour content/images from client
- FAQ content (min 20 questions) by Week 3
- About Us content + team photos by Week 3
- Tour data with logistics, inclusions, audience tags

## Research Reports

- [Next.js + Payload Integration](../reports/researcher-260112-nextjs-payload-integration.md)
- [Rezdy API Integration](./research/researcher-02-rezdy-api-integration.md)

## Key Schema Enhancements (v1.2)

1. **Logistics/Meeting Point**: coordinates, Google Maps link, instructions
2. **Inclusions/Exclusions**: what's included, what's not, what to bring
3. **Target Audience Tags**: family, couples, corporate, seniors, history nerds, etc.
4. **Static Pages Collection**: FAQ, About Us, Terms, Privacy

## Success Criteria

- WCAG 2.1 AA compliance
- 90+ Lighthouse scores
- Booking flow end-to-end functional
- All 3 languages working
- Schema.org markup validated (incl. FAQPage)
- Concierge Wizard functional with audience tags
- FAQ page with 20+ questions
- About Us page with team/mission

---

## Validation Summary

**Validated:** 2026-01-12 (original), 2026-01-15 (v1.2 updates)
**Questions asked:** 8 (original) + 6 (v1.2)

### Confirmed Decisions (Original)

| Decision | User Choice |
|----------|-------------|
| **Rezdy Integration** | Hosted Checkout - redirect to Rezdy's payment page |
| **Media Storage** | Vercel Blob (~$10/month, integrated) |
| **Group Inquiries** | Both - email notification + store in Payload CMS |
| **Default Locale** | Auto-detect browser/location, fallback to English |
| **Tour Content** | Develop with placeholders, swap content later |
| **UX Design** | Use shadcn/ui defaults - customize post-MVP |
| **Service Accounts** | Partially ready - need to set up remaining before Phase 1 |
| **Reviews** | Manual entry in CMS - no external integration |

### Confirmed Decisions (v1.2 Enhancements)

| Decision | User Choice |
|----------|-------------|
| **FAQ Content** | CMS-managed - store FAQs in Payload CMS, fully editable |
| **Google Maps** | Link only - "Open in Google Maps" link, no embed (zero API cost) |
| **Wizard Placement** | Separate /find-tour page - dedicated wizard page, homepage stays minimal |
| **Legal Content** | Use template + customize later - standard template, lawyer reviews post-launch |
| **GEO Collections** | Defer to post-MVP - skip Neighborhoods/Cities for Stockholm launch |
| **Audience Tags** | All 10 correct - Family, Couples, Corporate, Seniors, History Nerds, Photography, Art Lovers, Food & Wine, Adventure, Architecture |

### Action Items (Original)

- [ ] **Phase 01**: Ensure Vercel Blob storage configured (not Cloudinary)
- [ ] **Phase 02**: Set default locale to auto-detect + English fallback (not Swedish)
- [ ] **Phase 03**: Add `group-inquiries` collection to Payload CMS
- [ ] **Phase 08**: Use hosted checkout redirect (remove direct API booking code)
- [ ] **Phase 09**: Implement CMS collection for group inquiries with admin view
- [ ] **Pre-Phase 1**: Set up remaining service accounts (verify Rezdy, Supabase, Vercel)

### Action Items (v1.2 Updates)

- [ ] **Phase 03**: Remove Neighborhoods/Cities collections (defer to post-MVP)
- [ ] **Phase 03**: Add FAQs collection to Payload CMS for CMS-managed FAQ
- [ ] **Phase 05**: Remove Concierge Wizard from homepage (moved to /find-tour)
- [ ] **Phase 05.5**: Use legal templates for Terms/Privacy pages
- [ ] **Phase 07**: Replace Google Maps embed with simple "Open in Maps" link
- [ ] **Phase 08.5**: Create /find-tour page instead of homepage wizard section

### Notes

- Simple architecture confirmed - no TripAdvisor/external review integration
- Placeholder content approach allows faster development
- Group inquiries in CMS provides audit trail and admin management
- **v1.2**: No Google Maps API key needed - reduces complexity and cost
- **v1.2**: Wizard on separate page allows A/B testing and cleaner homepage
