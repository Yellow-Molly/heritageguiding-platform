# HeritageGuiding Platform - Documentation Index

**Last Updated:** January 13, 2026
**Project Status:** Phase 01 Complete - Ready for Phase 02

Welcome to the HeritageGuiding Platform documentation. This folder contains comprehensive documentation for developers, project managers, and stakeholders.

## Quick Start for New Team Members

1. **Understand the Project** - Read `project-overview-pdr.md` (15 min)
2. **Learn the Codebase** - Read `codebase-summary.md` (10 min)
3. **Know the Standards** - Read `code-standards.md` (15 min)
4. **Understand Architecture** - Read `system-architecture.md` (15 min)

**Total time: ~55 minutes**

## Documentation Files

### Project Planning & Requirements

#### project-overview-pdr.md (450 LOC)
**For:** Product managers, stakeholders, developers needing context
**Contains:**
- Executive summary & vision
- Phase 01 completion status (all 8 objectives met ✅)
- Phase roadmap (17 phases total)
- MVP feature list (must-have vs nice-to-have)
- Success metrics (technical, business, content)
- Non-functional requirements
- Technical constraints
- Risk assessment & mitigation
- 12-week timeline
- Definition of done
- Post-MVP features (10 planned)

**Key Sections:**
- Core MVP Features
- Success Metrics
- Development Timeline
- Risk Management

**Read this if:** You need to understand project goals, scope, or timeline.

### Technical Documentation

#### codebase-summary.md (200 LOC)
**For:** Developers working on the codebase
**Contains:**
- Repository structure (monorepo layout)
- Technology stack (8 layers documented)
- Dependencies (frontend + CMS)
- Project directory breakdown
- CI/CD pipeline (GitHub Actions)
- Environment variables
- Development commands
- Phase roadmap

**Key Sections:**
- Repository Structure
- Tech Stack
- Key Dependencies
- Development Commands

**Read this if:** You need to understand codebase structure or dev setup.

#### code-standards.md (390 LOC)
**For:** All developers writing code
**Contains:**
- Core principles (YAGNI, KISS, DRY)
- TypeScript standards & strict mode
- File organization & naming conventions
- React component best practices
- Error handling patterns
- Testing strategy
- Code quality tools (ESLint, Prettier)
- Commit message format (conventional commits)
- Payload CMS collection standards
- Performance & security checklists

**Key Sections:**
- Naming Conventions
- Component Structure
- Error Handling
- Code Quality Tools
- Commit Standards

**Read this if:** You're writing code or doing code review.

#### system-architecture.md (401 LOC)
**For:** Architects, senior developers, tech leads
**Contains:**
- High-level system diagram
- Component interaction flows (request flows)
- Technology layers (frontend, CMS, data)
- API strategy (GraphQL + REST)
- Data models (Phase 3+ collections)
- Deployment architecture
- Security architecture
- Performance considerations
- Monitoring plans
- Future architecture changes

**Key Sections:**
- High-Level Architecture
- Technology Layers
- Request Flows
- Data Models
- Deployment Architecture

**Read this if:** You need to understand system design or make architectural decisions.

### Infrastructure & Setup

#### INFRASTRUCTURE-SETUP-COMPLETE.md (1119 LOC)
**For:** DevOps, infrastructure team, platform engineers
**Contains:**
- Monorepo strategy & rationale
- Development environment setup
- Hosting & infrastructure (Vercel, PostgreSQL)
- Database setup & management
- Third-party services (email, storage)
- CI/CD pipeline configuration
- Environment variables management
- Domain & DNS configuration
- Monitoring & analytics setup
- Security setup
- Backup strategy
- Development workflow

**Read this if:** You're setting up infrastructure or managing deployment.

### Project Planning

#### MVP-PROJECT-PLAN.md (362 LOC)
**For:** Project managers, stakeholders, development team
**Contains:**
- Executive summary
- Core MVP features
- Development phases (17 total, detailed)
- Technical architecture
- Acceptance criteria
- Timeline & milestones
- Risk management
- Communication plan
- Success metrics
- Post-MVP roadmap

**Read this if:** You need detailed project scope and timeline.

---

## Documentation Organization

### By Role

**Product Manager**
1. project-overview-pdr.md - Scope & requirements
2. MVP-PROJECT-PLAN.md - Timeline & phases
3. codebase-summary.md - Tech overview

**Developer**
1. code-standards.md - Code rules
2. codebase-summary.md - Codebase structure
3. system-architecture.md - System design

**Tech Lead / Architect**
1. system-architecture.md - System design
2. code-standards.md - Code rules
3. project-overview-pdr.md - Requirements

**DevOps / Infrastructure**
1. INFRASTRUCTURE-SETUP-COMPLETE.md - Infrastructure
2. codebase-summary.md - CI/CD pipeline
3. system-architecture.md - Deployment

**QA / Tester**
1. code-standards.md - Testing section
2. project-overview-pdr.md - Success metrics
3. MVP-PROJECT-PLAN.md - Acceptance criteria

### By Task

**Setting up development environment**
- INFRASTRUCTURE-SETUP-COMPLETE.md (development section)
- codebase-summary.md (development commands)
- code-standards.md (pre-commit checklist)

**Writing code**
- code-standards.md (all sections)
- codebase-summary.md (file structure)
- system-architecture.md (data models)

**Understanding project scope**
- project-overview-pdr.md (overview + phases)
- MVP-PROJECT-PLAN.md (feature list)

**Making architectural decisions**
- system-architecture.md (all sections)
- code-standards.md (constraints section)
- project-overview-pdr.md (requirements)

**Deploying to production**
- INFRASTRUCTURE-SETUP-COMPLETE.md (deployment)
- codebase-summary.md (CI/CD pipeline)
- code-standards.md (pre-commit checklist)

---

## Key Facts at a Glance

### Tech Stack
- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS v4
- **CMS:** Payload CMS 3.0, Lexical Editor
- **Database:** PostgreSQL 15+
- **Storage:** Vercel Blob (images)
- **Hosting:** Vercel (frontend)
- **CI/CD:** GitHub Actions
- **Code Quality:** ESLint 9, Prettier 3, TypeScript strict mode

### Project Scope
- **MVP Duration:** 12 weeks
- **Total Phases:** 17
- **Estimated Hours:** 292-350
- **Languages Supported:** Swedish, English, German
- **Accessibility:** WCAG 2.1 Level AA
- **Booking System:** Rezdy integration

### Phase Status
- **Phase 01 (Foundation):** ✅ COMPLETE
- **Phase 02 (i18n):** Planned (Week 2)
- **Phase 03 (Data Models):** Planned (Week 2)
- **Phases 04-08 (Core Platform):** Planned (Weeks 3-5)
- **Phases 09-13 (Advanced):** Planned (Weeks 6-8)
- **Phases 14-17 (Polish):** Planned (Weeks 9-12)

### Success Metrics
- Lighthouse: 90+ across categories
- WCAG 2.1 AA compliance
- Page load: <2 seconds on 3G
- Mobile responsive: 100%
- Uptime: 99.9%

---

## File Location Reference

```
docs/
├── README.md (this file)
├── codebase-summary.md
├── code-standards.md
├── system-architecture.md
├── project-overview-pdr.md
├── MVP-PROJECT-PLAN.md
└── INFRASTRUCTURE-SETUP-COMPLETE.md
```

## How to Use This Documentation

### For Quick Answers
- Use Ctrl+F to search within files
- Check the table of contents in each file
- Look for tables and bullet points for quick info

### For Deep Dives
- Read full sections in order
- Follow cross-references between docs
- Review code examples and diagrams

### For Staying Updated
- Check Phase status in project-overview-pdr.md
- Review development commands in codebase-summary.md
- Keep code standards reference handy

## Contributing to Documentation

**When to update documentation:**
1. After completing a phase (update phase status)
2. When adding new collections (update system-architecture.md)
3. When changing code standards (update code-standards.md)
4. When modifying infrastructure (update INFRASTRUCTURE-SETUP-COMPLETE.md)

**How to keep docs accurate:**
- Verify against actual codebase
- Update version numbers when dependencies change
- Add new patterns to code-standards.md as they emerge
- Keep timeline synced with actual progress

## Questions?

**For technical questions:**
- Check code-standards.md for coding rules
- Check system-architecture.md for system design
- Check codebase-summary.md for file locations

**For project questions:**
- Check project-overview-pdr.md for scope/timeline
- Check MVP-PROJECT-PLAN.md for detailed plan
- Check INFRASTRUCTURE-SETUP-COMPLETE.md for setup details

## Related Resources

- **GitHub:** https://github.com (repository)
- **Vercel:** https://vercel.com (deployment)
- **Payload CMS:** https://payloadcms.com (CMS docs)
- **Next.js:** https://nextjs.org (framework docs)
- **Tailwind CSS:** https://tailwindcss.com (styling docs)

---

**Documentation Version:** 1.0
**Last Updated:** January 13, 2026
**Next Review:** January 27, 2026 (end of Phase 02)
