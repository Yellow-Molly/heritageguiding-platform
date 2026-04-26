# Phase 1: Page Route & i18n

## Context Links
- Design spec: `plans/260412-1736-guide-details-redesign/` (design system reference)
- Privacy page pattern: `apps/web/app/(site)/[locale]/(frontend)/privacy/page.tsx`
- Footer: `apps/web/components/layout/footer.tsx` (line 23)
- Messages: `apps/web/messages/{en,sv,de}.json`

## Overview
- **Priority:** High (blocks Phase 2)
- **Status:** Pending
- **Effort:** 1h
- Create route, add `cancellation` i18n namespace to all 3 locales, update footer link, wire SEO metadata.

## Key Insights
- Footer currently links to `/help/cancellation` but no `/help/` route group exists. Use `/cancellation` to match `/privacy`, `/terms` convention.
- Privacy page is 133 LOC — cancellation page.tsx will be shorter since sections extracted to components.
- Breadcrumb component exists at `components/shared/breadcrumb.tsx` (client component, accepts `items[]`).
- Existing `cancellation` keys already in messages under `faq.cancellation` and `terms.cancellation` — new namespace must be separate root-level `cancellation` key.

## Requirements

### Functional
- Route: `apps/web/app/(site)/[locale]/(frontend)/cancellation/page.tsx`
- Server component using `getTranslations({ locale, namespace: 'cancellation' })`
- SEO: `generateMetadata` with `generatePageMetadata({ title, description, locale, pathname: '/cancellation' })`
- Structured data: `WebPageSchema` with name, description, url
- Compose 6 section components (created in Phase 2); Phase 1 can use placeholder divs

### Non-functional
- Page.tsx under 100 LOC (composition only)
- Zero hardcoded user-facing strings

## Architecture

```
page.tsx (server component)
  -> getTranslations('cancellation')
  -> passes t('hero.title'), t('tiers.card1.title'), etc. as props
  -> imports Header, Footer, WebPageSchema
  -> imports 6 section components from @/components/cancellation
```

## Related Code Files

### Modify
| File | Change |
|------|--------|
| `apps/web/messages/en.json` | Add `cancellation` namespace (~80 keys) |
| `apps/web/messages/sv.json` | Add `cancellation` namespace (Swedish) |
| `apps/web/messages/de.json` | Add `cancellation` namespace (German) |
| `apps/web/components/layout/footer.tsx` | Change `/help/cancellation` -> `/cancellation` |

### Create
| File | Purpose |
|------|---------|
| `apps/web/app/(site)/[locale]/(frontend)/cancellation/page.tsx` | Route + composition |

## Implementation Steps

1. **Add i18n keys to `en.json`** — Add root-level `"cancellation"` object with nested groups:
   - `meta`: title, description
   - `hero`: title, subtitle, breadcrumbHome, breadcrumbCurrent
   - `tiers`: sectionTag, title, subtitle, card1 (title, timeframe, description), card2, card3
   - `stepper`: title, subtitle, step1 (title, description), step2, step3
   - `prose`: title, block1 (title, content), block2, block3, block4
   - `trust`: title, item1 (label), item2, item3
   - `cta`: title, subtitle, buttonText, email, phone

2. **Add i18n keys to `sv.json`** — Swedish translations for all keys above.

3. **Add i18n keys to `de.json`** — German translations for all keys above.

4. **Create `cancellation/page.tsx`** — Follow privacy page pattern:
   ```tsx
   export async function generateMetadata({ params }) { ... }
   export default async function CancellationPage({ params }) {
     const { locale } = await params
     const t = await getTranslations({ locale, namespace: 'cancellation' })
     return (
       <>
         <WebPageSchema ... />
         <Header />
         <main>
           <CancellationHero ... />
           <CancellationTiers ... />
           <CancellationStepper ... />
           <CancellationProse ... />
           <CancellationTrustBanner ... />
           <CancellationCta ... />
         </main>
         <Footer />
       </>
     )
   }
   ```

5. **Update footer link** — In `footer.tsx` line 23, change `href: '/help/cancellation'` to `href: '/cancellation'`.

6. **Verify** — `npm run build` to confirm route compiles. Check all 3 locales load.

## i18n Content (English)

All text from design spec — key content for translation reference:

- Hero title: "Cancellation Policy"
- Hero subtitle: "We believe in transparent, fair policies. Review our cancellation terms below."
- Tier 1: "Full Refund" / "48+ hours before tour" / "Cancel more than 48 hours before your scheduled tour for a complete refund to your original payment method."
- Tier 2: "50% Partial Refund" / "24-48 hours before tour" / "Cancellations made 24-48 hours before the tour receive a 50% refund."
- Tier 3: "Non-Refundable" / "Under 24 hours / no-show" / "Cancellations within 24 hours or no-shows are non-refundable as guides and logistics are fully committed."
- Steps: "Submit Request" / "Confirmation" / "Refund Processed"
- Prose blocks: Standard Terms, Group Bookings, Weather/Force Majeure, Refund Timeline
- Trust: "Free Rebooking", "24h Response", "No Hidden Fees"
- CTA: "Questions About Our Policy?" / "Get in Touch" / hello@privatetours.se / +46 8 123 456

## Todo
- [ ] Add `cancellation` namespace to en.json
- [ ] Add `cancellation` namespace to sv.json
- [ ] Add `cancellation` namespace to de.json
- [ ] Create cancellation/page.tsx route
- [ ] Update footer link href
- [ ] Build verification passes

## Success Criteria
- `/{locale}/cancellation` returns 200 for en, sv, de
- `generateMetadata` produces correct title/description per locale
- Footer "Cancellation Policy" link navigates to `/cancellation`
- No build errors

## Risk Assessment
| Risk | Mitigation |
|------|-----------|
| Large i18n JSON causes merge conflicts | Append at end of file, use dedicated namespace |
| Swedish/German translations inaccurate | Mark for human review, use professional quality |

## Security Considerations
- Static page, no user input, no data mutations — minimal surface area.

## Next Steps
- Phase 2: Build the 6 section components with design-accurate styling.
