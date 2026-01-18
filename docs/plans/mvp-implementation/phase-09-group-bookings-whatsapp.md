# Phase 09: Group Bookings + WhatsApp

## Context Links

- [MVP Project Plan](../../docs/MVP-PROJECT-PLAN.md)
- [Tour Details](./phase-07-tour-details.md)
- [Rezdy Integration](./phase-08-rezdy-integration.md)

## Overview

| Priority | Status | Effort |
|----------|--------|--------|
| P2 - High | pending | 20-24h |

Build group booking inquiry form for parties of 10+ with validation, email notifications, and admin interface. Add WhatsApp click-to-chat floating button with localized messages.

## Key Insights

- Groups 10+ cannot book directly via Rezdy widget
- Inquiry form captures: contact info, group size, preferred dates, special requirements
- Email notifications to admin + confirmation to customer
- WhatsApp deep links with pre-filled localized messages

## Requirements

### Functional - Group Bookings
- Inquiry form with validation (name, email, phone, group size, dates)
- Special requirements textarea (accessibility, dietary, etc.)
- Email to admin with inquiry details
- Confirmation email to customer
- Admin interface to view/respond to inquiries

### Functional - WhatsApp
- Floating button (bottom-right, above fold on mobile)
- Click opens WhatsApp with pre-filled message
- Message localized per current language
- Dismissable/minimizable

### Non-Functional
- Form accessible (keyboard, screen reader)
- Spam protection (honeypot + rate limit)
- Mobile-friendly form layout
- WhatsApp button doesn't block content

## Architecture

### Group Booking Flow

```
User clicks "Group Inquiry"
       ↓
Modal/page with inquiry form
       ↓
Form validation (client + server)
       ↓
Submit to API route
       ↓
Save to database (optional)
       ↓
Send admin notification email
       ↓
Send customer confirmation email
       ↓
Display success message
```

### WhatsApp Integration

```
Floating Button (bottom-right)
       ↓
Click → WhatsApp deep link
       ↓
https://wa.me/46XXXXXXXXX?text={localized_message}
       ↓
Opens WhatsApp with pre-filled message
```

## Related Code Files

### Create
- `apps/web/app/[locale]/group-booking/page.tsx` - Inquiry page
- `apps/web/components/booking/group-inquiry-form.tsx` - Form
- `apps/web/components/booking/group-inquiry-modal.tsx` - Modal version
- `apps/web/app/api/group-inquiry/route.ts` - Form handler
- `apps/web/lib/email/send-inquiry-notification.ts` - Admin email
- `apps/web/lib/email/send-inquiry-confirmation.ts` - Customer email
- `apps/web/components/shared/whatsapp-button.tsx` - WhatsApp FAB
- `packages/cms/collections/group-inquiries.ts` - CMS collection (optional)

### Modify
- `apps/web/app/[locale]/layout.tsx` - Add WhatsApp button
- `messages/*.json` - Form + WhatsApp translations

## Implementation Steps

1. **Create Group Inquiry Form**
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
     groupSize: z.number().min(10).max(100),
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
               min={10}
               max={100}
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

2. **Create API Route Handler**
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
     groupSize: z.number().min(10).max(100),
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

       // Send admin notification
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

3. **Create Email Services**
   ```typescript
   // apps/web/lib/email/send-inquiry-notification.ts
   import { Resend } from 'resend'

   const resend = new Resend(process.env.RESEND_API_KEY)

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
     await resend.emails.send({
       from: 'HeritageGuiding <noreply@heritageguiding.com>',
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
       `
     })
   }

   // apps/web/lib/email/send-inquiry-confirmation.ts
   export async function sendInquiryConfirmation({ to, name, groupSize }) {
     await resend.emails.send({
       from: 'HeritageGuiding <noreply@heritageguiding.com>',
       to,
       subject: 'We received your group booking inquiry',
       html: `
         <h2>Thank you, ${name}!</h2>
         <p>We've received your inquiry for a group of ${groupSize} people.</p>
         <p>Our team will contact you within 24 hours to discuss your tour options.</p>
         <p>Best regards,<br>HeritageGuiding Team</p>
       `
     })
   }
   ```

4. **Create WhatsApp Button**
   ```typescript
   // apps/web/components/shared/whatsapp-button.tsx
   'use client'

   import { useState } from 'react'
   import { useLocale, useTranslations } from 'next-intl'
   import { Button } from '@/components/ui/button'
   import { MessageCircle, X } from 'lucide-react'

   const WHATSAPP_NUMBER = '46XXXXXXXXX' // Replace with actual number

   export function WhatsAppButton() {
     const [dismissed, setDismissed] = useState(false)
     const locale = useLocale()
     const t = useTranslations('whatsapp')

     const messages = {
       sv: 'Hej! Jag har en fråga om era turer.',
       en: 'Hello! I have a question about your tours.',
       de: 'Hallo! Ich habe eine Frage zu Ihren Touren.'
     }

     const message = encodeURIComponent(messages[locale] || messages.en)
     const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`

     if (dismissed) return null

     return (
       <div className="fixed bottom-6 right-6 z-50 flex items-end gap-2">
         <div className="max-w-xs rounded-lg bg-white p-3 shadow-lg">
           <p className="text-sm">{t('prompt')}</p>
         </div>
         <div className="flex flex-col gap-2">
           <Button
             size="icon"
             variant="ghost"
             className="h-6 w-6 self-end"
             onClick={() => setDismissed(true)}
             aria-label={t('dismiss')}
           >
             <X className="h-4 w-4" />
           </Button>
           <Button
             asChild
             size="lg"
             className="rounded-full bg-green-500 hover:bg-green-600"
           >
             <a
               href={whatsappUrl}
               target="_blank"
               rel="noopener noreferrer"
               aria-label={t('chatOnWhatsApp')}
             >
               <MessageCircle className="h-6 w-6" />
             </a>
           </Button>
         </div>
       </div>
     )
   }
   ```

5. **Create Group Inquiry Page**
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

6. **Add WhatsApp to Layout**
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

7. **Add Translation Strings**
   ```json
   // messages/en.json
   {
     "groupBooking": {
       "title": "Group Booking Inquiry",
       "description": "For groups of 10 or more, please fill out this form and we'll create a custom experience for you.",
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
         "minGroupSize": "Minimum group size is 10",
         "successTitle": "Inquiry Sent!",
         "successMessage": "We'll contact you within 24 hours.",
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

8. **Create Modal Version (optional)**
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
         <DialogContent className="max-w-2xl">
           <h2 className="text-2xl font-bold">{t('title')}</h2>
           <GroupInquiryForm />
         </DialogContent>
       </Dialog>
     )
   }
   ```

## Todo List

- [ ] Create GroupInquiryForm component
- [ ] Add form validation with Zod
- [ ] Create API route for form submission
- [ ] Implement honeypot spam protection
- [ ] Add rate limiting to API
- [ ] Create admin notification email
- [ ] Create customer confirmation email
- [ ] Build GroupBookingPage
- [ ] Create WhatsAppButton component
- [ ] Add WhatsApp to layout
- [ ] Localize WhatsApp messages
- [ ] Add all translations (SV/EN/DE)
- [ ] Test form accessibility
- [ ] Test email delivery
- [ ] Mobile test WhatsApp button

## Success Criteria

- [ ] Form submits and validates correctly
- [ ] Admin receives notification email
- [ ] Customer receives confirmation email
- [ ] Spam protection blocks bots
- [ ] WhatsApp button opens with pre-filled message
- [ ] WhatsApp message localized per language
- [ ] Button dismissable on mobile
- [ ] All forms keyboard accessible

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Email delivery fails | Medium | High | Use reliable provider (Resend) |
| Spam submissions | High | Medium | Honeypot + rate limiting |
| WhatsApp blocked | Low | Low | Fallback to email/phone |

## Security Considerations

- Never expose admin email to frontend
- Validate all form inputs server-side
- Rate limit form submissions
- Sanitize email content (prevent injection)
- Use honeypot field for spam

## Next Steps

After completion:
1. Proceed to [Phase 10: Accessibility + SEO](./phase-10-accessibility-seo.md)
2. WCAG 2.1 AA audit
3. Schema.org implementation
