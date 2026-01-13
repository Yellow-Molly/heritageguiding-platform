---
title: "HeritageGuiding MVP Implementation"
description: "AI-first tourism booking platform with Next.js 15 + Payload CMS 3.0"
status: in-progress
priority: P1
effort: "292-350h (12 weeks)"
branch: main
tags: [mvp, next.js, payload-cms, rezdy, i18n, accessibility]
created: 2026-01-12
---

# HeritageGuiding MVP Implementation Plan

## Overview

Stockholm tourism booking platform with AI-first architecture, multi-language support (SV/EN/DE), WCAG 2.1 AA accessibility, and Rezdy booking integration.

## Technology Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS, shadcn/ui
- **CMS:** Payload CMS 3.0 (embedded mode)
- **Database:** PostgreSQL 15+ (Supabase)
- **i18n:** next-intl (SV/EN/DE)
- **Booking:** Rezdy API
- **Hosting:** Vercel

## Phase Overview

| Phase | Name | Effort | Status | File |
|-------|------|--------|--------|------|
| 01 | Foundation & Setup | 16-20h | done (2026-01-13) | [phase-01](./phase-01-foundation-setup.md) |
| 02 | i18n & Localization | 24-28h | pending | [phase-02](./phase-02-i18n-localization.md) |
| 03 | Data Models & CMS Schema | 20-24h | pending | [phase-03](./phase-03-data-models-cms-schema.md) |
| 04 | Design System | 32-36h | pending | [phase-04](./phase-04-design-system.md) |
| 05 | Homepage | 20-24h | pending | [phase-05](./phase-05-homepage.md) |
| 06 | Tour Catalog | 24-28h | pending | [phase-06](./phase-06-tour-catalog.md) |
| 07 | Tour Details | 28-32h | pending | [phase-07](./phase-07-tour-details.md) |
| 08 | Rezdy Integration | 24-28h | pending | [phase-08](./phase-08-rezdy-integration.md) |
| 09 | Group Bookings + WhatsApp | 20-24h | pending | [phase-09](./phase-09-group-bookings-whatsapp.md) |
| 10 | Accessibility + SEO | 42-52h | pending | [phase-10](./phase-10-accessibility-seo.md) |
| 11 | Performance + Testing | 32-40h | pending | [phase-11](./phase-11-performance-testing.md) |
| 12 | Documentation + Deployment | 16-22h | pending | [phase-12](./phase-12-documentation-deployment.md) |

## Key Dependencies

- Rezdy API access (required by Phase 8)
- Supabase PostgreSQL database
- Vercel hosting account
- Domain DNS configuration
- Tour content/images from client

## Research Reports

- [Next.js + Payload Integration](../reports/researcher-260112-nextjs-payload-integration.md)
- [Rezdy API Integration](./research/researcher-02-rezdy-api-integration.md)

## Success Criteria

- WCAG 2.1 AA compliance
- 90+ Lighthouse scores
- Booking flow end-to-end functional
- All 3 languages working
- Schema.org markup validated

---

## Validation Summary

**Validated:** 2026-01-12
**Questions asked:** 8

### Confirmed Decisions

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

### Action Items

- [ ] **Phase 01**: Ensure Vercel Blob storage configured (not Cloudinary)
- [ ] **Phase 02**: Set default locale to auto-detect + English fallback (not Swedish)
- [ ] **Phase 03**: Add `group-inquiries` collection to Payload CMS
- [ ] **Phase 08**: Use hosted checkout redirect (remove direct API booking code)
- [ ] **Phase 09**: Implement CMS collection for group inquiries with admin view
- [ ] **Pre-Phase 1**: Set up remaining service accounts (verify Rezdy, Supabase, Vercel)

### Notes

- Simple architecture confirmed - no TripAdvisor/external review integration
- Placeholder content approach allows faster development
- Group inquiries in CMS provides audit trail and admin management
