import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { sendInquiryNotificationToAdmin } from '@/lib/email/send-inquiry-notification-to-admin'
import { sendInquiryConfirmationToCustomer } from '@/lib/email/send-inquiry-confirmation-to-customer'
import { checkRateLimit } from '@/lib/rate-limit-by-ip'

const groupInquirySchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(8),
  groupSize: z.number().min(20).max(200),
  preferredDates: z.string().min(5),
  tourInterest: z.string().optional(),
  specialRequirements: z.string().optional(),
  honeypot: z.string().optional().default(''), // Checked post-validation for spam
})

export type GroupInquiryPayload = z.infer<typeof groupInquirySchema>

export async function POST(request: NextRequest) {
  // Rate limiting by IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
  const { success } = checkRateLimit(ip)

  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const body = await request.json()
    const data = groupInquirySchema.parse(body)

    // Honeypot triggered = bot submission, return fake success
    if (data.honeypot) {
      return NextResponse.json({ success: true })
    }

    const fullName = `${data.firstName} ${data.lastName}`

    // Send emails in parallel
    await Promise.all([
      sendInquiryNotificationToAdmin({
        name: fullName,
        email: data.email,
        phone: data.phone,
        groupSize: data.groupSize,
        preferredDates: data.preferredDates,
        tourInterest: data.tourInterest,
        specialRequirements: data.specialRequirements,
      }),
      sendInquiryConfirmationToCustomer({
        to: data.email,
        name: data.firstName,
        groupSize: data.groupSize,
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Group inquiry error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
