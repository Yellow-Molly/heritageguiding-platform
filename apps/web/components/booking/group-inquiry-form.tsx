'use client'

import { useState, type FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input, Textarea } from '@/components/ui/input'
import { Loader2, CheckCircle } from 'lucide-react'

type FormStatus = 'idle' | 'loading' | 'success' | 'error'

interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  groupSize: string
  preferredDates: string
  tourInterest: string
  specialRequirements: string
  honeypot: string
}

const INITIAL_FORM: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  groupSize: '',
  preferredDates: '',
  tourInterest: '',
  specialRequirements: '',
  honeypot: '',
}

/**
 * Group booking inquiry form for groups of 9+ people.
 * Validates client-side, submits to /api/group-inquiry.
 * Includes honeypot field for spam protection.
 */
export function GroupInquiryForm({ tourName }: { tourName?: string }) {
  const t = useTranslations('groupBooking')
  const [form, setForm] = useState<FormData>({
    ...INITIAL_FORM,
    tourInterest: tourName ?? '',
  })
  const [status, setStatus] = useState<FormStatus>('idle')
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})

  function validate(): boolean {
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    if (form.firstName.length < 2) newErrors.firstName = t('form.required')
    if (form.lastName.length < 2) newErrors.lastName = t('form.required')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = t('form.invalidEmail')
    if (form.phone.length < 8) newErrors.phone = t('form.required')
    const size = Number(form.groupSize)
    if (!size || size < 9 || size > 200) newErrors.groupSize = t('form.minGroupSize')
    if (form.preferredDates.length < 5) newErrors.preferredDates = t('form.required')
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setStatus('loading')
    try {
      const response = await fetch('/api/group-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          groupSize: Number(form.groupSize),
        }),
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
      <div className="rounded-lg border border-green-300 bg-green-50 p-6 text-center">
        <CheckCircle className="mx-auto mb-3 h-8 w-8 text-green-600" />
        <p className="text-lg font-semibold text-green-800">{t('form.successTitle')}</p>
        <p className="mt-1 text-green-700">{t('form.successMessage')}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="giq-firstName" className="mb-1 block text-sm font-medium">
            {t('form.firstName')} *
          </label>
          <Input
            id="giq-firstName"
            value={form.firstName}
            onChange={(e) => updateField('firstName', e.target.value)}
            error={!!errors.firstName}
            required
          />
          {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>}
        </div>
        <div>
          <label htmlFor="giq-lastName" className="mb-1 block text-sm font-medium">
            {t('form.lastName')} *
          </label>
          <Input
            id="giq-lastName"
            value={form.lastName}
            onChange={(e) => updateField('lastName', e.target.value)}
            error={!!errors.lastName}
            required
          />
          {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="giq-email" className="mb-1 block text-sm font-medium">
            {t('form.email')} *
          </label>
          <Input
            id="giq-email"
            type="email"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
            error={!!errors.email}
            required
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>
        <div>
          <label htmlFor="giq-phone" className="mb-1 block text-sm font-medium">
            {t('form.phone')} *
          </label>
          <Input
            id="giq-phone"
            type="tel"
            value={form.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            error={!!errors.phone}
            required
          />
          {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="giq-groupSize" className="mb-1 block text-sm font-medium">
            {t('form.groupSize')} *
          </label>
          <Input
            id="giq-groupSize"
            type="number"
            min={9}
            max={200}
            value={form.groupSize}
            onChange={(e) => updateField('groupSize', e.target.value)}
            error={!!errors.groupSize}
            required
          />
          {errors.groupSize && <p className="mt-1 text-sm text-red-600">{errors.groupSize}</p>}
        </div>
        <div>
          <label htmlFor="giq-dates" className="mb-1 block text-sm font-medium">
            {t('form.preferredDates')} *
          </label>
          <Input
            id="giq-dates"
            placeholder={t('form.datesPlaceholder')}
            value={form.preferredDates}
            onChange={(e) => updateField('preferredDates', e.target.value)}
            error={!!errors.preferredDates}
            required
          />
          {errors.preferredDates && (
            <p className="mt-1 text-sm text-red-600">{errors.preferredDates}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="giq-tourInterest" className="mb-1 block text-sm font-medium">
          {t('form.tourInterest')}
        </label>
        <Input
          id="giq-tourInterest"
          placeholder={t('form.tourPlaceholder')}
          value={form.tourInterest}
          onChange={(e) => updateField('tourInterest', e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="giq-requirements" className="mb-1 block text-sm font-medium">
          {t('form.specialRequirements')}
        </label>
        <Textarea
          id="giq-requirements"
          rows={4}
          placeholder={t('form.requirementsPlaceholder')}
          value={form.specialRequirements}
          onChange={(e) => updateField('specialRequirements', e.target.value)}
        />
      </div>

      {status === 'error' && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {t('form.errorMessage')}
        </div>
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
