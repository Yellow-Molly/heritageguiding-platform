# MVP PROJECT PLAN
## HeritageGuiding Platform - AI-First Tourism Booking Platform

**Document Version:** 1.0  
**Date:** December 28, 2025  
**Status:** Final

---

## Executive Summary

This document outlines the detailed scope, timeline, and deliverables for the Minimum Viable Product (MVP) of the HeritageGuiding platform (formerly Stockholm Tours). The MVP represents a production-ready, AI-first booking platform designed to consolidate the fragmented tourism market through technical superiority and superior user experience.

### Project Overview

| Aspect | Details |
|--------|---------|
| **Total Development Time** | 292-350 hours (10-12 weeks) |
| **Target Launch** | 12 weeks from start date |
| **Technology Stack** | Next.js 15, Payload CMS 3.0, PostgreSQL, Rezdy Integration |
| **Languages Supported** | Swedish, English, German (French post-launch) |
| **Compliance** | WCAG 2.1 Level AA from day one |

### Strategic Positioning

The platform is designed with AI-first architecture, making it discoverable by AI agents (ChatGPT, Perplexity, Google AI) while providing exceptional user experience for human visitors. This dual approach positions HeritageGuiding ahead of 50-100 smaller competitors who rely solely on traditional SEO.

---

## Core MVP Features

| Feature Category | Description |
|-----------------|-------------|
| **Multi-language Support** | Full Swedish, English, and German localization for all content, UI elements, and booking flows |
| **AI-First Architecture** | Schema.org structured data, hybrid content (emotional + factual layers), scalable search ready for AI agent discovery |
| **Accessibility** | WCAG 2.1 Level AA compliant from design phase - keyboard navigation, screen reader support, color contrast, focus indicators |
| **Booking System** | Rezdy integration for payments, customer accounts, calendar management, and B2B agent portal |
| **Content Management** | Payload CMS 3.0 for tour management, content editing, and multilingual content workflows |
| **Group Bookings** | Inquiry form for groups 10+, WhatsApp integration for instant communication |
| **Reviews & Trust Signals** | Display system for ratings, expert credentials, certifications to build trust |
| **SEO & Discoverability** | Meta optimization, OpenGraph tags, Google Business Profile integration, sitemap generation |

---

## Development Phases & Timeline

The MVP development is organized into **17 distinct phases**, each with clear deliverables and time estimates. Development follows an iterative approach with weekly check-ins to ensure alignment.

### Phase 1: Foundation & Setup (Week 1)

**Time Estimate:** 16-20 hours

**Deliverables:**
- Next.js 15 project initialized with TypeScript, ESLint, Prettier
- Payload CMS 3.0 configured with PostgreSQL database
- Development environment setup (local, staging)
- Git repository structure and branching strategy
- Hosting infrastructure configuration (Vercel/Railway)

**Acceptance Criteria:**
- Development server runs without errors
- Payload CMS admin accessible at `/admin`
- Database migrations working correctly

---

### Phase 2: i18n & Localization (Week 1-2)

**Time Estimate:** 24-28 hours

**Deliverables:**
- next-intl configured for SV/EN/DE routing
- Language switcher component with persistent preferences
- Translation workflow in Payload CMS (per-field localization)
- Date, time, currency formatting for each locale
- SEO metadata localization (hreflang tags)

**Acceptance Criteria:**
- All three languages accessible via `/sv`, `/en`, `/de` routes
- Language preferences persist across sessions
- Content editable in all languages via CMS

---

### Phase 3: Data Models & CMS Schema (Week 2)

**Time Estimate:** 20-24 hours

**Core Collections:**
- **Tours:** title, description, pricing, duration, accessibility, expert info
- **Guides/Experts:** credentials, bio, photo, tours
- **Categories:** themes, neighborhoods
- **Reviews:** rating, text, date, tour reference
- **Media:** images with alt text, captions

---

### Phases 4-8: Core Platform Development (Weeks 3-5)

| Phase | Hours | Key Deliverables |
|-------|-------|------------------|
| **4. Design System** | 32-36 | Tailwind config, components library, UX designer handoff integration |
| **5. Homepage** | 20-24 | Hero, featured tours, trust signals, language switcher, responsive design |
| **6. Tour Catalog** | 24-28 | Tour grid/list views, filters (theme, price, duration, accessibility), search, sorting |
| **7. Tour Details** | 28-32 | Emotional + factual content layers, gallery, expert bio, reviews, booking CTA |
| **8. Rezdy Integration** | 24-28 | API integration, availability sync, booking widget embedding, payment flow |

---

### Phases 9-13: Advanced Features (Weeks 6-8)

| Phase | Hours | Key Deliverables |
|-------|-------|------------------|
| **9. Group Bookings** | 12-14 | Inquiry form with validation, email notifications, admin interface |
| **10. WhatsApp** | 8-10 | Floating button, click-to-chat functionality, localized messages |
| **11. Accessibility** | 16-20 | WCAG 2.1 AA compliance: keyboard nav, ARIA labels, focus management, skip links |
| **12. SEO Foundation** | 12-16 | Meta tags, OpenGraph, sitemap, robots.txt, Google Business integration |
| **13. Schema.org** | 14-16 | TouristAttraction, Person (experts), Organization markup for AI discoverability |

---

### Phases 14-17: Polish & Launch (Weeks 9-12)

| Phase | Hours | Key Deliverables |
|-------|-------|------------------|
| **14. Performance** | 12-16 | Image optimization, code splitting, caching, Core Web Vitals optimization |
| **15. Testing** | 20-24 | Cross-browser testing, mobile responsiveness, accessibility audit, booking flow QA |
| **16. Documentation** | 8-10 | CMS user guide, technical documentation, deployment procedures |
| **17. Deployment** | 8-12 | Production deployment, DNS configuration, SSL, monitoring setup, launch checklist |

---

## Technical Architecture

### Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui components |
| **CMS** | Payload CMS 3.0 with rich text editor, media management, role-based access |
| **Database** | PostgreSQL 15+ with full-text search, JSON support for multilingual content |
| **Booking** | Rezdy API integration for calendar, payments (Stripe/PayPal), customer accounts |
| **Localization** | next-intl for routing, date-fns for date/time formatting, per-field translations in CMS |
| **Hosting** | Vercel (frontend + serverless functions), Railway/Supabase (PostgreSQL database) |
| **Media** | Cloudinary or Vercel Blob for image optimization, responsive images, WebP conversion |
| **Email** | Resend or SendGrid for transactional emails (booking confirmations, inquiries) |

---

## MVP Acceptance Criteria

The MVP will be considered complete when **ALL** of the following criteria are met:

### Functional Requirements

- ✅ All tour pages display correctly in Swedish, English, and German
- ✅ Users can browse tours by category, neighborhood, price, duration, and accessibility
- ✅ Booking flow via Rezdy integration works end-to-end (select date → payment → confirmation)
- ✅ Group inquiry form sends emails to admin and confirmation to customer
- ✅ WhatsApp click-to-chat works with pre-filled localized messages
- ✅ CMS allows creating/editing tours, guides, reviews in all three languages
- ✅ Language switcher persists user preference across sessions

### Technical Requirements

- ✅ WCAG 2.1 Level AA compliance verified via automated and manual testing
- ✅ All pages achieve 90+ Lighthouse scores (Performance, Accessibility, SEO)
- ✅ Schema.org markup validates without errors on schema.org validator
- ✅ Mobile responsive design works on iOS Safari, Android Chrome, tablet devices
- ✅ Cross-browser compatibility verified on Chrome, Firefox, Safari, Edge (latest versions)
- ✅ Production deployment is stable with zero critical errors
- ✅ SSL certificate configured, HTTPS working correctly

### Content Requirements

- ✅ Minimum 5 tours populated with complete content (all languages)
- ✅ Expert/guide profiles for each tour with credentials and photos
- ✅ High-quality tour images (minimum 3 per tour)
- ✅ Sample reviews populated for social proof

---

## Project Timeline & Milestones

### Weekly Milestones

| Week | Deliverable |
|------|-------------|
| **1-2** | Foundation complete: Dev environment, i18n, CMS configured, data models defined |
| **3-5** | Core platform: Homepage, tour catalog, tour details, Rezdy integration functional |
| **6-8** | Advanced features: Group bookings, WhatsApp, accessibility, SEO, Schema.org complete |
| **9-11** | Polish & testing: Performance optimization, cross-browser testing, content population |
| **12** | 🚀 **LAUNCH:** Production deployment, final QA, go-live |

### Post-Launch Stabilization (Phase 18)

**Duration:** 3 months following launch  
**Time Estimate:** 40-50 hours

**Activities:**
- Bug fixes identified during real-world usage
- Performance optimization based on analytics data
- Content adjustments and refinements
- User feedback implementation (minor UX improvements)
- Monitoring and stability verification

---

## Risk Management & Contingencies

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Scope creep** | Timeline extends beyond 12 weeks | Strict adherence to defined MVP scope; defer nice-to-have features to post-launch |
| **Rezdy API issues** | Booking functionality delayed or incomplete | Early Rezdy integration testing (Week 3); fallback to basic inquiry forms if needed |
| **UX design delays** | Design system phase takes longer than expected | Begin with shadcn/ui defaults; customize as designer assets become available |
| **Content not ready** | Tour descriptions, images not provided in time | Use placeholder content for development; CMS allows easy updates post-launch |
| **Browser compatibility** | Unexpected issues on specific browsers | Testing starts early (Week 9); modern stack minimizes compatibility issues |

---

## Communication & Collaboration

### Weekly Sync Meetings

- **Frequency:** Every week, same day/time
- **Duration:** 30-60 minutes
- **Format:** Video call

**Agenda:**
- Demo of completed work from previous week
- Discussion of upcoming week's priorities
- Address any blockers or concerns
- Review timeline and adjust if needed
- Decisions on design/content/features

### Ongoing Communication

- **Primary:** Email or Slack for quick questions/updates
- **Response time:** Within 4 hours during weekdays for urgent issues
- **Staging environment:** Accessible 24/7 for review of work-in-progress
- **Documentation:** Shared Google Doc or Notion for decisions and notes

### Deliverable Reviews

Major deliverables will be presented for review with 48-hour feedback window:

- Design system (end of Week 3)
- Homepage (end of Week 4)
- Tour catalog and details (end of Week 5)
- Rezdy integration (end of Week 6)
- Complete MVP for UAT (end of Week 11)

---

## Success Metrics

These metrics will be used to evaluate MVP success:

### Technical Metrics

- **Performance:** Lighthouse score 90+ across all categories
- **Accessibility:** WCAG 2.1 AA compliance (0 critical issues)
- **Uptime:** 99.9% availability post-launch
- **Page load:** <2 seconds on 3G connection
- **Mobile:** 100% responsive across iOS/Android devices

### User Experience Metrics

- **Booking conversion:** Track booking completion rate
- **Inquiry submissions:** Monitor group booking inquiries
- **Language usage:** Track SV/EN/DE visitor distribution
- **Mobile vs desktop:** Monitor device usage patterns

### SEO & Discoverability Metrics

- **Google indexing:** All pages indexed within 2 weeks
- **Rich snippets:** Schema.org markup showing in search results
- **Local SEO:** Google Business Profile integration active
- **Core Web Vitals:** All metrics in 'Good' range

---

## Assumptions & Dependencies

### Assumptions

- UX design assets provided by Week 3 (or shadcn/ui defaults used)
- Tour content (descriptions, images) provided by Week 10 (or placeholder used)
- Rezdy account setup and API access granted by Week 2
- Domain name registered and accessible for configuration
- Hosting accounts (Vercel, database) set up collaboratively
- Weekly sync meetings scheduled and consistently attended
- Feedback provided within 48 hours for deliverable reviews
- No major changes to core requirements after kickoff

### Dependencies

**External Services:**
- Rezdy API functionality and uptime
- Vercel platform stability
- PostgreSQL database hosting reliability
- Image hosting service (Cloudinary/Vercel Blob)
- Email service provider (Resend/SendGrid)

**Third-party Assets:**
- Professional photography/imagery for tours
- Expert guide headshots and credentials
- Company branding (logo, color palette)

---

## Post-MVP Roadmap (Phase 19+)

The following features are explicitly **excluded from MVP scope** but planned for post-launch implementation:

### Planned Future Features

- **Advanced AI Content Generation:** Automated multilingual content creation using Claude API
- **Vector Database Search:** Semantic search for tours (when catalog exceeds 300 tours)
- **GEO Localization:** Neighborhood-specific landing pages for local SEO
- **TripAdvisor Integration:** Reviews sync and booking widget
- **French Language Support:** Fourth language addition with full localization
- **Partner Portal:** Hotel/agency dashboard for affiliate tracking
- **Advanced Analytics:** Custom dashboard for conversion tracking and insights
- **Blog/Content Marketing:** CMS for articles (2/week publishing cadence)
- **Customer Accounts:** User profiles, booking history, favorites (beyond Rezdy)
- **Mobile App:** Native iOS/Android applications

**Estimated Post-MVP Development:** 50-150 hours depending on feature priority

---

## Summary & Next Steps

This MVP Project Plan outlines a comprehensive, production-ready HeritageGuiding platform deliverable in **12 weeks** with **292-350 hours** of development effort. The platform will be AI-first, multilingual, fully accessible, and integrated with professional booking infrastructure through Rezdy.

### Key Commitments

- **Timeline:** MVP launched within 12 weeks of project start
- **Quality:** WCAG 2.1 AA compliant, 90+ Lighthouse scores, production-ready code
- **Communication:** Weekly syncs, 4-hour response time for urgent issues
- **Documentation:** CMS user guide, technical docs, deployment procedures
- **Post-Launch:** 3-month stabilization period with ongoing support

### Immediate Next Steps

1. **Review & Approval:** Review this plan and provide feedback within 48 hours
2. **Shareholder Agreement:** Finalize and sign legal agreements
3. **Rezdy Setup:** Create account and provide API access
4. **Hosting Accounts:** Set up Vercel, database, email service
5. **Schedule Kickoff:** Book first weekly sync meeting
6. **Start Development:** Begin Phase 1 (Foundation & Setup)

---

*"I'm excited to build this with you. Let's create something exceptional."*

**— Your Technical Partner**

---

**End of Document**
