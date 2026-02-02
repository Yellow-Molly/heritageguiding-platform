# Bokun Booking Widget Research Report

**Date:** 2026-01-31 | **Focus:** Frontend Integration Strategy

---

## Executive Summary

Bokun provides **iframe-based booking widgets** with loader script injection. Supports multiple embed types (calendar, button, product list, product page). No native React SDK; integration via DOM manipulation or custom wrapper component. Customizable via CSS/theme settings. Checkout flow: embedded or redirect-based.

---

## 1. Widget Embed Options

### Script + Container Method (Standard)
```html
<!-- Add to <head> (once per page) -->
<script type="text/javascript"
  src="https://widgets.bokun.io/assets/javascripts/apps/build/BokunWidgetsLoader.js?bookingChannelUUID={UUID}"
  async></script>

<!-- Place in body where widget renders -->
<div class="bokunWidget"
  data-src="https://widgets.bokun.io/online-sales/{bookingChannelUUID}/experience-calendar/{experienceId}">
</div>
```

### Widget Types Available
- **Calendar**: Date picker + checkout in iframe
- **Button**: Opens booking modal/window
- **Product List**: Gallery view (images, price, duration, description)
- **Product Page**: Full experience detail + integrated booking
- **Gift Cards**: Digital products for resale

---

## 2. React/Next.js Integration

### Option A: Custom Wrapper Component (Recommended)
```tsx
// components/bokun-widget.tsx
export function BokunWidget({ experienceId, bookingChannelUUID }) {
  useEffect(() => {
    // Load script once
    const script = document.createElement('script');
    script.src = `https://widgets.bokun.io/assets/javascripts/apps/build/BokunWidgetsLoader.js?bookingChannelUUID=${bookingChannelUUID}`;
    script.async = true;
    document.head.appendChild(script);

    // Trigger widget render
    return () => script.remove();
  }, [bookingChannelUUID]);

  return (
    <div className="bokunWidget"
      data-src={`https://widgets.bokun.io/online-sales/${bookingChannelUUID}/experience-calendar/${experienceId}`}
    />
  );
}
```

### Option B: Script in Layout (Simpler)
Add loader script once in `layout.tsx`/`_document`:
```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <script
          src={`https://widgets.bokun.io/assets/javascripts/apps/build/BokunWidgetsLoader.js?bookingChannelUUID=${process.env.NEXT_PUBLIC_BOKUN_UUID}`}
          async
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

---

## 3. Customization Options

### Theme Customization
**Admin Panel:** Sales Tools > Booking Widgets > Theme
- Primary/secondary colors
- Logo display
- Font family (CSS-based)
- Border radius, spacing

### CSS Override (Advanced)
Apply custom CSS to override Bokun defaults:
```css
/* Override widget styles */
.bokunWidget {
  /* Bokun loads styles via iframe - limited CSS override */
}
```

### Checkout Configuration
- **Payment Methods:** Full payment, deposit + arrival, deposit-only
- **Promo Codes:** Enable customer code entry
- **Gift Cards:** Support for gift card payments
- **Questions:** Custom customer data collection
- **Branding:** Show/hide company logo

---

## 4. Checkout Flow Options

### Embedded Iframe (Recommended)
- Booking + checkout in single iframe
- Stays on your domain
- Better UX (no redirect)
- Widget handles payment processing
- Redirect on success optional

### Redirect to Bokun Hosted Page
- Opens separate booking.bokun.io domain
- Less flexible but simpler integration
- Callback URL for post-booking actions

### Hybrid Approach
- Embed calendar/browsing
- Redirect only for checkout (if needed)
- Control via Bokun admin settings

---

## 5. Implementation Architecture

### Data Flow
```
Tour Detail Page → BokunWidget Component
    ↓
Widget loads iframe from Bokun
    ↓
User selects date → Availability fetched (Bokun API)
    ↓
Checkout form appears in iframe
    ↓
Payment processed (Bokun handles)
    ↓
Success page OR redirect back to site
```

### File Structure for Next.js
```
apps/web/
├── components/
│   └── bokun-widget.tsx         # Wrapper component
├── app/
│   ├── [locale]/
│   │   └── tours/
│   │       └── [slug]/
│   │           └── page.tsx      # Uses BokunWidget
│   └── api/
│       └── bokun/
│           └── config.ts         # UUID constants
└── lib/
    └── bokun/
        └── utils.ts              # Helper functions
```

---

## 6. Best Practices

1. **Single Script Load:** Add loader once in root layout, not per-component
2. **ENV Variables:** Store `bookingChannelUUID` in `.env.local`
3. **Error Handling:** Check if `window.BokunWidgets` exists before rendering
4. **Responsive:** Widget auto-responds to container width (mobile-friendly)
5. **Accessibility:** Bokun widget handles ARIA labels; test with screen readers
6. **Performance:** Script is async; non-blocking to page load
7. **Multi-experience:** Use `data-src` to specify different experiences per widget instance
8. **i18n:** Widget language based on Bokun dashboard config; coordinate with next-intl

---

## 7. Integration Checklist

- [ ] Obtain `bookingChannelUUID` from Bokun dashboard
- [ ] Add environment variable: `NEXT_PUBLIC_BOKUN_UUID`
- [ ] Create BokunWidget wrapper component
- [ ] Add loader script to root layout
- [ ] Implement on tour detail pages
- [ ] Test calendar, date selection, checkout flow
- [ ] Customize theme colors in Bokun admin
- [ ] Test mobile responsiveness
- [ ] Verify i18n language switching
- [ ] Set up post-booking success page

---

## 8. Potential Challenges & Solutions

| Challenge | Solution |
|-----------|----------|
| **No official React SDK** | Build thin wrapper component using useEffect |
| **Limited CSS override** | Use Bokun admin theme settings; accept design constraints |
| **Script loading timing** | Load in layout.tsx; check `window.BokunWidgets` |
| **Multi-language support** | Coordinate Bokun language config with next-intl |
| **Testing iframes** | Use data-testid; Cypress/Playwright iframe selectors |

---

## References

- [Bokun Docs: Embed Experience Widget](https://docs.bokun.io/docs/widgets-and-online-sales/how-to-embed-widgets-to-your-website/how-to-embed-an-experience-booking-widget-pro)
- [Bokun API Documentation](https://bokun.dev/)
- [Bokun Checkout Setup](https://docs.bokun.io/docs/widgets-and-online-sales/booking-widgets/how-to-set-up-the-check-out-widget)

---

## Unresolved Questions

1. Does Bokun webhook support for booking confirmations exist? (Need API investigation)
2. Real-time availability sync mechanism? (Check Bokun API polling vs webhooks)
3. Pricing tier API access? (May require paid tier)
4. Multi-currency support in checkout? (Check Bokun payment settings)
5. Custom confirmation email template? (Admin portal vs API)
