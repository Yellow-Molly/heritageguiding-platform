import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getPayload } from 'payload'
import config from '@cms/payload.config'
import { sendContactNotificationToAdmin } from '@/lib/email/send-contact-notification-to-admin'
import { sendContactConfirmationToCustomer } from '@/lib/email/send-contact-confirmation-to-customer'
import { checkRateLimit } from '@/lib/rate-limit-by-ip'
import * as Sentry from '@sentry/nextjs'

const contactSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().max(20).optional().or(z.literal('')),
  subject: z.enum(['general', 'tour_booking', 'group_inquiry', 'partnership', 'other']),
  message: z.string().min(10).max(2000),
  honeypot: z.string().optional().default(''),
})

export type ContactPayload = z.infer<typeof contactSchema>

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
  const { success } = checkRateLimit(ip)

  if (!success) {
    return NextResponse.json(
      { success: false, message: 'Too many requests' },
      { status: 429 }
    )
  }

  try {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    const data = contactSchema.parse(body)

    // Honeypot triggered = bot submission, return fake success
    if (data.honeypot) {
      return NextResponse.json({ success: true })
    }

    // Save to CMS first — this is the critical persistence step
    const payload = await getPayload({ config })
    const inquiry = await payload.create({
      collection: 'contact-inquiries',
      data: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone || undefined,
        subject: data.subject,
        message: data.message,
        status: 'new',
        notificationSent: false,
      },
    })

    // Send notification + confirmation emails. Awaited so the work completes
    // within the request — on serverless the instance can suspend right after the
    // response is returned, dropping un-awaited promises (the original bug). The
    // inquiry is already persisted above, so a delivery failure is reported to
    // Sentry but does not fail the request or prompt the user to resend.
    try {
      await Promise.all([
        sendContactNotificationToAdmin({
          fullName: data.fullName,
          email: data.email,
          phone: data.phone || undefined,
          subject: data.subject,
          message: data.message,
        }),
        sendContactConfirmationToCustomer({
          to: data.email,
          name: data.fullName,
        }),
      ])
      await payload.update({
        collection: 'contact-inquiries',
        id: inquiry.id,
        data: { notificationSent: true },
      })
    } catch (err) {
      Sentry.captureException(err, {
        tags: { route: 'contact', inquiryId: String(inquiry.id) },
      })
    }

    return NextResponse.json({ success: true, message: 'Message sent successfully' })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          errors: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      )
    }

    console.error('Contact form error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
