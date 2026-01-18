# Phase 05.5: Static Pages (FAQ, About Us, Terms, Privacy)

## Context Links

- [MVP Project Plan v1.2](../../docs/MVP-PROJECT-PLAN.md)
- [Data Models](./phase-03-data-models-cms-schema.md)
- [Homepage](./phase-05-homepage.md)

## Overview

| Priority | Status | Effort |
|----------|--------|--------|
| P1 - Critical | pending | 6-10h |

Create essential trust-building and informational static pages: FAQ with accordion UI, About Us with team section, Terms & Conditions, and Privacy Policy. All pages CMS-managed and localized (SV/EN/DE).

## Key Insights

- FAQ page needs FAQPage schema.org markup for SEO
- About Us builds trust - crucial for conversion
- Pages collection in Payload CMS for content management
- Accordion component for FAQ (shadcn/ui)
- All content localized in SV/EN/DE

## Requirements

### Functional

**FAQ Page (`/faq`)**
- Accordion-style Q&A component
- Categories: Booking, Tours, Payment, Cancellation, Accessibility
- Minimum 15-20 questions populated
- Schema.org FAQPage markup
- Available in SV/EN/DE

**About Us Page (`/about-us`)**
- Company story and mission
- Team/founder section with photos
- Expert credentials showcase
- Why choose us / Our values
- Partnership opportunities section

**Terms & Conditions (`/terms`)** *(Validated: Use template, lawyer reviews post-launch)*
- Legal terms template
- Booking terms
- Cancellation policy
- Liability disclaimers

**Privacy Policy (`/privacy`)** *(Validated: Use template, lawyer reviews post-launch)*
- GDPR compliant
- Cookie policy
- Data handling procedures
- User rights

### Non-Functional
- SSR for SEO
- Mobile responsive
- WCAG 2.1 AA accessible
- Fast load times (no heavy assets)

## Architecture

### Page Structure

```
/[locale]/faq
├── Header with breadcrumb
├── Page title
├── FAQ categories (tabs or sections)
│   ├── Booking & Reservations
│   ├── Payment & Pricing
│   ├── Cancellation & Changes
│   ├── Tour Experience
│   ├── COVID-19 & Safety
│   └── About Our Guides
├── Accordion Q&A items
└── Contact CTA

/[locale]/about-us
├── Header with breadcrumb
├── Hero section
│   ├── Headline + subtitle
│   └── Hero image
├── Our Story section
├── What Makes Us Different (4-6 points)
├── Meet Our Team
│   └── Team member cards
├── Certifications & Partnerships
├── Our Commitment section
└── Contact CTA
```

## Related Code Files

### Create
- `apps/web/app/[locale]/faq/page.tsx` - FAQ page
- `apps/web/app/[locale]/about-us/page.tsx` - About Us page
- `apps/web/app/[locale]/terms/page.tsx` - Terms page
- `apps/web/app/[locale]/privacy/page.tsx` - Privacy page
- `apps/web/components/pages/faq-accordion.tsx` - FAQ accordion
- `apps/web/components/pages/team-section.tsx` - Team cards
- `apps/web/components/pages/values-section.tsx` - Values grid
- `apps/web/components/seo/faq-schema.tsx` - FAQPage schema
- `apps/web/lib/api/get-page-by-slug.ts` - Page fetcher

### Modify
- `messages/sv.json` - Swedish translations
- `messages/en.json` - English translations
- `messages/de.json` - German translations
- `apps/web/components/layout/footer.tsx` - Add page links

## Implementation Steps

1. **Create Static Page Route (Dynamic)**
   ```typescript
   // apps/web/app/[locale]/[slug]/page.tsx
   import { notFound } from 'next/navigation'
   import { getTranslations } from 'next-intl/server'
   import { getPageBySlug } from '@/lib/api/get-page-by-slug'
   import { RichText } from '@/components/shared/rich-text'

   export default async function StaticPage({
     params: { locale, slug }
   }) {
     const page = await getPageBySlug(slug, locale)
     if (!page) notFound()

     return (
       <main className="container py-12">
         <h1 className="text-4xl font-bold">{page.title}</h1>
         <RichText content={page.content} className="prose mt-6" />
       </main>
     )
   }

   export async function generateMetadata({ params: { locale, slug } }) {
     const page = await getPageBySlug(slug, locale)
     if (!page) return {}
     return {
       title: page.metaTitle || page.title,
       description: page.metaDescription
     }
   }
   ```

2. **Create FAQ Page with Custom Layout**
   ```typescript
   // apps/web/app/[locale]/faq/page.tsx
   import { getTranslations } from 'next-intl/server'
   import { FAQAccordion } from '@/components/pages/faq-accordion'
   import { FAQSchema } from '@/components/seo/faq-schema'
   import { getPageBySlug } from '@/lib/api/get-page-by-slug'

   // FAQ data structure (from CMS or hardcoded initially)
   const faqCategories = [
     {
       category: 'booking',
       questions: [
         { q: 'How do I book a tour?', a: 'You can book directly through our website...' },
         { q: 'Can I book for a group?', a: 'Yes, we offer group bookings for 10+ people...' },
         // ... more questions
       ]
     },
     // ... more categories
   ]

   export default async function FAQPage({ params: { locale } }) {
     const t = await getTranslations('faq')
     const page = await getPageBySlug('faq', locale)

     return (
       <>
         <FAQSchema faqs={faqCategories.flatMap(c => c.questions)} />
         <main className="container py-12">
           <h1 className="text-4xl font-bold">{t('title')}</h1>
           <p className="mt-4 text-muted-foreground">{t('subtitle')}</p>

           <div className="mt-10 space-y-8">
             {faqCategories.map((category) => (
               <section key={category.category}>
                 <h2 className="text-2xl font-semibold mb-4">
                   {t(`categories.${category.category}`)}
                 </h2>
                 <FAQAccordion faqs={category.questions} />
               </section>
             ))}
           </div>

           <div className="mt-12 text-center">
             <p>{t('stillHaveQuestions')}</p>
             <Button asChild className="mt-4">
               <Link href="/contact">{t('contactUs')}</Link>
             </Button>
           </div>
         </main>
       </>
     )
   }
   ```

3. **Create FAQ Accordion Component**
   ```typescript
   // apps/web/components/pages/faq-accordion.tsx
   'use client'

   import {
     Accordion,
     AccordionContent,
     AccordionItem,
     AccordionTrigger
   } from '@/components/ui/accordion'

   interface FAQ {
     q: string
     a: string
   }

   export function FAQAccordion({ faqs }: { faqs: FAQ[] }) {
     return (
       <Accordion type="single" collapsible className="w-full">
         {faqs.map((faq, index) => (
           <AccordionItem key={index} value={`item-${index}`}>
             <AccordionTrigger className="text-left">
               {faq.q}
             </AccordionTrigger>
             <AccordionContent>
               {faq.a}
             </AccordionContent>
           </AccordionItem>
         ))}
       </Accordion>
     )
   }
   ```

4. **Create FAQ Schema Markup**
   ```typescript
   // apps/web/components/seo/faq-schema.tsx
   import { JsonLd } from './json-ld'

   interface FAQ {
     q: string
     a: string
   }

   export function FAQSchema({ faqs }: { faqs: FAQ[] }) {
     const schema = {
       '@context': 'https://schema.org',
       '@type': 'FAQPage',
       mainEntity: faqs.map((faq) => ({
         '@type': 'Question',
         name: faq.q,
         acceptedAnswer: {
           '@type': 'Answer',
           text: faq.a
         }
       }))
     }

     return <JsonLd data={schema} />
   }
   ```

5. **Create About Us Page**
   ```typescript
   // apps/web/app/[locale]/about-us/page.tsx
   import { getTranslations } from 'next-intl/server'
   import { TeamSection } from '@/components/pages/team-section'
   import { ValuesSection } from '@/components/pages/values-section'
   import Image from 'next/image'

   export default async function AboutPage({ params: { locale } }) {
     const t = await getTranslations('about')

     return (
       <main>
         {/* Hero */}
         <section className="relative h-[40vh] min-h-[300px]">
           <Image
             src="/images/about-hero.jpg"
             alt={t('heroAlt')}
             fill
             className="object-cover"
           />
           <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
             <div className="text-center text-white">
               <h1 className="text-4xl font-bold">{t('title')}</h1>
               <p className="mt-2 text-xl">{t('subtitle')}</p>
             </div>
           </div>
         </section>

         {/* Our Story */}
         <section className="container py-12">
           <h2 className="text-3xl font-bold">{t('story.title')}</h2>
           <div className="prose mt-4 max-w-none">
             <p>{t('story.paragraph1')}</p>
             <p>{t('story.paragraph2')}</p>
           </div>
         </section>

         {/* What Makes Us Different */}
         <ValuesSection />

         {/* Meet Our Team */}
         <TeamSection />

         {/* Certifications */}
         <section className="bg-muted py-12">
           <div className="container">
             <h2 className="text-3xl font-bold text-center">{t('certifications.title')}</h2>
             <div className="mt-8 flex flex-wrap justify-center gap-8">
               {/* Certification logos */}
             </div>
           </div>
         </section>
       </main>
     )
   }
   ```

6. **Create Team Section Component**
   ```typescript
   // apps/web/components/pages/team-section.tsx
   import Image from 'next/image'
   import { useTranslations } from 'next-intl'
   import { Card, CardContent } from '@/components/ui/card'

   const team = [
     {
       name: 'Dr. [Name]',
       role: 'Founder & Lead Historian',
       image: '/images/team/founder.jpg',
       credentials: ['PhD Medieval History', 'Uppsala University'],
       bio: 'about.team.founder.bio'
     }
     // ... more team members
   ]

   export function TeamSection() {
     const t = useTranslations('about.team')

     return (
       <section className="container py-12">
         <h2 className="text-3xl font-bold text-center">{t('title')}</h2>
         <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
           {team.map((member) => (
             <Card key={member.name}>
               <div className="relative aspect-square">
                 <Image
                   src={member.image}
                   alt={member.name}
                   fill
                   className="object-cover rounded-t-lg"
                 />
               </div>
               <CardContent className="p-6">
                 <h3 className="text-xl font-semibold">{member.name}</h3>
                 <p className="text-muted-foreground">{member.role}</p>
                 <div className="mt-2 flex flex-wrap gap-2">
                   {member.credentials.map((cred) => (
                     <span key={cred} className="text-xs bg-muted px-2 py-1 rounded">
                       {cred}
                     </span>
                   ))}
                 </div>
                 <p className="mt-4 text-sm">{t(member.bio)}</p>
               </CardContent>
             </Card>
           ))}
         </div>
       </section>
     )
   }
   ```

7. **Create Values Section Component**
   ```typescript
   // apps/web/components/pages/values-section.tsx
   import { useTranslations } from 'next-intl'
   import { GraduationCap, Globe, Accessibility, Building, Users, Leaf } from 'lucide-react'

   const values = [
     { icon: GraduationCap, key: 'expertise' },
     { icon: Globe, key: 'multilingual' },
     { icon: Accessibility, key: 'accessibility' },
     { icon: Building, key: 'heritage' },
     { icon: Users, key: 'smallGroups' },
     { icon: Leaf, key: 'sustainable' }
   ]

   export function ValuesSection() {
     const t = useTranslations('about.values')

     return (
       <section className="bg-muted py-12">
         <div className="container">
           <h2 className="text-3xl font-bold text-center">{t('title')}</h2>
           <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
             {values.map(({ icon: Icon, key }) => (
               <div key={key} className="flex gap-4 p-4 bg-background rounded-lg">
                 <Icon className="h-8 w-8 text-primary flex-shrink-0" />
                 <div>
                   <h3 className="font-semibold">{t(`${key}.title`)}</h3>
                   <p className="text-sm text-muted-foreground">{t(`${key}.description`)}</p>
                 </div>
               </div>
             ))}
           </div>
         </div>
       </section>
     )
   }
   ```

8. **Create Page Data Fetcher**
   ```typescript
   // apps/web/lib/api/get-page-by-slug.ts
   import { getPayload } from 'payload'
   import config from '@payload-config'

   export async function getPageBySlug(slug: string, locale: string) {
     const payload = await getPayload({ config })
     const { docs } = await payload.find({
       collection: 'pages',
       where: { slug: { equals: slug } },
       locale,
       limit: 1
     })
     return docs[0] || null
   }
   ```

9. **Add Translation Strings**
   ```json
   // messages/en.json (add to existing)
   {
     "faq": {
       "title": "Frequently Asked Questions",
       "subtitle": "Find answers to common questions about our tours",
       "categories": {
         "booking": "Booking & Reservations",
         "payment": "Payment & Pricing",
         "cancellation": "Cancellation & Changes",
         "experience": "Tour Experience",
         "safety": "COVID-19 & Safety",
         "guides": "About Our Guides"
       },
       "stillHaveQuestions": "Still have questions?",
       "contactUs": "Contact Us"
     },
     "about": {
       "title": "About Heritage Guiding",
       "subtitle": "Where History Comes Alive",
       "heroAlt": "Heritage Guiding team",
       "story": {
         "title": "Our Story",
         "paragraph1": "Heritage Guiding was founded...",
         "paragraph2": "Our mission is to transform tourism..."
       },
       "values": {
         "title": "What Makes Us Different",
         "expertise": {
           "title": "PhD-Level Expertise",
           "description": "Tours led by professional historians and scholars"
         }
         // ... more values
       },
       "team": {
         "title": "Meet Our Team"
       },
       "certifications": {
         "title": "Our Certifications & Partnerships"
       }
     }
   }
   ```

10. **Update Footer with Page Links**
    ```typescript
    // apps/web/components/layout/footer.tsx
    const footerLinks = {
      company: [
        { href: '/about-us', label: 'About Us' },
        { href: '/contact', label: 'Contact' }
      ],
      support: [
        { href: '/faq', label: 'FAQ' },
        { href: '/group-booking', label: 'Group Bookings' }
      ],
      legal: [
        { href: '/terms', label: 'Terms & Conditions' },
        { href: '/privacy', label: 'Privacy Policy' }
      ]
    }
    ```

## Todo List

- [ ] Create FAQ page with accordion UI
- [ ] Create FAQ accordion component
- [ ] Create FAQSchema markup component
- [ ] Create About Us page with hero
- [ ] Create TeamSection component
- [ ] Create ValuesSection component
- [ ] Create Terms page (basic template)
- [ ] Create Privacy page (GDPR compliant)
- [ ] Create getPageBySlug API function
- [ ] Add Swedish translations (faq, about)
- [ ] Add English translations (faq, about)
- [ ] Add German translations (faq, about)
- [ ] Update footer with page links
- [ ] Populate FAQ content (min 20 questions)
- [ ] Add team member content and photos
- [ ] Test all pages in 3 locales
- [ ] Verify FAQPage schema validates

## Success Criteria

- [ ] FAQ page with accordion UI working
- [ ] FAQ has minimum 20 questions
- [ ] About Us page with team section and mission
- [ ] All pages available in SV/EN/DE
- [ ] Pages linked from footer and header
- [ ] FAQPage schema markup validates
- [ ] Mobile responsive design
- [ ] Accessibility compliant (keyboard navigation)

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| FAQ content not ready | Medium | Medium | Start with 10 questions, expand later |
| Team photos unavailable | Medium | Low | Use placeholder images |
| Legal text needs review | High | Medium | Use template, finalize with lawyer |

## Security Considerations

- Sanitize CMS content before rendering
- Validate page slugs
- No sensitive data exposed on static pages

## Next Steps

After completion:
1. Proceed to [Phase 06: Tour Catalog](./phase-06-tour-catalog.md)
2. Ensure footer links work
3. Content team populates FAQ and About content
