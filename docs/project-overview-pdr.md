# Project Overview & Product Development Requirements (PDR)

**Document Version:** 1.7
**Last Updated:** April 25, 2026
**Status:** Phase 16 Complete - Guide Profile Redesign + Cache Revalidation + Staging Blocking
**Project Lead:** Technical Team
**Latest Changes:** Guide profile split-panel layout, infinite scroll pagination, cache invalidation hooks, IS_STAGING crawler blocking, tour/guides data v2, cancellation policy page

## Executive Summary

Private Tours is an AI-first tourism booking platform consolidating the Sweden heritage tourism market. The MVP combines advanced technology (Next.js 16.1.6, Payload CMS 3.75) with superior UX to capture market share from 50-100 fragmented competitors. Launch target: 12 weeks.

## Product Vision

**Mission:** Enable world-class heritage experiences in Sweden through intelligent technology that serves both human visitors and AI agents.

**Unique Position:**
- AI-first architecture (structured data for AI discovery)
- Multilingual support (SV/EN/DE)
- WCAG 2.1 AA accessible from day one
- Professional booking infrastructure (Bokun integration)
- Superior content quality over quantity
- Excel/CSV import-export for content management

**Target Market:**
- Primary: International tourists seeking authentic heritage experiences
- Secondary: Tour guides/agencies seeking booking platform
- Tertiary: AI agents (ChatGPT, Perplexity, Google AI) discovering experiences

## Phase 01: Foundation Setup - COMPLETE ✅

Successfully established monorepo infrastructure with Next.js 16, Payload CMS 3.75, PostgreSQL, and full CI/CD pipeline. All development tools configured.

### Phase 01 Objectives

| Objective | Status | Notes |
|-----------|--------|-------|
| Monorepo structure | ✅ | apps/web + packages/cms/ui/types |
| Next.js 16 setup | ✅ | App Router + TypeScript + ESLint 9 flat config + Prettier |
| Payload CMS 3.75 | ✅ | PostgreSQL + Lexical editor + Vercel Blob |
| Users collection | ✅ | Admin auth with role-based access |
| Media collection | ✅ | Image upload to Vercel Blob |
| CI/CD pipeline | ✅ | GitHub Actions (lint, type-check, build) |
| Dev environment | ✅ | Local dev ready, no errors |
| Documentation | ✅ | Architecture, standards, roadmap |

### Phase 01 Deliverables

**Repository Structure:**
```
privatetours-platform/
├── apps/web/              # Next.js 16 + Payload integration (Turbopack)
├── packages/
│   ├── cms/              # Payload config + collections
│   ├── ui/               # Shared UI components (placeholder)
│   └── types/            # Shared TypeScript types
├── .github/workflows/    # CI/CD automation
├── docs/                 # Project documentation
└── plans/                # Phase plans & reports
```

**Technology Stack Confirmed:**
- Frontend: Next.js 16.1.6 (Turbopack bundler), React 19.2.3, TypeScript 5.9.3, Tailwind CSS v4
- CMS: Payload 3.75.0, Lexical Editor, PostgreSQL 15+
- Import/Export: ExcelJS 4.4.0 (CSV/Excel pipelines)
- Storage: Vercel Blob for images
- DevOps: GitHub Actions, Vercel deployment
- Quality: ESLint 9 (flat config), Prettier 3, TypeScript strict mode

**Development Environment:**
- Dev server runs without errors
- Payload admin accessible at `/admin`
- Database migrations working
- Package manager: npm with version 10+
- Node version: 24 (CI) with local >= 24

**CI/CD Pipeline:**
- Automated lint checking (ESLint 9)
- Type checking (TypeScript strict)
- Format validation (Prettier)
- Build testing (npm run build)
- Triggers: Push to main/staging/develop, PRs to main/staging

### Phase 01 Acceptance Criteria - ALL MET ✅

- ✅ Development server runs without errors
- ✅ Payload CMS admin accessible at `/admin`
- ✅ Database migrations working correctly
- ✅ Package structure organized and documented
- ✅ ESLint, Prettier, TypeScript configured
- ✅ CI/CD pipeline runs successfully
- ✅ Documentation complete (architecture, standards, codebase)

## Phase 02: i18n & Localization - COMPLETE ✅

Fully implemented multilingual support with next-intl for Swedish/English/German routing, language persistence, locale-specific formatting, and SEO hreflang tags.

## Phase 03: Data Models & CMS Schema - COMPLETE ✅

All 9 Payload CMS collections implemented: Tours, Guides, Categories, Cities, Neighborhoods, Reviews, Pages, Media, Users. Full i18n support per collection with 7 reusable field modules.

## Phase 04: Design System - COMPLETE ✅

Comprehensive design system with premium heritage aesthetic: Navy/Gold/Coral palette, Playfair/Inter typography, spacing system, animations, component patterns, and accessibility guidelines (WCAG 2.1 AA).

## Phase 05: Homepage - COMPLETE ✅

Full homepage implementation with hero section, trust signals, featured tours grid, CTA sections, testimonials carousel, and footer. All components responsive and accessible.

## Phase 06: Tour Catalog - COMPLETE ✅

Complete tour catalog page with grid/list view toggle, filtering (categories, price, duration), search, sorting, and pagination. Full i18n support across all three languages.

## Phase 07: Tour Detail - COMPLETE ✅

Comprehensive tour detail page featuring: full-screen image gallery, tour facts table, logistics info, inclusions/exclusions, guide profile, booking CTA, customer reviews with ratings, related tours, breadcrumbs, and JSON-LD schema markup.

## Phase 08.1: Bokun Booking Integration + Excel Import/Export - COMPLETE ✅

Fully implemented booking system with HMAC authentication, 60-second availability caching, webhook signature verification, semantic search capabilities, and Excel/CSV import-export pipelines.

### Phase 08.1 Objectives - Status

| Objective | Estimate | Status |
|-----------|----------|--------|
| Bokun API integration | 12h | ✅ Complete - HMAC-SHA256 auth, types |
| Availability caching | 4h | ✅ Complete - 60s TTL, service layer |
| Booking widget embed | 2h | ✅ Complete - Fallback component |
| Webhook handlers | 4h | ✅ Complete - HMAC-SHA256 signature verification |
| Bookings collection | 2h | ✅ Complete - CMS storage with status tracking |
| Semantic search | 6h | ✅ Complete - pgvector + OpenAI embeddings |
| Rate limiting | 2h | ✅ Complete - 400 req/min with exponential backoff |
| Excel/CSV import-export | 4h | ✅ Complete - Format-agnostic pipeline with Zod validation |

**Time Estimate:** 24-28 hours (Complete - Feb 8, 2026)

## Core MVP Features

### Must-Have (Phase 01-13)

| Feature | Phase | Est. Hours |
|---------|-------|-----------|
| Multiple language support (SV/EN/DE) | 2 | 24-28 |
| Tour catalog with filters | 6 | 24-28 |
| Tour detail pages | 7 | 28-32 |
| Bokun booking integration | 8.1 | 20-24 |
| Group inquiry form | 9 | 12-14 |
| WhatsApp integration | 10 | 8-10 |
| WCAG 2.1 AA accessibility | 11 | 16-20 |
| SEO & Schema.org markup | 13 | 14-16 |

### Nice-to-Have (Post-MVP)

- Advanced AI content generation
- Vector database semantic search
- Neighborhood-specific landing pages
- TripAdvisor integration
- French language support
- Partner portal for agencies
- Advanced analytics dashboard
- Blog/content marketing CMS
- Customer user accounts
- Mobile apps (iOS/Android)

## Success Metrics

### Technical Metrics

| Metric | Target | Verification |
|--------|--------|--------------|
| Lighthouse Performance | 90+ | PageSpeed Insights |
| Accessibility Score | WCAG 2.1 AA | aXe audit |
| Page Load Time | <2s on 3G | WebPageTest |
| Mobile Responsiveness | 100% | Responsive design testing |
| Browser Compatibility | Latest 3 versions | Cross-browser testing |
| Uptime | 99.9% | Monitoring tools |

### Business Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Booking Conversion Rate | >3% | Google Analytics |
| Inquiry Form Submissions | >10/week | Form tracking |
| Language Distribution | SV 40%, EN 35%, DE 25% | Analytics |
| Mobile Traffic | >60% | Device breakdown |
| Return Visitor Rate | >25% | Analytics |

### Content Metrics

| Metric | Target | Notes |
|--------|--------|-------|
| Tours Available | 5-10 at launch | All languages |
| Expert Profiles | 4-6 guides | With credentials |
| Tour Images | 3+ per tour | High quality |
| Customer Reviews | 10-15 | Sample data at launch |

## Non-Functional Requirements

### Performance

- Page load time: <2 seconds on 3G networks
- Time to First Contentful Paint: <1 second
- Cumulative Layout Shift: <0.1
- First Input Delay: <100ms
- Database queries: <100ms avg response time

### Accessibility

- WCAG 2.1 Level AA compliance (not AAA)
- Keyboard navigation fully functional
- Screen reader support (ARIA labels)
- Color contrast ratio 4.5:1 minimum
- Focus indicators visible
- Skip-to-content links

### Security

- HTTPS enforced
- Environment secrets not in code
- SQL injection prevention (parameterized queries)
- XSS protection (React handles)
- CSRF tokens for state changes
- Rate limiting on API endpoints
- Authentication for admin routes

### Scalability

- Handle 1000 concurrent users
- Horizontal scaling via Vercel
- Database connection pooling
- CDN for image delivery
- Caching strategy for frequently accessed data

### Reliability

- Automated daily database backups
- Error tracking and alerting
- Zero-downtime deployments
- Graceful error handling
- 99.9% uptime SLA

## Technical Constraints

### Must Use

- Next.js 16.1.6 (no alternatives)
- Payload CMS 3.75 (no alternatives)
- PostgreSQL (no SQLite)
- TypeScript strict mode
- Tailwind CSS for styling
- Vercel for frontend hosting

### Must NOT Use

- Pages directory (use App Router only)
- Class components (use functional only)
- Custom CSS (use Tailwind)
- Hardcoded secrets
- Unsafe database queries
- console.log in production

## Dependencies & Risks

### External Dependencies

| Service | Critical? | Fallback |
|---------|-----------|----------|
| PostgreSQL hosting | Yes | Switch provider (1 day) |
| Vercel deployment | Yes | Switch to AWS (2 days) |
| Vercel Blob storage | No | Use Cloudinary (1 day) |
| Email service | Yes | Gmail SMTP (Google Workspace) (1 day) |
| Bokun API | Yes | Manual booking form (2 days) |

### Key Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| Bokun API delays | Booking feature blocked | Low | Early integration testing (Complete) |
| UX design unavailable | Use shadcn/ui defaults | Low | Acceptable for MVP |
| Content not ready | Use placeholder text | Medium | CMS allows easy updates |
| Database connection issues | App offline | Low | Connection pooling + retries |
| Scope creep | Timeline overruns | High | Strict MVP scope definition |

## Timeline & Milestones

### Development Phases (17 Total)

| Week | Phases | Focus | Deliverable |
|------|--------|-------|------------|
| **Week 1** | 01 | Foundation | Dev environment ready |
| **Week 1-2** | 02 | i18n | Multilingual routing |
| **Week 2** | 03 | Data models | CMS schema defined |
| **Week 3-5** | 04-07 | Core platform | Homepage, catalog, details |
| **Week 5-6** | 08.1 | Bokun + Excel import/export | Booking, widgets, bulk content management |
| **Week 7-9** | 09-13 | Advanced features | Groups, WhatsApp, SEO, accessibility |
| **Week 10-11** | 14-16 | Polish & test | Performance, QA, documentation |
| **Week 12** | 17 | Launch | Production deployment |

### Critical Milestones

1. **Week 1** - Foundation complete ✅
2. **Week 2** - i18n & data models complete ✅
3. **Week 3-4** - Design system, homepage, catalog complete ✅
4. **Week 5** - Tour detail page complete ✅
5. **Week 5-6** - Bokun integration + Excel import/export complete ✅
6. **Week 9** - All features implemented
7. **Week 11** - Complete UAT cycle
8. **Week 12** - Go-live 🚀

## Definition of Done

The MVP is complete when **ALL** criteria are met:

### Code Quality
- ✅ No TypeScript errors (strict mode)
- ✅ ESLint passes with no warnings
- ✅ Prettier formatting applied
- ✅ All tests pass
- ✅ Code reviewed and approved

### Functionality
- ✅ All 17 phases implemented
- ✅ All user flows work end-to-end
- ✅ Booking system functional
- ✅ Admin CMS operational
- ✅ No critical bugs

### Performance & Quality
- ✅ Lighthouse 90+ across categories
- ✅ WCAG 2.1 AA compliance verified
- ✅ <2s load time on 3G
- ✅ Mobile responsive
- ✅ Cross-browser compatible

### Documentation
- ✅ CMS user guide completed
- ✅ Technical documentation updated
- ✅ Deployment procedures documented
- ✅ Code comments for complex logic

### Deployment
- ✅ Production database configured
- ✅ SSL certificate active
- ✅ Domain configured
- ✅ Vercel deployment successful
- ✅ Monitoring & alerts active

## Post-MVP Plan

### Stabilization Period (Phase 18)

**Duration:** 3 months post-launch
**Effort:** 40-50 hours

**Activities:**
- Monitor production errors
- Performance optimization
- Content refinements
- User feedback implementation
- Bug fixes

### Future Features (Phase 19+)

**Estimated:** 50-150 hours depending on priority

1. AI-powered content generation
2. Semantic search with vectors
3. Neighborhood-specific pages
4. TripAdvisor integration
5. Fourth language (French)
6. Agency partner portal
7. Advanced analytics
8. Blog/marketing content
9. Customer user accounts
10. Mobile applications

## Project Governance

### Decision Making

- **Tech Decisions:** Technical team decides
- **Feature Scope:** Product + Technical consensus
- **Design:** UX designer with team input
- **Deployment:** Technical team + stakeholder approval

### Communication

- **Weekly Syncs:** Every Monday, 60 minutes
- **Async Updates:** Email/Slack for blockers
- **Code Reviews:** Before merge to main
- **Deliverable Reviews:** 48-hour feedback window

### Quality Gates

- **Lint:** Must pass ESLint before commit
- **Types:** Must pass TypeScript before PR
- **Build:** Must pass production build before merge
- **Tests:** Must pass all tests before merge
- **Review:** Requires code review approval

## Resources & Team

### Required Roles

- **Technical Lead:** Architecture, oversight, decisions
- **Full-Stack Developer:** Implementation (4 phases)
- **UX Designer:** Design system, components
- **QA/Tester:** Testing, bug reporting
- **DevOps:** Infrastructure, CI/CD, monitoring

### Tools & Services

- **Version Control:** GitHub
- **Project Management:** (Issues in GitHub)
- **Communication:** Slack, email
- **Deployment:** Vercel
- **Database Hosting:** Supabase, Railway, or AWS RDS
- **Monitoring:** Sentry, Vercel Analytics

## Approval & Sign-Off

| Role | Approval | Date |
|------|----------|------|
| Product Owner | Pending | - |
| Technical Lead | Approved | Jan 13, 2026 |
| Stakeholder | Pending | - |

## Current Progress (As of April 25, 2026)

**Phases Complete:** 13-16 (Phase 09 WhatsApp/Groups + Phases 10-12 pending completion)

**Completed (69K LOC - apps/web):**
- 150+ React components (responsive, accessible, i18n-ready)
- 13 API data-fetching functions + 13 API routes with full TypeScript typing
- **1009 total unit tests** (95.9% statement coverage, all 4 metrics >80%)
- 44 test files covering components, APIs, services, hooks, integrations
- Bokun API client with HMAC-SHA256 authentication + comprehensive tests
- Semantic search with pgvector + OpenAI embeddings (1536-dim)
- Email services (5 transports: Gmail SMTP, Nodemailer) + tests
- Excel/CSV import-export with 9 service files + tests
- Web Vitals monitoring hook + analytics endpoint + tests
- Cache revalidation pattern (CMS hook + /api/revalidate endpoint)
- IS_STAGING env var for staging crawler blocking (robots.txt + headers)
- Image blur placeholders via plaiceholder (blur_data_url)
- Split-panel guide detail layout with infinite scroll pagination
- Booking-first tour detail layout (lg:grid-cols-[1fr_380px])
- Homepage Stepi-inspired redesign + tours listing sidebar filters
- XSS prevention, security headers, input validation
- ARIA labels, semantic HTML, accessibility badges, skip links

**Completed (35K LOC - packages/cms):**
- 12 fully configured Payload CMS collections
- **1009 total unit tests** (89.7% statement coverage, all 4 metrics >80%)
- 11 test files covering CSV/Excel, access control, embedding hooks, cache revalidation
- 3-locale localization (sv/en/de) + migration path for new fields
- Vercel Blob cloud storage integration
- Role-based access control
- pgvector extension for semantic search with embedding generation on save
- Excel/CSV import-export services with comprehensive validation
- Cache revalidation hook (revalidate-cache-tags-hook) on afterChange

**Phase Milestones:**
- Phase 13 (2026-03-04): Homepage redesign (Stepi-inspired)
- Phase 14 (2026-04-04): Tours listing redesign (sidebar filters)
- Phase 15 (2026-04-08): Tour detail redesign (booking-first layout)
- Phase 16 (2026-04-18): Guide profile redesign (split-panel + infinite scroll)
- Cache revalidation (2026-04-12): CMS hook + /api/revalidate endpoint
- IS_STAGING blocking (2026-04-05): Staging crawler prevention
- Tour data v2 (2026-04-13): Delta import pipeline
- Guides data v2 (2026-04-14): Data update
- Cancellation policy page (2026-04-12): i18n support

## Next Steps (Phase 17+)

1. **Phase 17** - Per-tour cancellation policy (in progress, plan: 260419)
2. **Phase 09** - Group inquiry form & WhatsApp integration (pending)
3. **Phase 18+** - Advanced features, launch preparation

---

**Document Status:** Phase 16 Complete, Per-Tour Cancellation In Progress
**Questions?** Contact technical lead
**Last Review:** April 25, 2026
