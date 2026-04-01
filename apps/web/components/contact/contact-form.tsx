'use client'

import { useState, useEffect, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle } from 'lucide-react'

type FormStatus = 'idle' | 'loading' | 'success' | 'error'

interface FormData {
  fullName: string
  email: string
  phone: string
  subject: string
  message: string
  honeypot: string
}

const INITIAL_FORM: FormData = {
  fullName: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
  honeypot: '',
}

const SUBJECT_VALUES = ['general', 'tour_booking', 'group_inquiry', 'partnership', 'other'] as const

/** Map URL query param values to form subject values */
const SUBJECT_PARAM_MAP: Record<string, string> = {
  general: 'general',
  tour_booking: 'tour_booking',
  'tour-booking': 'tour_booking',
  group_inquiry: 'group_inquiry',
  'group-inquiry': 'group_inquiry',
  partnership: 'partnership',
  other: 'other',
}

/**
 * Contact form with client-side validation, honeypot spam protection,
 * and URL query param support for pre-selecting subject.
 */
export function ContactForm() {
  const t = useTranslations('contact')
  const searchParams = useSearchParams()
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [status, setStatus] = useState<FormStatus>('idle')
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  // Pre-select subject from URL query param (e.g. ?subject=partnership)
  useEffect(() => {
    const subjectParam = searchParams.get('subject')
    if (subjectParam) {
      const mapped = SUBJECT_PARAM_MAP[subjectParam.toLowerCase()]
      if (mapped) {
        setForm((prev) => ({ ...prev, subject: mapped }))
      }
    }
  }, [searchParams])

  function validate(): boolean {
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    if (form.fullName.trim().length < 2) newErrors.fullName = t('form.required')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = t('form.invalidEmail')
    if (!form.subject) newErrors.subject = t('form.required')
    if (form.message.trim().length < 10) newErrors.message = t('form.messageTooShort')
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setStatus('loading')
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!response.ok) throw new Error('Submission failed')
      setStatus('success')
      setForm(INITIAL_FORM)
    } catch {
      setStatus('error')
    }
  }

  function updateField(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  if (status === 'success') {
    return (
      <div className="rounded-3xl bg-white p-10 text-center shadow-[0_4px_24px_rgba(0,0,0,0.05)]">
        <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
        <h3 className="font-serif !text-2xl font-bold text-[#1E3A5F]">
          {t('form.successTitle')}
        </h3>
        <p className="mt-2 text-[#6B7280]">{t('form.successMessage')}</p>
      </div>
    )
  }

  return (
    <div className="rounded-3xl bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.05)] md:p-10">
      <h2 className="mb-6 font-serif !text-2xl font-bold text-[#1E3A5F] md:!text-[28px]">
        {t('form.title')}
      </h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        {/* Honeypot - hidden from users, catches bots */}
        <input
          type="text"
          name="website"
          value={form.honeypot}
          onChange={(e) => updateField('honeypot', e.target.value)}
          className="hidden"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />

        {/* Full Name */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cf-fullName" className="text-sm font-medium text-[#2D3748]">
            {t('form.fullName')} *
          </label>
          <input
            id="cf-fullName"
            type="text"
            value={form.fullName}
            onChange={(e) => updateField('fullName', e.target.value)}
            placeholder={t('form.fullNamePlaceholder')}
            className="h-12 rounded-full border border-gray-200 px-5 text-sm text-[#2D3748] placeholder:text-[#9CA3AF] focus:border-[#1E3A5F] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20"
            required
          />
          {errors.fullName && <span className="text-sm text-red-500">{errors.fullName}</span>}
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cf-email" className="text-sm font-medium text-[#2D3748]">
            {t('form.email')} *
          </label>
          <input
            id="cf-email"
            type="email"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            placeholder={t('form.emailPlaceholder')}
            className="h-12 rounded-full border border-gray-200 px-5 text-sm text-[#2D3748] placeholder:text-[#9CA3AF] focus:border-[#1E3A5F] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20"
            required
          />
          {errors.email && <span className="text-sm text-red-500">{errors.email}</span>}
        </div>

        {/* Phone */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cf-phone" className="text-sm font-medium text-[#2D3748]">
            {t('form.phone')} <span className="text-[#9CA3AF]">{t('form.phoneOptional')}</span>
          </label>
          <input
            id="cf-phone"
            type="tel"
            value={form.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            placeholder={t('form.phonePlaceholder')}
            className="h-12 rounded-full border border-gray-200 px-5 text-sm text-[#2D3748] placeholder:text-[#9CA3AF] focus:border-[#1E3A5F] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20"
          />
        </div>

        {/* Subject */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cf-subject" className="text-sm font-medium text-[#2D3748]">
            {t('form.subject')} *
          </label>
          <select
            id="cf-subject"
            value={form.subject}
            onChange={(e) => updateField('subject', e.target.value)}
            className="h-12 appearance-none rounded-full border border-gray-200 bg-white px-5 pr-10 text-sm text-[#2D3748] focus:border-[#1E3A5F] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20"
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%239CA3AF\' stroke-width=\'2\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center' }}
            required
          >
            <option value="" disabled>{t('form.subjectPlaceholder')}</option>
            {SUBJECT_VALUES.map((value) => {
              const labelKey = value === 'tour_booking' ? 'tourBooking'
                : value === 'group_inquiry' ? 'groupInquiry'
                : value
              return (
                <option key={value} value={value}>
                  {t(`form.subjectOptions.${labelKey}`)}
                </option>
              )
            })}
          </select>
          {errors.subject && <span className="text-sm text-red-500">{errors.subject}</span>}
        </div>

        {/* Message */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cf-message" className="text-sm font-medium text-[#2D3748]">
            {t('form.message')} *
          </label>
          <textarea
            id="cf-message"
            value={form.message}
            onChange={(e) => updateField('message', e.target.value)}
            placeholder={t('form.messagePlaceholder')}
            rows={5}
            className="min-h-[140px] rounded-2xl border border-gray-200 px-5 py-3 text-sm text-[#2D3748] placeholder:text-[#9CA3AF] focus:border-[#1E3A5F] focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 resize-y"
            required
          />
          {errors.message && <span className="text-sm text-red-500">{errors.message}</span>}
        </div>

        {/* Error alert */}
        {status === 'error' && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {t('form.errorMessage')}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={status === 'loading'}
          className="h-[52px] w-full rounded-full bg-[#E67E5A] text-base font-semibold text-white transition-colors hover:bg-[#d4694a] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === 'loading' ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('form.sending')}
            </span>
          ) : (
            t('form.submit')
          )}
        </button>
      </form>
    </div>
  )
}
