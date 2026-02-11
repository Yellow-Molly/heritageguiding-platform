# Phase 09: Group Bookings + WhatsApp

## Context Links

- [MVP Project Plan](../../docs/MVP-PROJECT-PLAN.md)
- [Tour Details](./phase-07-tour-details.md)
- [Bokun Integration](./phase-08.1-bokun-integration.md)
- [Bokun API Research](./research/researcher-bokun-api.md)

## Overview

| Priority | Status | Effort |
|----------|--------|--------|
| P2 - High | pending | 20-24h |

Build group booking inquiry form for large parties with validation, email notifications, and admin interface. Add WhatsApp click-to-chat floating button with localized messages. Leverages Bokun's native group pricing for smaller groups (via widget) and custom inquiry form for larger groups (20+).

## Key Insights

- **Bokun group pricing**: Supports native group rates via pricing categories (`minPerBooking`/`maxPerBooking` rate settings at product level)
- **Groups <20**: Can book directly via Bokun embedded widget if group rates configured in Bokun dashboard
- **Groups 20+**: Exceed typical widget capacity; need custom inquiry form -> manual quote -> admin creates Bokun booking
- **Tiered pricing**: Bokun supports different rate tiers for different group sizes (configured in dashboard)
- **No "request a quote" API**: Bokun has no dedicated group-quote endpoint; large group inquiries handled offline
- **WhatsApp**: `wa.me` deep links are free, no Business API needed at MVP scale
- **WhatsApp + Bokun**: Not natively integrated; keep WhatsApp as standalone contact channel for MVP

## Requirements

### Functional - Group Bookings
- Group inquiry form with validation (name, email, phone, group size, dates)
- Special requirements textarea (accessibility, dietary, etc.)
- Email to admin with inquiry details (admin creates Bokun booking manually)
- Confirmation email to customer
- Admin interface to view/respond to inquiries
- Tour detail page shows "Request Group Quote" button for groups exceeding Bokun widget capacity

### Functional - WhatsApp
- Floating button (bottom-right, above fold on mobile)
- Click opens WhatsApp with pre-filled message via `wa.me` deep link
- Message localized per current language (SV/EN/DE)
- Dismissable/minimizable
- Mobile opens native app; desktop opens WhatsApp Web

### Non-Functional
- Form accessible (keyboard, screen reader)
- Spam protection (honeypot + rate limit)
- Mobile-friendly form layout
- WhatsApp button doesn't block content

## Architecture

### Group Booking Flow (Two Paths)

```
Tour Detail Page
       |
       ├─── Groups <20 ───> Bokun Widget (standard booking)
       |                     (group rates configured in Bokun dashboard)
       |
       └─── Groups 20+ ────> "Request Group Quote" button
                                    ↓
                             Inquiry form (modal or page)
                                    ↓
                             Form validation (client + server)
                                    ↓
                             Submit to API route
                                    ↓
                             Save to database (GroupInquiries collection)
                                    ↓
                             Send admin notification email
                             (admin quotes + creates Bokun booking manually)
                                    ↓
                             Send customer confirmation email
                                    ↓
                             Display success message
```

**Bokun Dashboard Setup**: Configure group pricing rates per product using `minPerBooking`/`maxPerBooking` in pricing categories. This enables the Bokun widget to accept group bookings up to the configured max.

### WhatsApp Integration

```
Floating Button (bottom-right)
       ↓
Click → wa.me deep link (free, no API needed)
       ↓
https://wa.me/46XXXXXXXXX?text={localized_message}
       ↓
Mobile → native WhatsApp app
Desktop → WhatsApp Web
```

**Implementation choice**: `@digicroz/react-floating-whatsapp` npm package (TypeScript, dark mode, Next.js compatible). WhatsApp number managed via Payload CMS globals.

## Related Code Files

### Create
- `apps/web/app/[locale]/group-booking/page.tsx` - Inquiry page
- `apps/web/components/booking/group-inquiry-form.tsx` - Form component
- `apps/web/components/booking/group-inquiry-modal.tsx` - Modal version (for tour detail page)
- `apps/web/app/api/group-inquiry/route.ts` - Form handler
- `apps/web/lib/email/send-inquiry-notification.ts` - Admin email (Nodemailer + Gmail SMTP)
- `apps/web/lib/email/send-inquiry-confirmation.ts` - Customer email (Nodemailer + Gmail SMTP)
- `apps/web/components/shared/whatsapp-button.tsx` - WhatsApp floating button (@digicroz/react-floating-whatsapp)
- `packages/cms/collections/group-inquiries.ts` - CMS collection for inquiry tracking
- `packages/cms/globals/site-settings.ts` - Payload global for WhatsApp number

### Modify
- `apps/web/app/[locale]/layout.tsx` - Add WhatsApp button (fetch number from Payload globals)
- `apps/web/components/booking/booking-section.tsx` - Add "Request Group Quote" CTA
- `packages/cms/payload.config.ts` - Register SiteSettings global + GroupInquiries collection
- `messages/*.json` - Form + WhatsApp translations (SV/EN/DE)

## Implementation Steps

1. **Configure Bokun Group Pricing (Dashboard)**
   - In Bokun dashboard, configure pricing categories per tour product
   - Set `minPerBooking` and `maxPerBooking` for group rate tiers
   - Test that Bokun widget respects these rate limits for direct group bookings

2. **Create Group Inquiry Form**
   ```typescript
   // apps/web/components/booking/group-inquiry-form.tsx
   'use client'

   import { useState } from 'react'
   import { useForm } from 'react-hook-form'
   import { zodResolver } from '@hookform/resolvers/zod'
   import { z } from 'zod'
   import { useTranslations } from 'next-intl'
   import { Button } from '@/components/ui/button'
   import { Input } from '@/components/ui/input'
   import { Textarea } from '@/components/ui/textarea'
   import { Label } from '@/components/ui/label'
   import { Alert, AlertDescription } from '@/components/ui/alert'
   import { Loader2, CheckCircle } from 'lucide-react'

   const inquirySchema = z.object({
     firstName: z.string().min(2),
     lastName: z.string().min(2),
     email: z.string().email(),
     phone: z.string().min(8),
     groupSize: z.number().min(20).max(200),
     preferredDates: z.string().min(5),
     tourInterest: z.string().optional(),
     specialRequirements: z.string().optional(),
     honeypot: z.string().max(0) // Spam protection
   })

   type InquiryFormData = z.infer<typeof inquirySchema>

   export function GroupInquiryForm() {
     const t = useTranslations('groupBooking')
     const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
     const [errorMessage, setErrorMessage] = useState('')

     const {
       register,
       handleSubmit,
       formState: { errors },
       reset
     } = useForm<InquiryFormData>({
       resolver: zodResolver(inquirySchema)
     })

     const onSubmit = async (data: InquiryFormData) => {
       setStatus('loading')
       setErrorMessage('')

       try {
         const response = await fetch('/api/group-inquiry', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(data)
         })

         if (!response.ok) {
           throw new Error('Submission failed')
         }

         setStatus('success')
         reset()
       } catch (error) {
         setStatus('error')
         setErrorMessage(t('form.errorMessage'))
       }
     }

     if (status === 'success') {
       return (
         <Alert className="border-green-500 bg-green-50">
           <CheckCircle className="h-5 w-5 text-green-600" />
           <AlertDescription>
             <p className="font-semibold">{t('form.successTitle')}</p>
             <p>{t('form.successMessage')}</p>
           </AlertDescription>
         </Alert>
       )
     }

     return (
       <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
         {/* Honeypot field - hidden from users */}
         <input type="text" {...register('honeypot')} className="hidden" tabIndex={-1} />

         <div className="grid gap-4 sm:grid-cols-2">
           <div>
             <Label htmlFor="firstName">{t('form.firstName')} *</Label>
             <Input id="firstName" {...register('firstName')} />
             {errors.firstName && (
               <p className="mt-1 text-sm text-destructive">{t('form.required')}</p>
             )}
           </div>
           <div>
             <Label htmlFor="lastName">{t('form.lastName')} *</Label>
             <Input id="lastName" {...register('lastName')} />
             {errors.lastName && (
               <p className="mt-1 text-sm text-destructive">{t('form.required')}</p>
             )}
           </div>
         </div>

         <div className="grid gap-4 sm:grid-cols-2">
           <div>
             <Label htmlFor="email">{t('form.email')} *</Label>
             <Input id="email" type="email" {...register('email')} />
             {errors.email && (
               <p className="mt-1 text-sm text-destructive">{t('form.invalidEmail')}</p>
             )}
           </div>
           <div>
             <Label htmlFor="phone">{t('form.phone')} *</Label>
             <Input id="phone" type="tel" {...register('phone')} />
             {errors.phone && (
               <p className="mt-1 text-sm text-destructive">{t('form.required')}</p>
             )}
           </div>
         </div>

         <div className="grid gap-4 sm:grid-cols-2">
           <div>
             <Label htmlFor="groupSize">{t('form.groupSize')} *</Label>
             <Input
               id="groupSize"
               type="number"
               min={20}
               max={200}
               {...register('groupSize', { valueAsNumber: true })}
             />
             {errors.groupSize && (
               <p className="mt-1 text-sm text-destructive">{t('form.minGroupSize')}</p>
             )}
           </div>
           <div>
             <Label htmlFor="preferredDates">{t('form.preferredDates')} *</Label>
             <Input
               id="preferredDates"
               placeholder={t('form.datesPlaceholder')}
               {...register('preferredDates')}
             />
           </div>
         </div>

         <div>
           <Label htmlFor="tourInterest">{t('form.tourInterest')}</Label>
           <Input
             id="tourInterest"
             placeholder={t('form.tourPlaceholder')}
             {...register('tourInterest')}
           />
         </div>

         <div>
           <Label htmlFor="specialRequirements">{t('form.specialRequirements')}</Label>
           <Textarea
             id="specialRequirements"
             rows={4}
             placeholder={t('form.requirementsPlaceholder')}
             {...register('specialRequirements')}
           />
         </div>

         {status === 'error' && (
           <Alert variant="destructive">
             <AlertDescription>{errorMessage}</AlertDescription>
           </Alert>
         )}

         <Button type="submit" className="w-full" disabled={status === 'loading'}>
           {status === 'loading' ? (
             <>
               <Loader2 className="mr-2 h-4 w-4 animate-spin" />
               {t('form.submitting')}
             </>
           ) : (
             t('form.submit')
           )}
         </Button>
       </form>
     )
   }
   ```

3. **Create API Route Handler**
   ```typescript
   // apps/web/app/api/group-inquiry/route.ts
   import { NextRequest, NextResponse } from 'next/server'
   import { z } from 'zod'
   import { sendInquiryNotification } from '@/lib/email/send-inquiry-notification'
   import { sendInquiryConfirmation } from '@/lib/email/send-inquiry-confirmation'
   import { rateLimit } from '@/lib/rate-limit'

   const inquirySchema = z.object({
     firstName: z.string().min(2),
     lastName: z.string().min(2),
     email: z.string().email(),
     phone: z.string().min(8),
     groupSize: z.number().min(20).max(200),
     preferredDates: z.string().min(5),
     tourInterest: z.string().optional(),
     specialRequirements: z.string().optional(),
     honeypot: z.string().max(0)
   })

   export async function POST(request: NextRequest) {
     // Rate limiting
     const ip = request.ip ?? '127.0.0.1'
     const { success } = await rateLimit.limit(ip)

     if (!success) {
       return NextResponse.json(
         { error: 'Too many requests' },
         { status: 429 }
       )
     }

     try {
       const body = await request.json()
       const data = inquirySchema.parse(body)

       // Check honeypot (spam protection)
       if (data.honeypot) {
         return NextResponse.json({ success: true }) // Fake success for bots
       }

       // Send admin notification (admin creates Bokun booking manually for large groups)
       await sendInquiryNotification({
         name: `${data.firstName} ${data.lastName}`,
         email: data.email,
         phone: data.phone,
         groupSize: data.groupSize,
         preferredDates: data.preferredDates,
         tourInterest: data.tourInterest,
         specialRequirements: data.specialRequirements
       })

       // Send customer confirmation
       await sendInquiryConfirmation({
         to: data.email,
         name: data.firstName,
         groupSize: data.groupSize
       })

       return NextResponse.json({ success: true })
     } catch (error) {
       if (error instanceof z.ZodError) {
         return NextResponse.json(
           { error: 'Validation failed', details: error.errors },
           { status: 400 }
         )
       }

       console.error('Group inquiry error:', error)
       return NextResponse.json(
         { error: 'Internal server error' },
         { status: 500 }
       )
     }
   }
   ```

4. **Create Email Services (Nodemailer + Gmail SMTP)**
   ```typescript
   // apps/web/lib/email/send-inquiry-notification.ts
   import { createTransport } from 'nodemailer'

   const transporter = createTransport({
     service: 'gmail',
     auth: {
       user: process.env.GMAIL_USER,
       pass: process.env.GMAIL_APP_PASSWORD, // Google Workspace app password
     },
   })

   interface InquiryData {
     name: string
     email: string
     phone: string
     groupSize: number
     preferredDates: string
     tourInterest?: string
     specialRequirements?: string
   }

   export async function sendInquiryNotification(data: InquiryData) {
     await transporter.sendMail({
       from: `HeritageGuiding <${process.env.GMAIL_USER}>`,
       to: process.env.ADMIN_EMAIL!,
       subject: `New Group Inquiry: ${data.groupSize} people`,
       html: `
         <h2>New Group Booking Inquiry</h2>
         <p><strong>Name:</strong> ${data.name}</p>
         <p><strong>Email:</strong> ${data.email}</p>
         <p><strong>Phone:</strong> ${data.phone}</p>
         <p><strong>Group Size:</strong> ${data.groupSize}</p>
         <p><strong>Preferred Dates:</strong> ${data.preferredDates}</p>
         ${data.tourInterest ? `<p><strong>Tour Interest:</strong> ${data.tourInterest}</p>` : ''}
         ${data.specialRequirements ? `<p><strong>Special Requirements:</strong> ${data.specialRequirements}</p>` : ''}
         <hr/>
         <p><em>Next step: Create a custom quote and booking in Bokun dashboard for this group.</em></p>
       `
     })
   }

   // apps/web/lib/email/send-inquiry-confirmation.ts
   export async function sendInquiryConfirmation({ to, name, groupSize }) {
     await transporter.sendMail({
       from: `HeritageGuiding <${process.env.GMAIL_USER}>`,
       to,
       subject: 'We received your group booking inquiry',
       html: `
         <h2>Thank you, ${name}!</h2>
         <p>We've received your inquiry for a group of ${groupSize} people.</p>
         <p>Our team will review your request and contact you within 24 hours with a custom quote.</p>
         <p>Best regards,<br>HeritageGuiding Team</p>
       `
     })
   }
   ```

5. **Create WhatsApp Button (using @digicroz/react-floating-whatsapp)**
   ```typescript
   // apps/web/components/shared/whatsapp-button.tsx
   'use client'

   import dynamic from 'next/dynamic'
   import { useLocale, useTranslations } from 'next-intl'

   // Dynamic import to avoid SSR issues with the package
   const FloatingWhatsApp = dynamic(
     () => import('@digicroz/react-floating-whatsapp').then(mod => mod.FloatingWhatsApp),
     { ssr: false }
   )

   interface WhatsAppButtonProps {
     phoneNumber: string // From Payload CMS globals
   }

   const LOCALIZED_MESSAGES: Record<string, string> = {
     sv: 'Hej! Hur kan vi hjälpa dig med din turbokning?',
     en: 'Hello! How can we help you with your tour booking?',
     de: 'Hallo! Wie können wir Ihnen bei Ihrer Tourbuchung helfen?'
   }

   export function WhatsAppButton({ phoneNumber }: WhatsAppButtonProps) {
     const locale = useLocale()
     const t = useTranslations('whatsapp')

     if (!phoneNumber) return null

     return (
       <FloatingWhatsApp
         phoneNumber={phoneNumber}
         accountName="HeritageGuiding"
         statusMessage={t('statusMessage')}
         chatMessage={LOCALIZED_MESSAGES[locale] || LOCALIZED_MESSAGES.en}
         placeholder={t('placeholder')}
         allowEsc
         notification
         notificationDelay={30}
       />
     )
   }
   ```

   **Also create Payload global for site settings:**
   ```typescript
   // packages/cms/globals/site-settings.ts
   import type { GlobalConfig } from 'payload'

   export const SiteSettings: GlobalConfig = {
     slug: 'site-settings',
     label: 'Site Settings',
     access: { read: () => true },
     fields: [
       {
         name: 'whatsappNumber',
         type: 'text',
         label: 'WhatsApp Phone Number',
         admin: { description: 'International format without + (e.g., 46701234567)' },
       },
     ],
   }
   ```

6. **Create Group Inquiry Page**
   ```typescript
   // apps/web/app/[locale]/group-booking/page.tsx
   import { getTranslations } from 'next-intl/server'
   import { GroupInquiryForm } from '@/components/booking/group-inquiry-form'

   export default async function GroupBookingPage() {
     const t = await getTranslations('groupBooking')

     return (
       <main className="container py-12">
         <div className="mx-auto max-w-2xl">
           <h1 className="text-3xl font-bold">{t('title')}</h1>
           <p className="mt-2 text-muted-foreground">
             {t('description')}
           </p>
           <div className="mt-8">
             <GroupInquiryForm />
           </div>
         </div>
       </main>
     )
   }

   export async function generateMetadata({ params: { locale } }) {
     const t = await getTranslations({ locale, namespace: 'groupBooking' })
     return {
       title: t('meta.title'),
       description: t('meta.description')
     }
   }
   ```

7. **Add WhatsApp to Layout**
   ```typescript
   // apps/web/app/[locale]/layout.tsx
   import { WhatsAppButton } from '@/components/shared/whatsapp-button'

   export default function LocaleLayout({ children }) {
     return (
       <html>
         <body>
           {children}
           <WhatsAppButton />
         </body>
       </html>
     )
   }
   ```

8. **Add Translation Strings**
   ```json
   // messages/en.json (add to existing)
   {
     "groupBooking": {
       "title": "Group Booking Inquiry",
       "description": "For groups of 20 or more, please fill out this form and we'll create a custom quote for your group.",
       "meta": {
         "title": "Group Tours - HeritageGuiding",
         "description": "Book a private group tour in Stockholm"
       },
       "form": {
         "firstName": "First Name",
         "lastName": "Last Name",
         "email": "Email",
         "phone": "Phone",
         "groupSize": "Group Size",
         "preferredDates": "Preferred Dates",
         "datesPlaceholder": "e.g., June 15-20, 2026",
         "tourInterest": "Tours of Interest",
         "tourPlaceholder": "e.g., Historical Stockholm, Royal Palace",
         "specialRequirements": "Special Requirements",
         "requirementsPlaceholder": "Accessibility needs, dietary restrictions, etc.",
         "submit": "Submit Inquiry",
         "submitting": "Sending...",
         "required": "This field is required",
         "invalidEmail": "Please enter a valid email",
         "minGroupSize": "Minimum group size is 20",
         "successTitle": "Inquiry Sent!",
         "successMessage": "We'll contact you within 24 hours with a custom quote.",
         "errorMessage": "Something went wrong. Please try again."
       }
     },
     "whatsapp": {
       "prompt": "Questions? Chat with us on WhatsApp!",
       "chatOnWhatsApp": "Chat on WhatsApp",
       "dismiss": "Dismiss"
     }
   }
   ```

9. **Create Modal Version (for Tour Detail page)**
   ```typescript
   // apps/web/components/booking/group-inquiry-modal.tsx
   'use client'

   import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
   import { Button } from '@/components/ui/button'
   import { GroupInquiryForm } from './group-inquiry-form'
   import { useTranslations } from 'next-intl'

   export function GroupInquiryModal() {
     const t = useTranslations('groupBooking')

     return (
       <Dialog>
         <DialogTrigger asChild>
           <Button variant="outline">{t('modalTrigger')}</Button>
         </DialogTrigger>
         <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
           <h2 className="text-2xl font-bold">{t('title')}</h2>
           <p className="text-sm text-muted-foreground">{t('modalDescription')}</p>
           <GroupInquiryForm />
         </DialogContent>
       </Dialog>
     )
   }
   ```

## Todo List

- [ ] Configure Bokun group pricing rates in dashboard (minPerBooking/maxPerBooking)
- [ ] Verify Bokun widget handles group bookings up to configured max
- [ ] Create GroupInquiryForm component (min group size: 20)
- [ ] Add form validation with Zod
- [ ] Create API route for form submission
- [ ] Implement honeypot spam protection
- [ ] Add rate limiting to API
- [ ] Create admin notification email (with Bokun follow-up instructions)
- [ ] Create customer confirmation email
- [ ] Build GroupBookingPage
- [ ] Add "Request Group Quote" button to tour detail booking section
- [ ] Create WhatsAppButton component (custom, wa.me deep links)
- [ ] Add WhatsApp to layout with localStorage dismiss persistence
- [ ] Localize WhatsApp messages (SV/EN/DE)
- [ ] Add all translations (SV/EN/DE)
- [ ] Test form accessibility
- [ ] Test email delivery
- [ ] Mobile test WhatsApp button (native app opens)
- [ ] Desktop test WhatsApp button (WhatsApp Web opens)

## Success Criteria

- [ ] Bokun widget accepts group bookings up to configured maxPerBooking
- [ ] Inquiry form submits and validates correctly (groups 20+)
- [ ] Admin receives notification email with Bokun follow-up instructions
- [ ] Customer receives confirmation email
- [ ] Spam protection blocks bots
- [ ] WhatsApp button opens with localized pre-filled message
- [ ] WhatsApp dismiss state persists via localStorage
- [ ] Button dismissable on mobile
- [ ] All forms keyboard accessible
- [ ] Works across SV/EN/DE locales

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Email delivery fails | Medium | High | Nodemailer + Gmail SMTP (Google Workspace), add retry logic |
| Spam submissions | High | Medium | Honeypot + rate limiting |
| WhatsApp blocked in region | Low | Low | Fallback to email/phone link |
| Bokun widget max capacity too low | Medium | Medium | Adjust maxPerBooking in Bokun dashboard; use inquiry form as fallback |
| Bokun group rate misconfiguration | Medium | Medium | Document setup steps; test with real bookings in staging |
| wa.me link not working on some devices | Low | Low | Test across iOS/Android/desktop browsers |

## Security Considerations

- Never expose admin email to frontend
- Validate all form inputs server-side (Zod)
- Rate limit form submissions per IP
- Sanitize email content (prevent injection)
- Use honeypot field for spam
- WhatsApp number managed via Payload CMS globals (not hardcoded)
- Gmail app password stored securely in env var (`GMAIL_APP_PASSWORD`)

## Next Steps

After completion:
1. Proceed to [Phase 10: Accessibility + SEO](./phase-10-accessibility-seo.md)
2. WCAG 2.1 AA audit
3. Schema.org implementation

---

## Validation Summary

**Validated:** 2026-02-11
**Questions asked:** 6

### Confirmed Decisions

| Decision | User Choice |
|----------|-------------|
| **Group Size Threshold** | 20+ uses inquiry form; groups <20 book via Bokun widget |
| **Inquiry Storage** | Both: Payload CMS collection (GroupInquiries) + email notification |
| **Form Placement** | Both: modal on tour detail page + standalone /group-booking page |
| **WhatsApp Implementation** | Use `@digicroz/react-floating-whatsapp` npm package (not custom) |
| **Email Provider** | Nodemailer + Gmail SMTP via Google Workspace (not Resend) |
| **WhatsApp Number Config** | CMS-managed via Payload globals (not env var) |

### Action Items

- [ ] **Update email service**: Replace Resend with Nodemailer + Gmail SMTP (Google Workspace domain email)
- [ ] **Update WhatsApp button**: Use `@digicroz/react-floating-whatsapp` package instead of custom component
- [ ] **Add Payload global**: Create site-settings global with WhatsApp number field (CMS-managed)
- [ ] **Add env vars**: `GMAIL_USER`, `GMAIL_APP_PASSWORD` for SMTP auth
