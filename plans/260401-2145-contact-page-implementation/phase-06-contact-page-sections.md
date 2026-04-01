# Phase 6: Contact Page & Sections

**Priority:** High | **Effort:** L | **Status:** Complete
**Depends on:** Phase 2 (translations), Phase 5 (form component)

## Overview

Create the contact page and all section components. Server component page with client form.

## Related Files
- **Reference:** `apps/web/app/(site)/[locale]/(frontend)/about-us/page.tsx`
- **Create:** `apps/web/app/(site)/[locale]/(frontend)/contact/page.tsx`
- **Create:** `apps/web/components/contact/contact-hero-section.tsx`
- **Create:** `apps/web/components/contact/contact-info-section.tsx`
- **Create:** `apps/web/components/contact/contact-quick-links.tsx`
- **Create:** `apps/web/components/contact/contact-trust-strip.tsx`

## Section Details

### 1. Hero Section (`contact-hero-section.tsx`)
- Full-width background image (Stockholm/Sweden heritage)
- Dark navy overlay `#1E3A5FCC`
- Desktop: height ~350px, heading Playfair 48px, subtitle Inter 18px, max-width 680px
- Mobile: height 280px, heading 32px, subtitle 15px
- Nav is handled by existing `<Header />` component

### 2. Form + Info Section (in `page.tsx`)
- Desktop: 2-column layout, gap 48px, padding `80px 120px`, bg `#FAFAF8`
- Mobile: stacked, padding `32px 20px`
- Left: `<ContactForm />` (Phase 5)
- Right: `<ContactInfoSection />`

### 3. Contact Info Section (`contact-info-section.tsx`)
- Title: "Contact Information" Playfair 28px (desktop) / 24px (mobile)
- Subtitle: "We typically respond within 24 hours." Inter 15px muted
- Info items with lucide icons (gold `#C4A052`):
  - Mail icon + email
  - Phone icon + phone
  - MapPin icon + address
  - Timer icon + hours
- Social section: Instagram, Facebook, LinkedIn buttons (gold bg `#C4A05220`, round 44px)
- **[VALIDATED]** Static map image (Stockholm screenshot), rounded 16px, height 200px desktop / 180px mobile

### 4. Quick Links Section (`contact-quick-links.tsx`)
- Desktop: bg `#F5F5F3`, padding `80px 120px`
- Header: "HOW CAN WE HELP?" gold label, "Quick Links" Playfair 36px, subtitle
- Desktop: 3 cards in row, gap 24px
- Mobile: stacked cards, compact with arrow
- Each desktop card: white, rounded 24px, shadow, padding 32px
  - Icon box (navy 56px rounded 12px + white lucide icon)
  - Gold divider bar (40x3px)
  - Title: Playfair 22px
  - Description: Inter 14px muted
  - Link: coral text + arrow icon
- Mobile cards: horizontal row layout with icon, text, and chevron-right
- **[VALIDATED]** "For Tour Guides" card links to `/contact?subject=partnership` (same page, pre-selects subject)

### 5. Trust Strip (`contact-trust-strip.tsx`)
- Desktop: navy bg `#1E3A5F`, horizontal, 4 items with dividers, padding `32px 120px`
- Mobile: 2x2 grid, padding `32px 20px`
- Each item: circle icon (white bg 15% opacity, gold lucide icon) + title + subtitle
- Icons: zap, globe, shield-check, star

## Page Structure (`page.tsx`)

```tsx
export default async function ContactPage({ params }) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'contact' })

  return (
    <>
      <Header />
      <main>
        <ContactHeroSection />
        <section className="bg-[#FAFAF8]">
          {/* 2-col desktop, stacked mobile */}
          <div className="mx-auto max-w-7xl px-5 py-20 md:px-[120px] md:py-20">
            <div className="flex flex-col gap-12 lg:flex-row lg:gap-12">
              <div className="flex-1">
                <ContactForm />
              </div>
              <div className="w-full lg:w-[420px]">
                <ContactInfoSection />
              </div>
            </div>
          </div>
        </section>
        <ContactQuickLinks />
        <ContactTrustStrip />
      </main>
      <Footer />
    </>
  )
}
```

## SEO
- `generateMetadata()` with `generatePageMetadata()`
- `<WebPageSchema>` structured data
- Breadcrumb: Home > Contact

## Todo
- [ ] Create page route with metadata
- [ ] Create hero section component
- [ ] Create contact info section component
- [ ] Create quick links section component
- [ ] Create trust strip section component
- [ ] Verify desktop layout matches design
- [ ] Verify mobile layout matches design
- [ ] Add WebPageSchema
