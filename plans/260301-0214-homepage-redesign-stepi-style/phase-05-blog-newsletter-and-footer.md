# Phase 05 - Blog Posts, Newsletter Signup, Footer Updates

## Context Links
- [Research Report](research/researcher-01-reference-site-design.md)
- [Current Footer](../../apps/web/components/layout/footer.tsx)
- [Design Guidelines](../../docs/design-guidelines.md)

## Overview
- **Priority:** P2
- **Status:** complete
- **Effort:** 1.5h
- **Description:** Two NEW sections (blog preview + newsletter signup) and minor footer styling updates. Blog cards are placeholder/hardcoded; newsletter is a simple email form.

## Key Insights
- Stepi blog section: 3 article cards with image, title, excerpt, "Read more" link
- Stepi newsletter: light background, centered layout, email input + submit button
- No blog CMS collection exists yet; use hardcoded placeholder data with TODO for CMS
- Newsletter can submit to a simple API route or external service (Mailchimp, etc.)
- Footer already exists and is functional; only minor visual alignment needed

## Requirements

### Blog / Latest Posts (NEW)
- Section heading: "Latest from Our Blog" (i18n)
- 3 article cards: image top, title, short excerpt (2 lines), "Read More" link
- Desktop: 3-column grid. Tablet: 2+1 stacked. Mobile: single column
- Cards: `rounded-2xl`, subtle shadow, no heavy overlays
- Hardcoded data with placeholder Stockholm travel content
- Links point to `#` or `/blog/{slug}` (pages don't exist yet)

### Newsletter Signup (NEW)
- Light gray background section
- Centered layout: heading, short description, email input + submit button inline
- Mobile: input and button stack vertically
- Form submission: prevent default, show success message (client-side only for now)
- Email validation: HTML5 `type="email"` + `required`
- TODO: integrate with email service (Mailchimp, SendGrid, etc.)

### Footer Updates (MINOR)
- No structural changes; minor tweaks only
- Ensure color consistency with new lighter overall palette
- Add i18n for any remaining hardcoded English strings (noted in agent memory)

## Architecture

### Blog Card Structure
```
<article> (rounded-2xl, bg-white, shadow-card, overflow-hidden)
  <div> (aspect-[16/9], relative)
    <Image> (fill, object-cover)
  <div> (p-5)
    <span> (text-xs, uppercase, accent - category tag)
    <h3> (font-serif, text-lg, mt-2 - title)
    <p> (text-sm, muted, line-clamp-2, mt-2 - excerpt)
    <Link> (text-sm, accent, mt-3, inline-flex - "Read More" + arrow)
```

### Blog Section Structure
```
<section> (bg-white, py-20)
  <div> (container)
    <div> (section header: label + H2 + subtitle)
    <div> (grid md:grid-cols-2 lg:grid-cols-3, gap-8)
      {posts.map(post => <BlogCard />)}
```

### Newsletter Structure
```
<section> (bg-[var(--color-background-alt)], py-16)
  <div> (container, max-w-2xl, mx-auto, text-center)
    <h2> (font-serif, text-2xl md:text-3xl)
    <p> (muted, mt-2)
    <form> (mt-6, flex flex-col sm:flex-row, gap-3)
      <input> (type="email", flex-1, rounded-lg, border, px-4, py-3)
      <button> (primary button, whitespace-nowrap)
    <p> (text-xs, muted, mt-3 - privacy note)
```

## Related Code Files

### CREATE
- `apps/web/components/home/blog-card.tsx` - individual blog card (~50 LOC)
- `apps/web/components/home/blog-section.tsx` - blog grid section (~80 LOC)
- `apps/web/components/home/newsletter-signup.tsx` - email form section (~90 LOC)

### MODIFY
- `apps/web/components/home/index.ts` - add BlogSection, NewsletterSignup exports
- `apps/web/messages/en.json` - add `home.blog.*`, `home.newsletter.*`
- `apps/web/messages/sv.json` - same
- `apps/web/messages/de.json` - same

### NO CHANGES (for now)
- `apps/web/components/layout/footer.tsx` - keep as-is; footer i18n is a separate task

## Implementation Steps

1. **Add i18n keys** to all 3 message files:
   ```json
   "blog": {
     "label": "Our Blog",
     "title": "Latest from Our Blog",
     "subtitle": "Travel tips, Stockholm stories, and heritage insights",
     "readMore": "Read More",
     "category": {
       "tips": "Travel Tips",
       "history": "History",
       "culture": "Culture"
     }
   },
   "newsletter": {
     "title": "Subscribe for Travel Tips",
     "subtitle": "Get Stockholm travel insights and exclusive tour offers delivered to your inbox.",
     "placeholder": "Enter your email address",
     "submit": "Subscribe",
     "privacy": "We respect your privacy. Unsubscribe at any time.",
     "success": "Thank you for subscribing!",
     "error": "Something went wrong. Please try again."
   }
   ```

2. **Create `blog-card.tsx`** (~50 LOC):
   - Props: `title`, `excerpt`, `image`, `imageAlt`, `category`, `slug`
   - Clean card: image (aspect-16/9), category tag, title, excerpt (line-clamp-2), "Read More"
   - Use `ArrowRight` icon from lucide-react on hover
   - Card hover: shadow lift via `hover:shadow-[var(--shadow-card-hover)]`

3. **Create `blog-section.tsx`** (~80 LOC):
   - Hardcoded blog data (3 posts):
     - "Top 10 Hidden Gems in Gamla Stan" (Travel Tips)
     - "The Story Behind Stockholm's Royal Palace" (History)
     - "Swedish Fika: A Cultural Tradition" (Culture)
   - Section header with label + H2 + subtitle
   - 3-col grid desktop, 2-col tablet, 1-col mobile
   - IntersectionObserver for fade-in
   - TODO comment for CMS blog collection integration

4. **Create `newsletter-signup.tsx`** (~90 LOC):
   - `'use client'` with `useState` for email, submitted, error states
   - Form with `onSubmit` handler:
     - Prevent default
     - Basic email validation (HTML5 `type="email"` handles most)
     - Set submitted state to show success message
     - TODO: API route integration for actual email subscription
   - Input: `rounded-lg border border-[var(--color-border)] px-4 py-3`
   - Button: `getButtonClassName('primary', 'lg')`
   - Success state: replace form with thank-you message
   - Privacy note below form in small muted text
   - Accessible: `aria-label` on input, `aria-live="polite"` on status message

5. **Update barrel export** `index.ts`:
   - Add: `export { BlogSection } from './blog-section'`
   - Add: `export { BlogCard } from './blog-card'`
   - Add: `export { NewsletterSignup } from './newsletter-signup'`

6. **Verify build** compiles

## Todo List
- [x] Add blog + newsletter i18n keys to en/sv/de
- [x] Create blog-card.tsx
- [x] Create blog-section.tsx with 3 hardcoded posts
- [x] Create newsletter-signup.tsx with email form
- [x] Update barrel export in index.ts
- [x] Verify all files under 200 LOC
- [x] Verify build compiles

## Success Criteria
- 3 blog cards render in responsive grid
- Cards show image, category, title, excerpt, "Read More" link
- Newsletter form captures email and shows success message
- Mobile: blog cards stack, newsletter input/button stack
- Desktop: 3-col blog grid, inline newsletter form
- All 3 locales render correctly
- No console errors or hydration mismatches

## Risk Assessment
- **Low:** Blog data is hardcoded placeholder; no CMS dependency
- **Low:** Newsletter form is client-only; no backend integration yet
- **Medium:** Blog links point to nonexistent pages; use `href="#"` or `/blog` landing
- **Low:** Newsletter success state is ephemeral (resets on navigation); acceptable for MVP

## Security Considerations
- Newsletter email: validated client-side via HTML5; no server submission yet
- When API route is added later: sanitize input, rate-limit, CSRF protection
- Blog links: no user-generated content, safe static hrefs
- No PII collected or stored in this phase

## Next Steps
- Phase 06: Responsive polish, page.tsx assembly, i18n review, test updates
