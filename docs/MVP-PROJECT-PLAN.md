# MVP PROJECT PLAN
## HeritageGuiding Platform - AI-First Tourism Booking Platform

**Document Version:** 1.2 (Enhanced Schema: Logistics, Inclusions, Audience Tags)  
**Date:** January 15, 2026  
**Status:** Final - Updated with Co-Founder Feedback

---

## Executive Summary

This document outlines the detailed scope, timeline, and deliverables for the Minimum Viable Product (MVP) of the HeritageGuiding platform (formerly Stockholm Tours). The MVP represents a production-ready, AI-first booking platform designed to consolidate the fragmented tourism market through technical superiority and superior user experience.

### Project Overview

| Aspect | Details |
|--------|---------|
| **Total Development Time** | 310-372 hours (10-12 weeks) |
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
| **📄 Static Pages** | **FAQ and About Us pages with CMS-managed content (NEW)** |

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

**Time Estimate:** 28-32 hours *(+8 hours for enhanced schema + static pages)*

**Core Collections:**
- **Tours:** title, description, pricing, duration, **logistics (meeting point + coordinates), inclusions/exclusions, audience tags**, accessibility, expert info
- **Guides/Experts:** credentials, bio, photo, tours
- **Categories:** themes, neighborhoods
- **Reviews:** rating, text, date, tour reference
- **Media:** images with alt text, captions
- **Neighborhoods:** name, coordinates, city relationship (for GEO expansion)
- **📄 Pages:** Static pages for FAQ, About Us, Terms, Privacy

---

### **Enhanced Tours Collection Schema** ⭐ UPDATED

```typescript
// Payload CMS Collection: Tours (Enhanced Schema)
{
  slug: 'tours',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'price', 'duration', 'status']
  },
  fields: [
    // ========================================
    // BASIC INFORMATION
    // ========================================
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true // SV/EN/DE
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL-friendly identifier'
      }
    },
    {
      name: 'description',
      type: 'richText',
      required: true,
      localized: true,
      admin: {
        description: 'Full tour description with emotional + factual layers'
      }
    },
    {
      name: 'shortDescription',
      type: 'textarea',
      required: true,
      localized: true,
      maxLength: 160,
      admin: {
        description: 'Brief summary for cards and meta descriptions'
      }
    },
    {
      name: 'highlights',
      type: 'array',
      localized: true,
      fields: [
        {
          name: 'highlight',
          type: 'text'
        }
      ],
      admin: {
        description: 'Key tour highlights (3-5 bullet points)'
      }
    },

    // ========================================
    // PRICING & DURATION
    // ========================================
    {
      name: 'pricing',
      type: 'group',
      fields: [
        {
          name: 'basePrice',
          type: 'number',
          required: true,
          admin: {
            description: 'Base price in SEK per person'
          }
        },
        {
          name: 'currency',
          type: 'select',
          defaultValue: 'SEK',
          options: [
            { label: 'SEK', value: 'SEK' },
            { label: 'EUR', value: 'EUR' },
            { label: 'USD', value: 'USD' }
          ]
        },
        {
          name: 'priceType',
          type: 'select',
          required: true,
          options: [
            { label: 'Per Person', value: 'per_person' },
            { label: 'Per Group', value: 'per_group' },
            { label: 'Custom', value: 'custom' }
          ]
        },
        {
          name: 'groupDiscount',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Offer group discount for 4+ people?'
          }
        },
        {
          name: 'childPrice',
          type: 'number',
          admin: {
            description: 'Price for children (if different)'
          }
        }
      ]
    },
    {
      name: 'duration',
      type: 'group',
      fields: [
        {
          name: 'hours',
          type: 'number',
          required: true,
          admin: {
            description: 'Duration in hours (e.g., 2.5)'
          }
        },
        {
          name: 'durationText',
          type: 'text',
          localized: true,
          admin: {
            description: 'E.g., "2-3 hours", "Half day", "Full day"'
          }
        }
      ]
    },

    // ========================================
    // 🆕 LOGISTICS / MEETING POINT
    // ========================================
    {
      name: 'logistics',
      type: 'group',
      label: 'Logistics & Meeting Point',
      fields: [
        {
          name: 'meetingPointName',
          type: 'text',
          required: true,
          localized: true,
          admin: {
            description: 'E.g., "By the statue of St George", "Stortorget Square fountain"'
          }
        },
        {
          name: 'meetingPointAddress',
          type: 'text',
          localized: true,
          admin: {
            description: 'Full address for clarity'
          }
        },
        {
          name: 'coordinates',
          type: 'point', // Payload's built-in geolocation field
          required: true,
          admin: {
            description: 'Precise location for maps (Lat/Long)'
          }
          // Stores as: { latitude: 59.325, longitude: 18.070 }
        },
        {
          name: 'googleMapsLink',
          type: 'text',
          admin: {
            description: 'Optional Google Maps link for direct navigation'
          }
        },
        {
          name: 'meetingPointInstructions',
          type: 'textarea',
          localized: true,
          admin: {
            description: 'Detailed instructions: "Look for guide with red umbrella"'
          }
        },
        {
          name: 'endingPoint',
          type: 'text',
          localized: true,
          admin: {
            description: 'Where does the tour end? (if different from start)'
          }
        },
        {
          name: 'parkingInfo',
          type: 'textarea',
          localized: true,
          admin: {
            description: 'Parking instructions if applicable'
          }
        },
        {
          name: 'publicTransportInfo',
          type: 'textarea',
          localized: true,
          admin: {
            description: 'Nearest metro/bus/tram station'
          }
        }
      ]
    },

    // ========================================
    // 🆕 INCLUSIONS & EXCLUSIONS
    // ========================================
    {
      name: 'included',
      type: 'array',
      label: 'What\'s Included',
      localized: true,
      fields: [
        {
          name: 'item',
          type: 'text',
          required: true
        }
      ],
      admin: {
        description: 'E.g., "Private Guide", "Entrance Fees", "Coffee & Pastries"'
      }
    },
    {
      name: 'notIncluded',
      type: 'array',
      label: 'What\'s NOT Included',
      localized: true,
      fields: [
        {
          name: 'item',
          type: 'text',
          required: true
        }
      ],
      admin: {
        description: 'E.g., "Lunch", "Transportation to meeting point", "Gratuities"'
      }
    },
    {
      name: 'whatToBring',
      type: 'array',
      label: 'What to Bring',
      localized: true,
      fields: [
        {
          name: 'item',
          type: 'text'
        }
      ],
      admin: {
        description: 'E.g., "Comfortable shoes", "Water bottle", "Camera"'
      }
    },

    // ========================================
    // 🆕 CONCIERGE TAGS / SUITABILITY
    // ========================================
    {
      name: 'targetAudience',
      type: 'select',
      hasMany: true, // Multi-select
      label: 'Target Audience (Concierge Wizard)',
      options: [
        { label: '👨‍👩‍👧‍👦 Family Friendly', value: 'family_friendly' },
        { label: '💑 Couples', value: 'couples' },
        { label: '🏢 Corporate', value: 'corporate' },
        { label: '👴 Seniors', value: 'seniors' },
        { label: '📚 History Nerds', value: 'history_nerds' },
        { label: '📸 Photography', value: 'photography' },
        { label: '🎨 Art Lovers', value: 'art_lovers' },
        { label: '🍷 Food & Wine', value: 'food_wine' },
        { label: '⚡ Adventure Seekers', value: 'adventure' },
        { label: '🏛️ Architecture Enthusiasts', value: 'architecture' }
      ],
      admin: {
        description: 'Who is this tour perfect for? (Used in Homepage Wizard)'
      }
    },
    {
      name: 'difficultyLevel',
      type: 'select',
      options: [
        { label: 'Easy (Mostly flat, minimal walking)', value: 'easy' },
        { label: 'Moderate (Some hills, 2-4km walking)', value: 'moderate' },
        { label: 'Challenging (Stairs, 5km+ walking)', value: 'challenging' }
      ],
      admin: {
        description: 'Physical difficulty level'
      }
    },
    {
      name: 'ageRecommendation',
      type: 'group',
      fields: [
        {
          name: 'minimumAge',
          type: 'number',
          admin: {
            description: 'Minimum recommended age (or 0 for all ages)'
          }
        },
        {
          name: 'childFriendly',
          type: 'checkbox',
          defaultValue: false
        },
        {
          name: 'teenFriendly',
          type: 'checkbox',
          defaultValue: false
        }
      ]
    },

    // ========================================
    // ACCESSIBILITY
    // ========================================
    {
      name: 'accessibility',
      type: 'group',
      fields: [
        {
          name: 'wheelchairAccessible',
          type: 'checkbox',
          defaultValue: false
        },
        {
          name: 'mobilityNotes',
          type: 'textarea',
          localized: true,
          admin: {
            description: 'Details about stairs, terrain, etc.'
          }
        },
        {
          name: 'hearingAssistance',
          type: 'checkbox',
          defaultValue: false
        },
        {
          name: 'visualAssistance',
          type: 'checkbox',
          defaultValue: false
        },
        {
          name: 'serviceAnimalsAllowed',
          type: 'checkbox',
          defaultValue: true
        }
      ]
    },

    // ========================================
    // RELATIONSHIPS
    // ========================================
    {
      name: 'guide',
      type: 'relationship',
      relationTo: 'guides',
      required: true,
      admin: {
        description: 'Primary guide/expert for this tour'
      }
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      admin: {
        description: 'Themes: Viking History, Medieval Stockholm, etc.'
      }
    },
    {
      name: 'neighborhoods',
      type: 'relationship',
      relationTo: 'neighborhoods',
      hasMany: true,
      admin: {
        description: 'Locations: Gamla Stan, Södermalm, etc.'
      }
    },
    {
      name: 'images',
      type: 'array',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true
        },
        {
          name: 'caption',
          type: 'text',
          localized: true
        },
        {
          name: 'isPrimary',
          type: 'checkbox',
          defaultValue: false
        }
      ],
      admin: {
        description: 'Tour images (first one used as featured)'
      }
    },

    // ========================================
    // BOOKING & AVAILABILITY
    // ========================================
    {
      name: 'rezdyProductId',
      type: 'text',
      admin: {
        description: 'Rezdy product ID for booking integration'
      }
    },
    {
      name: 'availability',
      type: 'select',
      defaultValue: 'available',
      options: [
        { label: '✅ Available', value: 'available' },
        { label: '⏰ Seasonal', value: 'seasonal' },
        { label: '📅 By Request', value: 'by_request' },
        { label: '❌ Unavailable', value: 'unavailable' }
      ]
    },
    {
      name: 'maxGroupSize',
      type: 'number',
      admin: {
        description: 'Maximum number of participants'
      }
    },
    {
      name: 'minGroupSize',
      type: 'number',
      defaultValue: 1,
      admin: {
        description: 'Minimum number to run the tour'
      }
    },

    // ========================================
    // SEO & METADATA
    // ========================================
    {
      name: 'metaTitle',
      type: 'text',
      localized: true,
      admin: {
        description: 'SEO title (leave blank to auto-generate from title)'
      }
    },
    {
      name: 'metaDescription',
      type: 'textarea',
      localized: true,
      maxLength: 160,
      admin: {
        description: 'SEO meta description'
      }
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Show on homepage as featured tour?'
      }
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: '📝 Draft', value: 'draft' },
        { label: '✅ Published', value: 'published' },
        { label: '🗄️ Archived', value: 'archived' }
      ]
    }
  ]
}
```

---

### **Static Pages Collection**

```typescript
// Payload CMS Collection: Pages
{
  slug: 'pages',
  admin: {
    useAsTitle: 'title'
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true // SV/EN/DE
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      admin: {
        description: 'e.g., "about-us", "faq", "terms"'
      }
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      localized: true
    },
    {
      name: 'metaTitle',
      type: 'text',
      localized: true
    },
    {
      name: 'metaDescription',
      type: 'textarea',
      localized: true
    },
    {
      name: 'showInFooter',
      type: 'checkbox',
      defaultValue: true
    },
    {
      name: 'showInHeader',
      type: 'checkbox',
      defaultValue: false
    },
    {
      name: 'pageType',
      type: 'select',
      options: [
        { label: 'About Us', value: 'about' },
        { label: 'FAQ', value: 'faq' },
        { label: 'Terms', value: 'terms' },
        { label: 'Privacy', value: 'privacy' },
        { label: 'Contact', value: 'contact' }
      ]
    }
  ]
}
```

---

### **Neighborhoods Collection** (New for GEO)

```typescript
// Payload CMS Collection: Neighborhoods
{
  slug: 'neighborhoods',
  admin: {
    useAsTitle: 'name'
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true // "Gamla Stan" / "Old Town" / "Altstadt"
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true
    },
    {
      name: 'city',
      type: 'relationship',
      relationTo: 'cities',
      required: true
    },
    {
      name: 'description',
      type: 'richText',
      localized: true
    },
    {
      name: 'coordinates',
      type: 'point', // Center point of neighborhood
      admin: {
        description: 'Approximate center of neighborhood'
      }
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media'
    }
  ]
}
```

---

**Acceptance Criteria:**
- ✅ Tours collection includes **logistics fields** (meeting point name, coordinates, Google Maps link)
- ✅ Tours collection includes **inclusions/exclusions arrays** (what's included, what's not)
- ✅ Tours collection includes **targetAudience multi-select** (Family, Couples, Corporate, Seniors, History Nerds, etc.)
- ✅ Static pages collection created with full localization
- ✅ Neighborhoods collection created for GEO expansion
- ✅ All fields editable in SV/EN/DE
- ✅ Schema validates and migrations run successfully
- ✅ Meeting point coordinates integrate with Google Maps
- ✅ Excel import template matches new schema structure

---

### Phases 4-8: Core Platform Development (Weeks 3-5)

| Phase | Hours | Key Deliverables |
|-------|-------|------------------|
| **4. Design System** | 32-36 | Tailwind config, components library, UX designer handoff integration |
| **5. Homepage** | 28-32 | Hero, featured tours, **Concierge Wizard ("Who are you?") using audience tags**, trust signals, language switcher, responsive design, footer with FAQ/About links |
| **6. Tour Catalog** | 24-28 | Tour grid/list views, filters (theme, price, duration, accessibility, **audience**), search, sorting |
| **7. Tour Details** | 32-36 | Emotional + factual content layers, gallery, expert bio, reviews, **logistics section with interactive map**, **inclusions/exclusions display**, booking CTA |
| **8. Rezdy Integration** | 24-28 | API integration, availability sync, booking widget embedding, payment flow |

**Phase 5 Update: Homepage Enhancement**

**Added Deliverables:**
- Footer component with links to FAQ, About Us, Terms, Privacy
- Navigation menu integration for About Us page
- Trust signals section referencing About Us content

**Time Adjustment:** +4 hours (20-24h → 24-28h)

---

### 📄 NEW: Phase 5.5: Static Pages (Week 4)

**Time Estimate:** 6-10 hours

**Purpose:** Create essential trust-building and informational pages

**Deliverables:**

1. **FAQ Page** (`/faq`)
   - Accordion-style Q&A component
   - Categories: Booking, Tours, Payment, Cancellation, Accessibility
   - Minimum 15-20 questions populated
   - Schema.org FAQPage markup
   - Available in SV/EN/DE

2. **About Us Page** (`/about-us`)
   - Company story and mission
   - Team/founder section with photos
   - Expert credentials showcase
   - Why choose us / Our values
   - Partnership opportunities section
   - Available in SV/EN/DE

3. **Terms & Conditions** (`/terms`)
   - Legal terms template
   - Booking terms
   - Cancellation policy
   - Liability disclaimers

4. **Privacy Policy** (`/privacy`)
   - GDPR compliant
   - Cookie policy
   - Data handling procedures
   - User rights

**Technical Implementation:**

```typescript
// app/[locale]/[slug]/page.tsx
export default async function StaticPage({ params }) {
  const page = await payload.findOne({
    collection: 'pages',
    where: { slug: { equals: params.slug } },
    locale: params.locale
  })
  
  return (
    <div className="container py-12">
      <h1>{page.title}</h1>
      <RichText content={page.content} />
    </div>
  )
}
```

**FAQ Component:**

```typescript
// components/FAQAccordion.tsx
import { Accordion, AccordionItem } from '@/components/ui/accordion'

export function FAQAccordion({ faqs }) {
  return (
    <Accordion type="single" collapsible>
      {faqs.map((faq, index) => (
        <AccordionItem key={index} value={`item-${index}`}>
          <AccordionTrigger>{faq.question}</AccordionTrigger>
          <AccordionContent>{faq.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
```

**FAQ Schema Markup:**

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How do I book a tour?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "You can book directly through our website..."
      }
    }
  ]
}
```

**Acceptance Criteria:**
- FAQ page with accordion UI working smoothly
- About Us page with team section and mission
- All pages available in SV/EN/DE
- Pages linked from footer and header (where appropriate)
- FAQPage schema markup validates
- Mobile responsive design
- Accessibility compliant (keyboard navigation)

---

| Phase | Hours | Key Deliverables |
|-------|-------|------------------|
| **4. Design System** | 32-36 | Tailwind config, components library, UX designer handoff integration |
| **5. Homepage** | 28-32 | Hero, featured tours, **Concierge Wizard ("Who are you?") using audience tags**, trust signals, language switcher, responsive design, footer with FAQ/About links |
| **6. Tour Catalog** | 24-28 | Tour grid/list views, filters (theme, price, duration, accessibility, **audience**), search, sorting |
| **7. Tour Details** | 32-36 | Emotional + factual content layers, gallery, expert bio, reviews, **logistics section with interactive map**, **inclusions/exclusions display**, booking CTA |
| **8. Rezdy Integration** | 24-28 | API integration, availability sync, booking widget embedding, payment flow |

---

### 🆕 Phase 8.5: Concierge Wizard (Week 5)

**Time Estimate:** 8-12 hours

**Purpose:** AI-powered tour recommendation wizard on homepage using audience tags

**Deliverables:**

1. **Homepage Wizard Component**
   - Multi-step wizard interface: "Who are you?" → "What interests you?" → Results
   - Uses `targetAudience` tags from Tours collection
   - Smart filtering based on selections
   - Mobile-friendly interface
   - Available in SV/EN/DE

2. **Wizard Flow:**
   ```
   Step 1: "Who are you?"
   ├── 👨‍👩‍👧‍👦 Traveling with family
   ├── 💑 Couple's getaway
   ├── 🏢 Corporate/Team building
   ├── 👴 Senior travelers
   └── 📚 Solo history enthusiast
   
   Step 2: "What interests you?"
   ├── 🏛️ History & Heritage
   ├── 🎨 Art & Culture
   ├── 🍷 Food & Wine
   ├── 📸 Photography
   └── ⚡ Adventure
   
   Step 3: Results
   └── Personalized tour recommendations
   ```

3. **Technical Implementation:**

```typescript
// components/ConciergeWizard.tsx
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export function ConciergeWizard() {
  const [step, setStep] = useState(1)
  const [audience, setAudience] = useState<string[]>([])
  const [interests, setInterests] = useState<string[]>([])

  const handleAudienceSelect = (value: string) => {
    setAudience([...audience, value])
    setStep(2)
  }

  const handleSearch = async () => {
    // Query tours matching audience + interests
    const tours = await fetch('/api/tours/recommend', {
      method: 'POST',
      body: JSON.stringify({ 
        audience, 
        interests 
      })
    }).then(r => r.json())
    
    // Show results
    setStep(3)
  }

  return (
    <div className="wizard-container">
      {step === 1 && (
        <div>
          <h2>Who are you traveling with?</h2>
          <div className="grid grid-cols-2 gap-4">
            <Card onClick={() => handleAudienceSelect('family_friendly')}>
              <span>👨‍👩‍👧‍👦</span>
              <p>Family</p>
            </Card>
            <Card onClick={() => handleAudienceSelect('couples')}>
              <span>💑</span>
              <p>Couple</p>
            </Card>
            {/* More options... */}
          </div>
        </div>
      )}
      
      {step === 2 && (
        <div>
          <h2>What are you interested in?</h2>
          {/* Interest selection */}
          <Button onClick={handleSearch}>
            Find Perfect Tours
          </Button>
        </div>
      )}
      
      {step === 3 && (
        <div>
          <h2>Perfect tours for you</h2>
          {/* Tour cards */}
        </div>
      )}
    </div>
  )
}
```

4. **API Endpoint:**

```typescript
// app/api/tours/recommend/route.ts
export async function POST(request: Request) {
  const { audience, interests } = await request.json()
  
  const tours = await payload.find({
    collection: 'tours',
    where: {
      and: [
        {
          targetAudience: {
            in: audience
          }
        },
        {
          categories: {
            in: interests
          }
        },
        {
          status: {
            equals: 'published'
          }
        }
      ]
    },
    limit: 6,
    sort: '-featured'
  })
  
  return Response.json(tours.docs)
}
```

5. **Premium UX Features:**
   - Smooth animations between steps
   - Progress indicator
   - "Go back" functionality
   - Results show matching percentage
   - Option to refine search
   - Save preferences to localStorage

**Acceptance Criteria:**
- ✅ Wizard appears on homepage above fold
- ✅ All audience tags from schema work in wizard
- ✅ Results filter correctly based on selections
- ✅ Mobile responsive (works on phones)
- ✅ Available in all three languages
- ✅ Smooth transitions between steps
- ✅ Analytics tracking for wizard usage

---

### Phases 9-13: Advanced Features (Weeks 6-8)

| Phase | Hours | Key Deliverables |
|-------|-------|------------------|
| **9. Group Bookings** | 12-14 | Inquiry form with validation, email notifications, admin interface |
| **10. WhatsApp** | 8-10 | Floating button, click-to-chat functionality, localized messages |
| **11. Accessibility** | 16-20 | WCAG 2.1 AA compliance: keyboard nav, ARIA labels, focus management, skip links |
| **12. SEO Foundation** | 12-16 | Meta tags, OpenGraph, sitemap, robots.txt, Google Business integration |
| **13. Schema.org** | 14-16 | TouristAttraction, Person (experts), Organization, **FAQPage markup (NEW)** |

**Phase 13 Update:**
- Add FAQPage schema markup for FAQ page
- Add AboutPage schema for About Us page

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

### Site Structure

```
heritageguiding.com/
├── /                          # Homepage
├── /tours                     # Tour catalog
├── /tours/[slug]              # Tour details
├── /guides                    # Guide profiles
├── /about-us                  # About page (NEW)
├── /faq                       # FAQ page (NEW)
├── /terms                     # Terms & conditions (NEW)
├── /privacy                   # Privacy policy (NEW)
├── /contact                   # Contact page
└── /[country]/[city]          # Geographic pages
    ├── /sweden/stockholm
    ├── /sweden/gothenburg
    └── /sweden/malmo
```

---

## FAQ Page Content Structure

### Recommended FAQ Categories & Questions

#### 1. **Booking & Reservations (5-6 questions)**
- How do I book a tour?
- Can I book for a group?
- How far in advance should I book?
- Do I need to print my booking confirmation?
- Can I make changes to my booking?
- What happens if I'm late to the meeting point?

#### 2. **Payment & Pricing (4-5 questions)**
- What payment methods do you accept?
- Are prices per person or per group?
- Are there discounts for students/seniors/children?
- Do prices include entrance fees?
- What is your refund policy?

#### 3. **Cancellation & Changes (3-4 questions)**
- What is your cancellation policy?
- Can I reschedule my tour?
- What happens if the tour is cancelled due to weather?
- Do you offer refunds?

#### 4. **Tour Experience (5-6 questions)**
- How long do tours typically last?
- What languages are tours available in?
- Are tours wheelchair accessible?
- What should I bring/wear?
- Are children allowed on tours?
- Do you provide private tours?

#### 5. **COVID-19 & Safety (2-3 questions)**
- What safety measures are in place?
- What is your mask policy?
- What are group size limits?

#### 6. **About Our Guides (3-4 questions)**
- Who are your tour guides?
- What qualifications do your guides have?
- Can I request a specific guide?
- Do guides accept tips?

**Total:** 22-28 questions minimum for MVP

### FAQ Schema Implementation

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How do I book a tour?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "You can book tours directly through our website by selecting your desired tour, choosing a date and time, and completing the secure checkout process. You'll receive instant confirmation via email."
      }
    },
    {
      "@type": "Question",
      "name": "What is your cancellation policy?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "We offer free cancellation up to 24 hours before the tour start time. Cancellations within 24 hours are subject to a 50% fee. No-shows are non-refundable."
      }
    }
  ]
}
```

---

## About Us Page Content Structure

### Recommended About Us Sections

#### 1. **Hero Section**
- Compelling headline: "Heritage Guiding: Where History Comes Alive"
- Subtitle: "Expert-led cultural tours across Europe's most historic destinations"
- Hero image: Team photo or iconic tour location

#### 2. **Our Story** (300-400 words)
- How the company was founded
- Mission: "To transform tourism through expert storytelling and authentic experiences"
- Vision: "Making cultural heritage accessible to curious travelers worldwide"
- Values: Authenticity, Expertise, Sustainability, Inclusivity

#### 3. **What Makes Us Different**
4-6 key differentiators:
- 🎓 **PhD-Level Expertise** - Tours led by professional historians and scholars
- 🌍 **Multilingual Excellence** - Tours in Swedish, English, German (French coming)
- ♿ **Accessibility First** - WCAG 2.1 AA compliant, wheelchair-accessible tours
- 🏛️ **UNESCO Heritage Focus** - Deep dives into World Heritage Sites
- 👥 **Small Groups** - Maximum 8-10 people for personalized experiences
- 💚 **Sustainable Tourism** - Carbon-neutral operations, local partnerships

#### 4. **Meet Our Founders/Team** (2-4 profiles)
For each person:
- Professional photo
- Name & title
- Brief bio (100-150 words)
- Credentials (PhD, certifications)
- Specialization (Medieval history, Viking age, etc.)
- Fun fact or personal passion

Example:
```markdown
### Dr. [Name], Founder & Lead Historian
PhD in Medieval Scandinavian History from Uppsala University. [Name] has spent 
15 years researching Stockholm's medieval past and has led over 500 tours through 
Gamla Stan. Published author of "The Hidden Stories of Old Town Stockholm."

**Specializations:** Medieval history, UNESCO World Heritage Sites, Viking Age
**Languages:** Swedish, English, German, Latin
**Fun fact:** Discovered a 14th-century artifact during a tour in 2019
```

#### 5. **Our Certifications & Partnerships**
- Licensed Tour Operator (Swedish Tourism Authority)
- UNESCO Heritage Partner
- Member of European Tour Operators Association
- TripAdvisor Certificate of Excellence
- Certified Accessible Tourism Provider

#### 6. **Our Commitment** (3-4 points)
- Environmental sustainability
- Supporting local communities
- Preserving cultural heritage
- Inclusive & accessible tourism
- Continuous guide training

#### 7. **Join Our Team** (Optional)
- "Interested in becoming a guide?"
- Link to careers page or contact form
- Requirements: PhD/MA in relevant field, language skills

#### 8. **Press & Media** (Optional)
- "As featured in..."
- Logos of media outlets
- Selected press mentions

#### 9. **Contact CTA**
- "Have questions? We'd love to hear from you"
- Link to contact form or email
- Business hours & response time

### About Us Schema Markup

```json
{
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "name": "About Heritage Guiding",
  "description": "Learn about our mission to transform tourism through expert-led cultural heritage tours",
  "mainEntity": {
    "@type": "Organization",
    "name": "Heritage Guiding",
    "foundingDate": "2025",
    "founder": {
      "@type": "Person",
      "name": "[Founder Name]",
      "jobTitle": "Founder & Lead Historian",
      "hasCredential": "PhD in Medieval Scandinavian History"
    }
  }
}
```

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
- ✅ **FAQ page displays with accordion UI and is available in all languages (NEW)**
- ✅ **About Us page displays with team section and mission (NEW)**

### Technical Requirements

- ✅ WCAG 2.1 Level AA compliance verified via automated and manual testing
- ✅ All pages achieve 90+ Lighthouse scores (Performance, Accessibility, SEO)
- ✅ Schema.org markup validates without errors on schema.org validator
- ✅ **FAQPage schema markup validates for FAQ page (NEW)**
- ✅ Mobile responsive design works on iOS Safari, Android Chrome, tablet devices
- ✅ Cross-browser compatibility verified on Chrome, Firefox, Safari, Edge (latest versions)
- ✅ Production deployment is stable with zero critical errors
- ✅ SSL certificate configured, HTTPS working correctly

### Content Requirements

- ✅ Minimum 5 tours populated with complete content (all languages)
- ✅ Expert/guide profiles for each tour with credentials and photos
- ✅ High-quality tour images (minimum 3 per tour)
- ✅ Sample reviews populated for social proof
- ✅ **FAQ page with minimum 20 questions answered (NEW)**
- ✅ **About Us page with founder/team bios and mission statement (NEW)**

---

## Project Timeline & Milestones

### Weekly Milestones

| Week | Deliverable |
|------|-------------|
| **1-2** | Foundation complete: Dev environment, i18n, CMS configured, data models defined, **static pages collection (NEW)** |
| **3-5** | Core platform: Homepage, tour catalog, tour details, Rezdy integration functional, **FAQ & About Us pages completed (NEW)** |
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
- FAQ updates based on customer questions

---

## Updated Time Estimates

### Original MVP Hours:
- **Total:** 292-350 hours

### Updated MVP Hours (v1.1 - FAQ & About Us):
- **Phase 3:** +4 hours (Static pages collection)
- **Phase 5:** +4 hours (Footer & navigation integration)
- **Phase 5.5:** +6-10 hours (FAQ & About Us page development)
- **Phase 13:** +2 hours (FAQPage schema markup)
- **Subtotal:** 302-364 hours

### Updated MVP Hours (v1.2 - Enhanced Schema + Concierge Wizard):
- **Phase 3:** +4 hours (Enhanced Tours schema: logistics, inclusions, audience tags)
- **Phase 5:** +4 hours (Concierge Wizard integration)
- **Phase 7:** +4 hours (Logistics map + inclusions display)
- **Phase 8.5:** +8-12 hours (Concierge Wizard development)

**New Total:** 310-372 hours (10-12 weeks)

**Still achievable in 12-week timeline** with proper planning and parallel development.

---

## Schema Enhancement Summary

### What Changed in v1.2:

**1. Logistics / Meeting Point** *(Co-founder feedback)*
- ✅ Meeting point name (localized)
- ✅ Coordinates (lat/long) - Required for maps
- ✅ Google Maps link (optional)
- ✅ Meeting point instructions
- ✅ Ending point information
- ✅ Parking & public transport info

**2. Inclusions / Exclusions** *(Co-founder feedback)*
- ✅ What's included (array)
- ✅ What's NOT included (array)
- ✅ What to bring (array)
- ✅ All localized for SV/EN/DE

**3. Target Audience / Concierge Tags** *(Co-founder feedback)*
- ✅ Multi-select audience tags
- ✅ Options: Family, Couples, Corporate, Seniors, History Nerds, Photography, Art, Food & Wine, Adventure, Architecture
- ✅ Powers the "Concierge Wizard" on homepage
- ✅ Enhanced filtering in tour catalog

**4. Additional Enhancements:**
- ✅ Difficulty level (Easy/Moderate/Challenging)
- ✅ Age recommendations
- ✅ Enhanced accessibility fields
- ✅ Group size limits (min/max)
- ✅ Seasonal availability

### Why These Changes Matter:

**For Premium Feel:**
- Structured inclusions/exclusions → Transparency & trust
- Precise meeting coordinates → Professional logistics
- Audience tags → Personalized recommendations

**For AI/Maps:**
- Lat/long coordinates → Google Maps integration
- Structured data → Better Schema.org markup
- Concierge wizard → AI-powered recommendations

**For Excel Import:**
- Co-founder can now populate the schema correctly from day 1
- All required fields documented
- Clear structure for bulk import

---

## Risk Management & Contingencies

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Scope creep** | Timeline extends beyond 12 weeks | Strict adherence to defined MVP scope; defer nice-to-have features to post-launch |
| **Rezdy API issues** | Booking functionality delayed or incomplete | Early Rezdy integration testing (Week 3); fallback to basic inquiry forms if needed |
| **UX design delays** | Design system phase takes longer than expected | Begin with shadcn/ui defaults; customize as designer assets become available |
| **Content not ready** | Tour descriptions, images not provided in time | Use placeholder content for development; CMS allows easy updates post-launch |
| **Browser compatibility** | Unexpected issues on specific browsers | Testing starts early (Week 9); modern stack minimizes compatibility issues |
| **FAQ content creation** | Writing 20+ FAQs takes longer than expected | Start with 10 most common questions; expand post-launch based on customer inquiries |

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
- **Review FAQ questions being added (NEW)**

### Ongoing Communication

- **Primary:** Email or Slack for quick questions/updates
- **Response time:** Within 4 hours during weekdays for urgent issues
- **Staging environment:** Accessible 24/7 for review of work-in-progress
- **Documentation:** Shared Google Doc or Notion for decisions and notes

### Deliverable Reviews

Major deliverables will be presented for review with 48-hour feedback window:

- Design system (end of Week 3)
- Homepage (end of Week 4)
- **FAQ & About Us pages (end of Week 4) - NEW**
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
- **FAQ page engagement:** Time on page, scroll depth (NEW)

### SEO & Discoverability Metrics

- **Google indexing:** All pages indexed within 2 weeks
- **Rich snippets:** Schema.org markup showing in search results
- **Local SEO:** Google Business Profile integration active
- **Core Web Vitals:** All metrics in 'Good' range
- **FAQ page ranking:** Track rankings for "stockholm tours faq", "[brand] frequently asked questions" (NEW)

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
- **FAQ content drafted by Week 3 (at least 10 questions) - NEW**
- **About Us content & team photos provided by Week 3 - NEW**

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
- **Team photos for About Us page - NEW**
- **Legal review of Terms & Privacy pages - NEW**

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
- **Live Chat Support:** Real-time customer support widget
- **Dynamic FAQ:** Auto-suggest FAQs based on user behavior

**Estimated Post-MVP Development:** 50-150 hours depending on feature priority

---

## Summary & Next Steps

This MVP Project Plan outlines a comprehensive, production-ready HeritageGuiding platform deliverable in **12 weeks** with **310-372 hours** of development effort. The platform will be AI-first, multilingual, fully accessible, integrated with professional booking infrastructure through Rezdy, **includes essential trust-building pages (FAQ & About Us), and features enhanced schema with logistics, inclusions, and audience tags for the Concierge Wizard**.

### Key Commitments

- **Timeline:** MVP launched within 12 weeks of project start
- **Quality:** WCAG 2.1 AA compliant, 90+ Lighthouse scores, production-ready code
- **Communication:** Weekly syncs, 4-hour response time for urgent issues
- **Documentation:** CMS user guide, technical docs, deployment procedures
- **Post-Launch:** 3-month stabilization period with ongoing support
- **Content:** FAQ & About Us pages included from day one for credibility
- **Premium UX:** Enhanced schema with precise logistics, structured inclusions, and AI-powered Concierge Wizard

### Immediate Next Steps

1. **Review & Approval:** Review this updated plan and provide feedback within 48 hours
2. **Shareholder Agreement:** Finalize and sign legal agreements
3. **Rezdy Setup:** Create account and provide API access
4. **Hosting Accounts:** Set up Vercel, database, email service
5. **Schedule Kickoff:** Book first weekly sync meeting
6. **Start Development:** Begin Phase 1 (Foundation & Setup)
7. **📝 Content Preparation:**
   - Draft FAQ questions (minimum 10 for Week 3)
   - Write About Us content (mission, story, values)
   - Gather team photos and bios
   - Prepare legal text for Terms & Privacy
8. **📊 Excel Template Preparation (NEW):**
   - Create Excel import template matching enhanced schema
   - Include columns for: Logistics (meeting point, coordinates), Inclusions/Exclusions arrays, Audience tags
   - Share template with co-founder for tour data population
   - Co-founder can begin populating tours correctly from day 1

---

## Appendix: FAQ & About Us Content Checklist

### Pre-Development Content Needed

**FAQ Content (Week 3):**
- [ ] 5-6 booking questions written (SV/EN/DE)
- [ ] 4-5 payment questions written (SV/EN/DE)
- [ ] 3-4 cancellation questions written (SV/EN/DE)
- [ ] 5-6 tour experience questions written (SV/EN/DE)
- [ ] 2-3 COVID/safety questions written (SV/EN/DE)
- [ ] 3-4 guide questions written (SV/EN/DE)

**About Us Content (Week 3):**
- [ ] Company mission statement (100 words, SV/EN/DE)
- [ ] Company story (300-400 words, SV/EN/DE)
- [ ] Founder bio & photo
- [ ] 1-3 additional team member bios & photos
- [ ] List of certifications & partnerships
- [ ] Company values (4-6 points)

**Legal Pages (Week 3-4):**
- [ ] Terms & Conditions draft
- [ ] Privacy Policy draft (GDPR compliant)
- [ ] Cookie Policy
- [ ] Legal review completed

**🆕 Tour Data Excel Template (Week 1-2):**
- [ ] Excel template created matching enhanced schema
- [ ] Columns for all required fields:
  - Basic info (title, description, price, duration)
  - Logistics (meeting point name, coordinates lat/long, Google Maps link)
  - Inclusions (what's included - comma-separated)
  - Exclusions (what's NOT included - comma-separated)
  - Audience tags (Family Friendly, Couples, Corporate, Seniors, History Nerds - multi-select)
  - Accessibility info
  - Guide assignment
  - Categories & neighborhoods
- [ ] Template shared with co-founder
- [ ] Co-founder begins populating initial 5-10 tours

### Post-Development Content Updates

**Ongoing FAQ Maintenance:**
- Add new questions based on customer inquiries
- Update answers based on policy changes
- Track which FAQs are most viewed
- A/B test FAQ organization

**About Us Updates:**
- Add team members as company grows
- Update certifications & awards
- Refresh photos annually
- Add customer testimonials
- Update metrics (tours delivered, customers served)

---

*"I'm excited to build this with you. Let's create something exceptional."*

**— Your Technical Partner**

---

**End of Document**

**Document Version History:**
- v1.0 (Dec 28, 2025): Original MVP plan
- v1.1 (Jan 15, 2026): Added FAQ & About Us pages, updated time estimates, added content checklists
- v1.2 (Jan 15, 2026): Enhanced Tours schema with Logistics (meeting point + coordinates), Inclusions/Exclusions, Audience tags; Added Concierge Wizard (Phase 8.5); Updated time to 310-372 hours
